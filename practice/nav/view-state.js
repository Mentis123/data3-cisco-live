(() => {
  'use strict';

  const portfolio = window.DATA3_PORTFOLIO;
  if (!portfolio || !Array.isArray(portfolio.practices)) return;

  const STORAGE_KEY = 'data3.navigator.selection.v1';
  const VIEW_PATHS = ['/nav/pond', '/nav/bubbles', '/nav/box', '/nav/world', '/nav/ar'];
  const practices = new Map();
  const capabilities = new Map();
  const offerings = new Map();

  function canonical(value) {
    return window.DATA3_CANON_TEXT ? window.DATA3_CANON_TEXT(value) : String(value ?? '');
  }

  function slug(value) {
    return canonical(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  portfolio.practices.forEach(practice => {
    practices.set(practice.id, practice);
    (practice.capabilities || []).forEach(capability => {
      capabilities.set(capability.id, { practice, capability });
      (capability.offerings || []).forEach(offering => {
        offerings.set(offering.id, { practice, capability, offering });
      });
    });
  });

  function empty() {
    return { practiceId: '', capabilityId: '', offeringId: '' };
  }

  function resolve(input = {}) {
    const raw = {
      practiceId: String(input.practiceId || input.practice || '').trim(),
      capabilityId: String(input.capabilityId || input.capability || '').trim(),
      offeringId: String(input.offeringId || input.offering || '').trim()
    };

    if (raw.offeringId && offerings.has(raw.offeringId)) {
      const path = offerings.get(raw.offeringId);
      return { practiceId: path.practice.id, capabilityId: path.capability.id, offeringId: path.offering.id };
    }

    if (raw.capabilityId && capabilities.has(raw.capabilityId)) {
      const path = capabilities.get(raw.capabilityId);
      const offeringId = raw.offeringId && path.capability.offerings.some(item => item.id === raw.offeringId)
        ? raw.offeringId
        : '';
      return { practiceId: path.practice.id, capabilityId: path.capability.id, offeringId };
    }

    if (raw.practiceId && practices.has(raw.practiceId)) {
      return { practiceId: raw.practiceId, capabilityId: '', offeringId: '' };
    }

    const practice = portfolio.practices.find(item => slug(item.name) === raw.practiceId);
    if (!practice) return empty();
    const capability = (practice.capabilities || []).find(item => slug(item.name) === raw.capabilityId);
    if (!capability) return { practiceId: practice.id, capabilityId: '', offeringId: '' };
    const offering = (capability.offerings || []).find(item => slug(item.name) === raw.offeringId);
    return { practiceId: practice.id, capabilityId: capability.id, offeringId: offering?.id || '' };
  }

  function pathFor(input) {
    const state = resolve(input);
    const practice = practices.get(state.practiceId) || null;
    const capability = state.capabilityId ? capabilities.get(state.capabilityId)?.capability || null : null;
    const offering = state.offeringId ? offerings.get(state.offeringId)?.offering || null : null;
    return { state, practice, capability, offering };
  }

  function parseParams(params) {
    return resolve({
      practiceId: params.get('practice') || '',
      capabilityId: params.get('capability') || '',
      offeringId: params.get('offering') || ''
    });
  }

  function hasState(state) {
    return Boolean(state.practiceId || state.capabilityId || state.offeringId);
  }

  function readUrl() {
    const query = parseParams(new URLSearchParams(location.search));
    if (hasState(query)) return query;

    const hash = location.hash.replace(/^#/, '');
    if (hash.includes('practice=') || hash.includes('capability=') || hash.includes('offering=')) {
      const state = parseParams(new URLSearchParams(hash));
      if (hasState(state)) return state;
    }

    if (/^\/?[^=&]+/.test(hash)) {
      const [practice, capability] = hash.replace(/^\//, '').split('/').filter(Boolean);
      const state = resolve({ practiceId: practice || '', capabilityId: capability || '' });
      if (hasState(state)) return state;
    }

    return empty();
  }

  function readStored() {
    try {
      const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      return value ? resolve(value) : empty();
    } catch (error) {
      return empty();
    }
  }

  let current = (() => {
    const fromUrl = readUrl();
    return hasState(fromUrl) ? fromUrl : readStored();
  })();

  function writeQuery(state) {
    const url = new URL(location.href);
    ['practice', 'capability', 'offering'].forEach(key => url.searchParams.delete(key));
    if (state.practiceId) url.searchParams.set('practice', state.practiceId);
    if (state.capabilityId) url.searchParams.set('capability', state.capabilityId);
    if (state.offeringId) url.searchParams.set('offering', state.offeringId);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function href(path, input = current) {
    const state = resolve(input);
    const url = new URL(path, location.origin);
    if (state.practiceId) url.searchParams.set('practice', state.practiceId);
    if (state.capabilityId) url.searchParams.set('capability', state.capabilityId);
    if (state.offeringId) url.searchParams.set('offering', state.offeringId);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function isVisualPath(pathname) {
    const clean = pathname.replace(/\/+$/, '') || '/';
    return VIEW_PATHS.includes(clean);
  }

  function decorateLinks(root = document) {
    root.querySelectorAll?.('a[href]').forEach(anchor => {
      let url;
      try { url = new URL(anchor.getAttribute('href'), location.origin); } catch (error) { return; }
      if (url.origin !== location.origin || !isVisualPath(url.pathname)) return;
      anchor.href = href(url.pathname, current);
      anchor.dataset.data3Stateful = 'true';
    });
  }

  function set(next, options = {}) {
    current = resolve(next);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch (error) {}
    if (options.writeUrl !== false) writeQuery(current);
    decorateLinks();
    window.dispatchEvent(new CustomEvent('data3selectionchange', { detail: { ...current } }));
    return { ...current };
  }

  function clear(options) {
    return set(empty(), options);
  }

  window.DATA3_VIEW_STATE = {
    get: () => ({ ...current }),
    set,
    clear,
    resolve,
    pathFor,
    href,
    decorateLinks,
    slug
  };

  document.addEventListener('DOMContentLoaded', () => decorateLinks(), { once: true });
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.getAttribute('href'), location.origin); } catch (error) { return; }
    if (url.origin !== location.origin || !isVisualPath(url.pathname)) return;
    anchor.href = href(url.pathname, current);
  }, true);
})();
