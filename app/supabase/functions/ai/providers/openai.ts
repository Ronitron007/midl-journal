import type { AIProvider, CompletionOptions } from "../types.ts";
import { log } from "../utils/logger.ts";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  }

  async complete(options: CompletionOptions): Promise<string> {
    const { messages, maxTokens = 500, jsonMode = false } = options;

    log.debug('OpenAI request', { messageCount: messages.length, maxTokens, jsonMode });

    const start = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: "json_object" } }),
      }),
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      const err = await response.text();
      log.error('OpenAI API error', { status: response.status, error: err, durationMs: duration });
      throw new Error(`OpenAI error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const tokens = data.usage;

    log.debug('OpenAI response', { durationMs: duration, tokens });

    return content;
  }
}
