/* Portfolio AR — the phone magic window.

   No iPhone can run true WebXR augmented reality: Safari has never shipped
   immersive-ar on iOS, and every iOS browser including Chrome uses WebKit. But
   the experience this page wants — stand still, look around, tap what you see —
   is rotation-only, and rotation-only AR needs nothing exotic: the rear camera
   as a backdrop, the gyroscope driving the camera, and a raycast on tap.

   Everything degrades. Camera refused? The constellation renders on the brand
   void and the gyro still works. Motion refused? Drag to look. There is no
   state in which this page shows an error instead of the portfolio. */

import * as THREE from 'three';
import { buildModel } from '../world3d/taxonomy.js';
import { PortfolioWorld } from '../world3d/scene.js';
import { detectTier, createRenderer, FrameLoop } from '../world3d/tiers.js';
import { DetailCard } from '../world3d/detail-card.js';
import { setOutputEncoding } from '../world3d/materials.js';
import { GyroControls, DragLook, requestGyroPermission } from '../world3d/gyro.js';
import { offsetForFront } from '../world3d/layout.js';
import { CameraFeed } from '../world3d/camera-feed.js';

/* Camera and motion are independent permissions and fail independently, so the
   experience is a two-by-two rather than a single ladder. Only the top-left
   cell is "real" AR; none of the others is an error state. */
function modeLabel(cameraOn, lookMode) {
  if (cameraOn) return lookMode === 'gyro' ? 'Live AR · turn around' : 'Live AR · drag to look';
  return lookMode === 'gyro' ? 'Motion view · camera off' : 'Drag to look around';
}

