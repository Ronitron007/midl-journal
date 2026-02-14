# Stephen's Framework Integration - Handoff

## Summary

Redesigned entry processing, nudges, and display to align with Stephen's post-meditation reflection framework:

1. What was your mind's tendency towards relaxation and calm (samatha)?
2. What did you understand, what did you experience?
3. What was the dominant hindrance?
4. What conditions led to it?
5. Your understanding to bring them to balance

## Changes Made

### 1. Entry Processing (`supabase/functions/ai/handlers/entry-process.ts`)

Updated AI prompt to extract Stephen's framework signals:

- `samatha_tendency`: 'strong' | 'moderate' | 'weak' | 'none' (nuanced, not binary)
- `marker_present` / `marker_notes`: skill-specific marker experience
- `hindrance_present` / `hindrance_notes`: hindrance description
- `hindrance_conditions`: string[] - what triggered the hindrance
- `balance_approach`: how they worked with the hindrance
- `key_understanding`: insight or learning gained
- `techniques_mentioned`: skill techniques used
- `progression_signals`: signs of skill advancement

### 2. Types Updated

**`supabase/functions/ai/types.ts`**:

```typescript
export type SamathaTendency = 'strong' | 'moderate' | 'weak' | 'none';

export type ProcessedSignals = {
  skill_analyzed: string;
  samatha_tendency: SamathaTendency;
  marker_present: boolean;
  marker_notes: string | null;
  hindrance_present: boolean;
  hindrance_notes: string | null;
  hindrance_conditions: string[];
  balance_approach: string | null;
  key_understanding: string | null;
  techniques_mentioned: string[];
  progression_signals: string[];
  // ... generic fields
};
```

**`lib/entries.ts`**: Added same fields to Entry type

### 3. Database Migration (`supabase/migrations/005_add_midl_signal_columns.sql`)

Added columns:

- `samatha_tendency TEXT`
- `hindrance_conditions TEXT[]`
- `balance_approach TEXT`
- `key_understanding TEXT`
- Plus indexes for querying patterns

### 4. Nudges System (`lib/nudges.ts`)

Rewrote nudges around Stephen's framework categories:

| Type          | Purpose                      | Color  |
| ------------- | ---------------------------- | ------ |
| samatha       | Samatha tendency question    | Green  |
| understanding | What did you understand?     | Indigo |
| hindrance     | What was the hindrance?      | Amber  |
| conditions    | What conditions led to it?   | Red    |
| balance       | How to bring to balance?     | Blue   |
| curiosity     | Open investigation prompt    | Purple |
| pattern       | Based on past entry analysis | Amber  |

Nudges analyze history for patterns (recurring conditions, helpful approaches).

### 5. Entry Detail Screen (`app/(main)/entry/[id].tsx`)

Displays new fields in "Practice Insights" section:

- Samatha tendency with color-coded badge
- Hindrance conditions as chips
- Balance approach ("How you worked with it")
- Key understanding ("Understanding gained")

### 6. Reflect Screen (`app/(main)/reflect.tsx`)

- Added skill picker (user selects skill practiced, defaults to current)
- Added nudges UI as horizontal scrolling chips with colors

### 7. Skills Data (`supabase/functions/ai/data/skills.ts`)

Created minimal skill data for edge function prompts containing:

- id, name, marker, hindrance, techniques, progressionCriteria

## Files Modified

- `supabase/functions/ai/handlers/entry-process.ts`
- `supabase/functions/ai/types.ts`
- `supabase/functions/ai/data/skills.ts` (new)
- `supabase/migrations/005_add_midl_signal_columns.sql`
- `lib/entries.ts`
- `lib/ai.ts`
- `lib/nudges.ts` (new)
- `app/(main)/reflect.tsx`
- `app/(main)/entry/[id].tsx`
- `components/EntryCard.tsx` (new)

## Remaining Work

### Part 4: Skill Progression

User's original request included clarifying skill progression for confused meditators:

- How does user advance from one skill to the next?
- What UI shows progress toward next skill?
- How are progression_signals used to suggest advancement?

## Testing Notes

1. Run migration: `supabase db push`
2. Deploy edge function: `supabase functions deploy ai`
3. Test entry processing with various journal entries
4. Verify nudges appear based on skill and history
5. Verify entry detail shows all new fields
