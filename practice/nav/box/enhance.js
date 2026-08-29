(() => {
  'use strict';

  const stateApi = window.DATA3_VIEW_STATE;
  const detailApi = window.DATA3_OFFERING_DETAIL;
  if (!stateApi || !detailApi) return;

  let restoring = false;

  function waitFor(test, timeout = 5000) {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = () => {
        let value = null;
        try { value = test(); } catch (error) {}
        if (value) return resolve(value);
        if (performance.now() - start >= timeout) return resolve(null);
        window.setTimeout(tick, 35);
      };
      tick();
    });
  }

  function stateFromDom() {
    return stateApi.resolve({
      practiceId: document.querySelector('.practiceChoice.is-active')?.dataset.practiceId || '',
      capabilityId: document.querySelector('.capabilityChoice.is-active')?.dataset.capabilityId || '',
      offeringId: document.querySelector('.offeringChoice.is-active')?.dataset.offeringId || ''
    });
  }

  function detailHost() {
    const level = document.getElementById('offeringLevel');
    if (!level) return null;
    let host = level.querySelector('.offeringRecordHost');
    if (!host) {
      host = document.createElement('div');
      host.className = 'offeringRecordHost';
      level.appendChild(host);
    }
    return host;
  }

  function renderDetail(state) {
    const level = document.getElementById('offeringLevel');
    const host = detailHost();
    if (!level || !host || level.hidden || !state.offeringId) {
      if (host) { host.innerHTML = ''; host.hidden = true; }
      return;
    }
    detailApi.mount(host, state, { compact: false });
  }

  function sync() {
    if (restoring) return;
    const state = stateFromDom();
    stateApi.set(state);
    renderDetail(state);
  }

  async function restore() {
    const initial = stateApi.get();
    if (!initial.practiceId) { sync(); return; }
    restoring = true;
    try {
      const practice = await waitFor(() => document.querySelector(`[data-practice-id="${initial.practiceId}"]`));
      practice?.click();
      if (initial.capabilityId) {
        const capability = await waitFor(() => document.querySelector(`[data-capability-id="${initial.capabilityId}"]`));
        capability?.click();
      }
      if (initial.offeringId) {
        const offering = await waitFor(() => document.querySelector(`[data-offering-id="${initial.offeringId}"]`));
        offering?.click();
      }
    } finally {
      restoring = false;
      const state = stateFromDom();
      stateApi.set(state);
      renderDetail(state);
    }
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.practiceChoice,.capabilityChoice,.offeringChoice,#resetTaxonomy,#taxonomyTrail button')) return;
    window.setTimeout(sync, 40);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore, { once: true });
  else restore();
})();
