import { OpenAIProvider } from '../providers/openai.ts';
import { SKILLS_FULL, getSkill } from '../data/skills.ts';
import type { AIRequest, AIResponse, SkillPhase } from '../types.ts';
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
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: existingSummary } = await req.supabase
    .from('context_summaries')
    .select('id, entry_ids')
    .eq('user_id', req.userId)
    .eq('summary_type', 'weekly')
    .gte('date_range_start', weekStart.toISOString())
    .lt('date_range_end', weekEnd.toISOString())
    .single();

  const { data: entries, error } = await req.supabase
    .from('entries')
    .select(
      `
      id, created_at, summary, mood_score, mood_tags,
      samatha_tendency, marker_present, marker_notes,
      hindrance_present, hindrance_notes, hindrance_conditions,
      balance_approach, key_understanding, techniques_mentioned,
      has_breakthrough, has_struggle, skill_practiced,
      frontier_skill, skill_phases
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

  // Always regenerate pre-sit guidance + progress report if user has entries
  const { count: totalEntries } = await req.supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.userId)
    .eq('track_progress', true)
    .not('processed_at', 'is', null);

  if (totalEntries && totalEntries >= 1) {
    await generatePreSitGuidance(req);
    await generateProgressReport(req);
  }

  const typedEntries = entries as EntryRow[] | null;

  if (!typedEntries || typedEntries.length < MIN_ENTRIES_FOR_WEEKLY) {
    return {
      skipped: true,
      reason: `Only ${typedEntries?.length || 0} entries this week, need ${MIN_ENTRIES_FOR_WEEKLY}`,
      pre_sit_guidance_updated: totalEntries && totalEntries >= 1,
    };
  }

  const currentEntryIds = typedEntries.map((e) => e.id).sort();
  if (existingSummary) {
    const existingIds = (existingSummary.entry_ids || []).sort();
    if (JSON.stringify(currentEntryIds) === JSON.stringify(existingIds)) {
      return { skipped: true, reason: 'Summary already up to date' };
    }
  }

  const summaryData = await generateWeeklySummary(typedEntries);

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
  frontier_skill: string | null;
  skill_phases: SkillPhase[] | null;
};

async function generateWeeklySummary(
  entries: EntryRow[]
): Promise<SummaryData> {
  const provider = new OpenAIProvider();

  const entryData = entries.map((e) => ({
    date: new Date(e.created_at as string).toLocaleDateString(),
    skill: e.frontier_skill || e.skill_practiced,
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
    skill_phases: e.skill_phases,
  }));

  const prompt = `You are analyzing a week of meditation journal entries from a MIDL practitioner.

MIDL tracks the meditator's mind's relationship toward experiences (Desire, Aversion, Indifference, Contentment, Equanimity). Progress = weakening akusala (hindrances) + strengthening kusala (markers/calm).

ENTRIES THIS WEEK:
${JSON.stringify(entryData, null, 2)}

Generate a rolling summary that captures their practice patterns. Respond in JSON:

{
  "summary": "<2-3 sentence narrative of their week's practice>",
  "key_themes": ["<3-5 recurring themes>"],
  "mood_trend": "<'improving' | 'stable' | 'challenging' | 'variable'>",
  "samatha_trend": "<'strengthening' | 'stable' | 'struggling' | 'variable'>",
  "notable_events": ["<breakthroughs, struggles, key insights>"],
  "hindrance_frequency": {"<condition>": <count>, ...},
  "techniques_used": ["<techniques they practiced most>"]
}

Focus on patterns, not individual sessions. Be concise.`;

  const result = await provider.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 500,
    jsonMode: true,
  });

  const parsed = JSON.parse(result || '{}');

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

  const { data: entries, error } = await req.supabase
    .from('entries')
    .select(
      `
      id, created_at, summary, mood_score, mood_tags,
      samatha_tendency, marker_present, marker_notes,
      hindrance_present, hindrance_notes, hindrance_conditions,
      balance_approach, key_understanding, techniques_mentioned,
      has_breakthrough, has_struggle, skill_practiced,
      frontier_skill, skill_phases
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

  const weekCounts: Record<string, number> = {};
  for (const entry of entries as { created_at: string }[]) {
    const weekStart = getWeekStart(new Date(entry.created_at));
    const key = weekStart.toISOString();
    weekCounts[key] = (weekCounts[key] || 0) + 1;
  }

  let generated = 0;
  for (const [weekStartStr, count] of Object.entries(weekCounts)) {
    if (count >= MIN_ENTRIES_FOR_WEEKLY) {
      const result = await regenerateWeek(req, weekStartStr);
      if (result.success) generated++;
    }
  }

  await generatePreSitGuidance(req);
  await generateProgressReport(req);

  return { success: true, weeksProcessed: generated };
}

// =============================================================================
// PRE-SIT GUIDANCE GENERATION (rewritten for sequential skill practice)
// =============================================================================

