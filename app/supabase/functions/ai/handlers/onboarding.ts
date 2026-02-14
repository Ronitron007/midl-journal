import { OpenAIProvider } from '../providers/openai.ts';
import type { AIRequest, AIResponse, OnboardingPayload } from '../types.ts';

export async function handleOnboarding(req: AIRequest): Promise<AIResponse> {
  const data = req.payload as OnboardingPayload;
  const provider = new OpenAIProvider();

  const prompt = `You are a MIDL meditation guide. Based on the user's onboarding responses, recommend which skill they should start with.

MIDL has 17 skills (00-16):
- 00: Diaphragmatic Breathing (foundation, stress breathing)
- 01: Body Relaxation (physical restlessness)
- 02: Mind Relaxation (mental restlessness)
- 03: Mindful Presence (sleepiness, dullness)
- 04: Content Presence (habitual forgetting)
- 05: Natural Breathing (habitual control)
- 06: Whole of Each Breath (mind wandering)
- 07-16: Advanced skills (not recommended for beginners)

User's responses:
- Meditation experience: ${data.meditation_experience || 'not provided'}
- Struggles: ${data.struggles?.join(', ') || 'none selected'}
- Life context: ${data.life_context?.join(', ') || 'none selected'}
- Neurodivergence: ${data.neurodivergence?.join(', ') || 'none selected'}
- Goals: ${data.goals?.join(', ') || 'none selected'}
- What brings them here: ${data.what_brings_you || 'not provided'}

Recommend a skill (00-06 only for beginners) and give a brief, warm 2-sentence explanation.

Respond in JSON:
{
  "recommended_skill": "00",
  "reasoning": "Your explanation here."
}`;

  try {
    const result = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 200,
      jsonMode: true,
    });
    const parsed = JSON.parse(result || '{}');
    return {
      recommended_skill: parsed.recommended_skill || '00',
      reasoning: parsed.reasoning || getDefaultReasoning(data),
    };
  } catch {
    return {
      recommended_skill: '00',
      reasoning: getDefaultReasoning(data),
    };
  }
}

function getDefaultReasoning(data: OnboardingPayload): string {
  if (data.meditation_experience === 'never') {
    return "Since you're new to meditation, we'll start with the foundation — diaphragmatic breathing. It's simple but transformative.";
  }
  if (
    data.struggles?.includes('Anxiety') ||
    data.struggles?.includes('Stress')
  ) {
    return 'Given your experience with stress, diaphragmatic breathing will help you build a calming foundation before we explore deeper practices.';
  }
  return "We'll begin with Skill 00: Diaphragmatic Breathing. It's the foundation for everything else — simple but powerful.";
}
