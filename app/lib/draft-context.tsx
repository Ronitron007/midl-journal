import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message } from './openai';

// ============================================================================
// TYPES - These are the public API. Keep stable when switching implementations.
// ============================================================================

export type ReflectDraft = {
  content: string;
  showDetails: boolean;
  duration: number | null;
  isGuided: boolean;
  trackProgress: boolean;
  skillPracticed: string;
  entryDate: string; // YYYY-MM-DD format
};

export type AskDraft = {
  messages: Message[];
  input: string;
  trackProgress: boolean;
};

// Public hook return type - consumers only depend on this interface
export type DraftStore = {
  // Reflect
  reflectDraft: ReflectDraft | null;
  setReflectDraft: (draft: ReflectDraft) => void;
  clearReflectDraft: () => void;
  // Ask
  askDraft: AskDraft | null;
  setAskDraft: (draft: AskDraft) => void;
  clearAskDraft: () => void;
};

// ============================================================================
// IMPLEMENTATION - Can be swapped for Zustand/Jotai/Redux without changing API
// ============================================================================

type DraftState = {
  reflect: ReflectDraft | null;
  ask: AskDraft | null;
};

type DraftAction =
  | { type: 'SET_REFLECT_DRAFT'; payload: ReflectDraft }
  | { type: 'SET_ASK_DRAFT'; payload: AskDraft }
  | { type: 'CLEAR_REFLECT_DRAFT' }
  | { type: 'CLEAR_ASK_DRAFT' };

const initialState: DraftState = {
  reflect: null,
  ask: null,
};

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

const DraftContext = createContext<DraftStore | null>(null);

// ============================================================================
// PROVIDER - Wrap once at app root. To migrate: swap implementation, keep API.
// ============================================================================

export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(draftReducer, initialState);

  const store: DraftStore = {
    // Reflect
    reflectDraft: state.reflect,
    setReflectDraft: (draft) => dispatch({ type: 'SET_REFLECT_DRAFT', payload: draft }),
    clearReflectDraft: () => dispatch({ type: 'CLEAR_REFLECT_DRAFT' }),
    // Ask
    askDraft: state.ask,
    setAskDraft: (draft) => dispatch({ type: 'SET_ASK_DRAFT', payload: draft }),
    clearAskDraft: () => dispatch({ type: 'CLEAR_ASK_DRAFT' }),
  };

  return (
    <DraftContext.Provider value={store}>
      {children}
    </DraftContext.Provider>
  );
}

// ============================================================================
// HOOK - The only thing consumers import. Stable API regardless of backend.
// ============================================================================

export function useDraft(): DraftStore {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within DraftProvider');
  }
  return context;
}

// ============================================================================
// MIGRATION GUIDE
// ============================================================================
// To switch to Zustand:
// 1. Create a Zustand store with same shape as DraftStore
// 2. Update useDraft() to return the Zustand store
// 3. Make DraftProvider a no-op wrapper or remove it
// 4. No changes needed in consuming components (reflect.tsx, ask.tsx)
//
// Example Zustand migration:
// const useDraftStore = create<DraftStore>((set) => ({
//   reflectDraft: null,
//   setReflectDraft: (draft) => set({ reflectDraft: draft }),
//   clearReflectDraft: () => set({ reflectDraft: null }),
//   askDraft: null,
//   setAskDraft: (draft) => set({ askDraft: draft }),
//   clearAskDraft: () => set({ askDraft: null }),
// }));
// export const useDraft = useDraftStore;
// export const DraftProvider = ({ children }) => children; // no-op
