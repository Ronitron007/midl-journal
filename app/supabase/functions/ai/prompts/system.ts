import { SKILLS_DATA } from '../data/skills.ts';

type UserProfile = {
  current_skill: string;
  stats: {
    streak: number;
    total_sessions: number;
    current_skill_days: number;
  };
  onboarding?: {
    meditation_experience?: string;
    struggles?: string[];
    goals?: string[];
  } | null;
};

/**
 * Build dynamic system prompt with user context
 */
export function buildSystemPrompt(profile?: UserProfile | null): string {
  const basePrompt = `You are a warm, knowledgeable meditation guide specializing in MIDL (Mindfulness in Daily Life). You help practitioners develop samatha (calm/relaxation) while skillfully working with hindrances.

GUIDELINES:
- Be concise (2-4 sentences) unless asked for more detail
- Use tools to fetch user context when relevant to their question
- Reference their current skill and practice patterns when helpful
- Suggest techniques appropriate to their level
- For detailed MIDL content, mention midlmeditation.com`;

  if (!profile) {
    return basePrompt;
  }

  const skill = SKILLS_DATA[profile.current_skill] || SKILLS_DATA['00'];
  const stats = profile.stats;

  let contextSection = `

USER CONTEXT:
- Current skill: ${skill.id} - ${skill.name}
- Days on this skill: ${stats.current_skill_days || 1}
- Total sessions: ${stats.total_sessions || 0}
- Streak: ${stats.streak || 0} days`;

  // Add skill focus
  contextSection += `

THEIR CURRENT FOCUS:
- Marker to develop: ${skill.marker}
- Hindrance to work with: ${skill.hindrance}
- Key techniques: ${skill.techniques.slice(0, 3).join(', ')}`;

  // Add onboarding context if available
  if (profile.onboarding) {
    const { meditation_experience, struggles, goals } = profile.onboarding;

    if (meditation_experience) {
      contextSection += `\n- Experience level: ${meditation_experience}`;
    }
    if (struggles?.length) {
      contextSection += `\n- Mentioned struggles: ${struggles.join(', ')}`;
    }
    if (goals?.length) {
      contextSection += `\n- Goals: ${goals.join(', ')}`;
    }
  }

  return basePrompt + contextSection;
}

/**
 * Trim conversation history to fit token budget
 * Keeps most recent messages, drops oldest
 */
export function trimConversationHistory(
  messages: { role: string; content: string }[],
  maxChars: number
): { role: string; content: string }[] {
  let totalChars = 0;
  const result: { role: string; content: string }[] = [];

  // Keep messages from newest to oldest until we hit the limit
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgChars = messages[i].content.length;
    if (totalChars + msgChars > maxChars) break;
    totalChars += msgChars;
    result.unshift(messages[i]);
  }

  return result;
}
