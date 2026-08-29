const state = {
  filters: {
    practice: new Set(),
    industry: new Set(),
    lifecycle: new Set(),
    audience: new Set()
  },
  tourIndex: -1,
  activeOffer: null,
  lastFocus: null,
  drawerOpenedByTour: false
};

const TOUR = [
  {
    title: 'Start with the job',
    body: 'Pick a role and a reason for coming. Show my journey turns that intent into a useful first view without asking the seller to invent a prompt.',
    target: '#journeyPicker'
  },
  {
    title: 'Current view stays with you',
    body: 'This compact chip line builds as filters are selected and remains pinned beneath the main navigation while the page scrolls.',
    target: '#currentView'
  },
  {
    title: 'Compact, infinite practice rail',
    body: 'Each row loops in both directions. Cards are deliberately square and compact, and All remains equally reachable from either direction.',
    target: '#rail-practice'
  },
  {
    title: 'Lifecycle is visible',
    body: 'Learn → Consult → Procure → Implement → Adopt → Operate makes the stage easy to scan and combine with any other lens.',
    target: '#rail-lifecycle'
  },
  {
    title: 'Scan first, inspect second',
    body: 'Starting points show only timing and a TL;DR. This keeps the page fast to scan while preserving a route to governed detail.',
    target: '#resultGrid'
  },
  {
    title: 'Details appear where they belong',
    body: 'Desktop opens a right-side drawer; mobile uses a bottom sheet. Fit, triggers, outputs, owner, freshness and actions are available without bloating every card.',
    target: '#drawerPanel',
    openDrawer: true
  }
];

const PERSONA_AUDIENCE = {
  'Account Executive': 'Chief Information Officer',
  'New Seller': null,
  'Generalist Seller': 'Chief Information Officer',
  'Technical Presales Engineer': 'Enterprise Architect',
  'Practice Specialist': 'IT Manager',
  'Sales Manager': 'Board / Executive Leadership Team'
};

const MISSION_PRESETS = {
  'Prepare for a customer meeting': { industry: ['Government'], lifecycle: ['Consult'] },
  'Learn or refresh a core offer': { practice: ['Data & AI'], lifecycle: ['Learn'] },
  'Decide what to position': { industry: ['Mining'], lifecycle: ['Consult'] },
  'Compare two solutions': { practice: ['Hybrid Cloud', 'Security'], lifecycle: ['Procure'], audience: ['Enterprise Architect'] },
  'Handle an objection': { practice: ['Security'], lifecycle: ['Consult'], audience: ['Chief Information Security Officer'] },
  'Find customer proof': { practice: ['Data & AI', 'Collaboration'], lifecycle: ['Adopt'] },
  'Explore an industry': { industry: ['Mining'], lifecycle: ['Learn'] }
};

const TYPE_WEIGHT = {
  'Core offer': 6,
  'Core service': 6,
  'Core advisory': 6,
  'Industry play': 5,
  'Strategic offer': 5,
  'Tier 2 offer': 3,
  'Lifecycle layer': 3,
  'Emerging demo offer': 1
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function allChoicesFor(key) {
  return [['All', `No ${TAXONOMY[key].label.toLowerCase()} filter`, '#00AEFF'], ...TAXONOMY[key].items];
}

function buildRails() {
  const host = document.getElementById('rails');
  host.innerHTML = '';

  Object.entries(TAXONOMY).forEach(([key, config]) => {
    const row = document.createElement('section');
    row.className = 'lensRow';
    row.id = `rail-${key}`;
    row.innerHTML = `
      <div class="lensHead">
        <div>
          <div class="lensEyebrow">${escapeHtml(config.label)}</div>
          <h3>${escapeHtml(config.label)}</h3>
        </div>
        <span class="lensHint">${escapeHtml(config.hint)}</span>
      </div>
      <div class="railShell">
        <button class="railArrow left" type="button" aria-label="Scroll ${escapeHtml(config.label)} left">‹</button>
        <div class="railViewport" data-key="${key}" aria-label="${escapeHtml(config.label)} options"></div>
        <button class="railArrow right" type="button" aria-label="Scroll ${escapeHtml(config.label)} right">›</button>
      </div>`;

    const viewport = row.querySelector('.railViewport');
    const choices = allChoicesFor(key);

    for (let cycle = 0; cycle < 3; cycle += 1) {
      choices.forEach(([name, note, colour]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice';
        button.dataset.key = key;
        button.dataset.value = name;
        button.dataset.cycle = String(cycle);
        button.style.setProperty('--accent', colour);
        button.setAttribute('aria-pressed', 'false');
        if (cycle !== 1) {
          button.tabIndex = -1;
          button.setAttribute('aria-hidden', 'true');
        }
        button.innerHTML = `
          <span class="choiceCheck">✓</span>
          <b>${escapeHtml(name)}</b>
          <span class="choiceNote">${escapeHtml(note)}</span>`;
        button.addEventListener('click', () => toggleFilter(key, name));
        viewport.appendChild(button);
      });
    }

    const left = row.querySelector('.railArrow.left');
    const right = row.querySelector('.railArrow.right');
    left.addEventListener('click', () => scrollRail(viewport, -1));
    right.addEventListener('click', () => scrollRail(viewport, 1));

    let scrollTimer;
    viewport.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => recenterRail(viewport), 90);
    }, { passive: true });

    host.appendChild(row);
    initialiseRail(viewport);
  });

  syncAllChoices();
}

