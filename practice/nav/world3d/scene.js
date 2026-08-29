/* The portfolio constellation scene, shared by the world view and AR.

   The user stands at the centre of a ring of nine practice totems. Opening a
   practice unpacks its capabilities and every one of their offerings into the
   air around that totem; focusing a capability brings it forward for reading.
   Progressive disclosure is both the interaction design and the performance
   strategy — one practice open at a time keeps the scene at roughly fifty draw
   calls no matter how large the portfolio grows. */

import * as THREE from 'three';
import { configure, practiceAngle, practicePosition, practiceLayout, cameraGoal } from './layout.js';
import { createTotem, setTotemDim } from './totems.js';
import { NodeField } from './nodes.js';
import { Hotspot } from './hotspots.js';
import { createLabelSprite, SRGB_ENCODE, encodeGLSL } from './materials.js';

const _projected = new THREE.Vector3();
const _pivot = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

const PARTICLE_VERTEX = `
uniform float uTime;
uniform float uSize;
uniform float uHeight;
attribute float aPhase;
varying float vAlpha;
void main() {
  vec3 transformed = position;
  transformed.y = mod(transformed.y + uTime * 0.13 + aPhase * uHeight, uHeight) - uHeight * 0.28;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_PointSize = uSize * (70.0 / max(-mvPosition.z, 0.1));
  gl_Position = projectionMatrix * mvPosition;
  vAlpha = 0.25 + 0.3 * sin(aPhase * 6.2831 + uTime * 0.7);
}
`;

function particleFragment() {
  return `
uniform vec3 uColor;
varying float vAlpha;
${SRGB_ENCODE}
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float falloff = 1.0 - smoothstep(0.35, 1.0, d);
  // Clamped: additive blending turns a negative alpha into subtraction,
  // which punches black holes in the scene.
  gl_FragColor = vec4(${encodeGLSL('uColor')}, falloff * max(vAlpha, 0.0));
}
`;
}

export class PortfolioWorld {
  constructor(model, options = {}) {
    this.model = model;
    this.tier = options.tier || { mobile: false, glowSprites: false };
    this.cfg = configure(Object.assign({ practiceCount: model.practices.length }, options.layout));
    this.hotspotOrientation = options.hotspotOrientation || 'floor';
    this.labelScale = options.labelScale ?? 1;
    this.fov = options.fov ?? 58;
    this.labelUnit = 0.0015;
    this.labelPx = { practice: 19, capability: 16, capabilityFocused: 20, capabilityDim: 13, offering: 12 };
    this.viewportPx = { width: 1280, height: 720 };

    this.scene = new THREE.Scene();
    if (options.background !== false) {
      this.scene.background = new THREE.Color(0x000025);
      this.scene.fog = new THREE.FogExp2(0x000025, options.fogDensity ?? 0.032);
    }

    this.totems = new Map();
    this.hotspots = new Map();
    this.practiceLabels = new Map();
    this.pickables = [];

    this.state = { practice: null, capability: null, offering: null };

    /* Everything spinnable hangs off one group. Rotating this instead of the
       camera lets an AR user bring any part of the constellation to face them
       without turning their body — which matters when they are sitting in a
       meeting rather than standing in a room. */
    this.content = new THREE.Group();
    this.scene.add(this.content);

    /* Rotation happens about whatever the user is looking at, never about the
       user. Swinging the whole constellation around the viewer is disorienting
       when it is composited over a live camera feed — the real world stays put
       while everything virtual slides past it. This holder sits at the current
       subject's centre and spins in place instead. */
    this.spinPivot = new THREE.Group();
    this.content.add(this.spinPivot);
    this.spin = 0;

    this.nodeField = new NodeField();
    this.spinPivot.add(this.nodeField.group);

    this.buildTotems();
    if (options.floor !== false) this.buildFloor();
    if (options.particles !== false) this.buildParticles();

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.1;
  }

  /* ── Construction ─────────────────────────────────────────────── */

