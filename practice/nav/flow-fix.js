(() => {
  const journeyButton = document.getElementById('showJourney');
  const sampleButtons = document.querySelectorAll('.sample');
  const tourNextButton = document.getElementById('tourNext');

  function applyStartingView() {
    Object.values(state.filters).forEach(set => set.clear());

    const persona = document.getElementById('persona').value;
    const mission = document.getElementById('mission').value;
    const preset = MISSION_PRESETS[mission] || {};

    Object.entries(preset).forEach(([key, values]) => {
      values.forEach(value => state.filters[key].add(value));
    });

    const personaAudience = PERSONA_AUDIENCE[persona];
    if (personaAudience && !preset.audience) {
      state.filters.audience.add(personaAudience);
    }

    syncAllChoices();
    render();

    journeyButton.textContent = 'Starting view ready ✓';
    window.setTimeout(() => {
      journeyButton.textContent = 'Build my starting view →';
    }, 1600);

    scrollToTarget(document.getElementById('discovery'), false);
    window.setTimeout(() => pulseTarget(document.getElementById('rail-practice')), 500);
    showToast(`Suggested view ready for ${persona} · tune any lens before opening a starting point`);
  }

  journeyButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyStartingView();
  }, true);

  sampleButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('persona').value = button.dataset.persona;
      document.getElementById('mission').value = button.dataset.mission;
      applyStartingView();
    }, true);
  });

  if (Array.isArray(TOUR) && TOUR.length) {
    TOUR[0].body = 'Choose a role and a reason for coming. Build my starting view applies a useful suggestion, then lands at the discovery lenses so the employee can tune anything before opening a result.';
    TOUR[TOUR.length - 1].body = 'Desktop opens a right-side drawer; mobile uses a bottom sheet. Fit, triggers, outputs, owner, freshness and actions stay available without bloating every card. Finish returns you to the top to build your own view.';
  }

  tourNextButton.addEventListener('click', event => {
    if (state.tourIndex < TOUR.length - 1) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    endTour();

    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        pulseTarget(document.getElementById('journeyPicker'));
        journeyButton.focus({ preventScroll: true });
        showToast('Demo complete · build a starting view, then customise any lens');
      }, 560);
    }, 80);
  }, true);
})();
