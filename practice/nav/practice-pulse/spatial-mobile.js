// Mobile control deck for the spatial experience.
//
// On a phone the desktop cockpit is the wrong shape: the flight deck eats the
// bottom of the screen and the command board sits permanently over the middle,
// leaving the Three.js scene a letterbox. This module replaces both with a
// compact top strip and a collapsed summary bar that expands into the same
// board as a bottom sheet — so the canvas keeps the rest of the viewport.
//
// It forks no navigation logic. Every control it renders carries the same
// data-spatial-* attributes the desktop deck uses, so the delegated handler in
// spatial.js drives the identical state machine, and renderBoard()'s
// document-wide status sync lights the compact filter for free.
//
// Desktop is untouched: nothing here runs and no style applies unless
// isMobileViewport() says so and body[data-mobile="true"] has been published.

import { MOBILE_CONTRACT, isMobileViewport, mobileDeckMetrics } from './pulse-layout.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const SWIPE_THRESHOLD_PX = 24;

export class MobileSpatialDeck {
  constructor(bridge, stage) {
    this.bridge = bridge;
    this.stage = stage;
    this.snapshot = null;
    this.mobile = false;
    this.open = false;
    this.scopeSignature = '';
    this.gestureHandled = false;
    this.pointerStartY = null;
    this.coarseQuery = window.matchMedia('(pointer: coarse)');
    this.deck = document.getElementById('mobileDeck');
    this.rail = document.getElementById('mobileChipRail');
    this.scopeChip = document.getElementById('mobileScopeChip');
    this.sheet = document.getElementById('mobileSheet');
    this.handle = document.getElementById('mobileSheetHandle');
    this.summary = document.getElementById('mobileSheetSummary');
    this.canvas = document.getElementById('spatialCanvas');
  }

  get installed() {
    return Boolean(this.deck && this.rail && this.scopeChip && this.sheet && this.handle && this.summary);
  }

