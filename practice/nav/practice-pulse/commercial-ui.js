import {
  COMMERCIAL_NOTE,
  COMMERCIAL_SOURCE,
  COMMERCIAL_SNAPSHOT_DATE,
  COMMERCIAL_STATES,
  OFFER_FAMILIES,
  PIPELINE_MATRIX,
  commercialRecommendation,
  offerFamilyTotal,
  stateTotal
} from './opportunity-matrix.mjs';

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  notation: 'compact',
  maximumFractionDigits: 1
});
const preciseCurrency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0
});
const percent = value => `${(value * 100).toFixed(1)}%`;

function stateForRecordFilter(value) {
  if (value === 'Unknown') return 'Unassigned';
  return COMMERCIAL_STATES.includes(value) ? value : 'All';
}

function recordFilterForState(value) {
  return value === 'Unassigned' ? 'Unknown' : value;
}

function renderStateRail(selectedState) {
  const root = document.getElementById('commercialStateRail');
  if (!root) return;
  const states = ['All', ...COMMERCIAL_STATES];
  root.innerHTML = states.map(item => `
    <button type="button" data-commercial-state="${item}" aria-pressed="${item === selectedState}">
      <span>${item === 'All' ? 'National' : item}</span>
      <strong>${currency.format(stateTotal(item))}</strong>
    </button>`).join('');
}

function renderRecommendation(selectedState) {
  const recommendation = commercialRecommendation(selectedState);
  const scope = selectedState === 'All' ? 'the national portfolio' : selectedState;
  const lead = document.getElementById('commercialLead');
  const explanation = document.getElementById('commercialExplanation');
  const proof = document.getElementById('commercialProof');
  const scopeLabel = document.getElementById('commercialScopeLabel');
  const source = document.getElementById('commercialSource');

  if (scopeLabel) scopeLabel.textContent = selectedState === 'All' ? 'National view' : `${selectedState} view`;
  if (lead) lead.textContent = `Lead with ${recommendation.vehicle}.`;
  if (explanation) explanation.textContent = `${recommendation.narrative} Position it as the engine now, with Entitled Drawdown as the on-ramp and Standing Services designed in as the operational destination.`;
  if (proof) proof.innerHTML = `
    <div><span>Open pipeline</span><strong>${currency.format(recommendation.total)}</strong><small>${scope}</small></div>
    <div><span>Capacity-shaped</span><strong>${currency.format(recommendation.amount)}</strong><small>${percent(recommendation.share)} of this view</small></div>
    <div><span>Largest offer family</span><strong>${currency.format(recommendation.topFamily.amount)}</strong><small>${recommendation.topFamily.name}</small></div>`;
  if (source) source.textContent = `${COMMERCIAL_SOURCE} · ${COMMERCIAL_SNAPSHOT_DATE} · ${COMMERCIAL_NOTE} Offer-family-to-vehicle mapping is an explicit recommendation inference.`;
}

function renderHeatmap(selectedState) {
  const root = document.getElementById('commercialHeatmap');
  if (!root) return;
  const states = selectedState === 'All' ? COMMERCIAL_STATES : [selectedState];
  const maxValue = Math.max(1, ...OFFER_FAMILIES.flatMap(family => states.map(item => PIPELINE_MATRIX[family.name][item])));
  const cells = [
    '<div class="commercialHeatCorner">Offer family</div>',
    ...states.map(item => `<div class="commercialHeatHeader"><span>${item}</span><strong>${currency.format(stateTotal(item))}</strong></div>`)
  ];

  OFFER_FAMILIES.forEach(family => {
    const total = offerFamilyTotal(family.name, selectedState);
    cells.push(`
      <div class="commercialHeatLabel">
        <strong>${family.name}</strong>
        <span>${family.vehicle}</span>
        <b>${currency.format(total)}</b>
      </div>`);
    states.forEach(item => {
      const value = PIPELINE_MATRIX[family.name][item];
      const intensity = value / maxValue;
      cells.push(`<div class="commercialHeatCell" style="--commercial-heat:${Math.max(.035, intensity).toFixed(3)}" title="${family.name} · ${item} · ${preciseCurrency.format(value)}"><strong>${value ? currency.format(value) : '—'}</strong></div>`);
    });
  });

  root.style.setProperty('--commercial-columns', states.length);
  root.innerHTML = cells.join('');
}

function selectState(selectedState, syncRecordFilter = true) {
  renderStateRail(selectedState);
  renderRecommendation(selectedState);
  renderHeatmap(selectedState);
  if (!syncRecordFilter) return;
  const stateFilter = document.getElementById('stateFilter');
  if (!stateFilter) return;
  const recordState = recordFilterForState(selectedState);
  const optionExists = [...stateFilter.options].some(option => option.value === recordState);
  stateFilter.value = optionExists ? recordState : 'all';
  stateFilter.dispatchEvent(new Event('change', { bubbles: true }));
}

function initCommercialMatrix() {
  const root = document.getElementById('commercialRecommendation');
  if (!root) return;
  selectState('All', false);

  root.addEventListener('click', event => {
    const button = event.target.closest('[data-commercial-state]');
    if (!button) return;
    selectState(button.dataset.commercialState);
  });

  const stateFilter = document.getElementById('stateFilter');
  stateFilter?.addEventListener('change', event => {
    selectState(stateForRecordFilter(event.target.value), false);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommercialMatrix, { once: true });
} else {
  initCommercialMatrix();
}

