import { supabase } from './supabase';
import { ai } from './ai';

export type SamathaTendency = 'strong' | 'moderate' | 'weak' | 'none';

export type Entry = {
  id: string;
  user_id: string;
  created_at: string;
  entry_date: string; // YYYY-MM-DD format, user-selectable
  type: 'reflect' | 'ask';
  is_guided: boolean;
  track_progress: boolean;
  raw_content: string;
  duration_seconds: number | null;
  skill_practiced: string | null;

  // MIDL-specific signals (aligned with Stephen's framework)
  skill_analyzed: string | null;

  // Samatha assessment
  samatha_tendency: SamathaTendency | null;
  marker_present: boolean | null;
  marker_notes: string | null;

  // Hindrance assessment
  hindrance_present: boolean | null;
  hindrance_notes: string | null;
  hindrance_conditions: string[] | null;  // what triggered the hindrance

  // Working with experience
  balance_approach: string | null;        // how they worked with hindrance
  key_understanding: string | null;       // insight gained

  // Techniques and progression
  techniques_mentioned: string[] | null;
  progression_signals: string[] | null;

  // Generic signals
  summary: string | null;
  mood_score: number | null;
  mood_tags: string[] | null;
  themes: string[] | null;
  has_breakthrough: boolean;
  has_struggle: boolean;
};

export async function createEntry(
  userId: string,
  data: {
    type: 'reflect' | 'ask';
    raw_content: string;
    is_guided?: boolean;
    track_progress?: boolean;
    duration_seconds?: number;
    skill_practiced?: string;
    entry_date?: string; // YYYY-MM-DD format
  }
): Promise<Entry | null> {
  const { data: entry, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating entry:', error);
    return null;
  }

  // Fire and forget - regenerate rolling summaries and pre-sit guidance
  if (data.track_progress !== false) {
    ai.generateContextSummary('check_and_generate').catch(console.error);
  }

  return entry;
}

export async function getEntriesForDate(
  userId: string,
  date: Date
): Promise<Entry[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) {
    console.error('Error fetching entries for date:', error);
    return [];
  }
  return data || [];
}

export async function getEntriesForDateRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching entries for range:', error);
    return [];
  }
  return data || [];
}

export async function getRecentEntries(
  userId: string,
  limit = 10
): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return data || [];
}

export async function deleteEntry(entryId: string): Promise<boolean> {
  const { error } = await supabase.from('entries').delete().eq('id', entryId);

  if (error) {
    console.error('Error deleting entry:', error);
    return false;
  }

  // Fire and forget - regenerate summaries since entry set changed
  ai.generateContextSummary('check_and_generate').catch(console.error);

  return true;
}
