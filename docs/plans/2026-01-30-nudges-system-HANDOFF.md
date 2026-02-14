# Nudges System - Handoff Document

> **Status:** COMPLETE - Enhanced with Stephen's Framework
> **Date:** 2026-01-30
> **Part of:** App Redesign Series (3 of 4)

## Summary

Built a nudges system aligned with **Stephen's post-meditation reflection framework**. Generates personalized prompts across six categories:

1. **Samatha** - tendency toward relaxation/calm
2. **Understanding** - what was experienced/understood
3. **Hindrance** - dominant obstacle
4. **Conditions** - what led to the hindrance
5. **Balance** - how to work with experience
6. **Curiosity** - seeds for next session

## What Was Done

### 1. Created Nudges Module (`app/lib/nudges.ts`)

**Skill-specific prompts for all 17 skills, organized by Stephen's categories:**

- `samatha` - "What was your mind's tendency toward calm?"
- `understanding` - "What did you experience/understand?"
- `hindrance` - "What was the dominant hindrance?"
- `conditions` - "What conditions led to it?"
- `balance` - "How did you work with it?"
- `curiosity` - "What seeds for next session?"

**Nudge types:**

- `focus` (gray) - Samatha/understanding questions
- `marker` (green) - Positive experience questions
- `hindrance` (amber) - Obstacle questions
- `technique` (blue) - Balance/technique suggestions
- `pattern` (yellow) - Personalized from history (hindrance_conditions, balance_approach, samatha_tendency)

**Functions:**

- `generateNudges(userId, skillId)` - Fetches history, analyzes patterns, returns personalized nudges
- `getStaticNudges(skillId)` - Immediate nudges without DB call
- `analyzePatterns()` - Analyzes:
  - `hindrance_conditions` - recurring triggers (e.g., "tired" in 3 sessions)
  - `balance_approach` - what's worked before
  - `samatha_tendency` - overall calm trajectory

### 2. Updated Reflect Screen (`app/app/(main)/reflect.tsx`)

- Added horizontal scrolling nudges row below "How was your practice?" header
- Shows static nudges immediately, then loads personalized ones
- Color-coded by type (gray/green/amber/blue/yellow)
- Updates when skill changes

## Nudge Display

```
┌─────────────────────────────────────────────────────────┐
│ How was your practice?                                  │
│                                                         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│ │ Where was    │ │ Did belly    │ │ Try slow     │ →   │
│ │ your breath  │ │ breathing    │ │ exhales...   │     │
│ │ centered?    │ │ feel natural?│ │              │     │
│ └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                         │
│ [Editor]                                                │
└─────────────────────────────────────────────────────────┘
```

## Nudge Generation Logic

1. **Always show:** 2 skill-specific focus prompts
2. **If 2+ hindrance entries:** Add pattern nudge (high priority)
   - "You've noticed [hindrance] in X recent sessions. What helped today?"
3. **Add marker check:** Question about positive experience
4. **Add random technique:** Practical suggestion

Sorted by priority, returns top 4 nudges.

## Color Coding

| Type      | Background      | Text    | Example                             |
| --------- | --------------- | ------- | ----------------------------------- |
| focus     | #f3f4f6 (gray)  | #4b5563 | "Where was your breath?"            |
| marker    | #dcfce7 (green) | #166534 | "Did belly breathing feel natural?" |
| hindrance | (via pattern)   | #92400e | "Did chest breathing show up?"      |
| technique | #dbeafe (blue)  | #1e40af | "Try slow exhales..."               |
| pattern   | #fef3c7 (amber) | #92400e | "You've noticed... in 3 sessions"   |

## Files Changed

| File                         | Change Type                          |
| ---------------------------- | ------------------------------------ |
| `app/lib/nudges.ts`          | **NEW** - Nudges generation and data |
| `app/app/(main)/reflect.tsx` | Modified - Added nudges UI           |

## Testing

1. Open reflect screen
2. Should see 2 nudges immediately (static)
3. After moment, may see up to 4 (if history exists)
4. Change skill in details → nudges update
5. Create entries with hindrances → pattern nudge should appear

## What's Next (Final Part)

### Part 4: Skill Progression

- Count marker_present sessions for advancement
- Use progression_signals to determine readiness
- Show progression UI (how close to next skill)
- Implement advancement logic

## Design Decisions

1. **Static first, personalized second** - Show something immediately, load history async
2. **Max 4 nudges** - Avoid overwhelming the user
3. **Priority-based** - Pattern nudges (personalized) rank highest
4. **Horizontal scroll** - Doesn't take up vertical space
5. **Inspiration only** - Nudges don't insert text (could add later)

## Potential Enhancements (Not Implemented)

- Tap nudge to insert into editor
- Dismiss nudges permanently
- Track which nudges lead to better reflections
- AI-generated nudges based on recent content

---

**Agent handoff complete. Ready for Part 4: Skill Progression.**
