/**
 * MIDL Skills and Cultivations
 * Data imported from shared/skills.json (source of truth: data/midl-skills/*.md)
 */

import skillsData from '../../shared/skills.json';
import cultivationsData from '../../shared/cultivations.json';
import type { Skill as FullSkill, Cultivation as FullCultivation, SkillId, CultivationId } from '../../shared/types';

// Re-export full types for advanced usage
export type { FullSkill, FullCultivation, SkillId, CultivationId };

// Simplified skill type for backward compatibility
export type Skill = {
  id: string;
  name: string;
  cultivation: number;
  marker: string;
  hindrance: string;
};

// Simplified cultivation type for backward compatibility
export type CultivationType = {
  id: number;
  name: string;
  skills: string[];
};

// Build CULTIVATIONS array from JSON
export const CULTIVATIONS: CultivationType[] = Object.values(cultivationsData).map((c: FullCultivation) => ({
  id: parseInt(c.id, 10),
  name: c.name,
  skills: c.skill_ids,
}));

// Build SKILLS record from JSON
export const SKILLS: Record<string, Skill> = Object.fromEntries(
  Object.entries(skillsData).map(([id, skill]: [string, FullSkill]) => [
    id,
    {
      id: skill.id,
      name: skill.name,
      cultivation: parseInt(skill.cultivation_id, 10),
      marker: skill.insight?.marker?.replace(/^\d+\s*-\s*/, '') || skill.name,
      hindrance: skill.insight?.hindrance?.replace(/^\d+\s*-\s*/, '') || '',
    },
  ])
);

// Full skills data for advanced usage
export const SKILLS_FULL: Record<SkillId, FullSkill> = skillsData as Record<SkillId, FullSkill>;
export const CULTIVATIONS_FULL: Record<CultivationId, FullCultivation> = cultivationsData as Record<CultivationId, FullCultivation>;

// Utility functions
export function getSkillNumber(skillId: string): number {
  return parseInt(skillId, 10);
}

export function isSkillCompleted(skillId: string, currentSkill: string): boolean {
  return getSkillNumber(skillId) < getSkillNumber(currentSkill);
}

export function isCurrentSkill(skillId: string, currentSkill: string): boolean {
  return skillId === currentSkill;
}

export function getSkill(skillId: string): Skill | undefined {
  return SKILLS[skillId];
}

export function getFullSkill(skillId: SkillId): FullSkill | undefined {
  return SKILLS_FULL[skillId];
}

export function getCultivation(cultivationId: number): CultivationType | undefined {
  return CULTIVATIONS.find(c => c.id === cultivationId);
}

export function getSkillsForCultivation(cultivationId: number): Skill[] {
  const cultivation = getCultivation(cultivationId);
  if (!cultivation) return [];
  return cultivation.skills.map(id => SKILLS[id]).filter(Boolean);
}
