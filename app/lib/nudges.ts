import { supabase } from './supabase';
import { SKILLS } from './midl-skills';
import { SamathaTendency } from './entries';

/**
 * Nudges aligned with Stephen's post-meditation reflection framework:
 * 1. What was your mind's tendency towards relaxation and calm (samatha)?
 * 2. What did you understand, what did you experience?
 * 3. What was the dominant hindrance?
 * 4. What conditions led to it?
 * 5. Your understanding to bring them to balance
 * 6. Use this as your curiosity for next session
 */

// Skill-specific prompts reframed around Stephen's questions
const SKILL_PROMPTS: Record<
  string,
  {
    samatha: string[]; // Tendency toward relaxation/calm
    understanding: string[]; // What did you understand/experience
    hindrance: string[]; // What was the dominant hindrance
    conditions: string[]; // What conditions led to it
    balance: string[]; // How to bring balance
    curiosity: string[]; // Be curious about...
  }
> = {
  '00': {
    samatha: [
      "What was your mind's tendency toward relaxation today?",
      'How did calm develop as you breathed with your diaphragm?',
    ],
    understanding: [
      'What did you understand about the relationship between breathing and calm?',
      'What did you experience when breathing slowed?',
    ],
    hindrance: [
      'Did stress breathing arise? What was that experience like?',
      'Was there tension or strain in your breathing?',
    ],
    conditions: [
      'What conditions led to chest breathing? (rushed, anxious, tired?)',
      'Be curious: what triggers stress breathing for you?',
    ],
    balance: [
      'How did you work with stress breathing when it arose?',
      'What helped you return to belly breathing?',
    ],
    curiosity: [
      'Be curious about how breathing in your chest feels vs your belly',
      'Notice: what happens in your body when you slow your exhale?',
    ],
  },
  '01': {
    samatha: [
      "What was your body's tendency toward relaxation today?",
      'How did physical ease develop during your practice?',
    ],
    understanding: [
      'What did you understand about tension in your body?',
      'What did you experience as your body softened?',
    ],
    hindrance: [
      'Did restlessness or urges to move arise?',
      'Where did you notice physical tension holding?',
    ],
    conditions: [
      'What conditions led to restlessness? (caffeine, worry, discomfort?)',
      'Be curious: what triggers the urge to fidget?',
    ],
    balance: [
      'How did you work with the urge to move?',
      'What helped your body settle?',
    ],
    curiosity: [
      'Be curious about where tension hides in your body',
      'Notice: what happens when you soften with each out-breath?',
    ],
  },
  '02': {
    samatha: [
      "What was your mind's tendency toward stillness today?",
      'How did mental quiet develop?',
    ],
    understanding: [
      'What did you understand about your thinking patterns?',
      'What did you experience when thoughts settled?',
    ],
    hindrance: [
      'Did mental restlessness or busy thinking arise?',
      'What was the quality of intrusive thoughts?',
    ],
    conditions: [
      'What conditions led to mental agitation? (planning, worrying, problem-solving?)',
      'Be curious: what feeds the busy mind?',
    ],
    balance: [
      'How did you work with racing thoughts?',
      'What helped create space around thinking?',
    ],
    curiosity: [
      'Be curious about the space between thoughts',
      'Notice: what happens when you soften interest in thinking?',
    ],
  },
  '03': {
    samatha: [
      'What was your tendency toward present-moment awareness?',
      'How did mindful presence develop?',
    ],
    understanding: [
      'What did you understand about staying present?',
      'What did you experience in clear awareness?',
    ],
    hindrance: [
      'Did sleepiness or dullness arise?',
      'When did your mind become foggy or unclear?',
    ],
    conditions: [
      'What conditions led to dullness? (tired, overeating, time of day?)',
      'Be curious: what causes clarity to fade?',
    ],
    balance: [
      'How did you work with sleepiness?',
      'What helped restore alertness?',
    ],
    curiosity: [
      'Be curious about the difference between relaxation and dullness',
      'Notice: what brightens your awareness when it dims?',
    ],
  },
  '04': {
    samatha: [
      'What was your tendency toward contentment today?',
      'How did ease with simply being develop?',
    ],
    understanding: [
      'What did you understand about contentment?',
      'What did you experience in moments of ease?',
    ],
    hindrance: [
      'Did you keep forgetting to be mindful?',
      'How long were the gaps of forgetting?',
    ],
    conditions: [
      'What conditions led to forgetting? (interesting thoughts, drowsiness?)',
      'Be curious: what pulls you away from presence?',
    ],
    balance: [
      'How did you work with habitual forgetting?',
      'What helped you return to presence more quickly?',
    ],
    curiosity: [
      'Be curious about the pleasure in letting go',
      'Notice: what does contentment actually feel like?',
    ],
  },
  '05': {
    samatha: [
      "What was your breathing's tendency toward naturalness?",
      'How did effortless breathing develop?',
    ],
    understanding: [
      'What did you understand about letting go of control?',
      'What did you experience when breathing happened by itself?',
    ],
    hindrance: [
      'Did you catch yourself controlling the breath?',
      'When did the urge to manage breathing arise?',
    ],
    conditions: [
      'What conditions led to controlling? (wanting particular experience, impatience?)',
      'Be curious: what drives the need to control?',
    ],
    balance: [
      'How did you release control when you noticed it?',
      'What helped you trust natural breathing?',
    ],
    curiosity: [
      'Be curious about breathing that breathes itself',
      'Notice: what changes when you stop managing?',
    ],
  },
  '06': {
    samatha: ['How did sustained breath awareness develop?'],
    understanding: [
      'What did you understand about attention?',
      'What did you experience following whole breaths?',
    ],
    hindrance: [
      'When did mind wandering pull you away?',
      'Where did your attention go when it drifted?',
    ],
    conditions: [
      'What conditions led to wandering? (boredom, interesting thoughts?)',
      'Be curious: what makes attention slip away?',
    ],
    balance: [
      'How did you work with wandering mind?',
      'What helped you stay with each breath?',
    ],
    curiosity: [
      'Be curious about the whole length of each breath',
      "Notice: what's different about in-breath and out-breath?",
    ],
  },
  '07': {
    samatha: [
      "What was your perception's tendency toward clarity?",
      'How did sensitivity to breath sensations develop?',
    ],
    understanding: [
      'What did you understand about subtle sensations?',
      'What did you experience in the texture of breathing?',
    ],
    hindrance: [
      'Did dullness make sensations hard to perceive?',
      'When did clarity fade?',
    ],
    conditions: [
      'What conditions led to dullness? (fatigue, forcing?)',
      'Be curious: what causes perception to blur?',
    ],
    balance: [
      'How did you work with unclear perception?',
      'What sharpened your awareness of sensations?',
    ],
    curiosity: [
      'Be curious about temperature, texture, movement in the breath',
      "Notice: what's the elemental quality of breathing?",
    ],
  },
  '08': {
    samatha: [
      "What was your focus's tendency toward stability?",
      'How did one-pointed attention develop?',
    ],
    understanding: [
      'What did you understand about concentrated attention?',
      'What did you experience at one point of sensation?',
    ],
    hindrance: [
      'Did subtle fogginess affect your focus?',
      'When did attention become less sharp?',
    ],
    conditions: [
      'What conditions led to subtle dullness?',
      'Be curious: what causes sharpness to soften?',
    ],
    balance: [
      'How did you restore clarity?',
      'What helped attention stay bright and focused?',
    ],
    curiosity: [
      'Be curious about the clearest point of breath sensation',
      'Notice: what deepens when you rest on one point?',
    ],
  },
  '09': {
    samatha: [
      "What was your attention's tendency toward sustained stability?",
      'How did continuous presence develop?',
    ],
    understanding: [
      'What did you understand about effortless attention?',
      'What did you experience in sustained awareness?',
    ],
    hindrance: [
      'Were there subtle movements of attention away?',
      'What very subtle wandering occurred?',
    ],
    conditions: [
      'What conditions led to subtle shifting?',
      'Be curious: what causes even small movements away?',
    ],
    balance: [
      'How did you work with subtle instability?',
      'What helped attention become truly steady?',
    ],
    curiosity: [
      'Be curious about attention that needs no effort',
      'Notice: what does stable attention feel like?',
    ],
  },
  '10': {
    samatha: [
      "What was your awareness's tendency to fill the body?",
      'How did whole-body breathing develop?',
    ],
    understanding: [
      'What did you understand about unified body awareness?',
      'What did you experience breathing through your whole body?',
    ],
    hindrance: [
      'Did external stimuli pull your attention?',
      'Were sounds or sensations distracting?',
    ],
    conditions: [
      'What conditions led to distraction? (sounds, temperature?)',
      'Be curious: what draws attention outward?',
    ],
    balance: [
      'How did you work with external distractions?',
      'What helped awareness stay internal?',
    ],
    curiosity: [
      'Be curious about breathing that fills every cell',
      'Notice: what happens when the senses withdraw inward?',
    ],
  },
  '11': {
    samatha: [
      'What was your tendency toward sustained pleasant awareness?',
      'How did intimacy with pleasantness develop?',
    ],
    understanding: [
      'What did you understand about pleasant states?',
      'What did you experience in continuous awareness?',
    ],
    hindrance: [
      'Did anticipation or grasping for pleasure arise?',
      'When did wanting disturb the pleasantness?',
    ],
    conditions: [
      'What conditions led to anticipation?',
      'Be curious: what drives grasping for pleasant states?',
    ],
    balance: [
      'How did you work with anticipation?',
      'What helped you rest in pleasantness without grasping?',
    ],
    curiosity: [
      'Be curious about pleasure that comes without seeking',
      'Notice: what happens when you stop anticipating?',
    ],
  },
  '12': {
    samatha: [
      'What was your tendency toward access concentration?',
      'How did unified awareness develop?',
    ],
    understanding: [
      'What did you understand at the gateway to deeper states?',
      'What did you experience in stable access?',
    ],
    hindrance: [
      'Did fear of letting go arise?',
      'Was there resistance to going deeper?',
    ],
    conditions: [
      'What conditions led to fear or resistance?',
      'Be curious: what holds you back from letting go?',
    ],
    balance: [
      'How did you work with fear of depth?',
      'What helped you trust letting go?',
    ],
    curiosity: [
      "Be curious about what's beyond letting go",
      'Notice: what does safety in depth feel like?',
    ],
  },
  '13': {
    samatha: [
      'What was your tendency toward absorption in pleasure?',
      'How did jhanic bliss develop?',
    ],
    understanding: [
      'What did you understand about piti?',
      'What did you experience in blissful absorption?',
    ],
    hindrance: [
      'Did attachment to the pleasure arise?',
      'When did clinging disturb the jhana?',
    ],
    conditions: [
      'What conditions led to attachment?',
      'Be curious: what causes grasping at bliss?',
    ],
    balance: [
      'How did you work with attachment to pleasure?',
      'What helped you rest in bliss without holding?',
    ],
    curiosity: [
      'Be curious about bliss that pervades the body',
      'Notice: what happens when piti is not grasped?',
    ],
  },
  '14': {
    samatha: [
      'What was your tendency toward refined happiness?',
      'How did sukha develop?',
    ],
    understanding: [
      'What did you understand about the shift from piti to sukha?',
      'What did you experience in refined happiness?',
    ],
    hindrance: [
      'Was there subtle restless energy?',
      'Did agitation arise within the jhana?',
    ],
    conditions: [
      'What conditions led to subtle restlessness?',
      'Be curious: what disturbs deep happiness?',
    ],
    balance: [
      'How did you work with subtle agitation?',
      'What helped happiness refine further?',
    ],
    curiosity: [
      'Be curious about happiness without excitement',
      'Notice: what is sukha like compared to piti?',
    ],
  },
  '15': {
    samatha: [
      'What was your tendency toward equanimous contentment?',
      'How did peaceful contentment develop?',
    ],
    understanding: [
      'What did you understand about contentment beyond happiness?',
      'What did you experience in equanimous peace?',
    ],
    hindrance: [
      'Was there subtle discontent or seeking?',
      'Did the mind want more stimulation?',
    ],
    conditions: [
      'What conditions led to subtle dissatisfaction?',
      'Be curious: what causes contentment to waver?',
    ],
    balance: [
      'How did you work with subtle discontent?',
      'What helped you rest in simple contentment?',
    ],
    curiosity: [
      'Be curious about satisfaction without excitement',
      'Notice: what is peace beyond happiness like?',
    ],
  },
  '16': {
    samatha: [
      'What was your tendency toward profound stillness?',
      'How did complete equanimity develop?',
    ],
    understanding: [
      'What did you understand about equanimity?',
      'What did you experience in profound stillness?',
    ],
    hindrance: [
      'Were very subtle preferences present?',
      'Did even faint likes/dislikes remain?',
    ],
    conditions: [
      'What conditions maintain subtle preferences?',
      'Be curious: what prevents complete letting go?',
    ],
    balance: [
      'How did you work with subtle preferences?',
      'What helped you release even the subtlest holding?',
    ],
    curiosity: [
      'Be curious about stillness beyond preference',
      'Notice: what remains when preferences dissolve?',
    ],
  },
};

