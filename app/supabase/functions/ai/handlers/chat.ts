import { OpenAIProvider } from "../providers/openai.ts";
import { CHAT_TOOLS } from "../tools/definitions.ts";
import { executeTool } from "../tools/handlers.ts";
import { buildSystemPrompt, trimConversationHistory } from "../prompts/system.ts";
import { log } from "../utils/logger.ts";
import type { AIRequest, AIResponse, ChatPayload } from "../types.ts";

const MAX_HISTORY_CHARS = 32000; // ~8k tokens
const MAX_TOOL_ITERATIONS = 10;

/**
 * Non-streaming chat handler with tool support
 * Used as fallback when streaming isn't available
 */
export async function handleChat(req: AIRequest): Promise<AIResponse> {
  const { messages } = req.payload as ChatPayload;
  const provider = new OpenAIProvider();

  // Fetch user profile for context
  const { data: profile } = await req.supabase
    .from("users")
    .select("current_skill, stats, onboarding_data")
    .eq("id", req.userId)
    .single();

  // Build dynamic system prompt
  const systemPrompt = buildSystemPrompt(
    profile
      ? {
          current_skill: profile.current_skill || "00",
          stats: profile.stats || {},
          onboarding: profile.onboarding_data,
        }
      : null
  );

  // Trim conversation to token budget
  const trimmedMessages = trimConversationHistory(messages, MAX_HISTORY_CHARS);

  // Build message array
  const allMessages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  }> = [
    { role: "system", content: systemPrompt },
    ...trimmedMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Tool tracking
  let toolCallCount = 0;
  const toolsUsed: string[] = [];

  // Tool loop
  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await provider.completeWithTools({
      messages: allMessages,
      tools: CHAT_TOOLS,
      maxTokens: 500,
    });

    // No tool calls - return the content
    if (!response.tool_calls?.length) {
      log.info("Chat completed", {
        userId: req.userId,
        toolCallCount,
        toolsUsed,
        iterations: iteration + 1,
      });

      return {
        content: response.content || "I'm not sure how to help with that.",
      };
    }

    // Add assistant message with all tool calls first
    allMessages.push({
      role: "assistant",
      content: response.content || "",
      tool_calls: response.tool_calls.map((call) => ({
        id: call.id,
        type: "function" as const,
        function: {
          name: call.function.name,
          arguments: call.function.arguments,
        },
      })),
    });

    // Execute each tool and add results
    for (const call of response.tool_calls) {
      toolCallCount++;
      toolsUsed.push(call.function.name);

      let result: unknown;
      try {
        const args = JSON.parse(call.function.arguments);
        result = await executeTool(call.function.name, args, {
          userId: req.userId,
          supabase: req.supabase,
        });
      } catch (error) {
        log.error("Tool execution error", {
          tool: call.function.name,
          error: String(error),
        });
        result = { error: "Tool execution failed, Error:" + String(error) };
      }

      // Add tool result
      allMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Hit iteration limit
  log.warn("Chat hit tool loop limit", {
    userId: req.userId,
    toolCallCount,
    toolsUsed,
  });

  return {
    content: "I had trouble processing that request. Could you try rephrasing?",
  };
}
