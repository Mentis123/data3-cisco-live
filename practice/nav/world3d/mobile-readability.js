/* Mobile readability layer shared by Portfolio World and AR.

   The scene deliberately keeps higher taxonomy levels visible as context, but
   the original mobile balance left their hot accents, sibling offerings and
   ambient decoration competing with the active labels. This module patches the
   shared classes before either page boots so the hierarchy remains legible on
   narrow screens without changing the desktop composition. */

import * as THREE from 'three';
import { PortfolioWorld } from './scene.js';
import { NodeField } from './nodes.js';
import { hotColour } from './materials.js';

const MOBILE_QUERY = '(max-width: 760px), (pointer: coarse)';
const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

function materialList(material) {
  return Array.isArray(material) ? material : [material];
}

function rememberMaterial(material) {
  if (!material || material.userData.d3ReadabilityBase) return;
  material.userData.d3ReadabilityBase = {
    opacity: material.opacity ?? 1,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
    color: material.color ? material.color.clone() : null
  };
}

function deepDimTotem(totem, dim) {
  const safeDim = THREE.MathUtils.clamp(dim, 0, 1);
  const main = totem.userData.material;
  totem.userData.d3ReadabilityDim = safeDim;

  if (main?.uniforms?.uDim) main.uniforms.uDim.value = safeDim;
  if (main?.uniforms?.uOpacity) main.uniforms.uOpacity.value = safeDim;
  if (main) {
    if (!main.userData.d3ReadabilityBase) {
      main.userData.d3ReadabilityBase = {
        transparent: main.transparent,
        depthWrite: main.depthWrite
      };
    }
    main.transparent = main.userData.d3ReadabilityBase.transparent || safeDim < 0.999;
    main.depthWrite = safeDim >= 0.999 ? main.userData.d3ReadabilityBase.depthWrite : false;
    main.needsUpdate = true;
  }

  totem.traverse(child => {
    if (!child.material || child === totem.userData.proxy) return;
    materialList(child.material).forEach(material => {
      if (!material || material === main || material.colorWrite === false) return;
      rememberMaterial(material);
      const base = material.userData.d3ReadabilityBase;
      if (material.color && base.color) material.color.copy(base.color).multiplyScalar(safeDim);
      const opacityDim = child.isSprite ? Math.pow(safeDim, 1.45) : safeDim;
      material.opacity = base.opacity * opacityDim;
      material.transparent = base.transparent || safeDim < 0.999;
      material.depthWrite = safeDim >= 0.999 ? base.depthWrite : false;
      material.needsUpdate = true;
    });
  });
}

const originalSetPractice = NodeField.prototype.setPractice;
NodeField.prototype.setPractice = function setPracticeReadable(entries, practiceColour, options = {}) {
  if (!isMobile()) return originalSetPractice.call(this, entries, practiceColour, options);

  const readableEntries = entries.map(entry => entry.dimmed
    ? { ...entry, offerings: [], nodeScale: entry.nodeScale * 0.78 }
    : entry);

  const mobilePx = {
    ...(options.px || {}),
    capability: 19,
    capabilityFocused: 24,
    capabilityDim: 13,
    offering: 16
  };
  originalSetPractice.call(this, readableEntries, practiceColour, { ...options, px: mobilePx });

  readableEntries.forEach((entry, index) => {
    const capabilityDim = entry.dimmed ? 0.075 : 1;
    const colour = hotColour(practiceColour, entry.focused ? 2 : 1.5).multiplyScalar(capabilityDim);
    this.capabilitySolid.setColorAt(index, colour);
    this.capabilityWire.setColorAt(index, colour);
  });

  this.offeringItems.forEach((item, index) => {
    const entry = item.entry;
    const offeringDim = entry.focused ? 1 : 0.18;
    const colour = hotColour(practiceColour, entry.focused ? 2.4 : 1.7).multiplyScalar(offeringDim);
    this.offerings.setColorAt(index, colour);
  });

  if (this.capabilitySolid.instanceColor) this.capabilitySolid.instanceColor.needsUpdate = true;
  if (this.capabilityWire.instanceColor) this.capabilityWire.instanceColor.needsUpdate = true;
  if (this.offerings.instanceColor) this.offerings.instanceColor.needsUpdate = true;

  let cursor = 0;
  readableEntries.forEach(entry => {
    const capabilityLabel = this.labels[cursor++];
    if (capabilityLabel) {
      capabilityLabel.material.opacity = entry.focused ? 1 : (entry.dimmed ? 0.16 : 0.94);
      capabilityLabel.position.y += 0.14;
    }
    if (!entry.focused) return;
    entry.capability.offerings.forEach(() => {
      const offeringLabel = this.labels[cursor++];
      if (!offeringLabel) return;
      offeringLabel.material.opacity = 1;
      offeringLabel.position.y += 0.11;
    });
  });
};

const originalSetViewport = PortfolioWorld.prototype.setViewport;
PortfolioWorld.prototype.setViewport = function setViewportReadable(aspect, height) {
  const fov = originalSetViewport.call(this, aspect, height);
  if (!isMobile()) return fov;

  this.cfg.stagger = 1.4;
  this.labelPx = {
    practice: 18,
    capability: 19,
    capabilityFocused: 24,
    capabilityDim: 13,
    offering: 16
  };
  this.practiceLabels.forEach(label => {
    const size = this.labelPx.practice * this.labelUnit;
    label.scale.set(size * label.userData.aspect, size, 1);
  });
  if (this.state.practice) this.applyState();
  return fov;
};

const originalApplyState = PortfolioWorld.prototype.applyState;
PortfolioWorld.prototype.applyState = function applyReadableState() {
  originalApplyState.call(this);
  if (!isMobile()) return;

  const practiceOpen = Boolean(this.state.practice);
  const capabilityOpen = Boolean(this.state.capability);

  if (this.floor) this.floor.material.opacity = capabilityOpen ? 0.035 : practiceOpen ? 0.075 : 0.22;
  if (this.particles) this.particles.visible = !practiceOpen;

  this.totems.forEach((totem, slug) => {
    const selectedPractice = slug === this.state.practice;
    let dim = 1;
    if (practiceOpen) {
      dim = selectedPractice
        ? (capabilityOpen ? 0.025 : 0.06)
        : (capabilityOpen ? 0.004 : 0.012);
    }
    deepDimTotem(totem, dim);

    const label = this.practiceLabels.get(slug);
    if (label) {
      label.visible = !practiceOpen;
      label.material.opacity = practiceOpen ? 0 : 1;
    }

    const hotspot = this.hotspots.get(slug);
    if (hotspot) {
      hotspot.setActive(false);
      hotspot.setOpacity(practiceOpen
        ? (selectedPractice ? (capabilityOpen ? 0.015 : 0.04) : 0.004)
        : 1);
    }
  });
};

const originalUpdate = PortfolioWorld.prototype.update;
PortfolioWorld.prototype.update = function updateReadable(delta, time, camera) {
  originalUpdate.call(this, delta, time, camera);
  if (!isMobile() || !this.state.practice) return;

  // Several totem builders animate the opacity of decorative sub-meshes.
  // Reapply the contextual fade after animation so those accents cannot flare
  // back up behind the active Capability or Offering set.
  this.totems.forEach(totem => {
    if ((totem.userData.d3ReadabilityDim ?? 1) < 0.999) {
      deepDimTotem(totem, totem.userData.d3ReadabilityDim);
    }
  });
};
