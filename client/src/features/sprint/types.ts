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

export interface ExploreBlock {
  technologies: Array<{
    name: string;
    description: string;
    relevance: string;
  }>;
  mvs?: {
    title: string;
    description: string;
    implementation: string[];
    estimatedTime?: string;
  };
  extendedPlan?: string[];
}

export interface SubmissionDraft {
  problem_summary: string;
  chosen_category: string;
  cisco_products: string[];
  current_state: {
    baseline_kpis: Array<{ name: string; value: string }>;
    constraints: string[];
  };
  target_state: {
    kpis: Array<{ name: string; target: string }>;
    persona: string[];
  };
  integration_points: string[];
  security_considerations: string[];
  observability_plan: string[];
  rollout_plan: string[];
  risks: string[];
}

export interface SprintState {
  step: SprintStep;
  inputsCount: number;
  completedSteps: Set<SprintStep>;
  problem?: ProblemBlock;
  impact?: ImpactBlock;
  explore?: ExploreBlock;
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
    | 'SET_EXPLORE' 
    | 'SET_SUBMISSION' 
    | 'UPDATE_SUBMISSION'
    | 'MARK_STEP_COMPLETE'
    | 'RESET_SPRINT'
    | 'ADD_MESSAGE';
  payload?: any;
}