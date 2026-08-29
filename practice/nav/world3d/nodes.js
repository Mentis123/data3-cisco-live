/* Capability and offering nodes, drawn as instanced meshes.

   The whole constellation — up to 6 capabilities and 41 offerings for the
   largest practice — costs four draw calls in total, because every node of a
   given level shares one geometry and one material and differs only by
   per-instance matrix and colour. */

import * as THREE from 'three';
import { hotColour, createLabelSprite } from './materials.js';

const CAPABILITY_CAPACITY = 12;
const OFFERING_CAPACITY = 72;
const LINK_CAPACITY = 96;

const _matrix = new THREE.Matrix4();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _colour = new THREE.Color();

/* three.js computes an InstancedMesh's bounding volumes once and caches them
   forever — it has no way to know the matrices changed. These meshes start at
   count 0 and are rewritten on every state change, so a stale cache is not a
   nicety: a sphere computed at count 0 has radius -1, and every raycast against
   it is rejected before a single triangle is tested. */
function invalidateBounds(mesh) {
  mesh.boundingSphere = null;
  mesh.boundingBox = null;
}

function instanced(geometry, material, capacity) {
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;
  return mesh;
}

export class NodeField {
  constructor() {
    this.group = new THREE.Group();

    const capabilityGeometry = new THREE.IcosahedronGeometry(1, 1);
    this.capabilitySolid = instanced(capabilityGeometry, new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false
    }), CAPABILITY_CAPACITY);
    this.capabilityWire = instanced(capabilityGeometry, new THREE.MeshBasicMaterial({
      wireframe: true, transparent: true, opacity: 0.9, toneMapped: false
    }), CAPABILITY_CAPACITY);

    this.offerings = instanced(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0.95, toneMapped: false
    }), OFFERING_CAPACITY);

    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LINK_CAPACITY * 6), 3));
    linkGeometry.setDrawRange(0, 0);
    this.links = new THREE.LineSegments(linkGeometry, new THREE.LineBasicMaterial({
      transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false
    }));
    this.links.frustumCulled = false;

    this.labelGroup = new THREE.Group();
    this.group.add(this.capabilitySolid, this.capabilityWire, this.offerings, this.links, this.labelGroup);

    this.capabilityItems = [];
    this.offeringItems = [];
    this.labels = [];
  }

  /* `entries` comes straight from layout.practiceLayout(). Positions are
     absolute, so a state change is a full rewrite of ~50 matrices — cheap
     enough to do on demand and far simpler than diffing. */
  setPractice(entries, practiceColour, options = {}) {
    this.capabilityItems = [];
    this.offeringItems = [];
    const linkPositions = this.links.geometry.getAttribute('position');
    let linkIndex = 0;

    entries.forEach(entry => {
      const capabilityIndex = this.capabilityItems.length;
      if (capabilityIndex >= CAPABILITY_CAPACITY) return;

      const dim = entry.dimmed ? 0.42 : 1;
      _scale.setScalar(entry.nodeScale * 0.26);
      _matrix.compose(entry.position, _quaternion, _scale);
      this.capabilitySolid.setMatrixAt(capabilityIndex, _matrix);
      this.capabilityWire.setMatrixAt(capabilityIndex, _matrix);
      _colour.copy(hotColour(practiceColour, entry.focused ? 2 : 1.5)).multiplyScalar(dim);
      this.capabilitySolid.setColorAt(capabilityIndex, _colour);
      this.capabilityWire.setColorAt(capabilityIndex, _colour);
      this.capabilityItems.push({ entry, phase: capabilityIndex * 0.9, baseScale: entry.nodeScale * 0.26 });

      entry.offerings.forEach((position, index) => {
        const offeringIndex = this.offeringItems.length;
        if (offeringIndex >= OFFERING_CAPACITY) return;
        const offering = entry.capability.offerings[index];
        _scale.setScalar(entry.offeringScale * 0.075);
        _matrix.compose(position, _quaternion, _scale);
        this.offerings.setMatrixAt(offeringIndex, _matrix);
        _colour.copy(hotColour(practiceColour, entry.focused ? 2.4 : 1.7)).multiplyScalar(dim);
        this.offerings.setColorAt(offeringIndex, _colour);
        this.offeringItems.push({
          offering, position, entry,
          phase: offeringIndex * 0.37,
          baseScale: entry.offeringScale * 0.075
        });

        if (linkIndex < LINK_CAPACITY && !entry.dimmed) {
          linkPositions.setXYZ(linkIndex * 2, entry.position.x, entry.position.y, entry.position.z);
          linkPositions.setXYZ(linkIndex * 2 + 1, position.x, position.y, position.z);
          linkIndex += 1;
        }
      });
    });

    this.capabilitySolid.count = this.capabilityItems.length;
    this.capabilityWire.count = this.capabilityItems.length;
    this.offerings.count = this.offeringItems.length;
    this.capabilitySolid.instanceMatrix.needsUpdate = true;
    this.capabilityWire.instanceMatrix.needsUpdate = true;
    this.offerings.instanceMatrix.needsUpdate = true;
    if (this.capabilitySolid.instanceColor) this.capabilitySolid.instanceColor.needsUpdate = true;
    if (this.capabilityWire.instanceColor) this.capabilityWire.instanceColor.needsUpdate = true;
    if (this.offerings.instanceColor) this.offerings.instanceColor.needsUpdate = true;

    [this.capabilitySolid, this.capabilityWire, this.offerings].forEach(invalidateBounds);

    linkPositions.needsUpdate = true;
    this.links.geometry.setDrawRange(0, linkIndex * 2);
    this.links.material.color.copy(hotColour(practiceColour, 1.2));

    this.setLabels(entries, options);
  }

  /* Label budget: capability names always, offering names only for the focused
     capability. That keeps live sprites well under the point where text starts
     costing real fill rate on a phone. */
  setLabels(entries, options = {}) {
    this.clearLabels();
    const unit = options.unit ?? 0.0015;
    const px = options.px || { capability: 16, capabilityFocused: 20, capabilityDim: 13, offering: 12 };

    entries.forEach(entry => {
      // Dimmed siblings keep a faint name so the user never loses their place,
      // but they shrink out of competition with the focused capability.
      const label = createLabelSprite(entry.capability.name, {
        colour: '#FFFFFF',
        height: (entry.focused ? px.capabilityFocused : entry.dimmed ? px.capabilityDim : px.capability) * unit,
        opacity: entry.focused ? 1 : (entry.dimmed ? 0.5 : 0.9)
      });
      label.position.copy(entry.position).y += entry.discRadius + 0.42;
      this.labelGroup.add(label);
      this.labels.push(label);

      if (!entry.focused) return;
      entry.capability.offerings.forEach((offering, index) => {
        const position = entry.offerings[index];
        if (!position) return;
        const offeringLabel = createLabelSprite(offering.name, {
          colour: '#DCEAF6', height: px.offering * unit, weight: 700, opacity: 0.95
        });
        offeringLabel.position.copy(position).y += 0.17;
        this.labelGroup.add(offeringLabel);
        this.labels.push(offeringLabel);
      });
    });
  }

  clearLabels() {
    this.labels.forEach(label => {
      this.labelGroup.remove(label);
      label.material.dispose();
    });
    this.labels = [];
  }

  clear() {
    this.capabilityItems = [];
    this.offeringItems = [];
    this.capabilitySolid.count = 0;
    this.capabilityWire.count = 0;
    this.offerings.count = 0;
    [this.capabilitySolid, this.capabilityWire, this.offerings].forEach(invalidateBounds);
    this.links.geometry.setDrawRange(0, 0);
    this.clearLabels();
  }

  update(time) {
    // Gentle breathing so the constellation feels alive without spinning.
    this.capabilityItems.forEach((item, index) => {
      _scale.setScalar(item.baseScale * (1 + 0.05 * Math.sin(time * 1.4 + item.phase)));
      _matrix.compose(item.entry.position, _quaternion, _scale);
      this.capabilitySolid.setMatrixAt(index, _matrix);
      this.capabilityWire.setMatrixAt(index, _matrix);
    });
    if (this.capabilityItems.length) {
      this.capabilitySolid.instanceMatrix.needsUpdate = true;
      this.capabilityWire.instanceMatrix.needsUpdate = true;
    }

    this.offeringItems.forEach((item, index) => {
      _scale.setScalar(item.baseScale * (1 + 0.12 * Math.sin(time * 2.1 + item.phase)));
      _matrix.compose(item.position, _quaternion, _scale);
      this.offerings.setMatrixAt(index, _matrix);
    });
    if (this.offeringItems.length) this.offerings.instanceMatrix.needsUpdate = true;
  }

  /* Returns the nearest hit across both node levels, or null. */
  pick(raycaster) {
    const hits = [];
    const capabilityHits = raycaster.intersectObject(this.capabilityWire, false);
    if (capabilityHits.length) {
      const item = this.capabilityItems[capabilityHits[0].instanceId];
      if (item) hits.push({ distance: capabilityHits[0].distance, kind: 'capability', item });
    }
    const offeringHits = raycaster.intersectObject(this.offerings, false);
    if (offeringHits.length) {
      const item = this.offeringItems[offeringHits[0].instanceId];
      if (item) hits.push({ distance: offeringHits[0].distance, kind: 'offering', item });
    }
    hits.sort((a, b) => a.distance - b.distance);
    return hits[0] || null;
  }
}
