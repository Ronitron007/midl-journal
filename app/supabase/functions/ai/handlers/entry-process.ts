import { OpenAIProvider } from '../providers/openai.ts';
import { SKILLS_DATA, getSkill } from '../data/skills.ts';
import type {
  AIRequest,
  AIResponse,
  EntryProcessPayload,
  ProcessedSignals,
  SkillPhase,
} from '../types.ts';
import { getSkillMarkdown } from '../data/skill-markdown.ts';
import { CHAT_TOOLS } from '../tools/definitions.ts';

/**
 * Build condensed insight section for earlier skills (00 to frontier-2).
 * Only marker, hindrance, and antidote — no full markdown.
 */
function getCondensedInsight(skillId: string): string {
  const skill = getSkill(skillId);
  if (!skill) return '';
  const ins = skill.insight;
  return `Skill ${skill.id} (${skill.name}): Marker: ${ins?.marker || 'N/A'} | Hindrance: ${ins?.hindrance || 'N/A'} | Antidote: ${ins?.antidote?.slice(0, 120) || 'N/A'}`;
}

/**
 * Derive flat backward-compat columns from the frontier skill's phase.
 * If no frontier phase exists, use the last notable phase or defaults.
 */
function deriveFlatColumns(
  phases: SkillPhase[],
  frontierSkillId: string,
  overallSamatha: string
): Partial<ProcessedSignals> {
  // Find frontier phase, or fall back to last phase
  const frontierPhase =
    phases.find((p) => p.skill_id === frontierSkillId) ||
    phases[phases.length - 1];

  if (!frontierPhase) {
    return {
      skill_analyzed: frontierSkillId,
      samatha_tendency:
        (overallSamatha as ProcessedSignals['samatha_tendency']) || 'none',
      marker_present: false,
      marker_notes: null,
      hindrance_present: false,
      hindrance_notes: null,
      hindrance_conditions: [],
      balance_approach: null,
      key_understanding: null,
      techniques_mentioned: [],
      progression_signals: [],
    };
  }

  return {
    skill_analyzed: frontierPhase.skill_id,
    samatha_tendency: frontierPhase.samatha_tendency,
    marker_present: frontierPhase.markers_observed.length > 0,
    marker_notes: frontierPhase.notes,
    hindrance_present: frontierPhase.hindrances_observed.length > 0,
    hindrance_notes: frontierPhase.notes,
    hindrance_conditions: [],
    balance_approach: null,
    key_understanding: null,
    techniques_mentioned: frontierPhase.techniques,
    progression_signals: [],
  };
}

