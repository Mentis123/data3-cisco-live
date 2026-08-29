import assert from 'node:assert/strict';
import {
  COMMERCIAL_NOTE,
  COMMERCIAL_STATES,
  OFFER_FAMILIES,
  commercialRecommendation,
  offerFamilyTotal,
  stateTotal,
  vehicleTotals
} from './opportunity-matrix.mjs';

const closeTo = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.01, `${message}: expected ${expected}, received ${actual}`);

assert.equal(COMMERCIAL_STATES.length, 7, 'Seven state or assignment columns are present.');
assert.equal(OFFER_FAMILIES.length, 5, 'Five offer families are present.');
closeTo(stateTotal(), 826727.53, 'The workbook grand total is preserved');
closeTo(stateTotal('QLD'), 185447.75, 'The QLD total is preserved');
closeTo(stateTotal('NSW'), 190390.04, 'The NSW total is preserved');
closeTo(offerFamilyTotal('Copilot Pilot / Adoption / Rollout'), 492072.47, 'The leading offer-family total is preserved');

const nationalVehicles = vehicleTotals();
closeTo(nationalVehicles['Committed Capacity'], 695086.53, 'Committed Capacity receives rollout and agent families');
closeTo(nationalVehicles['Entitled Drawdown'], 111481, 'Entitled Drawdown receives readiness and envisioning families');
closeTo(nationalVehicles['Standing Services'], 20160, 'Standing Services receives Foundry and landing-zone work');

const national = commercialRecommendation();
assert.equal(national.vehicle, 'Committed Capacity');
assert.equal(national.basis, 'inferred');
assert.ok(national.share > 0.84 && national.share < 0.841, 'Committed Capacity represents about 84.1% of the national mapped value.');

const queensland = commercialRecommendation('QLD');
assert.equal(queensland.vehicle, 'Committed Capacity');
assert.ok(queensland.share > 0.916 && queensland.share < 0.918, 'Committed Capacity represents about 91.7% of Queensland mapped value.');
assert.equal(queensland.topFamily.name, 'Copilot Pilot / Adoption / Rollout');
assert.match(COMMERCIAL_NOTE, /not GP and not ACV/i);

console.log('Commercial matrix contract passed: $826.7k reconciled, five offer families, seven state columns, and Committed Capacity recommended nationally and for QLD.');
