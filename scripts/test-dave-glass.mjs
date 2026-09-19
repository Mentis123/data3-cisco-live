import * as THREE from "three";

import {
  ALUMINIUM_GLASS_OPTICS,
  createPhysicalBraid,
  createRecursiveMirrorImages,
} from "../client/src/pages/dave/dave-physical.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function shaderFixture() {
  return {
    uniforms: {},
    vertexShader: [
      "#include <common>",
      "void main() {",
      "  #include <uv_vertex>",
      "}",
    ].join("\n"),
    fragmentShader: [
      "#include <common>",
      "void main() {",
      "  vec3 geometryNormal = vec3(0.0, 0.0, 1.0);",
      "  vec3 geometryViewDir = vec3(0.0, 0.0, 1.0);",
      "  vec3 outgoingLight = vec3(0.0);",
      "  vec3 radiance = vec3(0.0); vec3 iblIrradiance = vec3(0.0);",
      "  #include <lights_fragment_maps>",
      "  #include <opaque_fragment>",
      "}",
    ].join("\n"),
  };
}

const braid = createPhysicalBraid();
const directMesh = braid.group.children[0];
const directMaterial = directMesh.material;

// Seven filaments across one flat band with one half-twist: the three outer
// pairs each close as a single two-lap curve, the centre strand closes alone,
// so the band is one-sided and only four tubes exist.
assert(braid.group.children.length === 4, "A one-half-twist seven-strand band must be four closed tubes.");
const centreVertexCount = braid.group.children[3].geometry.getAttribute("position").count;
const pairVertexCount = braid.group.children[0].geometry.getAttribute("position").count;
assert(pairVertexCount > centreVertexCount * 1.9, "Paired strands must run two laps of the figure-eight.");

assert(
  directMaterial.metalness === ALUMINIUM_GLASS_OPTICS.metalness,
  "Aluminium coating reflectance drifted from the source fit.",
);
assert(
  directMaterial.roughness === ALUMINIUM_GLASS_OPTICS.roughness,
  "Aluminium-glass roughness drifted from the source fit.",
);
assert(
  directMaterial.transmission === ALUMINIUM_GLASS_OPTICS.transmission,
  "Glass substrate transmission drifted from the source fit.",
);
assert(directMaterial.ior === ALUMINIUM_GLASS_OPTICS.ior, "Glass IOR drifted.");
assert(directMaterial.side === THREE.FrontSide, "Closed glass must use one outward boundary.");
assert(directMaterial.userData.daveAccent !== undefined, "Glass accent metadata is missing.");

const directShader = shaderFixture();
directMaterial.onBeforeCompile(directShader, {});
assert(
  directShader.fragmentShader.includes("uniform float daveStripePhase;"),
  "Direct glass shader is missing its stripe phase.",
);
assert(
  directShader.fragmentShader.includes("float daveFresnel"),
  "Direct glass shader is missing its view-dependent spectral response.",
);
// Radiance ceiling + non-finite guards: a 0.052-roughness GGX lobe peaks
// near the half-float limit, and one non-finite texel in the recursive cube
// capture blacked out the whole frame at four of the nine source anchors.
assert(
  directShader.fragmentShader.includes("outgoingLight = min(outgoingLight, vec3(48.0))"),
  "Glass shader must cap radiance below the half-float limit.",
);
assert(
  directShader.fragmentShader.includes("isnan(radiance)") && directShader.fragmentShader.includes("isnan(iblIrradiance)"),
  "Glass shader must sanitise its environment samples.",
);

braid.setStripePhase(1.375);
assert(
  directShader.uniforms.daveStripePhase.value === 1.375,
  "Glass stripe phase is not connected to the shared root-yaw uniform.",
);

const mirrorImages = createRecursiveMirrorImages(
  braid.layers,
  braid.group.matrix,
  1.65,
);
const firstBounce = mirrorImages.children.find(
  (child) => child.name === "dave-odd-parity-bounce-1",
);
assert(firstBounce, "Could not find the first physical reflection proxy.");

const bounceMaterial = firstBounce.material;
const recursiveEnvironment = new THREE.CubeTexture();
braid.setEnvironment(recursiveEnvironment);
assert(
  directMaterial.envMap === recursiveEnvironment,
  "Direct aluminium-glass does not sample the recursive self environment.",
);
assert(
  bounceMaterial.envMap === null,
  "Reflection proxy must not sample the cube target that captures it.",
);
const bounceShader = shaderFixture();
bounceMaterial.onBeforeCompile(bounceShader, {});
const stripePosition = bounceShader.fragmentShader.indexOf(
  "outgoingLight += daveStripeColour",
);
const attenuationPosition = bounceShader.fragmentShader.indexOf(
  "outgoingLight *= daveBounceAttenuation",
);
const outputPosition = bounceShader.fragmentShader.indexOf(
  "#include <opaque_fragment>",
);
assert(stripePosition >= 0, "Reflection proxy dropped the spectral glass shader.");
assert(attenuationPosition > stripePosition, "Bounce attenuation must follow spectral shading.");
assert(outputPosition > attenuationPosition, "Bounce attenuation must precede final output.");
assert(
  bounceShader.uniforms.daveStripePhase.value === 1.375,
  "Reflection proxy does not share the physical glass phase.",
);

console.log("Dave aluminium-glass, recursive environment, yaw phase, and bounce composition: pass");