export async function handleEntryProcess(req: AIRequest): Promise<AIResponse> {
  const payload = req.payload as EntryProcessPayload;
  const { entryId, content } = payload;
  const frontierSkill = payload.frontierSkill || payload.skillPracticed || '00';

  if (content.split(' ').length < 10) {
    return { skipped: true };
  }

  const skill = getSkill(frontierSkill) || getSkill('00')!;
  const frontierNum = parseInt(frontierSkill, 10);

  // Fetch user's progress_report for coherence context
  let progressReportSnippet = 'No previous report available.';
  try {
    const { data: user } = await req.supabase
      .from('users')
      .select('progress_report')
      .eq('id', req.userId)
      .single();

    if (user?.progress_report) {
      const report = user.progress_report as Record<string, unknown>;
      progressReportSnippet = JSON.stringify({
        frontier_skill: report.frontier_skill,
        overall_samatha_trend: report.overall_samatha_trend,
        recurring_hindrances: report.recurring_hindrances,
        progression_readiness: report.progression_readiness,
      });
    }
  } catch {
    // Continue without report
  }

  // Build prompt with selective markdown loading
  // Full markdown for frontier + frontier-1
  const frontierMarkdown = getSkillMarkdown(frontierSkill) || '';
  const prevSkillId =
    frontierNum > 0 ? String(frontierNum - 1).padStart(2, '0') : null;
  const prevMarkdown = prevSkillId ? getSkillMarkdown(prevSkillId) || '' : '';

  // Condensed insight sections for skills 00 to frontier-2
  const condensedParts: string[] = [];
  for (let i = 0; i <= frontierNum - 2; i++) {
    const sid = String(i).padStart(2, '0');
    condensedParts.push(getCondensedInsight(sid));
  }
  const earlierSkillsCondensed =
    condensedParts.length > 0
      ? condensedParts.join('\n')
      : 'N/A (frontier is skill 00 or 01)';

  const frontierPlusOne = String(frontierNum + 1).padStart(2, '0');

  const prompt = `You are analyzing a meditation journal entry through the MIDL framework. Skills are practiced sequentially each sit (00→01→...→frontier).

## Core Understanding

MIDL tracks the meditator's mind's RELATIONSHIP toward experiences, not the experiences themselves. The Five Relationships:
- Desire
- Aversion
- Indifference
- Contentment
- Equanimity

Progress = weakening akusala (hindrances) + strengthening kusala (markers/calm).

## Practitioner Context

Frontier skill: ${skill.id} - ${skill.name}
Previous progress report: ${progressReportSnippet}

## Coherence Filtering

The practitioner's frontier is skill ${skill.id}. Signals beyond skill ${frontierPlusOne} are likely noise — the practitioner may use language that sounds like a higher skill but actually describes their current-level experience. Interpret generously within the frontier range, skeptically beyond it.

## Reference: 13 Meditative Hindrances

H00: Stress Breathing | H01: Physical Restlessness | H02: Mental Restlessness
H03: Sleepiness & Dullness | H04: Habitual Forgetting | H05: Habitual Control
H06: Mind Wandering | H07: Gross Dullness | H08: Subtle Dullness
H09: Subtle Wandering | H10: Sensory Stimulation | H11: Anticipation of Pleasure
H12: Fear of Letting Go | H13: Doubt

## Reference: 13 Markers of Calm

M00: Diaphragm Breathing | M01: Body Relaxation | M02: Mind Relaxation
M03: Mindful Presence | M04: Content Presence | M05: Natural Breathing
M06: Whole of Each Breath | M07: Breath Sensations | M08: One Point of Sensation
M09: Sustained Attention | M10: Whole-Body Breathing | M11: Sustained Awareness
M12: Access Concentration

## Skill Literature

### Frontier Skill (${skill.id} - ${skill.name}):
${frontierMarkdown}

${
  prevSkillId
    ? `### Frontier-1 Skill (${prevSkillId}):
${prevMarkdown}`
    : ''
}

### Earlier Skills (condensed):
${earlierSkillsCondensed}

## Analysis Task

Analyze this journal entry and extract signals for each notable skill phase. Only include phases where something notable happened (marker observed, hindrance arose, or significant technique applied).

Entry: "${content}"

Respond in JSON:

{
  "frontier_skill_inferred": "<skill ID you believe they practiced up to>",
  "skill_phases": [
    {
      "skill_id": "<e.g. '02'>",
      "markers_observed": ["<e.g. 'M02'>"],
      "hindrances_observed": ["<e.g. 'H02'>"],
      "samatha_tendency": "<strong|moderate|weak|none>",
      "notes": "<brief factual note or null>",
      "techniques": ["<techniques used at this phase>"]
    }
  ],
  "overall_samatha_tendency": "<strong|moderate|weak|none>",
  "summary": "<1-2 sentence factual summary>",
  "mood_score": <1-5>,
  "mood_tags": ["<emotions>"],
  "themes": ["<non-MIDL life topics>"],
  "has_breakthrough": <boolean>,
  "has_struggle": <boolean>,
  "has_crisis_flag": <boolean>
}

Rules:
- Only include skill_phases for phases with notable activity
- Use hindrance/marker IDs (H00, M03, etc.)
- Be factual, not encouraging
- If entry is too vague, return empty skill_phases and set frontier_skill_inferred to "${skill.id}"`;

  const provider = new OpenAIProvider();

  try {
    const { content: result, tool_calls } = await provider.completeWithTools({
      messages: [{ role: 'user', content: prompt }],
      tools: CHAT_TOOLS,
      maxTokens: 800,
      jsonMode: true,
    });

    const parsed = JSON.parse(result || '{}');
    const skillPhases: SkillPhase[] = parsed.skill_phases || [];

    // Derive flat columns from frontier phase for backward compat
    const flatColumns = deriveFlatColumns(
      skillPhases,
      parsed.frontier_skill_inferred || frontierSkill,
      parsed.overall_samatha_tendency
    );

    const signals: ProcessedSignals = {
      frontier_skill_inferred: parsed.frontier_skill_inferred || frontierSkill,
      skill_phases: skillPhases.length > 0 ? skillPhases : null,
      skill_analyzed: flatColumns.skill_analyzed || frontierSkill,
      samatha_tendency:
        flatColumns.samatha_tendency ||
        parsed.overall_samatha_tendency ||
        'none',
      marker_present: flatColumns.marker_present || false,
      marker_notes: flatColumns.marker_notes || null,
      hindrance_present: flatColumns.hindrance_present || false,
      hindrance_notes: flatColumns.hindrance_notes || null,
      hindrance_conditions: flatColumns.hindrance_conditions || [],
      balance_approach: flatColumns.balance_approach || null,
      key_understanding: flatColumns.key_understanding || null,
      techniques_mentioned: flatColumns.techniques_mentioned || [],
      progression_signals: flatColumns.progression_signals || [],
      summary: parsed.summary || '',
      mood_score: parsed.mood_score || 3,
      mood_tags: parsed.mood_tags || [],
      themes: parsed.themes || [],
      has_breakthrough: parsed.has_breakthrough || false,
      has_struggle: parsed.has_struggle || false,
      has_crisis_flag: parsed.has_crisis_flag || false,
    };

    // Update entry with all signals + new columns
    await req.supabase
      .from('entries')
      .update({
        // New multi-skill columns
        frontier_skill: signals.frontier_skill_inferred,
        skill_phases: signals.skill_phases,
        // Flat columns (backward compat)
        skill_analyzed: signals.skill_analyzed,
        samatha_tendency: signals.samatha_tendency,
        marker_present: signals.marker_present,
        marker_notes: signals.marker_notes,
        hindrance_present: signals.hindrance_present,
        hindrance_notes: signals.hindrance_notes,
        hindrance_conditions: signals.hindrance_conditions,
        balance_approach: signals.balance_approach,
        key_understanding: signals.key_understanding,
        techniques_mentioned: signals.techniques_mentioned,
        progression_signals: signals.progression_signals,
        // Generic
        summary: signals.summary,
        mood_score: signals.mood_score,
        mood_tags: signals.mood_tags,
        themes: signals.themes,
        has_breakthrough: signals.has_breakthrough,
        has_struggle: signals.has_struggle,
        has_crisis_flag: signals.has_crisis_flag,
        processed_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    return { signals };
  } catch (error) {
    console.error('Entry process error:', error);
    return { error: 'Processing failed' };
  }
}
