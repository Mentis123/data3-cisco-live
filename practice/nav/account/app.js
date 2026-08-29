(() => {
  const DATA = window.ACCOUNT_BRIEF_DATA;
  if (!DATA || !Array.isArray(DATA.accounts)) return;

  const accountSelect = document.getElementById('accountSelect');
  const topicSelect = document.getElementById('topicSelect');
  const brief = document.getElementById('brief');
  const detailBackdrop = document.getElementById('detailBackdrop');
  const detailPanel = document.getElementById('detailPanel');
  const prepBackdrop = document.getElementById('prepBackdrop');
  const prepStudio = document.getElementById('prepStudio');
  let activeAccount = null;
  let activeTopic = null;
  let activeTopicName = '';
  let lastFocus = null;
  let toastTimer = null;
  let prepTimers = [];
  let activeDeckSlide = 0;

  const SOURCE_LABELS = {
    salesforce: 'Salesforce',
    sharepoint: 'SharePoint',
    solcat: 'SolCat',
    sid: 'Sid'
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  function practiceColour(name) {
    return DATA.practices[name] || '#00AEFF';
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function accountById(id) {
    return DATA.accounts.find(account => account.id === id) || DATA.accounts[0];
  }

  function populateAccounts() {
    accountSelect.innerHTML = DATA.accounts.map(account => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)}</option>`).join('');
    accountSelect.value = DATA.accounts[0].id;
    populateTopics();
  }

  function populateTopics(preferred) {
    const account = accountById(accountSelect.value);
    const topics = Object.keys(account.topics || {});
    topicSelect.innerHTML = topics.map(topic => `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join('');
    topicSelect.value = topics.includes(preferred) ? preferred : (topics.includes(account.defaultTopic) ? account.defaultTopic : topics[0]);
  }

  function renderSources(account) {
    const entries = Object.entries(account.sourceCounts || {});
    document.getElementById('sourceBadges').innerHTML = entries.map(([key, count]) => `<span class="sourceBadge"><b>${escapeHtml(SOURCE_LABELS[key] || key)}</b> · ${count} records</span>`).join('');
    document.getElementById('sourceCoverage').innerHTML = entries.map(([key, count]) => `<div class="sourceCoverageRow"><span>${escapeHtml(SOURCE_LABELS[key] || key)}</span><b>${count} matched</b></div>`).join('');
  }

  function renderMetrics(account) {
    const rows = [
      [account.metrics.activeEngagements, 'active or recent engagements'],
      [account.metrics.accountActivities, 'account signals in 12 months'],
      [account.metrics.knownContacts, 'known customer stakeholders'],
      [account.metrics.internalPeople, 'internal people to coordinate']
    ];
    document.getElementById('metricStrip').innerHTML = rows.map(([value, label]) => `<div class="metric"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`).join('');
  }

  function renderCollision(account, topicName, topic) {
    const collision = account.activeWork.find(item => item.alert) || account.activeWork[0];
    document.getElementById('alertTitle').textContent = `Coordinate the ${topicName} story before positioning.`;
    document.getElementById('alertCopy').textContent = `${topic.watchout} ${collision.practice} is already delivering ${collision.title}; speak with ${collision.owner.split(' · ')[0]} before the customer conversation.`;
  }

  function renderConversationMoves(account, topicName, topic) {
    const accent = practiceColour(topicName);
    document.getElementById('conversationList').innerHTML = topic.starters.slice(0, 5).map((move, index) => `
      <button class="conversationCard" type="button" data-move-index="${index}" style="--accent:${accent}" aria-label="Open conversation move ${index + 1}: ${escapeHtml(move.title)}">
        <span class="moveNumber">${index + 1}</span>
        <span class="moveCopy"><b>${escapeHtml(move.title)}</b><span>${escapeHtml(move.whyNow)}</span></span>
        <span class="moveMeta"><b>${escapeHtml(move.confidence)}</b><span>${escapeHtml(move.mappings[0])}</span></span>
        <span class="arrow" aria-hidden="true">›</span>
      </button>`).join('');

    document.querySelectorAll('[data-move-index]').forEach(button => {
      button.addEventListener('click', () => openMove(Number(button.dataset.moveIndex), button));
    });
  }

  function renderActiveWork(account) {
    document.getElementById('activeWork').innerHTML = account.activeWork.map(item => `
      <article class="workCard${item.alert ? ' alert' : ''}" style="--accent:${practiceColour(item.practice)}">
        <div class="workTop"><span>${escapeHtml(item.practice)} · ${escapeHtml(item.status)}</span><b>${escapeHtml(item.timing)}</b></div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.detail)}</p>
        <div class="workOwner">${escapeHtml(item.owner)}</div>
        <div class="workSource">Source: ${escapeHtml(item.source)}</div>
      </article>`).join('');
  }

  function renderTimeline(account) {
    document.getElementById('timeline').innerHTML = account.timeline.map(item => `
      <article class="timelineItem">
        <div class="timelineDate">${escapeHtml(item.date)}</div>
        <div class="timelineDot" aria-hidden="true"></div>
        <div class="timelineBody"><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.detail)}</p><span>Source: ${escapeHtml(item.source)}</span></div>
      </article>`).join('');
  }

  function personMarkup(person, internal) {
    return `<div class="person"><span class="avatar">${escapeHtml(initials(person.name))}</span><span class="personCopy"><b>${escapeHtml(person.name)}</b><span>${escapeHtml(person.role)}</span><span>${escapeHtml(internal ? person.reason : `${person.signal} · Relationship: ${person.relationship}`)}</span>${internal ? `<span class="status">${escapeHtml(person.status)}</span>` : ''}</span></div>`;
  }

  function renderPeople(account) {
    document.getElementById('internalCount').textContent = account.internalPeople.length;
    document.getElementById('customerCount').textContent = account.customerPeople.length;
    document.getElementById('internalPeople').innerHTML = account.internalPeople.map(person => personMarkup(person, true)).join('');
    document.getElementById('customerPeople').innerHTML = account.customerPeople.map(person => personMarkup(person, false)).join('');
  }

  function renderOffers(topic) {
    document.getElementById('mappedOffers').innerHTML = topic.offers.slice(0, 4).map(offer => `
      <article class="offer" style="--accent:${practiceColour(offer.practice)}">
        <div class="offerTop"><b>${escapeHtml(offer.title)}</b><span>${escapeHtml(offer.fit)}</span></div>
        <p>${escapeHtml(offer.practice)} · ${escapeHtml(offer.reason)}</p>
      </article>`).join('');
  }

  function renderBrief(account, topicName) {
    const topic = account.topics[topicName];
    activeAccount = account;
    activeTopic = topic;
    activeTopicName = topicName;

    document.getElementById('briefEyebrow').textContent = `${account.industry} · ${account.segment} account · ${topicName}`;
    document.getElementById('briefTitle').textContent = `${account.name}: ${topicName} conversation brief`;
    document.getElementById('briefSummary').textContent = topic.headline;
    document.getElementById('freshness').textContent = `Account memory refreshed ${account.lastSynced}`;

    renderSources(account);
    renderMetrics(account);
    renderCollision(account, topicName, topic);
    renderConversationMoves(account, topicName, topic);
    renderActiveWork(account);
    renderTimeline(account);
    renderPeople(account);
    renderOffers(topic);

    brief.hidden = false;
    document.body.classList.add('briefReady');
    requestAnimationFrame(() => brief.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    showToast(`Built from ${Object.values(account.sourceCounts).reduce((sum, count) => sum + count, 0)} synthetic account records`);
  }

  function buildBrief() {
    const account = accountById(accountSelect.value);
    const topicName = topicSelect.value;
    if (!account.topics[topicName]) return;
    renderBrief(account, topicName);
    history.replaceState(null, '', `#${account.id}-${topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  }

  function openMove(index, trigger) {
    const move = activeTopic && activeTopic.starters[index];
    if (!move) return;
    lastFocus = trigger || document.activeElement;
    document.getElementById('detailStep').textContent = `Conversation move ${index + 1} of 5`;
    document.getElementById('detailTitle').textContent = move.title;
    document.getElementById('detailTalkTrack').textContent = move.talkTrack;
    document.getElementById('detailWhy').textContent = move.whyNow;
    document.getElementById('detailEvidence').textContent = move.evidence;
    document.getElementById('detailBefore').textContent = move.beforeMeeting;
    document.getElementById('detailConfidence').textContent = `${move.confidence} · based on the named synthetic account records`;
    document.getElementById('detailMappings').innerHTML = `<div class="mappingTags">${move.mappings.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
    document.getElementById('detailSources').innerHTML = `<div class="mappingTags">${move.sources.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
    detailBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      detailBackdrop.classList.add('open');
      detailPanel.focus({ preventScroll: true });
    });
  }

  function closeMove() {
    if (detailBackdrop.hidden) return;
    detailBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      detailBackdrop.hidden = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }, 220);
  }

  function runSharedServicesScenario() {
    accountSelect.value = 'qssa';
    populateTopics('Data & AI');
    topicSelect.value = 'Data & AI';
    buildBrief();
  }

  function stripQuotes(value) {
    return String(value || '').replace(/^[“\"]|[”\"]$/g, '');
  }

  function prepModel(account, topicName, topic) {
    if (topic.prepPack) return topic.prepPack;
    return {
      theme: topic.headline,
      meetingIntent: `Use the account evidence to test the next ${topicName} decision without duplicating work already in flight.`,
      problem: topic.starters[0]?.whyNow || 'The account record contains unresolved decisions that need customer validation.',
      impact: topic.starters[1]?.whyNow || 'Without alignment, teams risk fragmented decisions and repeated discovery.',
      whyNow: topic.starters[2]?.whyNow || 'Existing account activity creates a practical decision point.',
      outcome: `A shared view of the priority ${topicName} decisions, owners, and evidence needed for the next move.`,
      approach: 'Lead with account evidence, test the operating decision, and only then connect the conversation to relevant offers.',
      ask: 'Agree the customer and internal owners for a focused follow-up that validates the highest-confidence opportunity.',
      opener: stripQuotes(topic.starters[0]?.talkTrack || topic.headline),
      annuity: {
        recommendation: 'Committed Capacity',
        label: 'The engine',
        rationale: 'Use a governed backlog and recurring multidisciplinary sprints when demand is sustained across practices.',
        condition: 'Validate sustained demand, sponsorship, backlog ownership, and cadence first.',
        alternatives: [
          { name: 'Entitled Drawdown', fit: 'On-ramp', reason: 'For episodic assessments, assurance, and minor uplift.' },
          { name: 'Standing Service', fit: 'Later', reason: 'For always-on operation of a live estate.' }
        ]
      },
      internalPrep: account.internalPeople.slice(0, 3).map(person => `${person.name}: ${person.reason}`),
      watchouts: [topic.watchout]
    };
  }

  function escapeSvg(value) {
    return String(value ?? '').replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
  }

  function wrapWords(value, maxChars) {
    const words = String(value || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function svgText(value, x, y, maxChars, fontSize, lineHeight, options = {}) {
    const lines = wrapWords(value, maxChars).slice(0, options.maxLines || 20);
    const attrs = [
      `x="${x}"`, `y="${y}"`, `font-size="${fontSize}"`,
      `font-weight="${options.weight || 500}"`, `fill="${options.fill || '#EEEEEE'}"`,
      `font-family="Helvetica Neue, Arial, sans-serif"`
    ];
    if (options.letterSpacing) attrs.push(`letter-spacing="${options.letterSpacing}"`);
    return `<text ${attrs.join(' ')}>${lines.map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeSvg(line)}</tspan>`).join('')}</text>`;
  }

  function buildPhoneSvg(account, topicName, topic) {
    const prep = prepModel(account, topicName, topic);
    const moves = topic.starters.slice(0, 3);
    const totalRecords = Object.values(account.sourceCounts).reduce((sum, count) => sum + count, 0);
    const accent = practiceColour(topicName);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="${escapeSvg(account.name)} ${escapeSvg(topicName)} prep pack">
      <defs>
        <radialGradient id="glow" cx="84%" cy="4%" r="72%"><stop offset="0" stop-color="${accent}" stop-opacity=".28"/><stop offset=".56" stop-color="#000025" stop-opacity="0"/></radialGradient>
        <linearGradient id="rail" x1="0" x2="1"><stop stop-color="#00AEFF"/><stop offset="1" stop-color="${accent}"/></linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="#000025"/><rect width="1080" height="1920" fill="url(#glow)"/>
      <rect x="54" y="48" width="972" height="1824" rx="38" fill="none" stroke="#78DCFF" stroke-opacity=".22"/>
      <text x="82" y="105" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">Data<tspan dy="-12" font-size="19" fill="#00AEFF">#</tspan><tspan dy="12">3</tspan> Navigator</text>
      <text x="998" y="105" text-anchor="end" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="800" fill="#78DCFF" letter-spacing="2">POCKET PREP</text>
      <line x1="82" y1="137" x2="998" y2="137" stroke="#FFFFFF" stroke-opacity=".13"/>
      <text x="82" y="190" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" font-weight="900" fill="#9B9BFF" letter-spacing="3">${escapeSvg(topicName.toUpperCase())} · CUSTOMER CONVERSATION</text>
      ${svgText(account.name, 82, 248, 28, 42, 48, { weight: 800, fill: '#FFFFFF', maxLines: 2 })}
      ${svgText(prep.theme, 82, 360, 26, 58, 62, { weight: 900, fill: accent, maxLines: 2 })}
      ${svgText(prep.meetingIntent, 82, 505, 58, 27, 38, { weight: 500, fill: '#DCEAF2', maxLines: 3 })}
      <rect x="82" y="610" width="916" height="112" rx="22" fill="${accent}" fill-opacity=".09" stroke="${accent}" stroke-opacity=".45"/>
      <text x="115" y="651" font-family="Helvetica Neue, Arial, sans-serif" font-size="17" font-weight="900" fill="#78DCFF" letter-spacing="2">RECOMMENDED ANNUITY · ${escapeSvg(prep.annuity.label.toUpperCase())}</text>
      <text x="115" y="693" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF">${escapeSvg(prep.annuity.recommendation.toUpperCase())}</text>
      ${svgText(prep.annuity.rationale, 600, 650, 33, 17, 24, { weight: 600, fill: '#DCEAF2', maxLines: 3 })}
      <text x="82" y="770" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="900" fill="#78DCFF" letter-spacing="3">CARRY THESE THREE DECISIONS IN</text>
      ${moves.map((move, index) => {
        const y = 826 + (index * 178);
        return `<text x="82" y="${y}" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" font-weight="900" fill="${accent}">0${index + 1}</text>
          ${svgText(move.title, 142, y, 46, 30, 35, { weight: 800, fill: '#FFFFFF', maxLines: 2 })}
          ${svgText(move.evidence, 142, y + 76, 67, 21, 29, { weight: 500, fill: '#AFC5D4', maxLines: 2 })}`;
      }).join('')}
      <rect x="82" y="1372" width="916" height="236" rx="24" fill="#9B9BFF" fill-opacity=".1" stroke="#9B9BFF" stroke-opacity=".45"/>
      <text x="115" y="1420" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="900" fill="#9B9BFF" letter-spacing="3">OPEN WITH THIS</text>
      ${svgText(stripQuotes(prep.opener), 115, 1481, 52, 29, 39, { weight: 700, fill: '#FFFFFF', maxLines: 3 })}
      <text x="82" y="1670" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="900" fill="#78DCFF" letter-spacing="3">THE ASK</text>
      ${svgText(prep.ask, 82, 1718, 65, 24, 34, { weight: 600, fill: '#DCEAF2', maxLines: 3 })}
      <rect x="82" y="1823" width="916" height="5" rx="3" fill="url(#rail)"/>
      <text x="82" y="1862" font-family="Helvetica Neue, Arial, sans-serif" font-size="16" font-weight="700" fill="#7F98AB">${totalRecords} RECORDS · SOURCE-LINKED · REFRESHED ${escapeSvg(account.lastSynced.toUpperCase())}</text>
      <text x="998" y="1862" text-anchor="end" font-family="Helvetica Neue, Arial, sans-serif" font-size="16" font-weight="700" fill="#7F98AB">DELIVERING THE DIGITAL FUTURE</text>
    </svg>`;
  }

  function svgDataUrl(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function buildDeckSlides(account, topicName, topic) {
    const prep = prepModel(account, topicName, topic);
    const brand = '<span class="slideBrand">Data<sup>#</sup>3</span>';
    const number = value => `<span class="slideNum">0${value} / 05</span>`;
    return [
      `${brand}${number(1)}<div class="slideEyebrow">${escapeHtml(account.name)} · ${escapeHtml(topicName)}</div><h4>${escapeHtml(prep.theme)}</h4><p class="slideLead">${escapeHtml(prep.meetingIntent)}</p>`,
      `${brand}${number(2)}<div class="slideEyebrow">Problem · impact · why now</div><h4>The shared-services mandate is outpacing the <em>decision model.</em></h4><div class="slideColumns"><div><b>Problem</b><p>${escapeHtml(prep.problem)}</p></div><div><b>Impact</b><p>${escapeHtml(prep.impact)}</p></div><div><b>Why now</b><p>${escapeHtml(prep.whyNow)}</p></div></div>`,
      `${brand}${number(3)}<div class="slideEyebrow">Desired outcome</div><div class="quote">${escapeHtml(prep.outcome)}</div><p class="slideLead">One common foundation. Agency-level extension. Evidence before platform.</p>`,
      `${brand}${number(4)}<div class="slideEyebrow">Approach · supporting detail</div><h4>Govern once. <em>Reuse many times.</em></h4><div class="slideColumns"><div><b>01 · Ownership</b><p>Define what is central, what stays with agencies, and who decides.</p></div><div><b>02 · Value</b><p>Test two reusable AI hypotheses against shared-service outcomes.</p></div><div><b>03 · Trust</b><p>Map the data, controls, and evidence required before choosing the path.</p></div></div>`,
      `${brand}${number(5)}<div class="slideEyebrow">Recommendation · the ask</div><h4>Position <em>${escapeHtml(prep.annuity.recommendation)}</em>—then validate the conditions.</h4><p class="slideLead">${escapeHtml(prep.annuity.rationale)}</p><div class="slideColumns"><div><b>Recommended</b><p>A governed backlog and recurring multidisciplinary sprints.</p></div><div><b>${escapeHtml(prep.annuity.alternatives[0].fit)}</b><p>${escapeHtml(prep.annuity.alternatives[0].name)} if demand remains episodic.</p></div><div><b>${escapeHtml(prep.annuity.alternatives[1].fit)}</b><p>${escapeHtml(prep.annuity.alternatives[1].name)} once a live estate needs always-on operation.</p></div></div><p class="slideAsk">Ask: ${escapeHtml(prep.ask)}</p>`
    ];
  }

  function selectDeckSlide(index) {
    const slides = [...document.querySelectorAll('.deckSlide')];
    const thumbs = [...document.querySelectorAll('.deckThumb')];
    if (!slides.length) return;
    activeDeckSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === activeDeckSlide));
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === activeDeckSlide);
      thumb.setAttribute('aria-current', i === activeDeckSlide ? 'true' : 'false');
    });
    document.getElementById('presentDeck').textContent = activeDeckSlide === slides.length - 1 ? 'Back to first slide' : 'Next slide';
  }

  function renderPrepAssets() {
    const account = activeAccount;
    const topic = activeTopic;
    const topicName = activeTopicName;
    if (!account || !topic) return;
    const svg = buildPhoneSvg(account, topicName, topic);
    const phone = document.getElementById('prepPhoneImage');
    phone.src = svgDataUrl(svg);
    phone.dataset.svg = svg;
    document.getElementById('annuityBadge').textContent = `✓ ${prepModel(account, topicName, topic).annuity.recommendation}`;
    document.getElementById('prepSubtitle').textContent = `${account.name} · ${topicName} · generated from ${Object.values(account.sourceCounts).reduce((sum, count) => sum + count, 0)} synthetic records`;

    const slides = buildDeckSlides(account, topicName, topic);
    document.getElementById('deckViewport').innerHTML = slides.map((slide, index) => `<article class="deckSlide${index === 0 ? ' active' : ''}" data-slide="${index}">${slide}</article>`).join('');
    document.getElementById('deckRail').innerHTML = slides.map((_, index) => `<button class="deckThumb${index === 0 ? ' active' : ''}" type="button" data-slide-thumb="${index}" aria-label="Show slide ${index + 1}"><span>0${index + 1}</span></button>`).join('');
    document.querySelectorAll('[data-slide-thumb]').forEach(button => button.addEventListener('click', () => selectDeckSlide(Number(button.dataset.slideThumb))));
    selectDeckSlide(0);
    const downloadDeck = document.getElementById('downloadDeck');
    const isExample = account.id === 'qssa' && topicName === 'Data & AI';
    downloadDeck.textContent = isExample ? 'Download editable deck (.pptx)' : 'Download QSSA example deck (.pptx)';
  }

  function switchArtifact(kind) {
    const phoneActive = kind === 'phone';
    const phoneTab = document.getElementById('phoneTab');
    const deckTab = document.getElementById('deckTab');
    phoneTab.classList.toggle('active', phoneActive);
    deckTab.classList.toggle('active', !phoneActive);
    phoneTab.setAttribute('aria-selected', String(phoneActive));
    deckTab.setAttribute('aria-selected', String(!phoneActive));
    document.getElementById('phoneArtifact').hidden = !phoneActive;
    document.getElementById('deckArtifact').hidden = phoneActive;
  }

  function openPrepPack() {
    if (!activeAccount || !activeTopic) buildBrief();
    lastFocus = document.activeElement;
    prepTimers.forEach(timer => window.clearTimeout(timer));
    prepTimers = [];
    switchArtifact('phone');
    document.getElementById('prepGenerating').hidden = false;
    document.getElementById('prepResult').hidden = true;
    document.getElementById('generationProgress').style.width = '8%';
    document.getElementById('generationStatus').textContent = 'Reading the permitted account memory…';
    prepBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      prepBackdrop.classList.add('open');
      prepStudio.focus({ preventScroll: true });
    });
    renderPrepAssets();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stages = [
      [reduced ? 40 : 420, 'Resolving work already in flight and people to coordinate…', '35%'],
      [reduced ? 80 : 880, 'Structuring the conversation with the canonical messaging framework…', '68%'],
      [reduced ? 120 : 1320, 'Rendering the phone brief and five-slide deck…', '92%']
    ];
    stages.forEach(([delay, message, progress]) => prepTimers.push(window.setTimeout(() => {
      document.getElementById('generationStatus').textContent = message;
      document.getElementById('generationProgress').style.width = progress;
    }, delay)));
    prepTimers.push(window.setTimeout(() => {
      document.getElementById('generationProgress').style.width = '100%';
      document.getElementById('prepGenerating').hidden = true;
      document.getElementById('prepResult').hidden = false;
    }, reduced ? 180 : 1750));
  }

  function closePrepPack() {
    if (prepBackdrop.hidden) return;
    prepTimers.forEach(timer => window.clearTimeout(timer));
    prepBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      prepBackdrop.hidden = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }, 220);
  }

  function downloadPhoneBrief() {
    const svg = document.getElementById('prepPhoneImage').dataset.svg;
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(png => {
        if (!png) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(png);
        link.download = `${activeAccount.id}-${activeTopicName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-phone-prep.png`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        showToast('Phone brief downloaded · 1080 × 1920 PNG');
      }, 'image/png');
    };
    image.src = url;
  }

  async function copyMeetingOpener() {
    const opener = prepModel(activeAccount, activeTopicName, activeTopic).opener;
    try {
      await navigator.clipboard.writeText(stripQuotes(opener));
      showToast('Meeting opener copied');
    } catch (_) {
      showToast(stripQuotes(opener));
    }
  }

  accountSelect.addEventListener('change', () => populateTopics());
  document.getElementById('buildBrief').addEventListener('click', buildBrief);
  document.getElementById('demoScenario').addEventListener('click', runSharedServicesScenario);
  document.getElementById('createPrepPack').addEventListener('click', openPrepPack);
  document.getElementById('changeBrief').addEventListener('click', () => {
    document.getElementById('setup').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => accountSelect.focus({ preventScroll: true }), 380);
  });
  document.getElementById('alertAction').addEventListener('click', () => document.getElementById('activeWorkSection').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.getElementById('detailClose').addEventListener('click', closeMove);
  document.getElementById('prepClose').addEventListener('click', closePrepPack);
  document.getElementById('phoneTab').addEventListener('click', () => switchArtifact('phone'));
  document.getElementById('deckTab').addEventListener('click', () => switchArtifact('deck'));
  document.getElementById('downloadPhone').addEventListener('click', downloadPhoneBrief);
  document.getElementById('copyBrief').addEventListener('click', copyMeetingOpener);
  document.getElementById('presentDeck').addEventListener('click', () => selectDeckSlide(activeDeckSlide + 1));
  detailBackdrop.addEventListener('click', event => {
    if (event.target === detailBackdrop) closeMove();
  });
  prepBackdrop.addEventListener('click', event => {
    if (event.target === prepBackdrop) closePrepPack();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !prepBackdrop.hidden) closePrepPack();
    else if (event.key === 'Escape' && !detailBackdrop.hidden) closeMove();
    else if (!prepBackdrop.hidden && !document.getElementById('deckArtifact').hidden && event.key === 'ArrowRight') selectDeckSlide(activeDeckSlide + 1);
    else if (!prepBackdrop.hidden && !document.getElementById('deckArtifact').hidden && event.key === 'ArrowLeft') selectDeckSlide(activeDeckSlide - 1);
  });
  document.querySelectorAll('[data-demo-action]').forEach(button => {
    button.addEventListener('click', () => showToast(`${button.dataset.demoAction} · synthetic prototype action`));
  });

  populateAccounts();

  const hash = location.hash.replace(/^#/, '');
  if (hash.startsWith('qssa-data-ai') || hash.startsWith('qssa-security')) {
    runSharedServicesScenario();
  }
})();
