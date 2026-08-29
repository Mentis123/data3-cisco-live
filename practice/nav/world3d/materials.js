/* Shared materials, sprite factories and shader snippets.

   Colour policy: the renderer runs with NoToneMapping and an sRGB output
   colour space. Where the single linear-to-sRGB conversion happens depends on
   the render pipeline — see setOutputEncoding below. */

import * as THREE from 'three';

/* Output encoding is pipeline-dependent, and getting it wrong is invisible
   until you compare the two paths side by side. three.js only applies output
   colour-space conversion when a material draws to the canvas — rendering into
   a composer's render target leaves built-in materials linear. So a custom
   shader that always encoded itself would match the direct path and be too
   bright in the composer path, while built-in materials would be too dark.

   Each page therefore declares its pipeline once, before building any
   material: pages that composite through EffectComposer let OutputPass do the
   single conversion at the end, and pages that render straight to the canvas
   have their custom shaders encode to match three.js's built-ins. */
let encodeOutput = true;

export function setOutputEncoding(enabled) {
  encodeOutput = !!enabled;
}

export function encodeGLSL(expression) {
  return encodeOutput ? `d3EncodeSRGB(${expression})` : `(${expression})`;
}

export const SRGB_ENCODE = `
vec3 d3EncodeSRGB(vec3 value) {
  return mix(pow(value, vec3(0.41666)) * 1.055 - vec3(0.055),
             value * 12.92,
             vec3(lessThanEqual(value, vec3(0.0031308))));
}
`;

const TOTEM_VERTEX = `
varying vec3 vNormalW;
varying vec3 vViewDirW;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDirW = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

/* Dim body fill + fresnel rim. The rim is what crosses the bloom threshold,
   so an object reads as a solid with light living on its edges rather than a
   featureless glowing blob. */
function totemFragment() {
  return `
uniform vec3 uColor;
uniform float uRimPower;
uniform float uRimIntensity;
uniform float uFill;
uniform float uPulseAmp;
uniform float uPhase;
uniform float uTime;
uniform float uDim;
uniform float uOpacity;
varying vec3 vNormalW;
varying vec3 vViewDirW;
${SRGB_ENCODE}
void main() {
  float facing = clamp(dot(normalize(vNormalW), normalize(vViewDirW)), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, uRimPower);
  float pulse = 1.0 + uPulseAmp * sin(uTime * 2.0 + uPhase);
  vec3 body = uColor * uFill;
  vec3 rim = mix(uColor, vec3(1.0), fresnel * 0.35) * fresnel * uRimIntensity * pulse;
  gl_FragColor = vec4(${encodeGLSL('(body + rim) * uDim')}, uOpacity);
}
`;
}

export function createTotemMaterial(colour, options = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colour) },
      uRimPower: { value: options.rimPower ?? 2.6 },
      uRimIntensity: { value: options.rimIntensity ?? 1.9 },
      uFill: { value: options.fill ?? 0.11 },
      uPulseAmp: { value: options.pulseAmp ?? 0.06 },
      uPhase: { value: options.phase ?? 0 },
      uTime: { value: 0 },
      uDim: { value: 1 },
      uOpacity: { value: options.opacity ?? 1 }
    },
    vertexShader: TOTEM_VERTEX,
    fragmentShader: totemFragment(),
    transparent: options.opacity !== undefined && options.opacity < 1,
    toneMapped: false
  });
}

/* Bright, unlit line/point colour: multiplying past 1.0 is what pushes an
   element over the bloom threshold. */
export function hotColour(colour, multiplier) {
  return new THREE.Color(colour).multiplyScalar(multiplier);
}

export function createLineMaterial(colour, multiplier = 1.4, opacity = 0.6) {
  return new THREE.LineBasicMaterial({
    color: hotColour(colour, multiplier),
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false
  });
}

/* ── Sprite textures ─────────────────────────────────────────────── */

let glowTexture = null;

export function radialGlowTexture() {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

/* Additive halo used as the mobile stand-in for post-processed bloom. */
export function createGlowSprite(colour, scale) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialGlowTexture(),
    color: new THREE.Color(colour),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.55,
    toneMapped: false
  }));
  sprite.scale.setScalar(scale);
  return sprite;
}

const labelCache = new Map();

function labelTexture(text, { colour = '#FFFFFF', weight = 800, fontSize = 64, pad = 18 }) {
  const key = `${text}|${colour}|${weight}|${fontSize}`;
  if (labelCache.has(key)) return labelCache.get(key);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `${weight} ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const height = Math.ceil(fontSize * 1.5);
  canvas.width = width;
  canvas.height = height;

  // Re-assigning canvas size resets the context state.
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,37,0.95)';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,37,0.92)';
  ctx.strokeText(text, width / 2, height / 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = colour;
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const record = { texture, aspect: width / height };
  labelCache.set(key, record);
  return record;
}

/* Camera-facing text. Sprites keep labels crisp and cost one draw call each,
   which is why label count is budgeted rather than unlimited.

   Size attenuation is off by default: a label's job is to stay readable, and
   perspective scaling makes near labels swamp the scene while far ones vanish.
   With attenuation off the height is a fraction of the viewport instead. */
export function createLabelSprite(text, options = {}) {
  const { texture, aspect } = labelTexture(text, options);
  const height = options.height ?? 0.06;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: options.depthTest !== false,
    sizeAttenuation: options.sizeAttenuation ?? false,
    toneMapped: false,
    opacity: options.opacity ?? 1
  }));
  sprite.scale.set(height * aspect, height, 1);
  sprite.userData.baseHeight = height;
  sprite.userData.aspect = aspect;
  return sprite;
}

export function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => material.dispose());
    }
  });
}
