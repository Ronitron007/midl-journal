import { supabase, getValidSession } from './supabase';
import { htmlToPlainText, wordCount } from './rich-text-utils';

type AIType = 'chat' | 'reflect' | 'onboarding' | 'entry-process';

async function callAI<T>(type: AIType, payload: Record<string, unknown>): Promise<T> {
  const session = await getValidSession();

  const { data, error } = await supabase.functions.invoke('ai', {
    body: { type, ...payload },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data as T;
}

// Chat types
export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Reflect types
export type FeedbackContext = {
  content: string;
  duration?: number;
  isGuided?: boolean;
  skillPracticed?: string;
};

// Onboarding types
export type OnboardingData = {
  meditation_experience?: string;
  struggles?: string[];
  life_context?: string[];
  neurodivergence?: string[];
  goals?: string[];
  what_brings_you?: string;
};

export type EvalResult = {
  recommended_skill: string;
  reasoning: string;
};

// Entry process types
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

// Typed API
export const ai = {
  async chat(messages: Message[]): Promise<string> {
    try {
      const result = await callAI<{ content: string }>('chat', { messages });
      return result.content;
    } catch (error: unknown) {
      // Try to get the response body for more details
      const err = error as { context?: { _bodyBlob?: Blob } };
      if (err.context?._bodyBlob) {
        try {
          const text = await err.context._bodyBlob.text();
          console.error('Chat error body:', text);
        } catch {}
      }
      console.error('Chat error:', error);
      return 'Sorry, I had trouble responding.';
    }
  },

  async reflect(context: FeedbackContext): Promise<string> {
    try {
      const result = await callAI<{ feedback: string }>('reflect', context);
      return result.feedback;
    } catch (error) {
      console.error('Reflect error:', error);
      return 'Good session. You showed up. That matters.';
    }
  },

  async onboarding(data: Partial<OnboardingData>): Promise<EvalResult> {
    try {
      return await callAI<EvalResult>('onboarding', data);
    } catch (error) {
      console.error('Onboarding eval error:', error);
      return {
        recommended_skill: '00',
        reasoning: "We'll begin with Skill 00: Diaphragmatic Breathing. It's the foundation for everything else — simple but powerful.",
      };
    }
  },

  async processEntry(entryId: string, rawContent: string, skillPracticed: string): Promise<ProcessedSignals | null> {
    // Convert HTML to plain text for processing
    const content = htmlToPlainText(rawContent);
    if (wordCount(rawContent) < 10) return null;
    try {
      const result = await callAI<{ signals?: ProcessedSignals; skipped?: boolean }>('entry-process', { entryId, content, skillPracticed });
      if (result.skipped) return null;
      return result.signals || null;
    } catch (error) {
      console.error('Entry process error:', error);
      return null;
    }
  },
};

// Re-export for backwards compatibility
export const chat = ai.chat;
export const getReflectionFeedback = ai.reflect;
export const evaluateOnboarding = ai.onboarding;
export const processEntry = (entryId: string, rawContent: string, skillPracticed: string) =>
  ai.processEntry(entryId, rawContent, skillPracticed);
