# MIDL Journal - Agent Context Document

> **Purpose:** This document provides full context for AI agents working on this project. Read this before making any changes.

## Project Overview

**MIDL Journal** is an AI-powered meditation companion app built with React Native (Expo). It helps users progress through the MIDL (Mindfulness in Daily Life) meditation system - 17 skills across 5 cultivations.

**Core Features:**
- Social auth (Google/Apple) via Supabase
- Onboarding questionnaire with AI-powered skill recommendation
- Tracker screen with skill map timeline
- Reflect mode (journal entries with AI feedback)
- Ask mode (chat with AI meditation guide)
- Entry processing for mood/theme extraction

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54 + React Native |
| Routing | Expo Router v6 (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) |
| Backend | Supabase (Auth + Postgres + pgvector) |
| AI | OpenAI API (gpt-4o-mini) |
| Language | TypeScript |

## Project Structure

```
midl-journal/
├── package.json                                # Root scripts (generate, predeploy:functions)
├── scripts/
│   └── generate-shared-data.ts                 # Parses skills MD → JSON + copies to edge functions
├── data/
│   └── midl-skills/
│       ├── SKILL_FORMAT.md                     # Markdown template spec
│       └── skill_XX.md                         # 17 skill files (00-16)
├── shared/
│   ├── skills.json                             # Generated skill data
│   ├── cultivations.json                       # Generated cultivation data
│   └── types.ts                                # Shared TypeScript types
├── docs/
│   └── plans/
│       └── 2026-01-22-implementation-plan.md   # Original implementation plan
├── app/                                        # Expo app root
│   ├── app/                                    # Expo Router screens
│   │   ├── _layout.tsx                         # Root layout (SafeAreaProvider, AuthProvider)
│   │   ├── index.tsx                           # Entry point (auth routing logic)
│   │   ├── onboarding/
│   │   │   ├── _layout.tsx                     # Onboarding stack layout
│   │   │   ├── index.tsx                       # Auth screen (Google/Apple sign-in)
│   │   │   └── questions.tsx                   # Onboarding questionnaire
│   │   └── (main)/
│   │       ├── _layout.tsx                     # Main app layout + FloatingButtons
│   │       ├── tracker.tsx                     # Home screen with SkillMap + progression
│   │       ├── reflect.tsx                     # Journal entry screen + nudges
│   │       ├── ask.tsx                         # AI chat screen (tool-aware)
│   │       ├── settings.tsx                    # Settings screen (sign out)
│   │       └── entry/[id].tsx                  # Entry detail screen
│   ├── components/
│   │   ├── FloatingButtons.tsx                 # Reflect/Ask floating action buttons
│   │   ├── SkillMap.tsx                        # Horizontal skill timeline component
│   │   ├── EntryCard.tsx                       # Recent entry card on tracker
│   │   └── NudgeOverlay.tsx                    # Nudge prompts overlay
│   ├── lib/
│   │   ├── supabase.ts                         # Supabase client config
│   │   ├── auth-context.tsx                    # Auth state management (React Context)
│   │   ├── draft-context.tsx                   # Draft persistence (reflect, ask)
│   │   ├── entries.ts                          # Entry CRUD helpers + types
│   │   ├── ai.ts                               # OpenAI client (chat + streamChat)
│   │   ├── progression.ts                      # Skill advancement logic
│   │   ├── nudges.ts                           # Stephen's framework prompts
│   │   ├── midl-skills.ts                      # MIDL skill definitions (00-16)
│   │   ├── onboarding-types.ts                 # Onboarding data types and options
│   │   └── nativewind-interop.ts               # NativeWind cssInterop for 3rd party components
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql          # Base schema (users, entries, context_summaries)
│   │   │   ├── 002_add_user_insert_policy.sql  # RLS INSERT policy fix
│   │   │   ├── 003_add_embeddings.sql          # pgvector HNSW index
│   │   │   └── 005_add_midl_signals.sql        # MIDL signal columns
│   │   └── functions/
│   │       ├── ai/                             # Main AI edge function
│   │       │   ├── index.ts                    # Router (chat, reflect, onboarding, entry-process)
│   │       │   ├── handlers/
│   │       │   │   ├── chat.ts                 # Tool-aware chat (non-streaming)
│   │       │   │   ├── chat-stream.ts          # SSE streaming chat
│   │       │   │   ├── entry-process.ts        # MIDL signal extraction
│   │       │   │   ├── reflect.ts              # Feedback generation
│   │       │   │   └── onboarding.ts           # Skill recommendation
│   │       │   ├── tools/
│   │       │   │   ├── definitions.ts          # Tool schemas (5 tools)
│   │       │   │   └── handlers.ts             # Tool execution
│   │       │   ├── prompts/
│   │       │   │   └── system.ts               # Dynamic context injection
│   │       │   ├── providers/
│   │       │   │   └── openai.ts               # Official SDK wrapper + embed()
│   │       │   └── data/
│   │       │       ├── skills.ts               # Skill data for tools
│   │       │       ├── skill-markdown.ts       # Generated: embedded markdown + getSkillMarkdown()
│   │       │       └── types.ts                # Shared types
│   │       └── backfill-embeddings/            # Batch embedding generation
│   ├── .env.example                            # Environment variables template
│   ├── SETUP.md                                # Development setup guide
│   ├── app.json                                # Expo config
│   ├── babel.config.js                         # Babel config (NativeWind)
│   ├── tailwind.config.js                      # Tailwind config with custom colors
│   ├── global.css                              # Tailwind directives
│   ├── nativewind-env.d.ts                     # NativeWind type declarations
│   └── package.json
└── AGENT_CONTEXT.md                            # This file
```

