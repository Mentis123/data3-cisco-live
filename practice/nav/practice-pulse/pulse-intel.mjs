// Opportunity intelligence layer for the AI practice pulse.
//
// Pure logic only: no DOM, no fetch, no globals. Everything here is driven by
// two inputs — a normalised opportunity record (as produced by app.js
// normaliseRecord) and the service catalogue parsed from
// nav/source-portfolio.psv. Nothing is invented: the SFDC extract carries no
// Amount, Owner, Stage or Close Date, and this module never fabricates them.

export const CATEGORIES = Object.freeze([
  'Foundation',
  'Delivery',
  'Adoption and value',
  'Governance and assurance',
  'Operations and optimisation'
]);

export const ATTACH_LIMIT = 12;

export const TERMINOLOGY_NOTE = 'Drawdown, Ongoing and Managed are provisional working labels for the annuity lenses. They are pending confirmed catalogue terminology and should be treated as a reading of the vehicle, not an approved product name.';

export const ANNUITY_LENSES = Object.freeze([
  Object.freeze({
    lens: 'Drawdown',
    vehicle: 'Entitled Drawdown',
    definition: 'Prepaid entitlement consumed on demand — an evolving backlog delivered incrementally against an agreed pool of capacity.',
    rationaleHint: 'Fits assessment, readiness, discovery and short pilot work where the scope is still forming and the customer wants an on-ramp rather than a committed programme.',
    note: TERMINOLOGY_NOTE
  }),
  Object.freeze({
    lens: 'Ongoing',
    vehicle: 'Committed Capacity',
    definition: 'Pre-committed squad capacity flowing as backlog.',
    rationaleHint: 'Fits prototyping, agent build and scaled rollout work where a use-case backlog is delivered as successive sprints by a standing squad.',
    note: TERMINOLOGY_NOTE
  }),
  Object.freeze({
    lens: 'Managed',
    vehicle: 'Standing Services',
    definition: 'Always-on service sold by presence, not hours — operational monitoring, governance, optimisation and support after implementation.',
    rationaleHint: 'Fits platform, landing-zone, governance and licensing-led work where the asset must be run, governed and optimised long after the build lands.',
    note: TERMINOLOGY_NOTE
  })
]);

const LENS_BY_VEHICLE = Object.freeze(Object.fromEntries(ANNUITY_LENSES.map(lens => [lens.vehicle, lens])));
const LENS_BY_NAME = Object.freeze(Object.fromEntries(ANNUITY_LENSES.map(lens => [lens.lens, lens])));

// Catalogue slices this practice can credibly attach from. Everything offered
// to the user is read out of the PSV; these selectors only narrow the pool.
const ATTACH_POOLS = Object.freeze([
  Object.freeze({ practice: 'Data & AI' }),
  Object.freeze({ practice: 'Business Advisory', capability: 'Information & Analytics' }),
  Object.freeze({ practice: 'Business Advisory', capability: 'Transformation & Governance' }),
  Object.freeze({ practice: 'Collaboration', capability: 'Adoption & Change' }),
  Object.freeze({ practice: 'Lifecycle Services', capability: 'Managed Services' }),
  Object.freeze({ practice: 'Lifecycle Services', capability: 'Support Services' })
]);

export function parseCatalogue(psvText) {
  const practices = [];
  const capabilities = [];
  const offerings = [];
  String(psvText || '').split(/\r?\n/).forEach(line => {
    const row = line.split('|').map(cell => cell.trim());
    if (row[0] === 'P' && row[1]) practices.push({ name: row[1], band: row[2] || '', bandShort: row[3] || '', vendor: row[4] || '' });
    if (row[0] === 'C' && row[1] && row[2]) capabilities.push({ practice: row[1], name: row[2] });
    if (row[0] === 'O' && row[1] && row[2] && row[3]) offerings.push({ practice: row[1], capability: row[2], name: row[3], vendor: row[4] || '' });
  });
  return { practices, capabilities, offerings };
}

