(() => {
  'use strict';

  const stateApi = window.DATA3_VIEW_STATE;
  const detailApi = window.DATA3_OFFERING_DETAIL;
  if (!stateApi || !detailApi) return;

  let restoring = false;
  let lastPracticeId = '';

  function waitFor(test, timeout = 7000) {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = () => {
        let value = null;
        try { value = test(); } catch (error) {}
        if (value) return resolve(value);
        if (performance.now() - start >= timeout) return resolve(null);
        window.setTimeout(tick, 40);
      };
      tick();
    });
  }

  function parseKey(prefix, value) {
    if (!value?.startsWith(prefix)) return [];
    return value.slice(prefix.length).split(':');
  }

  function stateFromDom() {
    const selected = document.querySelector('.offerNode.is-selected')?.getAttribute('data-key') || '';
    const selectedParts = parseKey('offer:', selected);
    if (selectedParts.length >= 3) {
      return stateApi.resolve({
        practiceId: selectedParts[0],
        capabilityId: selectedParts[1],
        offeringId: selectedParts.slice(2).join(':')
      });
    }

    const capabilityKey = document.querySelector('.capabilityNode.is-open')?.getAttribute('data-key') || '';
    const capabilityParts = parseKey('capability:', capabilityKey);
    if (capabilityParts.length >= 2) {
      return stateApi.resolve({ practiceId: capabilityParts[0], capabilityId: capabilityParts.slice(1).join(':') });
    }

    const openPractices = [...document.querySelectorAll('.practiceNode.is-open')]
      .map(node => parseKey('practice:', node.getAttribute('data-key') || '')[0])
      .filter(Boolean);
    const practiceId = openPractices.includes(lastPracticeId) ? lastPracticeId : openPractices[0] || '';
    return stateApi.resolve({ practiceId });
  }

  function getHost() {
    const panel = document.querySelector('.focusPanel');
    if (!panel) return null;
    let host = panel.querySelector('.offeringRecordHost');
    if (!host) {
      host = document.createElement('div');
      host.className = 'offeringRecordHost';
      panel.appendChild(host);
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
    lastPracticeId = initial.practiceId;
    try {
      const practice = await waitFor(() => document.querySelector(`.practiceNode[data-key="practice:${initial.practiceId}"]`));
      practice?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      if (initial.capabilityId) {
        const capability = await waitFor(() => document.querySelector(`.capabilityNode[data-key="capability:${initial.practiceId}:${initial.capabilityId}"]`));
        capability?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      if (initial.offeringId) {
        const offering = await waitFor(() => document.querySelector(`.offerNode[data-key="offer:${initial.practiceId}:${initial.capabilityId}:${initial.offeringId}"]`));
        offering?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    } finally {
      restoring = false;
      const state = stateFromDom();
      stateApi.set(state);
      renderDetail(state);
    }
  }

  document.addEventListener('click', event => {
    const node = event.target.closest('.practiceNode,.capabilityNode,.offerNode');
    if (node?.classList.contains('practiceNode')) {
      lastPracticeId = parseKey('practice:', node.getAttribute('data-key') || '')[0] || lastPracticeId;
    }
    if (!node && !event.target.closest('#openAI,#openSecurity,#collapseAll,.trail button,.dockChip button')) return;
    window.setTimeout(sync, 80);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore, { once: true });
  else restore();
})();
