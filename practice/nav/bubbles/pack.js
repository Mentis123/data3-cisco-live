(() => {
  'use strict';

  const frame = document.getElementById('packFrame');
  const svgElement = document.getElementById('packSvg');
  const dockElement = document.getElementById('sideDock');
  if (!frame || !svgElement) return;
  if (!window.d3 || !window.DATA3_PORTFOLIO) {
    frame.classList.add('pack-error');
    frame.innerHTML = '<div class="packError"><b>The portfolio map could not load.</b><span>Refresh to retry.</span></div>';
    return;
  }

  const d3 = window.d3;
  const MODEL = window.DATA3_PORTFOLIO;
  const LEVEL = MODEL.levels;
  const SIZE = 1000;
  const EDGE = 11;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = milliseconds => reduceMotion ? 0 : milliseconds;

  // Focus model: the focused level packs large inside the Portfolio bubble;
  // everything else tiles into the side dock.
  const state = { focusPractices: new Set(), focusCapability: null, selectedOfferKey: null };
  const nodeByKey = new Map();
  let floatReady = false;
  let floatTimer = 0;
  let raf = 0;

  const svg = d3.select(svgElement).attr('viewBox', `0 0 ${SIZE} ${SIZE}`).attr('preserveAspectRatio', 'xMidYMid meet');
  const defs = svg.append('defs');
  const rootGradient = defs.append('radialGradient').attr('id', 'rootGradient').attr('cx', '36%').attr('cy', '28%');
  rootGradient.append('stop').attr('offset', '0%').attr('stop-color', '#173370').attr('stop-opacity', .68);
  rootGradient.append('stop').attr('offset', '58%').attr('stop-color', '#08083d').attr('stop-opacity', .96);
  rootGradient.append('stop').attr('offset', '100%').attr('stop-color', '#010126').attr('stop-opacity', 1);
  const glow = defs.append('filter').attr('id', 'bubbleGlow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
  glow.append('feGaussianBlur').attr('stdDeviation', 6).attr('result', 'blur');
  const merge = glow.append('feMerge');
  merge.append('feMergeNode').attr('in', 'blur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  const rootLayer = svg.append('g').attr('class', 'rootLayer');
  const practiceLayer = svg.append('g').attr('class', 'practiceLayer');
  const capabilityLayer = svg.append('g').attr('class', 'capabilityLayer');
  const offerLayer = svg.append('g').attr('class', 'offerLayer');
  const labelLayer = svg.append('g').attr('class', 'labelLayer').attr('aria-hidden', 'true');
  const rootCircle = rootLayer.append('circle').attr('class', 'portfolioRoot');
  const rootArc = rootLayer.append('path').attr('class', 'rootArc').attr('id', 'portfolioArc');
  const rootEdgeText = rootLayer.append('text').attr('class', 'rootEdgeLabel').append('textPath').attr('href', '#portfolioArc').attr('startOffset', '50%');
  rootEdgeText.text('PORTFOLIO · DATA#3 TECHNOLOGY PRODUCTS & SERVICES');

  const statusEl = document.getElementById('mapStatus');
  const hintEl = document.getElementById('mapHint');
  const summaryEl = document.getElementById('portfolioSummary');
  const detailKicker = document.getElementById('detailKicker');
  const detailTitle = document.getElementById('detailTitle');
  const detailBody = document.getElementById('detailBody');
  const trail = document.getElementById('trail');
  const detailMeta = document.getElementById('detailMeta');

  function slug(value) { return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  function shortPractice(name) { return { 'Business Advisory': 'BA', 'Data & AI': 'AI', 'Applications & Automation': 'APPS', 'End User Computing': 'EUC', 'Lifecycle Services': 'LIFE', 'Hybrid Cloud': 'CLOUD' }[name] || name.split(/\s+/).map(x => x[0]).join('').slice(0, 5).toUpperCase(); }
  function capKey(practice, capability) { return `capability:${practice.id}:${capability.id}`; }
  function offerKey(practice, capability, offering) { return `offer:${practice.id}:${capability.id}:${offering.id}`; }
  function offeringsOf(practice) { return (practice.capabilities || []).reduce((total, capability) => total + (capability.offerings || []).length, 0); }
  function focusedPractices() { return MODEL.practices.filter(practice => state.focusPractices.has(practice.id)); }
  function practiceById(id) { return MODEL.practices.find(practice => practice.id === id); }

  function buildCapabilityNode(practice, capability, open) {
    const count = (capability.offerings || []).length;
    if (!open || !count) return { key: capKey(practice, capability), kind: 'capability', name: capability.name, capability, practice, open: false, offerCount: count, value: Math.max(.85, 1.15 + count * .52) };
    return {
      key: capKey(practice, capability), kind: 'capability', name: capability.name, capability, practice, open: true, offerCount: count,
      children: capability.offerings.map((offering, index) => ({
        key: offerKey(practice, capability, offering), kind: 'offer', name: offering.name, practice, capability, offering,
        value: 1 + Math.min(.35, offering.name.length / 120), index
      }))
    };
  }

  function buildPracticeNode(practice, open) {
    if (!open) return { key: `practice:${practice.id}`, kind: 'practice', name: practice.name, practice, open: false, value: Math.max(1.4, (practice.capabilities || []).length * .55) };
    return { key: `practice:${practice.id}`, kind: 'practice', name: practice.name, practice, open: true, children: (practice.capabilities || []).map(capability => buildCapabilityNode(practice, capability, false)) };
  }

  function buildHierarchy() {
    let children;
    if (state.focusCapability) {
      const practice = practiceById(state.focusCapability.practiceId);
      const capability = practice?.capabilities.find(item => item.id === state.focusCapability.capabilityId);
      children = practice && capability ? [buildCapabilityNode(practice, capability, true)] : [];
    } else if (state.focusPractices.size) {
      children = focusedPractices().map(practice => buildPracticeNode(practice, true));
    } else {
      children = MODEL.practices.map(practice => buildPracticeNode(practice, false));
    }
    const data = { key: 'portfolio', kind: 'portfolio', name: MODEL.name, children };
    const root = d3.hierarchy(data).sum(item => item.value || 0);
    /* Deeper root padding while focused keeps the portfolio and focus edge labels
       from stacking on top of each other. */
    const rootPad = state.focusCapability ? 84 : state.focusPractices.size ? 58 : 26;
    const packed = d3.pack().size([SIZE - EDGE * 2, SIZE - EDGE * 2]).padding(node => node.depth === 0 ? rootPad : node.depth === 1 ? 12 : 8)(root);
    packed.each(node => { node.x += EDGE; node.y += EDGE; });
    const offers = packed.descendants().filter(node => node.data.kind === 'offer');
    if (offers.length === 1) { const only = offers[0]; only.r = Math.min(only.r, (only.parent?.r || only.r) * .55); }
    return packed;
  }

  function transition(selection, milliseconds) { return selection.transition().duration(duration(milliseconds)).ease(d3.easeCubicInOut); }
  function baseTransform(node) { return `translate(${node.x},${node.y}) scale(1)`; }
  function startTransform(node) { const parent = node.parent || node; return `translate(${parent.x},${parent.y}) scale(.12)`; }
  function bindKeyboard(selection, handler) { selection.on('keydown', (event, node) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(event, node); } }); }

  function upperArc(radius, inset = 8) {
    const r = Math.max(8, radius - inset);
    const x = r * .72;
    const y = -r * .68;
    return `M ${-x} ${y} A ${r} ${r} 0 0 1 ${x} ${y}`;
  }

  function renderCircleLayer(layerSelection, nodes, className, handler, ariaLabel, levelName) {
    const join = layerSelection.selectAll(`g.${className}`).data(nodes, node => node.data.key);
    const enter = join.enter().append('g').attr('class', className).attr('role', 'button').attr('tabindex', 0).attr('opacity', 0).attr('transform', startTransform);
    enter.append('circle').attr('r', 0);
    enter.append('title');
    const merged = enter.merge(join)
      .attr('data-key', node => node.data.key)
      .attr('aria-label', ariaLabel)
      .classed('is-open', node => Boolean(node.data.open))
      .classed('is-selected', node => node.data.key === state.selectedOfferKey)
      .style('--level-colour', LEVEL[levelName].colour)
      .style('--level-rgb', LEVEL[levelName].rgb)
      .on('click', handler);
    bindKeyboard(merged, handler);
    transition(merged, 620).attr('opacity', 1).attr('transform', baseTransform);
    transition(merged.select('circle'), 620).attr('r', node => node.r);
    merged.select('title').text(node => ariaLabel(node));
    transition(join.exit(), 280).attr('opacity', 0).attr('transform', startTransform).remove();
    return merged;
  }

  function splitLabel(text, maxChars, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    words.forEach(word => { const candidate = current ? `${current} ${word}` : word; if (candidate.length <= maxChars || !current) current = candidate; else { lines.push(current); current = word; } });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines;
    const trimmed = lines.slice(0, maxLines);
    trimmed[maxLines - 1] = `${trimmed[maxLines - 1]}…`;
    return trimmed;
  }

  function labelSpec(node) {
    const kind = node.data.kind;
    const radius = node.r;
    if (kind === 'practice' && node.data.open) return { edge: true, inset: 12, level: 'PRACTICE', text: node.data.name, fontSize: Math.max(11, Math.min(20, radius * .09)) };
    if (kind === 'capability' && node.data.open) return { edge: true, inset: 14, level: 'CAPABILITY', text: node.data.name, fontSize: Math.max(9, Math.min(18, radius * .08)) };
    if (kind === 'practice') return { edge: false, level: 'PRACTICE', text: radius < 60 ? shortPractice(node.data.name) : node.data.name, fontSize: Math.max(11, Math.min(23, radius * .16)), count: `${(node.data.practice.capabilities || []).length} capabilities` };
    if (kind === 'capability') return { edge: false, level: 'CAPABILITY', text: node.data.name, fontSize: Math.max(9, Math.min(21, radius * .14)), count: `${node.data.offerCount} offering${node.data.offerCount === 1 ? '' : 's'}` };
    return { edge: false, level: 'OFFERING', text: node.data.name, fontSize: Math.max(7.5, Math.min(18, radius * .15)), count: node.data.offering.vendor || 'Data#3' };
  }

  function renderLabels(nodes) {
    const join = labelLayer.selectAll('g.nodeLabel').data(nodes, node => node.data.key);
    const enter = join.enter().append('g').attr('class', 'nodeLabel').attr('opacity', 0).attr('transform', startTransform);
    enter.append('path').attr('class', 'edgeArc');
    enter.append('text').attr('class', 'edgeText').append('textPath').attr('startOffset', '50%');
    enter.append('text').attr('class', 'centreText').attr('text-anchor', 'middle');
    enter.append('text').attr('class', 'levelTag').attr('text-anchor', 'middle');
    enter.append('text').attr('class', 'countText').attr('text-anchor', 'middle');

    const merged = enter.merge(join).attr('data-key', node => node.data.key).attr('class', node => `nodeLabel ${node.data.kind}LabelGroup`);
    transition(merged, 620).attr('opacity', 1).attr('transform', baseTransform);
    merged.each(function(node) {
      const group = d3.select(this);
      const spec = labelSpec(node);
      const pathId = `edge-${slug(node.data.key)}`;
      group.select('.edgeArc').attr('id', pathId).attr('d', spec.edge ? upperArc(node.r, spec.inset || 9) : '').style('display', spec.edge ? null : 'none');
      group.select('.edgeText').attr('font-size', spec.fontSize).select('textPath').attr('href', `#${pathId}`).text(spec.edge ? `${spec.level} · ${String(spec.text).toUpperCase()}` : '');
      const centreText = group.select('.centreText');
      const levelTag = group.select('.levelTag');
      const countText = group.select('.countText');
      if (spec.edge) { centreText.selectAll('tspan').remove(); levelTag.text(''); countText.text(''); return; }
      const maxChars = Math.max(4, Math.floor((node.r * 1.55) / (spec.fontSize * .54)));
      const lines = splitLabel(spec.text, maxChars, node.data.kind === 'offer' ? 3 : 2);
      const lineHeight = spec.fontSize * 1.05;
      const startY = -((lines.length - 1) * lineHeight) / 2 + (spec.count ? -2 : 4);
      centreText.attr('font-size', spec.fontSize).attr('y', startY).selectAll('tspan').data(lines).join('tspan').attr('x', 0).attr('dy', (line, index) => index === 0 ? 0 : lineHeight).text(line => line);
      levelTag.attr('y', -Math.min(node.r * .52, 40)).text(node.r > 33 ? spec.level : '');
      countText.attr('font-size', Math.max(8, Math.min(12, node.r * .09))).attr('y', Math.min(node.r * .56, 46)).text(node.r > 43 ? spec.count : '');
    });
    transition(join.exit(), 250).attr('opacity', 0).attr('transform', startTransform).remove();
  }

  function dockChip(kind, colourKey, label, count, action, addAction) {
    const colour = LEVEL[colourKey].colour;
    const rgb = LEVEL[colourKey].rgb;
    return `<div class="dockChip" style="--chip:${colour};--chip-rgb:${rgb}">
      <button type="button" class="dockMain" data-action="${action}"><i></i><span><b>${esc(label)}</b><small>${esc(count)}</small></span></button>
      ${addAction ? `<button type="button" class="dockAdd" data-action="${addAction}" title="Add to the open view" aria-label="Add ${esc(label)} to the open view">+</button>` : ''}
    </div>`;
  }

  function renderDock() {
    if (!dockElement) return;
    let heading = '';
    let chips = [];
    if (state.focusCapability) {
      const practice = practiceById(state.focusCapability.practiceId);
      if (practice) {
        heading = 'Other capabilities';
        chips = practice.capabilities.filter(capability => capability.id !== state.focusCapability.capabilityId)
          .map(capability => dockChip('capability', 'capability', capability.name, `${(capability.offerings || []).length} offerings`, `capability:${practice.id}:${capability.id}`));
        chips.push(dockChip('practice', 'practice', practice.name, 'Back to practice', `practice:${practice.id}`));
      }
    } else if (state.focusPractices.size) {
      heading = 'Other practices';
      chips = MODEL.practices.filter(practice => !state.focusPractices.has(practice.id))
        .map(practice => dockChip('practice', 'practice', practice.name, `${(practice.capabilities || []).length} capabilities`, `practice:${practice.id}`, `add:${practice.id}`));
    }
    dockElement.hidden = !chips.length;
    frame.classList.toggle('has-dock', Boolean(chips.length));
    dockElement.innerHTML = chips.length ? `<div class="dockHead">${heading}</div><div class="dockList">${chips.join('')}</div>` : '';
    dockElement.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
      const [verb, a, b] = button.dataset.action.split(':');
      if (verb === 'practice') focusPractice(a);
      else if (verb === 'capability') focusCapability(a, b);
      else if (verb === 'add') { state.focusCapability = null; state.focusPractices.add(a); state.selectedOfferKey = null; render(); }
    }));
  }

  function render() {
    floatReady = false;
    window.clearTimeout(floatTimer);
    const root = buildHierarchy();
    const practiceNodes = root.descendants().filter(node => node.data.kind === 'practice');
    const capabilityNodes = root.descendants().filter(node => node.data.kind === 'capability');
    const offerNodes = root.descendants().filter(node => node.data.kind === 'offer');
    nodeByKey.clear();
    [...practiceNodes, ...capabilityNodes, ...offerNodes].forEach((node, index) => { node.floatIndex = index; nodeByKey.set(node.data.key, node); });
    transition(rootCircle, 620).attr('cx', root.x).attr('cy', root.y).attr('r', root.r);
    transition(rootArc, 620).attr('d', upperArc(root.r, 14)).attr('transform', `translate(${root.x},${root.y})`);
    renderCircleLayer(practiceLayer, practiceNodes, 'practiceNode', (event, node) => { event?.stopPropagation?.(); togglePractice(node.data.practice); }, node => `${node.data.practice.name}, Practice`, 'practice');
    renderCircleLayer(capabilityLayer, capabilityNodes, 'capabilityNode', (event, node) => { event?.stopPropagation?.(); toggleCapability(node.data.practice, node.data.capability); }, node => `${node.data.capability.name}, Capability in ${node.data.practice.name}`, 'capability');
    renderCircleLayer(offerLayer, offerNodes, 'offerNode', (event, node) => { event?.stopPropagation?.(); selectOffer(node); }, node => `${node.data.offering.name}, Offering`, 'offering');
    renderLabels([...practiceNodes, ...capabilityNodes, ...offerNodes]);
    renderDock();
    updateStatus();
    floatTimer = window.setTimeout(() => { floatReady = !reduceMotion; }, duration(650) + 30);
  }

  function focusPractice(practiceId) {
    state.focusCapability = null;
    state.focusPractices = new Set([practiceId]);
    state.selectedOfferKey = null;
    render();
  }

  function focusCapability(practiceId, capabilityId) {
    state.focusPractices = new Set([practiceId]);
    state.focusCapability = { practiceId, capabilityId };
    state.selectedOfferKey = null;
    render();
  }

  function resetFocus() {
    state.focusPractices.clear();
    state.focusCapability = null;
    state.selectedOfferKey = null;
    render();
  }

  function togglePractice(practice) {
    if (state.focusCapability && state.focusCapability.practiceId === practice.id) { focusPractice(practice.id); return; }
    if (state.focusPractices.has(practice.id) && !state.focusCapability) {
      state.focusPractices.delete(practice.id);
      state.selectedOfferKey = null;
      if (!state.focusPractices.size) resetFocus(); else render();
      return;
    }
    focusPractice(practice.id);
  }

  function toggleCapability(practice, capability) {
    if (state.focusCapability && state.focusCapability.capabilityId === capability.id) { focusPractice(practice.id); return; }
    focusCapability(practice.id, capability.id);
  }

  function selectOffer(node) {
    state.selectedOfferKey = node.data.key;
    offerLayer.selectAll('g.offerNode').classed('is-selected', candidate => candidate.data.key === state.selectedOfferKey);
    const { practice, capability, offering } = node.data;
    detailKicker.textContent = 'Offering';
    detailTitle.textContent = offering.name;
    detailBody.textContent = capability.description || `${offering.name} is mapped to ${capability.name}.`;
    detailMeta.textContent = [practice.name, capability.name, offering.vendor].filter(Boolean).join(' · ');
    renderTrail(['Portfolio', practice.name, capability.name, offering.name], practice, capability);
    hintEl.textContent = 'Offering selected — details on the right.';
  }

  function renderTrail(items, practice, capability) {
    trail.innerHTML = items.map((item, index) => `<button type="button" data-trail="${index}">${esc(item)}</button>`).join('');
    trail.querySelectorAll('[data-trail]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.trail);
      if (index === 0) resetFocus();
      else if (index === 1 && practice) focusPractice(practice.id);
      else if (index === 2 && practice && capability) focusCapability(practice.id, capability.id);
    }));
  }

  function updateStatus() {
    const open = focusedPractices();
    const deep = state.focusCapability;
    summaryEl.textContent = `${MODEL.practices.length} practices · ${open.length ? open.map(practice => shortPractice(practice.name)).join(' + ') + ' in focus' : 'portfolio overview'}${deep ? ' · 1 capability open' : ''}`;
    if (!open.length) {
      statusEl.textContent = 'Portfolio overview';
      hintEl.textContent = 'Pick a Practice — it fills the bubble, the rest tile beside it.';
      detailKicker.textContent = 'Portfolio';
      detailTitle.textContent = 'Practices, capabilities and offerings.';
      detailBody.textContent = `${MODEL.totalCapabilities} source-backed capabilities and ${MODEL.totalOfferings} offerings.`;
      detailMeta.textContent = 'Portfolio → Practice → Capability → Offering';
      renderTrail(['Portfolio']);
      return;
    }
    if (deep) {
      const practice = practiceById(deep.practiceId);
      const capability = practice?.capabilities.find(item => item.id === deep.capabilityId);
      if (!practice || !capability) return;
      statusEl.textContent = `${practice.name} · ${capability.name}`;
      if (!state.selectedOfferKey) {
        hintEl.textContent = 'Select an Offering.';
        detailKicker.textContent = 'Capability focus';
        detailTitle.textContent = capability.name;
        detailBody.textContent = `${(capability.offerings || []).length} mapped offerings in ${practice.name}.`;
        detailMeta.textContent = capability.description || practice.meta || '';
        renderTrail(['Portfolio', practice.name, capability.name], practice, capability);
      }
      return;
    }
    statusEl.textContent = open.map(practice => practice.name).join(' + ');
    hintEl.textContent = 'Open a Capability to zoom into its Offerings.';
    if (!state.selectedOfferKey) {
      detailKicker.textContent = 'Practice focus';
      detailTitle.textContent = open.map(practice => practice.name).join(' + ');
      const capabilityCount = open.reduce((total, practice) => total + (practice.capabilities || []).length, 0);
      const offeringCount = open.reduce((total, practice) => total + offeringsOf(practice), 0);
      detailBody.textContent = `${capabilityCount} capabilities · ${offeringCount} offerings`;
      detailMeta.textContent = open.map(practice => practice.meta || practice.layer).filter(Boolean).join(' · ');
      renderTrail(['Portfolio', ...open.map(practice => practice.name)], open[0]);
    }
  }

  function animateFloat(time) {
    if (floatReady) {
      const t = time / 1000;
      const groups = [practiceLayer.selectAll('g.practiceNode'), capabilityLayer.selectAll('g.capabilityNode'), offerLayer.selectAll('g.offerNode'), labelLayer.selectAll('g.nodeLabel')];
      groups.forEach(selection => selection.each(function(node) {
        const base = nodeByKey.get(node.data.key) || node;
        const amp = node.data.kind === 'offer' ? 3.2 : node.data.kind === 'capability' ? 2.4 : 1.8;
        const dx = Math.sin(t * .72 + base.floatIndex * 1.77) * amp;
        const dy = Math.cos(t * .62 + base.floatIndex * 1.31) * amp * .72;
        d3.select(this).attr('transform', `translate(${base.x + dx},${base.y + dy}) scale(1)`);
      }));
    }
    raf = window.requestAnimationFrame(animateFloat);
  }

  document.getElementById('openAI')?.addEventListener('click', () => focusPractice('practice-data-and-ai'));
  document.getElementById('openSecurity')?.addEventListener('click', () => { state.focusCapability = null; state.focusPractices.add('practice-security'); state.selectedOfferKey = null; render(); });
  document.getElementById('collapseAll')?.addEventListener('click', resetFocus);
  window.addEventListener('resize', () => render());

  render();
  if (!reduceMotion) raf = window.requestAnimationFrame(animateFloat);
  window.addEventListener('pagehide', () => { if (raf) window.cancelAnimationFrame(raf); });
})();
