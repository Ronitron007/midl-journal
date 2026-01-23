import type { AIProvider, CompletionOptions } from "../types.ts";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  }

  async complete(options: CompletionOptions): Promise<string> {
    const { messages, maxTokens = 500, jsonMode = false } = options;

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

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}
