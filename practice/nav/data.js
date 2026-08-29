const DATA3_NAV_LEVELS = {
  portfolio: { label: 'Portfolio', colour: '#11B8F5', rgb: '17,184,245' },
  practice: { label: 'Practice', colour: '#7F5CE4', rgb: '127,92,228' },
  capability: { label: 'Capability', colour: '#A20F9F', rgb: '162,15,159' },
  offering: { label: 'Offering', colour: '#D51BD3', rgb: '213,27,211' }
};

const DATA3_RETIRED_TERM_REPLACEMENTS = [
  [/Bespoke/g, 'Project'],
  [/bespoke/g, 'project'],
  [/Advisory/g, 'Consulting'],
  [/advisory/g, 'consulting'],
  [/Lenses/g, 'Capabilities'],
  [/lenses/g, 'capabilities'],
  [/Lens/g, 'Capability'],
  [/lens/g, 'capability']
];

function d3CanonText(value) {
  let text = String(value ?? '');
  DATA3_RETIRED_TERM_REPLACEMENTS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return text;
}

function d3Slug(value) {
  return d3CanonText(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function d3FetchSourceText() {
  try {
    const request = new XMLHttpRequest();
    request.open('GET', '/nav/source-portfolio.psv?v=20260811-7', false);
    request.send(null);
    if (request.status >= 200 && request.status < 300) return request.responseText;
  } catch (error) {}
  return '';
}

function d3Rows(text) {
  return d3CanonText(text).trim().split(/\n/).filter(Boolean).map(line => line.split('|').map(d3CanonText));
}

function buildData3Portfolio() {
  const practiceMap = new Map();
  const capabilityMap = new Map();

  d3Rows(d3FetchSourceText()).forEach(row => {
    const kind = row[0];
    if (kind === 'P') {
      const [, name, meta, layer, delivery] = row;
      practiceMap.set(name, {
        id: 'practice-' + d3Slug(name),
        name,
        meta,
        layer,
        delivery,
        description: meta,
        capabilities: []
      });
      return;
    }

    if (kind === 'C') {
      const [, practiceName, capabilityName] = row;
      const practice = practiceMap.get(practiceName);
      if (!practice) return;
      const capability = {
        id: 'capability-' + d3Slug(practiceName) + '-' + d3Slug(capabilityName),
        name: capabilityName,
        description: capabilityName + ' in ' + practiceName + '.',
        offerings: []
      };
      practice.capabilities.push(capability);
      capabilityMap.set(practiceName + '|' + capabilityName, capability);
      return;
    }

    if (kind === 'O') {
      const [, practiceName, capabilityName, offeringName, vendor] = row;
      const capability = capabilityMap.get(practiceName + '|' + capabilityName);
      if (!capability) return;
      const id = 'offering-' + d3Slug(practiceName) + '-' + d3Slug(capabilityName) + '-' + d3Slug(offeringName) + '-' + capability.offerings.length;
      capability.offerings.push({
        id,
        name: offeringName,
        vendor: vendor || '',
        sourceText: offeringName + (vendor ? ' (' + vendor + ')' : '')
      });
    }
  });

  const practices = [...practiceMap.values()];
  return {
    version: 'source-0.1-2026-08-11',
    name: 'Data#3 technology products and services',
    hierarchy: ['Portfolio', 'Practice', 'Capability', 'Offering'],
    definitions: {
      portfolio: 'What Data#3 does — technology products and services.',
      practice: 'Market-aligned technology domains.',
      capability: 'Key functional areas within a practice.',
      offering: 'What customers buy; includes vendor technology, Data#3 people and process, and one-off or recurring revenue.'
    },
    levels: DATA3_NAV_LEVELS,
    sources: {
      presentation: 'Data3 Portfolio - Practices Capabilities and Offerings 0.1.pptx',
      portfolioWorkbook: 'Data3 Portfolio View - Practices Capabilities and Offerings 0.1.xlsx',
      salesforceWorkbook: 'Salesforce extract.xlsx'
    },
    practices,
    totalCapabilities: practices.reduce((sum, practice) => sum + practice.capabilities.length, 0),
    totalOfferings: practices.reduce((sum, practice) => sum + practice.capabilities.reduce((inner, capability) => inner + capability.offerings.length, 0), 0)
  };
}

const DATA3_PORTFOLIO = buildData3Portfolio();

function d3CommercialType(capability, offering) {
  const text = d3CanonText(capability + ' ' + offering).toLowerCase();
  if (/managed|support|operations|optimisation|finops|service|recovery|backup/.test(text)) return 'Managed';
  if (/consulting|assessment|strategy|roadmap|governance|readiness|envisioning|architecture|business case/.test(text)) return 'Consulting';
  if (/pilot|accelerator|workshop|foundation|change|adoption|rapid|health check/.test(text)) return 'Packaged';
  return 'Project';
}

function d3LifecycleFor(capability, offering) {
  const type = d3CommercialType(capability, offering);
  return type === 'Managed' ? ['Operate'] : type === 'Consulting' ? ['Learn', 'Consult'] : type === 'Packaged' ? ['Consult', 'Adopt'] : ['Implement'];
}

function d3FlattenPortfolio(portfolio) {
  const rows = [];
  (portfolio.practices || []).forEach(practice => (practice.capabilities || []).forEach(capability => (capability.offerings || []).forEach(offering => {
    const commercialType = d3CommercialType(capability.name, offering.name);
    rows.push({
      id: offering.id,
      title: offering.name,
      tldr: capability.name + ' · ' + practice.name,
      summary: capability.description,
      timing: commercialType === 'Managed' ? 'Ongoing service' : 'Current portfolio offering',
      practices: [practice.name],
      industries: ['Government', 'Education', 'Health & Aged Care', 'Mining', 'Financial Services'],
      lifecycle: d3LifecycleFor(capability.name, offering.name),
      audiences: ['Chief Information Officer', 'IT Manager', 'Enterprise Architect'],
      type: commercialType + ' offering',
      owner: practice.name,
      reviewed: 'Source 0.1',
      proof: 'Mapped source offering',
      triggers: [],
      outputs: [capability.name],
      actions: ['Open source mapping', 'View capability path'],
      capability: capability.name,
      capabilityId: capability.id,
      commercialType,
      vendor: offering.vendor,
      sourceText: offering.sourceText,
      practiceLayer: practice.layer,
      practiceMeta: practice.meta
    });
  })));
  return rows;
}

const CATALOGUE = d3FlattenPortfolio(DATA3_PORTFOLIO);
const NAV_TAXONOMY = {
  hierarchy: DATA3_PORTFOLIO.hierarchy,
  levels: DATA3_PORTFOLIO.levels,
  practices: DATA3_PORTFOLIO.practices,
  capabilities: DATA3_PORTFOLIO.practices.flatMap(practice => practice.capabilities.map(capability => ({ ...capability, practiceName: practice.name, practiceId: practice.id }))),
  offeringCount: CATALOGUE.length,
  capabilityFor(offer) { return offer?.capability || ''; }
};

if (typeof TAXONOMY !== 'undefined') {
  if (TAXONOMY.practice) {
    TAXONOMY.practice.hint = 'Source-backed Data#3 portfolio practices';
    TAXONOMY.practice.items = DATA3_PORTFOLIO.practices.map(practice => [practice.name, practice.meta || '', DATA3_NAV_LEVELS.practice.colour]);
  }
  if (TAXONOMY.capability) {
    TAXONOMY.capability.hint = 'Key functional areas within a practice';
    TAXONOMY.capability.items = NAV_TAXONOMY.capabilities.map(capability => [capability.name, capability.practiceName + ' · ' + capability.offerings.length + ' mapped offerings', DATA3_NAV_LEVELS.capability.colour]);
  }
}

window.DATA3_PORTFOLIO = DATA3_PORTFOLIO;
window.NAV_TAXONOMY = NAV_TAXONOMY;
window.CATALOGUE = CATALOGUE;
window.DATA3_CANON_TEXT = d3CanonText;

(() => {
  const ITEMS = [
    ['builder', '/nav', 'Builder'],
    ['pond', '/nav/pond', 'Pond'],
    ['bubbles', '/nav/bubbles', 'Bubbles'],
    ['box', '/nav/box', 'Box'],
    ['account', '/nav/account', 'Account Brief'],
    ['old', '/nav/archive', 'Old']
  ];

  function pageKey() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/nav') return 'builder';
    if (path.startsWith('/nav/pond') || path.startsWith('/nav/wef')) return 'pond';
    if (path.startsWith('/nav/bubbles')) return 'bubbles';
    if (path.startsWith('/nav/box')) return 'box';
    if (path.startsWith('/nav/account')) return 'account';
    if (path.startsWith('/nav/archive')) return 'old';
    return '';
  }

  function ensureStyles() {
    if (document.querySelector('link[href^="/nav/nav-links.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/nav/nav-links.css?v=20260812-1';
    document.head.appendChild(link);
  }

  function makeNav(active) {
    const nav = document.createElement('nav');
    nav.className = 'conceptNav';
    nav.setAttribute('aria-label', 'Navigator concepts');
    nav.innerHTML = ITEMS.map(([key, href, label]) => `<a href="${href}"${key === active ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('') +
      (active === 'pond' ? '<a class="external" href="https://intelligence.weforum.org/topics/a1Gb0000000LFX9EAO" target="_blank" rel="noopener noreferrer">WEF reference</a>' : '');
    return nav;
  }

  function mountNav() {
    if (!location.pathname.startsWith('/nav')) return;
    ensureStyles();
    const active = pageKey();
    const nav = makeNav(active);
    const appHeader = document.querySelector('.appHeader');
    if (appHeader) {
      const actions = appHeader.querySelector('.headerActions') || appHeader;
      actions.querySelectorAll('a').forEach(anchor => anchor.remove());
      actions.querySelector('.conceptNav')?.remove();
      actions.insertBefore(nav, actions.firstChild);
      return;
    }
    const pondHeader = document.querySelector('.pondHeader');
    if (pondHeader) {
      const existing = pondHeader.querySelector('nav');
      if (existing) existing.replaceWith(nav); else pondHeader.appendChild(nav);
      return;
    }
    const bubbleHeader = document.querySelector('.bubbleHeader');
    if (bubbleHeader) {
      const existing = bubbleHeader.querySelector('nav');
      if (existing) existing.replaceWith(nav); else bubbleHeader.appendChild(nav);
      return;
    }
    const boxHeader = document.querySelector('.boxHeader');
    if (boxHeader) {
      const existing = boxHeader.querySelector('nav');
      if (existing) existing.replaceWith(nav); else boxHeader.appendChild(nav);
      return;
    }
    const topHeaders = [...document.querySelectorAll('header.top')];
    const accountHeader = topHeaders.find(header => !header.querySelector('.topin'));
    if (accountHeader) {
      accountHeader.querySelector('.conceptNav')?.remove();
      accountHeader.insertBefore(nav, accountHeader.querySelector('.topActions') || null);
      return;
    }
    const oldHeader = document.querySelector('.top .topin');
    if (oldHeader) {
      oldHeader.querySelector('.conceptNav')?.remove();
      oldHeader.querySelector('.spacer')?.remove();
      oldHeader.insertBefore(nav, oldHeader.querySelector('#tourStart') || null);
    }
  }

  function capabilityBadge(name) {
    return `<span class="canonicalCapability"><b>Capability</b>${d3CanonText(name)}</span>`;
  }

  function norm(value) {
    return d3CanonText(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
  }

  function canonicalPracticeName(value) {
    return d3CanonText(value).replace(/Modern Work/g, 'Collaboration');
  }

  function sourceOfferFor(title, practiceName) {
    const titleKey = norm(title);
    const practiceKey = norm(canonicalPracticeName(practiceName));
    return CATALOGUE.find(offer => norm(offer.title) === titleKey && (!practiceKey || norm(offer.practices[0]) === practiceKey)) ||
      CATALOGUE.find(offer => norm(offer.title) === titleKey) ||
      CATALOGUE.find(offer => titleKey && (norm(offer.title).includes(titleKey) || titleKey.includes(norm(offer.title))));
  }

  function fallbackCapability(practiceName) {
    const practice = DATA3_PORTFOLIO.practices.find(item => norm(item.name) === norm(canonicalPracticeName(practiceName)));
    return practice?.capabilities?.[0]?.name || 'Source mapping needed';
  }

  function decorate() {
    document.querySelectorAll('.resultCard[data-offer-id]').forEach(card => {
      if (card.querySelector('.canonicalCapability')) return;
      const offer = CATALOGUE.find(item => item.id === card.dataset.offerId);
      if (!offer) return;
      const practice = card.querySelector('.resultPractice');
      if (practice) practice.insertAdjacentHTML('afterend', capabilityBadge(offer.capability));
      else card.insertAdjacentHTML('afterbegin', capabilityBadge(offer.capability));
    });

    const trust = document.getElementById('detailTrust');
    const title = document.getElementById('detailTitle')?.textContent?.trim();
    if (trust && title && !trust.querySelector('[data-canonical-capability]')) {
      const offer = CATALOGUE.find(item => item.title === title);
      if (offer) trust.insertAdjacentHTML('afterbegin', `<div class="trustItem" data-canonical-capability><b>Capability</b><span>${d3CanonText(offer.capability)}</span></div>`);
    }

    document.querySelectorAll('#mappedOffers .offer').forEach(card => {
      if (card.querySelector('.canonicalCapability')) return;
      const titleText = card.querySelector('.offerTop b')?.textContent?.trim() || '';
      const practiceText = (card.querySelector('p')?.textContent || '').split('·')[0] || '';
      const offer = sourceOfferFor(titleText, practiceText);
      card.insertAdjacentHTML('afterbegin', capabilityBadge(offer ? offer.capability : fallbackCapability(practiceText)));
    });
  }

  function normalizeAttributes(element) {
    if (!element || element.nodeType !== 1) return;
    ['aria-label', 'title', 'placeholder', 'alt'].forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      const next = d3CanonText(current);
      if (next !== current) element.setAttribute(attribute, next);
    });
  }

  function normalizeVisibleTerms(root = document.body) {
    if (!root) return;
    if (root.nodeType === 3) {
      const next = d3CanonText(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        const element = node.nodeType === 1 ? node : node.parentElement;
        if (!element) return NodeFilter.FILTER_REJECT;
        if (/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/i.test(element.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node = root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11 ? walker.currentNode : null;
    while (node) {
      if (node.nodeType === 1) normalizeAttributes(node);
      if (node.nodeType === 3) {
        const next = d3CanonText(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
      node = walker.nextNode();
    }
  }

  function mount() {
    mountNav();
    decorate();
    normalizeVisibleTerms();
    new MutationObserver(mutations => {
      decorate();
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => normalizeVisibleTerms(node));
        if (mutation.type === 'characterData') normalizeVisibleTerms(mutation.target);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();