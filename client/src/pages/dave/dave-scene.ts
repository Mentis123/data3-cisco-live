import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import {
  createPhysicalBraid,
  createRecursiveFrameImages,
  createRecursiveMirrorImages,
  type MirrorLineLayer,
} from "./dave-physical";
import {
  createMirrorSystem,
  enableMirrorContent,
  REFLECTION_CONTENT_LAYER,
  type DaveMirrorSystem,
} from "./dave-mirrors";

const TAU = Math.PI * 2;
const LOOP_SECONDS = 8;
const CAMERA_FOV = 72;
const CUBE_SIZE = 3.3;
const HALF_CUBE = CUBE_SIZE / 2;
const CUBE_CENTRE_Y = HALF_CUBE * Math.sqrt(3);
const REFERENCE_CAMERA_RADIUS = CUBE_SIZE * 1.87;
const INTERACTIVE_CAMERA_RADIUS = CUBE_SIZE * 2.08;
const AUTO_ROTATE_RADIANS_PER_SECOND = TAU / LOOP_SECONDS;
const AUTO_ROTATE_FRAME_INTERVAL = 1 / 30;

type DaveSceneOptions = {
  fixedTime?: number;
  interactiveFraming?: boolean;
};

type PhysicalFrame = {
  group: THREE.Group;
  geometry: THREE.EdgesGeometry;
  layers: MirrorLineLayer[];
};

type CrystalAssembly = {
  root: THREE.Group;
  body: THREE.Group;
  braidFamily: THREE.Group;
  frameFamily: THREE.Group;
  mirrorSystem: DaveMirrorSystem;
};

function createBackgroundTexture() {
  const canvas = document.createElement("canvas");
  // Correct 2:1 equirectangular aspect. A 256 px cube conversion is ample for
  // a one-dimensional gradient and avoids a wasteful 1024 px environment cube.
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the Dave background texture.");

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#050a12");
  gradient.addColorStop(0.23, "#0e1b2b");
  gradient.addColorStop(0.31, "#182638");
  gradient.addColorStop(0.365, "#1c2c40");
  gradient.addColorStop(0.405, "#24384a");
  gradient.addColorStop(0.445, "#334650");
  gradient.addColorStop(0.465, "#3c4851");
  gradient.addColorStop(0.49, "#4c4c49");
  gradient.addColorStop(0.51, "#4c4c49");
  gradient.addColorStop(0.56, "#30343a");
  gradient.addColorStop(0.64, "#191d25");
  gradient.addColorStop(1, "#04050a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createCheckerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the Dave checker texture.");

  context.fillStyle = "#17191f";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#050b12";
  context.fillRect(0, 0, 128, 128);
  context.fillRect(128, 128, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(180, 180);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function createPhysicalFrame(): PhysicalFrame {
  const box = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const geometry = new THREE.EdgesGeometry(box);
  box.dispose();
  const layers: MirrorLineLayer[] = [
    {
      material: new THREE.LineBasicMaterial({
        color: "#d7e4e7", transparent: true, opacity: 0.72,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      }),
      scale: 1,
    },
  ];

  const group = new THREE.Group();
  group.name = "dave-physical-frame";
  layers.forEach((layer, index) => {
    const lines = new THREE.LineSegments(geometry, layer.material);
    lines.name = `dave-outer-edge-${index}`;
    lines.scale.setScalar(layer.scale);
    lines.renderOrder = 12 + index;
    group.add(lines);
  });
  enableMirrorContent(group);
  return { group, geometry, layers };
}

function createRotatingContactEmitters() {
  const group = new THREE.Group();
  group.name = "dave-body-mounted-contact-emitters";
  const emitters = [
    { position: [-1.42, -1.22, -1.5], colour: 0x46df82 },
    { position: [-1.5, -1.42, -1.22], colour: 0x468fe8 },
    { position: [-1.22, -1.5, -1.42], colour: 0xd05282 },
  ] as const;

  emitters.forEach(({ position, colour }) => {
    const light = new THREE.PointLight(colour, 12, 2.2, 2);
    light.position.set(position[0], position[1], position[2]);
    light.layers.enable(REFLECTION_CONTENT_LAYER);
    group.add(light);
  });
  return group;
}

function createCrystal(reflectionTextureSize: number): CrystalAssembly {
  const root = new THREE.Group();
  root.name = "dave-rigid-mirror-root";
  root.position.y = CUBE_CENTRE_Y;

  const body = new THREE.Group();
  body.name = "dave-body-diagonal-alignment";
  body.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 1, 1).normalize(),
    new THREE.Vector3(0, 1, 0),
  );
  root.add(body);

  const physicalBraid = createPhysicalBraid();
  enableMirrorContent(physicalBraid.group);
  physicalBraid.group.updateMatrix();
  const physicalFrame = createPhysicalFrame();
  const recursiveBraid = createRecursiveMirrorImages(
    physicalBraid.layers, physicalBraid.group.matrix, HALF_CUBE,
  );
  const recursiveFrame = createRecursiveFrameImages(
    physicalFrame.geometry, physicalFrame.layers, HALF_CUBE,
  );
  const mirrorSystem = createMirrorSystem(HALF_CUBE, reflectionTextureSize);

  const braidFamily = new THREE.Group();
  braidFamily.name = "dave-braid-source-and-images";
  braidFamily.add(physicalBraid.group, recursiveBraid);

  const frameFamily = new THREE.Group();
  frameFamily.name = "dave-frame-source-and-images";
  frameFamily.add(physicalFrame.group, recursiveFrame);

  body.add(
    braidFamily,
    frameFamily,
    mirrorSystem.group,
    createRotatingContactEmitters(),
  );

  return {
    root,
    body,
    braidFamily,
    frameFamily,
    mirrorSystem,
  };
}

