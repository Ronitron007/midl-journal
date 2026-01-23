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
├── docs/
│   └── plans/
│       └── 2026-01-22-implementation-plan.md  # Original implementation plan
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
│   │       ├── tracker.tsx                     # Home screen with SkillMap
│   │       ├── reflect.tsx                     # Journal entry screen
│   │       └── ask.tsx                         # AI chat screen
│   ├── components/
│   │   ├── FloatingButtons.tsx                 # Reflect/Ask floating action buttons
│   │   └── SkillMap.tsx                        # Horizontal skill timeline component
│   ├── lib/
│   │   ├── supabase.ts                         # Supabase client config
│   │   ├── auth-context.tsx                    # Auth state management (React Context)
│   │   ├── entries.ts                          # Entry CRUD helpers
│   │   ├── openai.ts                           # OpenAI chat helper
│   │   ├── ai-feedback.ts                      # AI feedback for reflections
│   │   ├── entry-processor.ts                  # Entry analysis (mood, themes, signals)
│   │   ├── onboarding-eval.ts                  # AI skill recommendation from onboarding
│   │   ├── onboarding-types.ts                 # Onboarding data types and options
│   │   ├── midl-skills.ts                      # MIDL skill definitions (00-16)
│   │   └── nativewind-interop.ts               # NativeWind cssInterop for 3rd party components
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql          # Base schema (users, entries, context_summaries)
│   │       └── 002_add_user_insert_policy.sql  # RLS INSERT policy fix
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

### OpenAI Helpers

All use `gpt-4o-mini` model:

| File | Purpose | Max Tokens |
|------|---------|------------|
| `openai.ts` | Chat conversations (Ask mode) | 500 |
| `ai-feedback.ts` | Reflection feedback | 150 |
| `onboarding-eval.ts` | Skill recommendation | 200 |
| `entry-processor.ts` | Entry analysis (mood, themes) | 300 |

### System Prompts

- **Chat:** MIDL meditation guide, warm, concise, practical
- **Feedback:** Acknowledge practice, gentle suggestions, validate effort
- **Eval:** Recommend skill 00-06 based on experience/struggles/goals

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

## Current State

**Completed:**
- All 18 tasks from implementation plan
- Full auth flow (Google + Apple)
- Onboarding with AI skill recommendation
- Tracker with SkillMap
- Reflect mode with AI feedback
- Ask mode with chat
- Entry processing helpers
- Database schema with RLS

**Not Yet Implemented:**
- Actual embedding generation for entries
- Context summary generation (rolling summaries)
- Push notifications
- Skill progression logic (when to advance skills)
- Session history display on tracker
- Profile/settings screen

## Known Issues

1. **ivfflat index:** The embedding index in migration 001 requires existing data. May error on fresh DB - comment out if needed.

2. **Expo Go limitations:** Google OAuth uses auth.expo.io proxy. Production builds need proper deep linking setup.

3. **React version conflict:** Project uses React 19.1.0 due to Expo compatibility. Some packages may complain about peer deps - use `--force` if needed.

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
| Onboarding | `onboarding/questions.tsx`, `lib/onboarding-eval.ts`, `lib/onboarding-types.ts` |
| Main Screens | `(main)/tracker.tsx`, `(main)/reflect.tsx`, `(main)/ask.tsx` |
| AI | `lib/openai.ts`, `lib/ai-feedback.ts`, `lib/entry-processor.ts` |
| Data | `lib/entries.ts`, `lib/midl-skills.ts` |
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

---

**Last Updated:** 2026-01-23
**Implementation Plan:** `docs/plans/2026-01-22-implementation-plan.md`
