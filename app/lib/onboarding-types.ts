export type OnboardingData = {
  meditation_experience: 'never' | 'a_little' | 'regularly' | 'years';
  styles_tried: string[];
  struggles: string[];
  life_context: string[];
  what_brings_you: string;
  neurodivergence: string[];
  goals: string[];
};

export const ONBOARDING_OPTIONS = {
  meditation_experience: [
    { value: 'never', label: 'Never' },
    { value: 'a_little', label: 'A little' },
    { value: 'regularly', label: 'Regularly' },
    { value: 'years', label: 'Years of practice' },
  ],
  styles_tried: [
    'Guided apps',
    'Breath focus',
    'Body scan',
    'Vipassana',
    'Zen',
    'Other',
  ],
  struggles: [
    'Staying consistent',
    'Mind wandering',
    'Restlessness',
    'Sleepiness',
    'Not sure what to do',
  ],
  life_context: [
    'Stress',
    'Anxiety',
    'Depression',
    'Life transition',
    'Seeking growth',
    'Curiosity',
  ],
  neurodivergence: [
    'ADHD',
    'Anxiety',
    'Depression',
    'Trauma history',
    'None',
    'Prefer not to say',
  ],
  goals: [
    'Daily habit',
    'Less anxiety',
    'Better focus',
    'Deeper practice',
    'Self-understanding',
    'Not sure yet',
  ],
};
