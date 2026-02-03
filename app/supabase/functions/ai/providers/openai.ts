import OpenAI from "npm:openai@4";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "npm:openai@4/resources/chat/completions";
import { log } from "../utils/logger.ts";

export type CompletionOptions = {
  messages: ChatCompletionMessageParam[];
  maxTokens?: number;
  jsonMode?: boolean;
};

export type ToolCompletionOptions = CompletionOptions & {
  tools?: ChatCompletionTool[];
};

export type ToolCompletionResult = {
  content: string | null;
  tool_calls?: {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
};

export class OpenAIProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Standard completion (non-streaming)
   */
  async complete(options: CompletionOptions): Promise<string> {
    const { messages, maxTokens = 500, jsonMode = false } = options;

    log.debug("OpenAI request", { messageCount: messages.length, maxTokens, jsonMode });
    const start = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-5-mini",
        messages,
        response_format: jsonMode ? { type: "json_object" } : undefined,
      });

      const duration = Date.now() - start;
      const content = response.choices[0]?.message?.content ?? "";
      const usage = response.usage;

      log.debug("OpenAI response", {
        durationMs: duration,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      });

      return content;
    } catch (error) {
      const duration = Date.now() - start;
      log.error("OpenAI error", { durationMs: duration, error: String(error) });
      throw error;
    }
  }

  /**
   * Completion with tool calling support
   */
  async completeWithTools(options: ToolCompletionOptions): Promise<ToolCompletionResult> {
    const { messages, maxTokens = 500, tools } = options;

    log.debug("OpenAI tool request", {
      messageCount: messages.length,
      toolCount: tools?.length ?? 0,
    });
    const start = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-5-mini",
        messages,
        tools: tools?.length ? tools : undefined,
        tool_choice: tools?.length ? "auto" : undefined,
      });

      const duration = Date.now() - start;
      const message = response.choices[0]?.message;
      const usage = response.usage;

      log.debug("OpenAI tool response", {
        durationMs: duration,
        hasToolCalls: !!message?.tool_calls?.length,
        toolCallCount: message?.tool_calls?.length ?? 0,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      });

      return {
        content: message?.content ?? null,
        tool_calls: message?.tool_calls?.map((tc) => ({
          id: tc.id,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      };
    } catch (error) {
      const duration = Date.now() - start;
      log.error("OpenAI tool error", { durationMs: duration, error: String(error) });
      throw error;
    }
  }

  /**
   * Streaming completion - yields content chunks
   */
  async *stream(options: CompletionOptions): AsyncGenerator<string> {
    const { messages, maxTokens = 500 } = options;

    log.debug("OpenAI stream request", { messageCount: messages.length, maxTokens });
    const start = Date.now();

    try {
      const stream = await this.client.chat.completions.create({
        model: "gpt-5-mini",
        messages,
        stream: true,
      });

      let totalContent = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          totalContent += content;
          yield content;
        }
      }

      const duration = Date.now() - start;
      log.debug("OpenAI stream complete", {
        durationMs: duration,
        contentLength: totalContent.length,
      });
    } catch (error) {
      const duration = Date.now() - start;
      log.error("OpenAI stream error", { durationMs: duration, error: String(error) });
      throw error;
    }
  }

  /**
   * Generate embedding for text
   */
  async embed(text: string): Promise<number[]> {
    log.debug("OpenAI embed request", { textLength: text.length });
    const start = Date.now();

    try {
      // Truncate to avoid token limits (8k tokens ~= 32k chars for safety)
      const truncated = text.slice(0, 30000);

      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: truncated,
      });

      const duration = Date.now() - start;
      log.debug("OpenAI embed response", {
        durationMs: duration,
        dimensions: response.data[0]?.embedding?.length,
      });

      return response.data[0].embedding;
    } catch (error) {
      const duration = Date.now() - start;
      log.error("OpenAI embed error", { durationMs: duration, error: String(error) });
      throw error;
    }
  }
}
