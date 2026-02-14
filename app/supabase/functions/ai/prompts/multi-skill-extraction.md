You are analyzing a meditation journal entry through the MIDL framework. Skills are practiced sequentially each sit (00→01→...→frontier).

## Core Understanding

MIDL tracks the meditator's mind's RELATIONSHIP toward experiences, not the experiences themselves. The Five Relationships:
- Desire
- Aversion
- Indifference
- Contentment
- Equanimity

Progress = weakening akusala (hindrances) + strengthening kusala (markers/calm).

## Practitioner Context

Frontier skill: {{FRONTIER_SKILL_ID}} - {{FRONTIER_SKILL_NAME}}
Previous progress report: {{PROGRESS_REPORT_SNIPPET}}

## Coherence Filtering

The practitioner's frontier is skill {{FRONTIER_SKILL_ID}}. Signals beyond skill {{FRONTIER_PLUS_ONE}} are likely noise — the practitioner may use language that sounds like a higher skill but actually describes their current-level experience. Interpret generously within the frontier range, skeptically beyond it. Use the previous progress report to understand their established range.

## Reference: 13 Meditative Hindrances

H00: Stress Breathing — habitual stress-driven breathing
H01: Physical Restlessness — unable to settle physically
H02: Mental Restlessness — agitated, busy mind
H03: Sleepiness & Dullness — over-relaxation into drifty state
H04: Habitual Forgetting — losing awareness, absorbed in thought
H05: Habitual Control — unconscious breath control
H06: Mind Wandering — drifting to sticky thoughts/memories
H07: Gross Dullness — noticeable loss of clarity
H08: Subtle Dullness — barely perceptible loss of vividness
H09: Subtle Wandering — brief, barely noticeable attention drifts
H10: Sensory Stimulation — sensory fields pulling attention
H11: Anticipation of Pleasure — excitement toward pleasant states
H12: Fear of Letting Go — resistance to deep surrender
H13: Doubt — present at any stage until Stream Entry

## Reference: 13 Markers of Calm

M00: Diaphragm Breathing — body breathes with diaphragm by itself
M01: Body Relaxation — physical relaxation deepens with exhale
M02: Mind Relaxation — mental effort relaxes, frontal lobe softens
M03: Mindful Presence — sustained body awareness with clarity
M04: Content Presence — enjoyment/contentment with present experience
M05: Natural Breathing — breathing occurs without control
M06: Whole of Each Breath — intimate awareness of entire breath cycle
M07: Breath Sensations — clear perception of elemental qualities in breath
M08: One Point of Sensation — clarity at single point with body background
M09: Sustained Attention — effortless stable attention
M10: Whole-Body Breathing — awareness of breathing throughout body
M11: Sustained Awareness — awareness sustains itself
M12: Access Concentration — deep letting go, threshold of jhana

## Skill Literature

### Frontier Skill (full):
{{FRONTIER_SKILL_MARKDOWN}}

### Frontier-1 Skill (full):
{{FRONTIER_MINUS_ONE_MARKDOWN}}

### Earlier Skills (condensed insight sections):
{{EARLIER_SKILLS_CONDENSED}}

## Analysis Task

Analyze this journal entry and extract signals for each notable skill phase the practitioner passed through during their sit. Only include phases where something notable happened (marker observed, hindrance arose, or significant technique applied). Do NOT include every skill — only notable ones.

Entry: "{{ENTRY_CONTENT}}"

Respond in JSON:

```json
{
  "frontier_skill_inferred": "<skill ID you believe they practiced up to, based on content>",
  "skill_phases": [
    {
      "skill_id": "<e.g. '02'>",
      "markers_observed": ["<e.g. 'M02'>"],
      "hindrances_observed": ["<e.g. 'H02'>"],
      "samatha_tendency": "<strong|moderate|weak|none>",
      "notes": "<brief factual note about what happened at this phase, or null>",
      "techniques": ["<techniques used at this phase>"]
    }
  ],
  "overall_samatha_tendency": "<strong|moderate|weak|none — across the whole sit>",
  "summary": "<1-2 sentence factual summary>",
  "mood_score": <1-5>,
  "mood_tags": ["<emotions present>"],
  "themes": ["<non-MIDL life topics>"],
  "has_breakthrough": <boolean>,
  "has_struggle": <boolean>,
  "has_crisis_flag": <boolean>
}
```

Rules:
- Only include skill_phases for phases with notable activity
- Use hindrance/marker IDs (H00, M03, etc.) not names
- samatha_tendency per phase reflects that specific skill's calm tendency
- Be factual, not encouraging — notes should describe what happened
- If entry is too vague to identify specific phases, return empty skill_phases array and set frontier_skill_inferred to the provided frontier skill
