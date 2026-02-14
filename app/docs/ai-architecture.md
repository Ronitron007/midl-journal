# AI & RAG Architecture

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MIDL Journal App                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│   │   Ask    │     │  Reflect │     │ Onboard  │     │  Tracker │      │
│   │  Modal   │     │  Modal   │     │  Flow    │     │   View   │      │
│   └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘      │
│        │                │                │                │             │
│        └────────────────┴────────────────┴────────────────┘             │
│                              │                                           │
│                      ┌───────▼───────┐                                  │
│                      │ Draft Context │  (React Context + useReducer)    │
│                      └───────┬───────┘                                  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │    chat     │     │  reflect-   │     │   client    │
    │ Edge Func   │     │  feedback   │     │ processors  │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  OpenAI GPT-4o-mini │
                    └─────────────────────┘
```

## Core AI Components

| Component       | File                       | Purpose                        |
| --------------- | -------------------------- | ------------------------------ |
| Chat Edge Func  | `supabase/functions/chat/` | Meditation guide conversations |
| AI Feedback     | `lib/ai-feedback.ts`       | Post-reflection insights       |
| Entry Processor | `lib/entry-processor.ts`   | NLP signal extraction          |
| Onboarding Eval | `lib/onboarding-eval.ts`   | Skill recommendation           |
| OpenAI Client   | `lib/openai.ts`            | Base chat wrapper              |

## RAG Data Flow

```
                    ┌─────────────────────────────────────┐
                    │           USER INPUT                │
                    │  (reflection / chat / onboarding)   │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         ENTRY PROCESSOR                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  GPT-4o-mini JSON Mode                                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Summary  │ │  Mood    │ │  Themes  │ │ Break-   │ │  Crisis  │ │  │
│  │  │ Extract  │ │ Scoring  │ │ Detect   │ │ through  │ │  Flag    │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL + PGVECTOR                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  entries table                                                      │  │
│  │  ├── raw_content TEXT                                              │  │
│  │  ├── summary TEXT           ◄── AI-generated                       │  │
│  │  ├── mood_score SMALLINT    ◄── 1-5 scale                          │  │
│  │  ├── mood_tags TEXT[]       ◄── ["calm", "anxious"]                │  │
│  │  ├── themes TEXT[]          ◄── ["breathing", "work"]              │  │
│  │  ├── has_breakthrough BOOL                                         │  │
│  │  ├── has_struggle BOOL                                             │  │
│  │  ├── has_crisis_flag BOOL                                          │  │
│  │  └── embedding VECTOR(1536) ◄── OpenAI embeddings                  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  context_summaries table (rolling aggregation)                     │  │
│  │  ├── summary TEXT                                                  │  │
│  │  ├── key_themes TEXT[]                                             │  │
│  │  ├── mood_trend TEXT                                               │  │
│  │  └── date_range_start/end                                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  INDEXES:                                                                │
│  • GIN on themes[] → Fast tag-based retrieval                           │
│  • IVFFlat on embedding → Vector similarity search                      │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │    RETRIEVAL STRATEGIES     │
                    │  • Semantic (cosine sim)    │
                    │  • Theme-based (GIN)        │
                    │  • Temporal (date range)    │
                    └─────────────────────────────┘
```

## Chat Workflow

```
┌────────┐     ┌─────────────┐     ┌────────────────┐     ┌──────────┐
│  User  │────▶│  Ask Modal  │────▶│  chat() Edge   │────▶│  OpenAI  │
│ Input  │     │ (messages)  │     │   Function     │     │ GPT-4o   │
└────────┘     └─────────────┘     └────────────────┘     └────┬─────┘
                     ▲                                         │
                     │              ┌──────────────────────────┘
                     │              │
                     │              ▼
               ┌─────┴─────┐  ┌──────────────┐
               │  Display  │◀─│   Response   │
               │  Message  │  │   content    │
               └───────────┘  └──────────────┘
                     │
                     │ (if "Track Progress" enabled)
                     ▼
               ┌───────────┐
               │  entries  │
               │   table   │
               └───────────┘
