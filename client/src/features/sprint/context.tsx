import { createContext, useContext, useReducer, ReactNode } from 'react';
import { SprintState, SprintAction, SprintStep } from './types';

const initialState: SprintState = {
  step: 1,
  inputsCount: 0,
  completedSteps: new Set<SprintStep>(),
  canSubmitAnytime: true,
  messages: []
};

function sprintReducer(state: SprintState, action: SprintAction): SprintState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'ADD_USER_INPUT':
      return { 
        ...state, 
        inputsCount: state.inputsCount + 1,
        messages: [...state.messages, { role: 'user', content: action.payload }]
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'SET_PROBLEM':
      const problemSteps = new Set(state.completedSteps);
      problemSteps.add(1);
      return { 
        ...state, 
        problem: action.payload,
        completedSteps: problemSteps
      };
    
    case 'SET_IMPACT':
      const impactSteps = new Set(state.completedSteps);
      impactSteps.add(1);
      impactSteps.add(2);
      return { 
        ...state, 
        impact: action.payload,
        completedSteps: impactSteps
      };
    
    case 'SET_SUBMISSION':
      const submissionSteps = new Set<SprintStep>();
      submissionSteps.add(1);
      submissionSteps.add(2);
      submissionSteps.add(3);
      submissionSteps.add(4);
      return {
        ...state,
        submission: action.payload,
        completedSteps: submissionSteps
      };
    
    case 'UPDATE_SUBMISSION':
      return {
        ...state,
        submission: action.payload
      };
    
    case 'MARK_STEP_COMPLETE':
      const updatedSteps = new Set(state.completedSteps);
      updatedSteps.add(action.payload);
      return {
        ...state,
        completedSteps: updatedSteps
      };
    
    case 'RESET_SPRINT':
      return initialState;
    
    default:
      return state;
  }
}

const SprintContext = createContext<{
  state: SprintState;
  dispatch: React.Dispatch<SprintAction>;
} | undefined>(undefined);

export function SprintProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sprintReducer, initialState);

  return (
    <SprintContext.Provider value={{ state, dispatch }}>
      {children}
    </SprintContext.Provider>
  );
}

export function useSprint() {
  const context = useContext(SprintContext);
  if (!context) {
    throw new Error('useSprint must be used within a SprintProvider');
  }
  return context;
}

// Helper functions for common state transitions
export function advanceToNextStep(dispatch: React.Dispatch<SprintAction>, currentStep: SprintStep) {
  if (currentStep < 4) {
    dispatch({ type: 'SET_STEP', payload: (currentStep + 1) as SprintStep });
  }
}

export function goToStep(dispatch: React.Dispatch<SprintAction>, step: SprintStep) {
  dispatch({ type: 'SET_STEP', payload: step });
}

export function isSubmitCommand(text: string): boolean {
  const submitVariations = ['submit', 'finish', 'finalize', 'ready', 'good to go', 'done'];
  const lowered = text.toLowerCase().trim();
  return submitVariations.some(variation => lowered.includes(variation));
}