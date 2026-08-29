import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ANNUITY_LENSES,
  ATTACH_LIMIT,
  CATEGORIES,
  annuityAnalysis,
  applyCorrections,
  attachableOfferings,
  evidenceProfile,
  parseCatalogue,
  suggestedQuestions
} from './pulse-intel.mjs';

const psvPath = fileURLToPath(new URL('../source-portfolio.psv', import.meta.url));
const catalogue = parseCatalogue(readFileSync(psvPath, 'utf8'));

const rawLines = readFileSync(psvPath, 'utf8').split(/\r?\n/).filter(line => line.trim() !== '');
const expected = { P: 0, C: 0, O: 0 };
rawLines.forEach(line => { const kind = line.split('|')[0].trim(); if (kind in expected) expected[kind] += 1; });

assert.equal(catalogue.practices.length, expected.P, 'Every P row in the source portfolio must parse as a practice.');
assert.equal(catalogue.capabilities.length, expected.C, 'Every C row in the source portfolio must parse as a capability.');
assert.equal(catalogue.offerings.length, expected.O, 'Every O row in the source portfolio must parse as an offering.');
assert.ok(catalogue.practices.some(practice => practice.name === 'Data & AI'), 'The catalogue must expose the Data & AI practice.');
assert.ok(catalogue.capabilities.some(capability => capability.practice === 'Data & AI' && capability.name === 'AI Governance & Adoption'));
assert.deepEqual(
  catalogue.offerings.find(offering => offering.name === 'Unified Data Governance (Purview)'),
  { practice: 'Data & AI', capability: 'AI Governance & Adoption', name: 'Unified Data Governance (Purview)', vendor: 'Microsoft' }
);

assert.equal(ANNUITY_LENSES.length, 3, 'Three provisional annuity lenses.');
assert.deepEqual(ANNUITY_LENSES.map(lens => lens.lens), ['Drawdown', 'Ongoing', 'Managed']);
assert.deepEqual(ANNUITY_LENSES.map(lens => lens.vehicle), ['Entitled Drawdown', 'Committed Capacity', 'Standing Services']);
ANNUITY_LENSES.forEach(lens => assert.match(lens.note, /provisional working labels/i, 'Each lens must carry the provisional-terminology note.'));

const record = key => ({
  key,
  account: 'Perth Airport',
  opportunity: 'Microsoft Foundry landing zone',
  offering: 'Foundry Landing Zone',
  sourceCapability: 'Generative & Agentic AI',
  capabilities: ['Generative & Agentic AI'],
  primaryCapability: 'Generative & Agentic AI',
  sourceVehicle: 'Standing Services',
  vehicle: 'Standing Services',
  region: 'WA',
  id: '006Mo00000ljUriIAE',
  status: 'Closed Won',
  confidence: 0.95,
  amount: null,
  closeDate: null,
  stage: ''
});

const foundry = record('006Mo00000ljUriIAE');
const foundryAnalysis = annuityAnalysis(foundry);
assert.equal(foundryAnalysis.primary.lens, 'Managed', 'A Foundry landing zone must read as the Managed lens.');
assert.equal(foundryAnalysis.primary.vehicle, 'Standing Services');
assert.equal(foundryAnalysis.basis, 'known', 'The Vehicle column named the vehicle, so the basis is known.');
assert.equal(foundryAnalysis.alternates.length, 2);
assert.ok(!foundryAnalysis.alternates.some(lens => lens.lens === 'Managed'));
assert.match(foundryAnalysis.rationale, /Foundry Landing Zone/, 'The rationale must reference the actual record.');
assert.match(foundryAnalysis.rationale, /operated|governed|optimis/i, 'The Managed rationale must explain the post-implementation run.');

const inferred = { ...foundry, sourceVehicle: 'Unmapped vehicle', vehicle: 'Entitled Drawdown' };
assert.equal(annuityAnalysis(inferred).basis, 'inferred', 'With no vehicle named the basis must be inferred.');

const readiness = {
  ...foundry,
  key: 'readiness',
  opportunity: 'M365 Copilot Readiness',
  offering: 'Copilot Readiness Assessment',
  sourceCapability: 'Copilot',
  capabilities: ['Copilot'],
  primaryCapability: 'Copilot',
  sourceVehicle: 'Unmapped vehicle',
  vehicle: 'Entitled Drawdown'
};
assert.equal(annuityAnalysis(readiness).primary.lens, 'Drawdown', 'Readiness and assessment work reads as the Drawdown on-ramp.');

const prototyping = {
  ...foundry,
  key: 'prototype',
  opportunity: 'KM & AI Agent Prototypes POC',
  offering: 'Copilot Studio Agent Prototyping',
  sourceVehicle: 'Unmapped vehicle',
  vehicle: 'Committed Capacity'
};
assert.equal(annuityAnalysis(prototyping).primary.lens, 'Ongoing', 'Prototyping backlogs read as Committed Capacity.');

