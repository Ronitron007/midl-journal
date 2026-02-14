import { OpenAIProvider } from '../providers/openai.ts';
import { SKILLS_FULL, getSkill } from '../data/skills.ts';
import type { AIRequest, AIResponse } from '../types.ts';
import { log } from '../utils/logger.ts';
import { getSkillMarkdown } from '../data/skill-markdown.ts';

type ContextSummaryPayload = {
  action: 'check_and_generate' | 'regenerate_week' | 'backfill';
  weekStart?: string; // ISO date for specific week
};

type SummaryData = {
  summary: string;
  key_themes: string[];
  mood_trend: 'improving' | 'stable' | 'challenging' | 'variable';
  samatha_trend: 'strengthening' | 'stable' | 'struggling' | 'variable';
  notable_events: string[];
  hindrance_frequency: Record<string, number>;
  techniques_used: string[];
  avg_mood_score: number;
  entry_count: number;
};

type PreSitGuidance = {
  patterns: string[];
  suggestion: string;
  check_in: string;
  skill_id: string;
  skill_name: string;
  generated_at: string;
};

const MIN_ENTRIES_FOR_WEEKLY = 3;

export async function handleContextSummary(
  req: AIRequest
): Promise<AIResponse> {
  const { action, weekStart } = req.payload as ContextSummaryPayload;

  switch (action) {
    case 'check_and_generate':
      return checkAndGenerateWeekly(req);
    case 'regenerate_week':
      return regenerateWeek(req, weekStart!);
    case 'backfill':
      return backfillSummaries(req);
    default:
      return { error: 'Unknown action' };
  }
}

async function checkAndGenerateWeekly(req: AIRequest): Promise<AIResponse> {
  // Get current week boundaries
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Check if summary already exists for this week
  const { data: existingSummary } = await req.supabase
    .from('context_summaries')
    .select('id, entry_ids')
    .eq('user_id', req.userId)
    .eq('summary_type', 'weekly')
    .gte('date_range_start', weekStart.toISOString())
    .lt('date_range_end', weekEnd.toISOString())
    .single();

  // Get entries for this week
  const { data: entries, error } = await req.supabase
    .from('entries')
    .select(
      `
      id, created_at, summary, mood_score, mood_tags,
      samatha_tendency, marker_present, marker_notes,
      hindrance_present, hindrance_notes, hindrance_conditions,
      balance_approach, key_understanding, techniques_mentioned,
      has_breakthrough, has_struggle, skill_practiced
    `
    )
    .eq('user_id', req.userId)
    .eq('type', 'reflect')
    .eq('track_progress', true)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    log.error('Failed to fetch entries for summary', { error: error.message });
    return { error: 'Failed to fetch entries' };
  }

  // Always regenerate pre-sit guidance if user has at least 1 entry
  const { count: totalEntries } = await req.supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.userId)
    .eq('track_progress', true)
    .not('processed_at', 'is', null);

  if (totalEntries && totalEntries >= 1) {
    await generatePreSitGuidance(req);
  }

  const typedEntries = entries as EntryRow[] | null;

  // Check if we have enough entries for weekly summary
  if (!typedEntries || typedEntries.length < MIN_ENTRIES_FOR_WEEKLY) {
    return {
      skipped: true,
      reason: `Only ${typedEntries?.length || 0} entries this week, need ${MIN_ENTRIES_FOR_WEEKLY}`,
      pre_sit_guidance_updated: totalEntries && totalEntries >= 1,
    };
  }

  // Check if entry set has changed (for regeneration)
  const currentEntryIds = typedEntries.map((e) => e.id).sort();
  if (existingSummary) {
    const existingIds = (existingSummary.entry_ids || []).sort();
    if (JSON.stringify(currentEntryIds) === JSON.stringify(existingIds)) {
      return { skipped: true, reason: 'Summary already up to date' };
    }
  }

  // Generate summary
  const summaryData = await generateWeeklySummary(typedEntries);

  // Upsert summary
  const summaryRecord = {
    user_id: req.userId,
    summary_type: 'weekly',
    entry_ids: currentEntryIds,
    date_range_start: weekStart.toISOString(),
    date_range_end: weekEnd.toISOString(),
    summary: summaryData.summary,
    key_themes: summaryData.key_themes,
    mood_trend: summaryData.mood_trend,
    samatha_trend: summaryData.samatha_trend,
    notable_events: summaryData.notable_events,
    hindrance_frequency: summaryData.hindrance_frequency,
    techniques_used: summaryData.techniques_used,
    avg_mood_score: summaryData.avg_mood_score,
    entry_count: summaryData.entry_count,
  };

  if (existingSummary) {
    await req.supabase
      .from('context_summaries')
      .update(summaryRecord)
      .eq('id', existingSummary.id);
  } else {
    await req.supabase.from('context_summaries').insert(summaryRecord);
  }

  log.info('Generated weekly summary', {
    userId: req.userId,
    weekStart: weekStart.toISOString(),
    entryCount: entries.length,
  });

  return { success: true, summaryData };
}

