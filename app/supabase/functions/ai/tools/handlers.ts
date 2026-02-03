import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { SKILLS_DATA } from "../data/skills.ts";
import { getSkillMarkdown } from "../data/skill-markdown.ts";
import { log } from "../utils/logger.ts";

type ToolContext = {
  userId: string;
  supabase: SupabaseClient;
};

/**
 * Execute a tool by name and return the result
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext
): Promise<unknown> {
  log.debug("Executing tool", { name, args });

  switch (name) {
    case "get_user_profile":
      return getUserProfile(context);
    case "get_skill_details":
      return getSkillDetails(args.skill_id as string);
    case "get_recent_entries":
      return getRecentEntries(context, args.limit as number, args.skill_filter as string);
    case "get_progression_stats":
      return getProgressionStats(context);
    case "get_hindrance_patterns":
      return getHindrancePatterns(context, args.limit as number);
    case "get_practice_summary":
      return getPracticeSummary(context, args.timeframe as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Get user profile with current skill, stats, and onboarding data
 */
async function getUserProfile(context: ToolContext) {
  const { data, error } = await context.supabase
    .from("users")
    .select("current_skill, stats, onboarding_data")
    .eq("id", context.userId)
    .single();

  if (error) {
    log.error("getUserProfile error", { error: error.message });
    return { error: "Could not fetch profile" };
  }

  const skill = SKILLS_DATA[data.current_skill] || SKILLS_DATA["00"];

  return {
    current_skill: {
      id: skill.id,
      name: skill.name,
      marker: skill.marker,
      hindrance: skill.hindrance,
    },
    stats: data.stats || { streak: 0, total_sessions: 0, current_skill_days: 0 },
    onboarding: data.onboarding_data || null,
  };
}

/**
 * Get details about a specific skill (full markdown content)
 */
function getSkillDetails(skillId: string) {
  const skill = SKILLS_DATA[skillId];

  if (!skill) {
    return { error: `Unknown skill: ${skillId}` };
  }

  const markdown = getSkillMarkdown(skillId);

  return {
    id: skill.id,
    name: skill.name,
    markdown: markdown || `Skill ${skillId} markdown not available`,
  };
}

/**
 * Get recent journal entries with signals
 */
async function getRecentEntries(
  context: ToolContext,
  limit?: number,
  skillFilter?: string
) {
  const queryLimit = Math.min(limit || 5, 10);

  let query = context.supabase
    .from("entries")
    .select(
      "id, created_at, type, skill_practiced, summary, mood_score, mood_tags, " +
        "samatha_tendency, marker_present, marker_notes, hindrance_present, " +
        "hindrance_notes, hindrance_conditions, balance_approach, key_understanding, " +
        "has_breakthrough, has_struggle"
    )
    .eq("user_id", context.userId)
    .eq("type", "reflect")
    .order("created_at", { ascending: false })
    .limit(queryLimit);

  if (skillFilter) {
    query = query.eq("skill_practiced", skillFilter);
  }

  const { data, error } = await query;

  if (error) {
    log.error("getRecentEntries error", { error: error.message });
    return { error: "Could not fetch entries" };
  }

  return {
    count: data.length,
    entries: data.map((e) => ({
      date: new Date(e.created_at).toLocaleDateString(),
      skill: e.skill_practiced,
      summary: e.summary,
      mood: e.mood_score,
      samatha: e.samatha_tendency,
      marker_present: e.marker_present,
      hindrance_present: e.hindrance_present,
      hindrance_notes: e.hindrance_notes,
      breakthrough: e.has_breakthrough,
      struggle: e.has_struggle,
    })),
  };
}

/**
 * Get progression stats for current skill
 */
