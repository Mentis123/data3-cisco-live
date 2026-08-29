(() => {
  'use strict';

  const DATA_URL = '/nav/practice-pulse/opportunities.csv?v=20260829-1';
  const SALESFORCE_RECORD_URL = 'https://data3.lightning.force.com/lightning/r/Opportunity/{id}/view';
  const SNAPSHOT_DATE = '28 August 2026';

  const STATUSES = ['Open', 'Closed Won', 'Closed Lost'];
  const STATUS_META = {
    'Open': { short: 'Open', className: 'open', colour: '#00AEFF' },
    'Closed Won': { short: 'Won', className: 'won', colour: '#00FF00' },
    'Closed Lost': { short: 'Lost', className: 'lost', colour: '#B30089' }
  };
  const VEHICLES = [
    { name: 'Entitled Drawdown', role: 'The on-ramp', definition: 'Prepaid entitlement consumed on demand.', colour: '#9B9BFF' },
    { name: 'Committed Capacity', role: 'The engine', definition: 'Pre-committed squad capacity flowing as backlog.', colour: '#00AEFF' },
    { name: 'Standing Services', role: 'The snowball', definition: 'Always-on service sold by presence, not hours.', colour: '#00FFFF' }
  ];
  const CAPABILITIES = [
    { name: 'Copilot', colour: '#9B9BFF' },
    { name: 'Generative & Agentic AI', colour: '#FF00FF' },
    { name: 'AI Governance & Adoption', colour: '#00FFFF' },
    { name: 'Data Platform & Engineering', colour: '#00AEFF' },
    { name: 'Analytics & BI', colour: '#DAFF00' }
  ];

  const state = {
    records: [],
    filters: {
      statuses: new Set(),
      capability: 'all',
      offering: 'all',
      region: 'all',
      vehicle: 'all',
      time: 'all',
      search: ''
    },
    measure: 'count',
    sort: 'priority',
    openCapabilities: new Set(),
    firstRender: true,
    lastFocus: null,
    experience: window.location.hash === '#spatial' ? 'spatial' : 'board'
  };

  const subscribers = new Set();

  const byId = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const compact = new Intl.NumberFormat('en-AU', { notation: 'compact', maximumFractionDigits: 1 });
  const integer = new Intl.NumberFormat('en-AU');
  const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', notation: 'compact', maximumFractionDigits: 1 });
  const fullCurrency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });
  const hasNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const factCurrency = value => hasNumber(value) ? fullCurrency.format(Number(value)) : 'Unknown';
  const factProbability = value => hasNumber(value) ? `${Math.round(Number(value) * 100)}%` : 'Unknown';

  function securityAttachPlan(record) {
    if (window.D3SecurityAttach && typeof window.D3SecurityAttach.planFor === 'function') {
      return window.D3SecurityAttach.planFor(record);
    }
    return { coverage: 'unavailable', state: normaliseRegion(record && record.region), supportedStates: ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'], proposal: null, facts: null };
  }

  function attachCoverageMeta(plan) {
    const stateName = plan && plan.state ? plan.state : '';
    if (plan && plan.coverage === 'opportunity') return { label: `${stateName} plan`, longLabel: `${stateName} opportunity plan`, className: 'opportunity' };
    if (plan && plan.coverage === 'playbook') return { label: `${stateName} playbook`, longLabel: `${stateName} playbook`, className: 'playbook' };
    if (plan && plan.coverage === 'state-only') return { label: `${stateName} no match`, longLabel: `${stateName} plan — no match`, className: 'state-only' };
    return { label: 'Not supplied', longLabel: 'No state plan', className: 'unavailable' };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell);
        if (row.some(value => value.trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      if (row.some(value => value.trim() !== '')) rows.push(row);
    }
    const headers = rows.shift().map(header => header.trim());
    return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
  }

  function getField(row, candidates) {
    const keys = Object.keys(row);
    const match = keys.find(key => candidates.includes(key.toLowerCase().replace(/[_\s-]+/g, ' ').trim()));
    return match ? row[match] : '';
  }

  function parseAmount(value) {
    if (!value) return null;
    const clean = String(value).replace(/[^0-9.-]/g, '');
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function normaliseRegion(value) {
    const region = String(value || '').replace(/^~\s*/, '').trim().toUpperCase();
    return region || 'Unknown';
  }

  function capabilityLenses(source) {
    const value = String(source || '').toLowerCase();
    const lenses = [];
    if (value.includes('copilot')) lenses.push('Copilot');
    if (value.includes('generative & agentic ai')) lenses.push('Generative & Agentic AI');
    if (value.includes('ai governance & adoption') || value.includes('data security')) lenses.push('AI Governance & Adoption');
    if (value.includes('data platform & engineering')) lenses.push('Data Platform & Engineering');
    if (value.includes('business advisory') || value.includes('information & analytics') || value.includes('analytics & bi')) lenses.push('Analytics & BI');
    return [...new Set(lenses.length ? lenses : ['Analytics & BI'])];
  }

  function primaryCapability(source, lenses) {
    const value = String(source || '').toLowerCase();
    if (value.startsWith('copilot')) return 'Copilot';
    if (value.startsWith('generative & agentic ai')) return 'Generative & Agentic AI';
    if (value.startsWith('ai governance & adoption') || value.startsWith('data security')) return 'AI Governance & Adoption';
    if (value.startsWith('data platform & engineering')) return 'Data Platform & Engineering';
    if (value.startsWith('business advisory') || value.startsWith('analytics & bi')) return 'Analytics & BI';
    return lenses[0];
  }

  function primaryVehicle(source) {
    const value = String(source || '');
    if (value.includes('Standing Services')) return 'Standing Services';
    if (value.includes('Committed Capacity')) return 'Committed Capacity';
    if (value.includes('Entitled Drawdown')) return 'Entitled Drawdown';
    return 'Entitled Drawdown';
  }

  function normaliseRecord(row, index) {
    const capabilities = capabilityLenses(row.Capability);
    const amount = parseAmount(getField(row, ['amount', 'opportunity amount', 'pipeline value', 'value', 'expected revenue', 'acv', 'tcv']));
    const closeDate = parseDate(getField(row, ['close date', 'closed date', 'expected close date']));
    const stage = getField(row, ['stage', 'stage name', 'stagename']);
    const confidenceNumber = Number(row.Confidence);
    return {
      key: row.ID || `row-${index + 1}`,
      account: row.Account || 'Unknown account',
      opportunity: row.Opportunity || 'Unnamed opportunity',
      offering: row.Offering || 'Unmapped offering',
      sourceCapability: row.Capability || 'Unmapped capability',
      capabilities,
      primaryCapability: primaryCapability(row.Capability, capabilities),
      sourceVehicle: row.Vehicle || 'Unmapped vehicle',
      vehicle: primaryVehicle(row.Vehicle),
      region: normaliseRegion(row.State),
      id: row.ID || '',
      status: STATUSES.includes(row.Status) ? row.Status : 'Open',
      confidence: Number.isFinite(confidenceNumber) ? confidenceNumber : null,
      amount,
      closeDate,
      stage: stage || '',
      raw: row
    };
  }

  function sfUrl(id) {
    return SALESFORCE_RECORD_URL.replace('{id}', encodeURIComponent(id));
  }

  function coverage(field) {
    if (!state.records.length) return 0;
    return state.records.filter(record => {
      const value = record[field];
      if (field === 'region') return value && value !== 'Unknown';
      return value !== null && value !== undefined && value !== '';
    }).length / state.records.length;
  }

  function filterRecords(options = {}) {
    const { ignoreVehicle = false, ignoreCapability = false, ignoreOffering = false } = options;
    const query = state.filters.search.trim().toLowerCase();
    const now = new Date();
    const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 6, 1);
    const fyEnd = new Date(fyStartYear + 1, 5, 30, 23, 59, 59);
    return state.records.filter(record => {
      if (state.filters.statuses.size && !state.filters.statuses.has(record.status)) return false;
      if (!ignoreCapability && state.filters.capability !== 'all' && !record.capabilities.includes(state.filters.capability)) return false;
      if (!ignoreOffering && state.filters.offering !== 'all' && record.offering !== state.filters.offering) return false;
      if (state.filters.region !== 'all' && record.region !== state.filters.region) return false;
      if (!ignoreVehicle && state.filters.vehicle !== 'all' && record.vehicle !== state.filters.vehicle) return false;
      if (state.filters.time !== 'all') {
        if (!record.closeDate) return false;
        const end = new Date(now);
        if (state.filters.time === '30') end.setDate(end.getDate() + 30);
        if (state.filters.time === '90') end.setDate(end.getDate() + 90);
        if (state.filters.time === 'fy' && (record.closeDate < fyStart || record.closeDate > fyEnd)) return false;
        if ((state.filters.time === '30' || state.filters.time === '90') && (record.closeDate < now || record.closeDate > end)) return false;
      }
      if (query) {
        const haystack = [record.account, record.opportunity, record.offering, record.sourceCapability, record.sourceVehicle, record.region, record.id].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }

  function bridgeSnapshot() {
    const filteredRecords = filterRecords();
    const navigationRecords = filterRecords({ ignoreCapability: true, ignoreOffering: true });
    return {
      records: state.records.slice(),
      filteredRecords,
      navigationRecords,
      filters: {
        statuses: [...state.filters.statuses],
        capability: state.filters.capability,
        offering: state.filters.offering,
        region: state.filters.region,
        vehicle: state.filters.vehicle,
        time: state.filters.time,
        search: state.filters.search
      },
      experience: state.experience,
      capabilities: CAPABILITIES.map(item => ({ ...item })),
      vehicles: VEHICLES.map(item => ({ ...item })),
      statuses: STATUSES.slice(),
      statusMeta: Object.fromEntries(Object.entries(STATUS_META).map(([key, value]) => [key, { ...value }])),
      coverage: {
        amount: coverage('amount'),
        closeDate: coverage('closeDate'),
        stage: coverage('stage'),
        id: coverage('id')
      },
      snapshotDate: SNAPSHOT_DATE,
      salesforceUrl: SALESFORCE_RECORD_URL
    };
  }

  function publish(reason = 'data') {
    if (!state.records.length) return;
    const snapshot = bridgeSnapshot();
    subscribers.forEach(listener => listener(snapshot, reason));
    window.dispatchEvent(new CustomEvent('practicepulse:update', { detail: { snapshot, reason } }));
  }

  function groupBy(records, getter) {
    const groups = new Map();
    records.forEach(record => {
      const key = getter(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });
    return groups;
  }

  function statusCounts(records) {
    return Object.fromEntries(STATUSES.map(status => [status, records.filter(record => record.status === status).length]));
  }

  function totalAmount(records) {
    return records.reduce((sum, record) => sum + (record.amount || 0), 0);
  }

  function measureValue(records) {
    return state.measure === 'value' ? totalAmount(records) : records.length;
  }

  function formatMeasure(value) {
    return state.measure === 'value' ? currency.format(value) : integer.format(value);
  }

  function percent(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  function countLabel(value, singular, plural = `${singular}s`) {
    return `${integer.format(value)} ${value === 1 ? singular : plural}`;
  }

  function populateControls() {
    byId('capabilityFilter').innerHTML = '<option value="all">All capabilities</option>' + CAPABILITIES
      .filter(capability => state.records.some(record => record.capabilities.includes(capability.name)))
      .map(capability => `<option value="${esc(capability.name)}">${esc(capability.name)}</option>`).join('');
    const offerings = [...new Set(state.records.map(record => record.offering))].sort((a, b) => a.localeCompare(b));
    byId('offeringFilter').innerHTML = '<option value="all">All offerings</option>' + offerings.map(offering => `<option value="${esc(offering)}">${esc(offering)}</option>`).join('');
    const regions = [...new Set(state.records.map(record => record.region))].sort((a, b) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a.localeCompare(b));
    byId('stateFilter').innerHTML = '<option value="all">All states</option>' + regions.map(region => `<option value="${esc(region)}">${esc(region)}</option>`).join('');

    const dateCoverage = coverage('closeDate');
    document.querySelectorAll('#timeFilters [data-time]:not([data-time="all"])').forEach(button => {
      button.disabled = dateCoverage === 0;
      button.title = dateCoverage === 0 ? 'Close Date is not present in this extract' : '';
    });
    const valueButton = document.querySelector('[data-measure="value"]');
    valueButton.disabled = coverage('amount') === 0;
    valueButton.title = valueButton.disabled ? 'Per-opportunity Amount is not present in the extract; aggregate value is available in the commercial matrix below.' : '';
  }

  function renderActiveFilterLine(records) {
    const parts = [];
    if (state.filters.statuses.size) parts.push([...state.filters.statuses].map(status => STATUS_META[status].short).join(' + '));
    if (state.filters.capability !== 'all') parts.push(state.filters.capability);
    if (state.filters.offering !== 'all') parts.push(state.filters.offering);
    if (state.filters.region !== 'all') parts.push(state.filters.region);
    if (state.filters.vehicle !== 'all') parts.push(state.filters.vehicle);
    if (state.filters.time !== 'all') parts.push(state.filters.time === 'fy' ? 'Current FY' : `Next ${state.filters.time} days`);
    if (state.filters.search) parts.push(`“${state.filters.search}”`);
    byId('activeFilterLine').textContent = `${integer.format(records.length)} of ${integer.format(state.records.length)} opportunities in view${parts.length ? ` · ${parts.join(' · ')}` : ''}`;
  }

  function renderMetrics(records) {
    const open = records.filter(record => record.status === 'Open');
    const won = records.filter(record => record.status === 'Closed Won');
    const lost = records.filter(record => record.status === 'Closed Lost');
    const accounts = new Set(records.map(record => record.account));
    const openAccounts = groupBy(open, record => record.account);
    const expansionAccounts = [...openAccounts.values()].filter(group => new Set(group.map(record => record.vehicle)).size > 1).length;
    const standingOpen = open.filter(record => record.vehicle === 'Standing Services');
    const winRate = percent(won.length, won.length + lost.length);
    const cards = [
      { label: 'Open pipeline', value: formatMeasure(open.length ? measureValue(open) : 0), note: `${percent(open.length, records.length)}% of the filtered practice view`, icon: 'O', accent: '#00AEFF' },
      { label: 'Accounts in view', value: integer.format(accounts.size), note: `${integer.format(new Set(open.map(record => record.account)).size)} with open opportunities`, icon: 'A', accent: '#78DCFF' },
      { label: 'Standing-services open', value: formatMeasure(standingOpen.length ? measureValue(standingOpen) : 0), note: `${percent(standingOpen.length, open.length)}% of open opportunity count`, icon: 'S', accent: '#00FFFF' },
      { label: 'Closed win rate', value: `${winRate}%`, note: `${won.length} won · ${lost.length} lost`, icon: 'W', accent: '#00FF00' },
      { label: 'Expansion accounts', value: integer.format(expansionAccounts), note: 'Open work across more than one annuity vehicle', icon: '↗', accent: '#DAFF00' }
    ];
    byId('metricGrid').innerHTML = cards.map(card => `
      <article class="metricCard" style="--metric-accent:${card.accent}">
        <div class="metricTop"><span class="metricLabel">${esc(card.label)}</span><span class="metricIcon">${esc(card.icon)}</span></div>
        <strong class="metricValue">${esc(card.value)}</strong>
        <span class="metricNote">${esc(card.note)}</span>
      </article>`).join('');
  }

  function renderVehicles() {
    const context = filterRecords({ ignoreVehicle: true });
    byId('vehicleGrid').innerHTML = VEHICLES.map(vehicle => {
      const records = context.filter(record => record.vehicle === vehicle.name);
      const counts = statusCounts(records);
      const total = records.length;
      const openWidth = percent(counts.Open, total);
      const wonWidth = percent(counts['Closed Won'], total);
      const lostWidth = Math.max(0, 100 - openWidth - wonWidth);
      return `
        <article class="vehicleCard ${state.filters.vehicle === vehicle.name ? 'selected' : ''}" style="--vehicle:${vehicle.colour}">
          <span class="vehicleKicker">${esc(vehicle.role)}</span>
          <h3>${esc(vehicle.name)}</h3>
          <p class="vehicleDefinition">${esc(vehicle.definition)}</p>
          <div class="vehicleCount"><strong>${esc(formatMeasure(measureValue(records)))}</strong><span>${state.measure === 'value' ? 'known value' : `${percent(total, context.length)}% of view`}</span></div>
          <div class="statusBar" aria-label="${counts.Open} open, ${counts['Closed Won']} won, ${counts['Closed Lost']} lost">
            <i class="open" style="width:${openWidth}%"></i><i class="won" style="width:${wonWidth}%"></i><i class="lost" style="width:${lostWidth}%"></i>
          </div>
          <div class="vehicleBreakdown"><span><b>${counts.Open}</b> open</span><span><b>${counts['Closed Won']}</b> won</span><span><b>${counts['Closed Lost']}</b> lost</span></div>
          <div class="vehicleActions">
            <button type="button" data-vehicle-focus="${esc(vehicle.name)}">${state.filters.vehicle === vehicle.name ? 'Clear focus' : 'Focus view'}</button>
            <button type="button" data-drill-vehicle="${esc(vehicle.name)}">Inspect</button>
          </div>
        </article>`;
    }).join('');
  }

  function renderSignals(records) {
    const open = records.filter(record => record.status === 'Open');
    const capabilityGroups = [...groupBy(open, record => record.primaryCapability).entries()].sort((a, b) => b[1].length - a[1].length);
    const topCapability = capabilityGroups[0];
    const standing = open.filter(record => record.vehicle === 'Standing Services');
    const accountGroups = [...groupBy(open, record => record.account).entries()];
    const multiVehicle = accountGroups.filter(([, group]) => new Set(group.map(record => record.vehicle)).size > 1);
    const noId = open.filter(record => !record.id).length;
    const signals = open.length ? [
      {
        kicker: 'Open concentration', value: topCapability ? `${percent(topCapability[1].length, open.length)}%` : '—', colour: '#FF00FF',
        text: topCapability ? `${topCapability[0]} carries ${topCapability[1].length} of ${open.length} open opportunities.` : 'No open opportunities in this view.',
        action: topCapability ? { label: 'Focus capability', type: 'capability', value: topCapability[0] } : null
      },
      {
        kicker: 'Annuity destination', value: `${percent(standing.length, open.length)}%`, colour: '#00FFFF',
        text: `${standing.length} open opportunities are already mapped to Standing Services.`,
        action: { label: 'Inspect standing services', type: 'vehicle', value: 'Standing Services' }
      },
      {
        kicker: 'Expansion surface', value: integer.format(multiVehicle.length), colour: '#DAFF00',
        text: multiVehicle.length ? `${multiVehicle.slice(0, 3).map(([account]) => account).join(', ')}${multiVehicle.length > 3 ? ' and more' : ''} span multiple vehicles.` : 'No account in this view currently spans multiple vehicles.',
        action: multiVehicle[0] ? { label: 'Inspect top expansion account', type: 'account', value: multiVehicle[0][0] } : null
      },
      {
        kicker: 'Record readiness', value: noId ? `${noId} gap${noId === 1 ? '' : 's'}` : 'Complete', colour: '#78DCFF',
        text: noId ? `${noId} open ${noId === 1 ? 'record has' : 'records have'} no opportunity ID, so direct SFDC navigation is unavailable.` : 'Every open opportunity has a direct Salesforce record ID.',
        action: null
      }
    ] : [{ kicker: 'No open pipeline', value: '0', colour: '#9D9FA2', text: 'Change the lifecycle filter to include Open opportunities.', action: null }];
    byId('signalList').innerHTML = signals.map(signal => `
      <article class="signal" style="--signal:${signal.colour}">
        <div class="signalTop"><span>${esc(signal.kicker)}</span><b>${esc(signal.value)}</b></div>
        <p>${esc(signal.text)}</p>
        ${signal.action ? `<button type="button" data-signal-type="${esc(signal.action.type)}" data-signal-value="${esc(signal.action.value)}">${esc(signal.action.label)} →</button>` : ''}
      </article>`).join('');
  }

  function renderLifecycle(records) {
    const counts = statusCounts(records);
    const total = records.length;
    let cursor = 0;
    const stops = STATUSES.map(status => {
      const start = cursor;
      cursor += total ? (counts[status] / total) * 360 : 0;
      return `${STATUS_META[status].colour} ${start}deg ${cursor}deg`;
    });
    const donut = byId('lifecycleDonut');
    donut.style.background = total ? `conic-gradient(${stops.join(',')})` : 'rgba(255,255,255,.08)';
    donut.setAttribute('aria-label', `${counts.Open} open, ${counts['Closed Won']} won, and ${counts['Closed Lost']} lost opportunities`);
    byId('donutTotal').textContent = integer.format(total);
    byId('lifecycleLegend').innerHTML = STATUSES.map(status => `
      <div class="legendRow">
        <i style="background:${STATUS_META[status].colour}"></i>
        <span>${STATUS_META[status].short}</span>
        <b>${integer.format(counts[status])}</b>
        <small>${percent(counts[status], total)}% of view</small>
      </div>`).join('');
  }

  function renderCoverage() {
    const fields = [
      { key: 'id', label: 'Opportunity ID' },
      { key: 'confidence', label: 'Mapping confidence' },
      { key: 'region', label: 'State / region' },
      { value: 100, label: 'Portfolio amount' },
      { key: 'amount', label: 'Opportunity amount' },
      { key: 'closeDate', label: 'Close date' },
      { key: 'stage', label: 'Detailed stage' }
    ];
    const amountCoverage = coverage('amount');
    const dateCoverage = coverage('closeDate');
    const stageCoverage = coverage('stage');
    byId('coverageIntro').textContent = amountCoverage
      ? 'The opportunity extract supports count and partial value analysis; the reconciled matrix adds a complete portfolio-level amount view.'
      : 'Portfolio Amount is now reconciled by state and offer family. The opportunity extract still has no row-level Amount, so financial drill-down stops above the individual record.';
    byId('coverageList').innerHTML = fields.map(field => {
      const value = field.value ?? Math.round(coverage(field.key) * 100);
      return `<div class="coverageRow"><span>${esc(field.label)}</span><div class="coverageTrack"><i style="width:${value}%"></i></div><b>${value}%</b></div>`;
    }).join('');
    const missing = [];
    if (!amountCoverage) missing.push('Amount');
    if (!dateCoverage) missing.push('Close Date');
    if (!stageCoverage) missing.push('Stage');
    byId('coverageList').insertAdjacentHTML('afterend', `<div class="coverageCallout">The $826.7k portfolio total is decision-useful at state and offer-family level. Add ${esc(missing.join(', '))} to the opportunity extract to unlock record-level value, time-window, ageing, and stage views.</div>`);
    byId('footerCoverage').textContent = `Portfolio Amount 100% · Opportunity Amount ${Math.round(amountCoverage * 100)}% · Close date ${Math.round(dateCoverage * 100)}% · Stage ${Math.round(stageCoverage * 100)}%`;
  }

  function renderAccounts(records) {
    const open = records.filter(record => record.status === 'Open');
    const groups = [...groupBy(open, record => record.account).entries()]
      .map(([account, group]) => ({ account, records: group, vehicles: [...new Set(group.map(record => record.vehicle))] }))
      .sort((a, b) => b.records.length - a.records.length || a.account.localeCompare(b.account))
      .slice(0, 8);
    const max = Math.max(1, ...groups.map(group => group.records.length));
    byId('accountList').innerHTML = groups.length ? groups.map(group => `
      <button class="accountRow" type="button" data-drill-account="${esc(group.account)}">
        <div class="accountTop"><strong>${esc(group.account)}</strong><span>${group.records.length} open</span></div>
        <div class="accountBar"><i style="width:${(group.records.length / max) * 100}%"></i></div>
        <div class="accountMeta">${group.vehicles.map(vehicle => `<span>${esc(vehicle)}</span>`).join('<span>·</span>')}</div>
      </button>`).join('') : '<div class="emptyState">No open accounts in this view.</div>';
  }

  function renderMatrix() {
    const context = filterRecords({ ignoreVehicle: true, ignoreCapability: true, ignoreOffering: true });
    const values = CAPABILITIES.flatMap(capability => VEHICLES.map(vehicle => context.filter(record => record.primaryCapability === capability.name && record.vehicle === vehicle.name).length));
    const max = Math.max(1, ...values);
    const cells = ['<div></div>', ...VEHICLES.map(vehicle => `<div class="matrixHeader">${esc(vehicle.name)}</div>`)];
    CAPABILITIES.forEach(capability => {
      const capabilityRecords = context.filter(record => record.capabilities.includes(capability.name));
      cells.push(`<div class="matrixLabel"><strong>${esc(capability.name)}</strong><span>${countLabel(capabilityRecords.length, 'opportunity', 'opportunities')}</span></div>`);
      VEHICLES.forEach(vehicle => {
        const records = capabilityRecords.filter(record => record.vehicle === vehicle.name);
        const open = records.filter(record => record.status === 'Open').length;
        const heat = records.length ? .07 + (records.length / max) * .34 : .02;
        cells.push(`<button class="matrixCell ${records.length ? '' : 'zero'}" style="--heat:${heat.toFixed(3)}" type="button" data-matrix-capability="${esc(capability.name)}" data-matrix-vehicle="${esc(vehicle.name)}"><strong>${records.length}</strong><span>${open} open</span></button>`);
      });
    });
    byId('matrixWrap').innerHTML = `<div class="matrix">${cells.join('')}</div>`;
  }

  function renderCapabilities() {
    const context = filterRecords({ ignoreCapability: true, ignoreOffering: true });
    const openCounts = CAPABILITIES.map(capability => ({ name: capability.name, count: context.filter(record => record.capabilities.includes(capability.name) && record.status === 'Open').length })).sort((a, b) => b.count - a.count);
    if (state.firstRender && openCounts[0]) state.openCapabilities.add(openCounts[0].name);
    byId('capabilityList').innerHTML = CAPABILITIES.map(capability => {
      const records = context.filter(record => record.capabilities.includes(capability.name));
      const counts = statusCounts(records);
      const total = records.length;
      const offeringGroups = [...groupBy(records, record => record.offering).entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
      return `
        <details class="capabilityCard" style="--capability:${capability.colour}" data-capability-card="${esc(capability.name)}" ${state.openCapabilities.has(capability.name) ? 'open' : ''}>
          <summary>
            <span class="capabilityMark"></span>
            <span class="capabilityName"><strong>${esc(capability.name)}</strong><span>${countLabel(offeringGroups.length, 'mapped offering')} · ${countLabel(total, 'opportunity', 'opportunities')}</span></span>
            <span class="capabilitySummaryBar"><i class="open" style="width:${percent(counts.Open, total)}%"></i><i class="won" style="width:${percent(counts['Closed Won'], total)}%"></i><i class="lost" style="width:${percent(counts['Closed Lost'], total)}%"></i></span>
            <span class="capabilityCounts"><span><b>${counts.Open}</b> open</span><span><b>${counts['Closed Won']}</b> won</span><span><b>${counts['Closed Lost']}</b> lost</span></span>
            <span class="chevron">›</span>
          </summary>
          <div class="offeringList">
            ${offeringGroups.map(([offering, group]) => {
              const open = group.filter(record => record.status === 'Open').length;
              return `<button class="offeringRow" type="button" data-offering-focus="${esc(offering)}"><span><strong>${esc(offering)}</strong><span>${open} open · ${group.length} total</span></span><b>→</b></button>`;
            }).join('') || '<span>No opportunities in this context.</span>'}
          </div>
        </details>`;
    }).join('');
    state.firstRender = false;
  }

  function sortRecords(records) {
    const copy = [...records];
    const confidence = record => record.confidence ?? -1;
    if (state.sort === 'confidence') return copy.sort((a, b) => confidence(b) - confidence(a) || a.account.localeCompare(b.account));
    if (state.sort === 'account') return copy.sort((a, b) => a.account.localeCompare(b.account) || a.opportunity.localeCompare(b.opportunity));
    if (state.sort === 'vehicle') return copy.sort((a, b) => a.vehicle.localeCompare(b.vehicle) || a.account.localeCompare(b.account));
    const order = { 'Open': 0, 'Closed Won': 1, 'Closed Lost': 2 };
    return copy.sort((a, b) => order[a.status] - order[b.status] || confidence(b) - confidence(a) || a.account.localeCompare(b.account));
  }

  function renderTable(records) {
    const sorted = sortRecords(records);
    const accountCount = new Set(sorted.map(record => record.account)).size;
    const linkCount = sorted.filter(record => record.id).length;
    const attachPlans = sorted.map(securityAttachPlan);
    const namedPlanCount = attachPlans.filter(plan => plan.coverage === 'opportunity').length;
    const playbookCount = attachPlans.filter(plan => plan.coverage === 'playbook').length;
    const unresolvedCount = window.D3SecurityAttach?.NATIONAL?.unresolvedRecords || 0;
    const unresolvedLabel = unresolvedCount ? ` · ${countLabel(unresolvedCount, 'state-unresolved record')} held outside this validated view` : '';
    byId('tableMeta').textContent = `${countLabel(sorted.length, 'opportunity', 'opportunities')} · ${countLabel(accountCount, 'account')} · ${countLabel(linkCount, 'Salesforce link')} · ${countLabel(namedPlanCount, 'named attach plan')} · ${countLabel(playbookCount, 'playbook match', 'playbook matches')}${unresolvedLabel}`;
    byId('emptyState').hidden = sorted.length > 0;
    byId('opportunityRows').innerHTML = sorted.map(record => {
      const meta = STATUS_META[record.status];
      const confidence = record.confidence === null ? '—' : `${Math.round(record.confidence * 100)}%`;
      const attachMeta = attachCoverageMeta(securityAttachPlan(record));
      return `
        <tr data-opportunity-key="${esc(record.key)}" tabindex="0" role="button" aria-label="Open positioning detail for ${esc(record.account)}, ${esc(record.opportunity)}">
          <td><strong>${esc(record.account)}</strong></td>
          <td><strong>${esc(record.opportunity)}</strong>${record.stage ? `<small>${esc(record.stage)}</small>` : ''}</td>
          <td>${esc(record.offering)}</td>
          <td><span class="tag">${esc(record.primaryCapability)}</span>${record.capabilities.length > 1 ? `<small>+ ${record.capabilities.length - 1} supporting lens</small>` : ''}</td>
          <td><span class="tag">${esc(record.sourceVehicle)}</span></td>
          <td>${esc(record.region)}</td>
          <td><span class="attachPlanTag ${attachMeta.className}">${esc(attachMeta.label)}</span></td>
          <td><span class="tag status-${meta.className}">${esc(meta.short)}</span></td>
          <td>${confidence}</td>
          <td>${record.id ? `<a class="sfdcLink" href="${sfUrl(record.id)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(record.opportunity)} in Salesforce">↗</a>` : '<span class="noLink">—</span>'}</td>
        </tr>`;
    }).join('');
  }

  function renderAll() {
    const records = filterRecords();
    syncControls();
    renderActiveFilterLine(records);
    renderMetrics(records);
    renderVehicles();
    renderSignals(records);
    renderLifecycle(records);
    renderAccounts(records);
    renderMatrix();
    renderCapabilities();
    renderTable(records);
    publish('filters');
  }

  function syncControls() {
    byId('capabilityFilter').value = state.filters.capability;
    byId('offeringFilter').value = state.filters.offering;
    byId('stateFilter').value = state.filters.region;
    byId('searchInput').value = state.filters.search;
    byId('sortSelect').value = state.sort;
    document.querySelectorAll('[data-status]').forEach(button => {
      const active = button.dataset.status === 'all' ? state.filters.statuses.size === 0 : state.filters.statuses.has(button.dataset.status);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-time]').forEach(button => {
      const active = button.dataset.time === state.filters.time;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-measure]').forEach(button => {
      const active = button.dataset.measure === state.measure;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setCapability(value) {
    state.filters.capability = value;
    state.filters.offering = 'all';
    if (value !== 'all') state.openCapabilities.add(value);
    renderAll();
  }

  function setVehicle(value) {
    state.filters.vehicle = state.filters.vehicle === value ? 'all' : value;
    renderAll();
  }

  function focusOffering(value, options = {}) {
    const { scroll = true, announce = true } = options;
    const record = state.records.find(item => item.offering === value);
    state.filters.offering = value;
    if (record) {
      state.filters.capability = record.primaryCapability;
      state.openCapabilities.add(record.primaryCapability);
    }
    renderAll();
    if (scroll) byId('opportunityExplorer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (announce && value !== 'all') toast(`Focused on ${value}`);
  }

  function genericDrawer(type, name, records) {
    const counts = statusCounts(records);
    const accounts = new Set(records.map(record => record.account));
    const offerings = [...groupBy(records, record => record.offering).entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8);
    const openRecords = sortRecords(records.filter(record => record.status === 'Open')).slice(0, 8);
    byId('drawerEyebrow').textContent = `${type} drill-down`;
    byId('drawerTitle').textContent = name;
    byId('drawerContent').innerHTML = `
      <div class="drawerMetrics">
        <div class="drawerMetric"><strong>${records.length}</strong><span>Total opportunities</span></div>
        <div class="drawerMetric"><strong>${counts.Open}</strong><span>Open</span></div>
        <div class="drawerMetric"><strong>${counts['Closed Won']}</strong><span>Won</span></div>
        <div class="drawerMetric"><strong>${accounts.size}</strong><span>Accounts</span></div>
      </div>
      <section class="drawerSection">
        <h3>Offering concentration</h3>
        <div class="drawerBreakdown">${offerings.map(([offering, group]) => `<button type="button" data-drawer-offering="${esc(offering)}"><strong>${esc(offering)}</strong><span>${group.length} opportunities · ${group.filter(record => record.status === 'Open').length} open</span></button>`).join('') || '<span>No offerings in this view.</span>'}</div>
      </section>
      <section class="drawerSection">
        <h3>Open opportunities</h3>
        <div class="drawerBreakdown">${openRecords.map(record => `<button type="button" data-drawer-record="${esc(record.key)}"><strong>${esc(record.account)} · ${esc(record.opportunity)}</strong><span>${esc(record.offering)} · ${esc(record.sourceVehicle)}${record.id ? ' · SFDC linked' : ' · No ID'}</span></button>`).join('') || '<span>No open opportunities in this drill-down.</span>'}</div>
      </section>
      <button class="drawerAction" type="button" data-drawer-focus-type="${esc(type)}" data-drawer-focus-value="${esc(name)}">Focus the dashboard on this ${esc(type.toLowerCase())}</button>`;
    openDrawer();
  }

  function opportunityDrawer(record) {
    const attachPlan = securityAttachPlan(record);
    byId('drawerEyebrow').textContent = 'Opportunity detail';
    byId('drawerTitle').textContent = record.opportunity;
    byId('drawerContent').innerHTML = `
      <div class="opportunityDetail">
        <div><span>Account</span><strong>${esc(record.account)}</strong></div>
        <div><span>Status</span><strong>${esc(record.status)}</strong></div>
        <div><span>Offering</span><strong>${esc(record.offering)}</strong></div>
        <div><span>Capability lens</span><strong>${esc(record.capabilities.join(' · '))}</strong></div>
        <div><span>Annuity vehicle</span><strong>${esc(record.sourceVehicle)}</strong></div>
        <div><span>State / region</span><strong>${esc(record.region)}</strong></div>
        <div><span>Mapping confidence</span><strong>${record.confidence === null ? 'Unavailable' : `${Math.round(record.confidence * 100)}%`}</strong></div>
        <div><span>Pipeline value</span><strong>${record.amount === null ? 'Not supplied' : currency.format(record.amount)}</strong></div>
        <div><span>Close date</span><strong>${record.closeDate ? record.closeDate.toLocaleDateString('en-AU') : 'Not supplied'}</strong></div>
        <div><span>Detailed stage</span><strong>${esc(record.stage || 'Not supplied')}</strong></div>
      </div>
      ${stateAttachSection(record, attachPlan)}
      <button class="profileButton" type="button" data-open-profile="${esc(record.key)}">Open full opportunity profile →<small>Annuity analysis, the full attachable-offering set, evidence and gaps</small></button>
      ${record.id ? `<a class="externalButton" href="${sfUrl(record.id)}" target="_blank" rel="noopener noreferrer">Open opportunity in Salesforce ↗</a>` : '<div class="coverageCallout">This row has no Salesforce opportunity ID, so a direct record link cannot be created.</div>'}`;
    openDrawer();
  }

  function stateAttachSection(record, plan) {
    const meta = attachCoverageMeta(plan);
    if (plan.coverage === 'unavailable') {
      return `
        <section class="stateAttachSection unavailable">
          <div class="stateAttachHead"><div><p class="stateAttachKicker">AI + Security attach</p><h3>State evidence not supplied</h3></div><span class="stateAttachBadge unavailable">${esc(meta.longLabel)}</span></div>
          <p class="stateAttachIntro">${esc(plan.state || record.region)} is outside the validated Australian state evidence set. This tray will not invent a state-specific recommendation.</p>
          <div class="stateAttachSource"><strong>What remains available</strong><span>The opportunity and commercial lenses above are unchanged. Add a validated state assignment to unlock this evidence layer.</span></div>
        </section>`;
    }

    const statePlan = plan.statePlan;
    const summary = `
      <div class="statePlanSummary" aria-label="${esc(plan.state)} attach-plan summary">
        <div><strong>${integer.format(statePlan.namedOpportunities)}</strong><span>Named opportunities</span></div>
        <div><strong>${fullCurrency.format(statePlan.namedPipelineAmount)}</strong><span>Named pipeline</span></div>
        <div><strong>${esc(statePlan.securityAttachWhitespace)}</strong><span>Security evidence</span></div>
      </div>`;

    if (plan.coverage === 'state-only') {
      return `
        <section class="stateAttachSection state-only">
          <div class="stateAttachHead"><div><p class="stateAttachKicker">AI + Security attach</p><h3>${esc(plan.state)} plan has no matching play</h3></div><span class="stateAttachBadge state-only">${esc(meta.longLabel)}</span></div>
          ${summary}
          <p class="stateAttachIntro">A ${esc(plan.state)} evidence layer is available, but this offering does not match one of the five defined attach plays. No recommendation has been inferred.</p>
          <div class="stateAttachSource"><strong>Evidence boundary</strong><span>The state summary uses validated source data. A specific annuity path needs offer qualification before it can be recommended.</span></div>
        </section>`;
    }

    const proposal = plan.proposal;
    const attachItems = String(proposal.securityToAttach || '').split(';').map(item => item.trim()).filter(Boolean);
    const facts = plan.facts;
    const evidenceSource = facts?.sourceType === 'workbook+salesforce'
      ? 'Curated workbook + current Salesforce facts'
      : facts?.sourceType === 'salesforce'
        ? 'Current Salesforce facts'
        : 'Curated workbook facts';
    const factGrid = facts ? `
      <div class="stateAttachLabel">${esc(evidenceSource)}</div>
      <div class="stateEvidenceGrid">
        <div><span>Priority</span><strong>${esc(facts.priority)}</strong></div>
        <div><span>Stage</span><strong>${esc(facts.stage)}</strong></div>
        <div><span>Amount</span><strong>${factCurrency(facts.amount)}</strong></div>
        <div><span>Probability</span><strong>${factProbability(facts.probability)}</strong></div>
        <div><span>Weighted amount</span><strong>${factCurrency(facts.weightedAmount)}</strong></div>
        <div><span>Close date</span><strong>${esc(facts.closeDate || 'Unknown')}</strong></div>
        <div class="wide"><span>Opportunity ID</span><strong>${esc(facts.opportunityId)}</strong></div>
      </div>` : `
      <div class="playbookNotice"><strong>Playbook-level recommendation</strong><span>This opportunity did not match a named row in the ${esc(plan.state)} evidence set. The motion below is inferred only from its offering type.</span></div>`;
    const securityEvidence = facts?.securityAttachStatus ? `
      <div class="securityEvidenceCard ${esc(String(facts.securityAttachStatus).toLowerCase().replace(/[^a-z]+/g, '-'))}">
        <span>Security attach status</span><strong>${esc(facts.securityAttachStatus)}</strong>
        <p>${esc(facts.existingSecurityEvidence || 'No evidence supplied.')}</p>
        ${facts.relatedAccountOpportunity && facts.relatedAccountOpportunity !== 'Unknown' && facts.relatedAccountOpportunity !== 'Not supplied' ? `<small>Related account opportunity · ${esc(facts.relatedAccountOpportunity)}</small>` : ''}
      </div>` : '';
    const journey = proposal.journey.map((step, index) => `
      ${index ? '<i aria-hidden="true">→</i>' : ''}<div><span>${esc(step.shorthand)}</span><strong>${esc(step.vehicle)}</strong></div>`).join('');
    return `
      <section class="stateAttachSection ${esc(plan.coverage)}">
        <div class="stateAttachHead"><div><p class="stateAttachKicker">AI + Security attach</p><h3>${esc(plan.offerBucket)}</h3></div><span class="stateAttachBadge ${esc(plan.coverage)}">${esc(meta.longLabel)}</span></div>
        <p class="stateAttachIntro">${plan.coverage === 'opportunity' ? (facts.sourceType === 'workbook+salesforce' ? 'Current Salesforce facts joined to the curated state recommendation.' : facts.sourceType === 'salesforce' ? 'A named Salesforce opportunity with an evidence-scoped attach recommendation.' : 'Named opportunity evidence and a recommended attach motion from the supplied state plan.') : 'A national playbook lens for an opportunity without a named evidence row.'}</p>
        ${summary}
        ${factGrid}
        ${securityEvidence}
        <div class="stateAttachLabel">Recommended sales motion · not a Salesforce field</div>
        <div class="recommendedOffer"><span>Position</span><strong>${esc(proposal.proposedAnnuityOffer)}</strong><p>${esc(proposal.positioning)}</p></div>
        <div class="annuityPath" aria-label="Recommended annuity journey">${journey}</div>
        <div class="stateAttachLabel">Security offerings and controls to attach</div>
        <div class="attachChipGrid">${attachItems.map(item => `<span>${esc(item)}</span>`).join('')}</div>
        <div class="nextMoveCard"><span>Next move</span><strong>${esc(proposal.nextMove)}</strong></div>
        <div class="stateAttachSource"><strong>Evidence boundary · ${esc(window.D3SecurityAttach.NATIONAL?.snapshotDate || window.D3SecurityAttach.DATA.snapshotDate)}</strong><span>${esc(statePlan.proposedFieldBasis)} ${esc(statePlan.dataQuality)}</span></div>
      </section>`;
  }

  function openDrawer() {
    state.lastFocus = document.activeElement;
    byId('drawerBackdrop').classList.add('open');
    byId('drawerBackdrop').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => byId('closeDrawer').focus());
  }

  function closeDrawer() {
    byId('drawerBackdrop').classList.remove('open');
    byId('drawerBackdrop').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
  }

  function showDimension(type, value) {
    const context = filterRecords({ ignoreVehicle: type === 'Vehicle', ignoreCapability: type === 'Capability', ignoreOffering: type === 'Offering' });
    let records = context;
    if (type === 'Vehicle') records = context.filter(record => record.vehicle === value);
    if (type === 'Capability') records = context.filter(record => record.capabilities.includes(value));
    if (type === 'Offering') records = context.filter(record => record.offering === value);
    if (type === 'Account') records = context.filter(record => record.account === value);
    genericDrawer(type, value, records);
  }

  function exportCurrentView() {
    const records = sortRecords(filterRecords());
    const headers = ['Account', 'Opportunity', 'Offering', 'Capability', 'Capability lens', 'Vehicle', 'Annuity vehicle lens', 'State', 'ID', 'Status', 'Confidence', 'Amount', 'Close Date', 'Stage'];
    const rows = records.map(record => [record.account, record.opportunity, record.offering, record.sourceCapability, record.capabilities.join(' + '), record.sourceVehicle, record.vehicle, record.region, record.id, record.status, record.confidence ?? '', record.amount ?? '', record.closeDate ? record.closeDate.toISOString().slice(0, 10) : '', record.stage]);
    const csvEscape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-practice-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Exported ${records.length} opportunities`);
  }

  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    byId('toast').textContent = message;
    byId('toast').classList.add('show');
    toastTimer = setTimeout(() => byId('toast').classList.remove('show'), 2400);
  }

  function resetFilters() {
    state.filters.statuses.clear();
    state.filters.capability = 'all';
    state.filters.offering = 'all';
    state.filters.region = 'all';
    state.filters.vehicle = 'all';
    state.filters.time = 'all';
    state.filters.search = '';
    state.measure = 'count';
    renderAll();
  }

  function setStatuses(values) {
    state.filters.statuses.clear();
    values.filter(status => STATUSES.includes(status)).forEach(status => state.filters.statuses.add(status));
    if (state.filters.statuses.size === STATUSES.length) state.filters.statuses.clear();
    renderAll();
  }

  function setExperience(value, options = {}) {
    const experience = value === 'spatial' ? 'spatial' : 'board';
    const changed = state.experience !== experience;
    state.experience = experience;
    document.body.dataset.experience = experience;
    byId('boardExperience').hidden = experience !== 'board';
    byId('boardFooter').hidden = experience !== 'board';
    byId('spatialExperience').hidden = experience !== 'spatial';
    if (experience === 'spatial') {
      document.scrollingElement.scrollTop = 0;
      document.scrollingElement.scrollLeft = 0;
      byId('spatialExperience').scrollTop = 0;
      byId('spatialExperience').scrollLeft = 0;
    }
    document.querySelectorAll('[data-experience]').forEach(button => {
      const active = button.dataset.experience === experience;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (options.syncUrl !== false) {
      const suffix = experience === 'spatial' ? '#spatial' : '';
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${suffix}`);
    }
    window.dispatchEvent(new CustomEvent('practicepulse:viewchange', { detail: { experience } }));
    if (changed) publish('experience');
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  function bindEvents() {
    document.querySelector('.experienceSwitch').addEventListener('click', event => {
      const button = event.target.closest('[data-experience]');
      if (button) setExperience(button.dataset.experience);
    });
    byId('statusFilters').addEventListener('click', event => {
      const button = event.target.closest('[data-status]');
      if (!button) return;
      const status = button.dataset.status;
      if (status === 'all') {
        state.filters.statuses.clear();
      } else if (state.filters.statuses.size === 0) {
        state.filters.statuses.add(status);
      } else if (state.filters.statuses.has(status)) {
        state.filters.statuses.delete(status);
      } else {
        state.filters.statuses.add(status);
      }
      if (state.filters.statuses.size === 0 || state.filters.statuses.size === STATUSES.length) state.filters.statuses.clear();
      renderAll();
    });
    byId('timeFilters').addEventListener('click', event => {
      const button = event.target.closest('[data-time]');
      if (!button || button.disabled) return;
      state.filters.time = button.dataset.time;
      renderAll();
    });
    document.querySelector('.measureSwitch').addEventListener('click', event => {
      const button = event.target.closest('[data-measure]');
      if (!button || button.disabled) return;
      state.measure = button.dataset.measure;
      renderAll();
    });
    byId('capabilityFilter').addEventListener('change', event => setCapability(event.target.value));
    byId('offeringFilter').addEventListener('change', event => { state.filters.offering = event.target.value; renderAll(); });
    byId('stateFilter').addEventListener('change', event => { state.filters.region = event.target.value; renderAll(); });
    byId('searchInput').addEventListener('input', event => { state.filters.search = event.target.value; renderAll(); });
    byId('sortSelect').addEventListener('change', event => { state.sort = event.target.value; renderTable(filterRecords()); });
    byId('resetFilters').addEventListener('click', resetFilters);
    byId('exportView').addEventListener('click', exportCurrentView);
    byId('collapseCapabilities').addEventListener('click', () => { state.openCapabilities.clear(); renderCapabilities(); });
    byId('closeDrawer').addEventListener('click', closeDrawer);
    byId('drawerBackdrop').addEventListener('click', event => { if (event.target === byId('drawerBackdrop')) closeDrawer(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && byId('drawerBackdrop').classList.contains('open')) closeDrawer();
      const row = event.target.closest && event.target.closest('[data-opportunity-key]');
      if (row && !event.target.closest('a, button') && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        const record = state.records.find(item => item.key === row.dataset.opportunityKey);
        if (record) opportunityDrawer(record);
      }
    });

    document.addEventListener('toggle', event => {
      const details = event.target.closest && event.target.closest('[data-capability-card]');
      if (!details) return;
      if (details.open) state.openCapabilities.add(details.dataset.capabilityCard);
      else state.openCapabilities.delete(details.dataset.capabilityCard);
    }, true);

    document.addEventListener('click', event => {
      // [data-open-profile] is owned entirely by intel-ui.js, which also
      // dismisses this drawer. Handling it here would fight that module over
      // body scroll-lock and focus, so it is deliberately left alone.
      const vehicleFocus = event.target.closest('[data-vehicle-focus]');
      if (vehicleFocus) return setVehicle(vehicleFocus.dataset.vehicleFocus);
      const vehicleDrill = event.target.closest('[data-drill-vehicle]');
      if (vehicleDrill) return showDimension('Vehicle', vehicleDrill.dataset.drillVehicle);
      const accountDrill = event.target.closest('[data-drill-account]');
      if (accountDrill) return showDimension('Account', accountDrill.dataset.drillAccount);
      const offeringFocus = event.target.closest('[data-offering-focus]');
      if (offeringFocus) return focusOffering(offeringFocus.dataset.offeringFocus);
      const matrixCell = event.target.closest('[data-matrix-capability]');
      if (matrixCell) {
        state.filters.capability = matrixCell.dataset.matrixCapability;
        state.filters.offering = 'all';
        state.filters.vehicle = matrixCell.dataset.matrixVehicle;
        state.openCapabilities.add(state.filters.capability);
        renderAll();
        toast(`Focused on ${state.filters.capability} · ${state.filters.vehicle}`);
        return;
      }
      const signal = event.target.closest('[data-signal-type]');
      if (signal) {
        if (signal.dataset.signalType === 'capability') setCapability(signal.dataset.signalValue);
        if (signal.dataset.signalType === 'vehicle') showDimension('Vehicle', signal.dataset.signalValue);
        if (signal.dataset.signalType === 'account') showDimension('Account', signal.dataset.signalValue);
        return;
      }
      const row = event.target.closest('[data-opportunity-key]');
      if (row && !event.target.closest('a')) {
        const record = state.records.find(item => item.key === row.dataset.opportunityKey);
        if (record) opportunityDrawer(record);
        return;
      }
      const drawerOffering = event.target.closest('[data-drawer-offering]');
      if (drawerOffering) { closeDrawer(); focusOffering(drawerOffering.dataset.drawerOffering); return; }
      const drawerRecord = event.target.closest('[data-drawer-record]');
      if (drawerRecord) {
        const record = state.records.find(item => item.key === drawerRecord.dataset.drawerRecord);
        if (record) opportunityDrawer(record);
        return;
      }
      const drawerFocus = event.target.closest('[data-drawer-focus-type]');
      if (drawerFocus) {
        const type = drawerFocus.dataset.drawerFocusType;
        const value = drawerFocus.dataset.drawerFocusValue;
        closeDrawer();
        if (type === 'Vehicle') setVehicle(value);
        if (type === 'Capability') setCapability(value);
        if (type === 'Offering') focusOffering(value);
        if (type === 'Account') { state.filters.search = value; renderAll(); }
      }
    });
  }

  function fatal(error) {
    console.error(error);
    byId('snapshotMeta').textContent = 'Source unavailable';
    byId('metricGrid').innerHTML = `<article class="metricCard"><strong class="metricValue">Data unavailable</strong><span class="metricNote">The SFDC extract could not be loaded. ${esc(error.message)}</span></article>`;
  }

  async function init() {
    try {
      const filmBibleLink = byId('filmBibleLink');
      if (filmBibleLink) filmBibleLink.href = `${window.location.pathname.replace(/\/$/, '')}/film-bible`;
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Source returned ${response.status}`);
      const rows = parseCsv(await response.text());
      state.records = rows.map(normaliseRecord);
      byId('snapshotMeta').textContent = `SFDC extract · ${state.records.length} opportunities · ${SNAPSHOT_DATE}`;
      populateControls();
      bindEvents();
      renderCoverage();
      renderAll();
      setExperience(state.experience, { syncUrl: false });
      window.dispatchEvent(new CustomEvent('practicepulse:ready', { detail: bridgeSnapshot() }));
    } catch (error) {
      fatal(error);
    }
  }

  window.PracticePulseBridge = Object.freeze({
    subscribe(listener) {
      subscribers.add(listener);
      if (state.records.length) listener(bridgeSnapshot(), 'subscribe');
      return () => subscribers.delete(listener);
    },
    getSnapshot: bridgeSnapshot,
    setCapability,
    setOffering(value) { focusOffering(value, { scroll: false, announce: false }); },
    setVehicle,
    setStatuses,
    resetFilters,
    showDimension,
    setExperience,
    getExperience() { return state.experience; },
    openBoard() {
      setExperience('board');
      window.setTimeout(() => byId('opportunityExplorer').scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  });

  init();
})();