type EntryRow = {
  id: string;
  created_at: string;
  summary: string | null;
  mood_score: number | null;
  mood_tags: string[] | null;
  samatha_tendency: string | null;
  marker_present: boolean | null;
  marker_notes: string | null;
  hindrance_present: boolean | null;
  hindrance_notes: string | null;
  hindrance_conditions: string[] | null;
  balance_approach: string | null;
  key_understanding: string | null;
  techniques_mentioned: string[] | null;
  has_breakthrough: boolean;
  has_struggle: boolean;
  skill_practiced: string | null;
};

async function generateWeeklySummary(
  entries: EntryRow[]
): Promise<SummaryData> {
  const provider = new OpenAIProvider();

  // Prepare entry data for prompt
  const entryData = entries.map((e) => ({
    date: new Date(e.created_at as string).toLocaleDateString(),
    skill: e.skill_practiced,
    summary: e.summary,
    mood: e.mood_score,
    samatha: e.samatha_tendency,
    marker_present: e.marker_present,
    marker_notes: e.marker_notes,
    hindrance_present: e.hindrance_present,
    hindrance_notes: e.hindrance_notes,
    hindrance_conditions: e.hindrance_conditions,
    balance_approach: e.balance_approach,
    key_understanding: e.key_understanding,
    techniques: e.techniques_mentioned,
    breakthrough: e.has_breakthrough,
    struggle: e.has_struggle,
  }));

  const prompt = `You are analyzing a week of meditation journal entries from a MIDL practitioner.

The first thing to understand is that MIDL does not track experiences that occur during meditation or in daily life; it tracks the meditator's mind's relationship toward those experiences. These are known as the Five Relationships:
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


ENTRIES THIS WEEK:
${JSON.stringify(entryData, null, 2)}

Generate a rolling summary that captures their practice patterns. Respond in JSON:

{
  "summary": "<2-3 sentence narrative of their week's practice - what they worked on, how it went, any notable shifts>",
  "key_themes": ["<3-5 recurring themes from their practice>"],
  "mood_trend": "<'improving' | 'stable' | 'challenging' | 'variable'>",
  "samatha_trend": "<'strengthening' | 'stable' | 'struggling' | 'variable' - based on samatha_tendency across entries>",
  "notable_events": ["<any breakthroughs, significant struggles, or key insights worth remembering>"],
  "hindrance_frequency": {"<condition>": <count>, ...},
  "techniques_used": ["<techniques they practiced most>"]
}

Focus on patterns, not individual sessions. Be concise but capture the essence of their week.`;

  const result = await provider.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 500,
    jsonMode: true,
  });

  const parsed = JSON.parse(result || '{}');

  // Calculate avg mood from entries
  const moodScores = entries
    .filter((e) => e.mood_score !== null)
    .map((e) => e.mood_score as number);
  const avgMood =
    moodScores.length > 0
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : 0;

  return {
    ...parsed,
    avg_mood_score: Math.round(avgMood * 100) / 100,
    entry_count: entries.length,
  };
}

