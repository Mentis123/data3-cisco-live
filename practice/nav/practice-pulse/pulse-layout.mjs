export const MODEL_CONVENTION = Object.freeze({
  units: 'metres',
  up: '+Y',
  front: '+Z',
  practicePedestal: [0, 0.18, 3.15],
  boardCentre: [0, 5.05, -0.8],
  boardSize: [14.4, 6.2, 0.36],
  consoleCentre: [0, 0.68, 4.7],
  consoleSize: [14.2, 3.1, 0.34],
  consoleTiltRadians: -0.76
});

export const COCKPIT_CONTRACT = Object.freeze({
  desktop: Object.freeze({
    minimumMissionWidthPx: 980,
    minimumMissionHeightPx: 390,
    minimumConsoleHeightPx: 150,
    maximumConsoleHeightPx: 270,
    minimumCriticalTypePx: 11
  }),
  parallax: Object.freeze({
    maximumLateralMetres: 0.62,
    maximumVerticalMetres: 0.24,
    minimumDepthOffsetMetres: -0.55,
    maximumDepthOffsetMetres: 1.15,
    maximumDisplayYawRadians: 0.045
  })
});

export const DELIVERY_CAMERAS = Object.freeze({
  desktop: Object.freeze({
    id: 'desktop-delivery',
    viewport: [1440, 900],
    dpr: 1,
    fov: 36.5,
    position: [0, 5.15, 16.8],
    target: [0, 3.15, -0.2]
  }),
  mobile: Object.freeze({
    id: 'mobile-delivery',
    viewport: [390, 844],
    dpr: 1,
    fov: 43,
    position: [0, 5.45, 19.6],
    target: [0, 3.15, -0.15]
  }),
  diagnostic: Object.freeze({
    id: 'scene-diagnostic',
    viewport: [1280, 820],
    dpr: 1,
    fov: 34,
    position: [0.52, 4.75, 14.7],
    target: [0, 3.05, -0.45]
  })
});

export const SCENE_LAYOUT = Object.freeze({
  desktop: Object.freeze({
    boardSize: [14.4, 6.2],
    boardCentre: [0, 5.05, -0.8],
    consoleScale: 0.78,
    consoleCentre: [0, 0.68, 4.7]
  }),
  mobile: Object.freeze({
    boardSize: [6.7, 8.5],
    boardCentre: [0, 5.22, -2.55],
    consoleScale: 0.5,
    consoleCentre: [0, 0.42, 5.25]
  })
});

// Mobile control contract.
//
// On a phone the cockpit chrome is replaced by a compact top strip and a
// collapsed summary bar, so the Three.js canvas keeps the rest of the viewport.
// These are the only numbers that decide that split; styles.css mirrors them
// through the custom properties the deck sets, and nothing else may invent a
// second mobile breakpoint.
export const MOBILE_CONTRACT = Object.freeze({
  maximumViewportWidthPx: 900,
  minimumTouchTargetPx: 44,
  compactViewportHeightPx: 500,
  minimumCanvasFraction: 0.5,
  regular: Object.freeze({ stripRowPx: 46, chipRailPx: 44, stripPaddingPx: 12, summaryPx: 46, sheetFraction: 0.72 }),
  compact: Object.freeze({ stripRowPx: 40, chipRailPx: 38, stripPaddingPx: 10, summaryPx: 40, sheetFraction: 0.82 })
});

// The single definition of "mobile" for the spatial experience. spatial-mobile.js
// evaluates it against the live viewport and a coarse-pointer media query, then
// publishes the answer as body[data-mobile] for CSS to gate on.
export function isMobileViewport(width, coarsePointer = false) {
  if (!Number.isFinite(width) || width <= 0) throw new TypeError('Viewport width must be a positive finite number.');
  return width <= MOBILE_CONTRACT.maximumViewportWidthPx || Boolean(coarsePointer);
}

