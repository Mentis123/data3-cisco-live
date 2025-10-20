import { ProblemBlock, ImpactBlock, SubmissionDraft } from './types';

/**
 * Expands a user's problem statement into a structured problem block
 */
export function expandProblem(userInput: string): ProblemBlock {
  // Extract key friction points from the problem statement
  const frictionKeywords = ['waste', 'delay', 'error', 'manual', 'slow', 'confusion', 'duplicate', 'fail', 'risk', 'outage'];
  const frictionPoints: string[] = [];
  
  // Simple extraction of friction points based on keywords
  const sentences = userInput.split(/[.!?]/);
  sentences.forEach(sentence => {
    if (frictionKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      frictionPoints.push(sentence.trim());
    }
  });

  // If no friction points found, create generic ones
  if (frictionPoints.length === 0) {
    frictionPoints.push('Process inefficiency identified');
    frictionPoints.push('Manual intervention required');
    frictionPoints.push('Scalability concerns present');
  }

  // Create expanded description
  const expanded = `${userInput}\n\nKey friction points:\n• ${frictionPoints.join('\n• ')}`;

  return {
    userInput,
    expanded,
    frictionPoints
  };
}

/**
 * Quantifies impact from user input with assumptions if needed
 */
export function quantifyImpact(userInput: string, _problemContext?: string): ImpactBlock {
  const quantified: ImpactBlock['quantified'] = {};
  const calculatedMetrics: ImpactBlock['calculatedMetrics'] = {};

  const timeRegex = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|days?)/i;
  const frequencyRegex = /(\d+(?:\.\d+)?)\s*(times?|x)?\s*(per|\/|every)?\s*(week|day|month|year)/i;
  const costRegex = /\$?([\d,]+)\s*(dollars?|usd|cost|expense)?/i;

  const timeMatch = userInput.match(timeRegex);
  if (timeMatch) {
    quantified.timeLost = timeMatch[0].trim();
  }

  const frequencyMatch = userInput.match(frequencyRegex);
  if (frequencyMatch) {
    quantified.frequency = frequencyMatch[0].trim();
  }

  const parseTimeToHours = (text: string): number | null => {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    const unitMatch = text.match(/(hours?|hrs?|minutes?|mins?|days?)/i);
    if (!unitMatch) return null;
    const unit = unitMatch[1].toLowerCase();
    if (unit.startsWith('day')) {
      return value * 24;
    }
    if (unit.startsWith('min')) {
      return value / 60;
    }
    return value;
  };

  const parseFrequencyPerWeek = (text: string): number | null => {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    const periodMatch = text.match(/(week|day|month|year)/i);
    if (!periodMatch) return null;
    const period = periodMatch[1].toLowerCase();
    switch (period) {
      case 'day':
        return value * 7;
      case 'week':
        return value;
      case 'month':
        return value / 4;
      case 'year':
        return value / 52;
      default:
        return null;
    }
  };

  const hoursPerOccurrence = quantified.timeLost ? parseTimeToHours(quantified.timeLost) : null;
  const occurrencesPerWeek = quantified.frequency ? parseFrequencyPerWeek(quantified.frequency) : null;

  if (hoursPerOccurrence != null && occurrencesPerWeek != null) {
    const weeklyHours = hoursPerOccurrence * occurrencesPerWeek;
    if (Number.isFinite(weeklyHours) && weeklyHours > 0) {
      calculatedMetrics.weeklyHours = Number(weeklyHours.toFixed(2));
      const hourlyRate = 75;
      const monthlyCost = weeklyHours * 4 * hourlyRate;
      calculatedMetrics.monthlyCost = Math.round(monthlyCost);
      calculatedMetrics.annualImpact = Math.round(monthlyCost * 12);
    }
  }

  const costMatch = userInput.match(costRegex);
  if (costMatch) {
    quantified.cost = costMatch[0].trim();
  }

  const riskSentence = userInput
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .find((sentence) => /\b(risk|error|incident|outage)\b/i.test(sentence));
  if (riskSentence) {
    quantified.risk = riskSentence;
  }

  const result: ImpactBlock = { userInput };

  if (Object.keys(quantified).length > 0) {
    result.quantified = quantified;
  }

  if (Object.keys(calculatedMetrics).length > 0) {
    result.calculatedMetrics = calculatedMetrics;
  }

  return result;
}

/**
 * Infers the leaderboard category based on problem and impact cues
 */
function deriveCategory(problem: ProblemBlock, impact: ImpactBlock): string {
  const text = `${problem.userInput} ${impact.userInput}`.toLowerCase();

  if (text.includes('security') || text.includes('zero trust') || text.includes('breach') || text.includes('access')) {
    return 'SECURE_CONNECTIVITY';
  }
  if (text.includes('data center') || text.includes('infrastructure') || text.includes('server') || text.includes('cloud')) {
    return 'HYBRID_DC';
  }
  if (text.includes('collaboration') || text.includes('meeting') || text.includes('contact center') || text.includes('customer experience')) {
    return 'COLLAB_CX';
  }
  if (text.includes('visibility') || text.includes('monitor') || text.includes('performance') || text.includes('analytics')) {
    return 'OBSERVABILITY';
  }
  if (text.includes('factory') || text.includes('sensor') || text.includes('field') || text.includes('iot') || text.includes('edge')) {
    return 'EDGE_IOT';
  }

  return 'OBSERVABILITY';
}

/**
 * Composes a complete submission from problem, impact, and explore blocks
 */
export function composeSubmission(
  problem: ProblemBlock,
  impact: ImpactBlock
): SubmissionDraft {
  const impactSummary = impact.userInput.trim();

  const baselineMetrics: SubmissionDraft['baseline_metrics'] = [];
  const targetMetrics: SubmissionDraft['target_metrics'] = [];

  const actionPlan: string[] = [];
  const frictionPoints = problem.frictionPoints || [];
  if (frictionPoints[0]) {
    actionPlan.push(`Map current workflow to validate: ${frictionPoints[0]}.`);
  }
  actionPlan.push('Run a quick win experiment with one team to prove the improvement.');
  actionPlan.push('Set up weekly metric tracking and share progress with stakeholders.');

  const successChecks = [
    'Baseline vs target metrics reviewed weekly',
    'Stakeholder check-in after pilot to confirm improvements',
    'Document lessons learned for broader rollout'
  ];

  const risks = [
    'Change management or training effort underestimated',
    'Data for tracking KPIs is incomplete or delayed',
    'Competing priorities slow down follow-through'
  ];

  return {
    problem_summary: problem.expanded || problem.userInput,
    impact_summary: impactSummary,
    chosen_category: deriveCategory(problem, impact),
    baseline_metrics: baselineMetrics,
    target_metrics: targetMetrics,
    action_plan: actionPlan,
    success_checks: successChecks,
    risks
  };
}

/**
 * Auto-infers missing sections when user wants to submit early
 */
export function inferMissingData(
  problem?: ProblemBlock,
  impact?: ImpactBlock
): { problem: ProblemBlock; impact: ImpactBlock } {
  // Infer problem if missing
  const inferredProblem = problem || { userInput: 'Problem details not provided yet.' };

  // Infer impact if missing
  const inferredImpact = impact || { userInput: 'Impact details not provided yet.' };

  return {
    problem: inferredProblem,
    impact: inferredImpact
  };
}