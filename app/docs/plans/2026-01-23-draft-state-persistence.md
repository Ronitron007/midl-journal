# Draft State Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist draft state for Ask and Reflect modals so data survives swipe-to-dismiss gestures.

**Architecture:** Create a React Context-based draft store that holds in-progress data for both screens. The store persists drafts in memory during the session and clears them when explicitly submitted/closed. No external state management library needed - React Context + useReducer is sufficient for this scope.

**Tech Stack:** React Context, useReducer, TypeScript

---

## Task 1: Create Draft Store Context

**Files:**
- Create: `lib/draft-context.tsx`

**Step 1: Write the draft context with types and reducer**

```tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message } from './openai';

// Types
type ReflectDraft = {
  content: string;
  showDetails: boolean;
  duration: number | null;
  isGuided: boolean;
  trackProgress: boolean;
  skillPracticed: string;
};

type AskDraft = {
  messages: Message[];
  input: string;
  trackProgress: boolean;
};

type DraftState = {
  reflect: ReflectDraft | null;
  ask: AskDraft | null;
};

type DraftAction =
  | { type: 'SET_REFLECT_DRAFT'; payload: ReflectDraft }
  | { type: 'SET_ASK_DRAFT'; payload: AskDraft }
  | { type: 'CLEAR_REFLECT_DRAFT' }
  | { type: 'CLEAR_ASK_DRAFT' };

// Initial state
const initialState: DraftState = {
  reflect: null,
  ask: null,
};

// Reducer
function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'SET_REFLECT_DRAFT':
      return { ...state, reflect: action.payload };
    case 'SET_ASK_DRAFT':
      return { ...state, ask: action.payload };
    case 'CLEAR_REFLECT_DRAFT':
      return { ...state, reflect: null };
    case 'CLEAR_ASK_DRAFT':
      return { ...state, ask: null };
    default:
      return state;
  }
}

// Context
type DraftContextType = {
  state: DraftState;
  setReflectDraft: (draft: ReflectDraft) => void;
  setAskDraft: (draft: AskDraft) => void;
  clearReflectDraft: () => void;
  clearAskDraft: () => void;
};

const DraftContext = createContext<DraftContextType | null>(null);

// Provider
export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(draftReducer, initialState);

  const setReflectDraft = (draft: ReflectDraft) => {
    dispatch({ type: 'SET_REFLECT_DRAFT', payload: draft });
  };

  const setAskDraft = (draft: AskDraft) => {
    dispatch({ type: 'SET_ASK_DRAFT', payload: draft });
  };

  const clearReflectDraft = () => {
    dispatch({ type: 'CLEAR_REFLECT_DRAFT' });
  };

  const clearAskDraft = () => {
    dispatch({ type: 'CLEAR_ASK_DRAFT' });
  };

  return (
    <DraftContext.Provider
      value={{ state, setReflectDraft, setAskDraft, clearReflectDraft, clearAskDraft }}
    >
      {children}
    </DraftContext.Provider>
  );
}

// Hook
export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within DraftProvider');
  }
  return context;
}

// Export types
export type { ReflectDraft, AskDraft };
```

**Step 2: Commit**

```bash
git add lib/draft-context.tsx
git commit -m "feat: add draft context for modal state persistence"
```

---

## Task 2: Add DraftProvider to App Layout

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Read current layout to understand structure**

Check how AuthProvider is wrapped.

**Step 2: Import and wrap with DraftProvider**

Add import at top:
```tsx
import { DraftProvider } from '../lib/draft-context';
```

Wrap children with DraftProvider (inside AuthProvider):
```tsx
<AuthProvider>
  <DraftProvider>
    {/* existing children */}
  </DraftProvider>
</AuthProvider>
```

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wrap app with DraftProvider"
```

---

## Task 3: Update Reflect Screen to Use Draft Store

**Files:**
- Modify: `app/(main)/reflect.tsx`

**Step 1: Import useDraft hook**

```tsx
import { useDraft, ReflectDraft } from '../../lib/draft-context';
```

**Step 2: Initialize state from draft**

Replace individual useState calls with draft-aware initialization:

```tsx
const { state: draftState, setReflectDraft, clearReflectDraft } = useDraft();

