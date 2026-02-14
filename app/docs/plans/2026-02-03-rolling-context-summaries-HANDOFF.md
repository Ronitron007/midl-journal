# Rolling Context Summaries & Pre-Sit Guidance - Implementation Handoff

## Summary

Implement rolling context summaries that aggregate journal entries over time, plus personalized pre-sit guidance for the home screen. These serve three purposes:

1. **LLM Context**: Provide AI with compressed historical context without sending all raw entries
2. **User Stats**: Display practice patterns and trends to users over time
3. **Pre-Sit Guidance**: Help users focus on what matters for their next meditation session

## Architecture Decision

### Trigger Strategy

| Feature              | Trigger                         | Min Entries | Rationale                                  |
| -------------------- | ------------------------------- | ----------- | ------------------------------------------ |
| **Weekly Summary**   | Post-entry hook (create/delete) | 3           | Meaningful patterns need multiple sessions |
| **Monthly Summary**  | Cron job (Supabase pg_cron)     | 3 weeks     | Less frequent, batch processing acceptable |
| **Pre-Sit Guidance** | Post-entry hook (create/delete) | 1           | Useful from first reflection               |

### Data Flow

```
Entry Created/Deleted
        │
        ▼
┌───────────────────┐
│ entry-process.ts  │ (existing - extract MIDL signals)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ context-summary   │ (new handler)
│ - check if weekly │
│   summary needed  │
│ - generate/update │
│ - ALWAYS generate │
│   pre-sit guidance│
└─────────┬─────────┘
          │
          ├──▶ context_summaries table (weekly)
          │
          └──▶ users.pre_sit_guidance (JSONB)

Monthly Cron (every Sunday 2am)
        │
        ▼
┌───────────────────┐
│ Monthly rollup    │
│ - aggregate 4+    │
│   weekly summaries│
│ - store in        │
│   context_summaries│
└───────────────────┘

Skill Advancement
        │
        ▼
┌───────────────────┐
│ Regenerate        │
│ pre-sit guidance  │
│ (new skill lit)   │
└───────────────────┘
```

---

## Database Changes

### Migration: `006_add_context_summary_columns.sql`

```sql
-- Add new columns to context_summaries table
ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  summary_type TEXT CHECK (summary_type IN ('weekly', 'monthly'));

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  samatha_trend TEXT CHECK (samatha_trend IN ('strengthening', 'stable', 'struggling', 'variable'));

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  entry_count INTEGER DEFAULT 0;

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  hindrance_frequency JSONB DEFAULT '{}'::jsonb;

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  techniques_used TEXT[];

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  avg_mood_score DECIMAL(3,2);

-- Pre-sit guidance on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  pre_sit_guidance JSONB DEFAULT NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_context_summaries_type
  ON context_summaries(user_id, summary_type, date_range_end DESC);

-- Function to get week boundaries
CREATE OR REPLACE FUNCTION get_week_start(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
  SELECT date_trunc('week', ts);
$$ LANGUAGE SQL IMMUTABLE;

-- Index on week boundary for efficient weekly lookups
CREATE INDEX IF NOT EXISTS idx_entries_week
  ON entries(user_id, (date_trunc('week', created_at)));
```

---

## New Files

### 1. `supabase/functions/ai/handlers/context-summary.ts`

