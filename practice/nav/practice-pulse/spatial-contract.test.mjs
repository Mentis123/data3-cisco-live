import assert from 'node:assert/strict';
import {
  CAPABILITY_SLOTS,
  COCKPIT_CONTRACT,
  DELIVERY_CAMERAS,
  MOBILE_CONTRACT,
  MODEL_CONVENTION,
  SCENE_LAYOUT,
  controlDeckPositions,
  isMobileViewport,
  mobileDeckMetrics,
  offeringFan,
  offeringPanelPositions,
  projectedWidthPx,
  sceneLayoutForWidth,
  validateLayout
} from './pulse-layout.mjs';

assert.deepEqual(validateLayout(), [], 'The spatial layout contract must be internally consistent.');
assert.equal(CAPABILITY_SLOTS.length, 5, 'The practice scene must expose five capability totems.');
assert.deepEqual(MODEL_CONVENTION.practicePedestal, [0, 0.18, 3.15]);
assert.ok(COCKPIT_CONTRACT.desktop.minimumCriticalTypePx >= 11);
assert.ok(COCKPIT_CONTRACT.parallax.maximumLateralMetres <= 0.75);
const wallDistance = DELIVERY_CAMERAS.desktop.position[2] - SCENE_LAYOUT.desktop.boardCentre[2];
assert.ok(Math.atan(COCKPIT_CONTRACT.parallax.maximumLateralMetres / wallDistance) <= COCKPIT_CONTRACT.parallax.maximumDisplayYawRadians);

for (const count of [0, 1, 5, 8, 14, 28]) {
  const first = offeringFan(count);
  const second = offeringFan(count);
  assert.deepEqual(first, second, `Offering layout for ${count} items must be deterministic.`);
  assert.equal(first.length, count);
  first.flat().forEach(value => assert.ok(Number.isFinite(value), 'Offering coordinates must be finite.'));
}

for (const count of [0, 1, 5, 6, 10]) {
  const first = offeringPanelPositions(count);
  const second = offeringPanelPositions(count);
  assert.deepEqual(first, second, `Physical offering-panel layout for ${count} items must be deterministic.`);
  assert.equal(new Set(first.map(point => point.join('|'))).size, count, 'Physical offering panels must occupy unique positions.');
}

assert.deepEqual(controlDeckPositions(5), controlDeckPositions(5), 'Physical flight-deck controls must be deterministic.');
assert.equal(new Set(controlDeckPositions(5).map(point => point.join('|'))).size, 5, 'Physical flight-deck controls must occupy unique positions.');
assert.equal(sceneLayoutForWidth(390), SCENE_LAYOUT.mobile);
assert.equal(sceneLayoutForWidth(1440), SCENE_LAYOUT.desktop);

const diagnostic = DELIVERY_CAMERAS.diagnostic;
const totemWidth = projectedWidthPx(1.55, 8.4, diagnostic.fov, diagnostic.viewport[1]);
assert.ok(totemWidth >= 200, `Diagnostic totem width must exceed 200px; got ${totemWidth.toFixed(1)}px.`);

const mobile = DELIVERY_CAMERAS.mobile;
const mobileWallWidth = projectedWidthPx(SCENE_LAYOUT.mobile.boardSize[0], 22.2, mobile.fov, mobile.viewport[1]);
assert.ok(mobileWallWidth >= 285, `Mobile scene-authored data wall must remain observable; got ${mobileWallWidth.toFixed(1)}px.`);

const desktop = DELIVERY_CAMERAS.desktop;
const desktopWallWidth = projectedWidthPx(SCENE_LAYOUT.desktop.boardSize[0], 19.5, desktop.fov, desktop.viewport[1]);
assert.ok(desktopWallWidth >= COCKPIT_CONTRACT.desktop.minimumMissionWidthPx, `Desktop scene-authored data wall must remain readable; got ${desktopWallWidth.toFixed(1)}px.`);

// Mobile control deck. One definition of "mobile", and collapsed chrome that
// always leaves the Three.js canvas the majority of the viewport.
assert.equal(MOBILE_CONTRACT.maximumViewportWidthPx, 900, 'Mobile detection must stay on the page\'s existing 900px breakpoint.');
assert.ok(MOBILE_CONTRACT.minimumTouchTargetPx >= 44, 'Mobile controls must keep a 44px minimum touch target.');
assert.ok(MOBILE_CONTRACT.regular.stripRowPx >= MOBILE_CONTRACT.minimumTouchTargetPx, 'The control strip row must clear the touch target.');
assert.equal(isMobileViewport(390), true);
assert.equal(isMobileViewport(900), true, 'The breakpoint itself is mobile.');
assert.equal(isMobileViewport(901), false);
assert.equal(isMobileViewport(1440), false);
assert.equal(isMobileViewport(1440, true), true, 'A coarse pointer is mobile at any width.');
assert.equal(isMobileViewport(1440, false), false, 'A fine pointer at desktop width is never mobile.');
assert.throws(() => isMobileViewport(0), TypeError);
assert.throws(() => mobileDeckMetrics(390), TypeError);
assert.throws(() => mobileDeckMetrics([390, 0]), TypeError);

for (const viewport of [[390, 844], [430, 932], [360, 640], [844, 390], [900, 900]]) {
  const metrics = mobileDeckMetrics(viewport);
  assert.deepEqual(metrics, mobileDeckMetrics(viewport), `Mobile deck metrics for ${viewport.join('x')} must be deterministic.`);
  assert.ok(
    metrics.collapsedCanvasFraction >= MOBILE_CONTRACT.minimumCanvasFraction,
    `Collapsed chrome must leave the canvas at least ${MOBILE_CONTRACT.minimumCanvasFraction * 100}% of ${viewport.join('x')}; got ${(metrics.collapsedCanvasFraction * 100).toFixed(1)}%.`
  );
  assert.ok(metrics.sheetPx <= viewport[1], `The expanded board sheet must fit inside ${viewport.join('x')}.`);
  assert.ok(metrics.stripPx > 0 && metrics.summaryPx > 0);
}

const portrait = mobileDeckMetrics([390, 844]);
const landscape = mobileDeckMetrics([844, 390]);
assert.equal(portrait.compact, false, 'A portrait phone uses the regular control scale.');
assert.equal(landscape.compact, true, 'A landscape phone drops to the compact control scale.');
assert.ok(landscape.stripPx < portrait.stripPx, 'Landscape must spend less height on chrome than portrait.');

console.log(`Spatial contract passed: 5 capability totems, 6 physical console controls, scene-authored desktop/mobile data walls, seated parallax limits, accepted projection floors, and a 900px/coarse-pointer mobile deck that leaves the canvas at least ${Math.round(Math.min(portrait.collapsedCanvasFraction, landscape.collapsedCanvasFraction) * 100)}% of the viewport when collapsed.`);