function initialiseRail(viewport) {
  const initialise = () => {
    const key = viewport.dataset.key;
    const perCycle = allChoicesFor(key).length;
    const children = viewport.children;
    if (!children.length || children.length < perCycle * 2) return;
    const cycleWidth = children[perCycle].offsetLeft - children[0].offsetLeft;
    if (!cycleWidth) return;
    viewport.dataset.cycleWidth = String(cycleWidth);
    const previousBehaviour = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';
    viewport.scrollLeft = cycleWidth;
    viewport.style.scrollBehavior = previousBehaviour;
  };
  requestAnimationFrame(() => requestAnimationFrame(initialise));
}

function recenterRail(viewport) {
  const cycleWidth = Number(viewport.dataset.cycleWidth || 0);
  if (!cycleWidth) return;
  const previousBehaviour = viewport.style.scrollBehavior;
  viewport.style.scrollBehavior = 'auto';
  if (viewport.scrollLeft < cycleWidth * 0.45) {
    viewport.scrollLeft += cycleWidth;
  } else if (viewport.scrollLeft > cycleWidth * 1.55) {
    viewport.scrollLeft -= cycleWidth;
  }
  viewport.style.scrollBehavior = previousBehaviour;
}

function scrollRail(viewport, direction) {
  const firstCard = viewport.querySelector('.choice');
  const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 112;
  viewport.scrollBy({ left: direction * (cardWidth + 9) * 3, behavior: 'smooth' });
}

function toggleFilter(key, value) {
  const set = state.filters[key];
  if (value === 'All') {
    set.clear();
  } else if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
  syncAllChoices();
  render();
}

