/**
 * Shared types for MIDL skills and cultivations
 * Generated from data/midl-skills markdown files
 */

export interface SkillQuote {
  text: string;
  attribution: string;
}

export interface SkillResources {
  youtube?: string;
  soundcloud?: string;
  pdf?: string;
  other?: string[];
}

export interface InstructionStep {
  step: number;
  title: string;
  content: string;
}

export interface SkillInstructions {
  intro?: string;
  steps: InstructionStep[];
}

export interface SkillObstacle {
  title: string;
  content: string;
}

export interface SkillInsight {
  marker: string;
  hindrance: string;
  antidote?: string;
}

export interface DailyApplication {
  check_in?: string;
  learnings?: string[];
  steps?: string[];
}

export interface SkillProgression {
  criteria: string;
  next_skill?: string;
  previous_skill?: string;
}

export interface Skill {
  /** Two-digit ID: "00" - "16" */
  id: string;
  /** Display name, e.g. "Diaphragmatic Breathing" */
  name: string;
  /** Cultivation ID: "01" - "05" */
  cultivation_id: string;
  /** Short description of transformation */
  subtitle: string;
  /** Recommended practice duration */
  duration: string;
  /** Optional Buddha quote */
  quote?: SkillQuote;
  /** Overview paragraph */
  overview: string;
  /** List of benefits */
  benefits: string[];
  /** Purpose paragraph */
  purpose: string;
  /** Resource links */
  resources: SkillResources;
  /** Meditation instructions */
  instructions: SkillInstructions;
  /** Optional practice tips */
  tips?: string[];
  /** Optional common obstacles */
  obstacles?: SkillObstacle[];
  /** Marker, hindrance, antidote */
  insight: SkillInsight;
  /** Daily life application */
  daily_application?: DailyApplication;
  /** Progression criteria */
  progression: SkillProgression;
}

export interface SupportArticle {
  name: string;
  url: string;
}

export interface Cultivation {
  /** Cultivation ID: "01" - "05" */
  id: string;
  /** Display name, e.g. "Mindfulness of Body" */
  name: string;
  /** Who this cultivation is for */
  suitability: string;
  /** Whether membership is required */
  membership_required: boolean;
  /** Purpose of this cultivation */
  purpose: string;
  /** What practitioners will learn */
  what_you_will_learn: string[];
  /** Skill IDs in this cultivation */
  skill_ids: string[];
  /** Related support articles */
  support_articles?: SupportArticle[];
}

export type SkillId =
  | '00'
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16';
export type CultivationId = '01' | '02' | '03' | '04' | '05';

export type SkillsData = Record<SkillId, Skill>;
export type CultivationsData = Record<CultivationId, Cultivation>;
