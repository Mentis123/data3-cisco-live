/* DOM detail card.

   Deliberately not 3D text: an HTML panel is crisper than any in-scene
   lettering, is selectable and screen-reader accessible, reuses the Navigator's
   existing card styling, and can link straight out to SolCat and Sid. It also
   doubles as the WebXR dom-overlay root on Android. */

const LEVEL_LABEL = { practice: 'Practice', capability: 'Capability', offering: 'Offering' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

export class DetailCard {
  constructor(root, { onClose, onDrill } = {}) {
    this.root = root;
    this.onClose = onClose;
    this.onDrill = onDrill;
    this.root.hidden = true;

    this.root.addEventListener('click', event => {
      const closer = event.target.closest('[data-card-close]');
      if (closer) {
        event.preventDefault();
        this.hide();
        if (this.onClose) this.onClose();
        return;
      }
      const drill = event.target.closest('[data-card-drill]');
      if (drill && this.onDrill) {
        event.preventDefault();
        this.onDrill(drill.getAttribute('data-card-drill'));
      }
    });

    // Stop taps on the card from also registering as an XR select.
    this.root.addEventListener('beforexrselect', event => event.preventDefault());
  }

  show(payload) {
    this.root.innerHTML = this.render(payload);
    this.root.hidden = false;
    this.root.dataset.level = payload.level;
  }

  hide() {
    this.root.hidden = true;
    this.root.innerHTML = '';
  }

  render(payload) {
    const { level, practice, capability, offering } = payload;
    const colour = practice ? practice.colour : '#00AEFF';
    const trail = [practice && practice.name, capability && capability.name]
      .filter(Boolean)
      .map(name => `<span>${escapeHtml(name)}</span>`)
      .join('');

    let title = '';
    let meta = '';
    let body = '';

    if (level === 'offering') {
      title = offering.name;
      meta = offering.vendor ? `Vendor alignment · ${escapeHtml(offering.vendor)}` : 'Data#3 offering';
      body = 'What a customer buys — vendor technology plus Data#3 people and process.';
    } else if (level === 'capability') {
      title = capability.name;
      meta = `${capability.offerings.length} offering${capability.offerings.length === 1 ? '' : 's'}`;
      body = 'A functional area within the practice. Tap an offering to see what it includes.';
    } else {
      title = practice.name;
      meta = `${practice.capabilities.length} capabilities · ${practice.offeringCount} offerings`;
      body = 'A market-aligned technology domain. Tap a capability to bring it forward.';
    }

    return `
      <button class="cardClose" type="button" data-card-close aria-label="Close">×</button>
      <div class="cardKicker" style="color:${colour}">${LEVEL_LABEL[level] || 'Detail'}</div>
      <h2 class="cardTitle">${escapeHtml(title)}</h2>
      <p class="cardMeta">${meta}</p>
      <p class="cardBody">${escapeHtml(body)}</p>
      ${trail ? `<div class="cardTrail">${trail}</div>` : ''}
      <div class="cardActions">
        <a href="/nav/box" data-card-drill="box">Open in Box</a>
        <a href="/solcat">Open SolCat</a>
      </div>
    `;
  }
}
