# Signals Redesign: MIDL-Aligned Entry Processing

> **Status:** COMPLETE
> **Date:** 2026-01-30
> **Part of:** App Redesign Series (1 of 4)

## Problem

Current entry processing extracts **generic signals** (mood, themes) that aren't aligned with MIDL methodology. This makes it impossible to:
- Show meaningful skill-specific labels on entries
- Generate nudges based on past skill struggles
- Determine skill progression automatically

## Solution

Redesign ProcessedSignals to be **skill-aware**:
1. User selects which skill they practiced (defaults to current_skill)
2. Entry-process handler loads that skill's marker/hindrance
3. AI analyzes entry against skill-specific criteria
4. Both MIDL-specific AND generic signals are extracted

## New ProcessedSignals Schema

```typescript
type ProcessedSignals = {
  // === MIDL-SPECIFIC (primary) ===
  skill_analyzed: string;         // skill ID this was evaluated against
  marker_present: boolean;        // showed the skill's marker?
  marker_notes: string | null;    // observation about marker
  hindrance_present: boolean;     // struggled with skill's hindrance?
  hindrance_notes: string | null; // observation about hindrance
  techniques_mentioned: string[]; // skill-specific techniques (e.g., "belly breathing", "GOSS")
  progression_signals: string[];  // signs of readiness to advance

  // === GENERIC (secondary) ===
  summary: string;
  mood_score: number;             // 1-5
  mood_tags: string[];
  themes: string[];               // non-MIDL life topics
  has_breakthrough: boolean;
  has_struggle: boolean;
  has_crisis_flag: boolean;
};
```

## Database Changes

Add new columns to `entries` table:

```sql
ALTER TABLE entries ADD COLUMN IF NOT EXISTS skill_analyzed TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS marker_present BOOLEAN;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS marker_notes TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS hindrance_present BOOLEAN;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS hindrance_notes TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS techniques_mentioned TEXT[];
ALTER TABLE entries ADD COLUMN IF NOT EXISTS progression_signals TEXT[];
```

## UI Changes

### Reflect Screen (`reflect.tsx`)

Add skill picker to details section:
- Label: "Skill practiced"
- Type: Dropdown/picker showing all 17 skills
- Default: User's `current_skill` from profile
- Display format: "00 - Diaphragmatic Breathing"

### Entry Detail Screen (`entry/[id].tsx`)

Display new signals:
- Marker/hindrance badges with notes
- Techniques as chips
- Progression signals section (if any)

## Entry-Process Handler Changes

### New Flow

1. Receive `entryId`, `content`, `skillPracticed`
2. Load skill data from `SKILLS_DATA[skillPracticed]`
3. Build skill-aware prompt with:
   - Skill name, marker, hindrance
   - Key techniques for that skill
   - Progression criteria
4. Extract both MIDL and generic signals
5. Save all fields to entry

### Prompt Template

```
You are analyzing a meditation journal entry for someone practicing MIDL Skill ${skillId}: ${skillName}.

For this skill:
- MARKER (success sign): ${marker}
- HINDRANCE (struggle sign): ${hindrance}
- KEY TECHNIQUES: ${techniques}
- PROGRESSION CRITERIA: ${progressionCriteria}

Analyze this entry and extract:

MIDL-SPECIFIC:
1. marker_present (boolean): Did they demonstrate ${marker}?
2. marker_notes (string): Brief observation about marker presence/absence
3. hindrance_present (boolean): Did they struggle with ${hindrance}?
4. hindrance_notes (string): Brief observation about hindrance
5. techniques_mentioned (string[]): Which techniques from this skill did they mention?
6. progression_signals (string[]): Any signs they're ready to advance?

GENERIC:
7. summary (string): 1-2 sentence summary
8. mood_score (1-5): Overall emotional tone
9. mood_tags (string[]): Emotions present
10. themes (string[]): Non-MIDL life topics mentioned
11. has_breakthrough (boolean): Describes a breakthrough moment?
12. has_struggle (boolean): Describes significant difficulty?
13. has_crisis_flag (boolean): Contains crisis language?

Entry: "${content}"

Respond in JSON format.
```

## Data Requirements

Need to make `midl_skills_complete.json` accessible to the edge function. Options:
1. **Embed in handler** - Copy relevant fields into handler code
2. **Fetch from storage** - Store JSON in Supabase storage
3. **Environment variable** - Too large, not practical

**Recommendation:** Embed a minimal version with just the fields needed for prompts:
- id, name, marker, hindrance
- techniques (extract from instructions_summary)
- progression criteria

## Files to Modify

| File | Changes |
|------|---------|
| `app/lib/entries.ts` | Update Entry type with new fields |
| `app/lib/ai.ts` | Update ProcessedSignals type |
| `app/app/(main)/reflect.tsx` | Add skill picker UI, pass to createEntry |
| `app/app/(main)/entry/[id].tsx` | Display new signal fields |
| `supabase/functions/ai/handlers/entry-process.ts` | New skill-aware prompt |
| `supabase/functions/ai/types.ts` | Update ProcessedSignals type |
| `supabase/migrations/005_add_signal_columns.sql` | New DB columns |

## Testing Plan

1. Create test entries for skill 00 (Diaphragmatic Breathing):
   - Entry showing marker: "My belly breathing felt natural today"
   - Entry showing hindrance: "Kept breathing in my chest, felt anxious"
   - Entry with techniques: "Used slow exhales to calm down"

2. Verify signals are correctly extracted and saved

3. Verify UI displays signals correctly

## Downstream Impact

This work enables:
- **Entry Display (Part 2):** Can show skill-specific badges and notes
- **Nudges (Part 3):** Can query past hindrance patterns for personalized prompts
- **Progression (Part 4):** Can count marker_present sessions to determine advancement

---

## Progress Log

- [x] Schema designed
- [x] Design doc written
- [x] Skill picker UI added to reflect screen
- [x] Entry-process handler updated
- [x] Types & DB schema updated
- [x] Entry detail screen updated to display signals
- [ ] Deploy and test with sample entries
- [x] Handoff doc created
