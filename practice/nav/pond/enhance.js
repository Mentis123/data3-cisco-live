(() => {
  'use strict';

  const stateApi = window.DATA3_VIEW_STATE;
  const detailApi = window.DATA3_OFFERING_DETAIL;
  if (!stateApi || !detailApi) return;

  let restoring = false;

  function waitFor(test, timeout = 9000) {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = () => {
        let value = null;
        try { value = test(); } catch (error) {}
        if (value) return resolve(value);
        if (performance.now() - start >= timeout) return resolve(null);
        window.setTimeout(tick, 45);
      };
      tick();
    });
  }

  function stateFromDom() {
    const practiceId = document.querySelector('.stoneChip.active')?.dataset.practiceId || '';
    const offering = document.querySelector('.mapNode[data-kind="offering"].selected');
    if (offering) {
      const [capabilityId, offeringId] = String(offering.dataset.nodeId || '').split('--');
      return stateApi.resolve({ practiceId, capabilityId, offeringId });
    }
    const capabilityId = document.querySelector('.mapNode[data-kind="capability"].is-open')?.dataset.nodeId || '';
    return stateApi.resolve({ practiceId, capabilityId });
  }

  function getHost() {
    const detail = document.getElementById('offerDetail');
    if (!detail) return null;
    let host = detail.querySelector('.offeringRecordHost');
    if (!host) {
      host = document.createElement('div');
      host.className = 'offeringRecordHost';
      detail.appendChild(host);
    }
    return host;
  }

  function renderDetail(state) {
    const host = getHost();
    if (!host) return;
    if (!state.offeringId) {
      host.innerHTML = '';
      host.hidden = true;
      return;
    }
    detailApi.mount(host, state, { compact: true });
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
      const stone = await waitFor(() => document.querySelector(`.stoneChip[data-practice-id="${initial.practiceId}"]`));
      stone?.click();
      if (initial.capabilityId) {
        const capability = await waitFor(() => document.querySelector(`.mapNode[data-node-id="${initial.capabilityId}"]`));
        capability?.click();
      }
      if (initial.offeringId) {
        const offering = await waitFor(() => document.querySelector(`.mapNode[data-node-id="${initial.capabilityId}--${initial.offeringId}"]`));
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
    if (!event.target.closest('.stoneChip,.mapNode,#resetPond,.connectedList button')) return;
    window.setTimeout(sync, event.target.closest('.stoneChip') ? 620 : 70);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore, { once: true });
  else restore();
})();
