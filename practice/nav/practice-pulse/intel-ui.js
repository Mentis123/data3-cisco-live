// Opportunity intelligence overlay.
//
// This module is the only consumer of pulse-intel.mjs in the browser. It talks
// to the classic board script through window.PracticePulseBridge and the
// practicepulse:* events — app.js stays a classic IIFE and knows nothing about
// modules.

import {
  ANNUITY_LENSES,
  CATEGORIES,
  TERMINOLOGY_NOTE,
  annuityAnalysis,
  applyCorrections,
  attachableOfferings,
  evidenceProfile,
  parseCatalogue,
  suggestedQuestions
} from './pulse-intel.mjs';

const CATALOGUE_URL = '/nav/source-portfolio.psv';
const STORAGE_KEY = 'pulsePractice.corrections.v1';
const HASH_PREFIX = '#opportunity/';

const state = {
  snapshot: null,
  catalogue: { practices: [], capabilities: [], offerings: [] },
  corrections: {},
  openKey: '',
  renderedKey: '',
  restoreHash: '',
  lastFocus: null,
  pendingHashKey: ''
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const percent = new Intl.NumberFormat('en-AU', { style: 'percent', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('en-AU');

function readCorrections() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeCorrections(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    /* Private browsing or a blocked store: corrections stay in memory only. */
  }
}

function overlay() {
  let node = document.getElementById('profileOverlay');
  if (node) return node;
  node = document.createElement('div');
  node.className = 'profileOverlay';
  node.id = 'profileOverlay';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = `
    <article class="profilePanel" role="dialog" aria-modal="true" aria-labelledby="profileTitle">
      <header class="profileHead">
        <div>
          <p class="eyebrow" id="profileEyebrow">Opportunity profile</p>
          <h2 id="profileTitle">Opportunity</h2>
          <p class="profileSubtitle" id="profileSubtitle"></p>
        </div>
        <button class="closeButton" id="closeProfile" type="button" aria-label="Close opportunity profile">×</button>
      </header>
      <div class="profileBody" id="profileBody"></div>
    </article>`;
  document.body.appendChild(node);
  node.addEventListener('click', event => { if (event.target === node) closeProfile(); });
  node.querySelector('#closeProfile').addEventListener('click', () => closeProfile());
  return node;
}

// The board drawer is app.js's, but the profile supersedes it. Dismissing it
// here rather than letting app.js handle the same click keeps one owner for
// body scroll-lock and focus.
function dismissDrawer() {
  const backdrop = document.getElementById('drawerBackdrop');
  if (!backdrop || !backdrop.classList.contains('open')) return;
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
}

function badge(state_, label) {
  return `<span class="evidenceBadge ${esc(state_)}">${esc(label || state_)}</span>`;
}

function correctionFor(key) {
  const value = state.corrections[key];
  return value && typeof value === 'object' ? value : {};
}

function summarySection(record, corrected, sfdcUrl) {
  const rows = [
    { label: 'Account', value: record.account },
    { label: 'Opportunity', value: record.opportunity },
    { label: 'Offering', value: record.offering, corrected: corrected.includes('offering') },
    { label: 'Capability lenses', value: record.capabilities.join(' · '), corrected: corrected.includes('capability') },
    { label: 'Annuity vehicle', value: record.sourceVehicle, corrected: corrected.includes('lens') },
    { label: 'State / region', value: record.region },
    { label: 'Lifecycle status', value: record.status },
    { label: 'Mapping confidence', value: record.confidence === null ? 'Not supplied in extract' : percent.format(record.confidence) },
    { label: 'Salesforce ID', value: record.id || 'Not supplied in extract' },
    { label: 'Opportunity value', value: record.amount === null || record.amount === undefined ? 'Not supplied in extract' : new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(record.amount), missing: record.amount === null || record.amount === undefined },
    { label: 'Close date', value: record.closeDate ? record.closeDate.toLocaleDateString('en-AU') : 'Not supplied in extract', missing: !record.closeDate },
    { label: 'Detailed stage', value: record.stage || 'Not supplied in extract', missing: !record.stage },
    { label: 'Opportunity owner', value: 'Not supplied in extract', missing: true }
  ];
  return `
    <section class="profileSection">
      <h3>Opportunity summary</h3>
      <div class="profileGrid">
        ${rows.map(row => `
          <div class="profileCell ${row.missing ? 'missing' : ''}">
            <span>${esc(row.label)}</span>
            <strong>${esc(row.value)}</strong>
            ${row.corrected ? badge('corrected', 'Human corrected') : ''}
          </div>`).join('')}
      </div>
      ${record.id
        ? `<a class="externalButton" href="${esc(sfdcUrl)}" target="_blank" rel="noopener noreferrer">Open opportunity in Salesforce ↗</a>`
        : '<div class="coverageCallout">This row carries no Salesforce opportunity ID, so a direct record link cannot be built.</div>'}
    </section>`;
}

function mappingSection(record, original, corrected) {
  const supporting = record.capabilities.filter(name => name !== record.primaryCapability);
  return `
    <section class="profileSection">
      <h3>Practice mapping</h3>
      <div class="profileGrid">
        <div class="profileCell">
          <span>Primary capability</span>
          <strong>${esc(record.primaryCapability)}</strong>
          ${corrected.includes('capability') ? badge('corrected', 'Human corrected') : badge('inferred', 'Inferred')}
        </div>
        <div class="profileCell">
          <span>Supporting lenses</span>
          <strong>${esc(supporting.length ? supporting.join(' · ') : 'None — single lens')}</strong>
          ${badge('inferred', 'Inferred')}
        </div>
        <div class="profileCell">
          <span>Mapped offering</span>
          <strong>${esc(record.offering)}</strong>
          ${corrected.includes('offering') ? badge('corrected', 'Human corrected') : badge('known', 'Known')}
        </div>
        <div class="profileCell">
          <span>Mapping confidence</span>
          <strong>${record.confidence === null ? 'Not supplied in extract' : esc(percent.format(record.confidence))}</strong>
          ${record.confidence === null ? badge('unknown', 'Unknown') : badge('known', 'Known')}
        </div>
      </div>
      <p class="profileEvidence">Evidence in the extract — Capability column: “${esc(original.sourceCapability)}”. Offering column: “${esc(original.offering)}”. Vehicle column: “${esc(original.sourceVehicle)}”. Everything beyond those three strings on this screen is a reading of them, not a fact from Salesforce.</p>
    </section>`;
}

function annuitySection(analysis, corrected) {
  return `
    <section class="profileSection">
      <h3>Annuity analysis</h3>
      <div class="lensPrimary">
        <div class="lensPrimaryHead">
          <div>
            <span class="lensName">${esc(analysis.primary.lens)}</span>
            <strong>${esc(analysis.primary.vehicle)}</strong>
          </div>
          ${corrected.includes('lens') ? badge('corrected', 'Human corrected') : badge(analysis.basis, analysis.basis === 'known' ? 'Vehicle named in extract' : 'Inferred from offering text')}
        </div>
        <p class="lensDefinition">${esc(analysis.primary.definition)}</p>
        <p class="lensRationale">${esc(analysis.rationale)}</p>
      </div>
      <div class="lensAlternates">
        ${analysis.alternates.map(lens => `
          <div class="lensAlternate">
            <span class="lensName">${esc(lens.lens)}</span>
            <strong>${esc(lens.vehicle)}</strong>
            <p>${esc(lens.rationaleHint)}</p>
          </div>`).join('')}
      </div>
      <p class="profileNote">${esc(TERMINOLOGY_NOTE)}</p>
    </section>`;
}

function attachSection(items) {
  if (!items.length) {
    return '<section class="profileSection"><h3>Attachable offerings</h3><div class="emptyState">The service catalogue could not be loaded, so no attach set can be built.</div></section>';
  }
  const groups = CATEGORIES.map(category => ({ category, items: items.filter(item => item.category === category) })).filter(group => group.items.length);
  return `
    <section class="profileSection">
      <h3>Attachable offerings</h3>
      <p class="profileLead">This is the full credible attach set for this opportunity — ${esc(integer.format(items.length))} offerings drawn from the service catalogue — not a single recommendation. Judgement about what to actually put in front of the customer stays with the owner.</p>
      ${groups.map(group => `
        <div class="attachGroup">
          <h4>${esc(group.category)}<span>${esc(integer.format(group.items.length))}</span></h4>
          <div class="attachCards">
            ${group.items.map(item => `
              <article class="attachCard ${item.inProposal ? 'inProposal' : ''}">
                <div class="attachTop">
                  <strong>${esc(item.offering.name)}</strong>
                  ${item.inProposal ? '<span class="attachTag">Already in proposal</span>' : ''}
                </div>
                <div class="attachMeta">
                  <span>${esc(item.offering.capability)}</span>
                  <span>${esc(item.offering.vendor || 'Data#3')}</span>
                  <span>${esc(item.lens.lens)} · ${esc(item.lens.vehicle)}</span>
                </div>
                <p class="attachWhy">${esc(item.why)}</p>
                <div class="attachFoot">
                  <span class="attachTiming">${esc(item.relationship)} · ${esc(item.timing)}</span>
                  <span class="attachFit" title="Heuristic fit against this record"><i style="width:${Math.round(item.fit * 100)}%"></i><b>${esc(percent.format(item.fit))}</b></span>
                </div>
              </article>`).join('')}
          </div>
        </div>`).join('')}
    </section>`;
}

function evidenceSection(record) {
  const rows = evidenceProfile(record);
  const questions = suggestedQuestions(record);
  const group = key => rows.filter(row => row.state === key);
  const block = (key, title, note) => {
    const list = group(key);
    if (!list.length) return '';
    return `
      <div class="evidenceGroup ${esc(key)}">
        <h4>${esc(title)}<span>${esc(integer.format(list.length))}</span></h4>
        <p>${esc(note)}</p>
        <ul>${list.map(row => `<li><strong>${esc(row.label)}</strong><span>${esc(row.detail)}</span></li>`).join('')}</ul>
      </div>`;
  };
  return `
    <section class="profileSection">
      <h3>Evidence and gaps</h3>
      <div class="evidenceGrid">
        ${block('known', 'Known', 'Present verbatim in the SFDC extract.')}
        ${block('inferred', 'Inferred', 'Derived by this view from the extract text. Correct it below if the reading is wrong.')}
        ${block('unknown', 'Unknown', 'Genuinely absent from this extract. Nothing here has been estimated or filled in.')}
      </div>
      <div class="questionBlock">
        <h4>Ask the opportunity owner</h4>
        <ol>${questions.map(question => `<li>${esc(question)}</li>`).join('')}</ol>
      </div>
    </section>`;
}

function correctionSection(original, correction, corrected) {
  const capabilityNames = (state.snapshot && state.snapshot.capabilities ? state.snapshot.capabilities : []).map(item => item.name);
  const offeringNames = [...new Set(state.catalogue.offerings.filter(offering => offering.practice === 'Data & AI').map(offering => offering.name))].sort((a, b) => a.localeCompare(b));
  const option = (value, selected) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(value)}</option>`;
  return `
    <section class="profileSection">
      <h3>Human correction</h3>
      <p class="profileLead">The mapping above is machine-derived. Override it here and the correction is remembered on this device and applied every time the profile is opened.</p>
      <div class="correctionGrid">
        <label>
          <span>Primary capability ${corrected.includes('capability') ? '· corrected' : ''}</span>
          <select data-correction="capability">
            <option value="">Keep mapped — ${esc(original.primaryCapability)}</option>
            ${capabilityNames.map(name => option(name, correction.capability || '')).join('')}
          </select>
        </label>
        <label>
          <span>Offering ${corrected.includes('offering') ? '· corrected' : ''}</span>
          <select data-correction="offering">
            <option value="">Keep mapped — ${esc(original.offering)}</option>
            ${offeringNames.map(name => option(name, correction.offering || '')).join('')}
          </select>
        </label>
        <label>
          <span>Annuity lens ${corrected.includes('lens') ? '· corrected' : ''}</span>
          <select data-correction="lens">
            <option value="">Keep mapped — ${esc(original.sourceVehicle)}</option>
            ${ANNUITY_LENSES.map(lens => `<option value="${esc(lens.lens)}" ${lens.lens === (correction.lens || '') ? 'selected' : ''}>${esc(lens.lens)} · ${esc(lens.vehicle)}</option>`).join('')}
          </select>
        </label>
      </div>
      <button class="ghostButton" type="button" data-clear-correction ${corrected.length ? '' : 'disabled'}>Clear correction</button>
    </section>`;
}

function renderProfile(key) {
  const snapshot = state.snapshot;
  if (!snapshot) return false;
  const original = snapshot.records.find(item => item.key === key);
  if (!original) return false;
  const correction = correctionFor(key);
  const merged = applyCorrections(original, correction);
  const record = merged.record;
  const analysis = annuityAnalysis(record);
  const attach = attachableOfferings(record, state.catalogue);
  const node = overlay();
  node.querySelector('#profileEyebrow').textContent = `Opportunity profile · ${record.account}`;
  node.querySelector('#profileTitle').textContent = record.opportunity;
  node.querySelector('#profileSubtitle').textContent = `${record.offering} · ${record.primaryCapability} · ${analysis.primary.lens} lens${merged.corrected.length ? ` · ${merged.corrected.length} human correction${merged.corrected.length === 1 ? '' : 's'}` : ''}`;
  node.querySelector('#profileBody').innerHTML = [
    summarySection(record, merged.corrected, snapshot.salesforceUrl.replace('{id}', encodeURIComponent(record.id))),
    mappingSection(record, original, merged.corrected),
    annuitySection(analysis, merged.corrected),
    attachSection(attach),
    evidenceSection(record),
    correctionSection(original, correction, merged.corrected)
  ].join('');
  if (state.renderedKey !== key) node.querySelector('#profileBody').scrollTop = 0;
  state.renderedKey = key;
  return true;
}

function openProfile(key, options = {}) {
  if (!key) return;
  const bridge = window.PracticePulseBridge;
  if (bridge && typeof bridge.getExperience === 'function' && bridge.getExperience() !== 'board' && typeof bridge.setExperience === 'function') {
    bridge.setExperience('board');
  }
  if (!renderProfile(key)) {
    state.pendingHashKey = key;
    return;
  }
  const node = overlay();
  dismissDrawer();
  if (state.openKey !== key) state.lastFocus = document.activeElement;
  if (!state.openKey) state.restoreHash = window.location.hash.startsWith(HASH_PREFIX) ? '' : window.location.hash;
  state.openKey = key;
  state.pendingHashKey = '';
  node.classList.add('open');
  node.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (options.syncHash !== false) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${HASH_PREFIX}${encodeURIComponent(key)}`);
  }
  window.requestAnimationFrame(() => {
    const close = node.querySelector('#closeProfile');
    if (close) close.focus();
  });
}

