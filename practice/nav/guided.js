(() => {
  'use strict';

  const taxonomy = typeof TAXONOMY !== 'undefined' ? TAXONOMY : {};
  const catalogue = typeof CATALOGUE !== 'undefined' && Array.isArray(CATALOGUE) ? CATALOGUE : [];

  const state = {
    step: 1,
    role: '',
    goal: '',
    selections: { practice: new Set(), industry: new Set(), audience: new Set(), lifecycle: new Set() },
    activeLens: null,
    showAll: false,
    sort: 'best',
    detailOffer: null,
    tourIndex: -1,
    tourSnapshot: null
  };

  const roleSelect = document.getElementById('roleSelect');
  const goalSelect = document.getElementById('goalSelect');
  const continueToFocus = document.getElementById('continueToFocus');
  const continueToReview = document.getElementById('continueToReview');
  const pickerBackdrop = document.getElementById('pickerBackdrop');
  const pickerPanel = pickerBackdrop.querySelector('.pickerPanel');
  const pickerOptions = document.getElementById('pickerOptions');
  const pickerTitle = document.getElementById('pickerTitle');
  const pickerHint = document.getElementById('pickerHint');
  const pickerSelection = document.getElementById('pickerSelection');
  const resultGrid = document.getElementById('resultGrid');
  const resultCount = document.getElementById('resultCount');
  const resultFooter = document.getElementById('resultFooter');
  const toggleResults = document.getElementById('toggleResults');
  const emptyState = document.getElementById('emptyState');
  const detailBackdrop = document.getElementById('detailBackdrop');
  const detailPanel = detailBackdrop.querySelector('.detailPanel');
  const sortSelect = document.getElementById('sortSelect');
  const toast = document.getElementById('toast');
  let toastTimer = 0;
  let lastFocus = null;

  const lensMeta = {
    practice: { plural: 'practices', colour: '#00AEFF', rgb: '0,174,255' },
    industry: { plural: 'industries', colour: '#9B9BFF', rgb: '155,155,255' },
    audience: { plural: 'audiences', colour: '#DAFF00', rgb: '218,255,0' },
    lifecycle: { plural: 'stages', colour: '#FFB74A', rgb: '255,183,74' }
  };

  const presets = {
    meeting: { role: 'Account Executive', goal: 'Prepare for a customer meeting' },
    'learn-ai': { role: 'New Seller', goal: 'Learn or refresh a core offer', practice: ['Data & AI'], lifecycle: ['Learn'] },
    position: { role: 'Generalist Seller', goal: 'Decide what to position', lifecycle: ['Learn', 'Consult'] },
    proof: { role: 'Account Executive', goal: 'Find customer proof' },
    industry: { role: 'Generalist Seller', goal: 'Explore an industry', industry: ['Government'], lifecycle: ['Learn'] },
    account: { role: 'Account Executive', goal: 'Research an account before a meeting' }
  };

  const practiceColours = {
    'Business Advisory': ['#DAFF00', '218,255,0'],
    'Data & AI': ['#9B9BFF', '155,155,255'],
    'Security': ['#FF00FF', '255,0,255'],
    'Apps & Automation': ['#00FF00', '0,255,0'],
    'End User Computing': ['#78DCFF', '120,220,255'],
    'Collaboration': ['#FFB7FF', '255,183,255'],
    'Networking': ['#00AEFF', '0,174,255'],
    'Hybrid Cloud': ['#00FFFF', '0,255,255'],
    'Lifecycle Services': ['#9D9FA2', '157,159,162']
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function setStep(next, options = {}) {
    const target = Math.max(1, Math.min(3, Number(next) || 1));
    if (target > 1 && (!state.role || !state.goal)) return;
    if (state.goal === 'Research an account before a meeting' && target > 1) {
      window.location.href = '/nav/account';
      return;
    }

    state.step = target;
    document.querySelectorAll('.stage').forEach(stage => {
      const active = Number(stage.dataset.stage) === target;
      stage.hidden = !active;
      stage.classList.toggle('is-active', active);
    });
    document.querySelectorAll('.step').forEach((step, index) => {
      const number = index + 1;
      step.classList.toggle('is-active', number === target);
      step.classList.toggle('is-complete', number < target);
      step.disabled = number > target || (number > 1 && (!state.role || !state.goal));
      if (number === target) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });

    if (target === 2) updateFocusUI();
    if (target === 3) renderReview();

    if (options.scroll !== false) {
      const stage = document.getElementById(`stage${target}`);
      window.setTimeout(() => stage.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  }

  function syncIdentity() {
    state.role = roleSelect.value;
    state.goal = goalSelect.value;
    const ready = Boolean(state.role && state.goal);
    continueToFocus.disabled = !ready;
    continueToFocus.innerHTML = state.goal === 'Research an account before a meeting'
      ? 'Open account brief <span aria-hidden="true">→</span>'
      : 'Continue <span aria-hidden="true">→</span>';
  }

  function resetSelections() {
    Object.values(state.selections).forEach(set => set.clear());
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    resetSelections();
    state.role = preset.role;
    state.goal = preset.goal;
    roleSelect.value = preset.role;
    goalSelect.value = preset.goal;
    ['practice', 'industry', 'audience', 'lifecycle'].forEach(lens => {
      (preset[lens] || []).forEach(item => state.selections[lens].add(item));
    });
    syncIdentity();
    document.querySelectorAll('[data-preset]').forEach(button => button.classList.toggle('is-selected', button.dataset.preset === name));
    if (name === 'account') {
      showToast('Account research uses the account-aware brief. Continue when ready.');
    } else {
      showToast('Common setup loaded. You can still edit every choice.');
    }
  }

  function summaryForLens(lens) {
    const selected = [...state.selections[lens]];
    const meta = lensMeta[lens];
    if (!selected.length) return `All ${meta.plural}`;
    if (selected.length === 1) return selected[0];
    return `${selected[0]} +${selected.length - 1}`;
  }

  function updateFocusUI() {
    Object.keys(state.selections).forEach(lens => {
      const summary = document.querySelector(`[data-lens-summary="${lens}"]`);
      const card = document.querySelector(`.focusCard[data-lens="${lens}"]`);
      summary.textContent = summaryForLens(lens);
      card.classList.toggle('has-selection', state.selections[lens].size > 0);
    });

    const parts = Object.keys(state.selections).filter(lens => state.selections[lens].size).map(lens => `${taxonomy[lens]?.label || lens}: ${[...state.selections[lens]].join(', ')}`);
    document.getElementById('focusSentence').textContent = parts.length ? parts.join(' · ') : 'No extra focus selected yet.';
  }

  function openPicker(lens, trigger) {
    if (!taxonomy[lens]) return;
    state.activeLens = lens;
    lastFocus = trigger || document.activeElement;
    pickerTitle.textContent = taxonomy[lens].label;
    pickerHint.textContent = `${taxonomy[lens].hint}. Choose as many as useful, or leave this lens at All.`;
    renderPickerOptions();
    pickerBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      pickerBackdrop.classList.add('open');
      pickerPanel.focus({ preventScroll: true });
    });
  }

  function renderPickerOptions() {
    const lens = state.activeLens;
    const selected = state.selections[lens];
    pickerOptions.innerHTML = taxonomy[lens].items.map(([name, note, colour]) => {
      const active = selected.has(name);
      return `<button class="pickerOption${active ? ' is-selected' : ''}" type="button" data-option="${escapeHtml(name)}" style="--option:${escapeHtml(colour)}" aria-pressed="${active}"><span class="pickerCheck">${active ? '✓' : ''}</span><span><b>${escapeHtml(name)}</b><small>${escapeHtml(note)}</small></span></button>`;
    }).join('');
    pickerOptions.querySelectorAll('[data-option]').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.option;
        if (selected.has(value)) selected.delete(value); else selected.add(value);
        renderPickerOptions();
      });
    });
    const values = [...selected];
    pickerSelection.textContent = values.length ? `${values.length} selected: ${values.join(', ')}` : 'All included';
  }

  function closePicker() {
    if (pickerBackdrop.hidden) return;
    pickerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      pickerBackdrop.hidden = true;
      updateFocusUI();
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }, 180);
  }

  function offerMatches(offer) {
    const mapping = { practice: 'practices', industry: 'industries', audience: 'audiences', lifecycle: 'lifecycle' };
    return Object.entries(mapping).every(([lens, field]) => {
      const selected = [...state.selections[lens]];
      if (!selected.length) return true;
      const values = Array.isArray(offer[field]) ? offer[field] : [];
      return selected.some(value => values.includes(value));
    });
  }

  function hasAny(values, targets) {
    const source = Array.isArray(values) ? values : [];
    return targets.some(target => source.includes(target));
  }

  function scoreOffer(offer) {
    let score = 0;
    const explicitWeights = { practice: 48, industry: 34, audience: 30, lifecycle: 22 };
    const mapping = { practice: 'practices', industry: 'industries', audience: 'audiences', lifecycle: 'lifecycle' };
    Object.entries(mapping).forEach(([lens, field]) => {
      const selected = [...state.selections[lens]];
      const values = Array.isArray(offer[field]) ? offer[field] : [];
      score += selected.filter(value => values.includes(value)).length * explicitWeights[lens];
    });

    const type = String(offer.type || '');
    const actions = (offer.actions || []).join(' ').toLowerCase();
    const proof = String(offer.proof || '').toLowerCase();

    switch (state.goal) {
      case 'Prepare for a customer meeting':
        if (hasAny(offer.lifecycle, ['Learn', 'Consult'])) score += 22;
        if (hasAny(offer.audiences, ['Chief Information Officer', 'Chief Information Security Officer', 'Chief Executive Officer', 'Board / Executive Leadership Team'])) score += 11;
        if (/core|strategic/i.test(type)) score += 8;
        break;
      case 'Learn or refresh a core offer':
        if (hasAny(offer.lifecycle, ['Learn'])) score += 30;
        if (/core/i.test(type)) score += 18;
        if ((offer.practices || []).length <= 2) score += 4;
        break;
      case 'Decide what to position':
        if (hasAny(offer.lifecycle, ['Learn', 'Consult'])) score += 24;
        if (/core|strategic/i.test(type)) score += 15;
        if ((offer.industries || []).length >= 4) score += 5;
        break;
      case 'Find customer proof':
        if (proof && proof !== 'none') score += 25;
        if (/story|proof|case study|customer/.test(actions)) score += 24;
        if (/core|strategic/i.test(type)) score += 8;
        break;
      case 'Explore an industry':
        if (hasAny(offer.lifecycle, ['Learn'])) score += 28;
        if ((offer.industries || []).length >= 4) score += 9;
        if (/core|strategic/i.test(type)) score += 7;
        break;
    }

    switch (state.role) {
      case 'Account Executive':
        if (/core|strategic/i.test(type)) score += 10;
        if (hasAny(offer.audiences, ['Chief Information Officer', 'Chief Information Security Officer', 'Chief Executive Officer', 'Board / Executive Leadership Team'])) score += 8;
        break;
      case 'New Seller':
        if (hasAny(offer.lifecycle, ['Learn'])) score += 15;
        if (/core/i.test(type)) score += 12;
        break;
      case 'Generalist Seller':
        if (/core/i.test(type)) score += 12;
        if ((offer.practices || []).length > 1) score += 4;
        break;
      case 'Technical Presales Engineer':
        if (hasAny(offer.lifecycle, ['Consult', 'Implement'])) score += 14;
        if (hasAny(offer.audiences, ['Enterprise Architect', 'Head of Infrastructure', 'IT Manager'])) score += 8;
        break;
      case 'Practice Specialist':
        if (/strategic|core/i.test(type)) score += 10;
        break;
      case 'Sales Manager':
        if (/strategic|core/i.test(type)) score += 10;
        if (hasAny(offer.audiences, ['Chief Executive Officer', 'Chief Information Officer', 'Board / Executive Leadership Team'])) score += 8;
        break;
    }

    const freshness = reviewRank(offer.reviewed) - reviewRank('Reviewed Dec 2025');
    score += Math.max(0, Math.min(12, freshness)) * 0.6;
    return score;
  }

  function reviewRank(reviewed) {
    const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const match = String(reviewed || '').match(/([A-Z][a-z]{2})\s+(\d{4})/);
    if (!match) return 0;
    return Number(match[2]) * 12 + (months[match[1]] || 0);
  }

  function timingRank(timing) {
    const text = String(timing || '').toLowerCase();
    if (/hour|half day|day/.test(text)) return 1;
    const number = Number((text.match(/\d+/) || [99])[0]);
    if (/week/.test(text)) return number * 7;
    if (/month/.test(text)) return number * 30;
    return number || 99;
  }

  function getResults() {
    const rows = catalogue.filter(offerMatches).map(offer => ({ offer, score: scoreOffer(offer) }));
    rows.sort((a, b) => {
      if (state.sort === 'core') {
        const aCore = /core|strategic/i.test(a.offer.type || '') ? 1 : 0;
        const bCore = /core|strategic/i.test(b.offer.type || '') ? 1 : 0;
        return bCore - aCore || b.score - a.score || a.offer.title.localeCompare(b.offer.title);
      }
      if (state.sort === 'quick') return timingRank(a.offer.timing) - timingRank(b.offer.timing) || b.score - a.score;
      if (state.sort === 'recent') return reviewRank(b.offer.reviewed) - reviewRank(a.offer.reviewed) || b.score - a.score;
      if (state.sort === 'az') return a.offer.title.localeCompare(b.offer.title);
      return b.score - a.score || a.offer.title.localeCompare(b.offer.title);
    });
    return rows.map(row => row.offer);
  }

  function whyForOffer(offer) {
    const reasons = [];
    if (state.goal) reasons.push(`Goal: ${state.goal}`);
    Object.entries({ practice: 'practices', industry: 'industries', audience: 'audiences', lifecycle: 'lifecycle' }).forEach(([lens, field]) => {
      const matched = [...state.selections[lens]].filter(value => (offer[field] || []).includes(value));
      if (matched.length) reasons.push(`${taxonomy[lens]?.label || lens}: ${matched.join(', ')}`);
    });
    if (reasons.length === 1) reasons.push(`Primary practice: ${(offer.practices || ['Portfolio'])[0]}`);
    return reasons.join(' · ');
  }

  function renderReview() {
    state.sort = sortSelect.value;
    const summary = document.getElementById('viewSummary');
    const chips = [
      ['Role', state.role, '#00AEFF'],
      ['Goal', state.goal, '#78DCFF']
    ];
    Object.keys(state.selections).forEach(lens => chips.push([taxonomy[lens]?.label || lens, summaryForLens(lens), lensMeta[lens].colour]));
    summary.innerHTML = chips.map(([label, value, colour]) => `<span class="summaryChip" style="--chip:${colour}"><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</span>`).join('');
    renderResults();
  }

  function renderResults() {
    const rows = getResults();
    const visible = state.showAll ? rows : rows.slice(0, 5);
    resultCount.textContent = `${visible.length}${rows.length > visible.length ? ` of ${rows.length}` : ''} ${rows.length === 1 ? 'starting point' : 'starting points'}`;
    resultGrid.hidden = rows.length === 0;
    emptyState.hidden = rows.length !== 0;
    resultFooter.hidden = rows.length <= 5;
    toggleResults.textContent = state.showAll ? 'Show only the strongest five' : `Show all ${rows.length}`;

    resultGrid.innerHTML = visible.map(offer => {
      const practice = (offer.practices || ['Portfolio'])[0];
      const [colour, rgb] = practiceColours[practice] || ['#00AEFF', '0,174,255'];
      return `<button class="resultCard" type="button" data-offer-id="${escapeHtml(offer.id)}" style="--accent:${colour};--accent-rgb:${rgb}"><span class="resultPractice">${escapeHtml(practice)}</span><h3>${escapeHtml(offer.title)}</h3><p>${escapeHtml(offer.tldr)}</p><span class="resultMeta"><span class="timingPill">${escapeHtml(offer.timing)}</span><span>${escapeHtml(offer.type || 'Offer')}</span></span></button>`;
    }).join('');
    resultGrid.querySelectorAll('[data-offer-id]').forEach(button => button.addEventListener('click', () => openDetail(button.dataset.offerId, button)));
  }

  function openDetail(id, trigger) {
    const offer = catalogue.find(item => item.id === id);
    if (!offer) return;
    state.detailOffer = offer;
    lastFocus = trigger || document.activeElement;
    const practice = (offer.practices || ['Portfolio'])[0];
    const [colour] = practiceColours[practice] || ['#00AEFF'];
    detailPanel.style.setProperty('--detail-accent', colour);
    document.getElementById('detailPractice').textContent = practice;
    document.getElementById('detailTitle').textContent = offer.title;
    document.getElementById('detailTiming').textContent = offer.timing || 'Timing varies';
    document.getElementById('detailTldr').textContent = offer.tldr || '';
    document.getElementById('detailWhy').textContent = whyForOffer(offer);
    document.getElementById('detailSummary').textContent = offer.summary || offer.tldr || '';
    document.getElementById('detailTriggers').innerHTML = (offer.triggers || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    document.getElementById('detailOutputs').innerHTML = (offer.outputs || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    document.getElementById('detailTrust').innerHTML = [
      ['Owner', offer.owner || practice],
      ['Reviewed', offer.reviewed || 'Review date not supplied'],
      ['Proof', offer.proof || 'Not specified'],
      ['Lifecycle', (offer.lifecycle || []).join(', ') || 'Not specified']
    ].map(([label, value]) => `<div class="trustItem"><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></div>`).join('');
    document.getElementById('detailActions').innerHTML = (offer.actions || ['Open source content']).map(action => `<button type="button" data-demo-action="${escapeHtml(action)}">${escapeHtml(action)}</button>`).join('');
    document.querySelectorAll('[data-demo-action]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.demoAction} · prototype action`)));
    detailBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      detailBackdrop.classList.add('open');
      detailPanel.focus({ preventScroll: true });
    });
  }

  function closeDetail() {
    if (detailBackdrop.hidden) return;
    detailBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      detailBackdrop.hidden = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }, 210);
  }

  function resetBuilder() {
    state.role = '';
    state.goal = '';
    state.sort = 'best';
    state.showAll = false;
    resetSelections();
    roleSelect.value = '';
    goalSelect.value = '';
    sortSelect.value = 'best';
    document.querySelectorAll('[data-preset]').forEach(button => button.classList.remove('is-selected'));
    syncIdentity();
    updateFocusUI();
    setStep(1, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const tourSteps = [
    { target: '.questionPanel', title: 'Begin with the employee’s job', body: 'Role and goal are the only required choices. Nothing is recommended before the employee provides them.', step: 1 },
    { target: '.outcomePanel', title: 'Set the expectation before asking for effort', body: 'Navigator explains the value of the journey: a focused view, strong starting points, context and accountable sources.', step: 1 },
    { target: '.focusPanel', title: 'Ask only for useful context', body: 'Practice, industry, audience and lifecycle are optional multi-select lenses. All remains a valid choice.', step: 2 },
    { target: '.reviewPanel', title: 'Reveal a small ranked result set', body: 'Only at Review does Navigator show recommendations—and it starts with the strongest five, not the whole catalogue.', step: 3 }
  ];

  function startTour() {
    state.tourSnapshot = {
      role: state.role,
      goal: state.goal,
      selections: Object.fromEntries(Object.entries(state.selections).map(([key, value]) => [key, [...value]])),
      step: state.step
    };
    state.role = 'Account Executive';
    state.goal = 'Prepare for a customer meeting';
    roleSelect.value = state.role;
    goalSelect.value = state.goal;
    resetSelections();
    state.selections.practice.add('Security');
    state.selections.industry.add('Government');
    state.selections.audience.add('Chief Information Security Officer');
    state.selections.lifecycle.add('Consult');
    syncIdentity();
    state.tourIndex = 0;
    document.getElementById('tourShade').hidden = false;
    document.getElementById('tourCard').hidden = false;
    renderTourStep();
  }

  function renderTourStep() {
    document.querySelectorAll('.tourTarget').forEach(element => element.classList.remove('tourTarget'));
    const item = tourSteps[state.tourIndex];
    setStep(item.step, { scroll: false });
    window.setTimeout(() => {
      const target = document.querySelector(item.target);
      target?.classList.add('tourTarget');
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
    document.getElementById('tourTitle').textContent = item.title;
    document.getElementById('tourBody').textContent = item.body;
    document.getElementById('tourStep').textContent = `${state.tourIndex + 1} of ${tourSteps.length}`;
    document.getElementById('tourBack').disabled = state.tourIndex === 0;
    document.getElementById('tourNext').textContent = state.tourIndex === tourSteps.length - 1 ? 'Finish' : 'Next →';
    document.getElementById('tourDots').innerHTML = tourSteps.map((_, index) => `<span class="${index === state.tourIndex ? 'active' : ''}"></span>`).join('');
  }

  function endTour(restore = false) {
    document.querySelectorAll('.tourTarget').forEach(element => element.classList.remove('tourTarget'));
    document.getElementById('tourShade').hidden = true;
    document.getElementById('tourCard').hidden = true;
    state.tourIndex = -1;
    if (restore && state.tourSnapshot) {
      state.role = state.tourSnapshot.role;
      state.goal = state.tourSnapshot.goal;
      roleSelect.value = state.role;
      goalSelect.value = state.goal;
      resetSelections();
      Object.entries(state.tourSnapshot.selections).forEach(([key, values]) => values.forEach(value => state.selections[key].add(value)));
      syncIdentity();
      setStep(state.tourSnapshot.step, { scroll: false });
    } else {
      resetBuilder();
    }
    state.tourSnapshot = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  roleSelect.addEventListener('change', syncIdentity);
  goalSelect.addEventListener('change', syncIdentity);
  continueToFocus.addEventListener('click', () => {
    syncIdentity();
    if (!state.role || !state.goal) return;
    if (state.goal === 'Research an account before a meeting') window.location.href = '/nav/account';
    else setStep(2);
  });
  continueToReview.addEventListener('click', () => setStep(3));
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  document.querySelectorAll('.focusCard').forEach(button => button.addEventListener('click', () => openPicker(button.dataset.lens, button)));
  document.querySelectorAll('[data-back-step]').forEach(button => button.addEventListener('click', () => setStep(button.dataset.backStep)));
  document.querySelectorAll('[data-go-step]').forEach(button => button.addEventListener('click', () => {
    if (!button.disabled) setStep(button.dataset.goStep);
  }));
  document.getElementById('pickerClose').addEventListener('click', closePicker);
  document.getElementById('pickerDone').addEventListener('click', closePicker);
  document.getElementById('pickerAll').addEventListener('click', () => {
    if (!state.activeLens) return;
    state.selections[state.activeLens].clear();
    renderPickerOptions();
  });
  pickerBackdrop.addEventListener('click', event => { if (event.target === pickerBackdrop) closePicker(); });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; renderResults(); });
  toggleResults.addEventListener('click', () => { state.showAll = !state.showAll; renderResults(); });
  document.getElementById('startAgain').addEventListener('click', resetBuilder);
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  detailBackdrop.addEventListener('click', event => { if (event.target === detailBackdrop) closeDetail(); });
  document.getElementById('tourStart').addEventListener('click', startTour);
  document.getElementById('tourExit').addEventListener('click', () => endTour(true));
  document.getElementById('tourBack').addEventListener('click', () => { if (state.tourIndex > 0) { state.tourIndex -= 1; renderTourStep(); } });
  document.getElementById('tourNext').addEventListener('click', () => {
    if (state.tourIndex >= tourSteps.length - 1) endTour(false);
    else { state.tourIndex += 1; renderTourStep(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!detailBackdrop.hidden) closeDetail();
    else if (!pickerBackdrop.hidden) closePicker();
    else if (!document.getElementById('tourCard').hidden) endTour(true);
  });

  syncIdentity();
  updateFocusUI();
  setStep(1, { scroll: false });
})();