function catalogueOfferings(catalogue) {
  const list = (catalogue && catalogue.offerings) || [];
  const seen = new Set();
  return list.filter(offering => {
    if (!ATTACH_POOLS.some(pool => pool.practice === offering.practice && (!pool.capability || pool.capability === offering.capability))) return false;
    const key = `${offering.practice}|${offering.capability}|${offering.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function recordText(record) {
  return [record && record.offering, record && record.sourceCapability, record && record.opportunity].filter(Boolean).join(' ').toLowerCase();
}

function subject(record) {
  const offering = record && record.offering;
  if (offering && offering !== 'Unmapped offering') return offering;
  const capability = record && record.sourceCapability;
  return capability && capability !== 'Unmapped capability' ? capability : 'this opportunity';
}

function traitsOf(record) {
  const text = recordText(record);
  const copilotStudio = /copilot studio|agent|agentic|generative/.test(text);
  return {
    text,
    copilot: /\bcopilot\b/.test(text) && !/copilot studio/.test(text),
    agentic: copilotStudio,
    platform: /foundry|landing zone|fabric|data platform|databricks/.test(text),
    analytics: /analytics|power bi|\bbi\b|fabric|information & analytics/.test(text),
    governance: /purview|governance|security|risk|compliance|shield|protection/.test(text),
    assessment: /readiness|assessment|discovery|review|workshop|planning/.test(text),
    envisioning: /envision|use-case|use case|discovery|advisory/.test(text),
    prototype: /prototyp|poc|proof of concept|pilot/.test(text),
    rollout: /rollout|scaled|deployment|accelerate|adoption|change manager/.test(text),
    licensing: /licens|csp|seats|\bm365 copilot\b/.test(text)
  };
}

function lensScores(traits) {
  const scores = { Drawdown: 0.18, Ongoing: 0.18, Managed: 0.18 };
  if (traits.assessment) scores.Drawdown += 0.62;
  if (traits.envisioning) scores.Drawdown += 0.22;
  if (traits.prototype) scores.Ongoing += 0.5;
  if (traits.agentic) scores.Ongoing += 0.32;
  if (traits.rollout) scores.Ongoing += 0.42;
  if (traits.platform) scores.Managed += 0.7;
  if (traits.governance) scores.Managed += 0.48;
  if (traits.licensing) scores.Managed += 0.34;
  return scores;
}

function rationaleFor(lensName, record, traits) {
  const name = subject(record);
  if (lensName === 'Managed') {
    if (traits.platform) return `${name} delivers a platform. A landing zone is not finished when it is built — it has to be operated, governed, cost-optimised and extended with new workloads, which is exactly what Standing Services sells: presence rather than hours.`;
    if (traits.governance) return `${name} is a control-and-assurance scope. Governance, data protection and AI risk posture drift the moment the project ends, so the work naturally becomes an always-on service under Standing Services rather than a finite engagement.`;
    if (traits.licensing) return `${name} is licensing-led. Once seats are deployed the ongoing value sits in tenancy health, entitlement optimisation and usage support, which is a standing-services relationship rather than a project.`;
    return `${name} produces something the customer has to keep running afterwards, which is the definition of a Standing Services relationship.`;
  }
  if (lensName === 'Ongoing') {
    if (traits.agentic || traits.prototype) return `${name} is a build-and-iterate scope: an agent or use-case backlog that is delivered as successive sprints. Committed Capacity fits because the customer buys a squad against a moving backlog, not a fixed statement of work.`;
    if (traits.rollout) return `${name} is a scaled rollout — waves of enablement, personas and change activity that continue for months. Committed Capacity lets the practice hold a squad against that rolling backlog.`;
    return `${name} is delivered as an evolving backlog rather than a single fixed deliverable, so Committed Capacity gives the customer a squad against that flow.`;
  }
  if (traits.assessment) return `${name} is an assessment-shaped engagement. It is a low-commitment on-ramp: the customer prepays an entitlement, consumes the assessment, and the findings then define the larger backlog. Entitled Drawdown is the natural first vehicle.`;
  if (traits.envisioning) return `${name} is discovery work whose scope is still forming. An entitlement pool lets the customer start now and shape the follow-on work from what the discovery finds.`;
  return `${name} is bounded, front-of-journey work best sold as a prepaid entitlement the customer draws down as the scope firms up.`;
}

export function annuityAnalysis(record) {
  const traits = traitsOf(record);
  const scores = lensScores(traits);
  const ranked = ANNUITY_LENSES.slice().sort((a, b) => scores[b.lens] - scores[a.lens]);
  const sourceVehicle = String((record && record.sourceVehicle) || '');
  const knownVehicle = ANNUITY_LENSES.find(lens => sourceVehicle.includes(lens.vehicle));
  const primary = knownVehicle || LENS_BY_VEHICLE[(record && record.vehicle) || ''] || ranked[0];
  return {
    primary,
    alternates: ranked.filter(lens => lens.lens !== primary.lens),
    rationale: rationaleFor(primary.lens, record, traits),
    basis: knownVehicle ? 'known' : 'inferred',
    note: TERMINOLOGY_NOTE
  };
}

// Each rule names catalogue offerings exactly as the PSV spells them. A rule
// that matches nothing in the catalogue simply produces nothing, so the attach
// set can never contain an offering the practice does not actually sell.
const ATTACH_RULES = Object.freeze([
  {
    names: ['M365 Copilot - Readiness Assessment'],
    category: 'Foundation',
    lens: 'Drawdown',
    relationship: 'Prerequisite',
    timing: 'Before or alongside the current scope',
    base: 0.94,
    relevance: traits => (traits.copilot ? 1 : traits.licensing ? 0.7 : 0.35),
    why: record => `${subject(record)} assumes the tenant is Copilot-ready. A readiness assessment proves licensing, data hygiene and oversharing posture before deployment effort is spent.`
  },
  {
    names: ['Azure Planning and Readiness Assessment'],
    category: 'Foundation',
    lens: 'Drawdown',
    relationship: 'Prerequisite',
    timing: 'Before build starts',
    base: 0.86,
    relevance: traits => (traits.platform ? 1 : 0.3),
    why: record => `${subject(record)} lands Azure-hosted AI infrastructure, so subscription design, networking and identity readiness should be confirmed before the landing zone is cut.`
  },
  {
    names: ['Data & AI Strategy & Roadmaps'],
    category: 'Foundation',
    lens: 'Drawdown',
    relationship: 'Frames the programme',
    timing: 'Before or alongside the current scope',
    base: 0.8,
    relevance: traits => (traits.envisioning || traits.platform || traits.agentic ? 0.9 : 0.55),
    why: record => `${subject(record)} is one move inside a wider data and AI agenda; a roadmap turns it into a sequenced programme instead of a standalone piece of work.`
  },
  {
    names: ['Microsoft AI Envisioning'],
    category: 'Foundation',
    lens: 'Drawdown',
    relationship: 'Fills the backlog',
    timing: 'Before the next wave',
    base: 0.84,
    relevance: traits => (traits.agentic || traits.platform ? 0.95 : 0.5),
    why: record => `${subject(record)} needs a use-case pipeline behind it. Envisioning is the funded workshop that produces the ranked backlog the build capacity then consumes.`
  },
  {
    names: ['Data Architecture', 'Data Platforms & Migration', 'Data Engineering & Integration'],
    category: 'Foundation',
    lens: 'Ongoing',
    relationship: 'Supplies the grounding data',
    timing: 'Alongside the current scope',
    base: 0.78,
    relevance: traits => (traits.platform || traits.analytics ? 0.95 : traits.agentic ? 0.72 : 0.35),
    why: record => `Grounding quality decides whether ${subject(record)} produces trustworthy answers, and that depends on the data estate feeding it.`
  },
  {
    names: ['Fabric Foundation Rapid', 'Analytics Assessment and PoV', 'Analytics Capability Roadmap'],
    category: 'Foundation',
    lens: 'Drawdown',
    relationship: 'Establishes the analytics base',
    timing: 'Before or alongside the current scope',
    base: 0.72,
    relevance: traits => (traits.analytics ? 0.95 : 0.3),
    why: record => `${subject(record)} sits on analytics foundations; a proof of value establishes the Fabric and reporting base the AI layer will read from.`
  },
  {
    names: ['Copilot Studio', 'Copilot Studio Prototyping'],
    category: 'Delivery',
    lens: 'Ongoing',
    relationship: 'Builds the next use case',
    timing: 'Immediately after the current scope',
    base: 0.92,
    relevance: traits => (traits.agentic ? 1 : traits.copilot ? 0.78 : 0.4),
    why: record => `${subject(record)} creates demand for agents against the same estate; a prototyping squad converts that demand into working agents sprint by sprint.`
  },
  {
    names: ['Advanced Analytics & AI (Databricks, ML, Azure AI / OpenAI)'],
    category: 'Delivery',
    lens: 'Ongoing',
    relationship: 'Builds on the platform',
    timing: 'After the platform lands',
    base: 0.9,
    relevance: traits => (traits.platform || traits.agentic ? 1 : 0.35),
    why: record => `${subject(record)} provides the runway; the workloads that justify it are the Azure AI and ML solutions built on top of it.`
  },
  {
    names: ['Data & AI Driven Automation & Workflows'],
    category: 'Delivery',
    lens: 'Ongoing',
    relationship: 'Extends into process',
    timing: 'After first value is proven',
    base: 0.76,
    relevance: traits => (traits.agentic || traits.copilot ? 0.9 : 0.45),
    why: record => `Once ${subject(record)} proves the pattern, the value compounds by wiring it into the business processes around it rather than leaving it as an assistant.`
  },
  {
    names: ['Microsoft 365 Copilot - Pilot', 'M365 Copilot'],
    category: 'Delivery',
    lens: 'Ongoing',
    relationship: 'Next stage of the same journey',
    timing: 'Immediately after the current scope',
    base: 0.88,
    relevance: traits => (traits.copilot || traits.licensing ? 1 : 0.3),
    why: record => `${subject(record)} is a stage on the Copilot path; the pilot and the scaled licence estate are the steps either side of it.`
  },
  {
    names: ['Business Intelligence (Power BI, Fabric, OneLake)', 'Advanced Analytics & Decision Intelligence'],
    category: 'Delivery',
    lens: 'Ongoing',
    relationship: 'Surfaces the outcome',
    timing: 'Alongside or after delivery',
    base: 0.7,
    relevance: traits => (traits.analytics || traits.platform ? 0.85 : 0.35),
    why: record => `The outputs of ${subject(record)} need somewhere to be seen and acted on, which is a reporting and decision-intelligence layer.`
  },
  {
    names: ['Adoption and Change Management', 'Organisational Change Management'],
    category: 'Adoption and value',
    lens: 'Ongoing',
    relationship: 'Protects the outcome',
    timing: 'Alongside delivery and for the wave after',
    base: 0.9,
    relevance: traits => (traits.copilot || traits.rollout ? 1 : traits.agentic ? 0.75 : 0.5),
    why: record => `${subject(record)} only returns value if people change how they work; structured adoption is the difference between licences deployed and licences used.`
  },
  {
    names: ['Business Case Development'],
    category: 'Adoption and value',
    lens: 'Drawdown',
    relationship: 'Funds the next wave',
    timing: 'Before the next budget cycle',
    base: 0.72,
    relevance: traits => (traits.copilot || traits.rollout || traits.platform ? 0.85 : 0.5),
    why: record => `A measured business case turns whatever ${subject(record)} delivers into the evidence that funds the following wave.`
  },
  {
    names: ['Business Process Optimisation'],
    category: 'Adoption and value',
    lens: 'Ongoing',
    relationship: 'Finds the value',
    timing: 'After first value is proven',
    base: 0.64,
    relevance: traits => (traits.agentic || traits.rollout ? 0.8 : 0.45),
    why: record => `${subject(record)} exposes where the process itself is the constraint; optimising it is usually where the measurable saving actually sits.`
  },
  {
    names: ['Unified Data Governance (Purview)'],
    category: 'Governance and assurance',
    lens: 'Managed',
    relationship: 'Mandatory control layer',
    timing: 'Before or alongside the current scope',
    base: 0.96,
    relevance: traits => (traits.copilot || traits.agentic || traits.platform || traits.governance ? 1 : 0.6),
    why: record => `${subject(record)} puts an AI surface over corporate content. Purview classification, labelling and oversharing control is what stops that surface becoming a data-exposure incident.`
  },
  {
    names: ['Information Management & Governance', 'Data Governance & Quality Control'],
    category: 'Governance and assurance',
    lens: 'Managed',
    relationship: 'Sustains trust',
    timing: 'Alongside and after delivery',
    base: 0.74,
    relevance: traits => (traits.governance || traits.platform || traits.analytics ? 0.9 : 0.5),
    why: record => `Answers from ${subject(record)} are only as defensible as the quality and ownership of the information behind them.`
  },
  {
    names: ['Microsoft 365 Copilot - Copilot Shield'],
    category: 'Governance and assurance',
    lens: 'Managed',
    relationship: 'Hardens the tenant',
    timing: 'Before broad rollout',
    base: 0.8,
    relevance: traits => (traits.copilot || traits.licensing ? 0.95 : 0.25),
    why: record => `${subject(record)} widens who can ask Copilot for what; Copilot Shield closes the oversharing exposure that scale creates.`
  },
  {
    names: ['Azure Managed Service', 'Azure Platform Support'],
    category: 'Operations and optimisation',
    lens: 'Managed',
    relationship: 'Runs what was built',
    timing: 'From go-live onwards',
    base: 0.93,
    relevance: traits => (traits.platform ? 1 : 0.3),
    why: record => `${subject(record)} hands the customer an Azure platform to run. Managed operation, patching, cost control and optimisation is the annuity that follows the build.`
  },
  {
    names: ['Enterprise Managed Service (New)', 'Bespoke Service - Managed'],
    category: 'Operations and optimisation',
    lens: 'Managed',
    relationship: 'Standing operational presence',
    timing: 'From go-live onwards',
    base: 0.82,
    relevance: traits => (traits.platform || traits.governance || traits.rollout ? 0.9 : 0.45),
    why: record => `After ${subject(record)} the customer needs someone accountable for the service day to day rather than a project team that has stood down.`
  },
  {
    names: ['Transition'],
    category: 'Operations and optimisation',
    lens: 'Managed',
    relationship: 'Bridges build to run',
    timing: 'At handover',
    base: 0.62,
    relevance: traits => (traits.platform ? 0.85 : 0.35),
    why: record => `Moving ${subject(record)} from project delivery into a supported run state is a funded transition, not an assumption.`
  }
]);

// Maps an extract offering label onto the catalogue name it corresponds to.
// The extract uses practice shorthand ("Foundry Landing Zone"); the catalogue
// uses formal names. Matching is keyword-based and returns a catalogue name to
// be looked up, never a fabricated offering.
const PROPOSAL_MATCHES = Object.freeze([
  { test: /readiness/, name: 'M365 Copilot - Readiness Assessment' },
  { test: /copilot studio|agent prototyp/, name: 'Copilot Studio Prototyping' },
  { test: /shield/, name: 'Microsoft 365 Copilot - Copilot Shield' },
  { test: /copilot pilot/, name: 'Microsoft 365 Copilot - Pilot' },
  { test: /scaled rollout|cowork|licensing-led/, name: 'M365 Copilot' },
  { test: /envisioning|use-case discovery/, name: 'Microsoft AI Envisioning' },
  { test: /purview|security & risk|governance/, name: 'Unified Data Governance (Purview)' },
  { test: /fabric/, name: 'Fabric Foundation Rapid' },
  { test: /foundry|landing zone/, name: 'Advanced Analytics & AI (Databricks, ML, Azure AI / OpenAI)' }
]);

function proposalOfferingName(record) {
  const value = String((record && record.offering) || '').toLowerCase();
  if (!value || value === 'unmapped offering') return '';
  const match = PROPOSAL_MATCHES.find(entry => entry.test.test(value));
  return match ? match.name : '';
}

function round2(value) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

export function attachableOfferings(record, catalogue) {
  const pool = catalogueOfferings(catalogue);
  if (!pool.length) return [];
  const traits = traitsOf(record);
  const proposalName = proposalOfferingName(record);
  const items = [];
  const claimed = new Set();
  ATTACH_RULES.forEach(rule => {
    const relevance = rule.relevance(traits);
    rule.names.forEach(name => {
      const offering = pool.find(entry => entry.name === name);
      if (!offering || claimed.has(name)) return;
      const inProposal = Boolean(proposalName) && name === proposalName;
      if (!inProposal && relevance < 0.4) return;
      claimed.add(name);
      items.push({
        offering,
        category: rule.category,
        why: rule.why(record, traits),
        relationship: inProposal ? 'Already the mapped scope' : rule.relationship,
        timing: inProposal ? 'In the current proposal' : rule.timing,
        lens: LENS_BY_NAME[rule.lens],
        fit: inProposal ? 1 : round2(rule.base * relevance),
        inProposal,
        status: inProposal ? 'in-proposal' : 'not-yet-discussed'
      });
    });
  });

  const byCategory = new Map(CATEGORIES.map(category => [category, []]));
  items.forEach(item => byCategory.get(item.category).push(item));
  byCategory.forEach(list => list.sort((a, b) => b.fit - a.fit || a.offering.name.localeCompare(b.offering.name)));

  // Round-robin across the applicable categories so the cap never silences a
  // whole category, then present in category order.
  const selected = [];
  const cursors = new Map(CATEGORIES.map(category => [category, 0]));
  let progressed = true;
  while (selected.length < ATTACH_LIMIT && progressed) {
    progressed = false;
    for (const category of CATEGORIES) {
      if (selected.length >= ATTACH_LIMIT) break;
      const list = byCategory.get(category);
      const cursor = cursors.get(category);
      if (cursor >= list.length) continue;
      selected.push(list[cursor]);
      cursors.set(category, cursor + 1);
      progressed = true;
    }
  }
  return selected.sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || b.fit - a.fit || a.offering.name.localeCompare(b.offering.name));
}

export function evidenceProfile(record) {
  const analysis = annuityAnalysis(record);
  const has = value => value !== null && value !== undefined && value !== '';
  const rows = [
    { field: 'account', label: 'Account', state: 'known', detail: record.account },
    { field: 'opportunity', label: 'Opportunity name', state: 'known', detail: record.opportunity },
    { field: 'offering', label: 'Offering mapping', state: 'known', detail: `Offering column reads “${record.offering}”.` },
    { field: 'sourceCapability', label: 'Capability mapping', state: 'known', detail: `Capability column reads “${record.sourceCapability}”.` },
    { field: 'vehicle', label: 'Annuity vehicle', state: analysis.basis === 'known' ? 'known' : 'inferred', detail: analysis.basis === 'known' ? `Vehicle column names ${record.sourceVehicle}.` : 'No vehicle named in the extract; the vehicle shown is derived from the offering text.' },
    { field: 'status', label: 'Lifecycle status', state: 'known', detail: record.status },
    { field: 'region', label: 'State / region', state: has(record.region) && record.region !== 'Unknown' ? 'known' : 'unknown', detail: has(record.region) && record.region !== 'Unknown' ? record.region : 'The State column is blank for this row.' },
    { field: 'id', label: 'Salesforce record ID', state: has(record.id) ? 'known' : 'unknown', detail: has(record.id) ? record.id : 'No opportunity ID in the extract, so no direct Salesforce link can be built.' },
    { field: 'confidence', label: 'Mapping confidence', state: record.confidence === null || record.confidence === undefined ? 'unknown' : 'known', detail: record.confidence === null || record.confidence === undefined ? 'No confidence score supplied for this row.' : `${Math.round(record.confidence * 100)}% confidence in the offering and capability mapping.` },
    { field: 'capabilities', label: 'Capability lenses', state: 'inferred', detail: `Derived by mapping the Capability column onto practice lenses: ${(record.capabilities || []).join(', ')}.` },
    { field: 'annuityLens', label: 'Annuity lens', state: analysis.basis === 'known' ? 'inferred' : 'inferred', detail: `${analysis.primary.lens} lens applied over ${analysis.primary.vehicle}. Lens names are provisional working labels.` },
    { field: 'amount', label: 'Opportunity value', state: 'unknown', detail: 'No Amount column in this extract.' },
    { field: 'closeDate', label: 'Close date', state: 'unknown', detail: 'No Close Date column in this extract.' },
    { field: 'stage', label: 'Detailed stage', state: 'unknown', detail: 'The extract carries lifecycle status only, not the sales stage.' },
    { field: 'owner', label: 'Opportunity owner', state: 'unknown', detail: 'No Owner column in this extract.' },
    { field: 'problem', label: 'Customer problem statement', state: 'unknown', detail: 'Not captured anywhere in the extract.' },
    { field: 'proposal', label: 'Current proposal content', state: 'unknown', detail: 'The extract does not carry what has actually been proposed or priced.' },
    { field: 'stakeholders', label: 'Stakeholders', state: 'unknown', detail: 'No contact or stakeholder data in this extract.' }
  ];
  return rows;
}

export function suggestedQuestions(record) {
  const analysis = annuityAnalysis(record);
  const traits = traitsOf(record);
  const name = subject(record);
  const questions = [
    `What is the value of ${record.opportunity} and when is it expected to close? The extract carries neither.`,
    `What problem did ${record.account} actually describe, and what has been proposed to them so far?`
  ];
  if (analysis.primary.lens === 'Managed') questions.push(`Is ${record.account} open to a standing-services arrangement once ${name} is delivered, or is this being sold as a one-off build?`);
  if (analysis.primary.lens === 'Ongoing') questions.push(`Is there a ranked backlog behind ${name}, or is this a single use case? A backlog is what justifies committed squad capacity.`);
  if (analysis.primary.lens === 'Drawdown') questions.push(`What is the intended follow-on after ${name}? Drawdown only pays off if the assessment leads somewhere.`);
  if (traits.copilot || traits.agentic || traits.platform) questions.push(`Has data governance been discussed with ${record.account}? Purview classification and oversharing control is a prerequisite for ${name}, not an optional attach.`);
  if (!record.id) questions.push('This row has no Salesforce opportunity ID — is the record actually in SFDC, or is it being tracked outside it?');
  if (record.confidence !== null && record.confidence !== undefined && record.confidence < 0.8) questions.push(`The offering mapping for ${name} is only ${Math.round(record.confidence * 100)}% confident — is the capability and offering mapping correct?`);
  questions.push(`Who owns ${record.opportunity}, and who is the decision maker at ${record.account}?`);
  return questions.slice(0, 6);
}

export function applyCorrections(record, corrections) {
  const input = corrections || {};
  const corrected = [];
  const next = { ...record };
  if (input.capability && input.capability !== record.primaryCapability) {
    next.primaryCapability = input.capability;
    next.capabilities = [input.capability, ...(record.capabilities || []).filter(item => item !== input.capability)];
    corrected.push('capability');
  }
  if (input.offering && input.offering !== record.offering) {
    next.offering = input.offering;
    corrected.push('offering');
  }
  if (input.lens && LENS_BY_NAME[input.lens]) {
    const lens = LENS_BY_NAME[input.lens];
    if (lens.vehicle !== record.vehicle) {
      next.vehicle = lens.vehicle;
      next.sourceVehicle = lens.vehicle;
      corrected.push('lens');
    }
  }
  return { record: next, corrected };
}
