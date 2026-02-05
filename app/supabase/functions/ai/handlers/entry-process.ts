import { OpenAIProvider } from "../providers/openai.ts";
import { SKILLS_DATA } from "../data/skills.ts";
import type { AIRequest, AIResponse, EntryProcessPayload, ProcessedSignals } from "../types.ts";
import { getSkillMarkdown } from "../data/skill-markdown.js";

export async function handleEntryProcess(req: AIRequest): Promise<AIResponse> {
  const { entryId, content, skillPracticed } = req.payload as EntryProcessPayload;

  if (content.split(" ").length < 10) {
    return { skipped: true };
  }

  // Get skill data for the practiced skill (default to 00 if not found)
  const skill = SKILLS_DATA[skillPracticed] || SKILLS_DATA["00"];

  const provider = new OpenAIProvider();

  const skillMarkdown = getSkillMarkdown(skillPracticed);

  // Prompt aligned with Stephen's post-meditation reflection framework:
  // 1. What was your mind's tendency towards relaxation and calm (samatha)?
  // 2. What did you understand, what did you experience?
  // 3. What was the dominant hindrance?
  // 4. What conditions led to it?
  // 5. Your understanding to bring them to balance
  const prompt = `You are analyzing a meditation journal entry through the MIDL framework, which emphasizes developing samatha (relaxation/calm) while understanding hindrances through curious investigation.

  Relationship is important: The first thing to understand is that MIDL does not track experiences that occur during meditation or in daily life; it tracks the meditator's mind's relationship toward those experiences. These are known as the Five Relationships:
  - Desire.
  - Aversion.
  - Indifference.
  - Contentment.
  - Equanimity.
  
  These relationships directly correlate to the strengthening and weakening of the akusala (unwholesome/unskilful) and the kusala (wholesome/skilful).
  
  Progress of insight develops by:
  - Weakening the akusala (unwholesome/unskilful) in seated meditation and daily life.
  - Developing the kusala (wholesome/skilful) in seated meditation and daily life.
  
  Progress can be seen in seated meditation and daily life as:
  - Hindrances to calm (akusala) becoming weaker.
  - Relaxation, calm, presence, wholesome qualities (kusala) are becoming stronger.
  
The meditator is practicing Skill ${skill.id}: ${skill.name}.

${skillMarkdown ? `For this skill, here is all the literature available to you:\n\n${skillMarkdown}` : ''}


Analyze this journal entry using Stephen's reflection framework:

Entry: "${content}"

Extract the following and respond in JSON:

{
  "skill_analyzed": "${skill.id}",

  // SAMATHA ASSESSMENT - "What was your mind's tendency towards relaxation and calm?"
  "samatha_tendency": <"strong" | "moderate" | "weak" | "none" - overall tendency toward relaxation/calm>,
  "marker_present": <boolean - did they experience the skill's marker?>,
  "marker_notes": <string or null - what did they experience related to samatha/the marker?>,

  // HINDRANCE ASSESSMENT - "What was the dominant hindrance?"
  "hindrance_present": <boolean - did a hindrance arise?>,
  "hindrance_notes": <string or null - what was the hindrance experience?>,
  "hindrance_conditions": <string[] - "What conditions led to it?" e.g., ["tired", "stressed from work", "noisy environment"]>,

  // WORKING WITH EXPERIENCE - "Your understanding to bring them to balance"
  "balance_approach": <string or null - how did they work with the hindrance? what helped?>,
  "key_understanding": <string or null - "What did you understand?" any insight or learning?>,

  // TECHNIQUES AND PROGRESSION
  "techniques_mentioned": <string[] - which techniques from this skill did they use?>,
  "progression_signals": <string[] - signs they're developing toward the next skill>,

  // GENERAL
  "summary": <string - 1-2 sentence summary>,
  "mood_score": <number 1-5>,
  "mood_tags": <string[] - emotions present>,
  "themes": <string[] - non-MIDL life topics>,
  "has_breakthrough": <boolean - significant insight or shift?>,
  "has_struggle": <boolean - significant difficulty?>,
  "has_crisis_flag": <boolean - crisis language present?>
}

Be thorough but accurate. Only include information clearly present in the entry. For samatha_tendency:
- "strong": Clear relaxation, calm, settled mind
- "moderate": Some relaxation but inconsistent
- "weak": Minimal tendency toward calm
- "none": No relaxation/calm experienced`;

  try {
    const result = await provider.complete({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 600,
      jsonMode: true,
    });
    const signals = JSON.parse(result || "{}") as ProcessedSignals;

    // Update entry with all signals
    await req.supabase
      .from("entries")
      .update({
        // MIDL-specific - Samatha
        skill_analyzed: signals.skill_analyzed,
        samatha_tendency: signals.samatha_tendency,
        marker_present: signals.marker_present,
        marker_notes: signals.marker_notes,
        // Hindrance
        hindrance_present: signals.hindrance_present,
        hindrance_notes: signals.hindrance_notes,
        hindrance_conditions: signals.hindrance_conditions,
        // Working with experience
        balance_approach: signals.balance_approach,
        key_understanding: signals.key_understanding,
        // Techniques and progression
        techniques_mentioned: signals.techniques_mentioned,
        progression_signals: signals.progression_signals,
        // Generic
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
