(() => {
  'use strict';

  const portfolio = window.DATA3_PORTFOLIO;
  const catalogue = Array.isArray(window.CATALOGUE) ? window.CATALOGUE : [];
  if (!portfolio || !Array.isArray(portfolio.practices)) return;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function normal(value) {
    return String(value ?? '').toLowerCase();
  }

  function list(items) {
    return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  const PROFILES = [
    {
      match: /security|cyber|identity|protect|recovery|backup|resilien|essential eight|zero trust|soc|siem|threat/,
      problem: 'Security risk, control maturity and operational response are fragmented across people, platforms and priorities.',
      outcome: 'A clearer security position with agreed priorities, ownership and an evidence-backed path to reduce material risk.',
      whyNow: 'Threat exposure, regulatory expectations and recovery confidence make delay increasingly expensive.',
      triggers: ['We are not sure where the material gaps are.', 'We need to prove our controls or recovery position.', 'Security work is happening, but it is not coordinated.'],
      questions: ['Which services, data or identities matter most to the business?', 'What evidence exists for current controls and recovery capability?', 'Who owns the risk decision, funding and improvement sequence?'],
      outputs: ['Current-state evidence and risk themes', 'Prioritised control or improvement roadmap', 'Clear owners, dependencies and next decisions']
    },
    {
      match: /copilot|generative|agentic|artificial intelligence|\bai\b|machine learning|automation|power platform|workflow/,
      problem: 'The organisation wants AI or automation value but lacks a governed route from ideas to repeatable outcomes.',
      outcome: 'A practical path from priority scenarios through readiness, delivery, adoption and measurable value.',
      whyNow: 'AI and automation demand is moving faster than data, risk, operating-model and adoption readiness.',
      triggers: ['We have many ideas but no agreed starting point.', 'Teams are experimenting without a common governance model.', 'We need to show value before scaling licences or platforms.'],
      questions: ['Which user or customer scenario has the clearest measurable value?', 'What data, identity, security and change constraints could block adoption?', 'How will value, risk and ownership be measured after launch?'],
      outputs: ['Prioritised scenarios and value hypotheses', 'Readiness, governance and delivery plan', 'Adoption measures and scale decision']
    },
    {
      match: /data|analytics|business intelligence|purview|information governance|platform|database|lake|warehouse/,
      problem: 'Data is difficult to trust, govern or reuse consistently across business and technology teams.',
      outcome: 'A governed data foundation that makes priority information easier to discover, protect and use for decisions or AI.',
      whyNow: 'AI, analytics, regulation and platform cost all depend on clearer information ownership and architecture.',
      triggers: ['Different teams report different versions of the truth.', 'We cannot confidently find or classify important information.', 'The current platform is slowing analytics, automation or AI.'],
      questions: ['Which decisions or services depend on this information?', 'Where are ownership, quality, lineage or access breaking down?', 'What should be modernised first without disrupting current delivery?'],
      outputs: ['Priority data domains and ownership model', 'Target architecture and transition sequence', 'Governance, quality and value measures']
    },
    {
      match: /cloud|azure|infrastructure|datacentre|virtual|compute|storage|finops|migration|modernisation/,
      problem: 'Infrastructure choices, cost and operational risk are constraining change or obscuring the best modernisation path.',
      outcome: 'A sequenced platform decision that balances resilience, cost, security and workload needs.',
      whyNow: 'Renewals, technical debt, cyber resilience and cloud economics create a natural decision point.',
      triggers: ['We need to modernise but cannot move everything at once.', 'Cloud cost or platform sprawl is difficult to explain.', 'Resilience and recovery expectations have changed.'],
      questions: ['Which workloads create the most risk, cost or constraint?', 'What landing-zone, identity and operating controls already exist?', 'Which transition can prove value without creating another platform island?'],
      outputs: ['Workload placement and dependency view', 'Target platform and landing-zone decisions', 'Sequenced migration or optimisation roadmap']
    },
    {
      match: /network|sd-wan|sase|lan|wireless|campus|branch|connectivity/,
      problem: 'Connectivity, user experience and security policy are inconsistent across sites, branches or cloud services.',
      outcome: 'A resilient, observable and policy-aligned network experience that supports how the organisation now operates.',
      whyNow: 'Cloud adoption, distributed work and security convergence are exposing limitations in legacy network design.',
      triggers: ['Performance varies by site and nobody can see why.', 'Network and security changes are being planned separately.', 'The current design is hard to operate or scale.'],
      questions: ['Which sites, users or applications experience the greatest impact?', 'What availability, security and operational measures matter most?', 'Which contracts, hardware or architecture decisions constrain the sequence?'],
      outputs: ['Experience and dependency baseline', 'Target network and security architecture', 'Transition, assurance and operating plan']
    },
    {
      match: /endpoint|device|desktop|windows|intune|collaboration|teams|meeting|modern work|euc/,
      problem: 'Employee technology is inconsistent, difficult to manage or not translating into sustained productivity and adoption.',
      outcome: 'A secure, supportable employee experience aligned to real work scenarios and measurable adoption.',
      whyNow: 'Device change, collaboration patterns, AI assistants and security expectations are converging.',
      triggers: ['Users have tools but ways of working have not changed.', 'Device or collaboration experience varies by team or location.', 'Support and security effort keeps increasing.'],
      questions: ['Which employee moments create the most friction or risk?', 'What device, identity, information and support constraints matter?', 'How will adoption and experience be measured after rollout?'],
      outputs: ['Priority employee scenarios', 'Experience, security and management design', 'Deployment, adoption and support plan']
    },
    {
      match: /application|salesforce|service now|servicenow|integration|crm|digital|software|app/,
      problem: 'Processes and applications are fragmented, manual or difficult to evolve around customer and employee needs.',
      outcome: 'A practical application or workflow change that improves service, integration and operational visibility.',
      whyNow: 'Process friction, platform renewal and automation demand are creating pressure for a coherent application roadmap.',
      triggers: ['Teams rely on workarounds and duplicate entry.', 'The platform does not match the operating process.', 'We need to connect systems without creating more complexity.'],
      questions: ['Which customer or employee journey is most affected?', 'Where do hand-offs, data and ownership break down?', 'What should be configured, integrated, automated or retired?'],
      outputs: ['Current journey and pain-point view', 'Target workflow and solution design', 'Delivery backlog, integration and adoption plan']
    },
    {
      match: /managed|support|lifecycle|operate|service desk|optimisation|operations/,
      problem: 'Operational responsibility, service performance and continual improvement are not consistently governed.',
      outcome: 'A transparent service model with clear accountability, measures and an improvement rhythm.',
      whyNow: 'Growing complexity and constrained internal capacity make reactive operations increasingly risky.',
      triggers: ['The team spends too much time keeping the lights on.', 'Service performance is hard to explain or improve.', 'Ownership between internal teams and partners is unclear.'],
      questions: ['Which service outcomes and experience measures matter most?', 'What should remain internal versus be managed with a partner?', 'How will governance, escalation and continual improvement work?'],
      outputs: ['Service scope and responsibility model', 'Measures, governance and escalation design', 'Transition and continual-improvement plan']
    }
  ];

  const DEFAULT_PROFILE = {
    problem: 'The customer needs a clear way to move from a broad need to an owned, deliverable technology outcome.',
    outcome: 'An agreed direction with the right people, evidence, scope and next decision.',
    whyNow: 'The opportunity becomes actionable when the business need, current environment and decision path are made explicit.',
    triggers: ['We know something needs to change but not where to start.', 'Several teams are involved and the path is unclear.', 'We need a credible next step rather than another generic discussion.'],
    questions: ['What outcome matters and who owns it?', 'What is already underway, constrained or committed?', 'What evidence would make the next decision easier?'],
    outputs: ['Agreed problem and success measures', 'Current-state evidence and dependencies', 'Owned next step and decision path']
  };

  function sourcePath(input) {
    if (!input) return null;
    if (input.offering && input.capability && input.practice) return input;
    if (window.DATA3_VIEW_STATE) return window.DATA3_VIEW_STATE.pathFor(input);
    return null;
  }

  function build(input) {
    const path = sourcePath(input);
    if (!path?.practice || !path?.capability || !path?.offering) return null;

    const row = catalogue.find(item => item.id === path.offering.id) || {};
    const profileText = normal(`${path.practice.name} ${path.capability.name} ${path.offering.name}`);
    const profile = PROFILES.find(item => item.match.test(profileText)) || DEFAULT_PROFILE;
    const commercialMotion = row.commercialType || String(row.type || '').replace(/\s+offering$/i, '') || 'Confirm with owner';
    const lifecycle = Array.isArray(row.lifecycle) && row.lifecycle.length ? row.lifecycle : ['Confirm with owner'];
    const vendor = path.offering.vendor || row.vendor || 'Data#3 / source catalogue';

    return {
      ...path,
      row,
      vendor,
      commercialMotion,
      lifecycle,
      sourceRecord: path.offering.sourceText || path.offering.name,
      summary: `${path.offering.name} is a source-listed Offering within ${path.capability.name} in the ${path.practice.name} Practice.`,
      problem: profile.problem,
      outcome: profile.outcome,
      whyNow: profile.whyNow,
      triggers: profile.triggers,
      questions: profile.questions,
      outputs: profile.outputs,
      checks: [
        'Confirm exact scope, inclusions, exclusions and commercial model with the Offering or Capability owner.',
        'Check the account environment, active opportunities, delivery already in flight and relevant customer evidence.',
        'Use approved customer-facing assets and confirm timing, dependencies, proof points and next decision before positioning.'
      ],
      nextAction: `Confirm the sponsor, priority scenario, current-state evidence and success measure, then coordinate through ${path.practice.name} and the ${path.capability.name} owner.`,
      provenance: 'Practice, Capability, Offering and vendor/source alignment are source-backed. The conversation guidance is illustrative enablement content inferred from the taxonomy and must be validated with the owner.',
      sources: [portfolio.sources?.presentation, portfolio.sources?.portfolioWorkbook, portfolio.sources?.salesforceWorkbook].filter(Boolean)
    };
  }

  function viewLinks(state) {
    if (!window.DATA3_VIEW_STATE) return '';
    const views = [
      ['/nav/box', 'Box'], ['/nav/bubbles', 'Bubbles'], ['/nav/pond', 'Pond'],
      ['/nav/world', 'World'], ['/nav/ar', 'AR']
    ];
    return views.map(([path, label]) => `<a href="${escapeHtml(window.DATA3_VIEW_STATE.href(path, state))}">Open in ${label}<span aria-hidden="true">→</span></a>`).join('');
  }

  function render(input, options = {}) {
    const detail = build(input);
    if (!detail) return '';
    const compact = Boolean(options.compact);
    const close = options.closeButton ? '<button class="offeringRecordClose" type="button" data-card-close data-offering-record-close aria-label="Close offering details">×</button>' : '';
    return `${close}<article class="offeringRecord${compact ? ' is-compact' : ''}" data-offering-record="${escapeHtml(detail.offering.id)}">
      <header class="offeringRecordHero">
        <div class="offeringRecordKicker">Offering</div>
        <h2>${escapeHtml(detail.offering.name)}</h2>
        <p>${escapeHtml(detail.summary)}</p>
        <div class="offeringRecordFacts">
          <span><b>Practice</b>${escapeHtml(detail.practice.name)}</span>
          <span><b>Capability</b>${escapeHtml(detail.capability.name)}</span>
          <span><b>Vendor / source</b>${escapeHtml(detail.vendor)}</span>
          <span><b>Commercial motion</b>${escapeHtml(detail.commercialMotion)} <em>inferred</em></span>
          <span><b>Lifecycle</b>${escapeHtml(detail.lifecycle.join(' → '))} <em>inferred</em></span>
          <span><b>Source record</b>${escapeHtml(detail.sourceRecord)}</span>
        </div>
        <div class="offeringRecordDisclosure"><b>What is canonical here</b><span>Practice, Capability, Offering and vendor/source are from the uploaded portfolio sources. The enablement guidance below is illustrative and should be validated with the owner.</span></div>
      </header>
      <div class="offeringRecordGrid">
        <section><h3>Customer problem</h3><p>${escapeHtml(detail.problem)}</p></section>
        <section><h3>Customer outcome</h3><p>${escapeHtml(detail.outcome)}</p></section>
        <section><h3>Why now</h3><p>${escapeHtml(detail.whyNow)}</p></section>
        <details${compact ? '' : ' open'}><summary>What you may hear</summary>${list(detail.triggers)}</details>
        <details${compact ? '' : ' open'}><summary>Qualification questions</summary>${list(detail.questions)}</details>
        <details${compact ? '' : ' open'}><summary>Likely outputs</summary>${list(detail.outputs)}</details>
        <details><summary>Confirm before positioning</summary>${list(detail.checks)}</details>
        <section class="offeringRecordNext"><h3>Recommended next move</h3><p>${escapeHtml(detail.nextAction)}</p></section>
        <section class="offeringRecordTrust"><h3>Trust and provenance</h3><p>${escapeHtml(detail.provenance)}</p><small>${escapeHtml(detail.sources.join(' · '))}</small></section>
      </div>
      <footer class="offeringRecordActions">${viewLinks(detail.state)}<a href="/solcat">Open SolCat<span aria-hidden="true">→</span></a></footer>
    </article>`;
  }

  function mount(container, input, options = {}) {
    if (!container) return null;
    const detail = build(input);
    if (!detail) {
      container.innerHTML = '';
      container.hidden = true;
      return null;
    }
    container.innerHTML = render(detail, options);
    container.hidden = false;
    window.DATA3_VIEW_STATE?.decorateLinks(container);
    return detail;
  }

  window.DATA3_OFFERING_DETAIL = { build, render, mount };
})();
