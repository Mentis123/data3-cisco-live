(() => {
  const ROLE_COLOURS = {
    'Account Executive': '#00AEFF',
    'New Seller': '#78DCFF',
    'Generalist Seller': '#9B9BFF',
    'Technical Presales Engineer': '#00FFFF',
    'Practice Specialist': '#DAFF00',
    'Sales Manager': '#FFB7FF'
  };
  const MISSION_COLOURS = {
    'Prepare for a customer meeting': '#00AEFF',
    'Learn or refresh a core offer': '#78DCFF',
    'Decide what to position': '#DAFF00',
    'Compare two solutions': '#9B9BFF',
    'Handle an objection': '#FF00FF',
    'Find customer proof': '#00FF00',
    'Explore an industry': '#00FFFF'
  };
  const FALLBACK = '#78DCFF';
  const originalPersona = document.getElementById('persona');
  const originalMission = document.getElementById('mission');
  const host = document.getElementById('viewChips');
  const viewBar = document.getElementById('currentView');
  if (!originalPersona || !originalMission || !host || !viewBar) return;

  function hexToRgb(hex) {
    const clean = String(hex || FALLBACK).replace('#', '');
    const n = Number.parseInt(clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  function optionColour(key, value) {
    const config = TAXONOMY[key];
    const row = config && config.items.find(item => item[0] === value);
    return row ? row[2] : FALLBACK;
  }

  function blendForLens(key) {
    const selected = [...state.filters[key]];
    if (!selected.length) return { accent: FALLBACK, rgb: hexToRgb(FALLBACK), gradient: null };
    const colours = selected.map(value => optionColour(key, value));
    const accent = colours[0] || FALLBACK;
    if (colours.length === 1) return { accent, rgb: hexToRgb(accent), gradient: null };
    const step = 100 / colours.length;
    const stops = colours.map((colour, i) => `${colour} ${Math.max(0, i * step)}%, ${colour} ${Math.min(100, (i + 1) * step)}%`).join(',');
    return { accent, rgb: hexToRgb(accent), gradient: `linear-gradient(90deg,${stops})` };
  }

  function makeContextControl(kind, label, source, palette) {
    const wrapper = document.createElement('div');
    wrapper.className = 'contextControl';
    wrapper.dataset.contextKind = kind;
    const controlLabel = document.createElement('label');
    controlLabel.textContent = label;
    const select = document.createElement('select');
    select.setAttribute('aria-label', label);
    [...source.options].forEach(option => select.add(new Option(option.text, option.value)));
    select.value = source.value;
    select.addEventListener('change', () => {
      source.value = select.value;
      source.dispatchEvent(new Event('change', { bubbles: true }));
      colourContext(wrapper, palette[select.value] || FALLBACK);
      showToast(`${label}: ${select.value}`);
      render();
    });
    wrapper.append(controlLabel, select);
    colourContext(wrapper, palette[select.value] || FALLBACK);
    return wrapper;
  }

  function colourContext(node, colour) {
    node.style.setProperty('--context-accent', colour);
    node.style.setProperty('--context-rgb', hexToRgb(colour));
  }

  const roleControl = makeContextControl('persona', 'I am a…', originalPersona, ROLE_COLOURS);
  const missionControl = makeContextControl('mission', 'I need to…', originalMission, MISSION_COLOURS);
  const buildView = document.createElement('button');
  buildView.type = 'button';
  buildView.className = 'buildViewCta';
  buildView.innerHTML = '<span>Build your starting view</span><b aria-hidden="true">→</b>';
  buildView.addEventListener('click', () => {
    render();
    scrollToTarget(document.getElementById('results'), false);
    window.setTimeout(() => pulseTarget(document.getElementById('results')), 260);
    showToast('Starting points updated for your Current view');
  });

  const mobileToggle = document.createElement('button');
  mobileToggle.type = 'button';
  mobileToggle.className = 'mobileViewToggle';
  mobileToggle.setAttribute('aria-controls', 'viewChips');
  mobileToggle.setAttribute('aria-expanded', 'false');
  mobileToggle.textContent = 'All filters · 6';
  viewBar.querySelector('.viewLabel')?.after(mobileToggle);

  function setMobileExpanded(expanded) {
    viewBar.classList.toggle('mobileExpanded', expanded);
    mobileToggle.setAttribute('aria-expanded', String(expanded));
    mobileToggle.textContent = expanded ? 'Collapse filters' : 'All filters · 6';
    if (!expanded) host.scrollTo({ left: 0, behavior: 'smooth' });
  }

  mobileToggle.addEventListener('click', () => {
    setMobileExpanded(!viewBar.classList.contains('mobileExpanded'));
  });

  function syncContextValues() {
    const roleSelect = roleControl.querySelector('select');
    const missionSelect = missionControl.querySelector('select');
    if (roleSelect.value !== originalPersona.value) roleSelect.value = originalPersona.value;
    if (missionSelect.value !== originalMission.value) missionSelect.value = originalMission.value;
    colourContext(roleControl, ROLE_COLOURS[roleSelect.value] || FALLBACK);
    colourContext(missionControl, MISSION_COLOURS[missionSelect.value] || FALLBACK);
  }

  function decorateLensButtons() {
    host.querySelectorAll('[data-lens-key]').forEach(button => {
      const key = button.dataset.lensKey;
      const colour = blendForLens(key);
      button.style.setProperty('--lens-accent', colour.accent);
      button.style.setProperty('--lens-rgb', colour.rgb);
      if (colour.gradient) {
        button.style.setProperty('--lens-multi-gradient', colour.gradient);
        button.style.borderImage = `${colour.gradient} 1`;
      } else {
        button.style.removeProperty('--lens-multi-gradient');
        button.style.borderImage = '';
      }
    });
  }

  function injectContextControls() {
    syncContextValues();
    if (!host.contains(roleControl)) host.prepend(roleControl);
    if (!host.contains(missionControl)) roleControl.after(missionControl);
    if (!host.contains(buildView)) host.append(buildView);
    decorateLensButtons();
  }

  const observer = new MutationObserver(() => {
    observer.disconnect();
    injectContextControls();
    observer.observe(host, { childList: true });
  });
  observer.observe(host, { childList: true });

  document.querySelectorAll('.sample').forEach(button => {
    button.addEventListener('click', () => window.setTimeout(syncContextValues, 0));
  });
  document.getElementById('showJourney')?.addEventListener('click', () => window.setTimeout(syncContextValues, 0));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 620 && viewBar.classList.contains('mobileExpanded')) setMobileExpanded(false);
  });

  injectContextControls();
})();

