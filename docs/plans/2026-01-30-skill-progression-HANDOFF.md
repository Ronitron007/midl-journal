# Skill Progression - Handoff Document

> **Status:** COMPLETE
> **Date:** 2026-01-30
> **Part of:** App Redesign Series (4 of 4)

## Summary

Implemented a skill progression system that tracks meditator progress through the 17 MIDL skills. Uses signals from journal entries (marker_present, samatha_tendency, progression_signals) to determine readiness for advancement.

## What Was Done

### 1. Created Progression Module (`app/lib/progression.ts`)

**Progression Stats:**

- `markerCount` - sessions where skill's marker was present
- `strongSamathaCount` - sessions with strong samatha tendency
- `hasProgressionSignals` - any progression signals detected
- `readyToAdvance` - meets all advancement criteria

**Advancement Criteria:**

- 3+ marker sessions
- 2+ strong samatha sessions
- Progression signals detected

**Functions:**

- `getProgressionStats(userId, skillId)` - calculates stats from entries
- `getProgressPercentage(stats)` - 0-100 progress indicator
- `advanceToNextSkill(userId, currentSkillId)` - advances user
- `getProgressDescription(stats)` - readable description of what's needed

### 2. Updated SkillMap (`app/components/SkillMap.tsx`)

Added progression section showing:

- Progress bar with percentage
- Stats row (marker count, samatha count)
- "Advance" button when ready
- Description of what's needed when not ready

### 3. Updated Tracker Screen (`app/app/(main)/tracker.tsx`)

- Fetches progression stats on load
- Passes stats to SkillMap
- Handles advancement with confirmation alert
- Haptic feedback on advancement

## Progression UI

```
┌─────────────────────────────────────────────────────────┐
│ Skill 00: Diaphragmatic Breathing                       │
│ Marker: Diaphragm Breathing                             │
│ Works with: Stress Breathing                            │
├─────────────────────────────────────────────────────────┤
│ Progression                                             │
│ ┌──────────────────────────────────────────┐            │
│ │██████████████████░░░░░░░░░░░░░░░░░░░░░░░│ 67%        │
│ └──────────────────────────────────────────┘            │
│ ✓ 2 marker sessions   ☯ 2 strong samatha               │
│                                                         │
│ Need: 1 more marker session                             │
└─────────────────────────────────────────────────────────┘
```

When ready:

```
│ ┌───────────────────────────────────────────────────┐   │
│ │        Advance to Skill 01: Body Relaxation       │   │
│ └───────────────────────────────────────────────────┘   │
```

## Files Changed

| File                          | Change Type                            |
| ----------------------------- | -------------------------------------- |
| `app/lib/progression.ts`      | **NEW** - progression logic            |
| `app/components/SkillMap.tsx` | Modified - progression UI              |
| `app/app/(main)/tracker.tsx`  | Modified - fetch stats, handle advance |

## Advancement Flow

1. User practices skill, writes journal entries
2. AI extracts signals (marker_present, samatha_tendency, progression_signals)
3. Tracker loads progression stats
4. When criteria met, "Advance" button appears
5. User taps, confirms in alert
6. Profile updated, tracker refreshes

## Testing

1. Create 3+ reflect entries for current skill with:
   - Content mentioning the marker (e.g., "belly breathing felt natural")
   - Strong relaxation/calm language
2. Progress bar should fill as entries accumulate
3. When 100%, "Advance" button appears
4. Tap to advance, confirm, skill updates

## Design Decisions

1. **Gradual progress** - not just pass/fail, shows incremental progress
2. **Manual advancement** - user must consciously choose to advance
3. **Multiple criteria** - requires both marker and samatha, not just one
4. **Confirmation** - alert prevents accidental advancement

## Known Limitations

- Progression only tracks entries with `skill_practiced` set
- Old entries before signals redesign won't contribute
- No way to go back to previous skill (could add in settings)
- Stats query limited to 50 recent entries

---

**All 4 parts complete. App redesign ready for deployment and testing.**

## Complete Series Summary

| Part                 | Status | Description                                            |
| -------------------- | ------ | ------------------------------------------------------ |
| 1. Signals Redesign  | ✅     | MIDL-specific signals aligned with Stephen's framework |
| 2. Entry Display     | ✅     | EntryCard with signal indicators                       |
| 3. Nudges System     | ✅     | Personalized prompts using Stephen's categories        |
| 4. Skill Progression | ✅     | Track and advance through 17 skills                    |

## Deployment Steps

```bash
cd app
supabase functions deploy ai    # Deploy updated AI function
supabase db push                # Apply DB migration
```

Then test the full flow:

1. Open app, go to Reflect
2. Select skill, write entry
3. Check entry detail for signals
4. Check tracker for progression stats
5. After 3+ marker sessions, advance skill
