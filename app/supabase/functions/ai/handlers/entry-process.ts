import { OpenAIProvider } from "../providers/openai.ts";
import type { AIRequest, AIResponse, EntryProcessPayload, ProcessedSignals } from "../types.ts";

export async function handleEntryProcess(req: AIRequest): Promise<AIResponse> {
  const { entryId, content } = req.payload as EntryProcessPayload;

  if (content.split(" ").length < 10) {
    return { skipped: true };
  }

  const provider = new OpenAIProvider();

  const prompt = `Analyze this meditation journal entry and extract:
1. A brief summary (1-2 sentences)
2. Mood score (1-5, where 1=very negative, 5=very positive)
3. Mood tags (list of emotions like "anxious", "calm", "frustrated", "peaceful")
4. Themes (topics like "sleep", "work", "restlessness", "breathing")
5. Whether this describes a breakthrough moment (true/false)
6. Whether this describes a struggle (true/false)
7. Whether this contains crisis language like self-harm or suicidal ideation (true/false)

Entry: "${content}"

Respond in JSON format:
{
  "summary": "...",
  "mood_score": 3,
  "mood_tags": ["..."],
  "themes": ["..."],
  "has_breakthrough": false,
  "has_struggle": false,
  "has_crisis_flag": false
}`;

  try {
    const result = await provider.complete({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 300,
      jsonMode: true,
    });
    const signals = JSON.parse(result || "{}") as ProcessedSignals;

    await req.supabase
      .from("entries")
      .update({
        summary: signals.summary,
        mood_score: signals.mood_score,
        mood_tags: signals.mood_tags,
        themes: signals.themes,
        has_breakthrough: signals.has_breakthrough,
        has_struggle: signals.has_struggle,
        has_crisis_flag: signals.has_crisis_flag,
        processed_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    return { signals };
  } catch (error) {
    console.error("Entry process error:", error);
    return { error: "Processing failed" };
  }
}
