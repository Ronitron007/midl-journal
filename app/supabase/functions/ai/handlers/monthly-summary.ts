import { OpenAIProvider } from "../providers/openai.ts";
import type { AIRequest, AIResponse } from "../types.ts";
import { log } from "../utils/logger.ts";

const MIN_WEEKS_FOR_MONTHLY = 3;

type WeeklySummaryRow = {
  id: string;
  date_range_start: string;
  date_range_end: string;
  summary: string;
  key_themes: string[] | null;
  mood_trend: string | null;
  samatha_trend: string | null;
  notable_events: string[] | null;
  entry_count: number | null;
  avg_mood_score: number | null;
  entry_ids: string[] | null;
};

export async function handleMonthlySummary(req: AIRequest): Promise<AIResponse> {
  // Get current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get weekly summaries for this month
  const { data: weeklySummaries, error } = await req.supabase
    .from("context_summaries")
    .select("*")
    .eq("user_id", req.userId)
    .eq("summary_type", "weekly")
    .gte("date_range_start", monthStart.toISOString())
    .lte("date_range_end", monthEnd.toISOString())
    .order("date_range_start", { ascending: true });

  const typedSummaries = weeklySummaries as WeeklySummaryRow[] | null;

  if (
    error ||
    !typedSummaries ||
    typedSummaries.length < MIN_WEEKS_FOR_MONTHLY
  ) {
    return {
      skipped: true,
      reason: `Only ${typedSummaries?.length || 0} weekly summaries, need ${MIN_WEEKS_FOR_MONTHLY}`,
    };
  }

  const provider = new OpenAIProvider();

  const prompt = `You are creating a monthly summary from these weekly meditation practice summaries:

WEEKLY SUMMARIES:
${typedSummaries
  .map(
    (w) => `
Week of ${new Date(w.date_range_start).toLocaleDateString()}:
- Summary: ${w.summary}
- Samatha trend: ${w.samatha_trend}
- Mood trend: ${w.mood_trend}
- Key themes: ${w.key_themes?.join(", ")}
- Notable: ${w.notable_events?.join("; ")}
`
  )
  .join("\n")}

Generate a monthly summary. Respond in JSON:

{
  "summary": "<3-4 sentence narrative of their month's practice journey - arc of development, key shifts, overall trajectory>",
  "key_themes": ["<3-5 dominant themes across the month>"],
  "mood_trend": "<overall month trend>",
  "samatha_trend": "<overall samatha development>",
  "notable_events": ["<most significant moments worth long-term memory>"],
  "monthly_insight": "<one key insight or pattern about their practice>"
}`;

  const result = await provider.complete({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 500,
    jsonMode: true,
  });

  const parsed = JSON.parse(result || "{}");

  // Calculate aggregates
  const totalEntries = typedSummaries.reduce(
    (sum: number, w) => sum + (w.entry_count || 0),
    0
  );
  const avgMood =
    typedSummaries.reduce((sum: number, w) => sum + (w.avg_mood_score || 0), 0) /
    typedSummaries.length;

  // Check for existing monthly summary
  const { data: existing } = await req.supabase
    .from("context_summaries")
    .select("id")
    .eq("user_id", req.userId)
    .eq("summary_type", "monthly")
    .gte("date_range_start", monthStart.toISOString())
    .lte("date_range_end", monthEnd.toISOString())
    .single();

  // Store monthly summary
  const summaryRecord = {
    user_id: req.userId,
    summary_type: "monthly",
    entry_ids: typedSummaries.flatMap((w) => w.entry_ids || []),
    date_range_start: monthStart.toISOString(),
    date_range_end: monthEnd.toISOString(),
    summary: parsed.summary,
    key_themes: parsed.key_themes,
    mood_trend: parsed.mood_trend,
    samatha_trend: parsed.samatha_trend,
    notable_events: parsed.notable_events,
    entry_count: totalEntries,
    avg_mood_score: Math.round(avgMood * 100) / 100,
  };

  if (existing) {
    await req.supabase
      .from("context_summaries")
      .update(summaryRecord)
      .eq("id", existing.id);
  } else {
    await req.supabase.from("context_summaries").insert(summaryRecord);
  }

  log.info("Generated monthly summary", {
    userId: req.userId,
    month: monthStart.toISOString(),
    weeklySummaryCount: typedSummaries.length,
  });

  return { success: true, summaryData: parsed };
}

/**
 * Batch handler for cron job - processes all users who need monthly summaries
 */
export async function handleMonthlySummaryBatch(
  req: AIRequest
): Promise<AIResponse> {
  // Get all users who have enough weekly summaries this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: userIds, error } = await req.supabase
    .from("context_summaries")
    .select("user_id")
    .eq("summary_type", "weekly")
    .gte("date_range_start", monthStart.toISOString());

  if (error || !userIds) {
    return { error: "Failed to fetch users" };
  }

  // Count weekly summaries per user
  const userWeeklyCounts: Record<string, number> = {};
  for (const row of userIds) {
    userWeeklyCounts[row.user_id] = (userWeeklyCounts[row.user_id] || 0) + 1;
  }

  // Process users with enough weekly summaries
  let processed = 0;
  let skipped = 0;

  for (const [userId, count] of Object.entries(userWeeklyCounts)) {
    if (count >= MIN_WEEKS_FOR_MONTHLY) {
      // Create a new request for this user
      const userReq: AIRequest = {
        ...req,
        userId,
      };

      const result = await handleMonthlySummary(userReq);
      if (result.success) {
        processed++;
      } else {
        skipped++;
      }
    }
  }

  log.info("Monthly summary batch complete", {
    usersProcessed: processed,
    usersSkipped: skipped,
  });

  return { success: true, processed, skipped };
}
