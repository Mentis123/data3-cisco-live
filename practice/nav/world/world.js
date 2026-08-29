/* Portfolio World — the desktop/tablet 3D view.

   Two camera modes: an establishing shot from outside the ring that shows the
   whole portfolio at once, and an inside view at the centre of the ring facing
   whichever practice is open. Picking a practice flies you from one to the
   other, which is the moment the scale of the portfolio lands. */

import * as THREE from 'three';
import { buildModel } from '../world3d/taxonomy.js';
import { PortfolioWorld } from '../world3d/scene.js';
import { detectTier, createRenderer, createComposer, FrameLoop, ease } from '../world3d/tiers.js';
import { DetailCard } from '../world3d/detail-card.js';
import { setOutputEncoding } from '../world3d/materials.js';
import { offsetForFront } from '../world3d/layout.js';

const TRANSITION_SECONDS = 1.05;
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _lookMatrix = new THREE.Matrix4();
const _up = new THREE.Vector3(0, 1, 0);
const _target = new THREE.Vector3();

/* Matrix4.lookAt uses the camera convention (-Z toward the target). Object3D
   .lookAt does NOT for non-camera objects — it points +Z at the target — so
   borrowing a plain Object3D here would aim the camera exactly backwards. */
function lookQuaternion(position, target, quaternion) {
  _lookMatrix.lookAt(position, target, _up);
  return quaternion.setFromRotationMatrix(_lookMatrix);
}

class WorldCamera {
  constructor(camera, cfg) {
    this.camera = camera;
    this.cfg = cfg;
    this.mode = 'overview';
    this.orbitYaw = 0;
    this.orbitTargetYaw = 0;
    this.lookYaw = 0;
    this.lookTargetYaw = 0;
    this.lookPitch = 0;
    this.lookTargetPitch = 0;
    this.insidePoint = null;
    this.focusPoint = null;
    this.focusYaw = 0;
    this.focusTargetYaw = 0;
    this.focusPitch = 0.1;
    this.focusTargetPitch = 0.1;
    this.transition = null;
    this.applyImmediate();
  }

  overviewPose(yaw, position = new THREE.Vector3(), quaternion = new THREE.Quaternion()) {
    // Pulled back and lifted a little so the nearest totem's floor ring —
    // Data & AI, front and centre — sits inside the frame rather than on its
    // bottom edge.
    const distance = this.cfg.radius * 1.9;
    position.set(Math.sin(yaw) * distance, this.cfg.eye + 3.2, Math.cos(yaw) * distance);
    _target.set(0, this.cfg.eye + 0.2, 0);
    lookQuaternion(position, _target, quaternion);
    return { position, quaternion };
  }

  /* Orbit a point at a fixed distance. Both drilled-in levels use this: the
     practice level circles the capability arc, the capability level circles its
     offerings. Only the pivot and the radius differ, so the two feel like the
     same gesture at two depths.

     At yaw 0 and pitch 0 with distance = radius * capabilityRadius, the camera
     lands exactly on the ring centre looking outward — which is where the
     practice view used to sit permanently. Dragging now walks around it. */
  orbitPose(point, yaw, pitch, distance, position = new THREE.Vector3(), quaternion = new THREE.Quaternion()) {
    const heading = Math.atan2(point.x, point.z) + yaw;
    const horizontal = Math.cos(pitch) * distance;
    position.set(
      point.x - Math.sin(heading) * horizontal,
      point.y + Math.sin(pitch) * distance,
      point.z - Math.cos(heading) * horizontal
    );
    lookQuaternion(position, point, quaternion);
    return { position, quaternion };
  }

  targetPose(position, quaternion) {
    if (this.mode === 'focus' && this.focusPoint) {
      return this.orbitPose(this.focusPoint, this.focusYaw, this.focusPitch,
        this.cfg.radius * 0.40, position, quaternion);
    }
    if (this.mode === 'inside' && this.insidePoint) {
      return this.orbitPose(this.insidePoint, this.lookYaw, this.lookPitch,
        this.cfg.radius * this.cfg.capabilityRadius, position, quaternion);
    }
    return this.overviewPose(this.orbitYaw, position, quaternion);
  }