export function mobileDeckMetrics(viewport) {
  const [width, height] = Array.isArray(viewport) ? viewport : [];
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new TypeError('Viewport must be a [width, height] pair of positive finite numbers.');
  }
  const compact = height < MOBILE_CONTRACT.compactViewportHeightPx;
  const scale = compact ? MOBILE_CONTRACT.compact : MOBILE_CONTRACT.regular;
  const stripPx = scale.stripRowPx + scale.chipRailPx + scale.stripPaddingPx;
  const summaryPx = scale.summaryPx;
  const sheetPx = Math.round(height * scale.sheetFraction);
  const collapsedCanvasPx = height - stripPx - summaryPx;
  return {
    compact,
    stripPx,
    summaryPx,
    sheetPx,
    collapsedCanvasPx,
    collapsedCanvasFraction: collapsedCanvasPx / height
  };
}

export const CAPABILITY_SLOTS = Object.freeze([
  Object.freeze({ name: 'Copilot', position: [-5.15, 0.95, 2.42], rotation: 0.12 }),
  Object.freeze({ name: 'Data Platform & Engineering', position: [-2.62, 0.78, 3.03], rotation: 0.05 }),
  Object.freeze({ name: 'Generative & Agentic AI', position: [0, 0.7, 3.28], rotation: 0 }),
  Object.freeze({ name: 'AI Governance & Adoption', position: [2.62, 0.78, 3.03], rotation: -0.05 }),
  Object.freeze({ name: 'Analytics & BI', position: [5.15, 0.95, 2.42], rotation: -0.12 })
]);

export function offeringFan(count) {
  if (!Number.isInteger(count) || count < 0) throw new TypeError('Offering count must be a non-negative integer.');
  if (count === 0) return [];
  const columns = Math.min(count, 7);
  const rows = Math.ceil(count / columns);
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    const column = index - row * columns;
    const spread = inRow === 1 ? 0 : 7.7 / (inRow - 1);
    const x = inRow === 1 ? 0 : -3.85 + column * spread;
    const normalized = inRow === 1 ? 0 : column / (inRow - 1) - 0.5;
    positions.push([
      x,
      2.1 + row * 0.72 + Math.cos(normalized * Math.PI) * 0.34,
      2.05 - Math.abs(normalized) * 0.58 - row * 0.16
    ]);
  }
  return positions;
}

export function offeringPanelPositions(count) {
  if (!Number.isInteger(count) || count < 0) throw new TypeError('Offering count must be a non-negative integer.');
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / 5);
    const rowCount = Math.min(5, count - row * 5);
    const column = index - row * 5;
    const x = rowCount === 1 ? 0 : -4.15 + column * (8.3 / (rowCount - 1));
    const normalized = rowCount === 1 ? 0 : column / (rowCount - 1) - 0.5;
    return [x, 1.34 + row * 0.72, 2.45 - Math.abs(normalized) * 0.3 - row * 0.16];
  });
}

export function controlDeckPositions(count, span = 10.4) {
  if (!Number.isInteger(count) || count < 1) throw new TypeError('Control count must be a positive integer.');
  if (!Number.isFinite(span) || span <= 0) throw new TypeError('Control span must be a positive finite number.');
  if (count === 1) return [[0, 0.44, 0.08]];
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1) - 0.5;
    return [t * span, 0.48 + Math.cos(t * Math.PI) * 0.16, 0.06 - Math.abs(t) * 0.22];
  });
}

export function sceneLayoutForWidth(width) {
  if (!Number.isFinite(width) || width <= 0) throw new TypeError('Viewport width must be a positive finite number.');
  return width < 720 ? SCENE_LAYOUT.mobile : SCENE_LAYOUT.desktop;
}

export function projectedWidthPx(width, cameraDistance, fovDegrees, viewportHeight) {
  const halfFov = fovDegrees * Math.PI / 360;
  return width * viewportHeight / (2 * cameraDistance * Math.tan(halfFov));
}

