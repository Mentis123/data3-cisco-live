# D3 Agent Governance Framework

> **Also read**: `codex.md` for additional context (if you're Claude, read what we tell Codex too)

## Project Overview

This is the **D3 Enterprise Agent Governance Framework** - a comprehensive defense-in-depth approach to governing AI agents across the Microsoft ecosystem. The interactive demo lives in `index.html` with a backend in `server.js`.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT LAYER                                          "The Brain"   │
│  Copilot Studio, Custom Agents, Foundry Agent Service               │
├─────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                         "The Physics"   │
│  Dynamics 365, Dataverse, Power Platform, Foundry IQ                │
├─────────────────────────────────────────────────────────────────────┤
│  PLATFORM LAYER                                       "The Shell"   │
│  Azure, Entra ID, Purview, Foundry Control Plane                    │
└─────────────────────────────────────────────────────────────────────┘
        │            │            │             │            │
   GUARDRAILS   GROUNDING   CONFIDENCE   OBSERVABILITY  EVALUATION
```

## Key Files

| File | Purpose |
|------|---------|
| `kb.md` | **Knowledge Base** - The complete D3 framework documentation. This is the source of truth. |
| `claude.g.md` | Mirror of kb.md (keep in sync) |
| `index.html` | Interactive web demo with chat interface, threat simulations, and pillar visualizations |
| `server.js` | Express backend connecting to Azure AI Foundry |
| `stripe.html` | Stripe integration UI |
| `nav/world3d/` | Shared three.js core for the immersive portfolio views (layout, totems, nodes, gyro, camera feed) |
| `nav/world/` | `/world` — the 3D Portfolio World (desktop/tablet) |
| `nav/ar/` | `/ar` — the phone AR magic window |
| `nav/vendor/three/` | Vendored three.js r185 (MIT). **Keep `three.module.min.js` and `three.core.min.js` together** — since r167 the module build imports the core build as a sibling file |

## The immersive views (`/world` and `/ar`)

Both pages render the same taxonomy from `window.DATA3_PORTFOLIO` — the same
object Box, Pond and Bubbles consume — as a ring of nine practice totems with
the user at the centre. Opening a practice unpacks its capabilities and every
offering into the air around it. Everything is procedural geometry: no models,
no textures, nothing to download beyond the vendored library.

Things that will bite you if you change them without knowing why:

- **No bundler.** Modules load via a single `<script type="importmap">` that
  must appear before the first module script. Import maps need Safari 16.4+,
  which is the floor for the whole target set.
- **Colour pipeline.** The renderer runs `NoToneMapping` with an sRGB output
  colour space, and the linear→sRGB conversion happens exactly once. Where
  depends on the page: `/world` composites through `EffectComposer` so
  `OutputPass` does it, `/ar` renders straight to the canvas so the shaders do
  it. Each page declares this with `setOutputEncoding()` before building any
  material. Getting it backwards makes one path look washed out and the other
  muddy.
- **`UnrealBloomPass` must never be the last pass.** It blends additively into
  its target, so as the final pass it blends onto a cleared screen and the base
  render disappears entirely.
- **iOS has no WebXR.** Safari has never shipped `immersive-ar` on iPhone, and
  every iOS browser is WebKit — so `/ar` is a 3DOF magic window (camera feed +
  gyroscope), not world-tracked AR. It degrades across a two-by-two of camera
  and motion permissions and never dead-ends.
- **Gyro quirks** are documented inline in `nav/world3d/gyro.js`. The short
  version: use `window.orientation`, not `screen.orientation.angle` (they
  disagree by 180° in landscape on iOS), re-zero yaw on the first reading, and
  never treat `DeviceOrientationEvent.requestPermission` as an iOS sniff —
  Chrome 151+ ships it everywhere.

## Azure Periodic Table

When mentioning Azure services in the KB, link to their Azure Periodic Table pages at `azureperiodic.data3.com`. Use HTML links with `target="_blank"`:

```html
<a href="https://azureperiodic.data3.com/Entra-ID" target="_blank">Entra ID</a>
```

**Available services with links:**
- [Entra ID](https://azureperiodic.data3.com/Entra-ID)
- [Conditional Access](https://azureperiodic.data3.com/Conditional-Access)
- [Purview](https://azureperiodic.data3.com/Purview)
- [Private Link](https://azureperiodic.data3.com/Private-Link)
- [Virtual Network](https://azureperiodic.data3.com/Virtual-Network)
- [Azure OpenAI](https://azureperiodic.data3.com/Azure-OpenAI)
- [Azure Policy](https://azureperiodic.data3.com/Policy)
- [Cost Management](https://azureperiodic.data3.com/Cost-Management)
- [Log Analytics](https://azureperiodic.data3.com/Log-Analytics)
- [App Insights](https://azureperiodic.data3.com/App-Insights)
- [ARM Templates](https://azureperiodic.data3.com/Azure-Resource-Manager)
- [Bicep](https://azureperiodic.data3.com/bicep)
- [DevOps](https://azureperiodic.data3.com/DevOps)
- [NSG](https://azureperiodic.data3.com/Network-Security-Group)
- [Defender for Cloud](https://azureperiodic.data3.com/Defender-for-Cloud)

## The Five Pillars

Always remember these when discussing governance:

1. **Guardrails** (Orange) - What's allowed vs disallowed
2. **Grounding** (Green) - Answers based on trusted data
3. **Confidence** (Purple) - Thresholds for autonomous action
4. **Observability** (Cyan) - Logging and monitoring
5. **Evaluation** (Amber) - Risk vs value assessment

## House Rules

1. **Keep kb.md and claude.g.md in sync** - If you edit one, copy to the other
2. **Link Azure services** - Use Azure Periodic Table links when adding new service mentions
3. **Respect the pillars** - When adding controls, map them to the appropriate pillar(s)
4. **Test the demo** - The index.html should remain functional after changes
5. **No secrets in code** - API keys go in environment variables

## Common Tasks

### Adding a new Azure service mention
1. Check if it exists on azureperiodic.data3.com
2. Add the HTML link with `target="_blank"`
3. Update both kb.md and claude.g.md

### Updating the threat simulations
- Simulations are in kb.md under "Security Scenarios"
- Each has a 5-step defense-in-depth response table

### Working with the chat interface
- Backend is in server.js
- Connects to Azure AI Foundry
- KB content is used for grounding responses

## Quick Reference

```bash
# Start the server
node server.js

# The demo runs at
http://localhost:3000
```

---

*We're building governance for AI agents. Be a good one.*