## Database Schema

### Tables

**users**
```sql
- id: UUID (PK, matches auth.uid())
- email: TEXT (unique)
- created_at: TIMESTAMPTZ
- onboarding_data: JSONB (questionnaire responses)
- settings: JSONB (notifications config)
- current_skill: TEXT (e.g., '00', '01')
- stats: JSONB ({ streak, total_sessions, current_skill_days })
```

**entries**
```sql
- id: UUID (PK)
- user_id: UUID (FK -> users)
- created_at: TIMESTAMPTZ
- type: TEXT ('reflect' | 'ask')
- is_guided: BOOLEAN
- track_progress: BOOLEAN
- raw_content: TEXT
- duration_seconds: INTEGER
- skill_practiced: TEXT
- summary: TEXT (AI-generated)
- mood_score: SMALLINT (1-5)
- mood_tags: TEXT[]
- themes: TEXT[]
- has_breakthrough: BOOLEAN
- has_struggle: BOOLEAN
- has_crisis_flag: BOOLEAN
- embedding: VECTOR(1536) (for semantic search)
- processed_at: TIMESTAMPTZ
# MIDL Signal columns (migration 005)
- samatha_tendency: TEXT ('strong'|'moderate'|'weak'|'none')
- marker_present: BOOLEAN
- marker_notes: TEXT
- hindrance_present: BOOLEAN
- hindrance_notes: TEXT
- hindrance_conditions: TEXT[]
- balance_approach: TEXT
- key_understanding: TEXT
- techniques_mentioned: TEXT[]
- progression_signals: TEXT[]
```

**context_summaries** (rolling summaries for long-term context)
```sql
- id: UUID (PK)
- user_id: UUID (FK -> users)
- created_at: TIMESTAMPTZ
- entry_ids: UUID[]
- date_range_start/end: TIMESTAMPTZ
- summary: TEXT
- key_themes: TEXT[]
- mood_trend: TEXT
- notable_events: TEXT[]
- parent_summary_id: UUID (FK -> self, for hierarchical summaries)
```

### Row Level Security (RLS)

All tables have RLS enabled. Policies:
- Users can only SELECT/UPDATE/INSERT their own data
- `auth.uid() = id` for users table
- `auth.uid() = user_id` for entries and context_summaries

**Important:** Migration 002 adds the INSERT policy for users table (was missing in 001).

## Authentication Flow

1. User lands on `/` (index.tsx)
2. `useAuth()` checks session state
3. If no session → redirect to `/onboarding` (auth screen)
4. User signs in via Google or Apple
5. On success → redirect to `/onboarding/questions`
6. User completes questionnaire
7. AI evaluates responses → recommends starting skill
8. User profile created in `users` table with `current_skill`
9. Redirect to `/(main)/tracker`

### Google OAuth (Expo Go)

Uses `expo-auth-session` with Supabase OAuth:
```typescript
const redirectUrl = makeRedirectUri({ preferLocalhost: false });
// Uses auth.expo.io proxy for Expo Go compatibility

const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
});

// Open in browser, extract tokens from redirect URL
const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
```