function boot() {
  const canvas = document.getElementById('arCanvas');
  const video = document.getElementById('cameraFeed');
  const gate = document.getElementById('arGate');
  const gateInner = gate.querySelector('.gateInner');
  const gateNote = document.getElementById('gateNote');
  const startButton = document.getElementById('startButton');
  const modeChip = document.getElementById('arMode');
  const statusBox = document.getElementById('arStatus');
  const statusKicker = document.getElementById('arStatusKicker');
  const statusTitle = document.getElementById('arStatusTitle');
  const recentreButton = document.getElementById('recentreButton');
  const backButton = document.getElementById('arBackButton');

  let model;
  try {
    model = buildModel();
  } catch (error) {
    gateInner.classList.add('failed');
    gateInner.querySelector('h1').textContent = 'Portfolio data unavailable';
    gateNote.textContent = error.message;
    startButton.disabled = true;
    return;
  }

  const tier = detectTier();
  // Rendered straight to the canvas over the video — no composer, so the
  // scene shaders perform the sRGB conversion themselves.
  setOutputEncoding(true);

  const renderer = createRenderer(canvas, { tier, alpha: true });
  const camera = new THREE.PerspectiveCamera(66, 1, 0.1, 100);

  /* A tighter ring than the desktop world: in AR the user cannot walk, so
     everything sits within a comfortable turn of the head.

     radius is the distance in metres; scale is set independently so pulling the
     ring closer actually reads as closer. At 3.2m with a proportional scale of
     0.444 the content subtended 0.139 per metre; 1.5m at 0.277 subtends 0.185,
     about a third larger on screen — which is what moving from arm's length to
     within reach should look like. */
  const world = new PortfolioWorld(model, {
    tier,
    background: false,
    floor: false,
    hotspotOrientation: 'billboard',
    layout: {
      radius: 1.5,
      eye: 0,
      scale: 0.277,
      // Data & AI is the practice most people come to see, so it is what you
      // are facing the moment the view opens — dead ahead, no turning required.
      angleOffset: offsetForFront(
        (model.practices.find(p => p.slug === 'data-and-ai') || model.practices[0]).index,
        model.practices.length,
        0
      )
    }
  });

  const card = new DetailCard(document.getElementById('detailCard'));

  let cameraOn = false;
  let lookMode = 'drag';

  const cameraFeed = new CameraFeed(video, {
    onStateChange: state => {
      cameraOn = state === 'live';
      refreshMode();
    }
  });

  const gyro = new GyroControls(camera, { tau: 0.08 });
  let drag = null;

  /* Spin. With the gyro driving the view, a horizontal drag is free to turn
     whatever is on screen — the totems on the spot at portfolio level, the
     capability arc about its own centre once a practice is open, and a focused
     capability's offerings about their own normal, like a wheel. The subject
     rotates; the viewer and the room behind them stay put.

     Without the gyro, drag is already steering the camera, and turning the
     content too would just double the motion. */
  let spinAngle = 0;
  let spinVelocity = 0;

  function spinBy(radians) {
    spinAngle += radians;
    world.setSpin(spinAngle);
  }

  function refreshMode() {
    modeChip.hidden = false;
    modeChip.textContent = modeLabel(cameraOn, lookMode);
    modeChip.classList.toggle('warn', !(cameraOn && lookMode === 'gyro'));
    recentreButton.hidden = lookMode !== 'gyro';
    // Only the camera decides the backdrop. Losing motion control does not
    // mean losing the camera feed.
    video.style.display = cameraOn ? '' : 'none';
    world.scene.background = cameraOn ? null : new THREE.Color(0x000025);
  }

  /* ── The one gesture that buys both permissions ─────────────────
     Motion access must originate from a user gesture; camera access need not.
     Requesting motion first means a slow decision on the camera prompt can
     never expire the activation the motion prompt depends on. */
  async function start() {
    startButton.disabled = true;
    startButton.textContent = 'Starting…';

    const permission = await requestGyroPermission();
    try {
      await cameraFeed.start();
      cameraOn = true;
    } catch (error) {
      cameraOn = false;
    }

    let gyroOk = false;
    if (permission === 'granted') {
      const result = await gyro.connect({ permission });
      gyroOk = result.ok;
    }

    lookMode = gyroOk ? 'gyro' : 'drag';
    if (!gyroOk) drag = new DragLook(camera, document.body, { yaw: 0 });
    refreshMode();

    statusBox.hidden = false;
    gate.classList.add('gone');
    window.setTimeout(() => { gate.hidden = true; }, 500);
    resize();
    loop.start();
  }

  startButton.addEventListener('click', start);

  recentreButton.addEventListener('click', () => {
    if (gyro.enabled) gyro.recalibrate();
  });

  backButton.addEventListener('click', () => {
    if (world.state.capability) applyState({ capability: null });
    else applyState({ practice: null, capability: null });
    card.hide();
  });

  /* ── State ────────────────────────────────────────────────────── */
  function applyState(next) {
    world.setState(next);
    // setState re-pivots the spin holder, so the local accumulator follows it.
    spinAngle = 0;
    spinVelocity = 0;
    const practice = world.state.practice ? model.findPractice(world.state.practice) : null;
    const capability = world.state.capability
      ? model.findCapability(world.state.practice, world.state.capability)
      : null;

    if (capability) {
      statusKicker.textContent = 'Capability';
      statusTitle.textContent = capability.name;
    } else if (practice) {
      statusKicker.textContent = 'Practice';
      statusTitle.textContent = practice.name;
    } else {
      statusKicker.textContent = 'Portfolio';
      statusTitle.textContent = 'Look around you';
    }
    backButton.hidden = !world.state.practice;
  }

  /* ── Tap to select ────────────────────────────────────────────── */
  const pointer = { id: null, x: 0, y: 0, moved: 0 };

  document.body.addEventListener('pointerdown', event => {
    // The gate covers the scene; a tap that starts on it must never fall
    // through to the raycaster, or pressing Start selects whatever totem
    // happens to sit behind the button.
    if (!gate.hidden || event.target.closest('[data-ui]')) return;
    pointer.id = event.pointerId;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.moved = 0;
  });

  document.body.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    pointer.moved += Math.abs(dx) + Math.abs(event.clientY - pointer.y);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (lookMode === 'gyro') {
      const step = -dx * 0.005;
      spinBy(step);
      spinVelocity = step;
    }
  });

  document.body.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer.id) return;
    pointer.id = null;
    if (pointer.moved > 10) return;   // a spin or look-around, not a tap
    spinVelocity = 0;
    selectAt(event.clientX, event.clientY);
  });

  function selectAt(clientX, clientY) {
    const ndc = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    const hit = world.pick(ndc, camera);
    if (!hit) { card.hide(); return; }

    // Only an offering opens the panel; the levels above it are navigation and
    // are reported in the status chip instead.
    if (hit.kind === 'practice') {
      applyState({ practice: hit.slug, capability: null });
      card.hide();
      return;
    }
    if (hit.kind === 'capability') {
      const capability = hit.item.entry.capability;
      applyState({ capability: world.state.capability === capability.slug ? null : capability.slug });
      card.hide();
      return;
    }
    if (hit.kind === 'offering') {
      const offering = hit.item.offering;
      const practice = model.findPractice(offering.practiceSlug);
      const capability = model.findCapability(offering.practiceSlug, offering.capabilitySlug);
      if (world.state.capability !== capability.slug) applyState({ capability: capability.slug });
      card.show({ level: 'offering', practice, capability, offering });
    }
  }

  /* ── Resize + loop ────────────────────────────────────────────── */
  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    // AR keeps a wider field than the desktop world so a phone held in
    // portrait still shows a plausible slice of the ring.
    camera.fov = Math.max(world.setViewport(camera.aspect, height), 66);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => window.setTimeout(resize, 250));
  resize();

  const loop = new FrameLoop(renderer, (delta, time) => {
    // Let a flick carry on and ease out, framerate-independently.
    if (Math.abs(spinVelocity) > 1e-4 && pointer.id === null) {
      spinBy(spinVelocity);
      spinVelocity *= Math.exp(-delta / 0.22);
    }
    if (gyro.enabled) gyro.update(delta);
    else if (drag) drag.update(delta);
    world.update(delta, time, camera);
    renderer.render(world.scene, camera);
  });

  applyState({ practice: null, capability: null });

  window.addEventListener('pagehide', () => {
    cameraFeed.stop();
    loop.stop();
  });

  window.__AR__ = { world, model, camera, gyro, cameraFeed, start, selectAt, applyState, renderer, spinBy,
    getYaw: () => spinAngle,
    getMode: () => ({ cameraOn, lookMode }) };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
