import { supabase, getValidSession } from './supabase';
import { htmlToPlainText, wordCount } from './rich-text-utils';

type AIType =
  | 'chat'
  | 'chat-stream'
  | 'reflect'
  | 'onboarding'
  | 'entry-process'
  | 'context-summary';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

async function callAI<T>(
  type: AIType,
  payload: Record<string, unknown>
): Promise<T> {
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

/**
 * Stream chat responses via SSE
 * Calls onChunk for each token received
 */
async function streamChat(
  messages: { role: string; content: string }[],
  onChunk: (content: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const session = await getValidSession();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'chat-stream', messages }),
    });

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
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
import type { SkillPhase, SamathaTendency } from '../../shared/types';
export type { SamathaTendency };

export type ProcessedSignals = {
  // Multi-skill phase data
  frontier_skill_inferred: string;
  skill_phases: SkillPhase[] | null;

  // MIDL-specific (primary) — flat columns from frontier skill phase (backward compat)
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

// Typed API
export const ai = {
  /**
   * Non-streaming chat (fallback)
   */
  async chat(messages: Message[]): Promise<string> {
    try {
      const result = await callAI<{ content: string }>('chat', { messages });
      return result.content;
    } catch (error: unknown) {
      console.error('Chat error:', error);
      return 'Sorry, I had trouble responding.';
    }
  },

  /**
   * Streaming chat - tokens arrive via onChunk callback
   */
  async chatStream(
    messages: Message[],
    onChunk: (content: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    return streamChat(messages, onChunk, onError);
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
        reasoning:
          "We'll begin with Skill 00: Diaphragmatic Breathing. It's the foundation for everything else — simple but powerful.",
      };
    }
  },

  async processEntry(
    entryId: string,
    rawContent: string,
    frontierSkill: string
  ): Promise<ProcessedSignals | null> {
    // Convert HTML to plain text for processing
    const content = htmlToPlainText(rawContent);
    if (wordCount(rawContent) < 10) return null;
    try {
      const result = await callAI<{
        signals?: ProcessedSignals;
        skipped?: boolean;
      }>('entry-process', {
        entryId,
        content,
        frontierSkill,
        // backward compat: also send as skillPracticed
        skillPracticed: frontierSkill,
      });
      if (result.skipped) return null;
      return result.signals || null;
    } catch (error) {
      console.error('Entry process error:', error);
      return null;
    }
  },

  /**
   * Generate/update rolling context summaries and pre-sit guidance
   * Called after entry create/delete to keep summaries current
   */
  async generateContextSummary(
    action: 'check_and_generate' | 'backfill' = 'check_and_generate'
  ): Promise<{ success?: boolean; skipped?: boolean; reason?: string }> {
    try {
      return await callAI<{
        success?: boolean;
        skipped?: boolean;
        reason?: string;
      }>('context-summary', { action });
    } catch (error) {
      console.error('Context summary error:', error);
      return { skipped: true, reason: 'Generation failed' };
    }
  },
};

// Re-export for backwards compatibility
export const chat = ai.chat;
export const chatStream = ai.chatStream;
export const getReflectionFeedback = ai.reflect;
export const evaluateOnboarding = ai.onboarding;
export const processEntry = (
  entryId: string,
  rawContent: string,
  frontierSkill: string
) => ai.processEntry(entryId, rawContent, frontierSkill);