export type NudgeType =
  | 'samatha'
  | 'understanding'
  | 'hindrance'
  | 'conditions'
  | 'balance'
  | 'curiosity'
  | 'pattern';

export type Nudge = {
  type: NudgeType;
  text: string;
  priority: number;
};

type HistoryPattern = {
  hindranceCount: number;
  commonConditions: string[];
  recentConditions: string[]; // Conditions from most recent hindrance (even if not repeated)
  recentBalanceApproaches: string[];
  avgSamathaTendency: SamathaTendency | null;
};

/**
 * Fetch recent entries to analyze patterns
 * First tries current skill, falls back to all recent entries if insufficient
 */
async function getRecentSkillHistory(
  userId: string,
  skillId: string,
  limit = 10
): Promise<
  {
    hindrance_present: boolean;
    hindrance_conditions: string[] | null;
    balance_approach: string | null;
    samatha_tendency: SamathaTendency | null;
  }[]
> {
  // First try: entries for current skill only
  const { data: skillEntries } = await supabase
    .from('entries')
    .select(
      'hindrance_present, hindrance_conditions, balance_approach, samatha_tendency'
    )
    .eq('user_id', userId)
    .eq('type', 'reflect') // Only reflect entries have MIDL signals
    .eq('skill_practiced', skillId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // If we have enough entries for pattern detection (2+), use them
  if (skillEntries && skillEntries.length >= 2) {
    return skillEntries;
  }

  // Fallback: get recent entries across all skills for broader patterns
  const { data: allEntries } = await supabase
    .from('entries')
    .select(
      'hindrance_present, hindrance_conditions, balance_approach, samatha_tendency'
    )
    .eq('user_id', userId)
    .eq('type', 'reflect')
    .order('created_at', { ascending: false })
    .limit(limit);

  return allEntries || [];
}

/**
 * Analyze patterns from history
 */
function analyzePatterns(
  entries: {
    hindrance_present: boolean;
    hindrance_conditions: string[] | null;
    balance_approach: string | null;
    samatha_tendency: SamathaTendency | null;
  }[]
): HistoryPattern {
  const hindranceEntries = entries.filter((e) => e.hindrance_present);

  // Find common conditions
  const conditionCounts: Record<string, number> = {};
  hindranceEntries.forEach((e) => {
    e.hindrance_conditions?.forEach((c) => {
      conditionCounts[c] = (conditionCounts[c] || 0) + 1;
    });
  });
  const commonConditions = Object.entries(conditionCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([condition]) => condition)
    .slice(0, 3);

  // Get conditions from most recent hindrance entry (for single-entry personalization)
  const recentConditions =
    hindranceEntries[0]?.hindrance_conditions?.slice(0, 3) || [];

  // Get recent successful balance approaches
  const recentBalanceApproaches = entries
    .map((e) => e.balance_approach)
    .filter((a): a is string => !!a)
    .slice(0, 2);

  // Calculate average samatha tendency
  const tendencyOrder: SamathaTendency[] = [
    'none',
    'weak',
    'moderate',
    'strong',
  ];
  const validTendencies = entries
    .map((e) => e.samatha_tendency)
    .filter((t): t is SamathaTendency => !!t);

  let avgSamathaTendency: SamathaTendency | null = null;
  if (validTendencies.length > 0) {
    const avgIndex = Math.round(
      validTendencies.reduce((sum, t) => sum + tendencyOrder.indexOf(t), 0) /
        validTendencies.length
    );
    avgSamathaTendency = tendencyOrder[avgIndex];
  }

  return {
    hindranceCount: hindranceEntries.length,
    commonConditions,
    recentConditions,
    recentBalanceApproaches,
    avgSamathaTendency,
  };
}

/**
 * Generate nudges for a reflection session
 */
export async function generateNudges(
  userId: string,
  skillId: string
): Promise<Nudge[]> {
  const nudges: Nudge[] = [];
  const prompts = SKILL_PROMPTS[skillId] || SKILL_PROMPTS['00'];
  const skillName = SKILLS[skillId]?.name || 'this skill';
  const hindrance = SKILLS[skillId]?.hindrance || '';

  // 1. Always start with samatha question (Stephen's first question)
  nudges.push({
    type: 'samatha',
    text: prompts.samatha[0],
    priority: 10,
  });

  // 2. Fetch and analyze history
  const history = await getRecentSkillHistory(userId, skillId);
  const patterns = analyzePatterns(history);

  // Debug: log what we found
  console.log('[nudges] history entries:', history.length);
  console.log(
    '[nudges] first 3 entries:',
    JSON.stringify(history.slice(0, 3), null, 2)
  );
  console.log('[nudges] patterns:', JSON.stringify(patterns));

  // 3. Pattern nudges based on hindrance history
  if (patterns.hindranceCount >= 2 && patterns.commonConditions.length > 0) {
    // Recurring pattern with common conditions
    const conditionText = patterns.commonConditions.slice(0, 2).join(' or ');
    nudges.push({
      type: 'pattern',
      text: `You've noticed the hindrance; ${hindrance} arising when ${conditionText}. Watch for these conditions today.`,
      priority: 15,
    });
  } else if (patterns.hindranceCount >= 2) {
    // Multiple hindrance sessions but no common conditions yet
    nudges.push({
      type: 'pattern',
      text: `The hindrance; ${hindrance} has arisen in ${patterns.hindranceCount} recent sessions. Be curious: what conditions lead to it?`,
      priority: 15,
    });
  } else if (
    patterns.hindranceCount === 1 &&
    patterns.recentConditions.length > 0
  ) {
    // Single hindrance entry with conditions - still personalize
    const conditionText = patterns.recentConditions.slice(0, 2).join(' or ');
    nudges.push({
      type: 'pattern',
      text: `Last time, the hindrance; ${hindrance} arose when ${conditionText}. Notice if similar conditions are present.`,
      priority: 14,
    });
  }

  // 4. If they found helpful balance approaches, reference them
  if (patterns.recentBalanceApproaches.length > 0) {
    nudges.push({
      type: 'balance',
      text: `Last time, you found: "${patterns.recentBalanceApproaches[0]}". Did that help today?`,
      priority: 12,
    });
  } else {
    // Otherwise ask generic balance question
    nudges.push({
      type: 'balance',
      text: prompts.balance[0],
      priority: 8,
    });
  }

  // 5. Add understanding question (Stephen's "what did you understand?")
  nudges.push({
    type: 'understanding',
    text: prompts.understanding[0],
    priority: 9,
  });

  // 6. Add curiosity prompt for next session connection
  const randomCuriosity =
    prompts.curiosity[Math.floor(Math.random() * prompts.curiosity.length)];
  nudges.push({
    type: 'curiosity',
    text: randomCuriosity,
    priority: 6,
  });

  // Sort by priority and return top 4
  return nudges.sort((a, b) => b.priority - a.priority).slice(0, 4);
}

/**
 * Get static nudges without DB call (for immediate display)
 */
export function getStaticNudges(skillId: string): Nudge[] {
  const prompts = SKILL_PROMPTS[skillId] || SKILL_PROMPTS['00'];

  return [
    { type: 'samatha', text: prompts.samatha[0], priority: 10 },
    { type: 'understanding', text: prompts.understanding[0], priority: 9 },
  ];
}
