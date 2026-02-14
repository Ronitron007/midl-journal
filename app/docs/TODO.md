# MIDL Journal TODO

## Recently Completed ✅

### App Redesign (Jan 30, 2026)

- [x] **Signals Redesign** - MIDL-specific signal extraction aligned with Stephen's framework
  - Samatha tendency, hindrance conditions, balance approach, key understanding
  - Skill-aware entry processing with marker/hindrance detection
- [x] **Entry Display** - EntryCard with signal indicators (marker ✓, hindrance ⚡, mood, techniques)
- [x] **Nudges System** - Personalized prompts using Stephen's 6 reflection categories
- [x] **Skill Progression** - Track marker sessions, advance through 17 skills
- [x] **NudgeOverlay Flow** - Nudges show first on Reflect, then editor

See handoff docs: `docs/plans/2026-01-30-*-HANDOFF.md`

---

## In Progress 🔨

### AI Chat Upgrade (Priority: HIGH)

Production-grade AI implementation with tools.

**Phase 1: Foundation** ✅

- [x] Replace fetch-based OpenAI with official `openai` package
- [x] Proper error handling and retry logic
- [x] ~Streaming support~ - deferred (React Native fetch doesn't support ReadableStream)

**Phase 2: Context & Tools** ✅

- [x] `get_user_profile` - current skill, stats, onboarding data
- [x] `get_skill_details` - marker, hindrance, techniques for any skill
- [x] `get_recent_entries` - last N entries with signals
- [x] `get_progression_stats` - marker count, readiness to advance
- [x] `get_hindrance_patterns` - recurring struggles from history
- [x] Tool usage logging (count and names per request)

**Phase 3: RAG** - Skipped for now

- [ ] Add `embed()` function to OpenAI provider
- [ ] Populate embeddings in `processEntry` flow
- [ ] `search_past_entries` - vector similarity search

**Phase 4: Smart Context** ✅

- [x] Inject user context into system prompt dynamically
- [x] Conversation memory within session (32k char window)

---

## Immediate

1. **[NEXT]** Add meditation & journaling reminders
   - Meditation: scheduled time
   - Journaling: conditional (only if no entry for day)

---

## Can Wait

3. Refine UI for MIDL meditators - based on scraped data
4. ~~Integrate rich text editor~~ ✅ (10tap-editor integrated)

---

## Future Features

5. Sync meditation time to Apple Health mindfulness - HealthKit integration
6. Research & set up payments vendor - evaluate RevenueCat/Stripe/Apple IAP
7. **Chat Streaming** - React Native's fetch doesn't support ReadableStream
   - Options: polyfill (`react-native-polyfill-globals`), WebSocket via Supabase Realtime, or wait for RN improvements
   - Low priority unless users complain about response latency
8. Set up TestFlight/internal distribution - waiting on Apple Developer account

---

## 🔧 Technical Debt: Expo SDK 55 Upgrade

**When:** March 2026 (after SDK 55 exits beta)

**Why:**

- SDK 54 is the LAST version to support Legacy Architecture
- SDK 55 brings React Native 0.83.1 and React 19.2.0
- Hermes v1 engine with 15-30% performance improvements

**Current Package Downgrades (revert after upgrade):**
| Package | Current | Available |
|---------|---------|-----------|
| `react-native-worklets` | 0.5.1 | 0.7.2+ |
| `@react-native-community/datetimepicker` | 8.4.4 | 8.6.0+ |
| `react-native-webview` | 13.15.0 | 13.16.0+ |

**Pre-upgrade Checklist:**

- [ ] Verify `@10play/tentap-editor` supports New Architecture
- [ ] Check all dependencies for New Architecture compatibility
- [ ] Test in a separate branch before merging
