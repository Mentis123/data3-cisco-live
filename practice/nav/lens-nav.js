(() => {
  const LENS_ORDER = ['practice', 'industry', 'audience', 'lifecycle'];
  const pickerBackdrop = document.getElementById('lensPickerBackdrop');
  const pickerRail = document.getElementById('lensPickerRail');
  const pickerTitle = document.getElementById('lensPickerTitle');
  const pickerHint = document.getElementById('lensPickerHint');
  const pickerSelection = document.getElementById('lensPickerSelection');
  const pickerClose = document.getElementById('lensPickerClose');
  const pickerDone = document.getElementById('lensPickerDone');
  const pickerAll = document.getElementById('lensPickerAll');
  const pickerLeft = document.getElementById('lensPickerLeft');
  const pickerRight = document.getElementById('lensPickerRight');
  const journeyButton = document.getElementById('showJourney');
  const viewReset = document.getElementById('viewReset');
  const tourStartButton = document.getElementById('tourStart');
  const tourExitButton = document.getElementById('tourExit');
  const tourBackButton = document.getElementById('tourBack');
  const tourNextButton = document.getElementById('tourNext');

  let activeLens = null;
  let pickerOpenedByTour = false;
  let pickerScrollTimer = null;

  function selectedValues(key) {
    return [...state.filters[key]];
  }

  function compactSummary(key) {
    const selected = selectedValues(key);
    if (!selected.length) return 'All';
    if (selected.length === 1) return selected[0];
    return `${selected[0]} +${selected.length - 1}`;
  }

  function fullSummary(key) {
    const selected = selectedValues(key);
    return selected.length ? selected.join(', ') : 'All';
  }

  function renderLensBar() {
    const host = document.getElementById('viewChips');
    host.innerHTML = LENS_ORDER.map(key => {
      const config = TAXONOMY[key];
      const hasSelection = state.filters[key].size > 0;
      return `
        <button
          class="viewLens${hasSelection ? ' hasSelection' : ''}"
          id="lensTrigger-${key}"
          type="button"
          data-lens-key="${key}"
          aria-haspopup="dialog"
          aria-expanded="${activeLens === key && !pickerBackdrop.hidden}"
          title="${escapeHtml(config.label)}: ${escapeHtml(fullSummary(key))}">
          <span class="viewLensName">${escapeHtml(config.label)}</span>
          <span class="viewLensValue">${escapeHtml(compactSummary(key))}</span>
        </button>`;
    }).join('');

    host.querySelectorAll('[data-lens-key]').forEach(button => {
      button.addEventListener('click', () => {
        const key = button.dataset.lensKey;
        if (activeLens === key && !pickerBackdrop.hidden) closeLensPicker();
        else openLensPicker(key);
      });
    });

    viewReset.hidden = !LENS_ORDER.some(key => state.filters[key].size > 0);
  }

  updateCurrentView = renderLensBar;

  function renderPickerSelection() {
    if (!activeLens) return;
    const selected = selectedValues(activeLens);
    pickerSelection.textContent = selected.length
      ? `${selected.length} selected · ${selected.join(' · ')}`
      : 'All options included';
    pickerAll.textContent = selected.length ? 'Reset to All' : 'All selected';
    pickerAll.disabled = selected.length === 0;
  }

  function buildPickerRail(key) {
    pickerRail.innerHTML = '';
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
        button.addEventListener('click', () => {
          toggleFilter(key, name);
          renderPickerSelection();
        });
        pickerRail.appendChild(button);
      });
    }

    pickerLeft.onclick = () => scrollRail(pickerRail, -1);
    pickerRight.onclick = () => scrollRail(pickerRail, 1);
    pickerRail.onscroll = () => {
      window.clearTimeout(pickerScrollTimer);
      pickerScrollTimer = window.setTimeout(() => recenterRail(pickerRail), 90);
    };

    initialiseRail(pickerRail);
    syncAllChoices();
  }

  function openLensPicker(key, options = {}) {
    if (!TAXONOMY[key]) return;
    if (!document.getElementById('drawerBackdrop').hidden) closeDrawer({ restoreFocus: false });

    activeLens = key;
    pickerOpenedByTour = Boolean(options.fromTour);
    pickerTitle.textContent = TAXONOMY[key].label;
    pickerHint.textContent = `${TAXONOMY[key].hint} Select several options, or reset this lens to All.`;
    pickerRail.dataset.key = key;
    pickerRail.setAttribute('aria-label', `${TAXONOMY[key].label} options`);
    buildPickerRail(key);
    renderPickerSelection();
    renderLensBar();

    pickerBackdrop.hidden = false;
    document.body.classList.add('pickerOpen');
    requestAnimationFrame(() => {
      pickerBackdrop.classList.add('open');
      if (options.focus !== false) pickerClose.focus({ preventScroll: true });
    });
  }

  function closeLensPicker(options = {}) {
    if (pickerBackdrop.hidden) return;
    const key = activeLens;
    pickerBackdrop.classList.remove('open');
    document.body.classList.remove('pickerOpen');
    pickerOpenedByTour = false;
    renderLensBar();

    const restore = options.restoreFocus !== false ? document.getElementById(`lensTrigger-${key}`) : null;
    window.setTimeout(() => {
      pickerBackdrop.hidden = true;
      activeLens = null;
      renderLensBar();
      if (restore) restore.focus({ preventScroll: true });
    }, 190);
  }

  function clearActiveLens() {
    if (!activeLens) return;
    state.filters[activeLens].clear();
    syncAllChoices();
    render();
    renderPickerSelection();
  }

  function applyStartingView() {
    Object.values(state.filters).forEach(set => set.clear());

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

    journeyButton.textContent = 'Starting view ready ✓';
    window.setTimeout(() => {
      journeyButton.textContent = 'Build my starting view →';
    }, 1500);

    scrollToTarget(document.getElementById('results'), false);
    window.setTimeout(() => pulseTarget(document.getElementById('currentView')), 420);
    showToast(`Starting view ready for ${persona} · tap any lens above to customise`);
  }

  TOUR.splice(0, TOUR.length,
    {
      title: 'Choose a starting view',
      body: 'Begin with a ready-made scenario or combine your role and reason for coming. Navigator uses that only as a starting configuration.',
      target: '#journeyPicker'
    },
    {
      title: 'Every lens stays in reach',
      body: 'Practice, Industry, Audience and Lifecycle now live in Current view and remain pinned while you browse starting points.',
      target: '#currentView'
    },
    {
      title: 'Open a lens to tune it',
      body: 'Each compact picker keeps the useful left-and-right carousel and multi-select behaviour without filling the page with four large rows.',
      target: '#lensPickerPanel',
      openLens: 'practice'
    },
    {
      title: 'Scan first, inspect second',
      body: 'Starting points remain compact: timing and a TL;DR are visible immediately, while the lenses above can refine the list at any time.',
      target: '#resultGrid'
    },
    {
      title: 'Details appear where they belong',
      body: 'Desktop opens a right-side drawer and mobile uses a bottom sheet. Finish returns to the top so you can choose or build your own view.',
      target: '#drawerPanel',
      openDrawer: true
    }
  );

  function focusCustomTourTarget(selector) {
    clearTourTarget();
    const target = document.querySelector(selector);
    if (!target) return;
    target.classList.add('tourTarget');
    document.getElementById('tourShade').hidden = false;
    if (!target.closest('.lensPickerPanel, .drawerPanel')) {
      window.setTimeout(() => scrollToTarget(target, selector === '#resultGrid'), 70);
    }
  }

  function showCustomTourStep() {
    const step = TOUR[state.tourIndex];
    if (!step) return;

    if (step.openLens) {
      if (activeLens !== step.openLens || pickerBackdrop.hidden) {
        openLensPicker(step.openLens, { fromTour: true, focus: false });
      }
    } else if (pickerOpenedByTour && !pickerBackdrop.hidden) {
      closeLensPicker({ restoreFocus: false });
    }

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

    window.setTimeout(() => focusCustomTourTarget(step.target), step.openLens || step.openDrawer ? 260 : 45);
  }

  function startCustomTour() {
    state.tourIndex = 0;
    state.lastFocus = document.activeElement;
    showCustomTourStep();
  }

  function finishCustomTour(returnToTop) {
    state.tourIndex = -1;
    document.getElementById('tour').hidden = true;
    document.getElementById('tourShade').hidden = true;
    clearTourTarget();

    if (!pickerBackdrop.hidden) closeLensPicker({ restoreFocus: false });
    if (state.drawerOpenedByTour && !document.getElementById('drawerBackdrop').hidden) {
      closeDrawer({ restoreFocus: false });
    }
    state.drawerOpenedByTour = false;

    if (returnToTop) {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.setTimeout(() => {
          pulseTarget(document.getElementById('journeyPicker'));
          journeyButton.focus({ preventScroll: true });
          showToast('Demo complete · choose a ready-made view or build your own');
        }, 520);
      }, 80);
    } else if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      state.lastFocus.focus({ preventScroll: true });
    }
  }

  pickerClose.addEventListener('click', () => closeLensPicker());
  pickerDone.addEventListener('click', () => closeLensPicker());
  pickerAll.addEventListener('click', clearActiveLens);
  pickerBackdrop.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeLensPicker();
  });
  viewReset.addEventListener('click', () => {
    resetFilters();
    if (!pickerBackdrop.hidden) renderPickerSelection();
  });

  journeyButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyStartingView();
  }, true);

  document.querySelectorAll('.sample').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('persona').value = button.dataset.persona;
      document.getElementById('mission').value = button.dataset.mission;
      applyStartingView();
    }, true);
  });

  tourStartButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    startCustomTour();
  }, true);

  tourExitButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    finishCustomTour(false);
  }, true);

  tourBackButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.tourIndex > 0) {
      state.tourIndex -= 1;
      showCustomTourStep();
    }
  }, true);

  tourNextButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.tourIndex >= TOUR.length - 1) finishCustomTour(true);
    else {
      state.tourIndex += 1;
      showCustomTourStep();
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (state.tourIndex >= 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishCustomTour(false);
    } else if (!pickerBackdrop.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeLensPicker();
    }
  }, true);

  window.addEventListener('resize', () => {
    if (!pickerBackdrop.hidden) initialiseRail(pickerRail);
  });

  render();
})();