  applyImmediate() {
    const pose = this.targetPose();
    this.camera.position.copy(pose.position);
    this.camera.quaternion.copy(pose.quaternion);
  }

  /* Captures the current pose and eases to the new mode, so a mode switch
     always reads as a move through space rather than a cut. */
  goTo(mode, { yaw = 0, point = null } = {}) {
    const from = {
      position: this.camera.position.clone(),
      quaternion: this.camera.quaternion.clone()
    };
    this.mode = mode;
    if (mode === 'focus') {
      this.focusPoint = point;
      this.focusYaw = this.focusTargetYaw = 0;
      this.focusPitch = this.focusTargetPitch = 0.1;
    } else if (mode === 'inside') {
      this.insidePoint = point;
      this.lookYaw = this.lookTargetYaw = 0;
      this.lookPitch = this.lookTargetPitch = 0;
    } else {
      this.orbitYaw = this.orbitTargetYaw = yaw;
    }
    this.transition = { from, elapsed: 0 };
  }

  /* Pitch is clamped so an orbit cannot dive under the floor grid or tip over
     the top of whatever it is circling. */
  drag(dx, dy) {
    if (this.mode === 'focus') {
      this.focusTargetYaw -= dx * 0.004;
      this.focusTargetPitch = THREE.MathUtils.clamp(this.focusTargetPitch + dy * 0.004, -0.25, 0.6);
    } else if (this.mode === 'inside') {
      this.lookTargetYaw -= dx * 0.004;
      this.lookTargetPitch = THREE.MathUtils.clamp(this.lookTargetPitch + dy * 0.004, -0.22, 0.6);
    } else {
      this.orbitTargetYaw -= dx * 0.0055;
    }
  }

  update(delta) {
    const smoothing = 1 - Math.exp(-delta / 0.1);
    this.orbitYaw += (this.orbitTargetYaw - this.orbitYaw) * smoothing;
    this.focusYaw += (this.focusTargetYaw - this.focusYaw) * smoothing;
    this.focusPitch += (this.focusTargetPitch - this.focusPitch) * smoothing;
    this.lookYaw += (this.lookTargetYaw - this.lookYaw) * smoothing;
    this.lookPitch += (this.lookTargetPitch - this.lookPitch) * smoothing;

    const goal = this.targetPose();

    if (this.transition) {
      this.transition.elapsed += delta;
      const t = ease(this.transition.elapsed / TRANSITION_SECONDS);
      this.camera.position.lerpVectors(this.transition.from.position, goal.position, t);
      this.camera.quaternion.slerpQuaternions(this.transition.from.quaternion, goal.quaternion, t);
      if (this.transition.elapsed >= TRANSITION_SECONDS) this.transition = null;
      return;
    }

    this.camera.position.copy(goal.position);
    this.camera.quaternion.copy(goal.quaternion);
  }
}

