import * as THREE from "three";

import {
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
      "  #include <opaque_fragment>",
      "}",
    ].join("\n"),
  };
}

const braid = createPhysicalBraid();
const directMesh = braid.group.children[0];
const directMaterial = directMesh.material;

assert(directMaterial.metalness === 0, "Glass must remain dielectric.");
assert(directMaterial.roughness === 0.075, "Glass roughness drifted from the source fit.");
assert(directMaterial.transmission === 0.78, "Glass transmission drifted from the source fit.");
assert(directMaterial.ior === 1.47, "Glass IOR drifted from the source fit.");
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

console.log("Dave glass material, yaw phase, and bounce composition: pass");