```

## Reflection Feedback Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    REFLECTION SUBMISSION                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  User provides:                                           │   │
│  │  • content (text)                                         │   │
│  │  • duration (minutes)                                     │   │
│  │  • isGuided (boolean)                                     │   │
│  │  • skillPracticed (skill ID)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
   │  createEntry │       │ AI Feedback │       │ Entry Proc  │
   │  (entries)   │       │ Generation  │       │ (signals)   │
   └─────────────┘       └──────┬──────┘       └──────┬──────┘
                                │                      │
                                ▼                      ▼
                    ┌──────────────────┐    ┌──────────────────┐
                    │  "Good session.  │    │  mood_score: 4   │
                    │   You showed up  │    │  themes: [breath]│
                    │   and stayed..."│    │  breakthrough: T │
                    └──────────────────┘    └──────────────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │  Feedback Modal  │
                    │   displayed      │
                    └──────────────────┘
```

## Onboarding Skill Recommendation

```
┌───────────────────────────────────────────────────────────────┐
│                    ONBOARDING QUESTIONS                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  1. Meditation experience?                              │  │
│  │  2. Main struggles? (anxiety, stress, sleep, focus...)  │  │
│  │  3. Life context? (student, parent, professional...)    │  │
│  │  4. Neurodivergence?                                    │  │
│  │  5. Primary goal?                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │     evaluateOnboarding()    │
                  │  ┌───────────────────────┐  │
                  │  │  GPT-4o-mini analyzes │  │
                  │  │  responses + MIDL     │  │
                  │  │  skill definitions    │  │
                  │  └───────────────────────┘  │
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │  {                          │
                  │    startingSkill: "02",    │
                  │    reason: "Your anxiety..." │
                  │  }                          │
                  └─────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │  users.current_skill = "02" │
                  │  users.onboarding_data = {} │
                  └─────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React Native)                    │
│  • No OpenAI API key (migrating to server-side)             │
│  • Supabase anon key only                                   │
│  • JWT in Authorization header                               │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE EDGE FUNCTIONS                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. Verify JWT from Authorization header              │  │
│  │  2. Extract user_id                                   │  │
│  │  3. Call OpenAI with server-side key                  │  │
│  │  4. Return response (no key exposure)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROW LEVEL SECURITY                        │
│  • users: auth.uid() = id                                   │
│  • entries: auth.uid() = user_id                            │
│  • context_summaries: auth.uid() = user_id                  │
└─────────────────────────────────────────────────────────────┘
```

## MIDL Skills Taxonomy (for AI Context)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        5 CULTIVATIONS x 17 SKILLS                        │
├─────────────────────────────────────────────────────────────────────────┤
│  FLEXIBLE ATTENTION (00-03)                                              │
│  ├── 00: Diaphragmatic Breathing    ◄── Default beginner skill          │
│  ├── 01: Grounding (5 senses)                                           │
│  ├── 02: Softening Into                                                 │
│  └── 03: Gentle Curiosity                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  MENTAL FLEXIBILITY (04-06)                                              │
│  ├── 04: Brief Mind Wandering                                           │
│  ├── 05: Reobserving                                                    │
│  └── 06: Reengaging                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  INVESTIGATION (07-09)                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  COLLECTEDNESS (10-12)                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  INSIGHT (13-16)                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Planned Migrations

| From                         | To                            | Status      |
| ---------------------------- | ----------------------------- | ----------- |
| `lib/openai.ts` client call  | `chat/` edge function         | In Progress |
| `lib/ai-feedback.ts`         | `reflect-feedback/` edge func | Planned     |
| Client-side `OPENAI_API_KEY` | Server-only                   | Planned     |
| Context useReducer           | Zustand/Jotai                 | Future      |