```typescript
import { OpenAIProvider } from '../providers/openai.ts';
import type { AIRequest, AIResponse } from '../types.ts';
import { log } from '../utils/logger.ts';

type WeeklySummaryPayload = {
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
  const { action, weekStart } = req.payload as WeeklySummaryPayload;

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
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .not('processed_at', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    log.error('Failed to fetch entries for summary', { error: error.message });
    return { error: 'Failed to fetch entries' };
  }

  // Check if we have enough entries
  if (entries.length < MIN_ENTRIES_FOR_WEEKLY) {
    return {
      skipped: true,
      reason: `Only ${entries.length} entries, need ${MIN_ENTRIES_FOR_WEEKLY}`,
    };
  }

  // Check if entry set has changed (for regeneration)
  const currentEntryIds = entries.map((e) => e.id).sort();
  if (existingSummary) {
    const existingIds = (existingSummary.entry_ids || []).sort();
    if (JSON.stringify(currentEntryIds) === JSON.stringify(existingIds)) {
      return { skipped: true, reason: 'Summary already up to date' };
    }
  }

  // Generate summary
  const summaryData = await generateWeeklySummary(entries);

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

  // Always generate pre-sit guidance after weekly summary
  await generatePreSitGuidance(req);

  return { success: true, summaryData };
}

// Also call pre-sit guidance when weekly summary is skipped (not enough entries)
// but user has at least 1 entry
async function ensurePreSitGuidance(req: AIRequest): Promise<void> {
  const { count } = await req.supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.userId)
    .eq('track_progress', true)
    .not('processed_at', 'is', null);

  if (count && count >= 1) {
    await generatePreSitGuidance(req);
  }
}

async function generateWeeklySummary(entries: any[]): Promise<SummaryData> {
  const provider = new OpenAIProvider();

  // Prepare entry data for prompt
  const entryData = entries.map((e) => ({
    date: new Date(e.created_at).toLocaleDateString(),
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
    .filter((e) => e.mood_score)
    .map((e) => e.mood_score);
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
  // Parse week start and generate summary for that specific week
  const weekStart = new Date(weekStartStr);
  // ... similar to checkAndGenerateWeekly but for specific week
  return { success: true };
}

async function backfillSummaries(req: AIRequest): Promise<AIResponse> {
  // Get all weeks with sufficient entries
  const { data: weekCounts } = await req.supabase.rpc(
    'get_weeks_with_entries',
    { p_user_id: req.userId, p_min_entries: MIN_ENTRIES_FOR_WEEKLY }
  );

  // Generate summaries for each week
  let generated = 0;
  for (const week of weekCounts || []) {
    // Generate summary for each qualifying week
    // ... implementation
    generated++;
  }

  return { success: true, weeksProcessed: generated };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
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

  // 3. Load skill markdown content
  const skillContent = await loadSkillMarkdown(user.current_skill);

  // 4. Generate guidance
  const prompt = `You are preparing a MIDL meditator for their next sit.

CURRENT SKILL: ${user.current_skill} - ${skillContent.name}

SKILL LITERATURE:
${skillContent.overview}

Marker: ${skillContent.marker}
Hindrance: ${skillContent.hindrance}
Antidote: ${skillContent.antidote}

Tips:
${skillContent.tips}

Daily check-in: "${skillContent.checkIn}"

RECENT PRACTICE (from their journal):
${entries
  .map(
    (e) => `- ${e.summary || 'No summary'}
  Samatha: ${e.samatha_tendency || 'unknown'}
  Hindrance: ${e.hindrance_notes || 'none noted'}
  What helped: ${e.balance_approach || 'not specified'}`
  )
  .join('\n')}

Generate pre-sit guidance. Be suggestive, not prescriptive ("You might try..." not "You should..."). Respond in JSON:
{
  "patterns": ["<1-3 observations from their recent practice - what's showing up>"],
  "suggestion": "<one thing to try from the skill literature, relevant to their patterns>",
  "check_in": "<the daily application check-in question from this skill>"
}`;

  const result = await provider.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 300,
    jsonMode: true,
  });

  const guidance = JSON.parse(result || '{}');

  // 5. Store on user profile
  await req.supabase
    .from('users')
    .update({
      pre_sit_guidance: {
        ...guidance,
        skill_id: user.current_skill,
        skill_name: skillContent.name,
        generated_at: new Date().toISOString(),
      },
    })
    .eq('id', req.userId);

  log.info('Generated pre-sit guidance', {
    userId: req.userId,
    skillId: user.current_skill,
    entryCount: entries.length,
  });
}

// Load skill content from markdown files
async function loadSkillMarkdown(skillId: string): Promise<{
  name: string;
  overview: string;
  marker: string;
  hindrance: string;
  antidote: string;
  tips: string;
  checkIn: string;
}> {
  // Option 1: Load from bundled JSON (SKILLS_FULL from data/skills.ts)
  // Option 2: Load from markdown files at runtime
  // For edge functions, bundled JSON is more reliable

  const skill = SKILLS_FULL[skillId];
  if (!skill) {
    return {
      name: `Skill ${skillId}`,
      overview: '',
      marker: '',
      hindrance: '',
      antidote: '',
      tips: '',
      checkIn: 'How was your practice?',
    };
  }

  return {
    name: skill.name,
    overview: skill.overview || '',
    marker: skill.insight?.marker || '',
    hindrance: skill.insight?.hindrance || '',
    antidote: skill.insight?.antidote || '',
    tips: skill.tips?.join('\n') || '',
    checkIn: skill.daily_application?.check_in || 'How was your practice?',
  };
}
```

