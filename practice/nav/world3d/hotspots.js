/* Tappable hotspot affordance.

   One quad per totem carrying a radial signed-distance shader that draws the
   static ring, the outward "sonar" pulse and a faint interior disc in a single
   draw call. The expanding-and-fading pulse is the universal "tap me" cue; the
   faint disc is what makes it read as a button rather than decoration. */

import * as THREE from 'three';
import { SRGB_ENCODE, encodeGLSL } from './materials.js';

const VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function hotspotFragment() {
  return `
uniform float uTime;
uniform float uActive;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;
${SRGB_ENCODE}
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float ring = 1.0 - smoothstep(0.0, 0.025, abs(d - 0.62));
  float p = fract(uTime * 0.55);
  float wave = mix(0.3, 0.95, p);
  float pulse = (1.0 - smoothstep(0.0, 0.06, abs(d - wave))) * (1.0 - p) * (1.0 - p);
  float disc = (1.0 - smoothstep(0.45, 0.62, d)) * 0.1;
  float alpha = (ring * 0.9 + pulse * 0.55 + disc) * uOpacity;
  vec3 colour = uColor * mix(0.9, 1.8, uActive);
  gl_FragColor = vec4(${encodeGLSL('colour')}, alpha);
}
`;
}

export class Hotspot {
  constructor(colour, { size = 2.2, orientation = 'floor' } = {}) {
    this.orientation = orientation;
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActive: { value: 0 },
        uOpacity: { value: 1 },
        uColor: { value: new THREE.Color(colour) }
      },
      vertexShader: VERTEX,
      fragmentShader: hotspotFragment(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.material);
    this.mesh.renderOrder = 10;
    if (orientation === 'floor') this.mesh.rotation.x = -Math.PI / 2;
    this.frozen = false;
  }

  setActive(active) {
    this.material.uniforms.uActive.value = active ? 1 : 0;
    this.frozen = active;
  }

  setOpacity(value) {
    this.material.uniforms.uOpacity.value = value;
  }

  update(time, camera) {
    // A selected hotspot holds its pulse — the animation is an invitation, and
    // once accepted it should stop asking.
    if (!this.frozen) this.material.uniforms.uTime.value = time;
    if (this.orientation === 'billboard' && camera) this.mesh.quaternion.copy(camera.quaternion);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