  buildTotems() {
    const count = this.model.practices.length;
    const totemScale = 0.85 * this.cfg.scale;

    this.model.practices.forEach(practice => {
      const position = practicePosition(practice.index, count, this.cfg);

      const totem = createTotem(practice, { glowSprite: this.tier.glowSprites });
      totem.position.copy(position);
      totem.scale.setScalar(totemScale);
      totem.lookAt(0, this.cfg.eye, 0);
      this.content.add(totem);
      this.totems.set(practice.slug, totem);
      this.pickables.push(totem.userData.proxy);
      totem.userData.proxy.userData.practiceSlug = practice.slug;

      const hotspot = new Hotspot(practice.colour, {
        size: 2.3 * this.cfg.scale,
        orientation: this.hotspotOrientation
      });
      if (this.hotspotOrientation === 'floor') {
        hotspot.mesh.position.set(position.x, 0.02, position.z);
      } else {
        hotspot.mesh.position.copy(position);
      }
      this.content.add(hotspot.mesh);
      this.hotspots.set(practice.slug, hotspot);

      // Base height only — setViewport applies the responsive scale so it is
      // never baked in twice.
      const label = createLabelSprite(practice.name, { colour: '#FFFFFF', height: 0.062 });
      label.position.copy(position).y += 1.35 * this.cfg.scale;
      this.content.add(label);
      this.practiceLabels.set(practice.slug, label);
    });
  }

  buildFloor() {
    const size = this.cfg.radius * 4;
    const grid = new THREE.GridHelper(size, 44, 0x11B8F5, 0x0d3a63);
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    grid.material.depthWrite = false;
    grid.material.toneMapped = false;
    this.content.add(grid);
    this.floor = grid;
  }

  buildParticles() {
    const count = this.tier.mobile ? 160 : 320;
    const height = this.cfg.radius * 2.4;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = this.cfg.radius * (0.3 + Math.random() * 1.25);
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      phases[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.cfg.scale * 1.6 },
        uHeight: { value: height },
        uColor: { value: new THREE.Color(0x78DCFF) }
      },
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: particleFragment(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  /* ── State ────────────────────────────────────────────────────── */

  setState(next) {
    const state = Object.assign({}, this.state, next);
    // Selecting a different practice always resets the capability focus.
    if (state.practice !== this.state.practice) state.capability = next.capability ?? null;
    this.state = state;
    this.applyState();
    // The pivot has moved; carrying the old angle over would show the new
    // subject pre-rotated.
    this.setSpin(0);
    return this.state;
  }

  applyState() {
    const { practice: practiceSlug, capability: capabilitySlug } = this.state;
    const practice = practiceSlug ? this.model.findPractice(practiceSlug) : null;

    this.totems.forEach((totem, slug) => {
      const active = !practiceSlug || slug === practiceSlug;
      // Once a capability is in focus the practice totem sits directly behind
      // it and competes for attention, so it recedes to context.
      const dim = active ? (capabilitySlug ? 0.34 : 1) : 0.28;
      setTotemDim(totem, dim);
      const label = this.practiceLabels.get(slug);
      if (label) {
        // Once a practice is open its name is in the HUD, and every practice
        // label — its own included — just competes with the capability names.
        label.visible = !practiceSlug;
        label.material.opacity = active ? 1 : 0.25;
      }
      const hotspot = this.hotspots.get(slug);
      if (hotspot) {
        hotspot.setActive(slug === practiceSlug);
        hotspot.setOpacity(active ? 1 : 0.2);
      }
    });

    if (!practice) {
      this.nodeField.clear();
      return;
    }

    const entries = practiceLayout(practice, this.cfg, capabilitySlug);
    this.nodeField.setPractice(entries, practice.colour, { unit: this.labelUnit, px: this.labelPx });
  }

  /* Responsive layout.

     Label sizing is expressed in screen pixels, not world units. A sprite with
     size attenuation off covers `scale / (2 * tan(fov / 2))` of the viewport
     height, so a fixed world scale changes apparent size whenever the field of
     view does. Portrait phones use a wider field to fit the ring, which shrank
     text at exactly the moment it needed to stay legible — the first version of
     this scaled labels down again on top of that and landed around six pixels.
     Inverting the relationship pins every label to a real pixel target instead.

     The arc still tightens and the vertical stagger still grows on narrow
     viewports, because the desktop arc is wider than a portrait camera sees. */
  setViewport(aspect, canvasHeightPx) {
    const portrait = aspect < 1;
    const height = Math.max(canvasHeightPx || 0, 1);
    const previousUnit = this.labelUnit;

    this.fov = portrait ? 74 : 58;
    // Angular step derived from a world-space gap, so capabilities stay the
    // same distance apart whatever the ring radius is.
    const arcGap = portrait ? 0.79 : 1.35;
    this.cfg.capabilityStep = (arcGap * this.cfg.scale) / (this.cfg.radius * this.cfg.capabilityRadius);
    this.cfg.stagger = portrait ? 1.05 : 0.7;
    // Offering names are long; on a narrow screen a circular spiral pushes the
    // outermost ones past both edges, so it squashes toward a vertical column.
    this.cfg.spiralAspect = portrait ? 0.58 : 1;
    this.viewportPx = { width: Math.round(height * aspect), height: Math.round(height) };

    // World-space scale that renders as exactly one screen pixel.
    this.labelUnit = (2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2)) / height;
    this.labelPx = portrait
      ? { practice: 15, capability: 15, capabilityFocused: 18, capabilityDim: 12, offering: 11 }
      : { practice: 19, capability: 16, capabilityFocused: 20, capabilityDim: 13, offering: 12 };

    this.practiceLabels.forEach(label => {
      const size = this.labelPx.practice * this.labelUnit;
      label.scale.set(size * label.userData.aspect, size, 1);
    });

    if (previousUnit !== this.labelUnit || this.state.practice) this.applyState();
    return this.fov;
  }