function syncAllChoices() {
  document.querySelectorAll('.choice[data-key]').forEach(button => {
    const set = state.filters[button.dataset.key];
    const selected = button.dataset.value === 'All' ? set.size === 0 : set.has(button.dataset.value);
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function resetFilters() {
  Object.values(state.filters).forEach(set => set.clear());
  syncAllChoices();
  render();
}

function updateCurrentView() {
  const host = document.getElementById('viewChips');
  const chips = [];
  Object.entries(TAXONOMY).forEach(([key, config]) => {
    state.filters[key].forEach(value => {
      chips.push(`<button class="viewChip removable" type="button" data-remove-key="${key}" data-remove-value="${escapeHtml(value)}">${escapeHtml(config.label)} · ${escapeHtml(value)}</button>`);
    });
  });

  if (!chips.length) {
    host.innerHTML = '<span class="viewChip all">All offers</span>';
  } else {
    chips.push('<button class="viewChip reset" type="button" data-reset-view="true">Clear</button>');
    host.innerHTML = chips.join('');
  }

  host.querySelectorAll('[data-remove-key]').forEach(button => {
    button.addEventListener('click', () => {
      state.filters[button.dataset.removeKey].delete(button.dataset.removeValue);
      syncAllChoices();
      render();
    });
  });
  const reset = host.querySelector('[data-reset-view]');
  if (reset) reset.addEventListener('click', resetFilters);
}

function valuesFor(item, key) {
  if (key === 'practice') return item.practices;
  if (key === 'industry') return item.industries;
  if (key === 'lifecycle') return item.lifecycle;
  return item.audiences;
}

function matches(item, key) {
  const selected = state.filters[key];
  return selected.size === 0 || valuesFor(item, key).some(value => selected.has(value));
}

function score(item) {
  let total = TYPE_WEIGHT[item.type] || 0;
  Object.keys(state.filters).forEach(key => {
    const selected = state.filters[key];
    total += valuesFor(item, key).filter(value => selected.has(value)).length * 5;
  });
  return total;
}

function filteredOffers() {
  return CATALOGUE
    .filter(item => Object.keys(state.filters).every(key => matches(item, key)))
    .sort((a, b) => score(b) - score(a) || a.title.localeCompare(b.title));
}

function whyText(item) {
  const reasons = [];
  Object.entries(TAXONOMY).forEach(([key, config]) => {
    const selected = state.filters[key];
    if (!selected.size) return;
    const matched = valuesFor(item, key).filter(value => selected.has(value));
    if (matched.length) reasons.push(`${config.label}: ${matched.join(' + ')}`);
  });
  return reasons.length ? reasons.join(' · ') : 'Core or high-value synthetic catalogue content while the view is set to All.';
}

function resultCard(item) {
  return `
    <button class="resultCard" type="button" data-offer-id="${item.id}" aria-label="Open details for ${escapeHtml(item.title)}">
      <span class="resultPractice">${escapeHtml(item.practices[0])}</span>
      <span class="resultArrow" aria-hidden="true">›</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="resultTldr">${escapeHtml(item.tldr)}</p>
      <div class="resultMeta"><span class="timingPill">${escapeHtml(item.timing)}</span><span>${escapeHtml(item.type)}</span></div>
    </button>`;
}

function render() {
  updateCurrentView();
  const rows = filteredOffers();
  document.getElementById('resultCount').textContent = `${rows.length} ${rows.length === 1 ? 'starting point' : 'starting points'}`;
  const grid = document.getElementById('resultGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = rows.map(resultCard).join('');
  empty.hidden = rows.length !== 0;
  grid.hidden = rows.length === 0;
  grid.querySelectorAll('[data-offer-id]').forEach(button => {
    button.addEventListener('click', () => openDrawer(button.dataset.offerId));
  });
}

function listMarkup(items) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function openDrawer(offerOrId, options = {}) {
  const item = typeof offerOrId === 'string' ? CATALOGUE.find(entry => entry.id === offerOrId) : offerOrId;
  if (!item) return;
  state.activeOffer = item;
  state.lastFocus = options.preserveFocus ? state.lastFocus : document.activeElement;
  state.drawerOpenedByTour = Boolean(options.fromTour);

  document.getElementById('drawerKicker').textContent = `${item.type} · ${item.proof}`;
  document.getElementById('drawerTitle').textContent = item.title;
  document.getElementById('drawerTiming').textContent = `Typical timing · ${item.timing}`;
  document.getElementById('drawerTldr').textContent = item.tldr;
  document.getElementById('drawerWhy').textContent = whyText(item);
  document.getElementById('drawerSummary').textContent = item.summary;
  document.getElementById('drawerTriggers').innerHTML = listMarkup(item.triggers);
  document.getElementById('drawerOutputs').innerHTML = listMarkup(item.outputs);
  document.getElementById('drawerTags').innerHTML = [
    ...item.practices.map(value => `Practice · ${value}`),
    ...item.lifecycle.map(value => `Lifecycle · ${value}`),
    ...item.audiences.slice(0, 3).map(value => `Audience · ${value}`)
  ].map(value => `<span class="drawerTag">${escapeHtml(value)}</span>`).join('');
  document.getElementById('drawerTrust').innerHTML = `
    <div class="trustItem"><b>Owner</b><span>${escapeHtml(item.owner)}</span></div>
    <div class="trustItem"><b>Freshness</b><span>${escapeHtml(item.reviewed)}</span></div>
    <div class="trustItem"><b>Catalogue status</b><span>${escapeHtml(item.type)}</span></div>
    <div class="trustItem"><b>Prototype source</b><span>Synthetic SolCat-style record</span></div>`;
  document.getElementById('drawerActions').innerHTML = item.actions.map(action => `<button class="drawerAction" type="button" data-demo-action="${escapeHtml(action)}">${escapeHtml(action)}</button>`).join('');
  document.querySelectorAll('[data-demo-action]').forEach(button => {
    button.addEventListener('click', () => showToast(`${button.dataset.demoAction} · synthetic demo action`));
  });

  const backdrop = document.getElementById('drawerBackdrop');
  backdrop.hidden = false;
  document.body.classList.add('drawerOpen');
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
    document.getElementById('drawerClose').focus({ preventScroll: true });
  });
}

function closeDrawer(options = {}) {
  const backdrop = document.getElementById('drawerBackdrop');
  if (backdrop.hidden) return;
  backdrop.classList.remove('open');
  document.body.classList.remove('drawerOpen');
  state.activeOffer = null;
  const restore = options.restoreFocus !== false ? state.lastFocus : null;
  window.setTimeout(() => {
    backdrop.hidden = true;
    if (restore && typeof restore.focus === 'function') restore.focus({ preventScroll: true });
  }, 220);
}

function applyJourney() {
  resetFilters();
  const persona = document.getElementById('persona').value;
  const mission = document.getElementById('mission').value;
  const preset = MISSION_PRESETS[mission] || {};

  Object.entries(preset).forEach(([key, values]) => {
    values.forEach(value => state.filters[key].add(value));
  });

  const personaAudience = PERSONA_AUDIENCE[persona];
  if (personaAudience && !preset.audience) state.filters.audience.add(personaAudience);

  syncAllChoices();
  render();
  scrollToTarget(document.getElementById('results'), false);
  pulseTarget(document.getElementById('results'));
  showToast(`View shaped for ${persona} · ${mission}`);
}

function stickyOffset() {
  const top = document.querySelector('.top').getBoundingClientRect().height;
  const view = document.querySelector('.viewBar').getBoundingClientRect().height;
  return top + view + 14;
}

function scrollToTarget(target, centre = false) {
  if (!target || target.closest('.drawerPanel')) return;
  const rect = target.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const targetTop = centre
    ? absoluteTop - Math.max(stickyOffset(), (window.innerHeight - rect.height) / 2)
    : absoluteTop - stickyOffset();
  window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
}

function clearTourTarget() {
  document.querySelectorAll('.tourTarget').forEach(element => element.classList.remove('tourTarget'));
}

function pulseTarget(target) {
  if (!target) return;
  target.classList.add('tourTarget');
  window.setTimeout(() => target.classList.remove('tourTarget'), 1400);
}

function focusTourTarget(selector) {
  clearTourTarget();
  const target = document.querySelector(selector);
  if (!target) return;
  target.classList.add('tourTarget');
  document.getElementById('tourShade').hidden = false;
  window.setTimeout(() => scrollToTarget(target, selector === '#resultGrid'), 70);
}

function showTourStep() {
  const step = TOUR[state.tourIndex];
  if (!step) return;

  if (step.openDrawer) {
    const first = filteredOffers()[0] || CATALOGUE[0];
    if (!state.activeOffer || state.activeOffer.id !== first.id) {
      openDrawer(first, { fromTour: true, preserveFocus: true });
    }
  } else if (state.drawerOpenedByTour && !document.getElementById('drawerBackdrop').hidden) {
    closeDrawer({ restoreFocus: false });
    state.drawerOpenedByTour = false;
  }

  document.getElementById('tour').hidden = false;
  document.getElementById('tourTitle').textContent = step.title;
  document.getElementById('tourBody').textContent = step.body;
  document.getElementById('tourStep').textContent = `${state.tourIndex + 1} / ${TOUR.length}`;
  document.getElementById('tourBack').disabled = state.tourIndex === 0;
  document.getElementById('tourNext').textContent = state.tourIndex === TOUR.length - 1 ? 'Finish' : 'Next →';
  document.getElementById('tourDots').innerHTML = TOUR.map((_, index) => `<i class="${index < state.tourIndex ? 'done' : index === state.tourIndex ? 'now' : ''}"></i>`).join('');

  window.setTimeout(() => focusTourTarget(step.target), step.openDrawer ? 250 : 40);
}

function startTour() {
  state.tourIndex = 0;
  state.lastFocus = document.activeElement;
  showTourStep();
}

function endTour() {
  state.tourIndex = -1;
  document.getElementById('tour').hidden = true;
  document.getElementById('tourShade').hidden = true;
  clearTourTarget();
  if (state.drawerOpenedByTour && !document.getElementById('drawerBackdrop').hidden) {
    closeDrawer({ restoreFocus: false });
  }
  state.drawerOpenedByTour = false;
  if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus({ preventScroll: true });
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function bindEvents() {
  document.getElementById('resetAll').addEventListener('click', resetFilters);
  document.getElementById('showJourney').addEventListener('click', applyJourney);
  document.querySelectorAll('.sample').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('persona').value = button.dataset.persona;
      document.getElementById('mission').value = button.dataset.mission;
      applyJourney();
    });
  });

  document.getElementById('drawerClose').addEventListener('click', () => closeDrawer());
  document.getElementById('drawerBackdrop').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeDrawer();
  });

  document.getElementById('tourStart').addEventListener('click', startTour);
  document.getElementById('tourExit').addEventListener('click', endTour);
  document.getElementById('tourBack').addEventListener('click', () => {
    if (state.tourIndex > 0) {
      state.tourIndex -= 1;
      showTourStep();
    }
  });
  document.getElementById('tourNext').addEventListener('click', () => {
    if (state.tourIndex >= TOUR.length - 1) {
      endTour();
    } else {
      state.tourIndex += 1;
      showTourStep();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (state.tourIndex >= 0) endTour();
      else if (!document.getElementById('drawerBackdrop').hidden) closeDrawer();
    }
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.railViewport').forEach(initialiseRail);
  });
}

buildRails();
bindEvents();
render();
