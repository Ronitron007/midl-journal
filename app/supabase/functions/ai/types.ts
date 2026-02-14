import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export type AIRequest = {
  payload: Record<string, unknown>;
  userId: string;
  supabase: SupabaseClient;
};

export type AIResponse = Record<string, unknown>;

export type CompletionOptions = {
  messages: { role: string; content: string }[];
  maxTokens?: number;
  jsonMode?: boolean;
};

export type AIProvider = {
  complete(options: CompletionOptions): Promise<string>;
};

export type ChatPayload = {
  messages: { role: string; content: string }[];
};

export type ReflectPayload = {
  content: string;
  duration?: number;
  isGuided?: boolean;
  skillPracticed?: string;
};

export type OnboardingPayload = {
  meditation_experience?: string;
  struggles?: string[];
  life_context?: string[];
  neurodivergence?: string[];
  goals?: string[];
  what_brings_you?: string;
};

export type EntryProcessPayload = {
  entryId: string;
  content: string;
  frontierSkill: string;
  skillPracticed?: string; // backward compat
};

export type SamathaTendency = 'strong' | 'moderate' | 'weak' | 'none';

export type SkillPhase = {
  skill_id: string;
  markers_observed: string[];
  hindrances_observed: string[];
  samatha_tendency: SamathaTendency;
  notes: string | null;
  techniques: string[];
};

export type ProcessedSignals = {
  // Multi-skill phase data
  frontier_skill_inferred: string;
  skill_phases: SkillPhase[] | null;

  // Flat columns from frontier skill phase (backward compat)
  skill_analyzed: string;
  samatha_tendency: SamathaTendency;
  marker_present: boolean;
  marker_notes: string | null;
  hindrance_present: boolean;
  hindrance_notes: string | null;
  hindrance_conditions: string[];
  balance_approach: string | null;
  key_understanding: string | null;
  techniques_mentioned: string[];
  progression_signals: string[];

  // Generic (secondary)
  summary: string;
  mood_score: number;
  mood_tags: string[];
  themes: string[];
  has_breakthrough: boolean;
  has_struggle: boolean;
  has_crisis_flag: boolean;
};
