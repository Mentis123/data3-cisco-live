/* Deterministic layout for the portfolio constellation.

   Nothing here is simulated — the taxonomy is a static tree, so every position
   is computed once from rings and golden-angle spirals. That keeps the runtime
   cost at zero and makes every transition an art-directable tween rather than
   physics settling. All distances scale from cfg.radius so the same layout
   serves the roomy desktop world and the tighter AR ring. */

import * as THREE from 'three';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export const DEFAULTS = {
  radius: 7.2,        // practice ring radius
  eye: 1.6,           // standing eye height — the user is at (0, eye, 0)
  capabilityRadius: 0.78,   // fraction of ring radius
  focusRadius: 0.60,
  siblingRadius: 0.94,
  angleOffset: 0,           // rotates the whole ring; decides which practice faces front
  capabilityStep: 0.24,     // radians between capabilities in the arc
  stagger: 0.7,             // vertical alternation, scaled by unit
  spiralAspect: 1           // <1 squashes the offering spiral horizontally
};

/* `radius` is how far the content sits from the viewer; `scale` is how big it
   is. They default to moving together, but a caller can separate them — which
   is the only way to change distance in the AR view and have it mean anything.
   There is no parallax in a rotation-only magic window, so apparent size is the
   sole depth cue: scaling everything with the radius would make a distance
   change literally invisible. */
export function configure(overrides) {
  const cfg = Object.assign({}, DEFAULTS, overrides || {});
  cfg.unit = cfg.radius / DEFAULTS.radius;
  cfg.scale = (overrides && overrides.scale) || cfg.unit;
  return cfg;
}

/* Practice ring. Angle 0 is straight ahead (-Z); cfg.angleOffset rotates the
   whole ring so a chosen practice lands there — or anywhere else the page
   wants it. */
export function practiceAngle(index, count, cfg) {
  return (index / count) * Math.PI * 2 + ((cfg && cfg.angleOffset) || 0);
}

/* Offset that puts `index` at `bearing` radians from straight ahead. */
export function offsetForFront(index, count, bearing = 0) {
  return bearing - (index / count) * Math.PI * 2;
}

export function practicePosition(index, count, cfg, target = new THREE.Vector3()) {
  const angle = practiceAngle(index, count, cfg);
  return target.set(Math.sin(angle) * cfg.radius, cfg.eye, -Math.cos(angle) * cfg.radius);
}

/* A disc basis that faces the user standing at the centre. Offerings are laid
   out on this plane so a spiral always reads as a spiral, never as an ellipse
   seen edge-on. */
function facingBasis(position, cfg) {
  const dir = new THREE.Vector3(position.x, 0, position.z).normalize();
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
  const right = new THREE.Vector3().crossVectors(WORLD_UP, dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  return { dir, right, up };
}

function discRadiusFor(count, cfg, scale = 1) {
  return Math.min(0.34 + count * 0.042, 0.7) * cfg.scale * scale;
}

/* Golden-angle spiral — even areal density, no rings, no clumping at the rim.
   `inner` keeps the first few offerings clear of the capability node they orbit;
   without it the innermost ones sit inside the sphere and their labels are
   swallowed by it. */
function spiral(count, radius, basis, centre, out, inner = 0, aspect = 1) {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.62 : Math.sqrt((i + 0.5) / count);
    const r = inner + (radius - inner) * t;
    const theta = i * GOLDEN_ANGLE;
    out.push(new THREE.Vector3()
      .copy(centre)
      .addScaledVector(basis.right, Math.cos(theta) * r * aspect)
      .addScaledVector(basis.up, Math.sin(theta) * r));
  }
  return out;
}

/* Full layout for one open practice.
   focusSlug === null  → every capability shown at equal weight with its
                         offerings clustered around it (the "unpack" moment).
   focusSlug === slug  → that capability steps forward and its offerings expand
                         for reading; siblings retreat and dim. */
export function practiceLayout(practice, cfg, focusSlug = null) {
  const count = practice.capabilities.length;
  const baseAngle = practiceAngle(practice.index, cfg.practiceCount, cfg);
  const step = cfg.capabilityStep;
  const centreIndex = (count - 1) / 2;

  return practice.capabilities.map((capability, index) => {
    const focused = focusSlug === capability.slug;
    const dimmed = focusSlug !== null && !focused;

    // Focused capability swings to the practice's centre line; siblings fan wider.
    const offsetAngle = focused ? 0 : (index - centreIndex) * step * (dimmed ? 1.24 : 1);
    const angle = baseAngle + offsetAngle;
    const radialFraction = focused ? cfg.focusRadius : (dimmed ? cfg.siblingRadius : cfg.capabilityRadius);
    const radius = cfg.radius * radialFraction;

    const stagger = (index % 2 === 0 ? 1 : -1) * cfg.stagger * cfg.scale * (focused ? 0 : 1);
    const position = new THREE.Vector3(
      Math.sin(angle) * radius,
      cfg.eye + stagger + (focused ? 0.12 * cfg.scale : 0),
      -Math.cos(angle) * radius
    );

    const basis = facingBasis(position, cfg);
    // A focused capability spreads its offerings wide enough that their
    // labels have room to sit side by side without colliding.
    const offeringScale = focused ? 2.75 : (dimmed ? 0.55 : 1);
    const nodeScale = (focused ? 1.25 : (dimmed ? 0.72 : 1)) * cfg.scale;
    const discRadius = discRadiusFor(capability.offerings.length, cfg, offeringScale);
    // Clear the capability node itself before the first offering lands.
    const innerRadius = nodeScale * 0.26 * 1.9;
    const offerings = spiral(capability.offerings.length, Math.max(discRadius, innerRadius * 1.6),
      basis, position, [], innerRadius, cfg.spiralAspect);

    return {
      capability,
      focused,
      dimmed,
      position,
      basis,
      discRadius,
      offerings,
      nodeScale,
      offeringScale: (focused ? 1.5 : (dimmed ? 0.6 : 1)) * cfg.scale
    };
  });
}

/* Where the camera should sit for a given state, in the world view. */
export function cameraGoal(state, cfg) {
  if (state.practice === null) {
    return {
      position: new THREE.Vector3(0, cfg.eye + 3.1, cfg.radius * 1.95),
      target: new THREE.Vector3(0, cfg.eye - 0.2, 0)
    };
  }
  const angle = practiceAngle(state.practiceIndex, cfg.practiceCount, cfg);
  const look = new THREE.Vector3(
    Math.sin(angle) * cfg.radius,
    cfg.eye,
    -Math.cos(angle) * cfg.radius
  );
  return { position: new THREE.Vector3(0, cfg.eye, 0), target: look };
}