### Apple OAuth

Uses native `expo-apple-authentication`:
```typescript
const credential = await AppleAuthentication.signInAsync({...});
await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: credential.identityToken,
});
```

## Key Components

### SkillMap (`components/SkillMap.tsx`)

Horizontal scrollable timeline showing skills 00-16:
- Completed skills: green (sage color)
- Current skill: blue (muted-blue) with dot indicator
- Future skills: gray outline
- Tap skill to see details (name, marker, hindrance)

### FloatingButtons (`components/FloatingButtons.tsx`)

Two floating action buttons at bottom of tracker:
- "Reflect" → opens journal entry modal
- "Ask" → opens AI chat modal
- Hidden when on modal screens

### Auth Context (`lib/auth-context.tsx`)

React Context providing:
- `user`: Current Supabase user object
- `session`: Current session
- `loading`: Auth state loading flag
- `signOut()`: Sign out function

## AI Integration

### Architecture

AI is powered by Supabase Edge Functions with official OpenAI SDK:

```
Client (lib/ai.ts)  -->  Edge Function (supabase/functions/ai)
                              |
                              ├── handlers/chat.ts (tool-aware, non-streaming)
                              ├── handlers/chat-stream.ts (SSE streaming)
                              ├── handlers/entry-process.ts (MIDL signals)
                              ├── handlers/reflect.ts (feedback)
                              └── handlers/onboarding.ts (skill rec)
```

### AI Tools (Chat Mode)

| Tool | Purpose |
|------|---------|
| `get_user_profile` | Current skill, stats, onboarding data |
| `get_skill_details` | Full skill markdown (instructions, tips, obstacles, etc.) |
| `get_recent_entries` | Entries with MIDL signals |
| `get_progression_stats` | Advancement readiness |
| `get_hindrance_patterns` | Recurring struggles analysis |
| `get_practice_summary` | Rolling weekly/monthly summaries |

### System Prompts

Located in `supabase/functions/ai/prompts/system.ts`:
- Dynamic context injection (user profile, current skill)
- 32k char conversation history window
- Skill-specific guidance

### Client API (lib/ai.ts)

```typescript
// Non-streaming (current)
const response = await chat(messages, userId, trackProgress);

// Streaming (implemented but not used in UI yet)
for await (const chunk of streamChat(messages, userId, trackProgress)) {
  // chunk.content for text, chunk.done for completion
}
```

## Environment Variables

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://yszsiwobkyxtlsgzcezy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=<openai-key>

# Google OAuth (Web Client ID)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<client-id>.apps.googleusercontent.com
```

## MIDL Skills Reference

| ID | Name | Cultivation | Hindrance |
|----|------|-------------|-----------|
| 00 | Diaphragmatic Breathing | 1 - Mindfulness of Body | Stress Breathing |
| 01 | Body Relaxation | 1 | Physical Restlessness |
| 02 | Mind Relaxation | 1 | Mental Restlessness |
| 03 | Mindful Presence | 1 | Sleepiness & Dullness |
| 04 | Content Presence | 2 - Mindfulness of Breathing | Habitual Forgetting |
| 05 | Natural Breathing | 2 | Habitual Control |
| 06 | Whole of Each Breath | 2 | Mind Wandering |
| 07 | Breath Sensations | 3 - Calm & Tranquillity | Gross Dullness |
| 08 | One Point of Sensation | 3 | Subtle Dullness |
| 09 | Sustained Attention | 3 | Subtle Wandering |
| 10 | Whole-Body Breathing | 4 - Joyfulness & Unification | Sensory Stimulation |
| 11 | Sustained Awareness | 4 | Anticipation of Pleasure |
| 12 | Access Concentration | 4 | Fear of Letting Go |
| 13 | Pleasure Jhana | 5 - Pleasure Jhana & Equanimity | Attachment to Pleasure |
| 14 | Happy Jhana | 5 | Restless Energy |
| 15 | Content Jhana | 5 | Subtle Discontent |
| 16 | Equanimity Jhana | 5 | Subtle Preferences |

## NativeWind Configuration

NativeWind v4 requires `cssInterop` for third-party components:

```typescript
// lib/nativewind-interop.ts
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