### 2. `supabase/functions/ai/handlers/monthly-summary.ts`

```typescript
import { OpenAIProvider } from '../providers/openai.ts';
import type { AIRequest, AIResponse } from '../types.ts';
import { log } from '../utils/logger.ts';

const MIN_WEEKS_FOR_MONTHLY = 3;

export async function handleMonthlySummary(
  req: AIRequest
): Promise<AIResponse> {
  // Get current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get weekly summaries for this month
  const { data: weeklySummaries, error } = await req.supabase
    .from('context_summaries')
    .select('*')
    .eq('user_id', req.userId)
    .eq('summary_type', 'weekly')
    .gte('date_range_start', monthStart.toISOString())
    .lte('date_range_end', monthEnd.toISOString())
    .order('date_range_start', { ascending: true });

  if (
    error ||
    !weeklySummaries ||
    weeklySummaries.length < MIN_WEEKS_FOR_MONTHLY
  ) {
    return {
      skipped: true,
      reason: `Only ${weeklySummaries?.length || 0} weekly summaries, need ${MIN_WEEKS_FOR_MONTHLY}`,
    };
  }

  const provider = new OpenAIProvider();

  const prompt = `You are creating a monthly summary from these weekly meditation practice summaries:

WEEKLY SUMMARIES:
${weeklySummaries
  .map(
    (w) => `
Week of ${new Date(w.date_range_start).toLocaleDateString()}:
- Summary: ${w.summary}
- Samatha trend: ${w.samatha_trend}
- Mood trend: ${w.mood_trend}
- Key themes: ${w.key_themes?.join(', ')}
- Notable: ${w.notable_events?.join('; ')}
`
  )
  .join('\n')}

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
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 500,
    jsonMode: true,
  });

  const parsed = JSON.parse(result || '{}');

  // Calculate aggregates
  const totalEntries = weeklySummaries.reduce(
    (sum, w) => sum + (w.entry_count || 0),
    0
  );
  const avgMood =
    weeklySummaries.reduce((sum, w) => sum + (w.avg_mood_score || 0), 0) /
    weeklySummaries.length;

  // Store monthly summary
  const summaryRecord = {
    user_id: req.userId,
    summary_type: 'monthly',
    entry_ids: weeklySummaries.flatMap((w) => w.entry_ids || []),
    date_range_start: monthStart.toISOString(),
    date_range_end: monthEnd.toISOString(),
    summary: parsed.summary,
    key_themes: parsed.key_themes,
    mood_trend: parsed.mood_trend,
    samatha_trend: parsed.samatha_trend,
    notable_events: parsed.notable_events,
    entry_count: totalEntries,
    avg_mood_score: Math.round(avgMood * 100) / 100,
    // Link to weekly summaries
    parent_summary_id: null, // Top level
  };

  await req.supabase.from('context_summaries').insert(summaryRecord);

  log.info('Generated monthly summary', {
    userId: req.userId,
    month: monthStart.toISOString(),
    weeklySummaryCount: weeklySummaries.length,
  });

  return { success: true, summaryData: parsed };
}
```

### 3. Update `supabase/functions/ai/index.ts`

Add new routes:

```typescript
import { handleContextSummary } from "./handlers/context-summary.ts";
import { handleMonthlySummary } from "./handlers/monthly-summary.ts";

