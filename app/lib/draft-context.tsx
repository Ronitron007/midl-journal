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