  install() {
    if (!this.installed) return this;
    const reevaluate = () => this.evaluate();
    window.addEventListener('resize', reevaluate);
    window.addEventListener('orientationchange', reevaluate);
    if (typeof this.coarseQuery.addEventListener === 'function') this.coarseQuery.addEventListener('change', reevaluate);

    this.handle.addEventListener('pointerdown', event => {
      this.pointerStartY = event.clientY;
      this.gestureHandled = false;
    });
    this.handle.addEventListener('pointerup', event => {
      if (this.pointerStartY === null) return;
      const delta = event.clientY - this.pointerStartY;
      this.pointerStartY = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      this.gestureHandled = true;
      this.setSheet(delta < 0);
    });
    this.handle.addEventListener('pointercancel', () => { this.pointerStartY = null; });
    this.handle.addEventListener('click', () => {
      if (this.gestureHandled) { this.gestureHandled = false; return; }
      this.setSheet(!this.open);
    });

    // With the sheet up the visible canvas strip doubles as the dismiss target.
    // Capture so the scene never also treats the dismissing tap as a selection.
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', event => {
        if (!this.mobile || !this.open) return;
        event.stopPropagation();
        this.setSheet(false);
      }, true);
    }

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !this.mobile || !this.open) return;
      event.stopPropagation();
      this.setSheet(false);
    }, true);

    this.evaluate();
    return this;
  }

  evaluate() {
    if (!this.installed) return;
    const height = Math.max(this.stage?.clientHeight || 0, window.innerHeight || 0, 1);
    const mobile = isMobileViewport(Math.max(window.innerWidth || 0, 1), this.coarseQuery.matches);
    const metrics = mobileDeckMetrics([Math.max(window.innerWidth || 0, 1), height]);
    const root = document.documentElement;
    root.style.setProperty('--pulse-strip-h', `${metrics.stripPx}px`);
    root.style.setProperty('--pulse-summary-h', `${metrics.summaryPx}px`);
    root.style.setProperty('--pulse-sheet-h', `${metrics.sheetPx}px`);
    root.style.setProperty('--pulse-touch', `${MOBILE_CONTRACT.minimumTouchTargetPx}px`);
    document.body.dataset.mobile = String(mobile);
    if (!document.body.dataset.sheet) document.body.dataset.sheet = 'closed';
    this.deck.hidden = !mobile;
    this.sheet.hidden = !mobile;
    if (!mobile && this.open) this.setSheet(false);
    this.mobile = mobile;
    this.render();
  }

  setSheet(open) {
    this.open = Boolean(open) && this.mobile;
    document.body.dataset.sheet = this.open ? 'open' : 'closed';
    this.handle.setAttribute('aria-expanded', String(this.open));
    this.handle.setAttribute('aria-label', this.open ? 'Collapse the command board' : 'Expand the command board');
  }

  sync(snapshot) {
    this.snapshot = snapshot;
    const signature = `${snapshot.filters.capability}|${snapshot.filters.offering}`;
    // Drilling is the moment the scene matters most, so surrender the sheet.
    if (this.scopeSignature && this.scopeSignature !== signature && this.open) this.setSheet(false);
    this.scopeSignature = signature;
    this.render();
  }

  render() {
    if (!this.installed || !this.mobile || !this.snapshot) return;
    const { capability, offering } = this.snapshot.filters;
    const records = this.snapshot.navigationRecords;
    const filtered = this.snapshot.filteredRecords;

    if (offering !== 'all') {
      this.scopeChip.dataset.spatialLevel = 'capability';
      this.scopeChip.disabled = false;
      this.scopeChip.innerHTML = `<i aria-hidden="true">‹</i><span><small>Offering · up to ${esc(capability)}</small><strong>${esc(offering)}</strong></span>`;
    } else if (capability !== 'all') {
      this.scopeChip.dataset.spatialLevel = 'practice';
      this.scopeChip.disabled = false;
      this.scopeChip.innerHTML = `<i aria-hidden="true">‹</i><span><small>Capability · up to Practice</small><strong>${esc(capability)}</strong></span>`;
    } else {
      delete this.scopeChip.dataset.spatialLevel;
      this.scopeChip.disabled = true;
      this.scopeChip.innerHTML = '<i aria-hidden="true">•</i><span><small>Practice</small><strong>Data &amp; AI</strong></span>';
    }

    this.rail.innerHTML = capability === 'all'
      ? this.capabilityChips(records)
      : this.offeringChips(records, capability, offering);
    this.rail.scrollLeft = 0;

    const scopeName = offering !== 'all' ? offering : capability !== 'all' ? capability : 'Data & AI';
    const open = filtered.filter(record => record.status === 'Open').length;
    this.summary.innerHTML = `<strong>${esc(scopeName)}</strong><span>${filtered.length} opportunit${filtered.length === 1 ? 'y' : 'ies'} · ${open} open</span>`;
  }

  capabilityChips(records) {
    return this.snapshot.capabilities.map(item => {
      const subset = records.filter(record => record.capabilities.includes(item.name));
      const open = subset.filter(record => record.status === 'Open').length;
      return `<button type="button" class="pulseChip" data-spatial-capability="${esc(item.name)}" style="--chip:${esc(item.colour)}">
        <strong>${esc(item.name)}</strong><span>${subset.length} · ${open} open</span>
      </button>`;
    }).join('');
  }

  offeringChips(records, capability, activeOffering) {
    const groups = new Map();
    records.filter(record => record.capabilities.includes(capability)).forEach(record => {
      if (!groups.has(record.offering)) groups.set(record.offering, []);
      groups.get(record.offering).push(record);
    });
    const colour = (this.snapshot.capabilities.find(item => item.name === capability) || {}).colour || '#00AEFF';
    const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const all = `<button type="button" class="pulseChip allChip${activeOffering === 'all' ? ' active' : ''}" data-spatial-offering="all" style="--chip:${esc(colour)}">
      <strong>All offerings</strong><span>${sorted.length} in ${esc(capability)}</span>
    </button>`;
    return all + sorted.map(([offering, subset]) => {
      const open = subset.filter(record => record.status === 'Open').length;
      return `<button type="button" class="pulseChip${activeOffering === offering ? ' active' : ''}" data-spatial-offering="${esc(offering)}" style="--chip:${esc(colour)}">
        <strong>${esc(offering)}</strong><span>${subset.length} · ${open} open</span>
      </button>`;
    }).join('');
  }
}
