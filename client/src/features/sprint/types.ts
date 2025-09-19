export type SprintStep = 1 | 2 | 3 | 4;

export interface ProblemBlock {
  userInput: string;
  expanded?: string;
  frictionPoints?: string[];
}

export interface ImpactBlock {
  userInput: string;
  quantified?: {
    frequency?: string;
    timeLost?: string;
    cost?: string;
    risk?: string;
  };
  assumptions?: string[];
  calculatedMetrics?: {
    weeklyHours?: number;
    monthlyCost?: number;
    annualImpact?: number;
  };
}

export interface SubmissionDraft {
  problem_summary: string;
  impact_summary: string;
  chosen_category: string;
  baseline_metrics: Array<{ name: string; value: string }>;
  target_metrics: Array<{ name: string; target: string }>;
  action_plan: string[];
  success_checks: string[];
  risks: string[];
}

export interface SprintState {
  step: SprintStep;
  inputsCount: number;
  completedSteps: Set<SprintStep>;
  problem?: ProblemBlock;
  impact?: ImpactBlock;
  submission?: SubmissionDraft;
  canSubmitAnytime: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface SprintAction {
  type:
    | 'SET_STEP'
    | 'ADD_USER_INPUT'
    | 'SET_PROBLEM'
    | 'SET_IMPACT'
    | 'SET_SUBMISSION'
    | 'UPDATE_SUBMISSION'
    | 'MARK_STEP_COMPLETE'
    | 'RESET_SPRINT'
    | 'ADD_MESSAGE';
  payload?: any;
}