const attach = attachableOfferings(foundry, catalogue);
assert.ok(attach.length > 4, 'The attach set is a full credible set, not a single recommendation.');
assert.ok(attach.length <= ATTACH_LIMIT, `The attach set must respect the cap of ${ATTACH_LIMIT}.`);
const catalogueNames = new Set(catalogue.offerings.map(offering => offering.name));
attach.forEach(item => {
  assert.ok(catalogueNames.has(item.offering.name), `${item.offering.name} must come from the catalogue.`);
  assert.ok(CATEGORIES.includes(item.category), `${item.category} must be one of the five brief categories.`);
  assert.ok(item.fit > 0 && item.fit <= 1, 'Fit must be a 0–1 score.');
  assert.ok(item.why.length > 30, 'Every attach reason must be written out.');
  assert.ok(item.lens && item.lens.vehicle, 'Every attach item carries an annuity lens.');
  assert.equal(item.status, item.inProposal ? 'in-proposal' : 'not-yet-discussed');
});
const categoriesPresent = new Set(attach.map(item => item.category));
assert.ok(categoriesPresent.size >= 4, 'A platform record must attach across most of the five categories.');
assert.ok(attach.some(item => item.category === 'Operations and optimisation' && item.lens.lens === 'Managed'), 'A platform record must attach managed operations under the Managed lens.');
assert.ok(attach.some(item => item.offering.name === 'Unified Data Governance (Purview)' && item.category === 'Governance and assurance'), 'Any AI build must attach Purview under Governance and assurance.');
const inProposal = attach.filter(item => item.inProposal);
assert.equal(inProposal.length, 1, 'Exactly the mapped offering is flagged as already in the proposal.');
assert.equal(inProposal[0].offering.name, 'Advanced Analytics & AI (Databricks, ML, Azure AI / OpenAI)');
assert.equal(inProposal[0].fit, 1);
assert.deepEqual(
  attach.map(item => CATEGORIES.indexOf(item.category)),
  attach.map(item => CATEGORIES.indexOf(item.category)).slice().sort((a, b) => a - b),
  'Attach items are presented in category order.'
);

const copilotAttach = attachableOfferings({ ...readiness, offering: 'Copilot Readiness Assessment' }, catalogue);
assert.ok(copilotAttach.some(item => item.category === 'Adoption and value'), 'Copilot records must attach adoption offerings.');
assert.ok(copilotAttach.some(item => item.offering.name === 'M365 Copilot - Readiness Assessment' && item.inProposal), 'The readiness assessment already in the proposal is flagged.');
assert.deepEqual(attachableOfferings(foundry, { offerings: [] }), [], 'With no catalogue there is nothing to attach.');

const evidence = evidenceProfile(foundry);
const stateOf = field => (evidence.find(row => row.field === field) || {}).state;
assert.equal(stateOf('account'), 'known');
assert.equal(stateOf('id'), 'known');
assert.equal(stateOf('confidence'), 'known');
assert.equal(stateOf('capabilities'), 'inferred');
assert.equal(stateOf('annuityLens'), 'inferred');
['amount', 'closeDate', 'stage', 'owner', 'problem', 'proposal', 'stakeholders'].forEach(field => {
  assert.equal(stateOf(field), 'unknown', `${field} is genuinely absent from the extract.`);
});
evidence.forEach(row => assert.ok(['known', 'inferred', 'unknown'].includes(row.state) && row.label && row.detail));
assert.equal(evidenceProfile({ ...foundry, id: '', confidence: null }).find(row => row.field === 'id').state, 'unknown');

const questions = suggestedQuestions(foundry);
assert.ok(questions.length >= 3 && questions.length <= 6, 'Between three and six questions for the owner.');
assert.ok(questions.some(question => question.includes('Perth Airport')), 'Questions are tailored to the record.');
assert.ok(questions.some(question => /value|close/i.test(question)), 'The missing value and close date must be asked for.');
assert.ok(suggestedQuestions({ ...foundry, id: '' }).some(question => /Salesforce opportunity ID/.test(question)));

const clean = applyCorrections(foundry, {});
assert.deepEqual(clean.corrected, [], 'An empty correction changes nothing.');
assert.deepEqual(clean.record, { ...foundry }, 'An empty correction returns an equivalent record.');
const corrected = applyCorrections(foundry, { capability: 'AI Governance & Adoption', offering: 'Unified Data Governance (Purview)', lens: 'Drawdown' });
assert.deepEqual(corrected.corrected, ['capability', 'offering', 'lens']);
assert.equal(corrected.record.primaryCapability, 'AI Governance & Adoption');
assert.equal(corrected.record.capabilities[0], 'AI Governance & Adoption');
assert.ok(corrected.record.capabilities.includes('Generative & Agentic AI'), 'Correcting the primary capability keeps the supporting lenses.');
assert.equal(corrected.record.offering, 'Unified Data Governance (Purview)');
assert.equal(corrected.record.vehicle, 'Entitled Drawdown');
assert.equal(foundry.offering, 'Foundry Landing Zone', 'applyCorrections must not mutate the input record.');
assert.deepEqual(applyCorrections(foundry, { lens: 'Nonsense' }).corrected, [], 'An unknown lens is ignored.');

console.log(`Intel contract passed: ${catalogue.offerings.length} catalogue offerings parsed, 3 provisional annuity lenses, ${attach.length} catalogue-driven attach items across ${categoriesPresent.size} categories, Known/Inferred/Unknown evidence, and a pure correction merge.`);
