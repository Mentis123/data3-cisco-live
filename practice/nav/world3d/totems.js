/* Procedural practice totems.

   Every totem is built from three.js primitives — no downloaded models, no
   textures, nothing to fetch. Each has a distinct silhouette so a seller can
   recognise a practice across the room, exactly one "hot" element that crosses
   the bloom threshold, and a slow idle animation on its own random phase so
   nine totems never pulse in lockstep. Budget: 2-4 draw calls each plus a
   raycast proxy. */

import * as THREE from 'three';
import { createTotemMaterial, createLineMaterial, hotColour, createGlowSprite } from './materials.js';

const TAU = Math.PI * 2;

function wireframe(geometry, colour, multiplier = 1.6, opacity = 0.8) {
  return new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    createLineMaterial(colour, multiplier, opacity)
  );
}

function edges(geometry, colour, multiplier = 2, opacity = 0.9) {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 20),
    createLineMaterial(colour, multiplier, opacity)
  );
}

function hotMaterial(colour, multiplier = 2.2) {
  return new THREE.MeshBasicMaterial({ color: hotColour(colour, multiplier), toneMapped: false });
}

/* ── Per-practice builders ───────────────────────────────────────── */

function beacon(colour, material) {
  const group = new THREE.Group();
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.42, 2.2, 4, 1), material);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), hotMaterial(colour, 2.4));
  star.position.y = 1.5;
  const collar = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.RingGeometry(0.55, 0.6, 4)),
    createLineMaterial(colour, 1.3, 0.5)
  );
  collar.rotation.x = -Math.PI / 2;
  collar.position.y = -0.25;
  group.add(spire, star, collar);
  group.userData.animate = (time, delta) => {
    star.rotation.y += 0.6 * delta;
    star.position.y = 1.5 + 0.06 * Math.sin(time * 1.5);
  };
  return group;
}

function neural(colour, material) {
  const group = new THREE.Group();
  const geometry = new THREE.IcosahedronGeometry(0.85, 1);
  const solid = new THREE.Mesh(geometry, material);
  const lines = wireframe(geometry, colour, 1.6, 0.65);
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.07,
    color: hotColour(colour, 2.2),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  group.add(solid, lines, points);
  group.userData.animate = (time, delta) => {
    solid.rotation.y += 0.15 * delta;
    solid.rotation.x += 0.05 * delta;
    lines.rotation.copy(solid.rotation);
    points.rotation.copy(solid.rotation);
    points.material.size = 0.07 * (1 + 0.25 * Math.sin(time * 3));
  };
  return group;
}

function shield(colour, material) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 1);
  shape.lineTo(0.62, 0.7);
  shape.lineTo(0.5, -0.32);
  shape.quadraticCurveTo(0.26, -0.78, 0, -1);
  shape.quadraticCurveTo(-0.26, -0.78, -0.5, -0.32);
  shape.lineTo(-0.62, 0.7);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2
  });
  geometry.center();

  const body = new THREE.Mesh(geometry, material);
  const outline = edges(geometry, colour, 2, 0.85);
  const inner = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 20),
    createLineMaterial(colour, 1.4, 0.45)
  );
  inner.scale.setScalar(0.7);
  group.add(body, outline, inner);
  group.userData.animate = (time, delta) => {
    group.rotation.y += 0.12 * delta;
    inner.material.opacity = 0.32 + 0.24 * Math.sin(time * 1.2);
  };
  return group;
}

function gear(colour, material) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 8, 32), material);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.2, 0.13), material, 12);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * TAU;
    position.set(Math.cos(angle) * 0.82, Math.sin(angle) * 0.82, 0);
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
    teeth.setMatrixAt(i, matrix.compose(position, quaternion, scale));
  }
  teeth.instanceMatrix.needsUpdate = true;

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.045, 8, 24),
    new THREE.MeshBasicMaterial({ color: hotColour(colour, 1.8), wireframe: true, toneMapped: false })
  );
  group.add(ring, teeth, innerRing);
  group.userData.animate = (time, delta) => {
    ring.rotation.z += 0.25 * delta;
    teeth.rotation.z = ring.rotation.z;
    innerRing.rotation.z -= 0.4 * delta;
  };
  return group;
}