async function getProgressionStats(context: ToolContext) {
  // First get current skill
  const { data: profile } = await context.supabase
    .from("users")
    .select("current_skill")
    .eq("id", context.userId)
    .single();

  const currentSkill = profile?.current_skill || "00";

  // Get entries for this skill
  const { data: entries, error } = await context.supabase
    .from("entries")
    .select("marker_present, samatha_tendency, progression_signals")
    .eq("user_id", context.userId)
    .eq("skill_practiced", currentSkill)
    .eq("type", "reflect")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    log.error("getProgressionStats error", { error: error.message });
    return { error: "Could not fetch stats" };
  }

  const markerCount = entries.filter((e) => e.marker_present === true).length;
  const strongSamathaCount = entries.filter((e) => e.samatha_tendency === "strong").length;
  const hasProgressionSignals = entries.some(
    (e) => e.progression_signals && e.progression_signals.length > 0
  );

  // Advancement criteria
  const minMarkerSessions = 3;
  const minStrongSamatha = 2;
  const readyToAdvance =
    markerCount >= minMarkerSessions &&
    strongSamathaCount >= minStrongSamatha &&
    hasProgressionSignals;

  const skill = SKILLS_DATA[currentSkill];
  const allSkillIds = Object.keys(SKILLS_DATA).sort();
  const currentIndex = allSkillIds.indexOf(currentSkill);
  const nextSkillId = currentIndex < allSkillIds.length - 1 ? allSkillIds[currentIndex + 1] : null;

  return {
    current_skill: {
      id: currentSkill,
      name: skill?.name,
    },
    total_sessions: entries.length,
    marker_sessions: markerCount,
    strong_samatha_sessions: strongSamathaCount,
    has_progression_signals: hasProgressionSignals,
    ready_to_advance: readyToAdvance,
    next_skill: nextSkillId
      ? { id: nextSkillId, name: SKILLS_DATA[nextSkillId]?.name }
      : null,
    requirements: {
      marker_sessions_needed: Math.max(0, minMarkerSessions - markerCount),
      strong_samatha_needed: Math.max(0, minStrongSamatha - strongSamathaCount),
      progression_signals_needed: !hasProgressionSignals,
    },
  };
}

/**
 * Analyze hindrance patterns from recent entries
 */
async function getHindrancePatterns(context: ToolContext, limit?: number) {
  const queryLimit = Math.min(limit || 10, 20);

  const { data: entries, error } = await context.supabase
    .from("entries")
    .select(
      "skill_practiced, hindrance_present, hindrance_notes, hindrance_conditions, " +
        "balance_approach, samatha_tendency"
    )
    .eq("user_id", context.userId)
    .eq("type", "reflect")
    .eq("hindrance_present", true)
    .order("created_at", { ascending: false })
    .limit(queryLimit);

  if (error) {
    log.error("getHindrancePatterns error", { error: error.message });
    return { error: "Could not fetch patterns" };
  }

  if (entries.length === 0) {
    return {
      message: "No hindrance entries found - the user may be new or hasn't logged struggles yet",
      patterns: [],
    };
  }

  // Count condition frequencies
  const conditionCounts: Record<string, number> = {};
  const balanceApproaches: string[] = [];

  for (const entry of entries) {
    if (entry.hindrance_conditions) {
      for (const condition of entry.hindrance_conditions) {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      }
    }
    if (entry.balance_approach) {
      balanceApproaches.push(entry.balance_approach);
    }
  }

  // Sort conditions by frequency
  const topConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([condition, count]) => ({ condition, count }));

  return {
    total_hindrance_entries: entries.length,
    common_triggers: topConditions,
    what_has_helped: balanceApproaches.slice(0, 3),
    recent_hindrances: entries.slice(0, 3).map((e) => ({
      skill: e.skill_practiced,
      notes: e.hindrance_notes,
      conditions: e.hindrance_conditions,
    })),
  };
}

/**
 * Get rolling practice summaries for historical context
 */
async function getPracticeSummary(context: ToolContext, timeframe?: string) {
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
      message:
        "No practice summaries available yet. The user may be new or hasn't logged enough entries.",
      summaries: [],
    };
  }

  return {
    timeframe: tf,
    summaries: data.map((s) => ({
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

/**
 * Get Monday start of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