cssInterop(LinearGradient, { className: "style" });
```

This file must be imported in `_layout.tsx` before any components using className on LinearGradient.

## Custom Colors (Tailwind)

```javascript
// tailwind.config.js
colors: {
  lavender: '#e6e0f5',    // Light purple (gradient start)
  peach: '#fde8d7',       // Light orange (gradient end)
  sage: '#7c9082',        // Green (completed skills)
  'sage-light': '#b8c4ba',
  'muted-blue': '#5c9eb7', // Primary action color
}
```

## Running the App

```bash
cd app
npm install
npx expo start
# Press 'i' for iOS simulator
```

## Running Migrations

```bash
cd app
supabase link --project-ref yszsiwobkyxtlsgzcezy
supabase db push
```

## Skills Data Pipeline

Source markdown files in `data/midl-skills/` are the single source of truth for all skill content.

### Generate Script

`scripts/generate-shared-data.ts` parses markdown files and outputs:
- `shared/skills.json` - Full skill objects (parsed)
- `shared/cultivations.json` - Cultivation groupings
- `app/supabase/functions/ai/data/skills.json` - Copy for edge functions
- `app/supabase/functions/ai/data/skill-markdown.ts` - **Embedded raw markdown** (for bundling)

**Why embedded?** Supabase Edge Functions only bundle imported code. Static `.md` files don't deploy. The generate script embeds markdown as template literal strings in TypeScript so they're included in the bundle.

### Pre-Deployment

**Always run before deploying edge functions:**
```bash
npm run generate
# or
npm run predeploy:functions
```

### Loading Skill Markdown in Edge Functions

```typescript
import { getSkillMarkdown } from "../data/skill-markdown.ts";

const markdown = getSkillMarkdown("00"); // Returns full markdown content (sync)
```

The `get_skill_details` tool returns full markdown instead of just JSON fields:
```typescript
{ id: "00", name: "Diaphragmatic Breathing", markdown: "# Skill 00: ..." }
```

## Current State

**Completed:**
- Full auth flow (Google + Apple)
- Onboarding with AI skill recommendation
- Tracker with SkillMap + recent entries display
- Skill progression logic (readiness calculation + advancement)
- Reflect mode with AI feedback + nudges system
- Ask mode with tool-aware AI chat
- Entry processing with MIDL signal extraction
- Entry detail screen with signals display
- Settings screen (sign out)
- Draft persistence (reflect, ask)
- Database schema with RLS + MIDL signals columns
- Edge function architecture with tools
- Streaming support (backend only)
- Backfill-embeddings function (ready to deploy)

**Partially Implemented:**
- Chat streaming: backend ready, client uses non-streaming
- Vector search RAG: embedding infrastructure exists, search not wired

**Not Yet Implemented:**
- Vector search in chat (`match_entries` RPC, `search_entries` tool)
- Embedding generation on entry save (backfill exists, realtime missing)
- Push notifications
- Profile editing/preferences
- Apple Health integration

**Planned/Designed (see plans):**
- Rolling context summaries (weekly/monthly) - `app/docs/plans/2026-02-03-rolling-context-summaries-HANDOFF.md`
- Pre-sit guidance (home screen card with patterns + skill recommendations) - same plan file

## Known Issues

1. **ivfflat index:** The embedding index in migration 001 requires existing data. May error on fresh DB - comment out if needed.

2. **Expo Go limitations:** Google OAuth uses auth.expo.io proxy. Production builds need proper deep linking setup.

3. **React version conflict:** Project uses React 19.1.0 due to Expo compatibility. Some packages may complain about peer deps - use `--force` if needed.

## Immediate Gaps / TODOs

1. **Vector Search RAG** - Infrastructure ready, wiring missing:
   - Create `match_entries` SQL RPC function (pgvector similarity search)
   - Add `search_entries` tool to CHAT_TOOLS
   - Call `embed()` in entry-process handler on save
   - Deploy migration for RPC function

2. **Chat Streaming UX** - Backend done, client not using:
   - Update `ask.tsx` to call `streamChat()` instead of `chat()`
   - Display tokens as they arrive

3. **Push Notifications** - Zero implementation:
   - Install `expo-notifications`
   - Add notification preferences in settings
   - Create background scheduler

4. **Rolling Summaries + Pre-Sit Guidance** - PLANNED, see `app/docs/plans/2026-02-03-rolling-context-summaries-HANDOFF.md`:
   - Weekly summaries (3+ entries threshold)
   - Monthly summaries (cron job)
   - Pre-sit guidance card on home screen (1 entry threshold)
   - Based on research: guidance > gamification for meditation apps

## Code Patterns

### Supabase Queries
```typescript
const { data, error } = await supabase
  .from('entries')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### OpenAI Calls
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...],
    max_tokens: 500,
  }),
});
```

### Navigation
```typescript
import { router } from 'expo-router';

