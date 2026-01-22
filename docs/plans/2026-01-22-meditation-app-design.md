# MIDL Meditation Companion App — Design Document

Date: 2026-01-22

## Overview

AI-powered meditation companion app built around the MIDL (Mindfulness in Daily Life) 17-skill progression system. Chat-first interface where AI acts as advisor, helps users progress through skills, and provides adaptive feedback based on their practice history.

**Target user:** People with ADHD, depression, anxiety who want structured meditation practice without rigid gatekeeping.

**Core philosophy:** AI advises but never blocks. User always has agency.

---

## Tech Stack

- **Frontend:** React Native (iOS + Android)
- **Backend:** Supabase (auth, database, storage)
- **AI:** OpenAI API
- **Rich text:** Tiptap
- **Vector search:** pgvector (Supabase)

---

## App Structure

### Navigation

- **Tracker (Home)** — Main screen, always the base
- **Two floating buttons** at bottom:
  - "Reflect" → Opens journal entry flow
  - "Ask" → Opens chat
- User completes Reflect/Ask and returns to Tracker
- No tab bar

### Screens

1. Tracker (Home)
2. Reflect (Journal entry)
3. Ask (Free chat)
4. Onboarding (First launch only)
5. Settings

---

## Screen Designs

### 1. Tracker (Home Screen)

**Layout:**

**Top area: Skill Map**
- Visual representation of 6 cultivations, 17 skills
- Current skill highlighted
- Completed skills marked
- Tapping a skill shows brief info + link to midlmeditation.com

**Middle area: Stats (minimal)**
- One consistency metric: streak or sessions this week
- One progress metric: current skill + days on it

**Bottom area: Session History**
- Scrollable list of past entries (Reflect + Ask)
- Each entry shows: date, type, duration (if Reflect), brief preview
- Tapping opens full entry

**Floating buttons:** Reflect and Ask at bottom

---

### 2. Reflect Mode (Journal)

**Visual (iOS Journal / Floating Card style):**
- Soft gradient background (lavender → peach)
- Floating card with 24px rounded corners, subtle shadow
- Serif header: "How was your practice?"
- Large text area (70% of card), sans-serif 16pt

**Flow:**
1. Screen opens, keyboard auto-focuses on text area
2. Below text: collapsed "Add details +" row
3. Tapping expands metadata fields
4. "Track progress" toggle appears when expanded
5. Submit button: muted blue pill "Get Insights"
6. AI feedback appears as modal overlay (1-3 sentences, adaptive)
7. Dismiss → save → return to Tracker

**Metadata fields (optional, collapsible):**
- Duration: pill selector [15 min] [30 min] [45 min] [Custom]
- Type: binary toggle [Guided] [Unguided]
- Skill: dropdown of MIDL skills

**Track progress toggle:**
- Visible when metadata expanded
- ON: entry contributes to progress tracking
- OFF: entry stored but not used for tracking

**AI feedback (adaptive):**
- Sometimes encouragement: "Good session. You showed up."
- Sometimes direction: "Try extending body relaxation tomorrow."
- Sometimes pattern: "Third time this week you mention drifting — might revisit Skill 03."

---

### 3. Ask Mode (Free Chat)

**Visual:**
- Same gradient background as Reflect
- Chat interface: user messages right (blue), AI messages left (white)
- Input bar fixed at bottom — built with Tiptap

**Features:**
- "Track progress" toggle visible above input
- AI can reference past sessions: "In your January 15th reflection, you mentioned restlessness..."
- AI links to midlmeditation.com when citing MIDL content
- Chat history preserved, scrollable
- Each Ask session saved to Tracker

**Memory access:**
- AI has tools to query past entries by date/date-range
- Can pull journal summaries to inform responses
- User can explicitly ask: "What did I write last week about focus?"

**Behavior:**
- No opening prompt from AI — user initiates
- AI responds conversationally, adapts tone to question type
- MIDL content served through chat with links to source

---

### 4. Onboarding Flow

**Format:** Interactive form with AI intro and personalized summary (~2 min)

**Opening:**
- AI avatar/icon with welcome message
- "Let's get to know each other so I can guide your practice."

**Form sections:**

**1. Meditation experience**
- "Have you meditated before?" [Never / A little / Regularly / Years of practice]
- "What styles have you tried?" [Multi-select: Guided apps, Breath focus, Body scan, Vipassana, Zen, Other]
- "What do you struggle with?" [Multi-select: Staying consistent, Mind wandering, Restlessness, Sleepiness, Not sure what to do]

**2. Life context**
- "What brings you here?" [Open text, optional]
- "What's going on in your life right now?" [Multi-select: Stress, Anxiety, Depression, Life transition, Seeking growth, Curiosity]

**3. Neurodivergence / mental health**
- "Anything that affects how you learn or focus?" [Multi-select: ADHD, Anxiety, Depression, Trauma history, None, Prefer not to say]

**4. Goals**
- "What does success look like in 6 months?" [Multi-select: Daily habit, Less anxiety, Better focus, Deeper practice, Self-understanding, Not sure yet]

**Closing:**
- AI generates personalized summary
- "Based on what you shared, I'd suggest starting with Skill 00..."
- Recommended starting skill shown
- "Let's begin" button → Tracker

---

