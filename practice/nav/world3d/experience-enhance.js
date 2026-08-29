import * as THREE from 'three';
import { DetailCard } from '../world3d/detail-card.js';
import { PortfolioWorld } from '../world3d/scene.js';
import { NodeField } from '../world3d/nodes.js';

const mobileQuery = window.matchMedia('(max-width: 760px), (pointer: coarse)');

function rememberMaterial(material) {
  if (!material || material.userData.data3FocusBase) return;
  const readableBase = material.userData.d3ReadabilityBase || null;
  material.userData.data3FocusBase = {
    opacity: readableBase?.opacity ?? material.opacity ?? 1,
    transparent: readableBase?.transparent ?? material.transparent,
    depthWrite: readableBase?.depthWrite ?? material.depthWrite,
    colour: readableBase?.color ? readableBase.color.clone() : (material.color ? material.color.clone() : null)
  };
}

function dimTotemDeep(totem, amount) {
  const dim = THREE.MathUtils.clamp(amount, 0, 1);
  const main = totem.userData.material;
  totem.userData.data3FocusDim = dim;
  if (main?.uniforms?.uDim) main.uniforms.uDim.value = dim;
  if (main?.uniforms?.uOpacity) main.uniforms.uOpacity.value = dim;
  totem.traverse(child => {
    if (!child.material || child === totem.userData.proxy) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => {
      if (!material || material === main || material.colorWrite === false) return;
      rememberMaterial(material);
      const base = material.userData.data3FocusBase;
      if (material.color && base.colour) material.color.copy(base.colour).multiplyScalar(dim);
      material.opacity = base.opacity * (child.isSprite ? Math.pow(dim, 1.35) : dim);
      material.transparent = base.transparent || dim < 0.999;
      material.depthWrite = dim >= 0.999 ? base.depthWrite : false;
      material.needsUpdate = true;
    });
  });
}

if (!NodeField.prototype.__data3ReadableLabels) {
  NodeField.prototype.__data3ReadableLabels = true;
  const originalSetLabels = NodeField.prototype.setLabels;
  NodeField.prototype.setLabels = function setLargerLabels(entries, options = {}) {
    const mobile = mobileQuery.matches;
    const px = mobile
      ? { capability: 22, capabilityFocused: 29, capabilityDim: 15, offering: 19 }
      : { capability: 20, capabilityFocused: 26, capabilityDim: 15, offering: 16 };
    return originalSetLabels.call(this, entries, { ...options, px: { ...(options.px || {}), ...px } });
  };

  const originalSetPractice = NodeField.prototype.setPractice;
  NodeField.prototype.setPractice = function setCalmerNodes(entries, practiceColour, options = {}) {
    const result = originalSetPractice.call(this, entries, practiceColour, options);
    const colour = new THREE.Color();
    for (let index = 0; index < this.capabilitySolid.count; index += 1) {
      this.capabilitySolid.getColorAt(index, colour);
      this.capabilitySolid.setColorAt(index, colour.multiplyScalar(entries[index]?.dimmed ? 0.48 : 0.72));
      this.capabilityWire.getColorAt(index, colour);
      this.capabilityWire.setColorAt(index, colour.multiplyScalar(entries[index]?.dimmed ? 0.42 : 0.68));
    }
    this.offeringItems.forEach((item, index) => {
      this.offerings.getColorAt(index, colour);
      this.offerings.setColorAt(index, colour.multiplyScalar(item.entry.dimmed ? 0.3 : 0.72));
    });
    if (this.capabilitySolid.instanceColor) this.capabilitySolid.instanceColor.needsUpdate = true;
    if (this.capabilityWire.instanceColor) this.capabilityWire.instanceColor.needsUpdate = true;
    if (this.offerings.instanceColor) this.offerings.instanceColor.needsUpdate = true;
    return result;
  };
}