  /* Rotate the current subject about its own axis.

     Which axis depends on what is on screen, because the right one differs:
     - portfolio: each totem turns on the spot. Nothing to reveal at this level,
       so this is purely for the look of it.
     - practice: the capability arc turns about the vertical through its centre,
       bringing capabilities round from the ends.
     - capability: the offering spiral turns about its own normal — the axis
       running from the viewer to it — so the disc spins like a wheel and every
       offering stays face-on. Turning that one about the vertical would put it
       edge-on and hide the very thing being examined. */
  setSpin(angle) {
    this.spin = angle;
    const practiceOpen = Boolean(this.state.practice);

    this.totems.forEach(totem => {
      if (totem.userData.spin) totem.userData.spin.rotation.y = practiceOpen ? 0 : angle;
    });

    if (!practiceOpen) {
      this.spinPivot.position.set(0, 0, 0);
      this.spinPivot.quaternion.identity();
      this.nodeField.group.position.set(0, 0, 0);
    } else {
      const focused = this.nodeField.capabilityItems.find(item => item.entry.focused);
      const pivot = focused ? _pivot.copy(focused.entry.position) : this.practicePivotLocal(this.state.practice, _pivot);
      const axis = focused ? focused.entry.basis.dir : UP;
      if (pivot) {
        this.spinPivot.position.copy(pivot);
        this.spinPivot.quaternion.setFromAxisAngle(axis, angle);
        this.nodeField.group.position.copy(pivot).negate();
      }
    }
    this.content.updateMatrixWorld(true);
  }

  /* Node positions are local to the spin holder and totem positions are local
     to the content group, so the two need different matrices to reach world
     space. Getting these crossed silently misplaces every hit test. */
  toWorld(position, target = new THREE.Vector3()) {
    return target.copy(position).applyMatrix4(this.content.matrixWorld);
  }

  toNodeWorld(position, target = new THREE.Vector3()) {
    return target.copy(position).applyMatrix4(this.nodeField.group.matrixWorld);
  }

