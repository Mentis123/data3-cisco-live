import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const attach = require('./security-attach-plans.js');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(value => value.trim())) rows.push(row);
  }
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

assert.deepEqual(attach.SUPPORTED_STATES, ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']);
assert.equal(attach.DATA.states.NSW.opportunities.length, 15);
assert.equal(attach.DATA.states.WA.opportunities.length, 17);
assert.equal(Object.keys(attach.DATA.playbook).length, 5);
assert.equal(attach.DATA.states.NSW.namedPipelineAmount.toFixed(2), '175390.04');
assert.equal(attach.DATA.states.WA.namedPipelineAmount.toFixed(2), '181041.30');
assert.equal(attach.NATIONAL.records.length, 38);
assert.equal(attach.NATIONAL.unresolvedRecords, 93);
assert.equal(new Set(attach.NATIONAL.records.map(record => record.opportunityId)).size, 38);
assert.deepEqual(
  Object.fromEntries(['NSW', 'VIC', 'QLD', 'WA', 'SA'].map(state => [state, attach.NATIONAL.records.filter(record => record.state === state).length])),
  { NSW: 12, VIC: 9, QLD: 9, WA: 5, SA: 3 }
);
assert.equal(attach.STATE_PLANS.NSW.namedOpportunities, 22);
assert.equal(attach.STATE_PLANS.WA.namedOpportunities, 18);
assert.equal(attach.STATE_PLANS.QLD.namedOpportunities, 9);
assert.equal(attach.STATE_PLANS.VIC.namedOpportunities, 9);
assert.equal(attach.STATE_PLANS.SA.namedOpportunities, 3);
assert.equal(attach.STATE_PLANS.ACT.namedOpportunities, 0);
assert.equal(attach.STATE_PLANS.TAS.coverageKind, 'playbook-only');

const armidale = attach.planFor({
  region: '~NSW',
  id: '006Mo00000l0B8UIAU',
  offering: 'Copilot Readiness Assessment'
});
assert.equal(armidale.coverage, 'opportunity');
assert.equal(armidale.facts.customer, 'Armidale Regional Council');
assert.equal(armidale.facts.sourceType, 'workbook+salesforce');
assert.equal(armidale.facts.securityAttachStatus, 'Unknown');
assert.equal(armidale.offerBucket, 'Copilot Readiness');
assert.deepEqual(armidale.proposal.journey.map(step => step.vehicle), ['Entitled Drawdown']);

const curtin = attach.planFor({
  region: 'WA',
  id: '006RE00000Nxr6JYAR',
  offering: 'Copilot Studio Agent Prototyping'
});
assert.equal(curtin.coverage, 'opportunity');
assert.equal(curtin.facts.sourceType, 'workbook+salesforce');
assert.equal(curtin.offerBucket, 'Copilot Studio/Agent');
assert.deepEqual(curtin.proposal.journey.map(step => step.vehicle), ['Committed Capacity', 'Standing Services']);

const sharedId = '006RE00000R6lcdYAB';
assert.equal(attach.planFor({ region: 'NSW', id: sharedId }).facts.customer, 'Dexus');
assert.equal(attach.planFor({ region: 'WA', id: sharedId }).facts.customer, 'SBS');

const nswPlaybook = attach.planFor({ region: 'NSW', id: 'not-in-plan', offering: 'Copilot Studio Agent Prototyping' });
assert.equal(nswPlaybook.coverage, 'playbook');
assert.equal(nswPlaybook.offerBucket, 'Copilot Studio/Agent');
const cairns = attach.planFor({ region: 'QLD', id: '006RE00000UYOQ4YAP', offering: 'Copilot Readiness Assessment' });
assert.equal(cairns.coverage, 'opportunity');
assert.equal(cairns.facts.securityAttachStatus, 'Existing');
assert.match(cairns.facts.existingSecurityEvidence, /Purview/);
assert.equal(attach.planFor({ region: 'ACT', offering: 'Copilot Readiness Assessment' }).coverage, 'playbook');
assert.equal(attach.planFor({ region: 'NT', offering: 'Copilot Studio Agent Prototyping' }).coverage, 'playbook');
assert.equal(attach.planFor({ region: 'FIJI', offering: 'Copilot Readiness Assessment' }).coverage, 'unavailable');

const explorerRecords = parseCsv(fs.readFileSync(new URL('./opportunities.csv', import.meta.url), 'utf8'))
  .map(record => ({
    id: record.ID,
    region: record.State,
    account: record.Account,
    opportunity: record.Opportunity,
    offering: record.Offering,
    sourceCapability: record.Capability
  }));
assert.equal(explorerRecords.length, 114);
const explorerIds = new Set(explorerRecords.map(record => record.id).filter(Boolean));
attach.NATIONAL.records.forEach(record => {
  assert.ok(explorerIds.has(record.opportunityId), `Explorer is missing ${record.opportunityId}`);
  assert.equal(attach.planFor({ region: record.state, id: record.opportunityId, offering: record.offerBucket }).coverage, 'opportunity');
});
const coverage = explorerRecords.map(attach.planFor).reduce((counts, plan) => {
  counts[plan.coverage] = (counts[plan.coverage] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(coverage, { playbook: 52, unavailable: 17, 'state-only': 4, opportunity: 41 });

const indexSource = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(indexSource.indexOf('/nav/practice-pulse/national-security-attach-plans.js') < indexSource.indexOf('/nav/practice-pulse/security-attach-plans.js'));
const appSource = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');
assert.match(appSource, /state-unresolved record/);
assert.match(appSource, /Security attach status/);
assert.match(appSource, /hasNumber\(value\)/);

console.log('Security attach contract passed: 38 validated national rows, 32 curated NSW/WA plans, 93 unresolved records, and eight-state coverage boundaries are intact.');
