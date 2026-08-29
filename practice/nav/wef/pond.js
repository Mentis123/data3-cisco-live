(() => {
  if (typeof CATALOGUE === 'undefined') return;

  const LEVEL = {
    portfolio: '#11B8F5',
    practice: '#7F5CE4',
    capability: '#A20F9F',
    offering: '#D51BD3'
  };

  const PRACTICES = {
    'business-advisory': {
      label: 'Business Advisory',
      description: 'Align strategy, investment, operating ownership and adoption before technology decisions harden.',
      capabilities: [
        ['strategy-roadmaps', 'Strategy & roadmaps', ['roadmap', 'ai-envision']],
        ['governance-operating-model', 'Governance & operating model', ['e8', 'finops', 'servicenow']],
        ['change-adoption', 'Change & adoption', ['ai-adopt', 'copilot-deploy']]
      ]
    },
    'data-ai': {
      label: 'Data & AI',
      description: 'Connect AI ambition to trusted data, governance, useful scenarios and measurable adoption.',
      capabilities: [
        ['ai-strategy', 'AI strategy & governance', ['ai-envision', 'ai-govern', 'sovereign-ai']],
        ['data-platforms', 'Data platforms', ['data-modern']],
        ['copilot-adoption', 'Copilot & adoption', ['copilot-ready', 'ai-adopt', 'copilot-deploy']],
        ['automation', 'Intelligent automation', ['powerplatform']]
      ]
    },
    security: {
      label: 'Security',
      description: 'Translate material risk into sustainable cyber maturity, identity, operations and recovery capabilities.',
      capabilities: [
        ['cyber-strategy', 'Cyber strategy & maturity', ['e8', 'ai-govern']],
        ['identity-access', 'Identity & secure access', ['identity', 'sase']],
        ['security-operations', 'Security operations', ['managed-sec']],
        ['resilience-recovery', 'Resilience & recovery', ['cyber-recovery']]
      ]
    },
    'apps-automation': {
      label: 'Apps & Automation',
      description: 'Modernise service platforms and automate repeatable work with clear governance and ownership.',
      capabilities: [
        ['service-platforms', 'Service platforms', ['servicenow']],
        ['low-code', 'Low-code automation', ['powerplatform']],
        ['workflow-operations', 'Workflow operations', ['managed']]
      ]
    },
    'end-user-computing': {
      label: 'End User Computing',
      description: 'Create a secure, supportable device and workspace experience across the full endpoint lifecycle.',
      capabilities: [
        ['device-management', 'Device management', ['endpoint']],
        ['virtual-workspaces', 'Virtual workspaces', ['avd']],
        ['digital-campus', 'Campus & workforce experience', ['digital-campus', 'clinical-collab']]
      ]
    },
    collaboration: {
      label: 'Collaboration',
      description: 'Improve meeting, communication and Copilot experiences while making adoption measurable.',
      capabilities: [
        ['meeting-spaces', 'Meeting spaces', ['rooms']],
        ['copilot-readiness', 'Copilot readiness', ['copilot-ready']],
        ['collaboration-adoption', 'Collaboration adoption', ['copilot-deploy', 'ai-adopt']]
      ]
    },
    networking: {
      label: 'Networking',
      description: 'Connect sites, people and cloud services with consistent security, resilience and operations.',
      capabilities: [
        ['branch-wan', 'Branch & WAN', ['sdwan']],
        ['secure-access', 'Secure access', ['sase']],
        ['campus-sites', 'Campus & sites', ['digital-campus', 'mining-resilience']],
        ['network-operations', 'Network operations', ['managed']]
      ]
    },
    'hybrid-cloud': {
      label: 'Hybrid Cloud',
      description: 'Make cloud foundation, workload change, economics, resilience and operations one coherent pathway.',
      capabilities: [
        ['cloud-foundation', 'Cloud foundation', ['azure-modern', 'sovereign-ai']],
        ['workload-modernisation', 'Workload modernisation', ['data-modern', 'avd']],
        ['cloud-economics', 'Cloud economics', ['finops']],
        ['cloud-operations', 'Cloud operations & recovery', ['managed', 'cyber-recovery']]
      ]
    },
    'lifecycle-services': {
      label: 'Lifecycle Services',
      description: 'Wrap delivered technology in monitoring, support, optimisation and continuous improvement.',
      capabilities: [
        ['managed-operations', 'Managed operations', ['managed', 'managed-sec']],
        ['optimisation', 'Optimisation', ['finops']],
        ['operate-improve', 'Operate & improve', ['endpoint', 'sdwan', 'azure-modern']]
      ]
    }
  };

  const OFFER_BY_ID = new Map(CATALOGUE.map(item => [item.id, item]));
  const tray = document.getElementById('stoneTray');
  const pond = document.getElementById('pond');
  const canvas = document.getElementById('waterCanvas');
  const ctx = canvas.getContext('2d');
  const svg = document.getElementById('linkLayer');
  const nodeLayer = document.getElementById('nodeLayer');
  const rippleLayer = document.getElementById('rippleLayer');
  const centreStone = document.getElementById('centreStone');

  let activeKey = 'data-ai';
  let graph = null;
  let selectedNodeId = null;
  let resizeTimer = null;
  let animationFrame = null;
  let phase = 0;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function renderTray() {
    tray.innerHTML = '';
    Object.entries(PRACTICES).forEach(([key, item]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `stoneChip${key === activeKey && graph ? ' active' : ''}`;
      button.style.setProperty('--stone', LEVEL.practice);
      button.innerHTML = `<i aria-hidden="true"></i><b>${escapeHtml(item.label)}</b><small>Practice</small>`;
      button.addEventListener('click', () => dropStone(key, true));
      tray.appendChild(button);
    });
  }

  function buildGraph(item) {
    const nodes = [];
    const links = [];
    item.capabilities.forEach(([id, label, offerIds]) => {
      nodes.push({
        id,
        label,
        description: `${label} is a key functional capability within the ${item.label} practice.`,
        kind: 'capability',
        ring: 1,
        colour: LEVEL.capability,
        parentId: 'centre'
      });
      links.push({ from: 'centre', to: id });
      offerIds.forEach(offerId => {
        const offer = OFFER_BY_ID.get(offerId);
        if (!offer) return;
        const nodeId = `${id}--${offerId}`;
        nodes.push({
          id: nodeId,
          label: offer.title,
          short: offer.timing,
          kind: 'offering',
          ring: 2,
          colour: LEVEL.offering,
          parentId: id,
          offerId
        });
        links.push({ from: id, to: nodeId });
      });
    });
    return { item, nodes, links };
  }

  function dropStone(key, announce) {
    const item = PRACTICES[key];
    if (!item) return;
    activeKey = key;
    selectedNodeId = null;
    graph = buildGraph(item);
    renderTray();
    centreStone.classList.remove('is-empty');
    centreStone.style.setProperty('--stone', LEVEL.practice);
    centreStone.innerHTML = `<span class="stoneType">Practice</span><b>${escapeHtml(item.label)}</b><small>Tap to replay</small>`;
    document.getElementById('pondStatus').textContent = `${item.label} practice revealed`;
    document.getElementById('pondHint').textContent = `${item.capabilities.length} capabilities connect to ${graph.nodes.filter(node => node.kind === 'offering').length} offerings.`;
    renderGraph();
    replayRipple();
    showOverview();
    if (announce) centreStone.focus({ preventScroll: true });
  }

  function positionsForRing(nodes, radius, offset, centreX, centreY) {
    const count = Math.max(1, nodes.length);
    return nodes.map((node, index) => {
      const angle = offset + (Math.PI * 2 * index / count);
      return { ...node, x: centreX + Math.cos(angle) * radius, y: centreY + Math.sin(angle) * radius };
    });
  }

  function renderGraph() {
    if (!graph) return;
    const rect = pond.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centreX = width / 2;
    const centreY = height / 2;
    const min = Math.min(width, height);
    const isPhone = width < 520;
    const capabilityRadius = min * (isPhone ? .29 : .30);
    const offeringRadius = min * (isPhone ? .47 : .48);
    const positioned = [
      ...positionsForRing(graph.nodes.filter(node => node.kind === 'capability'), capabilityRadius, -Math.PI / 2, centreX, centreY),
      ...positionsForRing(graph.nodes.filter(node => node.kind === 'offering'), offeringRadius, -Math.PI / 2 + .14, centreX, centreY)
    ];
    graph.positioned = positioned;
    const positionMap = new Map(positioned.map(node => [node.id, node]));
    positionMap.set('centre', { id: 'centre', x: centreX, y: centreY });

    nodeLayer.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = graph.links.map(link => {
      const from = positionMap.get(link.from);
      const to = positionMap.get(link.to);
      if (!from || !to) return '';
      const controlX = (from.x + to.x) / 2 + (to.y - from.y) * .045;
      const controlY = (from.y + to.y) / 2 - (to.x - from.x) * .045;
      return `<path class="mapLink" data-link-from="${escapeHtml(link.from)}" data-link-to="${escapeHtml(link.to)}" d="M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}"></path>`;
    }).join('');

    positioned.forEach((node, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mapNode';
      button.dataset.nodeId = node.id;
      button.dataset.kind = node.kind;
      button.style.left = `${node.x}px`;
      button.style.top = `${node.y}px`;
      button.style.setProperty('--node', node.colour);
      button.style.transitionDelay = `${Math.min(index * 26, 320)}ms`;
      button.innerHTML = node.kind === 'offering'
        ? `${escapeHtml(node.label)}<small>${escapeHtml(node.short)}</small>`
        : escapeHtml(node.label);
      button.addEventListener('click', () => selectNode(node.id));
      nodeLayer.appendChild(button);
      requestAnimationFrame(() => button.classList.add('enter'));
    });
    applyHighlight();
  }

  function ancestors(nodeId) {
    const ids = new Set(['centre']);
    let current = graph.positioned.find(node => node.id === nodeId);
    while (current) {
      ids.add(current.id);
      if (current.parentId === 'centre') break;
      current = graph.positioned.find(node => node.id === current.parentId);
    }
    return ids;
  }

  function descendants(nodeId) {
    const ids = new Set([nodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      graph.positioned.forEach(node => {
        if (ids.has(node.parentId) && !ids.has(node.id)) {
          ids.add(node.id);
          changed = true;
        }
      });
    }
    return ids;
  }

  function applyHighlight() {
    const active = selectedNodeId ? new Set([...ancestors(selectedNodeId), ...descendants(selectedNodeId)]) : null;
    nodeLayer.querySelectorAll('.mapNode').forEach(button => {
      const selected = button.dataset.nodeId === selectedNodeId;
      const visible = !active || active.has(button.dataset.nodeId);
      button.classList.toggle('selected', selected);
      button.classList.toggle('highlighted', Boolean(active && visible));
      button.classList.toggle('dimmed', Boolean(active && !visible));
    });
    svg.querySelectorAll('.mapLink').forEach(path => {
      const visible = !active || (active.has(path.dataset.linkFrom) && active.has(path.dataset.linkTo));
      path.classList.toggle('highlighted', Boolean(active && visible));
      path.classList.toggle('dimmed', Boolean(active && !visible));
    });
  }

  function selectNode(nodeId) {
    selectedNodeId = selectedNodeId === nodeId ? null : nodeId;
    applyHighlight();
    if (!selectedNodeId) return showOverview();
    const node = graph.positioned.find(item => item.id === selectedNodeId);
    if (!node) return;
    node.kind === 'offering' ? showOffer(node) : showCapability(node);
  }

  function linkedOffers(nodeId) {
    const ids = descendants(nodeId);
    return graph.positioned.filter(node => node.kind === 'offering' && ids.has(node.id));
  }

  function crumbsFor(node) {
    const chain = [];
    let current = node;
    while (current) {
      chain.unshift(current.label);
      if (current.parentId === 'centre') break;
      current = graph.positioned.find(item => item.id === current.parentId);
    }
    return ['Portfolio', graph.item.label, ...chain];
  }

  function renderCrumbs(items) {
    document.getElementById('pathCrumbs').innerHTML = items.map(item => `<span>${escapeHtml(item)}</span>`).join('');
  }

  function renderConnected(nodes) {
    const list = document.getElementById('connectedList');
    list.innerHTML = nodes.slice(0, 10).map(node => {
      const offer = OFFER_BY_ID.get(node.offerId);
      return `<button type="button" data-connected-offer="${escapeHtml(node.id)}" style="--offer:${LEVEL.offering}">${escapeHtml(offer.title)}<span>›</span></button>`;
    }).join('') || '<span class="emptyConnected">No offering is mapped to this capability yet.</span>';
    list.querySelectorAll('[data-connected-offer]').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.connectedOffer)));
  }

  function showOverview() {
    const item = graph.item;
    document.getElementById('panelKicker').textContent = 'Practice pathway';
    document.getElementById('panelTitle').textContent = `${item.label} is in the pond`;
    document.getElementById('panelLead').textContent = 'Capabilities sit between the practice and the offerings customers buy. Select either level to isolate its lineage.';
    renderCrumbs(['Portfolio', item.label]);
    document.getElementById('insightHeading').textContent = 'What this practice contains';
    document.getElementById('insightBody').textContent = item.description;
    renderConnected(graph.positioned.filter(node => node.kind === 'offering'));
    document.getElementById('offerDetail').hidden = true;
    document.getElementById('connectedSection').hidden = false;
  }

  function showCapability(node) {
    const connections = linkedOffers(node.id);
    document.getElementById('panelKicker').textContent = 'Capability';
    document.getElementById('panelTitle').textContent = node.label;
    document.getElementById('panelLead').textContent = node.description;
    renderCrumbs(crumbsFor(node));
    document.getElementById('insightHeading').textContent = 'Why this level matters';
    document.getElementById('insightBody').textContent = 'A capability is a key functional area within the practice. It groups related offerings without pretending the capability itself is what the customer buys.';
    renderConnected(connections);
    document.getElementById('offerDetail').hidden = true;
    document.getElementById('connectedSection').hidden = false;
  }

  function showOffer(node) {
    const offer = OFFER_BY_ID.get(node.offerId);
    if (!offer) return;
    const parent = graph.positioned.find(item => item.id === node.parentId);
    document.getElementById('panelKicker').textContent = 'Offering';
    document.getElementById('panelTitle').textContent = offer.title;
    document.getElementById('panelLead').textContent = 'This is the customer-buyable level of the portfolio taxonomy.';
    renderCrumbs(crumbsFor(node));
    document.getElementById('connectedSection').hidden = true;
    const detail = document.getElementById('offerDetail');
    detail.hidden = false;
    document.getElementById('offerMeta').textContent = `${offer.type} · ${offer.timing}`;
    document.getElementById('offerTitle').textContent = offer.title;
    document.getElementById('offerTldr').textContent = offer.tldr;
    document.getElementById('offerTags').innerHTML = [...offer.practices, ...offer.lifecycle].slice(0, 6).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
    document.getElementById('offerWhy').textContent = `${offer.title} is mapped to the ${parent ? parent.label : graph.item.label} capability inside the ${graph.item.label} practice.`;
    document.getElementById('offerNext').textContent = offer.actions?.[0] || 'Open the offering and use its discovery prompts.';
  }

  function replayRipple() {
    if (!graph) return;
    rippleLayer.innerHTML = '';
    for (let index = 0; index < 4; index += 1) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.setProperty('--stone', LEVEL.practice);
      rippleLayer.appendChild(ripple);
    }
    window.setTimeout(() => { rippleLayer.innerHTML = ''; }, 2500);
  }

  function resetPond() {
    selectedNodeId = null;
    nodeLayer.innerHTML = '';
    svg.innerHTML = '';
    rippleLayer.innerHTML = '';
    graph = null;
    centreStone.className = 'centreStone is-empty';
    centreStone.removeAttribute('style');
    centreStone.innerHTML = '<span class="stoneType">Practice</span><b>Choose above</b><small>Drop into the pond</small>';
    document.getElementById('pondStatus').textContent = 'Ready to explore';
    document.getElementById('pondHint').textContent = 'Choose a practice above.';
    document.getElementById('panelKicker').textContent = 'Portfolio pathway';
    document.getElementById('panelTitle').textContent = 'Choose a practice';
    document.getElementById('panelLead').textContent = 'A practice becomes the centre; capabilities and customer-buyable offerings ripple out from it.';
    renderCrumbs(['Portfolio']);
    document.getElementById('insightHeading').textContent = 'How to use the Pond';
    document.getElementById('insightBody').textContent = 'Drop a practice, then select any capability or offering to isolate the hierarchy that connects it back to the portfolio.';
    document.getElementById('connectedList').innerHTML = '';
    document.getElementById('offerDetail').hidden = true;
    document.getElementById('connectedSection').hidden = false;
    renderTray();
  }

  function resizeCanvas() {
    const rect = pond.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (graph) renderGraph();
  }

  function drawWater() {
    const width = pond.clientWidth;
    const height = pond.clientHeight;
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * .5, height * .47, 10, width * .5, height * .5, Math.max(width, height) * .65);
    gradient.addColorStop(0, 'rgba(127,92,228,.08)');
    gradient.addColorStop(.38, 'rgba(17,184,245,.045)');
    gradient.addColorStop(1, 'rgba(0,0,20,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 1;
    for (let index = 0; index < 7; index += 1) {
      const radius = 75 + index * 72 + Math.sin(phase + index * .8) * 7;
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, radius * 1.18, radius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${index % 2 ? '162,15,159' : '17,184,245'},${.045 + index * .006})`;
      ctx.stroke();
    }
    phase += .008;
    animationFrame = requestAnimationFrame(drawWater);
  }

  centreStone.addEventListener('click', () => graph ? replayRipple() : dropStone(activeKey, false));
  document.getElementById('replayRipple').addEventListener('click', replayRipple);
  document.getElementById('resetPond').addEventListener('click', resetPond);
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeCanvas, 100);
  });

  renderTray();
  resizeCanvas();
  drawWater();
  resetPond();
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
})();
