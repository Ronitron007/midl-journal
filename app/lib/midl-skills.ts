export type Skill = {
  id: string;
  name: string;
  cultivation: number;
  marker: string;
  hindrance: string;
};

export const CULTIVATIONS = [
  { id: 1, name: 'Mindfulness of Body', skills: ['00', '01', '02', '03'] },
  { id: 2, name: 'Mindfulness of Breathing', skills: ['04', '05', '06'] },
  { id: 3, name: 'Calm & Tranquillity', skills: ['07', '08', '09'] },
  { id: 4, name: 'Joyfulness & Unification', skills: ['10', '11', '12'] },
  { id: 5, name: 'Pleasure Jhana & Equanimity', skills: ['13', '14', '15', '16'] },
];

export const SKILLS: Record<string, Skill> = {
  '00': {
    id: '00',
    name: 'Diaphragmatic Breathing',
    cultivation: 1,
    marker: 'Diaphragm Breathing',
    hindrance: 'Stress Breathing',
  },
  '01': {
    id: '01',
    name: 'Body Relaxation',
    cultivation: 1,
    marker: 'Body Relaxation',
    hindrance: 'Physical Restlessness',
  },
  '02': {
    id: '02',
    name: 'Mind Relaxation',
    cultivation: 1,
    marker: 'Mind Relaxation',
    hindrance: 'Mental Restlessness',
  },
  '03': {
    id: '03',
    name: 'Mindful Presence',
    cultivation: 1,
    marker: 'Mindful Presence',
    hindrance: 'Sleepiness & Dullness',
  },
  '04': {
    id: '04',
    name: 'Content Presence',
    cultivation: 2,
    marker: 'Content Presence',
    hindrance: 'Habitual Forgetting',
  },
  '05': {
    id: '05',
    name: 'Natural Breathing',
    cultivation: 2,
    marker: 'Natural Breathing',
    hindrance: 'Habitual Control',
  },
  '06': {
    id: '06',
    name: 'Whole of Each Breath',
    cultivation: 2,
    marker: 'Whole of Each Breath',
    hindrance: 'Mind Wandering',
  },
  '07': {
    id: '07',
    name: 'Breath Sensations',
    cultivation: 3,
    marker: 'Breath Sensations',
    hindrance: 'Gross Dullness',
  },
  '08': {
    id: '08',
    name: 'One Point of Sensation',
    cultivation: 3,
    marker: 'One Point of Sensation',
    hindrance: 'Subtle Dullness',
  },
  '09': {
    id: '09',
    name: 'Sustained Attention',
    cultivation: 3,
    marker: 'Sustained Attention',
    hindrance: 'Subtle Wandering',
  },
  '10': {
    id: '10',
    name: 'Whole-Body Breathing',
    cultivation: 4,
    marker: 'Whole-Body Breathing',
    hindrance: 'Sensory Stimulation',
  },
  '11': {
    id: '11',
    name: 'Sustained Awareness',
    cultivation: 4,
    marker: 'Sustained Awareness',
    hindrance: 'Anticipation of Pleasure',
  },
  '12': {
    id: '12',
    name: 'Access Concentration',
    cultivation: 4,
    marker: 'Access Concentration',
    hindrance: 'Fear of Letting Go',
  },
  '13': {
    id: '13',
    name: 'Pleasure Jhana',
    cultivation: 5,
    marker: 'Pleasure Jhana',
    hindrance: 'Attachment to Pleasure',
  },
  '14': {
    id: '14',
    name: 'Happy Jhana',
    cultivation: 5,
    marker: 'Happy Jhana',
    hindrance: 'Restless Energy',
  },
  '15': {
    id: '15',
    name: 'Content Jhana',
    cultivation: 5,
    marker: 'Content Jhana',
    hindrance: 'Subtle Discontent',
  },
  '16': {
    id: '16',
    name: 'Equanimity Jhana',
    cultivation: 5,
    marker: 'Equanimity Jhana',
    hindrance: 'Subtle Preferences',
  },
};

export function getSkillNumber(skillId: string): number {
  return parseInt(skillId, 10);
}

export function isSkillCompleted(
  skillId: string,
  currentSkill: string
): boolean {
  return getSkillNumber(skillId) < getSkillNumber(currentSkill);
}

export function isCurrentSkill(skillId: string, currentSkill: string): boolean {
  return skillId === currentSkill;
}
