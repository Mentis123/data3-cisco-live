/* Gyroscope camera controller.

   three.js removed DeviceOrientationControls in r134 because no single
   implementation worked reliably everywhere, so this is a deliberate
   re-implementation of that math with the known device quirks handled:

   - Screen angle comes from window.orientation, NOT screen.orientation.angle.
     For the same physical landscape pose iOS 16.4+ reports 90 where Chromium
     reports 270; feeding that into the rotation flips the world 180 degrees.
   - Yaw is re-zeroed on the first reading. Android's relative orientation has
     an arbitrary heading at page load (three.js #22613) and so does iOS, so
     re-zeroing both fixes the bug and gives the behaviour we want anyway:
     content anchored to wherever the user happens to be facing.
   - Smoothing is quaternion slerp, never Euler filtering. Alpha wraps at 360
     and the Euler triple is discontinuous near vertical, so filtering angles
     stutters when the phone points up or down.
   - requestPermission is feature-detected but NOT used as an iOS sniff:
     Chrome 151+ ships it on Android and desktop too. */

import * as THREE from 'three';

const _zee = new THREE.Vector3(0, 0, 1);
const _euler = new THREE.Euler();
const _q0 = new THREE.Quaternion();
// -90 degrees about X: the spec's identity has the screen facing the sky, but
// a magic window camera has to look out of the back of the phone.
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _forward = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function screenAngleDegrees() {
  if (typeof window.orientation === 'number') return window.orientation;
  return (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
}

function composeDeviceQuaternion(target, alpha, beta, gamma, orient) {
  _euler.set(beta, alpha, -gamma, 'YXZ');
  target.setFromEuler(_euler);
  target.multiply(_q1);
  target.multiply(_q0.setFromAxisAngle(_zee, -orient));
  return target;
}

export async function requestGyroPermission() {
  const api = typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : null;
  if (!api || typeof api.requestPermission !== 'function') return 'granted';
  try {
    return await api.requestPermission();
  } catch (error) {
    // Thrown when there is no transient user activation, or when the embedding
    // context forbids sensors.
    return 'denied';
  }
}

export class GyroControls {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.tau = options.tau ?? 0.08;
    this.enabled = false;
    this.hasReading = false;
    this.calibrated = false;

    this.deviceAlpha = 0;
    this.deviceBeta = 0;
    this.deviceGamma = 0;
    this.screenOrientation = 0;

    this.target = new THREE.Quaternion();
    this.smoothed = new THREE.Quaternion();
    this.yawFix = new THREE.Quaternion();

    this.onDeviceOrientation = event => {
      // A UA that can never supply readings fires one event with null angles.
      if (event.alpha == null && event.beta == null && event.gamma == null) return;
      this.deviceAlpha = THREE.MathUtils.degToRad(event.alpha || 0);
      this.deviceBeta = THREE.MathUtils.degToRad(event.beta || 0);
      this.deviceGamma = THREE.MathUtils.degToRad(event.gamma || 0);
      this.hasReading = true;
    };

    this.onScreenOrientation = () => {
      this.screenOrientation = THREE.MathUtils.degToRad(screenAngleDegrees());
    };
  }

  /* Resolves { ok, reason }. `reason` is 'denied' when the user said no and
     'unavailable' when no reading arrived in time — desktop machines, sensors
     switched off, or a WebView without the permission delegate. */
  async connect({ timeoutMs = 1500, permission: known = null } = {}) {
    // Callers that already ran the permission prompt inside the user gesture
    // pass the result through rather than asking twice.
    const permission = known || await requestGyroPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    this.onScreenOrientation();
    window.addEventListener('orientationchange', this.onScreenOrientation);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', this.onScreenOrientation);
    }
    window.addEventListener('deviceorientation', this.onDeviceOrientation);
    this.enabled = true;

    const arrived = await new Promise(resolve => {
      if (this.hasReading) return resolve(true);
      const started = performance.now();
      const poll = () => {
        if (this.hasReading) return resolve(true);
        if (performance.now() - started > timeoutMs) return resolve(false);
        requestAnimationFrame(poll);
      };
      poll();
    });

    if (!arrived) {
      this.disconnect();
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: true };
  }

  /* Cancels the current heading so whatever the user faces becomes forward. */
  recalibrate() {
    if (!this.hasReading) return false;
    composeDeviceQuaternion(this.target, this.deviceAlpha, this.deviceBeta, this.deviceGamma, this.screenOrientation);
    _forward.set(0, 0, -1).applyQuaternion(this.target);
    // Skip when pointing near straight up or down — heading is meaningless there.
    if (_forward.x * _forward.x + _forward.z * _forward.z < 0.1) return false;
    const yaw = Math.atan2(-_forward.x, -_forward.z);
    this.yawFix.setFromAxisAngle(UP, -yaw);
    this.smoothed.copy(this.target);
    this.calibrated = true;
    return true;
  }

  update(delta) {
    if (!this.enabled || !this.hasReading) return false;
    if (!this.calibrated) this.recalibrate();

    composeDeviceQuaternion(this.target, this.deviceAlpha, this.deviceBeta, this.deviceGamma, this.screenOrientation);
    // Framerate-independent exponential smoothing: the same feel at 30fps in
    // Low Power Mode as at 120fps on a ProMotion display.
    const factor = 1 - Math.exp(-delta / this.tau);
    this.smoothed.slerp(this.target, factor);
    this.camera.quaternion.copy(this.yawFix).multiply(this.smoothed);
    return true;
  }

  disconnect() {
    this.enabled = false;
    window.removeEventListener('deviceorientation', this.onDeviceOrientation);
    window.removeEventListener('orientationchange', this.onScreenOrientation);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', this.onScreenOrientation);
    }
  }
}

/* Pointer drag fallback — desktop, denied permission, or no sensors. Drives
   the same camera quaternion so the two paths are interchangeable. */
export class DragLook {
  constructor(camera, element, options = {}) {
    this.camera = camera;
    this.element = element;
    this.yaw = options.yaw ?? 0;
    this.pitch = 0;
    this.targetYaw = this.yaw;
    this.targetPitch = 0;
    this.sensitivity = options.sensitivity ?? 0.0032;
    this.maxPitch = options.maxPitch ?? 1.1;
    this.dragging = false;
    this.pointerId = null;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.onDown = event => {
      if (event.target.closest('[data-ui]')) return;
      this.dragging = true;
      this.pointerId = event.pointerId;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.moved = 0;
      element.setPointerCapture?.(event.pointerId);
    };
    this.onMove = event => {
      if (!this.dragging || event.pointerId !== this.pointerId) return;
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.targetYaw -= dx * this.sensitivity;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch - dy * this.sensitivity, -this.maxPitch, this.maxPitch);
    };
    this.onUp = event => {
      if (event.pointerId !== this.pointerId) return;
      this.dragging = false;
      this.pointerId = null;
      element.releasePointerCapture?.(event.pointerId);
    };

    element.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  /* True when the pointer moved far enough that the gesture was a drag, not a
     tap — used to suppress accidental selection at the end of a look-around. */
  consumedDrag() {
    return this.moved > 8;
  }

  setYaw(yaw) {
    this.targetYaw = yaw;
    this.yaw = yaw;
  }

  update(delta) {
    const factor = 1 - Math.exp(-delta / 0.09);
    this.yaw += (this.targetYaw - this.yaw) * factor;
    this.pitch += (this.targetPitch - this.pitch) * factor;
    this.euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }
}
