import { OpenAIProvider } from "../providers/openai.ts";
import { buildSystemPrompt, trimConversationHistory } from "../prompts/system.ts";
import { log } from "../utils/logger.ts";
import type { AIRequest, ChatPayload } from "../types.ts";

const MAX_HISTORY_CHARS = 32000; // ~8k tokens

/**
 * Streaming chat handler - returns SSE response
 */
export async function handleChatStream(
  req: AIRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
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

  // Trim to token budget
  const trimmedMessages = trimConversationHistory(messages, MAX_HISTORY_CHARS);
  const allMessages = [
    { role: "system" as const, content: systemPrompt },
    ...trimmedMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  log.info("Chat stream start", {
    userId: req.userId,
    messageCount: messages.length,
    trimmedCount: trimmedMessages.length,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of provider.stream({
          messages: allMessages,
          maxTokens: 500,
        })) {
          // SSE format: data: {json}\n\n
          const data = JSON.stringify({ content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // Signal completion
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        log.info("Chat stream complete", { userId: req.userId });
      } catch (error) {
        log.error("Chat stream error", { userId: req.userId, error: String(error) });
        const errorData = JSON.stringify({ error: "Stream failed" });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
