import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const TAU = Math.PI * 2;
const LOOP_SECONDS = 8;
const CAMERA_FOV = 72;
const CUBE_SIZE = 3.3;
const HALF_CUBE = CUBE_SIZE / 2;
const CUBE_CENTRE_Y = HALF_CUBE * Math.sqrt(3) + 0.08;

type DaveSceneOptions = {
  fixedTime?: number;
};

function hotColour(value: THREE.ColorRepresentation, multiplier: number) {
  return new THREE.Color(value).multiplyScalar(multiplier);
}

function createBackgroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1024;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create the Dave background texture.");
  }

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#182638");
  gradient.addColorStop(0.15, "#1b293c");
  gradient.addColorStop(0.23, "#1f3042");
  gradient.addColorStop(0.31, "#25364a");
  gradient.addColorStop(0.365, "#2c4051");
  gradient.addColorStop(0.405, "#364653");
  gradient.addColorStop(0.445, "#424e56");
  gradient.addColorStop(0.465, "#4a5053");
  gradient.addColorStop(0.49, "#4e4e4d");
  gradient.addColorStop(0.51, "#4b4b49");
  gradient.addColorStop(0.56, "#30343a");
  gradient.addColorStop(0.64, "#191d25");
  gradient.addColorStop(1, "#04050a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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

  if (!context) {
    throw new Error("Could not create the Dave checker texture.");
  }

  const dark = "#050b12";
  const light = "#17191f";
  context.fillStyle = light;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = dark;
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

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create the Dave glow texture.");
  }

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0.75)");
  gradient.addColorStop(0.08, "rgba(255,255,255,0.48)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function underlightAtPhase(phase: number) {
  const keys = [
    { at: 0, colour: new THREE.Color("#39dc6b") },
    { at: 0.18, colour: new THREE.Color("#45df8f") },
    { at: 0.275, colour: new THREE.Color("#438bea") },
    { at: 0.51, colour: new THREE.Color("#6658d9") },
    { at: 0.6, colour: new THREE.Color("#d05282") },
    { at: 0.8875, colour: new THREE.Color("#d64e69") },
    { at: 1, colour: new THREE.Color("#39dc6b") },
  ];

  for (let index = 1; index < keys.length; index += 1) {
    const right = keys[index];
    if (phase <= right.at) {
      const left = keys[index - 1];
      const mix = (phase - left.at) / Math.max(right.at - left.at, Number.EPSILON);
      return left.colour.clone().lerp(right.colour, THREE.MathUtils.smoothstep(mix, 0, 1));
    }
  }

  return keys[keys.length - 1].colour.clone();
}

function pushSegment(
  positions: number[],
  colours: number[],
  start: THREE.Vector3,
  end: THREE.Vector3,
  colour: THREE.Color,
) {
  positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  colours.push(colour.r, colour.g, colour.b, colour.r, colour.g, colour.b);
}

function coordinateVector(fixedAxis: number, fixed: number, uAxis: number, u: number, vAxis: number, v: number) {
  const values = [0, 0, 0];
  values[fixedAxis] = fixed;
  values[uAxis] = u;
  values[vAxis] = v;
  return new THREE.Vector3(values[0], values[1], values[2]);
}