// In the route handler switch:
case "context-summary":
  return handleContextSummary(aiRequest);
case "monthly-summary":
  return handleMonthlySummary(aiRequest);
```

### 4. Update `lib/ai.ts` - Add client methods

```typescript
// Add to ai object:
async generateContextSummary(action: 'check_and_generate' | 'backfill' = 'check_and_generate'): Promise<{ success?: boolean; skipped?: boolean; reason?: string }> {
  try {
    return await callAI<{ success?: boolean; skipped?: boolean; reason?: string }>('context-summary', { action });
  } catch (error) {
    console.error('Context summary error:', error);
    return { skipped: true, reason: 'Generation failed' };
  }
},
```

### 5. Update `lib/entries.ts` - Trigger summary on create/delete

```typescript
// In createEntry, after successful insert:
// Fire and forget - don't block entry creation
ai.generateContextSummary('check_and_generate').catch(console.error);

// In deleteEntry (if exists, or create it):
export async function deleteEntry(entryId: string): Promise<boolean> {
  const { error } = await supabase.from('entries').delete().eq('id', entryId);

  if (!error) {
    // Regenerate summary since entry set changed
    ai.generateContextSummary('check_and_generate').catch(console.error);
  }

  return !error;
}
```

---

## New Tool for Chat Context

### Add to `tools/definitions.ts`

```typescript
{
  type: "function",
  function: {
    name: "get_practice_summary",
    description:
      "Get rolling summaries of the user's meditation practice over time. Use this for questions about patterns, progress, or historical context.",
    parameters: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["this_week", "this_month", "recent"],
          description: "Timeframe for summary: this_week (current week), this_month (current month), recent (last 4 weeks)",
        },
      },
      required: [],
    },
  },
},
```

### Add to `tools/handlers.ts`

```typescript
case "get_practice_summary":
  return getPracticeSummary(context, args.timeframe as string);