(() => {
  if (typeof filteredOffers !== 'function' || typeof render !== 'function') return;

  const baseFilteredOffers = filteredOffers;
  let sortMode = 'best';
  const baseRank = new Map();

  function numericTiming(value) {
    const text = String(value || '').toLowerCase();
    const match = text.match(/(\d+(?:\.\d+)?)/);
    let amount = match ? Number(match[1]) : 999;
    if (/hour|min|same day/.test(text)) amount /= 7;
    else if (/month/.test(text)) amount *= 30;
    else if (/week/.test(text)) amount *= 7;
    return amount;
  }

  function reviewedTime(value) {
    const parsed = Date.parse(String(value || '').replace(/^Reviewed\s+/i, '1 '));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function strategicWeight(item) {
    const type = String(item.type || '').toLowerCase();
    if (type.includes('core')) return 0;
    if (type.includes('strateg')) return 1;
    if (type.includes('featured')) return 2;
    return 3;
  }

  function contextualBoost(item) {
    let boost = 0;
    const mission = document.getElementById('mission')?.value;
    const persona = document.getElementById('persona')?.value;
    const preset = (typeof MISSION_PRESETS !== 'undefined' && MISSION_PRESETS[mission]) || {};
    Object.entries(preset).forEach(([key, wanted]) => {
      if (typeof valuesFor !== 'function') return;
      const values = valuesFor(item, key);
      boost += wanted.filter(value => values.includes(value)).length * 3;
    });
    if (typeof PERSONA_AUDIENCE !== 'undefined' && typeof valuesFor === 'function') {
      const audience = PERSONA_AUDIENCE[persona];
      if (audience && valuesFor(item, 'audience').includes(audience)) boost += 2;
    }
    return boost;
  }

  filteredOffers = function sortedFilteredOffers() {
    const rows = baseFilteredOffers();
    rows.forEach((item, index) => baseRank.set(item.id, index));
    const stable = item => baseRank.get(item.id) ?? 9999;

    if (sortMode === 'best') {
      return rows.slice().sort((a, b) => contextualBoost(b) - contextualBoost(a) || stable(a) - stable(b));
    }
    if (sortMode === 'strategic') {
      return rows.slice().sort((a, b) => strategicWeight(a) - strategicWeight(b) || stable(a) - stable(b));
    }
    if (sortMode === 'quick') {
      return rows.slice().sort((a, b) => numericTiming(a.timing) - numericTiming(b.timing) || stable(a) - stable(b));
    }
    if (sortMode === 'recent') {
      return rows.slice().sort((a, b) => reviewedTime(b.reviewed) - reviewedTime(a.reviewed) || stable(a) - stable(b));
    }
    if (sortMode === 'az') {
      return rows.slice().sort((a, b) => String(a.title).localeCompare(String(b.title)));
    }
    return rows;
  };

  const count = document.getElementById('resultCount');
  const head = document.querySelector('.resultsHead');
  if (!count || !head) return;

  const tools = document.createElement('div');
  tools.className = 'resultTools';
  tools.id = 'resultTools';
  count.before(tools);
  tools.appendChild(count);

  const label = document.createElement('label');
  label.className = 'sortControl';
  label.innerHTML = `
    <span>Sort</span>
    <select id="resultSort" aria-label="Sort recommended starting points">
      <option value="best">Best for this view</option>
      <option value="strategic">Core & strategic first</option>
      <option value="quick">Quickest to use</option>
      <option value="recent">Recently reviewed</option>
      <option value="az">A–Z</option>
    </select>`;
  tools.appendChild(label);

  label.querySelector('select').addEventListener('change', event => {
    sortMode = event.target.value;
    render();
    showToast(`Sorted: ${event.target.options[event.target.selectedIndex].text}`);
  });

  if (Array.isArray(TOUR)) {
    const pickerStep = TOUR.find(step => step.openLens);
    if (pickerStep) {
      pickerStep.title = 'Open a dropdown to tune it';
      pickerStep.body = 'Each lens opens a compact colour-coded multi-select. Pick one or several values, then choose Done.';
    }
    const scanStep = TOUR.find(step => step.target === '#resultGrid');
    if (scanStep) {
      scanStep.title = 'Sort the starting points';
      scanStep.body = 'Best for this view adapts to your role, mission and selected lenses. Switch to strategic, quickest, freshest or A–Z when that is more useful.';
      scanStep.target = '#resultTools';
    }
  }

  render();
})();