if (!PortfolioWorld.prototype.__data3FocusHierarchy) {
  PortfolioWorld.prototype.__data3FocusHierarchy = true;
  const originalApplyState = PortfolioWorld.prototype.applyState;
  PortfolioWorld.prototype.applyState = function applyFocusedHierarchy() {
    originalApplyState.call(this);
    const practiceOpen = Boolean(this.state.practice);
    const capabilityOpen = Boolean(this.state.capability);
    if (!practiceOpen) {
      this.totems.forEach(totem => dimTotemDeep(totem, 1));
      if (this.floor) this.floor.material.opacity = 0.22;
      if (this.particles) this.particles.visible = true;
      return;
    }
    this.totems.forEach((totem, slug) => {
      const selected = slug === this.state.practice;
      const dim = selected ? (capabilityOpen ? 0.035 : 0.11) : (capabilityOpen ? 0.006 : 0.018);
      dimTotemDeep(totem, dim);
      const hotspot = this.hotspots.get(slug);
      if (hotspot) hotspot.setOpacity(selected ? (capabilityOpen ? 0.025 : 0.08) : 0.008);
    });
    if (this.floor) this.floor.material.opacity = capabilityOpen ? 0.05 : 0.09;
    if (this.particles) this.particles.visible = false;
  };

  const originalUpdate = PortfolioWorld.prototype.update;
  PortfolioWorld.prototype.update = function updateFocusedHierarchy(delta, time, camera) {
    originalUpdate.call(this, delta, time, camera);
    if (!this.state.practice) return;
    this.totems.forEach(totem => {
      if ((totem.userData.data3FocusDim ?? 1) < 0.999) dimTotemDeep(totem, totem.userData.data3FocusDim);
    });
  };
}

