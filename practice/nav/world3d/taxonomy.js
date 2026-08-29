/* Data#3 Navigator — taxonomy adapter for the 3D and AR views.
   Reads the same window.DATA3_PORTFOLIO that Box, Pond and Bubbles consume
   (built by /nav/data.js from /nav/source-portfolio.psv) and decorates it with
   the per-practice brand palette used across the Navigator. */

const PRACTICE_STYLES = [
  // 'Business Consulting' is the canonical rendering of 'Business Advisory'
  // once /nav/data.js applies the retired-terminology replacements.
  { keys: ['business advisory', 'business consulting'], colour: '#DAFF00', shape: 'beacon' },
  { keys: ['data ai', 'data and ai'], colour: '#9B9BFF', shape: 'neural' },
  { keys: ['security'], colour: '#FF00FF', shape: 'shield' },
  { keys: ['applications automation', 'apps automation'], colour: '#00FF00', shape: 'gear' },
  { keys: ['end user computing'], colour: '#78DCFF', shape: 'slab' },
  { keys: ['collaboration'], colour: '#FFB7FF', shape: 'orbit' },
  { keys: ['networking'], colour: '#00AEFF', shape: 'mesh' },
  { keys: ['hybrid cloud'], colour: '#00FFFF', shape: 'rings' },
  { keys: ['lifecycle services'], colour: '#9D9FA2', shape: 'loop' }
];

const FALLBACK_STYLE = { colour: '#00AEFF', shape: 'neural' };

export function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalise(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function styleFor(name, index) {
  const key = normalise(name);
  const hit = PRACTICE_STYLES.find(style => style.keys.some(candidate => key === candidate || key.startsWith(candidate)));
  return hit || PRACTICE_STYLES[index] || FALLBACK_STYLE;
}

/* Flattens the portfolio into the shape the scene wants: stable ids, slugs,
   colours and pre-counted children so layout never has to walk the tree. */
export function buildModel(portfolio) {
  const source = portfolio || window.DATA3_PORTFOLIO;
  if (!source || !Array.isArray(source.practices)) {
    throw new Error('DATA3_PORTFOLIO unavailable — /nav/data.js must load before the world modules.');
  }

  const practices = source.practices.map((practice, practiceIndex) => {
    const style = styleFor(practice.name, practiceIndex);
    const practiceSlug = slug(practice.name);
    let offeringTotal = 0;

    const capabilities = practice.capabilities.map((capability, capabilityIndex) => {
      const capabilitySlug = slug(capability.name);
      const offerings = capability.offerings.map((offering, offeringIndex) => ({
        kind: 'offering',
        id: offering.id,
        slug: slug(offering.name),
        name: offering.name,
        vendor: offering.vendor || '',
        index: offeringIndex,
        practiceSlug,
        capabilitySlug,
        practiceName: practice.name,
        capabilityName: capability.name
      }));
      offeringTotal += offerings.length;
      return {
        kind: 'capability',
        id: capability.id,
        slug: capabilitySlug,
        name: capability.name,
        index: capabilityIndex,
        practiceSlug,
        practiceName: practice.name,
        offerings
      };
    });

    return {
      kind: 'practice',
      id: practice.id,
      slug: practiceSlug,
      name: practice.name,
      index: practiceIndex,
      colour: style.colour,
      shape: style.shape,
      capabilities,
      offeringCount: offeringTotal
    };
  });

  return {
    name: source.name || 'Data#3 technology products and services',
    version: source.version || '',
    practices,
    totalCapabilities: practices.reduce((sum, practice) => sum + practice.capabilities.length, 0),
    totalOfferings: practices.reduce((sum, practice) => sum + practice.offeringCount, 0),
    findPractice(value) {
      return practices.find(practice => practice.slug === value) || null;
    },
    findCapability(practiceValue, capabilityValue) {
      const practice = this.findPractice(practiceValue);
      if (!practice) return null;
      return practice.capabilities.find(capability => capability.slug === capabilityValue) || null;
    }
  };
}
