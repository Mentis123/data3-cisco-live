import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
const CURVE_SEGMENTS = 256;
const REFLECTION_CURVE_SEGMENTS = 96;
const DEEP_REFLECTION_CURVE_SEGMENTS = 20;
const FULL_GEOMETRY_BOUNCES = 4;
const ENERGY_CONVERGENCE_BOUNCES = 12;
const OUTER_STRAND_COUNT = 6;
const REFLECTION_LAYER = 2;
const STRIPE_PATH_REPEATS = 5;
const STRIPE_TRAVEL_PER_TURN = 1.25;
const STRIPE_ROLL_PER_TURN = 0.18;

export type BraidLayer = {
  geometry: THREE.BufferGeometry;
  deepGeometry: THREE.BufferGeometry;
  material: THREE.MeshPhysicalMaterial;
};

export type PhysicalBraid = {
  group: THREE.Group;
  layers: BraidLayer[];
  setStripePhase: (turns: number) => void;
};

export type MirrorLineLayer = {
  material: THREE.LineBasicMaterial;
  scale: number;
};

export type MirrorCell = {
  matrix: THREE.Matrix4;
  bounces: number;
  index: THREE.Vector3;
};

const MIRROR_REFLECTANCE = 0.62;
const MIRROR_BOUNCE_TINT = new THREE.Color(0.96, 0.98, 1);

export function sourceFrameToActiveTime(value: number) {
  const frame = Math.round(Math.min(Math.max(value, 9), 240));
  const sourceState = frame - 9 - Math.floor((frame - 5) / 6);
  return sourceState / 25;
}

function mirrorBounceColour(bounces: number) {
  return new THREE.Color(
    MIRROR_BOUNCE_TINT.r ** bounces,
    MIRROR_BOUNCE_TINT.g ** bounces,
    MIRROR_BOUNCE_TINT.b ** bounces,
  ).multiplyScalar(MIRROR_REFLECTANCE ** bounces);
}

function frameBounceColour(bounces: number) {
  return new THREE.Color(
    MIRROR_BOUNCE_TINT.r ** bounces,
    MIRROR_BOUNCE_TINT.g ** bounces,
    MIRROR_BOUNCE_TINT.b ** bounces,
  ).multiplyScalar(MIRROR_REFLECTANCE ** bounces);
}

function reverseTriangleWinding(geometry: THREE.BufferGeometry) {
  const index = geometry.getIndex();

  if (index) {
    for (let offset = 0; offset < index.count; offset += 3) {
      const second = index.getX(offset + 1);
      index.setX(offset + 1, index.getX(offset + 2));
      index.setX(offset + 2, second);
    }
    index.needsUpdate = true;
    return;
  }

  for (const attribute of Object.values(geometry.attributes)) {
    for (let offset = 0; offset < attribute.count; offset += 3) {
      for (let component = 0; component < attribute.itemSize; component += 1) {
        const second = attribute.getComponent(offset + 1, component);
        attribute.setComponent(
          offset + 1,
          component,
          attribute.getComponent(offset + 2, component),
        );
        attribute.setComponent(offset + 2, component, second);
      }
    }
    attribute.needsUpdate = true;
  }
}

function bounceMaterial(material: THREE.Material, bounces: number) {
  const baseBeforeCompile = material.onBeforeCompile;
  const baseProgramCacheKey = material.customProgramCacheKey();
  const attenuated = material.clone();
  const attenuation = mirrorBounceColour(bounces);
  attenuated.onBeforeCompile = (shader, renderer) => {
    // Reflection proxies retain the source glass shader. Attenuation is
    // composed afterwards so the spectral surface lanes lose energy with the
    // rest of the reflected radiance instead of glowing through deep bounces.
    baseBeforeCompile.call(material, shader, renderer);
    shader.uniforms.daveBounceAttenuation = { value: attenuation };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 daveBounceAttenuation;",
      )
      .replace(
        "#include <opaque_fragment>",
        "outgoingLight *= daveBounceAttenuation;\n#include <opaque_fragment>",
      );
  };
  attenuated.customProgramCacheKey = () => (
    `${baseProgramCacheKey}|dave-mirror-bounce-${bounces}`
  );
  return attenuated;
}

/**
 * InstancedMesh deliberately rejects negative-scale matrices. Odd mirror cells
 * have determinant -1, so bake those cells and reverse their winding instead.
 * This preserves mirrored chirality, outward tube normals and physical BRDFs.
 */
