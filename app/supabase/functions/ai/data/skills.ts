/**
 * MIDL Skills data for AI processing
 * Data imported from shared/skills.json (source of truth: data/midl-skills/*.md)
 */

import skillsData from "./skills.json" with { type: "json" };
import type { Skill as FullSkill, SkillId } from "./types.ts";

// Simplified type for AI prompts (backward compatible)
export type SkillData = {
  id: string;
  name: string;
  marker: string;
  hindrance: string;
  techniques: string[];
  progressionCriteria: string;
};

// Build SKILLS_DATA from JSON
export const SKILLS_DATA: Record<string, SkillData> = Object.fromEntries(
  Object.entries(skillsData).map(([id, skill]: [string, FullSkill]) => {
    // Extract techniques from instructions steps
    const techniques: string[] = [];
    if (skill.instructions?.steps) {
      for (const step of skill.instructions.steps) {
        // Extract key phrases from step titles
        if (step.title) {
          techniques.push(step.title.toLowerCase());
        }
      }
    }
    // Add some from tips if available
    if (skill.tips && skill.tips.length > 0) {
      techniques.push(...skill.tips.slice(0, 2).map(t => t.slice(0, 50)));
    }

    return [
      id,
      {
        id: skill.id,
        name: skill.name,
        marker: skill.insight?.marker || skill.name,
        hindrance: skill.insight?.hindrance || '',
        techniques: techniques.length > 0 ? techniques : [skill.name.toLowerCase()],
        progressionCriteria: skill.progression?.criteria || '',
      },
    ];
  })
);

// Full skills data for advanced AI usage
export const SKILLS_FULL: Record<SkillId, FullSkill> = skillsData as Record<SkillId, FullSkill>;

// Utility to get full skill
export function getSkill(skillId: string): FullSkill | undefined {
  return SKILLS_FULL[skillId as SkillId];
}

// Utility to get skill data for prompts
export function getSkillData(skillId: string): SkillData | undefined {
  return SKILLS_DATA[skillId];
}