function addPhysicalLights(scene: THREE.Scene) {
  const lights: THREE.Light[] = [
    new THREE.HemisphereLight(0xbfdfff, 0x160e1a, 0.65),
    new THREE.DirectionalLight(0xe9f7ff, 1.55),
    new THREE.DirectionalLight(0x5fb8c1, 0.62),
    new THREE.DirectionalLight(0xa95d82, 0.56),
  ];
  lights[1].position.set(4.5, 7, 5.5);
  lights[2].position.set(-5, 2.5, 3);
  lights[3].position.set(3, 1.5, -5);
  lights.forEach((light) => {
    light.layers.enable(3);
    scene.add(light);
  });
}

function chooseReflectionTextureSize(canvas: HTMLCanvasElement) {
  const longestSide = Math.max(canvas.clientWidth, canvas.clientHeight);
  if (longestSide >= 1100) return 768;
  if (longestSide >= 600) return 640;
  return 512;
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse((object) => {
    const renderable = object as THREE.Mesh & { material?: THREE.Material | THREE.Material[] };
    if (renderable.geometry) geometries.add(renderable.geometry);
    if (renderable.material) {
      const objectMaterials = Array.isArray(renderable.material)
        ? renderable.material : [renderable.material];
      objectMaterials.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value);
        });
      });
    }
  });
  if (scene.background instanceof THREE.Texture) textures.add(scene.background);
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export class DaveScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloomPass: UnrealBloomPass;
  private readonly outputPass: OutputPass;
  private readonly scene: THREE.Scene;
  private readonly backgroundTexture: THREE.Texture;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly crystal: THREE.Group;
  private readonly crystalBody: THREE.Group;
  private readonly braidFamily: THREE.Group;
  private readonly frameFamily: THREE.Group;
  private readonly mirrorSystem: DaveMirrorSystem;
  private readonly fixedTime?: number;
  private readonly cameraRadius: number;
  private animationFrame = 0;
  private lastAnimationAt = 0;
  private autoRotate = false;
  private lastRenderedAt = 0;
  private manualView = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: DaveSceneOptions = {}) {
    this.canvas = canvas;
    this.fixedTime = options.fixedTime;
    this.cameraRadius = options.interactiveFraming
      ? INTERACTIVE_CAMERA_RADIUS
      : REFERENCE_CAMERA_RADIUS;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false, powerPreference: "high-performance", stencil: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.backgroundTexture = createBackgroundTexture();
    this.scene.background = this.backgroundTexture;
    this.scene.fog = new THREE.Fog(0x171a1f, 15, 46);
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 1000);
    this.camera.position.set(0, CUBE_CENTRE_Y, this.cameraRadius);
    this.camera.lookAt(0, CUBE_CENTRE_Y, 0);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, CUBE_CENTRE_Y, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = CUBE_SIZE * 0.78;
    this.controls.maxDistance = CUBE_SIZE * 5.5;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI - 0.08;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    this.controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    // A two-finger drag translates the viewing target in screen space. A
    // pinch in the same gesture continues to dolly/zoom.
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    this.controls.addEventListener("start", this.takeManualControl);
    this.controls.addEventListener("change", this.renderControlledView);

    const checkerTexture = createCheckerTexture();
    checkerTexture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({
        map: checkerTexture,
        color: 0x4b4d52,
        roughness: 0.94,
        metalness: 0.02,
        fog: true,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    const floorGroup = new THREE.Group();
    floorGroup.rotation.y = Math.PI / 4;
    floorGroup.add(floor);
    this.scene.add(floorGroup);

    addPhysicalLights(this.scene);
    const crystal = createCrystal(chooseReflectionTextureSize(this.canvas));
    this.crystal = crystal.root;
    this.crystalBody = crystal.body;
    this.braidFamily = crystal.braidFamily;
    this.frameFamily = crystal.frameFamily;
    this.mirrorSystem = crystal.mirrorSystem;
    this.scene.add(this.crystal);

    const composerTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: Math.min(4, this.renderer.capabilities.maxSamples),
    });
    this.composer = new EffectComposer(this.renderer, composerTarget);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.18, 0.22, 0.92);
    this.outputPass = new OutputPass();
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);
    this.resize();
    this.renderAt(this.fixedTime ?? 0);
    this.canvas.dataset.ready = "true";
  }

  resize() {
    const width = Math.max(this.canvas.clientWidth, 1);
    const height = Math.max(this.canvas.clientHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio);
      this.composer.setPixelRatio(pixelRatio);
    }
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1
      ? Math.min(
        THREE.MathUtils.radToDeg(
          2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2) / aspect),
        ),
        140,
      ) : CAMERA_FOV;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    if (this.canvas.dataset.ready === "true") {
      this.renderAt(this.lastRenderedAt);
    }
  }

  renderAt(time: number) {
    this.lastRenderedAt = time;
    const loopTime = ((time % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
    const phase = loopTime / LOOP_SECONDS;

    // This is the only animated object transform: all mirrors, physical frame,
    // braid and their virtual-image coordinate system share the same rigid spin.
    this.crystal.rotation.y = THREE.MathUtils.degToRad(60.5) + phase * TAU;

    if (this.manualView) {
      this.controls.update();
    } else {
      const cameraHeight = CUBE_SIZE * (
        -0.00940651964861105
        + 0.148949643215445 * Math.sin(phase * TAU + 0.03130027235207833)
      );
      this.camera.position.set(
        0,
        CUBE_CENTRE_Y + cameraHeight,
        Math.sqrt(this.cameraRadius ** 2 - cameraHeight ** 2),
      );
      this.camera.lookAt(this.controls.target);
    }
    this.composer.render();
  }

  private readonly takeManualControl = () => {
    this.manualView = true;
  };

  private readonly renderControlledView = () => {
    // Fixed-time and reduced-motion renders have no animation loop, so camera
    // interactions must explicitly repaint the reflective scene.
    if (!this.animationFrame && !this.disposed) {
      this.composer.render();
    }
  };

  setBraidVisible(visible: boolean) {
    this.braidFamily.visible = visible;
    this.renderAt(this.lastRenderedAt);
  }

  setFrameVisible(visible: boolean) {
    this.frameFamily.visible = visible;
    this.renderAt(this.lastRenderedAt);
  }

  getPhysicsState() {
    this.crystal.updateMatrixWorld(true);
    const contact = new THREE.Vector3(-HALF_CUBE, -HALF_CUBE, -HALF_CUBE)
      .applyMatrix4(this.crystalBody.matrixWorld);
    return {
      activeTime: this.lastRenderedAt,
      rootYawDegrees: THREE.MathUtils.radToDeg(this.crystal.rotation.y),
      contact: contact.toArray(),
      braidVisible: this.braidFamily.visible,
      frameVisible: this.frameFamily.visible,
      mirrorCount: this.mirrorSystem.mirrors.length,
      autoRotate: this.autoRotate,
    };
  }

  setAutoRotate(enabled: boolean) {
    if (this.disposed || this.autoRotate === enabled) return;
    this.autoRotate = enabled;
    if (!enabled) {
      this.stop();
      this.composer.render();
      return;
    }

    this.lastAnimationAt = performance.now();
    this.start();
  }

  private start() {
    if (this.disposed || this.animationFrame || !this.autoRotate) return;
    const frame = (now: number) => {
      if (this.disposed || !this.autoRotate) {
        this.animationFrame = 0;
        return;
      }

      const elapsed = Math.min((now - this.lastAnimationAt) / 1000, 0.1);
      if (elapsed >= AUTO_ROTATE_FRAME_INTERVAL) {
        this.crystal.rotation.y = (
          this.crystal.rotation.y + elapsed * AUTO_ROTATE_RADIANS_PER_SECOND
        ) % TAU;
        this.lastAnimationAt = now;
        this.controls.update();
        this.composer.render();
      }
      this.animationFrame = window.requestAnimationFrame(frame);
    };
    this.animationFrame = window.requestAnimationFrame(frame);
  }

  stop() {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.controls.removeEventListener("start", this.takeManualControl);
    this.controls.removeEventListener("change", this.renderControlledView);
    this.controls.dispose();
    this.mirrorSystem.dispose();
    disposeScene(this.scene);
    this.bloomPass.dispose();
    this.outputPass.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    delete this.canvas.dataset.ready;
  }
}
