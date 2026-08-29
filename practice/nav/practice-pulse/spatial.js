import * as THREE from 'three';
import { createComposer, createRenderer, detectTier, FrameLoop, ease } from '../world3d/tiers.js';
import {
  CAPABILITY_SLOTS,
  COCKPIT_CONTRACT,
  DELIVERY_CAMERAS,
  MODEL_CONVENTION,
  controlDeckPositions,
  isMobileViewport,
  offeringPanelPositions,
  sceneLayoutForWidth,
  validateLayout
} from './pulse-layout.mjs';
import { MobileSpatialDeck } from './spatial-mobile.js';

const canvas = document.getElementById('spatialCanvas');
const stage = document.getElementById('spatialExperience');
const veil = document.getElementById('spatialVeil');
const labelsRoot = document.getElementById('spatialLabels');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const layoutIssues = validateLayout();

const STATUS_COLOURS = Object.freeze({
  Open: '#00AEFF',
  'Closed Won': '#00FF00',
  'Closed Lost': '#B30089'
});

const VEHICLE_COLOURS = Object.freeze({
  'Entitled Drawdown': '#9B9BFF',
  'Committed Capacity': '#00AEFF',
  'Standing Services': '#00FFFF'
});

const byId = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const FONT_STACK = 'Arial, Helvetica, sans-serif';

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fitText(ctx, value, maximumWidth, maximumSize, minimumSize = 18, weight = 700) {
  const text = String(value ?? '');
  let size = maximumSize;
  while (size > minimumSize) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maximumWidth) break;
    size -= 1;
  }
  return size;
}

function drawLabel(ctx, value, x, y, maximumWidth, maximumSize, colour = '#ffffff', weight = 700, align = 'left') {
  const size = fitText(ctx, value, maximumWidth, maximumSize, Math.max(13, maximumSize * 0.56), weight);
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colour;
  ctx.fillText(String(value ?? ''), x, y, maximumWidth);
  return size;
}

function wrapLabel(ctx, value, x, y, maximumWidth, lineHeight, maximumLines = 2, colour = '#ffffff', font = `700 28px ${FONT_STACK}`) {
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colour;
  const words = String(value ?? '').split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maximumWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  const visible = lines.slice(0, maximumLines);
  if (lines.length > maximumLines) {
    let last = visible[maximumLines - 1];
    while (last.length > 2 && ctx.measureText(`${last}…`).width > maximumWidth) last = last.slice(0, -1);
    visible[maximumLines - 1] = `${last}…`;
  }
  visible.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight, maximumWidth));
  return visible.length;
}

function createCanvasTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { canvas, texture, context: canvas.getContext('2d') };
}

function panelMaterial(texture, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
    depthWrite: opacity >= 0.98
  });
}

function seededRandom(seed = 87123) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function countsByStatus(records) {
  return {
    Open: records.filter(record => record.status === 'Open').length,
    'Closed Won': records.filter(record => record.status === 'Closed Won').length,
    'Closed Lost': records.filter(record => record.status === 'Closed Lost').length
  };
}

function groupBy(records, getter) {
  const groups = new Map();
  records.forEach(record => {
    const key = getter(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });
  return groups;
}

function confidence(record) {
  return Number.isFinite(record.confidence) ? record.confidence : -1;
}

function statusRank(status) {
  return status === 'Open' ? 0 : status === 'Closed Won' ? 1 : 2;
}

function visibleInScene(object) {
  for (let node = object; node; node = node.parent) {
    if (node.visible === false) return false;
  }
  return true;
}

function makeGlowMaterial(colour, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(colour).multiplyScalar(1.7),
    transparent: opacity < 1,
    opacity,
    blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: opacity >= 1,
    toneMapped: false
  });
}

function makeSurfaceMaterial(colour, opacity = 0.8) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colour).multiplyScalar(0.34),
    emissive: new THREE.Color(colour).multiplyScalar(0.3),
    emissiveIntensity: 1.25,
    metalness: 0.65,
    roughness: 0.28,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity > 0.7
  });
}

function edgeMesh(geometry, colour, opacity = 0.72) {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(colour).multiplyScalar(1.7),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    })
  );
}

class PracticePulseSpatial {
  constructor(bridge) {
    this.bridge = bridge;
    this.snapshot = null;
    this.tier = detectTier({ allowBloom: true });
    this.renderer = null;
    this.composer = null;
    this.bloom = null;
    this.scene = null;
    this.camera = null;
    this.frameLoop = null;
    this.world = new THREE.Group();
    this.practice = null;
    this.boardFrame = null;
    this.dataWall = null;
    this.sceneDeck = null;
    this.deckControls = new Map();
    this.dynamicBoardMeshes = [];
    this.dynamicBoardTargets = [];
    this.mobileDeck = null;
    this.sceneLayout = sceneLayoutForWidth(window.innerWidth);
    this.capabilities = new Map();
    this.offerings = new Map();
    this.offeringLinks = new THREE.Group();
    this.vehicleBars = new Map();
    this.raycastTargets = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerStart = null;
    this.dragging = false;
    this.cameraHomePosition = new THREE.Vector3(...DELIVERY_CAMERAS.desktop.position);
    this.cameraHomeTarget = new THREE.Vector3(...DELIVERY_CAMERAS.desktop.target);
    this.cameraDepthOffset = 0;
    this.cameraTarget = new THREE.Vector3(...DELIVERY_CAMERAS.desktop.target);
    this.cameraGoalTarget = this.cameraTarget.clone();
    this.cameraGoalPosition = new THREE.Vector3(...DELIVERY_CAMERAS.desktop.position);
    this.cameraTweenStart = null;
    this.cameraTweenFromPosition = new THREE.Vector3();
    this.cameraTweenFromTarget = new THREE.Vector3();
    this.cameraTweenDuration = reducedMotion ? 0 : 0.62;
    this.labelEntries = [];
    this.active = false;
    this.ready = false;
    this.bootStartedAt = performance.now();
    this.firstFrameAt = 0;
    this.geometryChecks = [];
    this.frameAlignment = null;
    this.lastRenderStats = null;
    this.handleResize = () => this.resize();
    this.handleViewChange = event => this.setActive(event.detail.experience === 'spatial');
  }

  async init() {
    if (layoutIssues.length) throw new Error(layoutIssues.join(' '));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000025);
    this.scene.fog = new THREE.FogExp2(0x000025, 0.026);

    this.camera = new THREE.PerspectiveCamera(DELIVERY_CAMERAS.desktop.fov, 1, 0.1, 90);
    this.camera.position.fromArray(DELIVERY_CAMERAS.desktop.position);
    this.camera.lookAt(this.cameraTarget);
    this.scene.add(this.camera);

    this.renderer = createRenderer(canvas, { tier: this.tier });
    this.renderer.info.autoReset = false;
    this.renderer.setClearColor(0x000025, 1);
    this.renderer.setSize(Math.max(stage.clientWidth, 1), Math.max(stage.clientHeight, 1), false);
    ({ composer: this.composer, bloom: this.bloom } = await createComposer(
      this.renderer,
      this.scene,
      this.camera,
      { bloom: this.tier.bloom }
    ));

    this.scene.add(new THREE.HemisphereLight(0x78dcff, 0x080818, 1.1));
    const key = new THREE.DirectionalLight(0x78dcff, 3.2);
    key.position.set(-6, 10, 12);
    this.scene.add(key);
    const magenta = new THREE.PointLight(0xff00ff, 13, 24, 2);
    magenta.position.set(6, 4, 4);
    this.scene.add(magenta);

    this.scene.add(this.world);
    this.buildEnvironment();
    this.buildBoardFrame();
    this.buildFlightDeck();
    this.buildPracticePedestal();
    this.buildCapabilities();
    this.buildVehiclePylons();
    this.mobileDeck = new MobileSpatialDeck(this.bridge, stage).install();
    this.bindInteraction();
    this.installDiagnostics();