// Initialize from draft or defaults
const [content, setContent] = useState(draftState.reflect?.content ?? '');
const [showDetails, setShowDetails] = useState(draftState.reflect?.showDetails ?? false);
const [duration, setDuration] = useState<number | null>(draftState.reflect?.duration ?? null);
const [isGuided, setIsGuided] = useState(draftState.reflect?.isGuided ?? false);
const [trackProgress, setTrackProgress] = useState(draftState.reflect?.trackProgress ?? true);
const [skillPracticed, setSkillPracticed] = useState(draftState.reflect?.skillPracticed ?? '00');
```

**Step 3: Add useEffect to save draft on changes**

```tsx
useEffect(() => {
  // Save draft whenever state changes (but not if empty)
  if (content || showDetails || duration || isGuided !== false) {
    setReflectDraft({
      content,
      showDetails,
      duration,
      isGuided,
      trackProgress,
      skillPracticed,
    });
  }
}, [content, showDetails, duration, isGuided, trackProgress, skillPracticed]);
```

**Step 4: Clear draft on successful submit**

In `handleSubmit`, after successful entry creation, add:
```tsx
clearReflectDraft();
```

**Step 5: Update handleClose to NOT clear draft (allows persistence on swipe)**

Remove any draft clearing from handleClose - the draft should persist.

**Step 6: Add explicit "Discard" option in Cancel**

Change Cancel button to show confirmation if draft exists:
```tsx
const handleCancel = () => {
  if (content.trim()) {
    // Could add Alert here for confirmation, but for now just go back
    // Draft is preserved automatically
  }
  router.back();
};
```

**Step 7: Commit**

```bash
git add app/\(main\)/reflect.tsx
git commit -m "feat: persist reflect draft on modal dismiss"
```

---

## Task 4: Update Ask Screen to Use Draft Store

**Files:**
- Modify: `app/(main)/ask.tsx`

**Step 1: Import useDraft hook**

```tsx
import { useDraft, AskDraft } from '../../lib/draft-context';
```

**Step 2: Initialize state from draft**

```tsx
const { state: draftState, setAskDraft, clearAskDraft } = useDraft();

const [messages, setMessages] = useState<Message[]>(draftState.ask?.messages ?? []);
const [input, setInput] = useState(draftState.ask?.input ?? '');
const [trackProgress, setTrackProgress] = useState(draftState.ask?.trackProgress ?? true);
```

**Step 3: Add useEffect to save draft on changes**

```tsx
useEffect(() => {
  // Save draft whenever state changes
  if (messages.length > 0 || input) {
    setAskDraft({
      messages,
      input,
      trackProgress,
    });
  }
}, [messages, input, trackProgress]);
```

**Step 4: Clear draft on explicit Done (with save)**

In `handleClose`, after saving entry, add:
```tsx
clearAskDraft();
```

**Step 5: Commit**

```bash
git add app/\(main\)/ask.tsx
git commit -m "feat: persist ask draft on modal dismiss"
```

---

## Task 5: Add Visual Indicator for Existing Draft

**Files:**
- Modify: `components/FloatingButtons.tsx`

**Step 1: Import useDraft**

```tsx
import { useDraft } from '../lib/draft-context';
```

**Step 2: Add draft indicators to buttons**

Show a small dot or different style when draft exists:

```tsx
const { state: draftState } = useDraft();
const hasReflectDraft = !!draftState.reflect?.content;
const hasAskDraft = draftState.ask && (draftState.ask.messages.length > 0 || draftState.ask.input);
```

Add indicator dot to button:
```tsx
{hasReflectDraft && (
  <View style={{
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  }} />
)}
```

**Step 3: Commit**

```bash
git add components/FloatingButtons.tsx
git commit -m "feat: show draft indicator on floating buttons"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create draft-context.tsx with types, reducer, provider, hook |
| 2 | Wrap app with DraftProvider |
| 3 | Update reflect.tsx to restore/save drafts |
| 4 | Update ask.tsx to restore/save drafts |
| 5 | Add visual draft indicators to floating buttons |

## Unresolved Questions

- want confirmation dialog on Cancel when draft exists?
- persist drafts to AsyncStorage for app restart survival?
- auto-clear drafts after X hours of inactivity?
