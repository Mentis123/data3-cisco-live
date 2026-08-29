(() => {
  if (typeof render !== 'function' || typeof filteredOffers !== 'function' || typeof resultCard !== 'function') return;

  let showAll = false;
  let userBuilt = false;
  let demoOnly = false;
  const results = document.getElementById('results');
  const grid = document.getElementById('resultGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('resultCount');
  if (!results || !grid || !empty || !count) return;

  const progress = document.createElement('div');
  progress.className = 'resultProgress';
  const showMore = document.createElement('button');
  showMore.type = 'button';
  showMore.className = 'showMoreResults';
  progress.appendChild(showMore);
  grid.after(progress);

  render = function progressiveRender() {
    updateCurrentView();
    const rows = filteredOffers();
    const visible = showAll ? rows : rows.slice(0, 5);
    const ready = document.body.classList.contains('resultsReady');

    count.textContent = rows.length <= 5
      ? `${rows.length} ${rows.length === 1 ? 'starting point' : 'starting points'}`
      : `${visible.length} of ${rows.length} starting points`;

    grid.innerHTML = visible.map(resultCard).join('');
    empty.hidden = rows.length !== 0;
    grid.hidden = rows.length === 0;
    progress.hidden = !ready || rows.length <= 5 || rows.length === 0;
    showMore.textContent = showAll ? 'Show only the top 5' : `Show all ${rows.length}`;

    grid.querySelectorAll('[data-offer-id]').forEach(button => {
      button.addEventListener('click', () => openDrawer(button.dataset.offerId));
    });
  };

  function revealResults(options = {}) {
    if (options.user) userBuilt = true;
    if (options.demo) demoOnly = true;
    showAll = false;
    document.body.classList.add('resultsReady');
    render();
    if (options.scroll !== false) {
      window.setTimeout(() => scrollToTarget(results, false), 70);
    }
  }

  function relockAfterDemo() {
    window.setTimeout(() => {
      const tour = document.getElementById('tour');
      if (!demoOnly || userBuilt || (tour && !tour.hidden)) return;
      document.body.classList.remove('resultsReady');
      showAll = false;
      demoOnly = false;
      render();
    }, 700);
  }

  showMore.addEventListener('click', () => {
    showAll = !showAll;
    render();
    if (!showAll) scrollToTarget(results, false);
  });

  document.querySelector('.buildViewCta')?.addEventListener('click', () => revealResults({ user: true }));
  document.querySelectorAll('.sample[data-persona][data-mission]').forEach(button => {
    button.addEventListener('click', () => revealResults({ user: true }));
  });

  const tourStart = document.getElementById('tourStart');
  const tourExit = document.getElementById('tourExit');
  const tourNext = document.getElementById('tourNext');
  tourStart?.addEventListener('click', () => {
    if (!document.body.classList.contains('resultsReady')) revealResults({ demo: true, scroll: false });
  });
  tourExit?.addEventListener('click', relockAfterDemo);
  tourNext?.addEventListener('click', relockAfterDemo);

  document.body.classList.remove('resultsReady');
  render();
})();