router.push('/(main)/reflect');  // Push to stack
router.replace('/(main)/tracker'); // Replace current
router.back(); // Go back
```

## File Ownership

| Area | Key Files |
|------|-----------|
| Auth | `lib/auth-context.tsx`, `onboarding/index.tsx` |
| Onboarding | `onboarding/questions.tsx`, `lib/onboarding-types.ts` |
| Main Screens | `(main)/tracker.tsx`, `(main)/reflect.tsx`, `(main)/ask.tsx`, `(main)/entry/[id].tsx` |
| AI Client | `lib/ai.ts` (chat + streamChat) |
| AI Edge Functions | `supabase/functions/ai/` (handlers, tools, prompts, providers) |
| Progression | `lib/progression.ts` (readiness, advancement) |
| Nudges | `lib/nudges.ts` (Stephen's framework prompts) |
| Data | `lib/entries.ts`, `lib/midl-skills.ts` |
| State | `lib/auth-context.tsx`, `lib/draft-context.tsx` |
| DB | `supabase/migrations/*.sql` |
| Config | `app.json`, `tailwind.config.js`, `babel.config.js` |

---

## Critical Learnings (For Future Agents)

### 1. NativeWind Styling is Unreliable

**Problem:** NativeWind `className` props often don't apply correctly to React Native components, especially:
- `TextInput` (dimensions, padding)
- `View` with specific sizes (w-10 h-10)
- Conditional styling with template literals

**Solution:** Use inline `style` props for anything that must render correctly:
```tsx
// BAD - may not render
<View className="w-10 h-10 rounded-full bg-blue-500">

// GOOD - always works
<View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#5c9eb7' }}>
```

**Rule:** If a style is critical for layout/functionality, use inline styles. Reserve className for non-critical styling.

### 2. KeyboardAvoidingView in Modals

**Problem:** `KeyboardAvoidingView` inside `SafeAreaView` doesn't work in modals - input gets hidden behind keyboard.

**Solution:** Put `KeyboardAvoidingView` OUTSIDE everything, use `useSafeAreaInsets()` for manual padding:
```tsx
// GOOD structure for modal with keyboard
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
  <LinearGradient style={{ flex: 1 }}>
    <View style={{ paddingTop: insets.top + 8 }}>
      {/* Header */}
    </View>
    <ScrollView style={{ flex: 1 }}>
      {/* Content */}
    </ScrollView>
    <View style={{ paddingBottom: insets.bottom + 8 }}>
      {/* Input bar */}
    </View>
  </LinearGradient>
</KeyboardAvoidingView>
```

### 3. Object.keys() Order for Numeric Strings

**Problem:** `Object.keys(SKILLS)` returns `['10', '11', ..., '16', '00', '01', ...]` because JS sorts numeric string keys.

**Solution:** Use explicit ordering from source of truth:
```tsx
// BAD
const allSkills = Object.keys(SKILLS); // Wrong order!

// GOOD
const allSkills = CULTIVATIONS.flatMap((c) => c.skills); // ['00', '01', ...]
```

### 4. Draft State Persistence Pattern

**Location:** `lib/draft-context.tsx`

**Pattern:** Future-proof state management with stable public API:
```tsx
// Public interface - consumers depend only on this
export type DraftStore = {
  reflectDraft: ReflectDraft | null;
  setReflectDraft: (draft: ReflectDraft) => void;
  clearReflectDraft: () => void;
  // ...
};

// Implementation hidden - can swap for Zustand/Jotai later
// Just change internals, keep same DraftStore shape
```

**Usage in screens:**
```tsx
const { reflectDraft, setReflectDraft, clearReflectDraft } = useDraft();

// Initialize from draft
const [content, setContent] = useState(reflectDraft?.content ?? '');

// Save draft on every change
useEffect(() => {
  setReflectDraft({ content, ... });
}, [content, ...]);

