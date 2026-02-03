import { supabase } from './supabase';
import { CULTIVATIONS } from './midl-skills';
import { ai } from './ai';

export type ProgressionStats = {
  skillId: string;
  markerCount: number;           // sessions where marker_present = true
  strongSamathaCount: number;    // sessions with samatha_tendency = 'strong'
  hasProgressionSignals: boolean; // any progression_signals detected
  totalSessions: number;         // total sessions for this skill
  readyToAdvance: boolean;       // meets all criteria
  nextSkillId: string | null;    // null if at final skill
};

// Minimum requirements for advancement
const ADVANCEMENT_CRITERIA = {
  minMarkerSessions: 3,          // at least 3 sessions with marker present
  minStrongSamatha: 2,           // at least 2 sessions with strong samatha
  requireProgressionSignals: true // need at least one progression signal
};

// Get the next skill in sequence
export function getNextSkill(currentSkillId: string): string | null {
  const allSkills = CULTIVATIONS.flatMap(c => c.skills);
  const currentIndex = allSkills.indexOf(currentSkillId);
  if (currentIndex === -1 || currentIndex >= allSkills.length - 1) {
    return null;
  }
  return allSkills[currentIndex + 1];
}

// Calculate progression stats for current skill
export async function getProgressionStats(
  userId: string,
  skillId: string
): Promise<ProgressionStats> {
  // Fetch entries for this skill
  const { data: entries, error } = await supabase
    .from('entries')
    .select('marker_present, samatha_tendency, progression_signals')
    .eq('user_id', userId)
    .eq('skill_practiced', skillId)
    .eq('type', 'reflect')
    .order('created_at', { ascending: false })
    .limit(50); // look at recent history

  if (error || !entries) {
    console.error('Error fetching progression stats:', error);
    return {
      skillId,
      markerCount: 0,
      strongSamathaCount: 0,
      hasProgressionSignals: false,
      totalSessions: 0,
      readyToAdvance: false,
      nextSkillId: getNextSkill(skillId),
    };
  }

  const markerCount = entries.filter(e => e.marker_present === true).length;
  const strongSamathaCount = entries.filter(e => e.samatha_tendency === 'strong').length;
  const hasProgressionSignals = entries.some(
    e => e.progression_signals && e.progression_signals.length > 0
  );

  const readyToAdvance =
    markerCount >= ADVANCEMENT_CRITERIA.minMarkerSessions &&
    strongSamathaCount >= ADVANCEMENT_CRITERIA.minStrongSamatha &&
    (!ADVANCEMENT_CRITERIA.requireProgressionSignals || hasProgressionSignals);

  return {
    skillId,
    markerCount,
    strongSamathaCount,
    hasProgressionSignals,
    totalSessions: entries.length,
    readyToAdvance,
    nextSkillId: getNextSkill(skillId),
  };
}

// Calculate progress percentage (0-100)
export function getProgressPercentage(stats: ProgressionStats): number {
  const { minMarkerSessions, minStrongSamatha } = ADVANCEMENT_CRITERIA;

  // Weight: 50% marker, 30% samatha, 20% progression signals
  const markerProgress = Math.min(stats.markerCount / minMarkerSessions, 1) * 50;
  const samathaProgress = Math.min(stats.strongSamathaCount / minStrongSamatha, 1) * 30;
  const signalProgress = stats.hasProgressionSignals ? 20 : 0;

  return Math.round(markerProgress + samathaProgress + signalProgress);
}

// Advance user to next skill
export async function advanceToNextSkill(
  userId: string,
  currentSkillId: string
): Promise<{ success: boolean; newSkillId?: string; error?: string }> {
  const nextSkillId = getNextSkill(currentSkillId);

  if (!nextSkillId) {
    return { success: false, error: 'Already at final skill' };
  }

  // Verify user is ready (double-check)
  const stats = await getProgressionStats(userId, currentSkillId);
  if (!stats.readyToAdvance) {
    return { success: false, error: 'Progression criteria not met' };
  }

  // Update user profile
  const { error } = await supabase
    .from('users')
    .update({
      current_skill: nextSkillId,
      stats: {
        // Reset current_skill_days for new skill
        current_skill_days: 1,
      },
    })
    .eq('id', userId);

  if (error) {
    console.error('Error advancing skill:', error);
    return { success: false, error: 'Failed to update profile' };
  }

  // Regenerate pre-sit guidance with new skill content
  ai.generateContextSummary('check_and_generate').catch(console.error);

  return { success: true, newSkillId: nextSkillId };
}

// Get readable description of what's needed
export function getProgressDescription(stats: ProgressionStats): string {
  const { minMarkerSessions, minStrongSamatha } = ADVANCEMENT_CRITERIA;
  const parts: string[] = [];

  if (stats.markerCount < minMarkerSessions) {
    const needed = minMarkerSessions - stats.markerCount;
    parts.push(`${needed} more marker session${needed > 1 ? 's' : ''}`);
  }

  if (stats.strongSamathaCount < minStrongSamatha) {
    const needed = minStrongSamatha - stats.strongSamathaCount;
    parts.push(`${needed} more strong samatha session${needed > 1 ? 's' : ''}`);
  }

  if (!stats.hasProgressionSignals && ADVANCEMENT_CRITERIA.requireProgressionSignals) {
    parts.push('progression signals to appear');
  }

  if (parts.length === 0) {
    return 'Ready to advance!';
  }

  return `Need: ${parts.join(', ')}`;
}