function slab(colour, material) {
  const group = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.86, 0.07), material);
  panel.position.y = 0.36;
  panel.rotation.x = -0.16;

  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(1.14, 0.66),
    new THREE.MeshBasicMaterial({
      color: hotColour(colour, 1.25),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  display.position.set(0, 0.36, 0.05);
  display.rotation.x = -0.16;

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 0.55, 6), material);
  stand.position.y = -0.32;
  group.add(panel, display, stand);
  group.userData.animate = (time) => {
    group.position.y = 0.05 * Math.sin(time * 1.1);
    display.material.opacity = 0.3 + 0.16 * Math.sin(time * 2.4);
  };
  return group;
}

function orbit(colour, material) {
  const group = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16), material);
  const satellites = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.11, 12, 8), hotMaterial(colour, 2), 4
  );
  const guides = new THREE.Group();
  [0.7, 0.92].forEach((radius, index) => {
    const guide = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.007, 4, 48),
      new THREE.MeshBasicMaterial({
        color: hotColour(colour, 1.2), transparent: true, opacity: 0.3, toneMapped: false
      })
    );
    guide.rotation.x = Math.PI / 2 + (index === 0 ? 0.42 : -0.42);
    guides.add(guide);
  });

  const orbits = [
    { radius: 0.7, speed: 0.62, tilt: 0.42, phase: 0 },
    { radius: 0.7, speed: 0.62, tilt: 0.42, phase: Math.PI },
    { radius: 0.92, speed: -0.48, tilt: -0.42, phase: 1.1 },
    { radius: 0.92, speed: -0.48, tilt: -0.42, phase: 1.1 + Math.PI }
  ];
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);

  group.add(hub, satellites, guides);
  group.userData.animate = (time) => {
    orbits.forEach((path, index) => {
      const angle = path.phase + time * path.speed;
      position.set(Math.cos(angle) * path.radius, Math.sin(angle) * path.radius * Math.sin(path.tilt), Math.sin(angle) * path.radius * Math.cos(path.tilt));
      satellites.setMatrixAt(index, matrix.compose(position, quaternion, scale));
    });
    satellites.instanceMatrix.needsUpdate = true;
    hub.rotation.y += 0.004;
  };
  return group;
}

function mesh(colour, material) {
  const group = new THREE.Group();
  const count = 7;
  const nodes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), hotMaterial(colour, 2.2), count);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const points = [];

  for (let i = 0; i < count - 1; i += 1) {
    const angle = (i / (count - 1)) * TAU;
    points.push(new THREE.Vector3(Math.cos(angle) * 0.82, Math.sin(angle * 2) * 0.22, Math.sin(angle) * 0.82));
  }
  points.push(new THREE.Vector3(0, 0.34, 0));
  points.forEach((point, index) => nodes.setMatrixAt(index, matrix.compose(point, quaternion, scale)));
  nodes.instanceMatrix.needsUpdate = true;

  const linkPoints = [];
  const hub = points[count - 1];
  for (let i = 0; i < count - 1; i += 1) {
    linkPoints.push(hub.x, hub.y, hub.z, points[i].x, points[i].y, points[i].z);
    const next = points[(i + 1) % (count - 1)];
    linkPoints.push(points[i].x, points[i].y, points[i].z, next.x, next.y, next.z);
  }
  const linkGeometry = new THREE.BufferGeometry();
  linkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPoints, 3));
  const links = new THREE.LineSegments(linkGeometry, createLineMaterial(colour, 1.3, 0.55));

  group.add(nodes, links);
  group.userData.animate = (time, delta) => {
    group.rotation.y += 0.2 * delta;
    const pulse = Math.floor(time * 1.25) % (count - 1);
    points.forEach((point, index) => {
      const factor = index === pulse ? 1.5 : 1;
      scale.setScalar(factor);
      nodes.setMatrixAt(index, matrix.compose(point, quaternion, scale));
    });
    scale.setScalar(1);
    nodes.instanceMatrix.needsUpdate = true;
  };
  return group;
}