async function regenerateWeek(
  req: AIRequest,
  weekStartStr: string
): Promise<AIResponse> {
  const weekStart = new Date(weekStartStr);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get entries for this specific week
  const { data: entries, error } = await req.supabase
    .from('entries')
    .select(
      `
      id, created_at, summary, mood_score, mood_tags,
      samatha_tendency, marker_present, marker_notes,
      hindrance_present, hindrance_notes, hindrance_conditions,
      balance_approach, key_understanding, techniques_mentioned,
      has_breakthrough, has_struggle, skill_practiced
    `
    )
    .eq('user_id', req.userId)
    .eq('type', 'reflect')
    .eq('track_progress', true)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: true });

  const typedEntries = entries as EntryRow[] | null;

  if (error || !typedEntries || typedEntries.length < MIN_ENTRIES_FOR_WEEKLY) {
    return {
      skipped: true,
      reason: `Only ${typedEntries?.length || 0} entries, need ${MIN_ENTRIES_FOR_WEEKLY}`,
    };
  }

  const summaryData = await generateWeeklySummary(typedEntries);
  const currentEntryIds = typedEntries.map((e) => e.id).sort();

  // Upsert summary
  const { data: existing } = await req.supabase
    .from('context_summaries')
    .select('id')
    .eq('user_id', req.userId)
    .eq('summary_type', 'weekly')
    .gte('date_range_start', weekStart.toISOString())
    .lt('date_range_end', weekEnd.toISOString())
    .single();

  const summaryRecord = {
    user_id: req.userId,
    summary_type: 'weekly',
    entry_ids: currentEntryIds,
    date_range_start: weekStart.toISOString(),
    date_range_end: weekEnd.toISOString(),
    summary: summaryData.summary,
    key_themes: summaryData.key_themes,
    mood_trend: summaryData.mood_trend,
    samatha_trend: summaryData.samatha_trend,
    notable_events: summaryData.notable_events,
    hindrance_frequency: summaryData.hindrance_frequency,
    techniques_used: summaryData.techniques_used,
    avg_mood_score: summaryData.avg_mood_score,
    entry_count: summaryData.entry_count,
  };

  if (existing) {
    await req.supabase
      .from('context_summaries')
      .update(summaryRecord)
      .eq('id', existing.id);
  } else {
    await req.supabase.from('context_summaries').insert(summaryRecord);
  }

  return { success: true, summaryData };
}

async function backfillSummaries(req: AIRequest): Promise<AIResponse> {
  // Get all entries grouped by week
  const { data: entries } = await req.supabase
    .from('entries')
    .select('created_at')
    .eq('user_id', req.userId)
    .eq('type', 'reflect')
    .eq('track_progress', true)
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: true });

  if (!entries || entries.length === 0) {
    return { skipped: true, reason: 'No entries to backfill' };
  }

  // Group entries by week
  const weekCounts: Record<string, number> = {};
  for (const entry of entries as { created_at: string }[]) {
    const weekStart = getWeekStart(new Date(entry.created_at));
    const key = weekStart.toISOString();
    weekCounts[key] = (weekCounts[key] || 0) + 1;
  }

  // Generate summaries for qualifying weeks
  let generated = 0;
  for (const [weekStartStr, count] of Object.entries(weekCounts)) {
    if (count >= MIN_ENTRIES_FOR_WEEKLY) {
      const result = await regenerateWeek(req, weekStartStr);
      if (result.success) generated++;
    }
  }

  // Also regenerate pre-sit guidance
  await generatePreSitGuidance(req);

  return { success: true, weeksProcessed: generated };
}

// =============================================================================
// PRE-SIT GUIDANCE GENERATION
// =============================================================================