function createFaceGrid() {
  const positions: number[] = [];
  const colours: number[] = [];
  const divisions = 3;
  const palette = [
    new THREE.Color("#d8f6ff"),
    new THREE.Color("#a4e8e3"),
    new THREE.Color("#ddafd1"),
  ];

  for (let fixedAxis = 0; fixedAxis < 3; fixedAxis += 1) {
    const [uAxis, vAxis] = [0, 1, 2].filter((axis) => axis !== fixedAxis);
    const colour = palette[fixedAxis];

    for (const sign of [-1, 1]) {
      const fixed = sign * HALF_CUBE;
      for (let index = 1; index < divisions; index += 1) {
        const offset = -HALF_CUBE + (index / divisions) * CUBE_SIZE;
        pushSegment(
          positions,
          colours,
          coordinateVector(fixedAxis, fixed, uAxis, offset, vAxis, -HALF_CUBE),
          coordinateVector(fixedAxis, fixed, uAxis, offset, vAxis, HALF_CUBE),
          colour,
        );
        pushSegment(
          positions,
          colours,
          coordinateVector(fixedAxis, fixed, uAxis, -HALF_CUBE, vAxis, offset),
          coordinateVector(fixedAxis, fixed, uAxis, HALF_CUBE, vAxis, offset),
          colour,
        );
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));

  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.21,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
}

function createVolumeLattice() {
  const positions: number[] = [];
  const colours: number[] = [];
  const offsets = [-HALF_CUBE, -HALF_CUBE / 3, HALF_CUBE / 3, HALF_CUBE];
  const palette = [
    new THREE.Color("#6fd4e8"),
    new THREE.Color("#d786b0"),
    new THREE.Color("#85c9aa"),
  ];

  for (let lineAxis = 0; lineAxis < 3; lineAxis += 1) {
    const [uAxis, vAxis] = [0, 1, 2].filter((axis) => axis !== lineAxis);
    const colour = palette[lineAxis];

    for (const u of offsets) {
      for (const v of offsets) {
        const start = coordinateVector(uAxis, u, vAxis, v, lineAxis, -HALF_CUBE);
        const end = coordinateVector(uAxis, u, vAxis, v, lineAxis, HALF_CUBE);
        pushSegment(positions, colours, start, end, colour);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));

  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.085,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
}

function createOuterEdges(boxGeometry: THREE.BoxGeometry) {
  const group = new THREE.Group();
  const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
  const layers = [
    { colour: "#b9c8cb", opacity: 0.72, scale: 1 },
    { colour: "#5797a2", opacity: 0.15, scale: 1.004 },
    { colour: "#986d7e", opacity: 0.12, scale: 1.008 },
  ];

  layers.forEach((layer, index) => {
    const lines = new THREE.LineSegments(
      edgeGeometry,
      new THREE.LineBasicMaterial({
        color: layer.colour,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    lines.name = `dave-outer-edge-${index}`;
    lines.scale.setScalar(layer.scale);
    group.add(lines);
  });

  return group;
}

function createNestedFrames() {
  const group = new THREE.Group();
  const frameScales = [0.78, 0.55, 0.32];
  const colours = ["#b7d9df", "#c59ab6", "#76b9ad"];

  frameScales.forEach((scale, index) => {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE));
    const frame = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: colours[index],
        transparent: true,
        opacity: 0.08 - index * 0.015,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    frame.scale.setScalar(scale);
    group.add(frame);
  });

  return group;
}

class FigureEightCurve extends THREE.Curve<THREE.Vector3> {
  public constructor() {
    super();
  }

  getPoint(progress: number, target = new THREE.Vector3()) {
    const angle = progress * TAU;
    return target.set(
      0.5 * Math.sin(angle * 2),
      0.78 * Math.sin(angle),
      0.3 * Math.cos(angle * 2),
    );
  }
}

function createStripeGeometry(
  tubeGeometry: THREE.TubeGeometry,
  tubularSegments: number,
  radialSegments: number,
) {
  const tubePositions = tubeGeometry.getAttribute("position");
  const positions: number[] = [];
  const colours: number[] = [];
  const palette = [
    new THREE.Color("#a6b8b8"),
    new THREE.Color("#3f7d78"),
    new THREE.Color("#8a4f63"),
    new THREE.Color("#4b6c84"),
    new THREE.Color("#8b6d4f"),
    new THREE.Color("#4c6d54"),
  ];
  const rowLength = radialSegments + 1;

  for (let radial = 0; radial < radialSegments; radial += 1) {
    const colour = palette[radial % palette.length];
    for (let segment = 0; segment < tubularSegments; segment += 1) {
      const first = segment * rowLength + radial;
      const second = (segment + 1) * rowLength + radial;
      positions.push(
        tubePositions.getX(first),
        tubePositions.getY(first),
        tubePositions.getZ(first),
        tubePositions.getX(second),
        tubePositions.getY(second),
        tubePositions.getZ(second),
      );
      colours.push(
        colour.r,
        colour.g,
        colour.b,
        colour.r,
        colour.g,
        colour.b,
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  return geometry;
}

function createKnot(
  geometry: THREE.TubeGeometry,
  stripeGeometry: THREE.BufferGeometry,
  solidMaterial: THREE.Material,
  stripeMaterial: THREE.Material,
) {
  const group = new THREE.Group();
  const solid = new THREE.Mesh(geometry, solidMaterial);
  const stripes = new THREE.LineSegments(stripeGeometry, stripeMaterial);
  stripes.scale.setScalar(1.012);
  group.add(solid, stripes);
  return group;
}

function createKnotField() {
  const group = new THREE.Group();
  const tubularSegments = 160;
  const radialSegments = 12;
  const knotGeometry = new THREE.TubeGeometry(
    new FigureEightCurve(),
    tubularSegments,
    0.145,
    radialSegments,
    true,
  );
  const stripeGeometry = createStripeGeometry(knotGeometry, tubularSegments, radialSegments);

  const heroSolid = new THREE.MeshBasicMaterial({
    color: "#080b13",
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const heroWire = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.62,
    blending: THREE.NormalBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const echoSolid = new THREE.MeshBasicMaterial({
    color: "#070a11",
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const echoWire = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.055,
    blending: THREE.NormalBlending,
    depthWrite: false,
    toneMapped: false,
  });

  const hero = createKnot(knotGeometry, stripeGeometry, heroSolid, heroWire);
  hero.name = "dave-hero-knot";
  hero.scale.multiplyScalar(1.04);
  hero.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(1, 1, 1).normalize(),
  );
  hero.rotateY(0.4);
  hero.traverse((object) => {
    object.renderOrder = 10;
  });
  group.add(hero);

  const offsets = [-1.08, 0, 1.08];
  let copyIndex = 0;
  for (const x of offsets) {
    for (const y of offsets) {
      for (const z of offsets) {
        if (x === 0 && y === 0 && z === 0) {
          continue;
        }

        const echo = createKnot(knotGeometry, stripeGeometry, echoSolid, echoWire);
        echo.position.set(x, y, z);
        echo.scale.multiplyScalar(0.38);
        echo.rotation.set(
          ((copyIndex * 5) % 9) * 0.19,
          ((copyIndex * 7) % 11) * 0.17,
          ((copyIndex * 3) % 7) * 0.13,
        );
        echo.traverse((object) => {
          object.renderOrder = 2;
        });
        group.add(echo);
        copyIndex += 1;
      }
    }
  }

  return group;
}

function createSparkles() {
  const positions = new Float32Array([
    -1.22, 0.84, 0.32,
    1.1, 0.72, -0.94,
    0.78, -0.92, 1.18,
    -0.44, 1.22, -0.88,
    1.28, -0.18, 0.48,
    -1.08, -0.55, -0.82,
    0.18, 1.35, 0.96,
    -0.76, 0.1, 1.28,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: hotColour("#eaffff", 2.1),
      size: 0.035,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
}

function createCrystal() {
  const spinner = new THREE.Group();
  spinner.position.y = CUBE_CENTRE_Y;

  const aligned = new THREE.Group();
  aligned.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 1, 1).normalize(),
    new THREE.Vector3(0, 1, 0),
  );
  spinner.add(aligned);

  const boxGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const glass = new THREE.Mesh(
    boxGeometry,
    new THREE.MeshBasicMaterial({
      color: "#010309",
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );

  aligned.add(
    glass,
    createVolumeLattice(),
    createFaceGrid(),
    createNestedFrames(),
    createKnotField(),
    createSparkles(),
    createOuterEdges(boxGeometry),
  );

  return spinner;
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  scene.traverse((object) => {
    const renderable = object as THREE.Mesh & { material?: THREE.Material | THREE.Material[] };
    if (renderable.geometry) {
      geometries.add(renderable.geometry);
    }
    if (renderable.material) {
      const objectMaterials = Array.isArray(renderable.material)
        ? renderable.material
        : [renderable.material];
      objectMaterials.forEach((material) => {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) {
            textures.add(value);
          }
        }
      });
    }
  });

  if (scene.background instanceof THREE.Texture) {
    textures.add(scene.background);
  }
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
  private readonly crystal: THREE.Group;
  private readonly heroKnot: THREE.Group;
  private readonly heroBaseQuaternion: THREE.Quaternion;
  private readonly outerEdgeMaterials: THREE.LineBasicMaterial[];
  private readonly groundGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly contactGlow: THREE.Sprite;
  private readonly fixedTime?: number;
  private animationFrame = 0;
  private startedAt = 0;
  private pausedAt = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: DaveSceneOptions = {}) {
    this.canvas = canvas;
    this.fixedTime = options.fixedTime;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.backgroundTexture = createBackgroundTexture();
    this.scene.background = this.backgroundTexture;
    this.scene.fog = new THREE.Fog(0x181d23, 15, 46);

    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 1000);
    this.camera.position.set(0, CUBE_CENTRE_Y, 6.14);
    this.camera.lookAt(0, CUBE_CENTRE_Y, 0);

    const checkerTexture = createCheckerTexture();
    checkerTexture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({
        map: checkerTexture,
        color: 0xffffff,
        fog: true,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    const floorGroup = new THREE.Group();
    floorGroup.rotation.y = Math.PI / 4;
    floorGroup.add(floor);
    this.scene.add(floorGroup);

    const glowTexture = createGlowTexture();
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: 0x4dff79,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.groundGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), glowMaterial);
    this.groundGlow.rotation.x = -Math.PI / 2;
    this.groundGlow.position.y = 0.014;
    this.scene.add(this.groundGlow);

    this.contactGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0x4dff79,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.contactGlow.position.set(0, 0.105, 0);
    this.contactGlow.scale.setScalar(0.1);
    this.scene.add(this.contactGlow);

    this.crystal = createCrystal();
    const heroKnot = this.crystal.getObjectByName("dave-hero-knot");
    if (!(heroKnot instanceof THREE.Group)) {
      throw new Error("Could not create the Dave hero knot.");
    }
    this.heroKnot = heroKnot;
    this.heroBaseQuaternion = heroKnot.quaternion.clone();
    this.outerEdgeMaterials = [0, 1, 2].map((index) => {
      const edge = this.crystal.getObjectByName(`dave-outer-edge-${index}`);
      if (!(edge instanceof THREE.LineSegments) || !(edge.material instanceof THREE.LineBasicMaterial)) {
        throw new Error("Could not create the Dave crystal rim.");
      }
      return edge.material;
    });
    this.scene.add(this.crystal);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(512, 512),
      0.17,
      0.22,
      0.92,
    );
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
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1
      ? Math.min(
        THREE.MathUtils.radToDeg(
          2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2) / aspect),
        ),
        140,
      )
      : CAMERA_FOV;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  renderAt(time: number) {
    const loopTime = ((time % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
    const phase = loopTime / LOOP_SECONDS;
    this.crystal.rotation.y = Math.PI / 3 + phase * TAU;
    this.crystal.position.y = CUBE_CENTRE_Y;
    this.heroKnot.quaternion.copy(this.heroBaseQuaternion);
    this.heroKnot.rotateY(Math.PI / 2 - phase * TAU);

    const rimFacing = Math.abs(Math.cos(phase * TAU));
    this.outerEdgeMaterials[0].opacity = 0.42 + 0.3 * rimFacing;
    this.outerEdgeMaterials[1].opacity = 0.11 + 0.04 * rimFacing;
    this.outerEdgeMaterials[2].opacity = 0.085 + 0.035 * rimFacing;

    const horizonWave = Math.sin(phase * TAU + 3.162);
    this.camera.position.y = CUBE_CENTRE_Y + 0.03 - 0.51 * horizonWave;
    this.camera.lookAt(0, CUBE_CENTRE_Y, 0);
    this.backgroundTexture.offset.y = (257 + 28 * horizonWave - 256) / 512;

    const underlight = underlightAtPhase(phase);
    this.groundGlow.material.color.copy(underlight);
    this.contactGlow.material.color.copy(underlight);
    this.groundGlow.material.opacity = 0.11 + Math.sin(phase * TAU * 2) * 0.025;

    this.composer.render();
  }

  start() {
    if (this.disposed || this.animationFrame || this.fixedTime !== undefined) {
      return;
    }

    this.startedAt = performance.now() - this.pausedAt * 1000;
    const frame = (now: number) => {
      if (this.disposed) {
        return;
      }
      const elapsed = (now - this.startedAt) / 1000;
      this.pausedAt = elapsed;
      this.renderAt(elapsed);
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
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stop();
    disposeScene(this.scene);
    this.bloomPass.dispose();
    this.outputPass.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    delete this.canvas.dataset.ready;
  }
}