## Push Notifications

**Setup:**
- During onboarding or in settings
- "Want a daily nudge to practice?"
- Time picker: single time, defaults to 8:00am
- On/off toggle

**Content:**
- Brief, varies daily
- Includes focus for session based on current skill
- Examples:
  - "Ready to sit? Today's focus: noticing where you hold tension."
  - "10 minutes for yourself? Try softening around the breath today."

**Future:** Smart nudges that learn optimal time from usage patterns

---

## Memory Architecture

### Entry Data

**Structured metadata (all entries):**
- Date/time
- Type (Reflect / Ask)
- Duration (if Reflect)
- Guided/not (if Reflect)
- Skill practiced
- Track progress toggle state
- Entry ID

**AI-extracted signals (populated async):**
- mood_score: 1-5
- mood_tags: ["anxious", "calm", "restless"]
- themes: ["sleep", "work", "practice difficulty"]
- has_breakthrough: boolean
- has_struggle: boolean
- embedding (for semantic search)

### Summarization

**Per-entry summaries:**
- Generated 24h after entry OR on first AI access
- Skip for entries <50 words
- Regenerated if user edits entry
- Both Reflect and Ask entries get summarized

**Rolling summaries:**
- Generated every 5-7 entries
- Compress oldest entries into summary chain
- No fixed weekly/monthly cron jobs

### Content Limits

- Max entry length: 1000 words (truncate beyond)
- Retention policy: Defer for now

### Crisis Detection

- Flag entries mentioning self-harm for special handling

### AI Context Strategy (Tiered)

**Always include:**
- User profile + current skill
- Structured stats (streak, avg duration, mood trend)

**Conditionally include:**
- Last 1-2 raw entries (freshness)
- 2-3 semantically relevant summaries (relevance)
- Rolling summary if exists (breadth)

**Result:** ~80% token reduction vs sending raw entries

### AI Tools

```
get_recent_entries(limit) — last 1-2 raw entries
get_relevant_entries(query, limit) — semantic search via pgvector
get_user_patterns(timeframe) — mood trends, themes, struggles
get_entry(entry_id) — specific entry if user references it
```

### Database Schema (Supabase)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  onboarding_data JSONB,
  settings JSONB,
  current_skill TEXT DEFAULT '00',
  stats JSONB DEFAULT '{}'::jsonb
);

-- Entries (unified Reflect + Ask)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  type TEXT NOT NULL CHECK (type IN ('reflect', 'ask')),
  is_guided BOOLEAN DEFAULT false,
  track_progress BOOLEAN DEFAULT true,

  raw_content TEXT NOT NULL,
  duration_seconds INTEGER,
  skill_practiced TEXT,

  summary TEXT,
  mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  mood_tags TEXT[],
  themes TEXT[],
  has_breakthrough BOOLEAN DEFAULT false,
  has_struggle BOOLEAN DEFAULT false,
  has_crisis_flag BOOLEAN DEFAULT false,

  embedding VECTOR(1536),
  processed_at TIMESTAMPTZ
);

-- Rolling summaries
CREATE TABLE context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  entry_ids UUID[] NOT NULL,
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,

  summary TEXT NOT NULL,
  key_themes TEXT[],
  mood_trend TEXT,
  notable_events TEXT[],

  parent_summary_id UUID REFERENCES context_summaries(id)
);

-- Indexes
CREATE INDEX idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX idx_entries_user_themes ON entries USING GIN(themes);
CREATE INDEX idx_entries_embedding ON entries USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_context_summaries_user ON context_summaries(user_id, created_at DESC);
```

---

## Skill Advancement

### How Users Progress

**AI-suggested advancement:**
- AI monitors patterns: consistent practice, markers achieved, fewer struggles
- When ready, AI suggests in Reflect feedback: "You seem solid on Skill 02. Ready to move to Skill 03?"
- User confirms → skill advances → Tracker updates

**User self-advancement:**
- User taps any skill on the skill map
- Option to "Start practicing this skill"
- If AI thinks they're not ready: warning modal (advisory only)

**Warning modal (advisory, not blocking):**
- "You haven't spent much time on Skill 02 yet. The foundation matters."
- Options: "Start anyway" / "Stay on Skill 02"
- User can always proceed — no hard gates

### Readiness Signals

- Sessions on current skill (minimum ~5+)
- Time spent (~2+ weeks)
- Struggles decreasing in recent entries
- Markers mentioned in reflections
- No recent hindrance mentions for current skill

### Core Principle

**User is never blocked from accessing any skill.** AI advises but user has final say.

---

## MIDL Content Access

- All MIDL content (17 skills, 6 cultivations) served through Ask chat
- AI references scraped content when answering questions
- Always includes links to midlmeditation.com as source
- No separate in-app reference/browse section

---

## Future Considerations

- Smart push notifications (learn optimal time)
- Voice input for reflections
- Offline journaling with sync
- Multi-device support
- Retention policy for old entries
- Export/backup user data

---

## Open Questions for Implementation

1. Specific visual design for skill map (tree? ladder? grid?)
2. Animation/transition details between screens
3. Settings screen scope (what's configurable?)
4. Auth flow (email? social? magic link?)
5. App store metadata and marketing positioning

---

*Document generated from brainstorming session 2026-01-22*
