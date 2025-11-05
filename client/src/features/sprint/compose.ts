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
export function quantifyImpact(userInput: string, problemContext?: string): ImpactBlock {
  const assumptions: string[] = [];
  const quantified: ImpactBlock['quantified'] = {};
  const calculatedMetrics: ImpactBlock['calculatedMetrics'] = {};

  // Extract numbers from user input
  const timeRegex = /(\d+)\s*(hours?|hrs?|minutes?|mins?|days?)/gi;
  const frequencyRegex = /(\d+)\s*(times?|x)\s*(per|\/|every)?\s*(week|day|month|year)/gi;
  const costRegex = /\$?([\d,]+)\s*(dollars?|usd|cost|expense)?/gi;
  const percentRegex = /(\d+)\s*(%|percent)/gi;

  // Parse time lost
  const timeMatch = userInput.match(timeRegex);
  if (timeMatch) {
    quantified.timeLost = timeMatch[0];
  } else {
    quantified.timeLost = '2 hours';
    assumptions.push('Assumed 2 hours per incident based on industry average');
  }

  // Parse frequency
  const freqMatch = userInput.match(frequencyRegex);
  if (freqMatch) {
    quantified.frequency = freqMatch[0];
  } else {
    quantified.frequency = '3 times per week';
    assumptions.push('Assumed 3 occurrences per week based on typical patterns');
  }

  // Calculate weekly hours
  let weeklyHours = 6; // default
  if (quantified.timeLost && quantified.frequency) {
    const hoursMatch = quantified.timeLost.match(/(\d+)/);
    const freqNumMatch = quantified.frequency.match(/(\d+)/);
    if (hoursMatch && freqNumMatch) {
      weeklyHours = parseInt(hoursMatch[1]) * parseInt(freqNumMatch[1]);
    }
  }
  calculatedMetrics.weeklyHours = weeklyHours;

  // Calculate monthly cost (assuming $75/hour blended rate)
  const hourlyRate = 75;
  calculatedMetrics.monthlyCost = weeklyHours * 4 * hourlyRate;
  calculatedMetrics.annualImpact = calculatedMetrics.monthlyCost * 12;

  // Parse risk or cost if mentioned
  const costMatch = userInput.match(costRegex);
  if (costMatch) {
    quantified.cost = costMatch[0];
  }

  // Identify risk factors
  if (userInput.toLowerCase().includes('error') || userInput.toLowerCase().includes('risk')) {
    quantified.risk = 'Quality and compliance risks identified';
  }

  return {
    userInput,
    quantified,
    assumptions: assumptions.length > 0 ? assumptions : undefined,
    calculatedMetrics
  };
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
  // Only include metrics that were explicitly discussed
  // Don't auto-generate placeholder data
  const baselineMetrics: SubmissionDraft['baseline_metrics'] = [];
  const targetMetrics: SubmissionDraft['target_metrics'] = [];

  // Only add metrics if they were explicitly provided in the impact data
  // Don't make assumptions or generate defaults

  const impactSummaryParts: string[] = [];
  if (impact.quantified?.frequency && impact.quantified?.timeLost) {
    impactSummaryParts.push(`Happens ${impact.quantified.frequency}, costing about ${impact.quantified.timeLost} each time.`);
  }
  if (impact.calculatedMetrics?.weeklyHours && impact.userInput.match(/\d+\s*(hours?|hrs?)/i)) {
    // Only include if user explicitly mentioned hours
    impactSummaryParts.push(`Roughly ${impact.calculatedMetrics.weeklyHours} hours lost per week.`);
  }
  if (impact.calculatedMetrics?.monthlyCost && impact.userInput.match(/\$|cost|expense/i)) {
    // Only include if user explicitly mentioned cost
    impactSummaryParts.push(`Approximately $${impact.calculatedMetrics.monthlyCost.toLocaleString()} per month in blended cost.`);
  }
  if (impact.quantified?.risk) {
    impactSummaryParts.push(impact.quantified.risk);
  }

  // Only use action plan and other fields if they're explicitly provided
  // Don't generate default ones
  const actionPlan: string[] = [];
  const successChecks: string[] = [];
  const risks: string[] = [];

  return {
    problem_summary: problem.userInput, // Use user input directly, not expanded version
    impact_summary: impactSummaryParts.join(' ') || impact.userInput, // Fall back to user input if no quantified parts
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
  const inferredProblem = problem || expandProblem('Business process optimization needed');

  // Infer impact if missing
  const inferredImpact = impact || quantifyImpact('Estimated 10 hours weekly impact', inferredProblem.userInput);

  return {
    problem: inferredProblem,
    impact: inferredImpact
  };
}