function closeProfile() {
  if (!state.openKey) return;
  const node = overlay();
  node.classList.remove('open');
  node.setAttribute('aria-hidden', 'true');
  state.openKey = '';
  document.body.style.overflow = '';
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${state.restoreHash}`);
  if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
  state.lastFocus = null;
}

function hashKey() {
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return '';
  try {
    return decodeURIComponent(hash.slice(HASH_PREFIX.length));
  } catch (error) {
    return hash.slice(HASH_PREFIX.length);
  }
}

function updateCorrection(field, value) {
  if (!state.openKey) return;
  const current = { ...correctionFor(state.openKey) };
  if (value) current[field] = value;
  else delete current[field];
  const next = { ...state.corrections };
  if (Object.keys(current).length) next[state.openKey] = current;
  else delete next[state.openKey];
  state.corrections = next;
  writeCorrections(next);
  renderProfile(state.openKey);
}

function clearCorrection() {
  if (!state.openKey) return;
  const next = { ...state.corrections };
  delete next[state.openKey];
  state.corrections = next;
  writeCorrections(next);
  renderProfile(state.openKey);
}

function bind() {
  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-open-profile]');
    if (opener) {
      event.preventDefault();
      openProfile(opener.dataset.openProfile);
      return;
    }
    const clear = event.target.closest('[data-clear-correction]');
    if (clear && overlay().contains(clear)) clearCorrection();
  });
  document.addEventListener('change', event => {
    const select = event.target.closest('[data-correction]');
    if (select && overlay().contains(select)) updateCorrection(select.dataset.correction, select.value);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.openKey) {
      event.stopPropagation();
      closeProfile();
    }
  }, true);
  window.addEventListener('hashchange', () => {
    const key = hashKey();
    if (key) openProfile(key, { syncHash: false });
    else if (state.openKey) closeProfile();
  });
}

function adopt(snapshot) {
  state.snapshot = snapshot;
  if (state.pendingHashKey) openProfile(state.pendingHashKey, { syncHash: false });
  else if (state.openKey) renderProfile(state.openKey);
}

async function loadCatalogue() {
  try {
    const response = await fetch(CATALOGUE_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Catalogue returned ${response.status}`);
    state.catalogue = parseCatalogue(await response.text());
  } catch (error) {
    console.warn('Service catalogue unavailable; the attach set will be empty.', error);
  }
  if (state.openKey) renderProfile(state.openKey);
}

function start(bridge) {
  state.corrections = readCorrections();
  bind();
  bridge.subscribe(snapshot => adopt(snapshot));
  loadCatalogue();
  const key = hashKey();
  if (key) {
    if (state.snapshot) openProfile(key, { syncHash: false });
    else state.pendingHashKey = key;
  }
}

function boot() {
  if (window.PracticePulseBridge) {
    start(window.PracticePulseBridge);
    return;
  }
  window.addEventListener('practicepulse:ready', () => {
    if (window.PracticePulseBridge) start(window.PracticePulseBridge);
  }, { once: true });
}

boot();
