# Signals Redesign - Handoff Document

> **Status:** COMPLETE - Enhanced with Stephen's Framework
> **Date:** 2026-01-30
> **Part of:** App Redesign Series (1 of 4)

## Summary

Redesigned the entry processing system to extract **MIDL-specific signals** aligned with **Stephen's post-meditation reflection framework**:

1. What was your mind's tendency towards relaxation and calm (samatha)?
2. What did you understand, what did you experience?
3. What was the dominant hindrance?
4. What conditions led to it?
5. Your understanding to bring them to balance

This foundation enables meaningful entry display, personalized nudges, and skill progression tracking.

## What Was Done

### 1. Skill Picker UI (`app/app/(main)/reflect.tsx`)

- Added "Skill practiced" field in details section
- Defaults to user's `current_skill` from profile (fetched on mount)
- User can change it to any of the 17 skills
- Shows current skill indicator in picker

### 2. Entry Processing (`app/supabase/functions/ai/handlers/entry-process.ts`)

- Now accepts `skillPracticed` parameter
- Loads skill-specific data (marker, hindrance, techniques, progression criteria)
- **Prompt aligned with Stephen's framework** - extracts:

  **Samatha Assessment** (tendency toward relaxation/calm):
  - `samatha_tendency`: "strong" | "moderate" | "weak" | "none"
  - `marker_present` + `marker_notes`

  **Hindrance Assessment** (obstacles to samatha):
  - `hindrance_present` + `hindrance_notes`
  - `hindrance_conditions`: what triggered/led to hindrance (e.g., "tired", "stressed")

  **Working with Experience**:
  - `balance_approach`: how they worked with the hindrance
  - `key_understanding`: insight or learning gained

  **Techniques and Progression**:
  - `techniques_mentioned`
  - `progression_signals`

  Plus generic: summary, mood_score, mood_tags, themes, has_breakthrough, has_struggle

### 3. Skills Data (`app/supabase/functions/ai/data/skills.ts`)

- Created minimal skill data for edge function
- Contains: id, name, marker, hindrance, techniques, progressionCriteria
- All 17 skills (00-16) included

### 4. Types Updated

- `ProcessedSignals` type includes Stephen's framework fields:
  ```typescript
  type SamathaTendency = 'strong' | 'moderate' | 'weak' | 'none';
  type ProcessedSignals = {
    samatha_tendency: SamathaTendency;
    hindrance_conditions: string[];
    balance_approach: string | null;
    key_understanding: string | null;
    // plus existing fields...
  };
  ```
- `Entry` type includes new columns
- `EntryProcessPayload` includes `skillPracticed`

### 5. Entry Detail Screen (`app/app/(main)/entry/[id].tsx`)

Displays signals aligned with Stephen's reflection framework:

- **Samatha tendency** - spectrum indicator (strong/moderate/weak/none)
- **Marker badge** (green) with notes when present
- **Hindrance section** - notes + conditions that led to it
- **Balance approach** - how they worked with the hindrance
- **Key understanding** - insight or learning gained
- **Techniques** as blue chips
- **Progression signals** in green box
- Plus: skill practiced, mood, themes, breakthrough/struggle badges

### 6. DB Migration (`app/supabase/migrations/005_add_midl_signal_columns.sql`)

- Adds new columns for MIDL signals
- Adds indexes for efficient querying

## Files Changed

| File                                                      | Change Type                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `app/app/(main)/reflect.tsx`                              | Modified - skill picker UI                                   |
| `app/app/(main)/entry/[id].tsx`                           | Modified - display new signals                               |
| `app/lib/ai.ts`                                           | Modified - new ProcessedSignals type, processEntry signature |
| `app/lib/entries.ts`                                      | Modified - Entry type with new fields                        |
| `app/supabase/functions/ai/handlers/entry-process.ts`     | Modified - skill-aware prompt                                |
| `app/supabase/functions/ai/types.ts`                      | Modified - new types                                         |
| `app/supabase/functions/ai/data/skills.ts`                | **NEW** - skills data for prompts                            |
| `app/supabase/migrations/005_add_midl_signal_columns.sql` | **NEW** - DB schema changes                                  |
| `docs/plans/2026-01-30-signals-redesign.md`               | **NEW** - design doc                                         |

## Pre-Deployment Steps

Before testing, you need to:

1. **Deploy edge function:**

   ```bash
   cd app
   supabase functions deploy ai
   ```

2. **Run migration:**
   ```bash
   supabase db push
   ```

## Testing

1. Create a new reflect entry
2. Select a skill (e.g., "00 - Diaphragmatic Breathing")
3. Write content that mentions the marker or hindrance:
   - Marker test: "My belly breathing felt natural today, I noticed my diaphragm engaging easily"
   - Hindrance test: "I kept breathing in my chest, couldn't get into belly breathing"
4. Submit and wait for processing
5. Open the entry detail to verify signals are displayed

## What's Next (Remaining 3 Parts)

### Part 2: Entry Display Enhancements

- Show signals in tracker list view (not just detail)
- Add visual indicators for marker/hindrance in session cards
- Consider filtering/grouping by signal type

### Part 3: Nudges System

- Use `hindrance_present` history to identify recurring struggles
- Generate skill-specific reflection prompts
- Pull from skill's common obstacles and techniques

### Part 4: Skill Progression

- Count `marker_present` sessions
- Check `progression_signals` for advancement readiness
- Implement progression logic and UI

## Key Design Decisions

1. **Hybrid signals** - MIDL-specific with priority, generic retained for completeness
2. **User-selected skill** - Don't assume current_skill, let user specify what they practiced
3. **Background processing** - processEntry runs async, doesn't block feedback modal
4. **Skill data in edge function** - Embedded for simplicity (no separate fetch)

## Known Limitations

- Old entries won't have new signals (migration adds columns, doesn't backfill)
- Processing requires 10+ words to trigger
- Techniques detection depends on exact matches from skill data

---

**Agent handoff complete. Ready for Part 2: Entry Display Enhancements.**
