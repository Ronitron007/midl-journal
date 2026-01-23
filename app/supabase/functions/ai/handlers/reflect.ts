import { OpenAIProvider } from "../providers/openai.ts";
import type { AIRequest, AIResponse, ReflectPayload } from "../types.ts";

export async function handleReflect(req: AIRequest): Promise<AIResponse> {
  const { content, duration, isGuided, skillPracticed } = req.payload as ReflectPayload;
  const provider = new OpenAIProvider();

  const prompt = `You are a meditation guide. The user just completed a meditation session and wrote this reflection:

"${content}"

${duration ? `Duration: ${Math.round(duration / 60)} minutes` : ""}
${isGuided ? "This was a guided session." : ""}
${skillPracticed ? `They were practicing MIDL Skill ${skillPracticed}.` : ""}

Give brief, warm feedback (1-3 sentences). You can:
- Acknowledge what went well
- Offer a gentle suggestion for next time
- Note patterns if relevant
- Simply validate their effort

Keep it conversational and supportive. No emojis.`;

  try {
    const feedback = await provider.complete({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 150,
    });
    return { feedback: feedback || "Good session. You showed up. That matters." };
  } catch {
    return { feedback: "Good session. You showed up. That matters." };
  }
}
