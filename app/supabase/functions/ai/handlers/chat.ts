import { OpenAIProvider } from "../providers/openai.ts";
import type { AIRequest, AIResponse, ChatPayload } from "../types.ts";

const SYSTEM_PROMPT = `You are a meditation guide specializing in the MIDL (Mindfulness in Daily Life) system. You help users progress through 17 skills across 6 cultivations. Be warm, concise, and practical. When referencing MIDL content, mention that users can learn more at midlmeditation.com. Keep responses brief (2-4 sentences) unless the user asks for more detail.`;

export async function handleChat(req: AIRequest): Promise<AIResponse> {
  const { messages } = req.payload as ChatPayload;
  const provider = new OpenAIProvider();

  try {
    const content = await provider.complete({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      maxTokens: 500,
    });
    return { content: content || "Sorry, I had trouble responding." };
  } catch (error) {
    console.error("Chat error:", error);
    return { content: "Sorry, I had trouble responding." };
  }
}
