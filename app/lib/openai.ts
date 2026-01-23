// lib/openai.ts
import { supabase } from './supabase';

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function chat(messages: Message[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { messages },
  });

  if (error) {
    console.error('Chat error:', error);
    return 'Sorry, I had trouble responding.';
  }

  return data.content;
}