async function generatePreSitGuidance(req: AIRequest): Promise<void> {
  // 1. Get user's current skill
  const { data: user } = await req.supabase
    .from('users')
    .select('current_skill, progress_report')
    .eq('id', req.userId)
    .single();

  if (!user) return;

  const frontierSkillId = user.current_skill || '00';
  const frontierSkill = getSkill(frontierSkillId);
  if (!frontierSkill) return;

  const frontierNum = parseInt(frontierSkillId, 10);
  const prevSkillId =
    frontierNum > 0 ? String(frontierNum - 1).padStart(2, '0') : null;
  const prevSkill = prevSkillId ? getSkill(prevSkillId) : null;

  // 2. Get recent entries with skill_phases
  const { data: entries } = await req.supabase
    .from('entries')
    .select('skill_phases, frontier_skill')
    .eq('user_id', req.userId)
    .eq('track_progress', true)
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!entries || entries.length === 0) {
    await req.supabase
      .from('users')
      .update({ pre_sit_guidance: null })
      .eq('id', req.userId);
    return;
  }

  // 3. Aggregate skill_phases for recurring patterns (count >= 2)
  const hindranceCounts: Record<string, { count: number; conditions: Set<string> }> = {};
  const markerCounts: Record<string, number> = {};

  for (const entry of entries as { skill_phases: SkillPhase[] | null }[]) {
    if (!entry.skill_phases) continue;
    for (const phase of entry.skill_phases) {
      for (const h of phase.hindrances_observed) {
        if (!hindranceCounts[h]) hindranceCounts[h] = { count: 0, conditions: new Set() };
        hindranceCounts[h].count++;
      }
      for (const m of phase.markers_observed) {
        markerCounts[m] = (markerCounts[m] || 0) + 1;
      }
    }
  }

  // Filter to count >= 2
  const recurringHindrances = Object.entries(hindranceCounts)
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({
      hindrance_id: id,
      name: getHindranceName(id),
      count: v.count,
      conditions: Array.from(v.conditions),
    }))
    .sort((a, b) => b.count - a.count);

  const recurringMarkers = Object.entries(markerCounts)
    .filter(([, count]) => count >= 2)
    .map(([id, count]) => ({
      marker_id: id,
      name: getMarkerName(id),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Build reading material — verbatim excerpts from skill markdown
  const readingMaterial: { skill_id: string; skill_name: string; excerpt: string }[] = [];

  // Frontier skill: instructions + tips + antidote
  const frontierMd = getSkillMarkdown(frontierSkillId);
  if (frontierMd) {
    const excerpt = extractReadingExcerpt(frontierMd, recurringHindrances);
    if (excerpt) {
      readingMaterial.push({
        skill_id: frontierSkillId,
        skill_name: frontierSkill.name,
        excerpt,
      });
    }
  }

  // Frontier-1 skill: insight section
  if (prevSkillId && prevSkill) {
    const prevMd = getSkillMarkdown(prevSkillId);
    if (prevMd) {
      const excerpt = extractInsightExcerpt(prevMd);
      if (excerpt) {
        readingMaterial.push({
          skill_id: prevSkillId,
          skill_name: prevSkill.name,
          excerpt,
        });
      }
    }
  }

  // 5. Self-advice from progress report
  const progressReport = user.progress_report as Record<string, unknown> | null;
  const selfAdvice = progressReport?.self_advice as string | null ?? null;

  // 6. Store guidance
  const guidance = {
    frontier_skill_id: frontierSkillId,
    frontier_skill_name: frontierSkill.name,
    reading_material: readingMaterial,
    recurring_hindrances: recurringHindrances,
    recurring_markers: recurringMarkers,
    self_advice: selfAdvice,
    generated_at: new Date().toISOString(),
  };

  await req.supabase
    .from('users')
    .update({ pre_sit_guidance: guidance })
    .eq('id', req.userId);

  log.info('Generated pre-sit guidance', {
    userId: req.userId,
    skillId: frontierSkillId,
    entryCount: entries.length,
  });
}

// =============================================================================
// ROLLING PROGRESS REPORT GENERATION (Phase 2d)
// =============================================================================

async function generateProgressReport(req: AIRequest): Promise<void> {
  const provider = new OpenAIProvider();

  // 1. Get user + previous report
  const { data: user } = await req.supabase
    .from('users')
    .select('current_skill, progress_report')
    .eq('id', req.userId)
    .single();

  if (!user) return;

  // 2. Get last 20 entries with skill_phases
  const { data: entries } = await req.supabase
    .from('entries')
    .select(
      `
      created_at, frontier_skill, skill_phases,
      samatha_tendency, summary, mood_score,
      has_breakthrough, has_struggle
    `
    )
    .eq('user_id', req.userId)
    .eq('track_progress', true)
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!entries || entries.length < 3) return; // Need min entries for meaningful report

  const prevReport = user.progress_report
    ? JSON.stringify(user.progress_report)
    : 'No previous report.';

  const prompt = `You are generating a structured progress report for a MIDL meditation practitioner.

Current skill: ${user.current_skill}
Previous report: ${prevReport}

Recent entries (newest first):
${JSON.stringify(
  (entries as {
    created_at: string;
    frontier_skill: string | null;
    skill_phases: SkillPhase[] | null;
    samatha_tendency: string | null;
    summary: string | null;
    mood_score: number | null;
    has_breakthrough: boolean;
    has_struggle: boolean;
  }[]).map((e) => ({
    date: new Date(e.created_at).toLocaleDateString(),
    frontier: e.frontier_skill,
    phases: e.skill_phases,
    samatha: e.samatha_tendency,
    summary: e.summary,
  })),
  null,
  2
)}

Generate a structured progress report. Respond in JSON:

{
  "frontier_skill": "${user.current_skill}",
  "skill_summaries": [
    {
      "skill_id": "<only skills with notable data>",
      "status": "<established|developing|emerging|not_seen>",
      "marker_freq": <times marker observed across entries>,
      "hindrance_freq": <times hindrance observed>,
      "trend": "<improving|stable|declining>",
      "note": "<brief factual note or null>"
    }
  ],
  "recurring_hindrances": [{"id": "<H00-H13>", "count": <n>, "conditions": ["<triggers>"]}],
  "recurring_markers": [{"id": "<M00-M12>", "count": <n>}],
  "overall_samatha_trend": "<strengthening|stable|weakening|variable>",
  "progression_readiness": "<ready|approaching|not_yet>",
  "self_advice": null
}

Rules:
- Only include skill_summaries for skills with actual data
- Count markers/hindrances from skill_phases across all entries
- Be factual and data-driven, not encouraging
- self_advice is null for now (future: user-set)`;

  try {
    const result = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 600,
      jsonMode: true,
    });

    const report = JSON.parse(result || '{}');
    report.updated_at = new Date().toISOString();
    report.frontier_skill = user.current_skill;

    await req.supabase
      .from('users')
      .update({ progress_report: report })
      .eq('id', req.userId);

    log.info('Generated progress report', { userId: req.userId });
  } catch (error) {
    console.error('Progress report generation error:', error);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/** Extract a reading excerpt focused on instructions, tips, and antidote */
function extractReadingExcerpt(
  markdown: string,
  _recurringHindrances: { hindrance_id: string }[]
): string | null {
  const sections: string[] = [];

  // Extract Tips section
  const tipsMatch = markdown.match(/## Tips\n([\s\S]*?)(?=\n## |\n$)/);
  if (tipsMatch) {
    sections.push(tipsMatch[1].trim().slice(0, 400));
  }

  // Extract Insight/Antidote section
  const insightMatch = markdown.match(/## Insight\n([\s\S]*?)(?=\n## |\n$)/);
  if (insightMatch) {
    // Get just the antidote part
    const antidoteMatch = insightMatch[1].match(
      /- Antidote:\s*([\s\S]*?)(?=\n- |\n$)/
    );
    if (antidoteMatch) {
      sections.push(antidoteMatch[1].trim().slice(0, 500));
    }
  }

  return sections.length > 0 ? sections.join('\n\n') : null;
}

/** Extract just the insight section from skill markdown */
function extractInsightExcerpt(markdown: string): string | null {
  const match = markdown.match(/## Insight\n([\s\S]*?)(?=\n## |\n$)/);
  return match ? match[1].trim().slice(0, 500) : null;
}

// Hindrance/Marker name lookups
const HINDRANCE_NAMES: Record<string, string> = {
  H00: 'Stress Breathing',
  H01: 'Physical Restlessness',
  H02: 'Mental Restlessness',
  H03: 'Sleepiness & Dullness',
  H04: 'Habitual Forgetting',
  H05: 'Habitual Control',
  H06: 'Mind Wandering',
  H07: 'Gross Dullness',
  H08: 'Subtle Dullness',
  H09: 'Subtle Wandering',
  H10: 'Sensory Stimulation',
  H11: 'Anticipation of Pleasure',
  H12: 'Fear of Letting Go',
  H13: 'Doubt',
};

const MARKER_NAMES: Record<string, string> = {
  M00: 'Diaphragm Breathing',
  M01: 'Body Relaxation',
  M02: 'Mind Relaxation',
  M03: 'Mindful Presence',
  M04: 'Content Presence',
  M05: 'Natural Breathing',
  M06: 'Whole of Each Breath',
  M07: 'Breath Sensations',
  M08: 'One Point of Sensation',
  M09: 'Sustained Attention',
  M10: 'Whole-Body Breathing',
  M11: 'Sustained Awareness',
  M12: 'Access Concentration',
};

function getHindranceName(id: string): string {
  return HINDRANCE_NAMES[id] || id;
}

function getMarkerName(id: string): string {
  return MARKER_NAMES[id] || id;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export { generatePreSitGuidance, generateProgressReport };
