// Reconciled open-pipeline matrix supplied by the AI Taskforce on 28 August 2026.
// Amounts are aggregate opportunity Amount (AUD), not GP or recurring ACV.

export const COMMERCIAL_SNAPSHOT_DATE = '28 August 2026';
export const COMMERCIAL_SOURCE = 'Reconciled Salesforce dataset';
export const COMMERCIAL_NOTE = 'Values are open pipeline Amount, not GP and not ACV until contracted as recurring.';

export const COMMERCIAL_STATES = Object.freeze([
  'WA',
  'NSW',
  'QLD',
  'SA',
  'VIC',
  'ACT',
  'Unassigned'
]);

export const OFFER_FAMILIES = Object.freeze([
  Object.freeze({
    name: 'Foundry / Landing Zone',
    vehicle: 'Standing Services',
    why: 'Run, govern and continuously optimise the live platform.'
  }),
  Object.freeze({
    name: 'Copilot Readiness',
    vehicle: 'Entitled Drawdown',
    why: 'Use a bounded entitlement to prove readiness and shape the backlog.'
  }),
  Object.freeze({
    name: 'Copilot Pilot / Adoption / Rollout',
    vehicle: 'Committed Capacity',
    why: 'Deliver rollout waves and adoption activity through a governed backlog.'
  }),
  Object.freeze({
    name: 'AI Envisioning / Use Case',
    vehicle: 'Entitled Drawdown',
    why: 'Start with discovery that creates the ranked follow-on backlog.'
  }),
  Object.freeze({
    name: 'Copilot Studio / Agent',
    vehicle: 'Committed Capacity',
    why: 'Build and improve a moving agent backlog sprint by sprint.'
  })
]);

const rows = [
  [8100, 2500, 2500, 2500, 4560, 0, 0],
  [20775, 40341, 7500, 5527, 500, 0, 0],
  [44431.5, 49779.62, 154979.75, 58265.6, 115500, 25000, 44116],
  [13000, 3750, 5408, 3430, 11250, 0, 0],
  [58933.42, 94019.42, 15060, 22607, 10322.22, 0, 2072]
];

export const PIPELINE_MATRIX = Object.freeze(Object.fromEntries(
  OFFER_FAMILIES.map((family, rowIndex) => [
    family.name,
    Object.freeze(Object.fromEntries(COMMERCIAL_STATES.map((state, columnIndex) => [state, rows[rowIndex][columnIndex]])))
  ])
));

const sum = values => values.reduce((total, value) => total + value, 0);
const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;

export function offerFamilyTotal(offerFamily, state = 'All') {
  const values = PIPELINE_MATRIX[offerFamily];
  if (!values) return 0;
  if (state !== 'All') return values[state] || 0;
  return roundMoney(sum(COMMERCIAL_STATES.map(item => values[item] || 0)));
}

export function stateTotal(state = 'All') {
  if (state === 'All') return roundMoney(sum(OFFER_FAMILIES.map(family => offerFamilyTotal(family.name))));
  if (!COMMERCIAL_STATES.includes(state)) return 0;
  return roundMoney(sum(OFFER_FAMILIES.map(family => PIPELINE_MATRIX[family.name][state] || 0)));
}

export function vehicleTotals(state = 'All') {
  const totals = {
    'Entitled Drawdown': 0,
    'Committed Capacity': 0,
    'Standing Services': 0
  };
  OFFER_FAMILIES.forEach(family => {
    totals[family.vehicle] += offerFamilyTotal(family.name, state);
  });
  return Object.freeze(Object.fromEntries(Object.entries(totals).map(([vehicle, value]) => [vehicle, roundMoney(value)])));
}

export function commercialRecommendation(state = 'All') {
  const selectedState = state === 'All' || COMMERCIAL_STATES.includes(state) ? state : 'All';
  const total = stateTotal(selectedState);
  const vehicles = vehicleTotals(selectedState);
  const ranking = Object.entries(vehicles).sort((a, b) => b[1] - a[1]);
  const [vehicle, amount] = ranking[0];
  const topFamily = OFFER_FAMILIES
    .map(family => ({ ...family, amount: offerFamilyTotal(family.name, selectedState) }))
    .sort((a, b) => b.amount - a.amount)[0];
  return Object.freeze({
    state: selectedState,
    total,
    vehicle,
    amount,
    share: total ? amount / total : 0,
    topFamily,
    vehicles,
    basis: 'inferred',
    narrative: selectedState === 'All'
      ? 'The national portfolio is dominated by rollout, adoption and agent work: a moving backlog best carried by a pre-committed multidisciplinary squad.'
      : `${selectedState} is led by ${topFamily.name}: this is backlog-shaped demand that benefits from continuity across delivery waves rather than a sequence of isolated projects.`
  });
}