function waitFor(test, timeout = 10000) {
  return new Promise(resolve => {
    const start = performance.now();
    const tick = () => {
      let value = null;
      try { value = test(); } catch (error) {}
      if (value) return resolve(value);
      if (performance.now() - start >= timeout) return resolve(null);
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

async function startStateFeatures() {
  const ready = await waitFor(() => window.DATA3_VIEW_STATE && window.DATA3_OFFERING_DETAIL && window.DATA3_PORTFOLIO);
  if (!ready) return;
  const stateApi = window.DATA3_VIEW_STATE;
  const detailApi = window.DATA3_OFFERING_DETAIL;
  const portfolio = window.DATA3_PORTFOLIO;

  const originalShow = DetailCard.prototype.show;
  const originalHide = DetailCard.prototype.hide;

  if (!DetailCard.prototype.__data3RichOffering) {
    DetailCard.prototype.__data3RichOffering = true;

    DetailCard.prototype.show = function showRich(payload) {
      if (payload?.level !== 'offering' || !payload.practice || !payload.capability || !payload.offering) {
        return originalShow.call(this, payload);
      }
      const next = stateApi.resolve({
        practiceId: payload.practice.id || payload.practice.slug,
        capabilityId: payload.capability.id || payload.capability.slug,
        offeringId: payload.offering.id
      });
      stateApi.set(next);
      detailApi.mount(this.root, next, { compact: true, closeButton: true });
      this.root.classList.add('sharedOfferingRecord');
      this.root.hidden = false;
      this.root.dataset.level = 'offering';
    };

    DetailCard.prototype.hide = function hideRich() {
      this.root.classList.remove('sharedOfferingRecord');
      return originalHide.call(this);
    };
  }

  const slug = value => stateApi.slug(value);

  function sourcePathFromApi(api) {
    const practice = api.world.state.practice
      ? portfolio.practices.find(item => slug(item.name) === api.world.state.practice)
      : null;
    const capability = practice && api.world.state.capability
      ? practice.capabilities.find(item => slug(item.name) === api.world.state.capability)
      : null;
    const card = document.getElementById('detailCard');
    const offeringId = card && !card.hidden
      ? card.querySelector('[data-offering-record]')?.getAttribute('data-offering-record') || ''
      : '';
    return stateApi.resolve({
      practiceId: practice?.id || '',
      capabilityId: capability?.id || '',
      offeringId
    });
  }

  function syncFromApi(api) {
    if (!api?.world) return;
    stateApi.set(sourcePathFromApi(api));
  }

  function showRestoredOffering(state, worldMode) {
    if (!state.offeringId) return;
    const root = document.getElementById('detailCard');
    if (!root) return;
    detailApi.mount(root, state, { compact: true, closeButton: true });
    root.classList.add('sharedOfferingRecord');
    root.hidden = false;
    if (worldMode) {
      const stage = document.querySelector('.worldStage');
      if (stage && window.innerWidth <= 820) {
        stage.classList.add('has-card');
        window.requestAnimationFrame(() => {
          stage.style.setProperty('--cardH', `${Math.min(root.offsetHeight, Math.round(window.innerHeight * .58))}px`);
          window.dispatchEvent(new Event('resize'));
        });
      }
    }
  }

  function patchOverviewPitch(api) {
    const rig = api?.rig;
    if (!rig || rig.__data3OverviewPitch) return;
    rig.__data3OverviewPitch = true;
    rig.overviewPitch = 0.18;
    rig.overviewTargetPitch = 0.18;

    const originalOverviewPose = rig.overviewPose.bind(rig);
    const originalDrag = rig.drag.bind(rig);
    const originalUpdate = rig.update.bind(rig);
    const target = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const matrix = new THREE.Matrix4();

    rig.overviewPose = function overviewPoseWithPitch(yaw, position = new THREE.Vector3(), quaternion = new THREE.Quaternion()) {
      originalOverviewPose(yaw, position, quaternion);
      const distance = this.cfg.radius * 1.9;
      const horizontal = Math.cos(this.overviewPitch) * distance;
      position.set(
        Math.sin(yaw) * horizontal,
        this.cfg.eye + 0.2 + Math.sin(this.overviewPitch) * distance,
        Math.cos(yaw) * horizontal
      );
      target.set(0, this.cfg.eye + 0.2, 0);
      matrix.lookAt(position, target, up);
      quaternion.setFromRotationMatrix(matrix);
      return { position, quaternion };
    };

    rig.drag = function dragWithOverviewPitch(dx, dy) {
      if (this.mode === 'overview') {
        this.orbitTargetYaw -= dx * 0.0055;
        this.overviewTargetPitch = THREE.MathUtils.clamp(this.overviewTargetPitch + dy * 0.003, 0.03, 0.54);
        return;
      }
      originalDrag(dx, dy * 1.12);
    };

    rig.update = function updateWithOverviewPitch(delta) {
      const smoothing = 1 - Math.exp(-delta / 0.1);
      this.overviewPitch += (this.overviewTargetPitch - this.overviewPitch) * smoothing;
      originalUpdate(delta);
    };
  }

  function tuneWorld(api) {
    api.world.totems.forEach(totem => {
      const material = totem.userData.material;
      if (material?.uniforms?.uRimIntensity) material.uniforms.uRimIntensity.value = Math.min(material.uniforms.uRimIntensity.value, 1.28);
      if (material?.uniforms?.uPulseAmp) material.uniforms.uPulseAmp.value = Math.min(material.uniforms.uPulseAmp.value, 0.025);
      totem.traverse(child => {
        const materials = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
        materials.forEach(item => {
          if (!item || item.colorWrite === false) return;
          if (child.isSprite) item.opacity = Math.min(item.opacity, 0.28);
          if (!item.color || item.userData.data3PeakCapped) return;
          const peak = Math.max(item.color.r, item.color.g, item.color.b);
          if (peak > 1.12) item.color.multiplyScalar(1.12 / peak);
          item.userData.data3PeakCapped = true;
          item.needsUpdate = true;
        });
      });
    });
    const composer = api.getComposer?.();
    composer?.passes?.forEach(pass => {
      if (pass?.constructor?.name !== 'UnrealBloomPass') return;
      pass.strength = 0.32;
      pass.radius = 0.24;
      pass.threshold = 1.0;
    });
  }

  async function mountWorld() {
    const api = await waitFor(() => window.__WORLD__);
    if (!api) return;
    patchOverviewPitch(api);
    tuneWorld(api);
    window.setTimeout(() => tuneWorld(api), 700);

    const initial = stateApi.get();
    const path = stateApi.pathFor(initial);
    if (path.practice) {
      api.applyState({
        practice: slug(path.practice.name),
        capability: path.capability ? slug(path.capability.name) : null
      }, { fly: false });
      showRestoredOffering(initial, true);
    } else {
      syncFromApi(api);
    }

    window.addEventListener('hashchange', () => window.setTimeout(() => syncFromApi(api), 30));
    document.addEventListener('click', event => {
      if (!event.target.closest('#worldCanvas,#backButton,#resetButton,[data-card-close]')) return;
      window.setTimeout(() => syncFromApi(api), 90);
    }, true);
  }

  async function mountAr() {
    const api = await waitFor(() => window.__AR__);
    if (!api) return;
    tuneWorld(api);
    const initial = stateApi.get();
    const path = stateApi.pathFor(initial);
    if (path.practice) {
      api.applyState({
        practice: slug(path.practice.name),
        capability: path.capability ? slug(path.capability.name) : null
      });
    } else {
      syncFromApi(api);
    }

    const startButton = document.getElementById('startButton');
    if (initial.offeringId) startButton?.addEventListener('click', () => window.setTimeout(() => showRestoredOffering(initial, false), 850), { once: true });
    document.addEventListener('click', event => {
      if (!event.target.closest('#arCanvas,#arBackButton,[data-card-close]')) return;
      window.setTimeout(() => syncFromApi(api), 90);
    }, true);
  }

  if (location.pathname.startsWith('/nav/world')) mountWorld();
  if (location.pathname.startsWith('/nav/ar')) mountAr();
}

startStateFeatures();