// Clear on successful submit
clearReflectDraft();
```

### 5. Floating Button Positioning

**Problem:** `absolute bottom-8` doesn't account for safe area on different devices.

**Solution:** Use `useSafeAreaInsets()`:
```tsx
const insets = useSafeAreaInsets();

<View style={{
  position: 'absolute',
  bottom: insets.bottom + 16,  // Safe area + desired padding
  left: 0,
  right: 0,
}}>
```

### 6. Modal Dismiss Behavior

**Problem:** Swipe-to-dismiss on modals loses all component state.

**Solution:** Persist state in React Context that lives in parent layout. See `lib/draft-context.tsx`.

**UX pattern for Ask screen:**
- "Done" = just dismiss, draft persists
- "New" = save current chat to DB, clear draft, reset state

### 7. File Structure for State Management

```
lib/
├── auth-context.tsx      # Auth state (session, user)
├── draft-context.tsx     # Draft state (reflect, ask drafts)
└── ...other helpers

app/
├── _layout.tsx           # Providers wrapped here
│   └── AuthProvider
│       └── DraftProvider
│           └── Stack
```

### 8. Home Screen Philosophy (Research-Backed)

**Key insight:** The app is a bookend to practice, not the practice itself.

```
BEFORE SIT          SIT              AFTER SIT
    │                │                   │
    ▼                ▼                   ▼
┌─────────┐    ┌──────────┐    ┌─────────────┐
│ Read &  │    │ (outside │    │   Reflect   │
│ Intend  │───▶│   app)   │───▶│   & Learn   │
└─────────┘    └──────────┘    └─────────────┘
```

**Principles (from trend research):**
- Guidance > gamification (streaks create anxiety, not growth)
- Daily reminders = 3x retention (Calm's biggest finding)
- "What to focus on" > "How many sessions"
- Frame as skill development, not achievements
- Grace over guilt (no streak shaming)

**Home screen priorities:**
1. **Pre-Sit Guidance Card** (primary) - patterns from entries + skill literature recommendation
2. **SkillMap** - progression visualization
3. **Recent entries** - quick access to reflect
4. Floating buttons: Reflect / Ask

**NOT on home screen:** Streak counters, leaderboards, XP/points, social comparison

### 9. MIDL Signals System (Stephen's Framework)

**Entry Processing** extracts meditation-specific signals:

| Signal | Type | Description |
|--------|------|-------------|
| `samatha_tendency` | `'strong'|'moderate'|'weak'|'none'` | Relaxation/calm quality |
| `marker_present` | `boolean` | Skill marker observed |
| `marker_notes` | `string` | Details of marker observation |
| `hindrance_present` | `boolean` | Dominant hindrance appeared |
| `hindrance_notes` | `string` | Details of hindrance |
| `hindrance_conditions` | `string[]` | What led to hindrance |
| `balance_approach` | `string` | How meditator worked with hindrance |
| `key_understanding` | `string` | Insight gained |
| `techniques_mentioned` | `string[]` | Techniques used |
| `progression_signals` | `string[]` | Signs of readiness to advance |

**Progression Logic** (`lib/progression.ts`):
```typescript
// Requirements for advancement
const REQUIREMENTS = {
  markerSessions: 3,      // 3+ sessions with marker observed
  samathaSessions: 2,     // 2+ sessions with strong samatha
  progressionSignals: 1,  // At least 1 progression signal
};

// Progress calculation weights
const progress = (
  (markerProgress * 0.5) +   // 50% marker
  (samathProgress * 0.3) +   // 30% samatha
  (signalProgress * 0.2)     // 20% signals
);
```

### 9. Nudges System

**Categories** (aligned with Stephen's framework):
- `samatha` - relaxation/calm tendency
- `understanding` - what was understood/experienced
- `hindrance` - dominant hindrance
- `conditions` - what led to it
- `balance` - how to bring balance
- `curiosity` - open investigation

Skill-specific nudges defined in `lib/nudges.ts`. Displayed via `NudgeOverlay` component.

---

**Last Updated:** 2026-02-03 (skills markdown packaging for edge functions)
**Implementation Plan:** `docs/plans/2026-01-22-implementation-plan.md`
**AI Chat Upgrade Plan:** `docs/plans/2026-02-01-ai-chat-upgrade.md`