export function validateLayout() {
  const issues = [];
  if (CAPABILITY_SLOTS.length !== 5) issues.push('Expected exactly five canonical capability slots.');
  if (new Set(CAPABILITY_SLOTS.map(item => item.name)).size !== CAPABILITY_SLOTS.length) issues.push('Capability names must be unique.');
  CAPABILITY_SLOTS.forEach((slot, index) => {
    if (slot.position.length !== 3 || slot.position.some(value => !Number.isFinite(value))) issues.push(`Capability slot ${index} has invalid coordinates.`);
    if (index > 0 && slot.position[0] <= CAPABILITY_SLOTS[index - 1].position[0]) issues.push('Capability slots must progress left-to-right.');
  });
  const boardBottom = SCENE_LAYOUT.desktop.boardCentre[1] - SCENE_LAYOUT.desktop.boardSize[1] / 2;
  if (boardBottom < 1.8) issues.push('Operational board must preserve a visible middle-distance scene below it.');
  if (COCKPIT_CONTRACT.desktop.minimumCriticalTypePx < 11) issues.push('Cockpit critical text must remain at least 11px on desktop.');
  if (COCKPIT_CONTRACT.parallax.maximumLateralMetres > 0.75) issues.push('Seated parallax must not expose the rear of the mission display.');
  if (COCKPIT_CONTRACT.parallax.minimumDepthOffsetMetres >= COCKPIT_CONTRACT.parallax.maximumDepthOffsetMetres) issues.push('Cockpit depth limits are reversed.');
  const wallDistance = DELIVERY_CAMERAS.desktop.position[2] - SCENE_LAYOUT.desktop.boardCentre[2];
  const maximumWallYaw = Math.atan(COCKPIT_CONTRACT.parallax.maximumLateralMetres / wallDistance);
  if (maximumWallYaw > COCKPIT_CONTRACT.parallax.maximumDisplayYawRadians) issues.push('Seated parallax can expose too much display side angle.');
  ['desktop', 'mobile', 'diagnostic'].forEach(id => {
    const camera = DELIVERY_CAMERAS[id];
    if (camera.position.length !== 3 || camera.target.length !== 3) issues.push(`${id} camera is incomplete.`);
    if (!(camera.fov > 20 && camera.fov < 80)) issues.push(`${id} camera FOV is outside the supported range.`);
  });
  const fan = offeringFan(14);
  if (fan.length !== 14 || new Set(fan.map(point => point.join('|'))).size !== 14) issues.push('Offering fan positions must be deterministic and unique.');
  const panels = offeringPanelPositions(10);
  if (panels.length !== 10 || new Set(panels.map(point => point.join('|'))).size !== 10) issues.push('Physical offering panel positions must be deterministic and unique.');
  const controls = controlDeckPositions(5);
  if (controls.length !== 5 || new Set(controls.map(point => point.join('|'))).size !== 5) issues.push('Console controls must be deterministic and unique.');
  if (sceneLayoutForWidth(390) !== SCENE_LAYOUT.mobile || sceneLayoutForWidth(1440) !== SCENE_LAYOUT.desktop) issues.push('Responsive scene layout boundary is invalid.');
  if (MOBILE_CONTRACT.minimumTouchTargetPx < 44) issues.push('Mobile controls must keep a 44px minimum touch target.');
  if (MOBILE_CONTRACT.regular.stripRowPx < MOBILE_CONTRACT.minimumTouchTargetPx) issues.push('The mobile control strip row must clear the minimum touch target.');
  if (!isMobileViewport(390) || isMobileViewport(1440)) issues.push('Mobile detection boundary is invalid.');
  if (!isMobileViewport(1440, true)) issues.push('A coarse pointer must always read as mobile.');
  [[390, 844], [844, 390], [360, 640], [900, 900]].forEach(viewport => {
    const metrics = mobileDeckMetrics(viewport);
    if (metrics.collapsedCanvasFraction < MOBILE_CONTRACT.minimumCanvasFraction) {
      issues.push(`Collapsed mobile chrome leaves too little canvas at ${viewport.join('x')}.`);
    }
    if (metrics.sheetPx > viewport[1]) issues.push(`The mobile board sheet overflows the viewport at ${viewport.join('x')}.`);
    if (metrics.stripPx + metrics.summaryPx >= viewport[1]) issues.push(`Mobile chrome cannot fit at ${viewport.join('x')}.`);
  });
  return issues;
}