async function generatePreSitGuidance(req: AIRequest): Promise<void> {
  const provider = new OpenAIProvider();

  // 1. Get user's current skill
  const { data: user } = await req.supabase
    .from('users')
    .select('current_skill')
    .eq('id', req.userId)
    .single();

  if (!user) return;

  // 2. Get recent entries (last 10, track_progress=true)
  const { data: entries } = await req.supabase
    .from('entries')
    .select(
      `
      summary, hindrance_notes, hindrance_conditions,
      balance_approach, samatha_tendency, marker_notes,
      key_understanding, skill_practiced
    `
    )
    .eq('user_id', req.userId)
    .eq('track_progress', true)
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!entries || entries.length === 0) {
    // Clear guidance if no entries
    await req.supabase
      .from('users')
      .update({ pre_sit_guidance: null })
      .eq('id', req.userId);
    return;
  }

  // 2b. Get most recent weekly summary for aggregated context
  const { data: weeklySummary } = await req.supabase
    .from('context_summaries')
    .select(
      `
      summary, key_themes, samatha_trend, mood_trend,
      notable_events, hindrance_frequency, techniques_used
    `
    )
    .eq('user_id', req.userId)
    .eq('summary_type', 'weekly')
    .order('date_range_end', { ascending: false })
    .limit(1)
    .single();

  // 3. Load skill content
  const skillContent = getSkill(user.current_skill)!;
  const skillMarkdown = skillContent
    ? await getSkillMarkdown(user.current_skill)
    : '';

  // 4. Build weekly summary context if available
  const weeklySummaryContext = weeklySummary
    ? `
WEEKLY PRACTICE SUMMARY:
${weeklySummary.summary}
- Samatha trend: ${weeklySummary.samatha_trend || 'unknown'}
- Mood trend: ${weeklySummary.mood_trend || 'unknown'}
- Key themes: ${(weeklySummary.key_themes as string[] | null)?.join(', ') || 'none'}
- Common hindrances: ${
        Object.entries(
          (weeklySummary.hindrance_frequency as Record<string, number>) || {}
        )
          .map(([k, v]) => `${k} (${v}x)`)
          .join(', ') || 'none'
      }
- Techniques used: ${(weeklySummary.techniques_used as string[] | null)?.join(', ') || 'none'}
${(weeklySummary.notable_events as string[] | null)?.length ? `- Notable: ${(weeklySummary.notable_events as string[]).join('; ')}` : ''}`
    : '';

  // 5. Generate guidance
  const prompt = `You are preparing a MIDL meditator for their next meditation sit.

CURRENT SKILL: ${user.current_skill} - ${skillContent?.name || 'Unknown skill'}

SKILL LITERATURE:
${skillMarkdown}
Weekly summary:
${weeklySummaryContext}

RECENT ENTRIES (last few sits):
${(
  entries as {
    summary: string | null;
    samatha_tendency: string | null;
    hindrance_notes: string | null;
    balance_approach: string | null;
  }[]
)
  .map(
    (e) => `- ${e.summary || 'No summary'}
  Samatha: ${e.samatha_tendency || 'unknown'}
  Hindrance: ${e.hindrance_notes || 'none noted'}
  What helped: ${e.balance_approach || 'not specified'}`
  )
  .join('\n')}

Generate pre-sit guidance based on their patterns. Be suggestive, not prescriptive ("You might try..." not "You should..."). Use the weekly summary for overall trends and recent entries for specifics. Respond in JSON:
{
  "patterns": ["<1-3 one to two word observations from their practice patterns - what's showing up>"],
  "suggestion": "<one or two things to try from the skill literature, relevant to their patterns and hindrances. Be specific and not vague.>",
  "check_in": "<the daily application check-in question from this skill>"
}`;

  const result = await provider.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1000,
    jsonMode: true,
  });

  const guidance = JSON.parse(result || '{}');

  // 6. Store on user profile
  const preSitGuidance: PreSitGuidance = {
    ...guidance,
    skill_id: user.current_skill,
    skill_name: skillContent.name,
    generated_at: new Date().toISOString(),
  };

  await req.supabase
    .from('users')
    .update({ pre_sit_guidance: preSitGuidance })
    .eq('id', req.userId);

  log.info('Generated pre-sit guidance', {
    userId: req.userId,
    skillId: user.current_skill,
    entryCount: entries.length,
  });
}

// Load skill content for pre-sit guidance prompt
function loadSkillContent(skillId: string): {
  name: string;
  overview: string;
  marker: string;
  benefits: string[];
  purpose: string;

  hindrance: string;
  antidote: string;
  tips: string;
  checkIn: string;
} {
  const skill = getSkill(skillId);
  if (!skill) {
    return {
      name: `Skill ${skillId}`,
      overview: '',
      marker: '',
      benefits: [],
      purpose: '',
      hindrance: '',
      antidote: '',
      tips: '',
      checkIn: 'How was your practice?',
    };
  }

  return {
    name: skill.name,
    overview: skill.overview || '',
    benefits: skill.benefits || [],
    purpose: skill.purpose || '',
    marker: skill.insight?.marker || '',
    hindrance: skill.insight?.hindrance || '',
    antidote: skill.insight?.antidote || '',
    tips: skill.tips?.join('\n') || '',
    checkIn: skill.daily_application?.check_in || 'How was your practice?',
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Export for use in skill advancement
export { generatePreSitGuidance };
