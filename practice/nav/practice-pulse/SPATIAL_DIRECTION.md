# Spatial direction for the AI practice pulse

## Recommendation

Evolve the page into a hybrid spatial command centre:

- Three.js renders the Data & AI practice pedestal, capability and offering totems, connecting energy lines, depth, particles, bloom, and camera choreography.
- Real HTML and SVG render the main operational board, filters, KPIs, charts, opportunity table, export, and Salesforce actions.
- One application store drives both layers. A selection in the 3D scene updates the board; a filter or drill-down on the board updates the scene.

This provides the desired “Minority Report” feel without sacrificing operational readability, accessibility, or mobile support.

```text
             Floating operational board
        KPIs · charts · accounts · pipeline
                       ↑
              offering context fan

       capability totems on a lower arc
          Data & AI practice pedestal
```

Keep the operational board almost face-on. The scene can create drama through its frame, parallax, connector pulses, lighting, and transitions; the data itself should not be distorted by perspective.

## Interaction model

### Practice level

- Keep the Data & AI pedestal permanently visible at the bottom of the scene.
- Arrange the five canonical capability totems in a shallow arc.
- Keep every totem a consistent selectable size. Show opportunity volume with orbit or ring meters rather than changing the hit-target size.
- Use the board for open opportunity concentration, annuity-vehicle mix, won/lost outcomes, top open accounts, and data-quality warnings.

### Capability level

- Move the selected capability forward and make it the centre totem.
- Fan its offerings immediately above it.
- Dim sibling capabilities without removing them.
- Update the board to the capability’s vehicle mix, account concentration, offering distribution, and opportunities.

### Offering level

- Promote the offering to the active chip above the practice pedestal.
- Update the board to its account and opportunity records.
- Keep Salesforce navigation as an explicit DOM link that opens in a new window.

### Controls

- Click, Enter, or Space selects.
- Escape or Back moves up one level.
- Left and right arrow keys traverse totems.
- Focus alone never moves the camera; activation does.
- Use 500–700 ms camera transitions, with immediate cuts when reduced motion is requested.
- Do not place account names or opportunity IDs in URL state.

## Recommended implementation

Add these page-specific modules without introducing a framework or bundler:

- `spatial.js`: compose the renderer, materials, totems, hotspots, and instanced nodes into a page-specific `PracticePulseWorld`.
- `pulse-layout.js`: deterministic pedestal, shallow capability arc, offering fan, and operational-board frame positions.
- a small shared store in `app.js`: selection, filters, measure, and subscriptions used by both the DOM board and 3D scene.

Reuse these existing modules:

- `nav/world3d/taxonomy.js` for the shared catalogue adapter and Data & AI palette.
- `nav/world3d/layout.js` for deterministic, art-directable layouts.
- `nav/world3d/nodes.js` for instanced capability and offering geometry.
- `nav/world3d/totems.js` for the procedural practice totem language.
- `nav/world3d/hotspots.js` for forgiving interaction targets.
- `nav/world3d/tiers.js` for device tiers, pixel-ratio limits, bloom scaling, and visibility pausing.
- `nav/world/world.js` as the reference for camera transitions and orbit behaviour.

Initially keep the camera rig local to the page. Extract a shared `camera-rig.js` only after the new experience and `/nav/world` both pass visual regression checks.

## Rendering options considered

### Hybrid WebGL scene and DOM/SVG board — recommended

Best operational balance. Text remains crisp, links and controls stay native, tables remain searchable, and the mobile fallback is straightforward. The board should be deliberately frontmost because DOM content will not participate in WebGL occlusion.

### WebGL with CSS3DRenderer board

Provides genuine camera-space positioning for the HTML board. It is visually compelling, but CSS3D does not participate in WebGL materials, bloom, or depth, pointer stacking is delicate, and the official renderer documents a 100% browser/display zoom constraint. Use only for a kiosk-style variant.

### Fully WebGL dashboard

Provides true occlusion and XR portability, but requires rebuilding text, focus, links, selection, tables, and accessibility. Reserve this for a passive wallboard or later XR mode, not the primary business-operations experience.

## Performance and accessibility guardrails

- Remain on the repo’s vendored Three.js r185 `WebGLRenderer`; a WebGPU migration would require converting custom shader and post-processing code.
- Cap device pixel ratio at 2 and keep bloom half-resolution.
- Use instancing for repeated nodes and bars.
- Do not render all opportunities as individually labelled 3D objects. Render aggregates or a selected subset; keep the complete record set in the board and table.
- Update instance matrices only when scope or filters change. Prefer demand rendering when the scene is idle.
- Treat the canvas as decorative for assistive technology and provide a real DOM equivalent for every action.
- Preserve visible focus, 44×44 px interaction targets where possible, and a reduced-motion path.
- On mobile or coarse-pointer devices, use the current two-dimensional dashboard as the canonical experience with a decorative low-motion scene header at most.

## Data required for the operational end-state

The present extract supports accurate counts, concentration, lifecycle outcomes, annuity vehicles, capability and offering drill-down, account concentration, mapping confidence, and Salesforce links.

Add these fields before activating true financial and pipeline-progression views:

- Amount and Expected Revenue or weighted amount
- Close Date
- Stage Name and Probability
- Forecast Category
- Created Date and Last Stage Change Date
- Owner Name
- Last Activity Date and Next Step
- practice target or quota

The board should then prioritise open amount, weighted pipeline, coverage against target, stage and forecast mix, close-date risk, ageing and stalled opportunities, win rate, average deal size, and concentration by account, capability, offering, and annuity vehicle.

## Technical references

- [Three.js CSS2DRenderer](https://threejs.org/docs/pages/CSS2DRenderer.html)
- [Three.js CSS3DRenderer](https://threejs.org/docs/pages/CSS3DRenderer.html)
- [Official CSS3D periodic-table example](https://github.com/mrdoob/three.js/blob/dev/examples/css3d_periodictable.html)
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html)
- [Three.js rendering on demand](https://threejs.org/manual/en/rendering-on-demand.html)
- [Three.js optimisation guide](https://threejs.org/manual/en/optimize-lots-of-objects.html)
- [Three.js WebGPU migration guide](https://threejs.org/manual/en/webgpurenderer)
- [Official UnrealBloom example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_unreal_bloom.html)
- [Troika SDF text](https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md)
- [WCAG keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard)
- [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG reduced-motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)

## Privacy boundary

The route remains absent from public navigation and behind the existing access gate. That is discoverability control, not identity-grade authorisation. Before live SFDC financials replace the static extract, move to Entra authentication and server-side, user-scoped data retrieval rather than shipping the full dataset to every authenticated browser.