function createOddParityImages(
  source: THREE.BufferGeometry,
  material: THREE.Material,
  cells: MirrorCell[],
  physicalBraidMatrix: THREE.Matrix4,
) {
  const transformed = cells.map((cell) => {
    const geometry = source.clone();
    geometry.applyMatrix4(cell.matrix.clone().multiply(physicalBraidMatrix));
    reverseTriangleWinding(geometry);
    return geometry;
  });
  const geometry = mergeGeometries(transformed, false);
  transformed.forEach((item) => item.dispose());
  if (!geometry) throw new Error("Could not bake Dave's odd-parity mirror images.");

  const bakedMaterial = bounceMaterial(material, cells[0].bounces);
  const mesh = new THREE.Mesh(geometry, bakedMaterial);
  mesh.name = `dave-odd-parity-bounce-${cells[0].bounces}`;
  mesh.layers.set(REFLECTION_LAYER);
  mesh.frustumCulled = false;
  return mesh;
}

class GeronoBraidCurve extends THREE.Curve<THREE.Vector3> {
  public constructor() {
    super();
  }

  getPoint(progress: number, target = new THREE.Vector3()) {
    const angle = progress * TAU;
    return target.set(
      0.52 * Math.sin(angle * 2),
      0.82 * Math.sin(angle),
      0.245 * Math.cos(angle),
    );
  }
}

function strandCurve(
  centerline: GeronoBraidCurve,
  frames: ReturnType<GeronoBraidCurve["computeFrenetFrames"]>,
  strandIndex: number,
) {
  const points: THREE.Vector3[] = [];
  const phase = (strandIndex / OUTER_STRAND_COUNT) * TAU;
  const ringRadius = 0.1;

  for (let index = 0; index < CURVE_SEGMENTS; index += 1) {
    const progress = index / CURVE_SEGMENTS;
    const point = centerline.getPoint(progress);
    const twist = phase + progress * TAU;
    point.addScaledVector(frames.normals[index], Math.cos(twist) * ringRadius);
    point.addScaledVector(frames.binormals[index], Math.sin(twist) * ringRadius);
    points.push(point);
  }

  return new THREE.CatmullRomCurve3(points, true, "centripetal", 0.5);
}

function strandMaterial(
  accentValue: THREE.ColorRepresentation,
  strandIndex: number,
  stripePhase: { value: number },
) {
  const accent = new THREE.Color(accentValue);
  const glassTint = new THREE.Color("#d5e0e2").lerp(accent, 0.08);
  const attenuationTint = new THREE.Color("#dbe5e4").lerp(accent, 0.18);
  const stripeOffset = strandIndex / (OUTER_STRAND_COUNT + 1);
  const material = new THREE.MeshPhysicalMaterial({
    color: glassTint,
    emissive: 0x000000,
    metalness: 0,
    roughness: 0.075,
    transmission: 0.78,
    thickness: 0.16,
    ior: 1.47,
    attenuationColor: attenuationTint,
    attenuationDistance: 0.72,
    specularIntensity: 1,
    specularColor: new THREE.Color("#e8f4f5"),
    clearcoat: 1,
    clearcoatRoughness: 0.035,
    iridescence: 0.24,
    iridescenceIOR: 1.34,
    iridescenceThicknessRange: [120, 340],
    envMapIntensity: 1.65,
    // Closed tube volumes render their outward boundary once. Odd-parity
    // mirror proxies reverse winding above, so they retain correct front faces
    // without a costly/unstable transparent double pass.
    side: THREE.FrontSide,
    dithering: true,
  });

  material.userData.daveAccent = accent.getHex();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.daveStripePhase = stripePhase;
    shader.uniforms.daveStripeOffset = { value: stripeOffset };
    shader.uniforms.daveStripeColour = { value: accent };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec2 vDaveTubeUv;",
      )
      .replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\nvDaveTubeUv = uv;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform float daveStripePhase;",
          "uniform float daveStripeOffset;",
          "uniform vec3 daveStripeColour;",
          "varying vec2 vDaveTubeUv;",
        ].join("\n"),
      )
      .replace(
        "#include <opaque_fragment>",
        `
          // A narrow longitudinal reflection lane rolls around each glass
          // filament while small energy peaks travel along its closed path.
          // Both coordinates derive from rigid root yaw; there is no separate
          // clock, so the optical motion stops exactly when the object stops.
          float daveRailCoordinate = fract(
            vDaveTubeUv.y
            + 0.115 * sin(6.28318530718 * (vDaveTubeUv.x * 2.0 + daveStripeOffset))
            - daveStripePhase * ${STRIPE_ROLL_PER_TURN.toFixed(2)}
            + daveStripeOffset
          );
          float daveRailDistance = abs(daveRailCoordinate - 0.5);
          float daveRail = 1.0 - smoothstep(0.026, 0.088, daveRailDistance);
          float davePathWave = 0.5 + 0.5 * cos(
            6.28318530718 * (
              vDaveTubeUv.x * ${STRIPE_PATH_REPEATS.toFixed(1)}
              - daveStripePhase * ${STRIPE_TRAVEL_PER_TURN.toFixed(2)}
              + daveStripeOffset
            )
          );
          float davePathPulse = smoothstep(0.16, 0.92, davePathWave);
          float daveFresnel = pow(
            1.0 - saturate(dot(geometryNormal, geometryViewDir)),
            2.15
          );
          float daveStripe = daveRail
            * (0.34 + 0.66 * davePathPulse)
            * (0.42 + 0.58 * daveFresnel);
          outgoingLight = mix(
            outgoingLight,
            outgoingLight * vec3(0.82, 0.91, 0.94),
            0.12
          );
          outgoingLight += daveStripeColour * daveStripe * 0.24;
          outgoingLight += vec3(0.72, 0.84, 0.88) * daveFresnel * 0.035;
          #include <opaque_fragment>
        `,
      );
  };
  material.customProgramCacheKey = () => "dave-reflective-glass-stripes-v1";
  return material;
}