    this.frameLoop = new FrameLoop(this.renderer, (delta, elapsed) => this.frame(delta, elapsed));
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('practicepulse:viewchange', this.handleViewChange);
    this.bridge.subscribe((snapshot, reason) => this.update(snapshot, reason));
    this.ready = true;
    this.setActive(this.bridge.getExperience() === 'spatial');
    this.resize();
  }

  buildEnvironment() {
    const floor = new THREE.GridHelper(42, 56, 0x00aeff, 0x13315f);
    floor.position.y = -0.04;
    floor.material.transparent = true;
    floor.material.opacity = 0.2;
    this.world.add(floor);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aeff,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    [8.5, 13, 18].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 5, 160), ringMaterial.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.015 + index * 0.015;
      this.world.add(ring);
    });

    const random = seededRandom();
    const particleCount = this.tier.mobile ? 180 : 420;
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (random() - 0.5) * 34;
      positions[index * 3 + 1] = random() * 13 + 0.3;
      positions[index * 3 + 2] = (random() - 0.5) * 22 - 3;
      phases[index] = random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColour: { value: new THREE.Color(0x78dcff) } },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;
        void main(){
          vec3 p=position;
          p.y+=sin(uTime*.35+aPhase)*.18;
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_PointSize=clamp(16.0/-mv.z,1.0,3.2);
          gl_Position=projectionMatrix*mv;
          vAlpha=.28+.36*(.5+.5*sin(uTime*.7+aPhase));
        }`,
      fragmentShader: `
        uniform vec3 uColour;
        varying float vAlpha;
        void main(){
          vec2 uv=gl_PointCoord-.5;
          float d=length(uv);
          if(d>.5) discard;
          gl_FragColor=vec4(uColour,(1.0-smoothstep(.12,.5,d))*vAlpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.world.add(this.particles);
  }

  buildBoardFrame() {
    const group = new THREE.Group();
    group.name = 'SceneDataWall';

    const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const body = new THREE.Mesh(
      bodyGeometry,
      new THREE.MeshPhysicalMaterial({
        color: 0x03072a,
        emissive: 0x001331,
        emissiveIntensity: 0.72,
        transparent: true,
        opacity: 0.94,
        metalness: 0.78,
        roughness: 0.22,
        depthWrite: true
      })
    );
    body.name = 'DataWallBody';
    group.add(body);

    const surface = createCanvasTexture(2048, 910);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), panelMaterial(surface.texture));
    screen.name = 'DataWallScreen';
    screen.position.z = 0.205;
    group.add(screen);

    const rails = Array.from({ length: 4 }, (_, index) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), makeGlowMaterial(index < 2 ? '#00FFFF' : '#00AEFF', 0.82));
      rail.name = `DataWallRail:${index}`;
      group.add(rail);
      return rail;
    });

    const supports = [-1, 1].map((side, index) => {
      const support = new THREE.Group();
      support.name = `DataWallSupport:${index}`;
      const spineGeometry = new THREE.BoxGeometry(1, 1, 1);
      const spine = new THREE.Mesh(spineGeometry, makeSurfaceMaterial('#00AEFF', 0.92));
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.48, 0.18, 24), makeSurfaceMaterial('#9B9BFF', 0.96));
      support.add(spine, edgeMesh(spineGeometry, '#00FFFF', 0.5), foot);
      group.add(support);
      support.userData.side = side;
      support.userData.spine = spine;
      support.userData.foot = foot;
      return support;
    });

    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      makeGlowMaterial('#78DCFF', 0.28)
    );
    scan.position.z = 0.31;
    scan.visible = false;
    group.add(scan);

    const dataLayer = new THREE.Group();
    dataLayer.name = 'DataWallDepthLayers';
    group.add(dataLayer);

    this.boardScan = scan;
    this.boardFrame = group;
    this.dataWall = { group, body, screen, surface, rails, supports, dataLayer };
    this.world.add(group);
    this.configureSceneLayout();
    this.geometryChecks.push({ id: 'data-wall-supports', pass: supports.length === 2, actual: supports.length });
  }

  buildFlightDeck() {
    const group = new THREE.Group();
    group.name = 'PhysicalFlightDeck';
    const [width, height, depth] = MODEL_CONVENTION.consoleSize;
    const shellShape = new THREE.Shape();
    shellShape.moveTo(-width / 2, -height / 2);
    shellShape.lineTo(width / 2, -height / 2);
    shellShape.lineTo(width / 2 - 0.62, height / 2);
    shellShape.lineTo(-width / 2 + 0.62, height / 2);
    shellShape.closePath();
    const shellGeometry = new THREE.ExtrudeGeometry(shellShape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.08,
      bevelThickness: 0.06,
      curveSegments: 3
    });
    shellGeometry.translate(0, 0, -depth / 2);
    const shell = new THREE.Mesh(shellGeometry, makeSurfaceMaterial('#08084A', 0.98));
    shell.name = 'FlightDeckShell';
    group.add(shell, edgeMesh(shellGeometry, '#00AEFF', 0.42));

    const centreSpine = new THREE.Mesh(new THREE.BoxGeometry(0.1, height - 0.35, depth + 0.08), makeGlowMaterial('#00FFFF', 0.4));
    centreSpine.position.z = 0.04;
    group.add(centreSpine);

    const practice = this.createDeckControl({
      id: 'practice',
      label: 'Data & AI',
      kind: 'capability',
      value: 'all',
      colour: '#9B9BFF',
      width: 2.65,
      height: 0.78,
      position: [0, -0.92, 0.27]
    });
    group.add(practice.group);
    this.deckControls.set('all', practice);

    controlDeckPositions(CAPABILITY_SLOTS.length).forEach((position, index) => {
      const slot = CAPABILITY_SLOTS[index];
      const control = this.createDeckControl({
        id: `capability:${slot.name}`,
        label: slot.name,
        kind: 'capability',
        value: slot.name,
        colour: this.capabilityColour(slot.name),
        width: 1.9,
        height: 0.9,
        position: [position[0], position[1], position[2] + 0.28]
      });
      group.add(control.group);
      this.deckControls.set(slot.name, control);
    });

    group.position.fromArray(MODEL_CONVENTION.consoleCentre);
    group.rotation.x = MODEL_CONVENTION.consoleTiltRadians;
    this.sceneDeck = { group, shell, width, height, depth };
    this.world.add(group);
    this.configureSceneLayout();
    this.geometryChecks.push({ id: 'physical-console-controls', pass: this.deckControls.size === 6, actual: this.deckControls.size });
  }

  createDeckControl({ id, label, kind, value, colour, width, height, position }) {
    const group = new THREE.Group();
    group.name = `FlightDeckControl:${id}`;
    group.position.fromArray(position);
    group.userData.baseZ = position[2];
    group.userData.homePosition = new THREE.Vector3(...position);
    const geometry = new THREE.BoxGeometry(width, height, 0.18);
    const body = new THREE.Mesh(geometry, makeSurfaceMaterial(colour, 0.94));
    body.userData.kind = kind;
    body.userData.capability = kind === 'capability' ? value : undefined;
    body.userData.value = value;
    group.add(body, edgeMesh(geometry, colour, 0.62));
    const surface = createCanvasTexture(640, 270);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, height - 0.08), panelMaterial(surface.texture));
    face.position.z = 0.095;
    group.add(face);
    this.raycastTargets.push(body);
    return { group, body, face, surface, label, colour, value, width, height };
  }

  configureSceneLayout() {
    if (!this.dataWall) return;
    const layout = sceneLayoutForWidth(window.innerWidth);
    const mobile = layout === sceneLayoutForWidth(390);
    this.sceneLayout = layout;
    const [width, height] = layout.boardSize;
    const depth = MODEL_CONVENTION.boardSize[2];
    this.dataWall.group.position.fromArray(layout.boardCentre);
    this.dataWall.body.scale.set(width, height, depth);
    this.dataWall.screen.scale.set(width - 0.34, height - 0.34, 1);
    this.dataWall.screen.position.z = depth / 2 + 0.026;
    const [bottomRail, topRail, leftRail, rightRail] = this.dataWall.rails;
    [bottomRail, topRail].forEach((rail, index) => {
      rail.scale.set(width + 0.34, 0.055, 0.075);
      rail.position.set(0, (index ? 1 : -1) * (height / 2 + 0.08), depth / 2 + 0.07);
    });
    [leftRail, rightRail].forEach((rail, index) => {
      rail.scale.set(0.055, height + 0.34, 0.075);
      rail.position.set((index ? 1 : -1) * (width / 2 + 0.08), 0, depth / 2 + 0.07);
    });
    this.dataWall.supports.forEach(support => {
      const supportHeight = layout.boardCentre[1] - height / 2 + 0.18;
      support.position.set(support.userData.side * (width / 2 + 0.22), -height / 2 - supportHeight / 2, -0.12);
      support.userData.spine.scale.set(0.15, supportHeight, 0.24);
      support.userData.foot.position.y = -supportHeight / 2 - 0.05;
    });
    this.boardScan.scale.set(width - 0.5, 0.03, 1);
    this.boardScan.position.z = depth / 2 + 0.12;
    this.boardScan.userData.scanRange = height / 2 - 0.24;

    if (this.sceneDeck) {
      this.sceneDeck.group.position.fromArray(layout.consoleCentre);
      this.sceneDeck.group.scale.setScalar(layout.consoleScale);
      this.sceneDeck.group.rotation.x = MODEL_CONVENTION.consoleTiltRadians;
      const capabilityControls = CAPABILITY_SLOTS.map(slot => this.deckControls.get(slot.name)).filter(Boolean);
      if (mobile) {
        const positions = [
          [-3.05, 0.72, 0.36], [0, 0.72, 0.4], [3.05, 0.72, 0.36],
          [-1.62, -0.18, 0.36], [1.62, -0.18, 0.36]
        ];
        capabilityControls.forEach((control, index) => {
          control.group.position.fromArray(positions[index]);
          control.group.userData.baseZ = positions[index][2];
          control.group.scale.set(1.24, 1.02, 1);
        });
        const practice = this.deckControls.get('all');
        if (practice) {
          practice.group.position.set(0, -1.04, 0.38);
          practice.group.userData.baseZ = 0.38;
          practice.group.scale.set(1.2, 1, 1);
        }
      } else {
        this.deckControls.forEach(control => {
          control.group.position.copy(control.group.userData.homePosition);
          control.group.userData.baseZ = control.group.userData.homePosition.z;
          control.group.scale.set(1, 1, 1);
        });
      }
    }
    // The compact mobile deck reproduces the console exactly — practice button
    // plus five capability controls — as the chip rail, so on a phone the
    // scene-authored console is pure duplication. Hiding it hands the bottom of
    // the viewport back to the pedestal and the totem arc. The command wall
    // stays: it is the scene's subject, not chrome, and the camera is framed on
    // it. The sheet gives the same numbers as real, linkable DOM on demand.
    const compactChrome = isMobileViewport(Math.max(window.innerWidth, 1), coarsePointer);
    if (this.sceneDeck) this.sceneDeck.group.visible = !compactChrome;
    if (this.snapshot) {
      this.drawDataWall();
      this.updateFlightDeck();
    }
    // With the console hidden the scene can sit slightly lower, so the command
    // wall's top rail clears the compact control strip instead of running
    // under it.
    if (compactChrome) this.world.position.y = -0.34;
    else if (mobile) this.world.position.y = -0.05;
    else this.world.position.y = 0;
  }

  projectedRect(points) {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    const projected = points.map(point => point.clone().project(this.camera));
    const xs = projected.map(point => (point.x * 0.5 + 0.5) * width);
    const ys = projected.map(point => (-point.y * 0.5 + 0.5) * height);
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  syncBoardFrameToDom() {
    if (!this.dataWall || !this.sceneDeck || stage.hidden) return;
    this.scene.updateMatrixWorld(true);
    const [width, height] = this.sceneLayout.boardSize;
    const boardPoints = [
      [-width / 2, -height / 2, 0.25], [width / 2, -height / 2, 0.25],
      [-width / 2, height / 2, 0.25], [width / 2, height / 2, 0.25]
    ].map(point => this.dataWall.group.localToWorld(new THREE.Vector3(...point)));
    const consoleWidth = this.sceneDeck.width / 2;
    const consoleHeight = this.sceneDeck.height / 2;
    const consolePoints = [
      [-consoleWidth, -consoleHeight, 0.2], [consoleWidth, -consoleHeight, 0.2],
      [-consoleWidth + 0.62, consoleHeight, 0.2], [consoleWidth - 0.62, consoleHeight, 0.2]
    ].map(point => this.sceneDeck.group.localToWorld(new THREE.Vector3(...point)));
    const boardRect = this.projectedRect(boardPoints);
    const consoleRect = this.projectedRect(consolePoints);
    const separation = consoleRect.top - boardRect.bottom;
    const stageWidth = Math.max(stage.clientWidth, 1);
    const stageHeight = Math.max(stage.clientHeight, 1);
    const desktop = window.innerWidth >= 720;
    const criticalTypePx = (desktop ? 22 / 2048 : 24 / 900) * boardRect.width;
    const readable = !desktop || (
      boardRect.width >= COCKPIT_CONTRACT.desktop.minimumMissionWidthPx &&
      boardRect.height >= COCKPIT_CONTRACT.desktop.minimumMissionHeightPx &&
      consoleRect.height >= COCKPIT_CONTRACT.desktop.minimumConsoleHeightPx &&
      consoleRect.height <= COCKPIT_CONTRACT.desktop.maximumConsoleHeightPx &&
      criticalTypePx >= COCKPIT_CONTRACT.desktop.minimumCriticalTypePx
    );
    this.frameAlignment = {
      pass: boardRect.left >= -2 && boardRect.right <= stageWidth + 2 && boardRect.top >= 34 && separation >= 8 && consoleRect.bottom <= stageHeight + 12 && readable,
      displayPx: [Math.round(boardRect.width), Math.round(boardRect.height)],
      screenRectPx: [Math.round(boardRect.left), Math.round(boardRect.top), Math.round(boardRect.right), Math.round(boardRect.bottom)],
      consoleRectPx: [Math.round(consoleRect.left), Math.round(consoleRect.top), Math.round(consoleRect.right), Math.round(consoleRect.bottom)],
      separationPx: Number(separation.toFixed(2)),
      criticalTypePx: Number(criticalTypePx.toFixed(2)),
      sceneAuthored: true
    };
  }

  drawDataWall() {
    if (!this.snapshot || !this.dataWall) return;
    const mobile = window.innerWidth < 720;
    const width = mobile ? 900 : 2048;
    const height = mobile ? 1200 : 910;
    const { canvas, context: ctx, texture } = this.dataWall.surface;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.clearRect(0, 0, width, height);
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#050836');
    background.addColorStop(0.55, '#03052a');
    background.addColorStop(1, '#07103e');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(0,255,255,.42)';
    ctx.lineWidth = mobile ? 5 : 4;
    roundedRect(ctx, 12, 12, width - 24, height - 24, mobile ? 34 : 26);
    ctx.stroke();

    const records = this.snapshot.filteredRecords;
    const counts = countsByStatus(records);
    const accounts = new Set(records.map(record => record.account));
    const offerings = new Set(records.map(record => record.offering));
    const capability = this.snapshot.filters.capability;
    const offering = this.snapshot.filters.offering;
    const scopeTitle = offering !== 'all' ? offering : capability !== 'all' ? capability : 'Data & AI';
    const scopeKind = offering !== 'all' ? 'Offering signal' : capability !== 'all' ? 'Capability command wall' : 'Practice command wall';
    const context = [
      capability === 'all' ? 'All capabilities' : capability,
      offering === 'all' ? 'all offerings' : offering,
      this.snapshot.filters.vehicle === 'all' ? 'all annuity vehicles' : this.snapshot.filters.vehicle
    ].join(' · ');
    const openRecords = records.filter(record => record.status === 'Open');
    const accountGroups = [...groupBy(openRecords, record => record.account).entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, mobile ? 3 : 4);
    const priority = records.slice().sort((a, b) => statusRank(a.status) - statusRank(b.status) || confidence(b) - confidence(a)).slice(0, mobile ? 3 : 4);
    const vehicleGroups = groupBy(records, record => record.vehicle);
    const kpis = [
      ['Total', records.length, 'filtered opportunities', '#9B9BFF'],
      ['Open now', counts.Open, `${records.length ? Math.round(counts.Open / records.length * 100) : 0}% of field`, '#00AEFF'],
      ['Won', counts['Closed Won'], 'closed won', '#00FF00'],
      ['Accounts', accounts.size, 'customer concentration', '#00FFFF'],
      ['Offerings', offerings.size, 'commercial motions', '#FF00FF']
    ];
    const layout = { kpis: [], lifecycle: [], vehicles: [], accounts: [], records: [] };

    const panel = (x, y, panelWidth, panelHeight, title, meta = '') => {
      ctx.fillStyle = 'rgba(0,0,25,.66)';
      roundedRect(ctx, x, y, panelWidth, panelHeight, mobile ? 24 : 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,220,255,.24)';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawLabel(ctx, title.toUpperCase(), x + 22, y + (mobile ? 44 : 38), panelWidth - 44, mobile ? 24 : 22, '#78DCFF', 800);
      if (meta) drawLabel(ctx, meta, x + panelWidth - 20, y + (mobile ? 43 : 37), panelWidth * 0.42, mobile ? 20 : 18, '#8EA1BA', 600, 'right');
    };

    if (!mobile) {
      drawLabel(ctx, scopeKind.toUpperCase(), 72, 70, 1180, 22, '#78DCFF', 800);
      drawLabel(ctx, scopeTitle, 72, 140, 1400, 66, '#FFFFFF', 800);
      drawLabel(ctx, context, 74, 182, 1320, 24, '#BAC9DA', 500);
      drawLabel(ctx, `${records.length} of ${this.snapshot.records.length} records in field`, width - 70, 70, 560, 20, '#AFC0D3', 700, 'right');

      const margin = 70;
      const gap = 16;
      const kpiY = 215;
      const kpiHeight = 132;
      const kpiWidth = (width - margin * 2 - gap * 4) / 5;
      kpis.forEach(([label, value, note, colour], index) => {
        const x = margin + index * (kpiWidth + gap);
        ctx.fillStyle = 'rgba(10,14,59,.82)';
        roundedRect(ctx, x, kpiY, kpiWidth, kpiHeight, 18);
        ctx.fill();
        ctx.strokeStyle = colour;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        drawLabel(ctx, label.toUpperCase(), x + 22, kpiY + 34, kpiWidth - 44, 19, colour, 800);
        drawLabel(ctx, value, x + 22, kpiY + 88, kpiWidth - 44, 50, '#FFFFFF', 800);
        drawLabel(ctx, note, x + 22, kpiY + 116, kpiWidth - 44, 17, '#AFC0D3', 500);
        layout.kpis.push({ x, y: kpiY, w: kpiWidth, h: kpiHeight, colour });
      });

      const moduleY = 375;
      const moduleHeight = 405;
      const lifecyclePanel = { x: 70, y: moduleY, w: 420, h: moduleHeight };
      const vehiclePanel = { x: 507, y: moduleY, w: 285, h: moduleHeight };
      const accountPanel = { x: 809, y: moduleY, w: 500, h: moduleHeight };
      const recordPanel = { x: 1326, y: moduleY, w: 652, h: moduleHeight };
      panel(lifecyclePanel.x, lifecyclePanel.y, lifecyclePanel.w, lifecyclePanel.h, 'Lifecycle', String(records.length));
      panel(vehiclePanel.x, vehiclePanel.y, vehiclePanel.w, vehiclePanel.h, 'Annuity mix', '3 vehicles');
      panel(accountPanel.x, accountPanel.y, accountPanel.w, accountPanel.h, 'Open accounts', `${new Set(openRecords.map(record => record.account)).size} accounts`);
      panel(recordPanel.x, recordPanel.y, recordPanel.w, recordPanel.h, 'Priority records', 'SFDC');

      const total = Math.max(records.length, 1);
      Object.entries(counts).forEach(([status, value], index) => {
        const y = moduleY + 105 + index * 82;
        const label = status === 'Closed Won' ? 'Won' : status === 'Closed Lost' ? 'Lost' : status;
        drawLabel(ctx, label, lifecyclePanel.x + 24, y + 8, 95, 21, '#C2CFDE', 600);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        roundedRect(ctx, lifecyclePanel.x + 130, y - 5, 220, 14, 7);
        ctx.fill();
        const fillWidth = Math.max(4, 220 * value / total);
        ctx.fillStyle = STATUS_COLOURS[status];
        roundedRect(ctx, lifecyclePanel.x + 130, y - 5, fillWidth, 14, 7);
        ctx.fill();
        drawLabel(ctx, value, lifecyclePanel.x + lifecyclePanel.w - 24, y + 9, 48, 22, '#FFFFFF', 800, 'right');
        layout.lifecycle.push({ x: lifecyclePanel.x + 130, y: y - 5, w: fillWidth, h: 14, colour: STATUS_COLOURS[status], status });
      });

      const maxVehicle = Math.max(...Object.keys(VEHICLE_COLOURS).map(name => (vehicleGroups.get(name) || []).length), 1);
      Object.entries(VEHICLE_COLOURS).forEach(([name, colour], index) => {
        const value = (vehicleGroups.get(name) || []).length;
        const barHeight = Math.max(10, value / maxVehicle * 190);
        const x = vehiclePanel.x + 58 + index * 74;
        const bottom = moduleY + 320;
        ctx.fillStyle = colour;
        roundedRect(ctx, x, bottom - barHeight, 32, barHeight, 9);
        ctx.fill();
        drawLabel(ctx, value, x + 16, bottom + 32, 54, 22, '#FFFFFF', 800, 'center');
        drawLabel(ctx, name.replace('Entitled ', '').replace('Committed ', '').replace('Standing ', ''), x + 16, bottom + 60, 78, 15, '#98A9BF', 600, 'center');
        layout.vehicles.push({ x, y: bottom - barHeight, w: 32, h: barHeight, colour, vehicle: name });
      });

      const maxAccount = Math.max(...accountGroups.map(([, group]) => group.length), 1);
      accountGroups.forEach(([account, group], index) => {
        const y = moduleY + 92 + index * 75;
        drawLabel(ctx, account, accountPanel.x + 24, y, accountPanel.w - 95, 21, '#FFFFFF', 700);
        drawLabel(ctx, group.length, accountPanel.x + accountPanel.w - 24, y, 45, 21, '#00FFFF', 800, 'right');
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        roundedRect(ctx, accountPanel.x + 24, y + 20, accountPanel.w - 48, 11, 6);
        ctx.fill();
        const fillWidth = (accountPanel.w - 48) * group.length / maxAccount;
        const gradient = ctx.createLinearGradient(accountPanel.x + 24, 0, accountPanel.x + accountPanel.w - 24, 0);
        gradient.addColorStop(0, '#00AEFF');
        gradient.addColorStop(1, '#00FFFF');
        ctx.fillStyle = gradient;
        roundedRect(ctx, accountPanel.x + 24, y + 20, fillWidth, 11, 6);
        ctx.fill();
        layout.accounts.push({ x: accountPanel.x + 24, y: y + 20, w: fillWidth, h: 11, colour: '#00FFFF', account });
      });

      priority.forEach((record, index) => {
        const y = moduleY + 65 + index * 78;
        ctx.fillStyle = 'rgba(255,255,255,.025)';
        roundedRect(ctx, recordPanel.x + 18, y, recordPanel.w - 36, 66, 11);
        ctx.fill();
        ctx.fillStyle = STATUS_COLOURS[record.status];
        roundedRect(ctx, recordPanel.x + 28, y + 12, 7, 42, 4);
        ctx.fill();
        drawLabel(ctx, record.account, recordPanel.x + 52, y + 29, recordPanel.w - 135, 21, '#FFFFFF', 700);
        drawLabel(ctx, record.opportunity, recordPanel.x + 52, y + 52, recordPanel.w - 135, 17, '#AFC0D3', 500);
        drawLabel(ctx, record.id ? '↗' : '—', recordPanel.x + recordPanel.w - 42, y + 41, 26, 24, '#78DCFF', 700, 'center');
        layout.records.push({ x: recordPanel.x + 18, y, w: recordPanel.w - 36, h: 66, colour: STATUS_COLOURS[record.status], record });
      });
      drawLabel(ctx, 'Counts shown · amount and detailed stage are absent from this extract', width / 2, 848, width - 160, 17, '#8497AF', 500, 'center');
    } else {
      drawLabel(ctx, scopeKind.toUpperCase(), 48, 68, 780, 24, '#78DCFF', 800);
      drawLabel(ctx, scopeTitle, 48, 132, 804, 48, '#FFFFFF', 800);
      drawLabel(ctx, context, 48, 176, 804, 22, '#BAC9DA', 500);
      drawLabel(ctx, `${records.length} / ${this.snapshot.records.length} records`, 850, 66, 300, 19, '#AFC0D3', 700, 'right');

      const kpiRows = [[0, 1, 2], [3, 4]];
      let kpiY = 220;
      kpiRows.forEach((row, rowIndex) => {
        const gap = 18;
        const cardWidth = rowIndex === 0 ? (804 - gap * 2) / 3 : (804 - gap) / 2;
        row.forEach((kpiIndex, column) => {
          const [label, value, note, colour] = kpis[kpiIndex];
          const x = 48 + column * (cardWidth + gap);
          const cardHeight = rowIndex === 0 ? 126 : 112;
          ctx.fillStyle = 'rgba(10,14,59,.84)';
          roundedRect(ctx, x, kpiY, cardWidth, cardHeight, 20);
          ctx.fill();
          ctx.strokeStyle = colour;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.globalAlpha = 1;
          drawLabel(ctx, label.toUpperCase(), x + 18, kpiY + 32, cardWidth - 36, 20, colour, 800);
          drawLabel(ctx, value, x + 18, kpiY + 78, cardWidth - 36, 44, '#FFFFFF', 800);
          drawLabel(ctx, note, x + 18, kpiY + cardHeight - 16, cardWidth - 36, 16, '#AFC0D3', 500);
          layout.kpis.push({ x, y: kpiY, w: cardWidth, h: cardHeight, colour });
        });
        kpiY += rowIndex === 0 ? 146 : 132;
      });

      panel(48, 500, 804, 220, 'Lifecycle', String(records.length));
      const total = Math.max(records.length, 1);
      Object.entries(counts).forEach(([status, value], index) => {
        const y = 580 + index * 48;
        const label = status === 'Closed Won' ? 'Won' : status === 'Closed Lost' ? 'Lost' : status;
        drawLabel(ctx, label, 72, y + 7, 120, 23, '#C2CFDE', 600);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        roundedRect(ctx, 196, y - 6, 550, 15, 8);
        ctx.fill();
        const fillWidth = Math.max(5, 550 * value / total);
        ctx.fillStyle = STATUS_COLOURS[status];
        roundedRect(ctx, 196, y - 6, fillWidth, 15, 8);
        ctx.fill();
        drawLabel(ctx, value, 820, y + 8, 55, 22, '#FFFFFF', 800, 'right');
        layout.lifecycle.push({ x: 196, y: y - 6, w: fillWidth, h: 15, colour: STATUS_COLOURS[status], status });
      });

      panel(48, 744, 804, 190, 'Annuity mix', '3 vehicles');
      const maxVehicle = Math.max(...Object.keys(VEHICLE_COLOURS).map(name => (vehicleGroups.get(name) || []).length), 1);
      Object.entries(VEHICLE_COLOURS).forEach(([name, colour], index) => {
        const value = (vehicleGroups.get(name) || []).length;
        const barWidth = Math.max(8, 170 * value / maxVehicle);
        const y = 806 + index * 38;
        drawLabel(ctx, name.replace('Entitled ', '').replace('Committed ', '').replace('Standing ', ''), 72, y + 9, 170, 20, '#C2CFDE', 600);
        ctx.fillStyle = colour;
        roundedRect(ctx, 260, y - 5, barWidth, 15, 8);
        ctx.fill();
        drawLabel(ctx, value, 820, y + 10, 55, 22, '#FFFFFF', 800, 'right');
        layout.vehicles.push({ x: 260, y: y - 5, w: barWidth, h: 15, colour, vehicle: name });
      });

      panel(48, 958, 804, 190, 'Priority records', 'SFDC');
      priority.forEach((record, index) => {
        const y = 1010 + index * 43;
        ctx.fillStyle = STATUS_COLOURS[record.status];
        roundedRect(ctx, 72, y - 16, 7, 32, 4);
        ctx.fill();
        drawLabel(ctx, record.account, 96, y - 1, 300, 21, '#FFFFFF', 700);
        drawLabel(ctx, record.opportunity, 390, y - 1, 390, 18, '#AFC0D3', 500);
        layout.records.push({ x: 66, y: y - 23, w: 760, h: 40, colour: STATUS_COLOURS[record.status], record });
      });
    }

    texture.needsUpdate = true;
    this.syncDynamicBoardGeometry(layout, width, height);
  }

  syncDynamicBoardGeometry(layout, canvasWidth, canvasHeight) {
    if (!this.dataWall) return;
    this.dynamicBoardTargets.forEach(target => {
      const index = this.raycastTargets.indexOf(target);
      if (index >= 0) this.raycastTargets.splice(index, 1);
    });
    this.dynamicBoardTargets = [];
    this.dynamicBoardMeshes.forEach(object => {
      this.dataWall.dataLayer.remove(object);
      object.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.dynamicBoardMeshes = [];
    const [boardWidth, boardHeight] = this.sceneLayout.boardSize;
    const innerWidth = boardWidth - 0.34;
    const innerHeight = boardHeight - 0.34;
    const toLocal = rect => ({
      x: ((rect.x + rect.w / 2) / canvasWidth - 0.5) * innerWidth,
      y: (0.5 - (rect.y + rect.h / 2) / canvasHeight) * innerHeight,
      width: rect.w / canvasWidth * innerWidth,
      height: rect.h / canvasHeight * innerHeight
    });
    const addPhysical = (rect, colour, depth, opacity, interaction = null) => {
      const box = toLocal(rect);
      const geometry = new THREE.BoxGeometry(box.width, box.height, depth);
      const mesh = new THREE.Mesh(geometry, makeSurfaceMaterial(colour, opacity));
      mesh.position.set(box.x, box.y, MODEL_CONVENTION.boardSize[2] / 2 + 0.055 + depth / 2);
      if (interaction) Object.assign(mesh.userData, interaction);
      const group = new THREE.Group();
      group.add(mesh, edgeMesh(geometry, colour, opacity < 0.5 ? 0.32 : 0.62));
      this.dataWall.dataLayer.add(group);
      this.dynamicBoardMeshes.push(group);
      if (interaction) {
        this.dynamicBoardTargets.push(mesh);
        this.raycastTargets.push(mesh);
      }
      return mesh;
    };
    layout.kpis.forEach(item => addPhysical(item, item.colour, 0.16, 0.22));
    layout.lifecycle.forEach(item => addPhysical(item, item.colour, 0.22, 0.88, { kind: 'status', status: item.status }));
    layout.vehicles.forEach(item => addPhysical(item, item.colour, 0.28, 0.9, { kind: 'vehicle', vehicle: item.vehicle }));
    layout.accounts.forEach(item => addPhysical(item, item.colour, 0.18, 0.82, { kind: 'account', account: item.account }));
    layout.records.forEach(item => addPhysical(item, item.colour, 0.12, 0.12, { kind: 'record', record: item.record }));
    this.geometryChecks = this.geometryChecks.filter(check => check.id !== 'data-wall-depth-layers');
    this.geometryChecks.push({
      id: 'data-wall-depth-layers',
      pass: this.dynamicBoardMeshes.length >= 11,
      actual: this.dynamicBoardMeshes.length
    });
  }

  updateFlightDeck() {
    if (!this.snapshot || !this.sceneDeck) return;
    const activeCapability = this.snapshot.filters.capability;
    const records = this.snapshot.navigationRecords;
    const updateControl = (name, label, subset, colour) => {
      const control = this.deckControls.get(name);
      if (!control) return;
      const active = activeCapability === name;
      const open = subset.filter(record => record.status === 'Open').length;
      const { canvas, context: ctx, texture } = control.surface;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, active ? `${colour}42` : '#0B1048');
      gradient.addColorStop(1, '#03042B');
      ctx.fillStyle = gradient;
      roundedRect(ctx, 5, 5, canvas.width - 10, canvas.height - 10, 28);
      ctx.fill();
      ctx.strokeStyle = active ? colour : 'rgba(120,220,255,.34)';
      ctx.lineWidth = active ? 8 : 4;
      ctx.stroke();
      ctx.fillStyle = colour;
      roundedRect(ctx, 24, 30, 9, canvas.height - 60, 5);
      ctx.fill();
      drawLabel(ctx, name === 'all' ? 'PRACTICE' : 'CAPABILITY', 54, 54, 330, 21, colour, 800);
      wrapLabel(ctx, label, 54, 78, 390, 37, 2, '#FFFFFF', `800 31px ${FONT_STACK}`);
      drawLabel(ctx, subset.length, canvas.width - 42, 136, 120, 52, '#FFFFFF', 800, 'right');
      drawLabel(ctx, `${open} open`, 54, canvas.height - 35, 220, 21, '#AFC0D3', 600);
      texture.needsUpdate = true;
      control.body.material.emissiveIntensity = active ? 2.1 : 0.8;
      control.body.material.opacity = active ? 0.98 : 0.82;
      control.group.position.z = control.group.userData.baseZ + (active ? 0.14 : 0);
    };
    updateControl('all', 'Data & AI', records, '#9B9BFF');
    this.snapshot.capabilities.forEach(capability => {
      const subset = records.filter(record => record.capabilities.includes(capability.name));
      updateControl(capability.name, capability.name, subset, capability.colour || this.capabilityColour(capability.name));
    });
  }

  buildPracticePedestal() {
    const group = new THREE.Group();
    group.position.fromArray(MODEL_CONVENTION.practicePedestal);
    group.scale.setScalar(0.74);
    const baseGeometry = new THREE.CylinderGeometry(1.64, 1.9, 0.42, 64, 1, false);
    const base = new THREE.Mesh(baseGeometry, makeSurfaceMaterial('#9B9BFF', 0.95));
    base.position.y = 0.18;
    group.add(base, edgeMesh(baseGeometry, '#9B9BFF', 0.7));

    [1.14, 1.48, 1.82].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 1 ? 0.035 : 0.018, 8, 96),
        makeGlowMaterial(index === 1 ? '#00FFFF' : '#9B9BFF', 0.58 - index * 0.08)
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.44 + index * 0.03;
      ring.userData.spin = (index % 2 ? -1 : 1) * (0.08 + index * 0.02);
      group.add(ring);
    });

    const coreGeometry = new THREE.IcosahedronGeometry(0.72, 2);
    const core = new THREE.Mesh(coreGeometry, makeSurfaceMaterial('#9B9BFF', 0.72));
    core.position.y = 1.18;
    group.add(core, edgeMesh(coreGeometry, '#78DCFF', 0.72));

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.72, 3.1, 32, 1, true),
      makeGlowMaterial('#9B9BFF', 0.075)
    );
    beam.position.y = 1.85;
    group.add(beam);

    this.practice = group;
    this.world.add(group);
  }

  buildCapabilities() {
    const practicePoint = new THREE.Vector3(...MODEL_CONVENTION.practicePedestal).add(new THREE.Vector3(0, 1.15, 0));
    CAPABILITY_SLOTS.forEach((slot, index) => {
      const colour = this.capabilityColour(slot.name);
      const group = new THREE.Group();
      group.name = `Capability:${slot.name}`;
      group.position.fromArray(slot.position);
      group.rotation.y = slot.rotation;
      group.userData.homePosition = new THREE.Vector3(...slot.position);
      group.userData.targetPosition = group.position.clone();
      group.userData.targetScale = 1;
      group.userData.capability = slot.name;

      const baseGeometry = new THREE.CylinderGeometry(0.68, 0.82, 0.2, 32);
      const base = new THREE.Mesh(baseGeometry, makeSurfaceMaterial(colour, 0.9));
      group.add(base, edgeMesh(baseGeometry, colour));

      const bodyGeometry = index % 2
        ? new THREE.OctahedronGeometry(0.5, 1)
        : new THREE.CylinderGeometry(0.42, 0.54, 1.15, 6);
      const body = new THREE.Mesh(bodyGeometry, makeSurfaceMaterial(colour, 0.88));
      body.position.y = 0.73;
      group.add(body, edgeMesh(bodyGeometry, colour));

      const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 52), makeGlowMaterial(colour, 0.78));
      orbit.rotation.x = Math.PI / 2;
      orbit.position.y = 0.92;
      orbit.userData.spin = index % 2 ? -0.28 : 0.28;
      group.add(orbit);

      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.105, 1), makeGlowMaterial('#78DCFF', 0.5));
      crown.position.y = 1.45;
      group.add(crown);

      const proxy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 0.92, 2.1, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      proxy.position.y = 0.82;
      proxy.userData.capability = slot.name;
      proxy.userData.kind = 'capability';
      group.add(proxy);
      this.raycastTargets.push(proxy);

      const anchor = new THREE.Object3D();
      anchor.position.y = 1.73;
      group.add(anchor);

      const curve = new THREE.QuadraticBezierCurve3(
        practicePoint,
        new THREE.Vector3(slot.position[0] * 0.6, 0.62, slot.position[2] + 0.55),
        new THREE.Vector3(...slot.position).add(new THREE.Vector3(0, 0.3, 0))
      );
      const link = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 42, 0.012, 5, false),
        makeGlowMaterial(colour, 0.32)
      );
      this.world.add(link);

      this.capabilities.set(slot.name, { group, proxy, anchor, colour, link, body, orbit });
      this.world.add(group);
    });
    this.geometryChecks.push({ id: 'capability-count', pass: this.capabilities.size === 5, actual: this.capabilities.size });
  }

  buildVehiclePylons() {
    const positions = [-5.65, 0, 5.65];
    Object.entries(VEHICLE_COLOURS).forEach(([name, colour], index) => {
      const group = new THREE.Group();
      group.position.set(positions[index], 0.82, 0.35);
      const trackGeometry = new THREE.BoxGeometry(0.24, 1.45, 0.18);
      const track = new THREE.Mesh(trackGeometry, makeSurfaceMaterial(colour, 0.18));
      group.add(track, edgeMesh(trackGeometry, colour, 0.32));
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.19, 1, 0.26), makeGlowMaterial(colour, 0.72));
      bar.position.y = -0.68;
      bar.scale.y = 0.01;
      group.add(bar);
      this.vehicleBars.set(name, { group, bar, colour });
      this.world.add(group);
    });
  }

  capabilityColour(name) {
    const snapshotColour = this.snapshot?.capabilities.find(item => item.name === name)?.colour;
    return snapshotColour || ({
      Copilot: '#9B9BFF',
      'Generative & Agentic AI': '#FF00FF',
      'AI Governance & Adoption': '#00FFFF',
      'Data Platform & Engineering': '#00AEFF',
      'Analytics & BI': '#DAFF00'
    }[name] || '#78DCFF');
  }

  update(snapshot, reason) {
    this.snapshot = snapshot;
    this.updateSceneScope();
    this.renderBoard();
    this.renderScopeDeck();
    if (this.mobileDeck) this.mobileDeck.sync(snapshot);
    this.drawDataWall();
    this.updateFlightDeck();
    this.renderLabels();
    if (reason !== 'experience') this.moveCameraForScope();
    if (veil && !veil.hidden) window.setTimeout(() => { veil.hidden = true; }, reducedMotion ? 0 : 520);
  }

  updateSceneScope() {
    if (!this.snapshot) return;
    const activeCapability = this.snapshot.filters.capability;
    const activeOffering = this.snapshot.filters.offering;
    const navigationRecords = this.snapshot.navigationRecords;
    const capabilityCounts = new Map(this.snapshot.capabilities.map(capability => [
      capability.name,
      navigationRecords.filter(record => record.capabilities.includes(capability.name)).length
    ]));
    const maxCount = Math.max(...capabilityCounts.values(), 1);

    this.capabilities.forEach((item, name) => {
      const isSelected = activeCapability === name;
      const isSibling = activeCapability !== 'all' && !isSelected;
      const home = item.group.userData.homePosition;
      if (activeCapability === 'all') item.group.userData.targetPosition.copy(home);
      else if (isSelected) item.group.userData.targetPosition.set(0, 0.72, 3.05);
      else {
        const side = home.x < 0 ? -1 : 1;
        item.group.userData.targetPosition.set(side * (5.7 + Math.abs(home.x) * 0.16), 0.42, 1.2 + Math.abs(home.x) * 0.08);
      }
      item.group.userData.targetScale = isSelected ? 0.82 : isSibling ? 0.4 : 0.58 + 0.1 * capabilityCounts.get(name) / maxCount;
      item.link.visible = activeCapability === 'all';
      item.body.material.opacity = isSibling ? 0.2 : 0.88;
      item.orbit.material.opacity = isSibling ? 0.16 : 0.78;
    });

    this.buildOfferings(activeCapability, activeOffering);
    const vehicleGroups = groupBy(this.snapshot.filteredRecords, record => record.vehicle);
    const maxVehicle = Math.max(...Object.keys(VEHICLE_COLOURS).map(name => (vehicleGroups.get(name) || []).length), 1);
    this.vehicleBars.forEach((item, name) => {
      const count = (vehicleGroups.get(name) || []).length;
      const height = Math.max(0.04, count / maxVehicle * 1.28);
      item.bar.userData.targetScaleY = height;
      item.bar.userData.targetY = -0.68 + height / 2;
    });
  }

  buildOfferings(activeCapability, activeOffering) {
    this.offerings.forEach(item => {
      this.world.remove(item.group);
      item.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.offerings.clear();
    this.raycastTargets = this.raycastTargets.filter(target => target.userData.kind !== 'offering');
    this.world.remove(this.offeringLinks);
    this.offeringLinks.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    this.offeringLinks = new THREE.Group();
    this.world.add(this.offeringLinks);

    this.geometryChecks = this.geometryChecks.filter(check => check.id !== 'physical-offering-panels');
    if (!activeCapability || activeCapability === 'all') {
      this.geometryChecks.push({ id: 'physical-offering-panels', pass: true, actual: 0 });
      return;
    }
    const colour = this.capabilityColour(activeCapability);
    const groups = [...groupBy(
      this.snapshot.navigationRecords.filter(record => record.capabilities.includes(activeCapability)),
      record => record.offering
    ).entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const visible = groups.slice(0, this.tier.mobile ? 5 : 10);
    const panelPositions = offeringPanelPositions(visible.length);
    visible.forEach(([name, records], index) => {
      const group = new THREE.Group();
      group.position.set(...panelPositions[index]);
      group.userData.targetPosition = group.position.clone();
      group.userData.offering = name;
      const selected = activeOffering === name;
      const geometry = new THREE.BoxGeometry(1.72, 0.66, selected ? 0.22 : 0.14);
      const core = new THREE.Mesh(geometry, makeSurfaceMaterial(colour, selected ? 0.98 : 0.84));
      core.userData.kind = 'offering';
      core.userData.offering = name;
      group.add(core, edgeMesh(geometry, selected ? '#FFFFFF' : colour, selected ? 0.96 : 0.58));
      const surface = createCanvasTexture(720, 280);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.58), panelMaterial(surface.texture));
      face.position.z = (selected ? 0.22 : 0.14) / 2 + 0.012;
      group.add(face);
      const { canvas: labelCanvas, context: labelContext, texture: labelTexture } = surface;
      const labelGradient = labelContext.createLinearGradient(0, 0, labelCanvas.width, labelCanvas.height);
      labelGradient.addColorStop(0, selected ? `${colour}4d` : '#080A3D');
      labelGradient.addColorStop(1, '#020326');
      labelContext.fillStyle = labelGradient;
      roundedRect(labelContext, 5, 5, labelCanvas.width - 10, labelCanvas.height - 10, 28);
      labelContext.fill();
      labelContext.strokeStyle = selected ? '#FFFFFF' : colour;
      labelContext.lineWidth = selected ? 7 : 4;
      labelContext.stroke();
      drawLabel(labelContext, 'OFFERING', 34, 44, 250, 21, colour, 800);
      wrapLabel(labelContext, name, 34, 72, 620, 40, 2, '#FFFFFF', `800 32px ${FONT_STACK}`);
      drawLabel(labelContext, `${records.length} opportunities · ${records.filter(record => record.status === 'Open').length} open`, 34, 244, 620, 20, '#AFC0D3', 600);
      labelTexture.needsUpdate = true;
      const stemCurve = new THREE.LineCurve3(new THREE.Vector3(0, -0.68, -0.02), new THREE.Vector3(0, -0.34, -0.02));
      const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 4, 0.014, 5, false), makeGlowMaterial(colour, 0.5));
      group.add(stem);
      const anchor = new THREE.Object3D();
      anchor.position.y = 0.45;
      group.add(anchor);
      this.raycastTargets.push(core);
      this.offerings.set(name, { group, proxy: core, anchor, ring: null, colour, count: records.length, face, surface });
      this.world.add(group);

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.82, 5.25),
        new THREE.Vector3(group.position.x * 0.54, 1.0, 3.65),
        group.position.clone()
      );
      this.offeringLinks.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve, 28, selected ? 0.02 : 0.01, 5, false),
        makeGlowMaterial(colour, selected ? 0.7 : 0.24)
      ));
    });
    this.geometryChecks.push({ id: 'physical-offering-panels', pass: this.offerings.size === visible.length, actual: this.offerings.size });
  }

  renderBoard() {
    if (!this.snapshot) return;
    const records = this.snapshot.filteredRecords;
    const counts = countsByStatus(records);
    const accounts = new Set(records.map(record => record.account));
    const offerings = new Set(records.map(record => record.offering));
    const capability = this.snapshot.filters.capability;
    const offering = this.snapshot.filters.offering;
    const scopeTitle = offering !== 'all' ? offering : capability !== 'all' ? capability : 'Data & AI';
    const scopeKind = offering !== 'all' ? 'Offering signal' : capability !== 'all' ? 'Capability command board' : 'Practice command board';
    const context = [
      capability === 'all' ? 'All capabilities' : capability,
      offering === 'all' ? 'all offerings' : offering,
      this.snapshot.filters.vehicle === 'all' ? 'all annuity vehicles' : this.snapshot.filters.vehicle
    ];
    byId('spatialBoardKicker').textContent = scopeKind;
    byId('spatialBoardTitle').textContent = scopeTitle;
    byId('spatialBoardContext').textContent = context.join(' · ');
    byId('spatialBoardMeta').textContent = `${records.length} of ${this.snapshot.records.length} records in field`;
    byId('spatialLifecycleTotal').textContent = records.length;

    const kpis = [
      ['Total', records.length, 'filtered opportunities', '#9B9BFF'],
      ['Open now', counts.Open, `${records.length ? Math.round(counts.Open / records.length * 100) : 0}% of field`, '#00AEFF'],
      ['Won', counts['Closed Won'], 'closed won', '#00FF00'],
      ['Accounts', accounts.size, 'customer concentration', '#00FFFF'],
      ['Offerings', offerings.size, 'commercial motions', '#FF00FF']
    ];
    byId('spatialKpis').innerHTML = kpis.map(([label, value, note, colour]) => `
      <div class="spatialKpi" style="--spatial-accent:${colour}">
        <span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(note)}</small>
      </div>`).join('');

    const total = Math.max(records.length, 1);
    byId('spatialLifecycleChart').innerHTML = Object.entries(counts).map(([status, value]) => `
      <button type="button" data-spatial-lifecycle="${escapeHtml(status)}" style="--status:${STATUS_COLOURS[status]}">
        <span>${status === 'Closed Won' ? 'Won' : status === 'Closed Lost' ? 'Lost' : status}</span>
        <i><b style="width:${value / total * 100}%"></b></i>
        <strong>${value}</strong>
      </button>`).join('');

    const vehicleGroups = groupBy(records, record => record.vehicle);
    const maxVehicle = Math.max(...Object.keys(VEHICLE_COLOURS).map(name => (vehicleGroups.get(name) || []).length), 1);
    byId('spatialVehicleChart').innerHTML = Object.entries(VEHICLE_COLOURS).map(([name, colour]) => {
      const group = vehicleGroups.get(name) || [];
      return `<button type="button" data-spatial-vehicle="${escapeHtml(name)}" style="--vehicle:${colour}">
        <i><b style="height:${Math.max(5, group.length / maxVehicle * 100)}%"></b></i>
        <strong>${group.length}</strong><span>${escapeHtml(name.replace('Entitled ', '').replace('Committed ', '').replace('Standing ', ''))}</span>
      </button>`;
    }).join('');

    const openRecords = records.filter(record => record.status === 'Open');
    const accountGroups = [...groupBy(openRecords, record => record.account).entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 4);
    const maxAccount = Math.max(...accountGroups.map(([, group]) => group.length), 1);
    byId('spatialAccountMeta').textContent = `${new Set(openRecords.map(record => record.account)).size} accounts`;
    byId('spatialAccounts').innerHTML = accountGroups.map(([account, group]) => `
      <button type="button" data-spatial-account="${escapeHtml(account)}">
        <span><strong>${escapeHtml(account)}</strong><b>${group.length}</b></span>
        <i><b style="width:${group.length / maxAccount * 100}%"></b></i>
      </button>`).join('') || '<p class="spatialEmpty">No open accounts in this scope.</p>';

    const priority = records.slice().sort((a, b) => statusRank(a.status) - statusRank(b.status) || confidence(b) - confidence(a)).slice(0, 4);
    byId('spatialOpportunities').innerHTML = priority.map(record => `
      <div class="spatialOpportunity">
        <i style="--record-status:${STATUS_COLOURS[record.status]}"></i>
        <span><strong>${escapeHtml(record.account)}</strong><small>${escapeHtml(record.opportunity)}</small></span>
        ${record.id ? `<a href="${this.snapshot.salesforceUrl.replace('{id}', encodeURIComponent(record.id))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(record.opportunity)} in Salesforce">↗</a>` : '<b>—</b>'}
      </div>`).join('') || '<p class="spatialEmpty">No records in this scope.</p>';

    const knownAmount = records.filter(record => record.amount !== null).length;
    const knownStage = records.filter(record => record.stage).length;
    byId('spatialCoverageSignal').textContent = knownAmount
      ? `${knownAmount}/${records.length} records include value · ${knownStage}/${records.length} include stage`
      : `Counts shown · amount and detailed stage are absent from this extract`;

    const crumbs = [{ label: 'Practice', level: 'practice' }, { label: 'Data & AI', level: 'practice' }];
    if (capability !== 'all') crumbs.push({ label: capability, level: 'capability' });
    if (offering !== 'all') crumbs.push({ label: offering, level: 'offering' });
    byId('spatialBreadcrumb').innerHTML = crumbs.map((crumb, index) => index === crumbs.length - 1
      ? `<span>${escapeHtml(crumb.label)}</span>`
      : `<button type="button" data-spatial-level="${crumb.level}">${escapeHtml(crumb.label)}</button><i>›</i>`).join('');

    document.querySelectorAll('[data-spatial-status]').forEach(button => {
      const statuses = this.snapshot.filters.statuses;
      const active = button.dataset.spatialStatus === 'all' ? statuses.length === 0 : statuses.length === 1 && statuses[0] === button.dataset.spatialStatus;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  renderScopeDeck() {
    if (!this.snapshot) return;
    const activeCapability = this.snapshot.filters.capability;
    const navigationRecords = this.snapshot.navigationRecords;
    byId('scopeDeck').classList.toggle('hasOfferings', activeCapability !== 'all');
    stage.classList.toggle('hasOfferingDrawer', activeCapability !== 'all');
    byId('practiceDeckMeta').textContent = `${navigationRecords.length} opportunities`;
    const practiceButton = document.querySelector('[data-spatial-capability="all"]');
    practiceButton.classList.toggle('active', activeCapability === 'all');
    practiceButton.setAttribute('aria-pressed', String(activeCapability === 'all'));

    byId('capabilityDeck').innerHTML = this.snapshot.capabilities.map(capability => {
      const records = navigationRecords.filter(record => record.capabilities.includes(capability.name));
      const open = records.filter(record => record.status === 'Open').length;
      return `<button type="button" data-spatial-capability="${escapeHtml(capability.name)}" class="${activeCapability === capability.name ? 'active' : ''}" style="--capability:${capability.colour}" aria-pressed="${activeCapability === capability.name}">
        <i></i><span>${escapeHtml(capability.name)}</span><strong>${records.length}</strong><small>${open} open</small>
      </button>`;
    }).join('');

    const offeringDeck = byId('offeringDeck');
    if (activeCapability === 'all') {
      offeringDeck.hidden = true;
      this.syncBoardFrameToDom();
      return;
    }
    const offeringGroups = [...groupBy(
      navigationRecords.filter(record => record.capabilities.includes(activeCapability)),
      record => record.offering
    ).entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    byId('offeringDeckTitle').textContent = `${activeCapability} · ${offeringGroups.length} offerings`;
    byId('offeringDeckRail').innerHTML = offeringGroups.map(([offering, records]) => `
      <button type="button" data-spatial-offering="${escapeHtml(offering)}" class="${this.snapshot.filters.offering === offering ? 'active' : ''}">
        <strong>${escapeHtml(offering)}</strong><span>${records.length} · ${records.filter(record => record.status === 'Open').length} open</span>
      </button>`).join('');
    offeringDeck.hidden = false;
    this.syncBoardFrameToDom();
  }

  renderLabels() {
    labelsRoot.innerHTML = '';
    this.labelEntries = [];
    const activeCapability = this.snapshot.filters.capability;
    this.capabilities.forEach((item, name) => {
      const records = this.snapshot.navigationRecords.filter(record => record.capabilities.includes(name));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `spatialLabel capabilityLabel${activeCapability === name ? ' active' : ''}`;
      button.dataset.spatialCapability = name;
      button.style.setProperty('--label-colour', item.colour);
      button.innerHTML = `<span>${escapeHtml(name)}</span><small>${records.length} opportunities · ${records.filter(record => record.status === 'Open').length} open</small>`;
      labelsRoot.appendChild(button);
      this.labelEntries.push({ element: button, anchor: item.anchor, group: item.group, kind: 'capability' });
    });
    if (activeCapability !== 'all') {
      [...this.offerings.entries()].slice(0, 9).forEach(([name, item]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `spatialLabel offeringLabel${this.snapshot.filters.offering === name ? ' active' : ''}`;
        button.dataset.spatialOffering = name;
        button.style.setProperty('--label-colour', item.colour);
        button.innerHTML = `<span>${escapeHtml(name)}</span><small>${item.count} opportunities</small>`;
        labelsRoot.appendChild(button);
        this.labelEntries.push({ element: button, anchor: item.anchor, group: item.group, kind: 'offering' });
      });
    }
  }

  bindInteraction() {
    canvas.addEventListener('pointerdown', event => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
      this.dragging = false;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!this.pointerStart) {
        this.updatePointer(event);
        canvas.classList.toggle('isHot', this.raycast().length > 0);
        return;
      }
      const dx = event.clientX - this.pointerStart.x;
      const dy = event.clientY - this.pointerStart.y;
      if (Math.hypot(dx, dy) > 5) this.dragging = true;
      if (!this.dragging) return;
      const lateral = clamp(-dx * 0.0032, -COCKPIT_CONTRACT.parallax.maximumLateralMetres, COCKPIT_CONTRACT.parallax.maximumLateralMetres);
      const vertical = clamp(dy * 0.0015, -COCKPIT_CONTRACT.parallax.maximumVerticalMetres, COCKPIT_CONTRACT.parallax.maximumVerticalMetres);
      this.cameraGoalPosition.copy(this.cameraHomePosition).add(new THREE.Vector3(lateral, vertical, this.cameraDepthOffset));
      this.cameraGoalTarget.copy(this.cameraHomeTarget).add(new THREE.Vector3(lateral * 0.16, vertical * 0.1, 0));
      this.camera.position.lerp(this.cameraGoalPosition, 0.32);
      this.cameraTarget.lerp(this.cameraGoalTarget, 0.32);
      this.cameraTweenStart = null;
    });
    canvas.addEventListener('pointerup', event => {
      if (!this.dragging) {
        this.updatePointer(event);
        const hit = this.raycast()[0]?.object;
        if (hit?.userData.kind === 'capability') this.bridge.setCapability(hit.userData.capability);
        if (hit?.userData.kind === 'offering') this.bridge.setOffering(hit.userData.offering);
        if (hit?.userData.kind === 'status') this.bridge.setStatuses([hit.userData.status]);
        if (hit?.userData.kind === 'vehicle') this.bridge.setVehicle(hit.userData.vehicle);
        if (hit?.userData.kind === 'account') this.bridge.showDimension('Account', hit.userData.account);
        if (hit?.userData.kind === 'record' && hit.userData.record?.id) {
          const url = this.snapshot.salesforceUrl.replace('{id}', encodeURIComponent(hit.userData.record.id));
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
      this.pointerStart = null;
      this.dragging = false;
    });
    canvas.addEventListener('pointercancel', () => { this.pointerStart = null; this.dragging = false; });
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      this.cameraDepthOffset = clamp(
        this.cameraDepthOffset + event.deltaY * 0.0022,
        COCKPIT_CONTRACT.parallax.minimumDepthOffsetMetres,
        COCKPIT_CONTRACT.parallax.maximumDepthOffsetMetres
      );
      this.cameraGoalPosition.copy(this.cameraHomePosition).add(new THREE.Vector3(0, 0, this.cameraDepthOffset));
      this.cameraGoalTarget.copy(this.cameraHomeTarget);
      this.camera.position.lerp(this.cameraGoalPosition, 0.35);
      this.cameraTweenStart = null;
    }, { passive: false });

    stage.addEventListener('click', event => {
      const capability = event.target.closest('[data-spatial-capability]');
      if (capability) { this.bridge.setCapability(capability.dataset.spatialCapability); return; }
      const offering = event.target.closest('[data-spatial-offering]');
      if (offering) { this.bridge.setOffering(offering.dataset.spatialOffering); return; }
      const status = event.target.closest('[data-spatial-status]');
      if (status) { this.bridge.setStatuses(status.dataset.spatialStatus === 'all' ? [] : [status.dataset.spatialStatus]); return; }
      const lifecycle = event.target.closest('[data-spatial-lifecycle]');
      if (lifecycle) { this.bridge.setStatuses([lifecycle.dataset.spatialLifecycle]); return; }
      const vehicle = event.target.closest('[data-spatial-vehicle]');
      if (vehicle) { this.bridge.setVehicle(vehicle.dataset.spatialVehicle); return; }
      const account = event.target.closest('[data-spatial-account]');
      if (account) { this.bridge.showDimension('Account', account.dataset.spatialAccount); return; }
      const level = event.target.closest('[data-spatial-level]');
      if (level) {
        if (level.dataset.spatialLevel === 'practice') this.bridge.setCapability('all');
        if (level.dataset.spatialLevel === 'capability') this.bridge.setOffering('all');
      }
    });
    byId('closeOfferingDeck').addEventListener('click', () => this.bridge.setCapability('all'));
    byId('spatialResetCamera').addEventListener('click', () => this.moveCameraForScope(true));
    const mobileReset = byId('mobileResetCamera');
    if (mobileReset) mobileReset.addEventListener('click', () => this.moveCameraForScope(true));
    byId('spatialOpenDetail').addEventListener('click', () => this.bridge.openBoard());
    document.addEventListener('keydown', event => this.handleKeyboard(event));
  }

  handleKeyboard(event) {
    if (this.bridge.getExperience() !== 'spatial') return;
    if (event.key === 'Escape') {
      if (this.snapshot.filters.offering !== 'all') this.bridge.setOffering('all');
      else if (this.snapshot.filters.capability !== 'all') this.bridge.setCapability('all');
      return;
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    const names = this.snapshot.capabilities.map(item => item.name);
    const current = Math.max(0, names.indexOf(this.snapshot.filters.capability));
    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    const next = (current + delta + names.length) % names.length;
    this.bridge.setCapability(names[next]);
    event.preventDefault();
  }

  updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  raycast() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // Three.js raycasts hidden objects, so surfaces switched off for the mobile
    // deck must be filtered out or they would keep swallowing taps.
    return this.raycaster.intersectObjects(this.raycastTargets.filter(visibleInScene), false);
  }

  moveCameraForScope(force = false) {
    if (!this.camera || !this.snapshot) return;
    const mobile = window.innerWidth < 720;
    const pose = mobile ? DELIVERY_CAMERAS.mobile : DELIVERY_CAMERAS.desktop;
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.cameraTweenFromPosition.copy(this.camera.position);
    this.cameraTweenFromTarget.copy(this.cameraTarget);
    this.cameraHomePosition.fromArray(pose.position);
    this.cameraHomeTarget.fromArray(pose.target);
    this.cameraDepthOffset = 0;
    this.cameraGoalPosition.copy(this.cameraHomePosition);
    this.cameraGoalTarget.copy(this.cameraHomeTarget);
    this.cameraTweenStart = force || reducedMotion ? performance.now() - this.cameraTweenDuration * 1000 : performance.now();
  }

  setDiagnosticView(id) {
    const pose = DELIVERY_CAMERAS[id];
    if (!pose) throw new Error(`Unknown diagnostic camera: ${id}`);
    this.camera.fov = pose.fov;
    this.camera.position.fromArray(pose.position);
    this.cameraTarget.fromArray(pose.target);
    this.cameraHomePosition.copy(this.camera.position);
    this.cameraHomeTarget.copy(this.cameraTarget);
    this.cameraDepthOffset = 0;
    this.cameraGoalPosition.copy(this.camera.position);
    this.cameraGoalTarget.copy(this.cameraTarget);
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateProjectionMatrix();
    this.cameraTweenStart = null;
    this.syncBoardFrameToDom();
    this.renderNow();
    return this.cameraState();
  }

  frame(delta, elapsed) {
    if (!this.active) return;
    if (!this.firstFrameAt) this.firstFrameAt = performance.now() - this.bootStartedAt;
    this.particleMaterial.uniforms.uTime.value = elapsed;
    this.particles.rotation.y += delta * 0.006;
    this.boardScan.position.y = Math.sin(elapsed * 0.42) * this.boardScan.userData.scanRange;

    this.world.traverse(object => {
      if (object.userData.spin) object.rotation.z += delta * object.userData.spin;
    });
    this.capabilities.forEach(item => {
      const factor = reducedMotion ? 1 : 1 - Math.exp(-delta * 6.8);
      item.group.position.lerp(item.group.userData.targetPosition, factor);
      const scale = THREE.MathUtils.lerp(item.group.scale.x, item.group.userData.targetScale, factor);
      item.group.scale.setScalar(scale);
    });
    this.vehicleBars.forEach(item => {
      const factor = reducedMotion ? 1 : 1 - Math.exp(-delta * 5.5);
      item.bar.scale.y = THREE.MathUtils.lerp(item.bar.scale.y, item.bar.userData.targetScaleY || 0.01, factor);
      item.bar.position.y = THREE.MathUtils.lerp(item.bar.position.y, item.bar.userData.targetY || -0.68, factor);
    });

    if (this.cameraTweenStart !== null) {
      const progress = clamp((performance.now() - this.cameraTweenStart) / (this.cameraTweenDuration * 1000 || 1), 0, 1);
      const amount = ease(progress);
      this.camera.position.lerpVectors(this.cameraTweenFromPosition, this.cameraGoalPosition, amount);
      this.cameraTarget.lerpVectors(this.cameraTweenFromTarget, this.cameraGoalTarget, amount);
      if (progress >= 1) this.cameraTweenStart = null;
    } else {
      this.camera.position.lerp(this.cameraGoalPosition, reducedMotion ? 1 : 1 - Math.exp(-delta * 4.8));
      this.cameraTarget.lerp(this.cameraGoalTarget, reducedMotion ? 1 : 1 - Math.exp(-delta * 4.8));
    }
    this.camera.lookAt(this.cameraTarget);
    this.positionLabels();
    this.syncBoardFrameToDom();
    this.renderer.info.reset();
    this.composer.render();
    this.lastRenderStats = {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      points: this.renderer.info.render.points,
      lines: this.renderer.info.render.lines
    };
  }

  positionLabels() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const worldPosition = new THREE.Vector3();
    this.labelEntries.forEach(entry => {
      entry.anchor.getWorldPosition(worldPosition);
      worldPosition.project(this.camera);
      const visible = worldPosition.z > -1 && worldPosition.z < 1 && Math.abs(worldPosition.x) < 1.12 && Math.abs(worldPosition.y) < 1.12;
      entry.element.hidden = !visible || (entry.kind === 'offering' && width < 900);
      if (!visible) return;
      entry.element.style.transform = `translate3d(${(worldPosition.x * 0.5 + 0.5) * width}px,${(-worldPosition.y * 0.5 + 0.5) * height}px,0) translate(-50%,-100%)`;
      entry.element.style.zIndex = String(Math.round((1 - worldPosition.z) * 100));
    });
  }

  resize() {
    if (!this.renderer || stage.hidden) return;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.mobileDeck) this.mobileDeck.evaluate();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.tier.pixelRatioCap));
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    if (this.bloom) this.bloom.setSize(Math.max(width / 2, 1), Math.max(height / 2, 1));
    this.configureSceneLayout();
    if (this.snapshot) this.moveCameraForScope(true);
    this.syncBoardFrameToDom();
    this.renderNow();
  }

  setActive(active) {
    this.active = active;
    if (!this.frameLoop) return;
    if (active) {
      this.resize();
      this.frameLoop.start();
    } else {
      this.frameLoop.stop();
    }
  }

  renderNow() {
    if (!this.composer || stage.hidden) return;
    this.camera.lookAt(this.cameraTarget);
    this.renderer.info.reset();
    this.composer.render();
    this.lastRenderStats = {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      points: this.renderer.info.render.points,
      lines: this.renderer.info.render.lines
    };
  }

  cameraState() {
    return {
      fov: this.camera.fov,
      position: this.camera.position.toArray().map(value => Number(value.toFixed(4))),
      target: this.cameraTarget.toArray().map(value => Number(value.toFixed(4))),
      aspect: Number(this.camera.aspect.toFixed(4))
    };
  }

  framebufferStats() {
    this.renderNow();
    const gl = this.renderer.getContext();
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const stride = Math.max(1, Math.floor((width * height) / 80000));
    let count = 0;
    let opaque = 0;
    let nonBackground = 0;
    let sum = 0;
    let sumSquares = 0;
    let minimum = 255;
    let maximum = 0;
    for (let pixel = 0; pixel < width * height; pixel += stride) {
      const index = pixel * 4;
      const luminance = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      const backgroundDistance = Math.abs(pixels[index]) + Math.abs(pixels[index + 1]) + Math.abs(pixels[index + 2] - 37);
      if (pixels[index + 3] > 250) opaque += 1;
      if (backgroundDistance > 18) nonBackground += 1;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      sum += luminance;
      sumSquares += luminance * luminance;
      count += 1;
    }
    const mean = sum / count;
    return {
      width,
      height,
      opaqueRatio: opaque / count,
      nonBackgroundRatio: nonBackground / count,
      luminance: { minimum, maximum, mean, standardDeviation: Math.sqrt(Math.max(0, sumSquares / count - mean * mean)) }
    };
  }

  geometryMetrics() {
    const metrics = {
      meshes: 0,
      lineObjects: 0,
      pointObjects: 0,
      estimatedTriangles: 0,
      finitePositionAttributes: true,
      invalidGeometryNames: []
    };
    this.scene.traverse(object => {
      if (!object.visible || !object.geometry) return;
      if (object.isMesh) metrics.meshes += 1;
      if (object.isLine || object.isLineSegments) metrics.lineObjects += 1;
      if (object.isPoints) metrics.pointObjects += 1;
      const position = object.geometry.getAttribute?.('position');
      if (position) {
        for (let index = 0; index < position.array.length; index += 1) {
          if (!Number.isFinite(position.array[index])) {
            metrics.finitePositionAttributes = false;
            metrics.invalidGeometryNames.push(object.name || object.parent?.name || object.type);
            break;
          }
        }
      }
      if (object.isMesh) {
        const primitiveCount = object.geometry.index
          ? object.geometry.index.count / 3
          : (position?.count || 0) / 3;
        const instances = object.isInstancedMesh ? object.count : 1;
        metrics.estimatedTriangles += Math.round(primitiveCount * instances);
      }
    });
    metrics.invalidGeometryNames = [...new Set(metrics.invalidGeometryNames)];
    return metrics;
  }

  installDiagnostics() {
    window.__PRACTICE_PULSE_SPATIAL__ = {
      isReady: () => this.ready,
      cameras: DELIVERY_CAMERAS,
      setView: id => this.setDiagnosticView(id),
      render: () => this.renderNow(),
      framebuffer: () => this.framebufferStats(),
      diagnostics: () => ({
        ready: this.ready,
        active: this.active,
        tier: this.tier,
        camera: this.cameraState(),
        geometryChecks: this.geometryChecks,
        frameAlignment: this.frameAlignment,
        cockpitContract: COCKPIT_CONTRACT,
        capabilities: this.capabilities.size,
        offerings: this.offerings.size,
        raycastTargets: this.raycastTargets.length,
        geometry: this.geometryMetrics(),
        render: this.lastRenderStats,
        firstFrameMs: this.firstFrameAt
      })
    };
  }
}

async function boot() {
  const bridge = window.PracticePulseBridge;
  if (!bridge) {
    window.addEventListener('practicepulse:ready', () => boot(), { once: true });
    return;
  }
  if (window.__PRACTICE_PULSE_SPATIAL_BOOTED__) return;
  window.__PRACTICE_PULSE_SPATIAL_BOOTED__ = true;
  try {
    const experience = new PracticePulseSpatial(bridge);
    await experience.init();
  } catch (error) {
    console.error('Spatial command centre failed to initialise.', error);
    stage.classList.add('spatialUnavailable');
    veil.hidden = false;
    veil.querySelector('strong').textContent = 'Spatial rendering is unavailable';
    veil.querySelector('span').textContent = 'The operating board remains available from the view switch.';
  }
}

boot();
