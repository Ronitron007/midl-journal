// lib/ai-feedback.ts
import { supabase } from './supabase';

export type FeedbackContext = {
  content: string;
  duration?: number;
  isGuided?: boolean;
  skillPracticed?: string;
  recentPatterns?: string;
};

export async function getReflectionFeedback(
  context: FeedbackContext
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('reflect-feedback', {
    body: context,
  });

  if (error) {
    console.error('AI feedback error:', error);
    return 'Good session. You showed up. That matters.';
  }

  return data.feedback;
}