function createDeepReflectionGeometry(curve: THREE.Curve<THREE.Vector3>) {
  const positions: number[] = [];
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();

  for (let index = 0; index < DEEP_REFLECTION_CURVE_SEGMENTS; index += 1) {
    curve.getPoint(index / DEEP_REFLECTION_CURVE_SEGMENTS, start);
    curve.getPoint((index + 1) / DEEP_REFLECTION_CURVE_SEGMENTS, end);
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function createPhysicalBraid(): PhysicalBraid {
  const group = new THREE.Group();
  group.name = "dave-physical-braid";

  const centerline = new GeronoBraidCurve();
  const frames = centerline.computeFrenetFrames(CURVE_SEGMENTS, true);
  const layers: BraidLayer[] = [];
  const stripePhase = { value: 0 };

  const accents = [
    "#b8d2d2",
    "#d0dcda",
    "#48a99e",
    "#b55e7d",
    "#568eb5",
    "#bf965f",
    "#639578",
  ];

  accents.forEach((accent, index) => {
    const curve = index === 0 ? centerline : strandCurve(centerline, frames, index - 1);
    const physicalGeometry = new THREE.TubeGeometry(
      curve,
      CURVE_SEGMENTS,
      0.05,
      12,
      true,
    );
    // The 384 px reflection targets cannot resolve the physical tessellation.
    // This LOD follows the identical analytic curve and tube radius.
    const reflectionGeometry = new THREE.TubeGeometry(
      curve,
      REFLECTION_CURVE_SEGMENTS,
      0.05,
      6,
      true,
    );
    const material = strandMaterial(accent, index, stripePhase);
    layers.push({
      geometry: reflectionGeometry,
      deepGeometry: createDeepReflectionGeometry(curve),
      material,
    });
    group.add(new THREE.Mesh(physicalGeometry, material));
  });

  const objectBasis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(1, -1, 0).normalize(),
    new THREE.Vector3(1, 1, 1).normalize(),
    new THREE.Vector3(-1, -1, 2).normalize(),
  );
  group.quaternion.setFromRotationMatrix(objectBasis);
  group.renderOrder = 8;
  group.traverse((object) => {
    object.renderOrder = 8;
  });
  group.updateMatrix();

  return {
    group,
    layers,
    setStripePhase: (turns) => {
      stripePhase.value = turns;
    },
  };
}

function createDeepReflectionLines(
  source: THREE.BufferGeometry,
  material: THREE.MeshPhysicalMaterial,
  cells: MirrorCell[],
  physicalBraidMatrix: THREE.Matrix4,
) {
  const sourcePosition = source.getAttribute("position");
  const positions: number[] = [];
  const colours: number[] = [];
  const point = new THREE.Vector3();

  cells.forEach((cell) => {
    const transform = cell.matrix.clone().multiply(physicalBraidMatrix);
    const accent = new THREE.Color(
      material.userData.daveAccent ?? material.color.getHex(),
    );
    const colour = accent.multiply(mirrorBounceColour(cell.bounces));
    for (let index = 0; index < sourcePosition.count; index += 1) {
      point.fromBufferAttribute(sourcePosition, index).applyMatrix4(transform);
      positions.push(point.x, point.y, point.z);
      colours.push(colour.r, colour.g, colour.b);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });
  const lines = new THREE.LineSegments(geometry, lineMaterial);
  lines.name = "dave-energy-converged-deep-braid-images";
  lines.layers.set(REFLECTION_LAYER);
  lines.frustumCulled = false;
  return lines;
}

/**
 * Builds virtual images from the six face-reflection transforms. These meshes
 * are visible only to the planar reflection cameras. Their transforms follow
 * mirror parity and virtual depth; no image gets an authored pose or scale.
 */
export function createMirrorCells(halfExtent: number, maxBounces: number) {
  const cells: MirrorCell[] = [];
  const translation = new THREE.Matrix4();
  const parity = new THREE.Matrix4();

  for (let x = -maxBounces; x <= maxBounces; x += 1) {
    for (let y = -maxBounces; y <= maxBounces; y += 1) {
      for (let z = -maxBounces; z <= maxBounces; z += 1) {
        const bounces = Math.abs(x) + Math.abs(y) + Math.abs(z);
        if (bounces === 0 || bounces > maxBounces) {
          continue;
        }

        translation.makeTranslation(2 * halfExtent * x, 2 * halfExtent * y, 2 * halfExtent * z);
        parity.makeScale(
          Math.abs(x) % 2 === 0 ? 1 : -1,
          Math.abs(y) % 2 === 0 ? 1 : -1,
          Math.abs(z) % 2 === 0 ? 1 : -1,
        );
        cells.push({
          matrix: new THREE.Matrix4().copy(translation).multiply(parity),
          bounces,
          index: new THREE.Vector3(x, y, z),
        });
      }
    }
  }

  return cells;
}

export function createRecursiveMirrorImages(
  layers: BraidLayer[],
  physicalBraidMatrix: THREE.Matrix4,
  halfExtent: number,
) {
  const images = new THREE.Group();
  images.name = "dave-recursive-braid-images";

  // A finite GPU cannot submit a literally infinite series. We unfold the
  // mirror box until the remaining 0.62^N optical energy is below an 8-bit
  // display step. Near images retain full tubes; unresolved distant images use
  // the same analytic strand curves as line traces.
  const cells = createMirrorCells(halfExtent, ENERGY_CONVERGENCE_BOUNCES);

  layers.forEach(({ geometry, deepGeometry, material }) => {
    for (let bounces = 1; bounces <= FULL_GEOMETRY_BOUNCES; bounces += 1) {
      const shell = cells.filter((cell) => cell.bounces === bounces);
      if (bounces % 2 === 1) {
        images.add(createOddParityImages(geometry, material, shell, physicalBraidMatrix));
        continue;
      }

      const mesh = new THREE.InstancedMesh(
        geometry,
        bounceMaterial(material, bounces),
        shell.length,
      );
      mesh.name = `dave-even-parity-bounce-${bounces}`;
      shell.forEach((cell, instanceIndex) => {
        mesh.setMatrixAt(instanceIndex, cell.matrix.clone().multiply(physicalBraidMatrix));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.layers.set(REFLECTION_LAYER);
      mesh.frustumCulled = false;
      images.add(mesh);
    }

    images.add(createDeepReflectionLines(
      deepGeometry,
      material,
      cells.filter((cell) => cell.bounces > FULL_GEOMETRY_BOUNCES),
      physicalBraidMatrix,
    ));
    deepGeometry.dispose();
  });

  return images;
}

/**
 * The dense straight-line field in the reference is the repeated image of the
 * twelve physical frame edges. Bake those exact image-cell transforms into one
 * line geometry per optical layer, keeping reflection draw calls bounded.
 */
export function createRecursiveFrameImages(
  source: THREE.BufferGeometry,
  layers: MirrorLineLayer[],
  halfExtent: number,
) {
  const images = new THREE.Group();
  images.name = "dave-recursive-frame-images";
  const sourcePosition = source.getAttribute("position");
  // As above, the face Reflector itself supplies the final bounce.
  const cells = createMirrorCells(halfExtent, ENERGY_CONVERGENCE_BOUNCES);

  layers.forEach((layer) => {
    const positions: number[] = [];
    const colours: number[] = [];
    const localScale = new THREE.Matrix4().makeScale(layer.scale, layer.scale, layer.scale);
    const point = new THREE.Vector3();

    cells.forEach((cell) => {
      const transform = cell.matrix.clone().multiply(localScale);
      const colour = layer.material.color.clone().multiply(frameBounceColour(cell.bounces));
      for (let index = 0; index < sourcePosition.count; index += 1) {
        point.fromBufferAttribute(sourcePosition, index).applyMatrix4(transform);
        positions.push(point.x, point.y, point.z);
        colours.push(colour.r, colour.g, colour.b);
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
    const material = layer.material.clone();
    material.color.set(0xffffff);
    material.vertexColors = true;
    const lines = new THREE.LineSegments(geometry, material);
    lines.layers.set(REFLECTION_LAYER);
    lines.frustumCulled = false;
    images.add(lines);
  });

  return images;
}

export { REFLECTION_LAYER };
