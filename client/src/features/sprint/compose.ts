import { ProblemBlock, ImpactBlock, ExploreBlock, SubmissionDraft } from './types';

// Cisco technology mapping based on problem categories
const CISCO_TECH_MAP = {
  security: ['Cisco Umbrella', 'Cisco SecureX', 'Cisco Secure Firewall', 'Duo Security'],
  network: ['Cisco SD-WAN', 'Cisco Catalyst', 'Cisco Meraki', 'Cisco DNA Center'],
  collaboration: ['Webex', 'Cisco Unified Communications Manager', 'Cisco Contact Center'],
  observability: ['ThousandEyes', 'AppDynamics', 'Cisco Observability Platform'],
  edge: ['Cisco Edge Intelligence', 'Cisco IoT Operations', 'Cisco Industrial Ethernet'],
  automation: ['Cisco Intersight', 'Cisco NSO', 'Cisco DNA Automation']
};

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
 * Maps relevant Cisco technologies based on problem and impact
 */
export function mapTechnologies(problem: ProblemBlock, impact: ImpactBlock): ExploreBlock {
  const technologies: ExploreBlock['technologies'] = [];
  const problemText = (problem.expanded || problem.userInput).toLowerCase();
  
  // Determine relevant technology categories
  const relevantCategories: string[] = [];
  
  if (problemText.includes('security') || problemText.includes('breach') || problemText.includes('threat')) {
    relevantCategories.push('security');
  }
  if (problemText.includes('network') || problemText.includes('connectivity') || problemText.includes('bandwidth')) {
    relevantCategories.push('network');
  }
  if (problemText.includes('collaboration') || problemText.includes('meeting') || problemText.includes('communication')) {
    relevantCategories.push('collaboration');
  }
  if (problemText.includes('monitor') || problemText.includes('visibility') || problemText.includes('observe')) {
    relevantCategories.push('observability');
  }
  if (problemText.includes('automat') || problemText.includes('manual') || problemText.includes('workflow')) {
    relevantCategories.push('automation');
  }

  // Default to network and observability if no clear match
  if (relevantCategories.length === 0) {
    relevantCategories.push('network', 'observability');
  }

  // Add top 3 technologies
  relevantCategories.slice(0, 2).forEach(category => {
    const techs = CISCO_TECH_MAP[category as keyof typeof CISCO_TECH_MAP] || [];
    techs.slice(0, 2).forEach(tech => {
      technologies.push({
        name: tech,
        description: `Enterprise-grade solution for ${category} challenges`,
        relevance: `Directly addresses the ${category} aspects of your problem`
      });
    });
  });

  // Create MVS (Minimal Viable Solution)
  const mvs: ExploreBlock['mvs'] = {
    title: 'Quick Win Implementation',
    description: `Deploy ${technologies[0]?.name || 'Cisco solution'} to address immediate pain points`,
    implementation: [
      'Phase 1: Deploy core functionality in pilot area',
      'Phase 2: Integrate with existing systems',
      'Phase 3: Scale to full production'
    ],
    estimatedTime: '4-6 weeks for initial deployment'
  };

  // Extended plan
  const extendedPlan = [
    'Establish success metrics and baseline measurements',
    'Complete security review and compliance checks',
    'Train key users and administrators',
    'Implement monitoring and alerting',
    'Document processes and create runbooks'
  ];

  return {
    technologies: technologies.slice(0, 3),
    mvs,
    extendedPlan
  };
}

/**
 * Composes a complete submission from problem, impact, and explore blocks
 */
export function composeSubmission(
  problem: ProblemBlock,
  impact: ImpactBlock,
  explore: ExploreBlock
): SubmissionDraft {
  const baselineKpis = [];
  const targetKpis = [];

  // Create KPIs from impact metrics
  if (impact.calculatedMetrics?.weeklyHours) {
    baselineKpis.push({
      name: 'Weekly Hours Lost',
      value: `${impact.calculatedMetrics.weeklyHours} hours`
    });
    targetKpis.push({
      name: 'Weekly Hours Lost',
      target: `< ${Math.round(impact.calculatedMetrics.weeklyHours * 0.3)} hours`
    });
  }

  if (impact.calculatedMetrics?.monthlyCost) {
    baselineKpis.push({
      name: 'Monthly Cost Impact',
      value: `$${impact.calculatedMetrics.monthlyCost.toLocaleString()}`
    });
    targetKpis.push({
      name: 'Monthly Cost Impact',
      target: `< $${Math.round(impact.calculatedMetrics.monthlyCost * 0.3).toLocaleString()}`
    });
  }

  // Determine category based on technologies
  let category = 'OBSERVABILITY';
  const techNames = explore.technologies.map(t => t.name.toLowerCase()).join(' ');
  if (techNames.includes('secure') || techNames.includes('duo')) {
    category = 'SECURE_CONNECTIVITY';
  } else if (techNames.includes('webex') || techNames.includes('contact')) {
    category = 'COLLAB_CX';
  } else if (techNames.includes('meraki') || techNames.includes('sd-wan')) {
    category = 'HYBRID_DC';
  } else if (techNames.includes('edge') || techNames.includes('iot')) {
    category = 'EDGE_IOT';
  }

  return {
    problem_summary: problem.expanded || problem.userInput,
    chosen_category: category,
    cisco_products: explore.technologies.map(t => t.name),
    current_state: {
      baseline_kpis: baselineKpis,
      constraints: problem.frictionPoints || ['Process inefficiencies', 'Manual interventions']
    },
    target_state: {
      kpis: targetKpis,
      persona: ['Operations Team', 'End Users', 'IT Administrators']
    },
    integration_points: explore.mvs?.implementation || [],
    security_considerations: [
      'Zero-trust architecture implementation',
      'End-to-end encryption for data in transit',
      'Role-based access control (RBAC)'
    ],
    observability_plan: [
      'Real-time dashboards for key metrics',
      'Automated alerting for threshold breaches',
      'Monthly performance reports'
    ],
    rollout_plan: explore.extendedPlan || [],
    risks: [
      'User adoption and change management',
      'Integration complexity with legacy systems',
      'Initial training requirements'
    ]
  };
}

/**
 * Auto-infers missing sections when user wants to submit early
 */
export function inferMissingData(
  problem?: ProblemBlock,
  impact?: ImpactBlock,
  explore?: ExploreBlock
): { problem: ProblemBlock; impact: ImpactBlock; explore: ExploreBlock } {
  // Infer problem if missing
  const inferredProblem = problem || expandProblem('Business process optimization needed');
  
  // Infer impact if missing
  const inferredImpact = impact || quantifyImpact('Estimated 10 hours weekly impact', inferredProblem.userInput);
  
  // Infer explore if missing
  const inferredExplore = explore || mapTechnologies(inferredProblem, inferredImpact);

  return {
    problem: inferredProblem,
    impact: inferredImpact,
    explore: inferredExplore
  };
}