// Implementation:
async function getPracticeSummary(
  context: ToolContext,
  timeframe?: string
) {
  const tf = timeframe || "recent";
  const now = new Date();

  let query = context.supabase
    .from("context_summaries")
    .select("*")
    .eq("user_id", context.userId);

  if (tf === "this_week") {
    const weekStart = getWeekStart(now);
    query = query
      .eq("summary_type", "weekly")
      .gte("date_range_start", weekStart.toISOString());
  } else if (tf === "this_month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    query = query
      .eq("summary_type", "monthly")
      .gte("date_range_start", monthStart.toISOString());
  } else {
    // recent: last 4 weekly summaries
    query = query
      .eq("summary_type", "weekly")
      .order("date_range_end", { ascending: false })
      .limit(4);
  }

  const { data, error } = await query;

  if (error) {
    log.error("getPracticeSummary error", { error: error.message });
    return { error: "Could not fetch summaries" };
  }

  if (!data || data.length === 0) {
    return {
      message: "No practice summaries available yet. The user may be new or hasn't logged enough entries.",
      summaries: [],
    };
  }

  return {
    timeframe: tf,
    summaries: data.map(s => ({
      period: `${new Date(s.date_range_start).toLocaleDateString()} - ${new Date(s.date_range_end).toLocaleDateString()}`,
      type: s.summary_type,
      summary: s.summary,
      samatha_trend: s.samatha_trend,
      mood_trend: s.mood_trend,
      key_themes: s.key_themes,
      notable_events: s.notable_events,
      entry_count: s.entry_count,
    })),
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

---

## Cron Setup for Monthly Summaries

### Option A: Supabase pg_cron (Recommended)

Add to `supabase/migrations/006_...sql`:

```sql
-- Enable pg_cron if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Run monthly summary generation every Sunday at 2am UTC
-- This checks all users and generates monthly summaries where needed
SELECT cron.schedule(
  'generate-monthly-summaries',
  '0 2 * * 0', -- Every Sunday at 2am
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai',
    body := '{"action": "monthly-summary-batch"}'::jsonb,
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### Option B: External Cron (GitHub Actions / Vercel)

Create `.github/workflows/monthly-summaries.yml`:

```yaml
name: Generate Monthly Summaries
on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 2am UTC
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger monthly summary generation
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/ai" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"action": "monthly-summary-batch"}'
```

---

## User-Facing Stats API

### New endpoint or lib function for UI

```typescript
// lib/practice-stats.ts
import { supabase } from './supabase';

export type PracticeStats = {
  thisWeek: WeeklySummary | null;
  thisMonth: MonthlySummary | null;
  recentWeeks: WeeklySummary[];
  overallTrends: {
    avgMood: number;
    totalSessions: number;
    dominantThemes: string[];
  };
};

export async function getPracticeStats(userId: string): Promise<PracticeStats> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all relevant summaries in parallel
  const [weeklyResult, monthlyResult, recentResult] = await Promise.all([
    supabase
      .from('context_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('summary_type', 'weekly')
      .gte('date_range_start', weekStart.toISOString())
      .single(),
    supabase
      .from('context_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('summary_type', 'monthly')
      .gte('date_range_start', monthStart.toISOString())
      .single(),
    supabase
      .from('context_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('summary_type', 'weekly')
      .order('date_range_end', { ascending: false })
      .limit(8),
  ]);

  // Calculate overall trends from recent weeks
  const recentWeeks = recentResult.data || [];
  const avgMood =
    recentWeeks.length > 0
      ? recentWeeks.reduce((sum, w) => sum + (w.avg_mood_score || 0), 0) /
        recentWeeks.length
      : 0;
  const totalSessions = recentWeeks.reduce(
    (sum, w) => sum + (w.entry_count || 0),
    0
  );

  // Aggregate themes
  const themeCounts: Record<string, number> = {};
  for (const week of recentWeeks) {
    for (const theme of week.key_themes || []) {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }
  }
  const dominantThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  return {
    thisWeek: weeklyResult.data,
    thisMonth: monthlyResult.data,
    recentWeeks,
    overallTrends: {
      avgMood: Math.round(avgMood * 10) / 10,
      totalSessions,
      dominantThemes,
    },
  };
}
```

---

## Pre-Sit Guidance UI Component

### Create `components/PreSitGuidance.tsx`

```tsx
import { View, Text } from 'react-native';

type PreSitGuidanceData = {
  skill_id: string;
  skill_name: string;
  patterns: string[];
  suggestion: string;
  check_in: string;
  generated_at: string;
};

type Props = {
  guidance: PreSitGuidanceData | null;
};

export function PreSitGuidance({ guidance }: Props) {
  // Empty state - no entries yet
  if (!guidance) {
    return (
      <View className="bg-white/90 rounded-2xl p-6">
        <Text className="text-sm text-gray-500 uppercase tracking-wide mb-2">
          For Your Next Sit
        </Text>
        <Text className="text-gray-500 text-center py-4">
          Complete your first reflection to get personalized guidance for your
          sits.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white/90 rounded-2xl p-6">
      <Text className="text-sm text-gray-500 uppercase tracking-wide mb-2">
        For Your Next Sit
      </Text>

      <Text className="text-lg font-medium text-gray-800 mb-4">
        Skill {guidance.skill_id}: {guidance.skill_name}
      </Text>

      {/* Patterns from recent entries */}
      {guidance.patterns.length > 0 && (
        <View className="mb-4">
          <Text className="text-sm text-gray-500 mb-1">
            From your recent sits:
          </Text>
          {guidance.patterns.map((pattern, i) => (
            <Text key={i} className="text-gray-700">
              • {pattern}
            </Text>
          ))}
        </View>
      )}

      {/* Suggestion from skill literature */}
      <View className="bg-lavender/30 rounded-xl p-4 mb-4">
        <Text className="text-gray-800">{guidance.suggestion}</Text>
      </View>

      {/* Daily check-in question */}
      <Text className="text-gray-500 italic">"{guidance.check_in}"</Text>
    </View>
  );
}
```

### Update `app/(main)/tracker.tsx`

```tsx
// Add to imports
import { PreSitGuidance } from '../../components/PreSitGuidance';

// In TrackerScreen component, add to user data fetch:
const [preSitGuidance, setPreSitGuidance] = useState(null);

// In loadUserData:
const { data: profile } = await supabase
  .from('users')
  .select('current_skill, stats, pre_sit_guidance')
  .eq('id', user!.id)
  .single();

if (profile) {
  setCurrentSkill(profile.current_skill || '00');
  setStats(profile.stats || { streak: 0, current_skill_days: 0 });
  setPreSitGuidance(profile.pre_sit_guidance);
}

// In render, add above SkillMap:
<PreSitGuidance guidance={preSitGuidance} />;
```

---

## Backfill Script

### Create `scripts/backfill-summaries.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfillAllUsers() {
  // Get all users with entries
  const { data: users } = await supabase
    .from('entries')
    .select('user_id')
    .eq('type', 'reflect');

  const uniqueUsers = [...new Set(users?.map((e) => e.user_id))];
  console.log(`Found ${uniqueUsers.length} users to backfill`);

  for (const userId of uniqueUsers) {
    console.log(`Processing user ${userId}...`);

    // Call the backfill endpoint
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/ai`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'context-summary',
          payload: { action: 'backfill' },
          userId,
        }),
      }
    );

    const result = await response.json();
    console.log(`  Result:`, result);
  }

  console.log('Backfill complete!');
}

backfillAllUsers().catch(console.error);
```

---

## Files to Create/Modify

| File                                                      | Action | Purpose                                                |
| --------------------------------------------------------- | ------ | ------------------------------------------------------ |
| `supabase/migrations/006_add_context_summary_columns.sql` | Create | New columns + indexes + users.pre_sit_guidance         |
| `supabase/functions/ai/handlers/context-summary.ts`       | Create | Weekly summary + pre-sit guidance generation           |
| `supabase/functions/ai/handlers/monthly-summary.ts`       | Create | Monthly summary generation                             |
| `supabase/functions/ai/index.ts`                          | Modify | Add new routes                                         |
| `supabase/functions/ai/tools/definitions.ts`              | Modify | Add get_practice_summary tool                          |
| `supabase/functions/ai/tools/handlers.ts`                 | Modify | Implement get_practice_summary                         |
| `lib/ai.ts`                                               | Modify | Add generateContextSummary method                      |
| `lib/entries.ts`                                          | Modify | Trigger summary on create/delete                       |
| `lib/practice-stats.ts`                                   | Create | User-facing stats API                                  |
| `lib/progression.ts`                                      | Modify | Trigger pre-sit guidance regeneration on skill advance |
| `components/PreSitGuidance.tsx`                           | Create | Home screen guidance widget                            |
| `app/(main)/tracker.tsx`                                  | Modify | Add PreSitGuidance component                           |
| `scripts/backfill-summaries.ts`                           | Create | One-time backfill                                      |

---

## Testing Checklist

### Weekly Summaries

1. [ ] Run migration (includes users.pre_sit_guidance column)
2. [ ] Deploy edge function
3. [ ] Create 3+ entries manually
4. [ ] Verify weekly summary generated in context_summaries
5. [ ] Delete an entry, verify summary regenerated
6. [ ] Test `get_practice_summary` tool in chat
7. [ ] Run backfill on test user
8. [ ] Test practice stats API
9. [ ] Verify cron setup (manual trigger first)

### Pre-Sit Guidance

10. [ ] Create 1 entry, verify pre_sit_guidance populated on users table
11. [ ] Verify PreSitGuidance component shows on tracker
12. [ ] Test empty state (new user, no entries)
13. [ ] Advance skill, verify pre-sit guidance regenerates with new skill content
14. [ ] Verify guidance includes patterns from recent entries
15. [ ] Verify suggestion references skill literature

---

## Future Considerations (Not in Scope)

- User can edit/annotate summaries
- Privacy controls for summary deletion
- Summary export for users
- Multi-language summary generation
- Summary-based push notifications ("Your week was challenging, here's a suggestion...")