function rings(colour, material) {
  const group = new THREE.Group();
  const geometry = new THREE.TorusGeometry(0.6, 0.065, 12, 40);
  const solid = new THREE.Mesh(geometry, material);
  solid.position.x = -0.2;
  const ghost = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: hotColour(colour, 1.6), wireframe: true, transparent: true, opacity: 0.75, toneMapped: false
  }));
  ghost.position.x = 0.2;
  ghost.rotation.y = Math.PI / 2;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), hotMaterial(colour, 2.4));
  group.add(solid, ghost, core);
  group.userData.animate = (time, delta) => {
    solid.rotation.z += 0.2 * delta;
    ghost.rotation.x -= 0.2 * delta;
    core.scale.setScalar(1 + 0.12 * Math.sin(time * 2.2));
  };
  return group;
}

/* Lifecycle Services is brand grey. Grey cannot bloom as grey — it blooms as
   dull haze — so the rim is silver-white with a cool lean while the wireframe
   keeps the grey identity. */
function loop(colour, material) {
  const group = new THREE.Group();
  const geometry = new THREE.TorusKnotGeometry(0.58, 0.12, 100, 12, 2, 3);
  const solid = new THREE.Mesh(geometry, material);
  const lines = wireframe(geometry, '#C9CCD1', 1.5, 0.5);
  group.add(solid, lines);
  group.userData.animate = (time, delta) => {
    solid.rotation.x += 0.1 * delta;
    solid.rotation.y += 0.16 * delta;
    lines.rotation.copy(solid.rotation);
  };
  return group;
}

const BUILDERS = { beacon, neural, shield, gear, slab, orbit, mesh, rings, loop };

/* Rim colour overrides where the brand colour alone would not read well. */
const RIM_OVERRIDES = { loop: { colour: '#E3E8F2', fill: 0.09, rimIntensity: 2.2 } };

export function createTotem(practice, options = {}) {
  const builder = BUILDERS[practice.shape] || BUILDERS.neural;
  const override = RIM_OVERRIDES[practice.shape] || {};
  const material = createTotemMaterial(override.colour || practice.colour, {
    phase: practice.index * 1.7,
    fill: override.fill ?? 0.11,
    rimIntensity: override.rimIntensity ?? 1.9,
    rimPower: practice.shape === 'shield' ? 3 : 2.6
  });

  const group = new THREE.Group();
  const body = builder(practice.colour, material);
  // A holder between the totem and its body carries user spin, so the idle
  // animation on the body is never fighting it.
  const spin = new THREE.Group();
  spin.add(body);
  group.add(spin);

  // Mobile tier stands in for post-processed bloom with an additive halo.
  if (options.glowSprite) {
    const glow = createGlowSprite(practice.colour, 3.2);
    glow.material.opacity = 0.38;
    group.add(glow);
  }

  // Generous invisible hit target — the visible geometry is spindly and a
  // finger is not a mouse pointer.
  const proxy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 2.6, 8),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  );
  proxy.userData.pickTarget = true;
  group.add(proxy);

  group.userData.practice = practice;
  group.userData.material = material;
  group.userData.body = body;
  group.userData.spin = spin;
  group.userData.proxy = proxy;
  group.userData.animate = body.userData.animate;
  return group;
}

export function setTotemDim(totem, dim) {
  totem.userData.material.uniforms.uDim.value = dim;
  totem.traverse(child => {
    if (!child.material || !(child.isLineSegments || child.isPoints || child.isSprite)) return;
    // Record the authored opacity the first time so repeated dimming does not
    // ratchet everything down to nothing.
    if (child.material.userData.baseOpacity === undefined) {
      child.material.userData.baseOpacity = child.material.opacity;
    }
    child.material.opacity = child.material.userData.baseOpacity * dim;
  });
}
