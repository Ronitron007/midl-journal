import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

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
  skillPracticed: string;
};

export type SamathaTendency = 'strong' | 'moderate' | 'weak' | 'none';

export type ProcessedSignals = {
  // MIDL-specific (primary) - aligned with Stephen's framework
  skill_analyzed: string;

  // Samatha (relaxation/calm) assessment
  samatha_tendency: SamathaTendency;  // tendency toward relaxation and calm
  marker_present: boolean;
  marker_notes: string | null;

  // Hindrance assessment
  hindrance_present: boolean;
  hindrance_notes: string | null;
  hindrance_conditions: string[];     // what triggered/led to the hindrance

  // Working with experience
  balance_approach: string | null;    // how they worked with the hindrance
  key_understanding: string | null;   // insight or understanding gained

  // Techniques and progression
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
