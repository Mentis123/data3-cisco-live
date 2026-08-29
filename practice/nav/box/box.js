(() => {
  const portfolio = window.DATA3_PORTFOLIO;
  const catalogue = Array.isArray(window.CATALOGUE) ? window.CATALOGUE : [];
  if (!portfolio || !Array.isArray(portfolio.practices)) return;

  const state = {
    practice: null,
    capability: null,
    offering: null,
    query: ''
  };

  const els = {
    practiceRail: document.getElementById('practiceRail'),
    reset: document.getElementById('resetTaxonomy'),
    practiceLevel: document.getElementById('practiceLevel'),
    practiceEmpty: document.getElementById('practiceEmpty'),
    practiceTitle: document.getElementById('practiceTitle'),
    practiceDefinition: document.getElementById('practiceDefinition'),
    practiceMeta: document.getElementById('practiceMeta'),
    capabilityChooser: document.getElementById('capabilityChooser'),
    capabilityGrid: document.getElementById('capabilityGrid'),
    capabilityCount: document.getElementById('capabilityCount'),
    capabilityLevel: document.getElementById('capabilityLevel'),
    capabilityTitle: document.getElementById('capabilityTitle'),
    offeringCount: document.getElementById('offeringCount'),
    offeringSearch: document.getElementById('offeringSearch'),
    offeringGrid: document.getElementById('offeringGrid'),
    offeringLevel: document.getElementById('offeringLevel'),
    offeringTitle: document.getElementById('offeringTitle'),
    offeringVendor: document.getElementById('offeringVendor'),
    offeringMotion: document.getElementById('offeringMotion'),
    offeringPath: document.getElementById('offeringPath'),
    trail: document.getElementById('taxonomyTrail')
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function canon(value) {
    return window.DATA3_CANON_TEXT ? window.DATA3_CANON_TEXT(value) : String(value ?? '');
  }

  function prettyToken(value) {
    const raw = String(value || '').trim();
    if (/^d3\s*w\/?\s*ba$/i.test(raw)) return 'Data#3 with Business Aspect';
    if (/^ba$/i.test(raw)) return 'Business Aspect';
    if (/^d3$/i.test(raw)) return 'Data#3';
    return raw.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function countOfferings(practice) {
    return (practice.capabilities || []).reduce((sum, capability) => sum + (capability.offerings || []).length, 0);
  }

  function findCatalogueOffering(offering) {
    return catalogue.find(item => item.id === offering.id) ||
      catalogue.find(item => item.title === offering.name && item.capability === state.capability?.name && item.practices?.includes(state.practice?.name));
  }

  function updateHash() {
    const parts = [];
    if (state.practice) parts.push(`practice=${encodeURIComponent(state.practice.id)}`);
    if (state.capability) parts.push(`capability=${encodeURIComponent(state.capability.id)}`);
    if (state.offering) parts.push(`offering=${encodeURIComponent(state.offering.id)}`);
    history.replaceState(null, '', parts.length ? `#${parts.join('&')}` : location.pathname + location.search);
  }

  function parseHash() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const practice = portfolio.practices.find(item => item.id === params.get('practice'));
    if (!practice) return;
    state.practice = practice;
    const capability = practice.capabilities.find(item => item.id === params.get('capability'));
    if (capability) state.capability = capability;
    const offering = capability?.offerings.find(item => item.id === params.get('offering'));
    if (offering) state.offering = offering;
  }

  function renderPractices() {
    els.practiceRail.innerHTML = portfolio.practices.map(practice => {
      const active = state.practice?.id === practice.id;
      const capabilityCount = practice.capabilities.length;
      const offeringCount = countOfferings(practice);
      return `<button class="practiceChoice${active ? ' is-active' : ''}" type="button" role="listitem" data-practice-id="${esc(practice.id)}" aria-pressed="${active}">
        <b>${esc(canon(practice.name))}</b>
        <small>${capabilityCount} ${capabilityCount === 1 ? 'Capability' : 'Capabilities'} · ${offeringCount} Offerings</small>
      </button>`;
    }).join('');

    els.practiceRail.querySelectorAll('[data-practice-id]').forEach(button => {
      button.addEventListener('click', () => selectPractice(button.dataset.practiceId, true));
    });
  }

  function renderTrail() {
    const buttons = els.trail.querySelectorAll('button');
    const practiceButton = buttons[1];
    const capabilityButton = buttons[2];
    const offeringButton = buttons[3];

    practiceButton.textContent = state.practice ? canon(state.practice.name) : 'Choose a Practice';
    practiceButton.disabled = !state.practice;
    capabilityButton.textContent = state.capability ? canon(state.capability.name) : 'Choose a Capability';
    capabilityButton.disabled = !state.capability;
    offeringButton.textContent = state.offering ? canon(state.offering.name) : 'Choose an Offering';
    offeringButton.disabled = !state.offering;
  }

  function renderPractice() {
    if (!state.practice) {
      els.practiceLevel.classList.add('is-empty');
      els.practiceEmpty.hidden = false;
      els.capabilityChooser.hidden = true;
      els.capabilityLevel.hidden = true;
      els.offeringLevel.hidden = true;
      els.practiceTitle.textContent = 'Choose a Practice above';
      els.practiceDefinition.textContent = portfolio.definitions?.practice || 'Market-aligned technology domains.';
      els.practiceMeta.hidden = true;
      return;
    }

    els.practiceLevel.classList.remove('is-empty');
    els.practiceEmpty.hidden = true;
    els.capabilityChooser.hidden = false;
    els.practiceTitle.textContent = canon(state.practice.name);
    els.practiceDefinition.textContent = `${canon(state.practice.name)} is a ${String(portfolio.definitions?.practice || 'market-aligned technology domain').replace(/\.$/, '').toLowerCase()}.`;

    const meta = [
      state.practice.meta ? canon(state.practice.meta) : '',
      state.practice.layer ? prettyToken(state.practice.layer) : '',
      state.practice.delivery ? prettyToken(state.practice.delivery) : '',
      `${state.practice.capabilities.length} ${state.practice.capabilities.length === 1 ? 'Capability' : 'Capabilities'}`,
      `${countOfferings(state.practice)} Offerings`
    ].filter(Boolean);
    els.practiceMeta.innerHTML = meta.map(item => `<span>${esc(item)}</span>`).join('');
    els.practiceMeta.hidden = false;
    renderCapabilities();
  }

  function renderCapabilities() {
    if (!state.practice) return;
    els.capabilityCount.textContent = `${state.practice.capabilities.length} in ${canon(state.practice.name)}`;
    els.capabilityGrid.innerHTML = state.practice.capabilities.map(capability => {
      const active = state.capability?.id === capability.id;
      const count = capability.offerings.length;
      return `<button class="capabilityChoice${active ? ' is-active' : ''}" type="button" data-capability-id="${esc(capability.id)}" aria-pressed="${active}">
        <b>${esc(canon(capability.name))}</b>
        <span>${count} ${count === 1 ? 'Offering' : 'Offerings'} <i aria-hidden="true">›</i></span>
      </button>`;
    }).join('');

    els.capabilityGrid.querySelectorAll('[data-capability-id]').forEach(button => {
      button.addEventListener('click', () => selectCapability(button.dataset.capabilityId, true));
    });
  }

  function filteredOfferings() {
    if (!state.capability) return [];
    const query = state.query.trim().toLowerCase();
    if (!query) return state.capability.offerings;
    return state.capability.offerings.filter(offering => `${offering.name} ${offering.vendor || ''}`.toLowerCase().includes(query));
  }

  function renderCapability() {
    if (!state.capability) {
      els.capabilityLevel.hidden = true;
      els.offeringLevel.hidden = true;
      return;
    }
    els.capabilityLevel.hidden = false;
    els.capabilityTitle.textContent = canon(state.capability.name);
    els.offeringCount.textContent = state.capability.offerings.length;
    renderOfferings();
  }

  function renderOfferings() {
    const rows = filteredOfferings();
    if (!rows.length) {
      els.offeringGrid.innerHTML = '<div class="emptyOfferings">No Offerings match this search.</div>';
      return;
    }

    els.offeringGrid.innerHTML = rows.map(offering => {
      const active = state.offering?.id === offering.id;
      const source = offering.vendor || 'Data#3';
      return `<button class="offeringChoice${active ? ' is-active' : ''}" type="button" data-offering-id="${esc(offering.id)}" aria-pressed="${active}">
        <b>${esc(canon(offering.name))}</b>
        <span>${esc(canon(source))} <em aria-hidden="true">›</em></span>
      </button>`;
    }).join('');

    els.offeringGrid.querySelectorAll('[data-offering-id]').forEach(button => {
      button.addEventListener('click', () => selectOffering(button.dataset.offeringId, true));
    });
  }

  function renderOffering() {
    if (!state.offering || !state.capability || !state.practice) {
      els.offeringLevel.hidden = true;
      return;
    }

    els.offeringLevel.hidden = false;
    els.offeringTitle.textContent = canon(state.offering.name);
    els.offeringVendor.textContent = canon(state.offering.vendor || 'Data#3 / source catalogue');
    const catalogueOffering = findCatalogueOffering(state.offering);
    els.offeringMotion.textContent = canon(catalogueOffering?.commercialType || 'Current portfolio Offering');
    els.offeringPath.textContent = `${canon(state.practice.name)} → ${canon(state.capability.name)}`;
  }

  function renderAll() {
    renderPractices();
    renderPractice();
    renderCapability();
    renderOffering();
    renderTrail();
    updateHash();
  }

  function selectPractice(id, moveViewport) {
    const practice = portfolio.practices.find(item => item.id === id);
    if (!practice) return;
    state.practice = practice;
    state.capability = null;
    state.offering = null;
    state.query = '';
    els.offeringSearch.value = '';
    renderAll();
    if (moveViewport) window.setTimeout(() => els.practiceLevel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function selectCapability(id, moveViewport) {
    const capability = state.practice?.capabilities.find(item => item.id === id);
    if (!capability) return;
    state.capability = capability;
    state.offering = null;
    state.query = '';
    els.offeringSearch.value = '';
    renderAll();
    if (moveViewport) window.setTimeout(() => els.capabilityLevel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function selectOffering(id, moveViewport) {
    const offering = state.capability?.offerings.find(item => item.id === id);
    if (!offering) return;
    state.offering = offering;
    renderAll();
    if (moveViewport) window.setTimeout(() => els.offeringLevel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }

  function reset() {
    state.practice = null;
    state.capability = null;
    state.offering = null;
    state.query = '';
    els.offeringSearch.value = '';
    renderAll();
    window.setTimeout(() => document.querySelector('.practiceChooser').scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  }

  els.reset.addEventListener('click', reset);
  els.offeringSearch.addEventListener('input', event => {
    state.query = event.target.value;
    renderOfferings();
  });

  els.trail.querySelector('[data-level="portfolio"]').addEventListener('click', reset);
  els.trail.querySelector('[data-level="practice"]').addEventListener('click', () => {
    state.capability = null;
    state.offering = null;
    renderAll();
    els.practiceLevel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  els.trail.querySelector('[data-level="capability"]').addEventListener('click', () => {
    state.offering = null;
    renderAll();
    els.capabilityLevel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  parseHash();
  renderAll();
})();
