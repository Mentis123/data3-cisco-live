/* Render tiers, renderer setup and the frame loop.

   Two tiers, detected not guessed: desktop gets post-processed bloom, mobile
   gets additive glow sprites and a clamped pixel ratio. The device pixel ratio
   cap matters more than anything else here — phones report 3, and bloom at 3x
   costs 2.25 times the fill of 2x for gains nobody can see.

   Everything is delta-time driven because iOS throttles requestAnimationFrame
   to 30fps in Low Power Mode, and frame-counted animation would run at half
   speed with no warning. */

import * as THREE from 'three';

export function detectTier(options = {}) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 760;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = options.forceMobile ?? (coarse || narrow || cores <= 4);
  return {
    mobile,
    bloom: !mobile && options.allowBloom !== false,
    pixelRatioCap: mobile ? 2 : 2,
    glowSprites: mobile
  };
}

export function createRenderer(canvas, { alpha = false, tier } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha,
    antialias: !tier.mobile,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatioCap));
  // No tone mapping: custom shaders encode to sRGB themselves so the bloom
  // path and the direct path produce identical colour.
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (alpha) renderer.setClearColor(0x000000, 0);
  return renderer;
}

/* Both tiers composite through EffectComposer; only the bloom pass is
   conditional. Running one pipeline everywhere means colour is converted in
   exactly one place (OutputPass) on every device, rather than depending on
   whether a material happened to draw to a render target or to the canvas.
   The extra cost on mobile is a single fullscreen blit. */
export async function createComposer(renderer, scene, camera, { bloom: withBloom = true } = {}) {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js')
  ]);

  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  let bloom = null;
  if (withBloom) {
    // Half-resolution bloom: it is a blur, so the resolution loss is invisible
    // and the fragment cost drops by about three quarters.
    bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.max(size.x / 2, 1), Math.max(size.y / 2, 1)),
      0.6,   // strength — showcase demos use 1.5+, which hazes nine glowing objects into soup
      0.4,   // radius
      0.85   // threshold — only deliberately hot pixels bloom
    );
    composer.addPass(bloom);
  }

  // Required, not optional: UnrealBloomPass blends additively into whatever it
  // renders to, so as a final pass it would blend onto a cleared screen and the
  // base render would never appear. OutputPass also performs the one and only
  // colour-space conversion for this pipeline.
  composer.addPass(new OutputPass());
  return { composer, bloom };
}

/* Frame loop with visibility pausing and an optional idle throttle. A camera
   feed plus WebGL is the hottest thing a phone browser can do, so drawing
   while nobody is looking is not free. */
export class FrameLoop {
  constructor(renderer, onFrame) {
    this.renderer = renderer;
    this.onFrame = onFrame;
    this.clock = new THREE.Clock();
    this.running = false;
    this.handleVisibility = () => {
      if (document.visibilityState === 'visible') this.start();
      else this.stop();
    };
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    this.renderer.setAnimationLoop((time, frame) => {
      // Clamp delta so a backgrounded tab does not resume with a huge jump.
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.onFrame(delta, this.clock.elapsedTime, frame);
    });
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  dispose() {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}

/* Smoothstep-eased tween helper used for camera moves and fades. */
export function ease(t) {
  const clamped = Math.min(Math.max(t, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}
