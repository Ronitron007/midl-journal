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
};

export type ProcessedSignals = {
  summary: string;
  mood_score: number;
  mood_tags: string[];
  themes: string[];
  has_breakthrough: boolean;
  has_struggle: boolean;
  has_crisis_flag: boolean;
};