  /* Centre of an open practice's capability arc — the point the camera orbits
     at practice level, the same way it orbits a capability once one is focused. */
  practicePivotLocal(slug, target = new THREE.Vector3()) {
    const practice = this.model.findPractice(slug);
    if (!practice) return null;
    const angle = practiceAngle(practice.index, this.model.practices.length, this.cfg);
    const radius = this.cfg.radius * this.cfg.capabilityRadius;
    return target.set(Math.sin(angle) * radius, this.cfg.eye, -Math.cos(angle) * radius);
  }

  practicePivot(slug, target = new THREE.Vector3()) {
    const local = this.practicePivotLocal(slug, target);
    return local ? this.toWorld(local, target) : null;
  }

  /* World position of the capability currently in focus, so the page can move
     the camera to it. */
  focusedCapabilityPosition() {
    const item = this.nodeField.capabilityItems.find(entry => entry.entry.focused);
    return item ? this.toNodeWorld(item.entry.position) : null;
  }

  cameraGoal() {
    const practice = this.state.practice ? this.model.findPractice(this.state.practice) : null;
    return cameraGoal({
      practice: this.state.practice,
      practiceIndex: practice ? practice.index : 0
    }, this.cfg);
  }

  /* ── Interaction ──────────────────────────────────────────────── */

  /* `ndc` is a normalised device coordinate pair in [-1, 1]. Returns a hit
     descriptor the page can act on, or null for a background tap. */
  pick(ndc, camera) {
    this.raycaster.setFromCamera(ndc, camera);

    const nodeHit = this.state.practice ? this.nodeField.pick(this.raycaster) : null;
    const totemHits = this.raycaster.intersectObjects(this.pickables, false);
    const totemHit = totemHits.length
      ? { distance: totemHits[0].distance, kind: 'practice', slug: totemHits[0].object.userData.practiceSlug }
      : null;

    if (nodeHit && totemHit) return nodeHit.distance <= totemHit.distance ? nodeHit : totemHit;
    if (nodeHit || totemHit) return nodeHit || totemHit;

    // Nothing under the ray. An offering node is only about thirteen pixels
    // across on a phone, well under a fingertip, so fall back to the nearest
    // node within a forgiving screen-space radius before giving up.
    return this.pickNearScreen(ndc, camera);
  }

  pickNearScreen(ndc, camera, tolerancePx = 30) {
    const halfWidth = this.viewportPx.width / 2;
    const halfHeight = this.viewportPx.height / 2;
    let best = null;

    const consider = (position, build, node = true) => {
      (node ? this.toNodeWorld(position, _projected) : this.toWorld(position, _projected)).project(camera);
      if (_projected.z > 1) return;                       // behind the camera
      const dx = (_projected.x - ndc.x) * halfWidth;
      const dy = (_projected.y - ndc.y) * halfHeight;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > tolerancePx) return;
      if (!best || distance < best.screenDistance) best = Object.assign(build(), { screenDistance: distance });
    };

    /* Deepest level first, so a tie goes to the more specific target. Totems
       are included even though they are large: a ray aimed exactly down the
       central axis of their cylindrical hit proxy lands on a triangle seam,
       where floating-point noise decides between hit and miss. A finger is
       never that precise, but the fallback should not depend on that. */
    this.nodeField.offeringItems.forEach(item => {
      consider(item.position, () => ({ kind: 'offering', item, distance: Infinity }));
    });
    this.nodeField.capabilityItems.forEach(item => {
      consider(item.entry.position, () => ({ kind: 'capability', item, distance: Infinity }));
    });
    this.totems.forEach((totem, slug) => {
      consider(totem.position, () => ({ kind: 'practice', slug, distance: Infinity }), false);
    });
    return best;
  }

  update(delta, time, camera) {
    this.totems.forEach(totem => {
      if (totem.userData.animate) totem.userData.animate(time, delta);
    });
    this.hotspots.forEach(hotspot => hotspot.update(time, camera));
    this.nodeField.update(time);
    if (this.particleMaterial) this.particleMaterial.uniforms.uTime.value = time;
    this.totems.forEach(totem => {
      totem.userData.material.uniforms.uTime.value = time;
    });
  }

  dispose() {
    this.hotspots.forEach(hotspot => hotspot.dispose());
    this.nodeField.clearLabels();
  }
}
