import { supabase } from './supabase';

export type WeeklySummary = {
  id: string;
  date_range_start: string;
  date_range_end: string;
  summary: string;
  key_themes: string[];
  mood_trend: string;
  samatha_trend: string;
  notable_events: string[];
  hindrance_frequency: Record<string, number>;
  techniques_used: string[];
  avg_mood_score: number;
  entry_count: number;
};

export type MonthlySummary = WeeklySummary; // Same structure

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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

  const recentWeeks = (recentResult.data || []) as WeeklySummary[];

  // Calculate overall trends from recent weeks
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
    thisWeek: (weeklyResult.data as WeeklySummary) || null,
    thisMonth: (monthlyResult.data as MonthlySummary) || null,
    recentWeeks,
    overallTrends: {
      avgMood: Math.round(avgMood * 10) / 10,
      totalSessions,
      dominantThemes,
    },
  };
}

export type PreSitGuidance = {
  skill_id: string;
  skill_name: string;
  patterns: string[];
  suggestion: string;
  check_in: string;
  generated_at: string;
};

export async function getPreSitGuidance(
  userId: string
): Promise<PreSitGuidance | null> {
  const { data, error } = await supabase
    .from('users')
    .select('pre_sit_guidance')
    .eq('id', userId)
    .single();

  if (error || !data?.pre_sit_guidance) {
    return null;
  }

  return data.pre_sit_guidance as PreSitGuidance;
}