function boot() {
  const canvas = document.getElementById('worldCanvas');
  const stage = document.querySelector('.worldStage');
  const veil = document.getElementById('worldVeil');

  let model;
  try {
    model = buildModel();
  } catch (error) {
    veil.querySelector('.veilInner').classList.add('failed');
    veil.querySelector('b').textContent = 'Portfolio data unavailable';
    document.getElementById('veilNote').textContent = error.message;
    return;
  }

  const tier = detectTier();
  // This page always composites through EffectComposer, so OutputPass owns the
  // colour conversion and the scene shaders must stay linear.
  setOutputEncoding(false);
  const renderer = createRenderer(canvas, { tier });
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
  const world = new PortfolioWorld(model, {
    tier,
    hotspotOrientation: 'floor',
    layout: {
      // The establishing shot looks along +Z, so putting Data & AI half a turn
      // round lands it nearest the camera — bottom and centre of frame.
      angleOffset: offsetForFront(
        (model.practices.find(p => p.slug === 'data-and-ai') || model.practices[0]).index,
        model.practices.length,
        Math.PI
      )
    }
  });
  const rig = new WorldCamera(camera, world.cfg);

  let composer = null;
  createComposer(renderer, world.scene, camera, { bloom: tier.bloom })
    .then(result => { composer = result.composer; resize(); })
    .catch(error => { console.error('Post-processing unavailable:', error); });

  /* ── HUD ──────────────────────────────────────────────────────── */
  const hudKicker = document.getElementById('hudKicker');
  const hudTitle = document.getElementById('hudTitle');
  const hudCount = document.getElementById('hudCount');
  const hudHint = document.getElementById('hudHint');
  const backButton = document.getElementById('backButton');
  const resetButton = document.getElementById('resetButton');

  hudCount.textContent = `${model.practices.length} practices · ${model.totalCapabilities} capabilities · ${model.totalOfferings} offerings`;

  const cardRoot = document.getElementById('detailCard');

  /* The card sits above the scene and pushes it down rather than covering it —
     on a phone an overlay hid the very cluster you had just drilled into. The
     canvas is genuinely resized, not just translated, so nothing is cropped and
     the projection stays square. */
  function layoutForCard(open) {
    stage.classList.toggle('has-card', open);
    if (open) {
      const limit = Math.round(window.innerHeight * 0.5);
      stage.style.setProperty('--cardH', Math.min(cardRoot.offsetHeight, limit) + 'px');
    } else {
      stage.style.removeProperty('--cardH');
    }
    resize();
  }

  const card = new DetailCard(cardRoot, {
    onClose: () => layoutForCard(false)   // selection stays; only the panel closes
  });

  function showCard(payload) {
    card.show(payload);
    layoutForCard(true);
  }

  function hideCard() {
    card.hide();
    layoutForCard(false);
  }

  function syncHud() {
    const { practice: practiceSlug, capability: capabilitySlug } = world.state;
    const practice = practiceSlug ? model.findPractice(practiceSlug) : null;
    const capability = capabilitySlug ? model.findCapability(practiceSlug, capabilitySlug) : null;

    if (capability) {
      hudKicker.textContent = 'Capability';
      hudTitle.textContent = capability.name;
      hudCount.textContent = `${practice.name} · ${capability.offerings.length} offerings`;
      hudHint.textContent = 'Tap an offering for detail.';
    } else if (practice) {
      hudKicker.textContent = 'Practice';
      hudTitle.textContent = practice.name;
      hudCount.textContent = `${practice.capabilities.length} capabilities · ${practice.offeringCount} offerings`;
      hudHint.textContent = 'Tap a capability to bring it forward.';
    } else {
      hudKicker.textContent = 'Portfolio';
      hudTitle.textContent = model.name;
      hudCount.textContent = `${model.practices.length} practices · ${model.totalCapabilities} capabilities · ${model.totalOfferings} offerings`;
      hudHint.textContent = 'Tap a totem to unpack a practice.';
    }

    backButton.hidden = !practiceSlug;
    resetButton.hidden = !practiceSlug;
  }

  /* ── State + routing ──────────────────────────────────────────── */
  let suppressHashRead = false;

  function writeHash() {
    const parts = [world.state.practice, world.state.capability].filter(Boolean);
    const hash = parts.length ? `#/${parts.join('/')}` : '#/';
    if (location.hash === hash) return;
    suppressHashRead = true;
    location.hash = hash;
    window.setTimeout(() => { suppressHashRead = false; }, 0);
  }

  function applyState(next, { fly = true } = {}) {
    const previousPractice = world.state.practice;
    const previousCapability = world.state.capability;
    world.setState(next);

    if (!world.state.practice && previousPractice) {
      rig.goTo('overview', { yaw: rig.orbitYaw });
    } else if (world.state.capability) {
      const point = world.focusedCapabilityPosition();
      if (point) rig.goTo('focus', { point: point.clone() });
    } else if (world.state.practice && (world.state.practice !== previousPractice || previousCapability)) {
      const pivot = world.practicePivot(world.state.practice);
      if (pivot) rig.goTo('inside', { point: pivot.clone() });
    }

    syncHud();
    writeHash();
  }

  function readHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [practiceSlug, capabilitySlug] = raw.split('/').filter(Boolean);
    const practice = practiceSlug ? model.findPractice(practiceSlug) : null;
    const capability = practice && capabilitySlug ? model.findCapability(practice.slug, capabilitySlug) : null;
    applyState({
      practice: practice ? practice.slug : null,
      capability: capability ? capability.slug : null
    });
  }

  window.addEventListener('hashchange', () => {
    if (suppressHashRead) return;
    readHash();
  });

  backButton.addEventListener('click', () => {
    if (world.state.capability) applyState({ capability: null });
    else applyState({ practice: null, capability: null });
    hideCard();
  });
  resetButton.addEventListener('click', () => {
    applyState({ practice: null, capability: null });
    hideCard();
  });

  /* ── Pointer: drag to look, tap to select ─────────────────────── */
  const pointer = { down: false, id: null, x: 0, y: 0, moved: 0 };

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-ui]')) return;
    pointer.down = true;
    pointer.id = event.pointerId;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.moved = 0;
    stage.setPointerCapture?.(event.pointerId);
  });

  window.addEventListener('pointermove', event => {
    if (!pointer.down || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.moved += Math.abs(dx) + Math.abs(dy);
    rig.drag(dx, dy);
  });

  window.addEventListener('pointerup', event => {
    if (!pointer.down || event.pointerId !== pointer.id) return;
    pointer.down = false;
    stage.releasePointerCapture?.(event.pointerId);
    if (pointer.moved > 9) return;   // that was a look-around, not a selection
    selectAt(event.clientX, event.clientY);
  });

  function selectAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const hit = world.pick(ndc, camera);

    if (!hit) {
      hideCard();
      return;
    }

    // Practices and capabilities are navigation: they move the camera and
    // update the heading. Only an offering is a destination worth reading, so
    // only an offering opens the panel.
    if (hit.kind === 'practice') {
      applyState({ practice: hit.slug, capability: null });
      hideCard();
      return;
    }

    if (hit.kind === 'capability') {
      const capability = hit.item.entry.capability;
      const alreadyFocused = world.state.capability === capability.slug;
      applyState({ capability: alreadyFocused ? null : capability.slug });
      hideCard();
      return;
    }

    if (hit.kind === 'offering') {
      const offering = hit.item.offering;
      const practice = model.findPractice(offering.practiceSlug);
      const capability = model.findCapability(offering.practiceSlug, offering.capabilitySlug);
      if (world.state.capability !== capability.slug) applyState({ capability: capability.slug });
      showCard({ level: 'offering', practice, capability, offering });
    }
  }

  /* ── Resize + loop ────────────────────────────────────────────── */
  function resize() {
    const width = canvas.clientWidth || stage.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || stage.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.fov = world.setViewport(camera.aspect, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (composer) composer.setSize(width, height);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => window.setTimeout(resize, 250));
  resize();

  const loop = new FrameLoop(renderer, (delta, time) => {
    rig.update(delta);
    world.update(delta, time, camera);
    if (composer) composer.render(delta);
    else renderer.render(world.scene, camera);
  });

  readHash();
  loop.start();
  window.requestAnimationFrame(() => veil.classList.add('gone'));

  // Exposed for the local verification harness.
  window.__WORLD__ = { world, model, camera, rig, applyState, selectAt, renderer, tier, loop, getComposer: () => composer };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
