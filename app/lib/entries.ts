import { supabase } from './supabase';

export type Entry = {
  id: string;
  user_id: string;
  created_at: string;
  type: 'reflect' | 'ask';
  is_guided: boolean;
  track_progress: boolean;
  raw_content: string;
  duration_seconds: number | null;
  skill_practiced: string | null;
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
