# Agent 0 build handoff — copy this prompt into the implementing agent

Work on the existing Data#3 Decision Room application. Read `docs/agent-0/agent-0-mining-concept-v0.1.md` as the detailed design baseline and `docs/agent-0/agent-0-concept-review-brief.md` as the summary. These documents live in Git; no separate attachments are required. Read both before implementing. This handoff is `docs/agent-0/agent-0-build-handoff.md`. Distinguish their proposals and fictional assumptions from verified product capabilities. Rich and Scott have not yet signed off this concept.

## Repositories and deployment

- **Primary live repo:** https://github.com/Mentis123/d3smbmxdr — branch `main`.
- **Primary production:** https://d3smbmxdr.vercel.app/decision-room
- **Fallback repo:** https://github.com/Mentis123/data3-cisco-live — branch `main`.
- **Fallback production:** https://data3-cisco-live.vercel.app/decision-room
- Changes have historically been made as paired PRs in both repos. Keep shared content/UI aligned while preserving each framework's adapters. The two deployments have separate room data; never assume a room or token transfers between domains.
- Primary is Next.js 14 / React / TypeScript, with a Neon-backed API. Fallback is Vite / React / wouter with an Express API. Git integration deploys main to Vercel. Use the user's existing authentication and configured environments; never request pasted secrets or commit environment files.
- Documentation is published on `codex/agent-0-build-docs` in both repositories; check whether its documentation PR has since been merged to main.
- Clone or reuse the repositories, read applicable repository instructions and inspect current main/PR state. Do not blindly overwrite files using this handoff's historical snapshot.

```sh
git clone --branch codex/agent-0-build-docs https://github.com/Mentis123/d3smbmxdr.git
git clone --branch codex/agent-0-build-docs https://github.com/Mentis123/data3-cisco-live.git
```

## Existing home pages and pending work

The version hub and edition landings already exist:

- `/decision-room` — illustrated dark version selector.
- `/decision-room/ciso-basecamp` — V1 CISO Basecamp.
- `/decision-room/agent-0` — V2 Agent 0, currently running the original Riverbend content.
- Existing `/decision-room/join`, `/join/:code`, `/session/:code`, `/admin/:id`, `/console/:id` and `/report/:id` routes must remain functional.

Two footer/copy PRs were prepared and pushed, but **were not merged** as of this handoff:

- Primary: https://github.com/Mentis123/d3smbmxdr/pull/23
- Fallback: https://github.com/Mentis123/data3-cisco-live/pull/648
- Both use branch `codex/tabletop-footer` in their respective repositories.
- They add a shared footer to all three home pages and soften Agent 0's public copy. Primary production build/type checks and preview builds passed. The merge calls were not executed because automatic approval review hit a usage limit. This was a review-service failure, not a finding that the changes were unsafe. Use the normal approval/review process; do not bypass the failure through another tool or merge method. Inspect whether a human has since merged these PRs before choosing a starting point.
- Required attribution: `Experience Vibe Coded by our resident Tech Wizard.` Link **Tech Wizard** to `https://www.linkedin.com/in/adam-aka-mentis`, matching the existing Cisco Live credit. Retain the superscript `#` in Data#3 and an appropriate current year.
- Keep all three home pages dark, engaging, responsive and subtly animated, respecting reduced-motion preferences. Preserve the illustrated tiles unless the approved mining story requires a separately reviewed Agent 0 artwork update.

## Key file mapping

| Concern | Primary `d3smbmxdr` | Fallback `data3-cisco-live` |
| --- | --- | --- |
| Version hub, edition intros and shared homepage footer | `app/decision-room/VersionHub.tsx` | `client/src/pages/decision-room/VersionHub.tsx` |
| Hub/edition CSS | `app/decision-room/version-hub.css` | `client/src/pages/decision-room/version-hub.css` |
| Participant/facilitator/projector/report views | `app/decision-room/DecisionRoom.tsx` | `client/src/pages/decision-room/DecisionRoom.tsx` |
| Room CSS | `app/decision-room/decision-room.css` | `client/src/pages/decision-room/decision-room.css` |
| Current Riverbend content | `lib/decision-room/content.ts` | `server/decisionRoomContent.ts` |
| Room API | `lib/decision-room/api.ts` | `server/decisionRoom.ts` |
| Next HTTP adapter | `app/api/decision-room/[[...path]]/route.ts` | Express registration; retain native adapter |
| Page routing | `app/decision-room/[[...slug]]/page.tsx` | Explicit routes in `client/src/App.tsx` |
| Tile artwork | `public/decision-room-art/` | `client/public/decision-room-art/` |
| Update-pattern note | `docs/DECISION_ROOM_VERSIONS.md` | `docs/tabletop/DECISION_ROOM_VERSIONS.md` |

Primary site index: update `public/index-page.html` when routes are added, removed or renamed. Existing production/run instructions are in `docs/RIVERBEND_RUN_SHEET.md` in the primary and `docs/tabletop/RIVERBEND_RUN_SHEET.md` in the fallback.

## Build objective

Implement **Agent 0 — the mine keeps moving**, a new mining edition, while preserving V1 CISO Basecamp and its existing rooms, content and reports.

The fictional customer is **Ironvale Mining**, an Australian hard-rock miner with a remote mine, processing plant and central SOC. Agent 0 is a useful maintenance-coordination agent. It does not directly control machinery. A compromised integration host, excessive permissions and contractor access create an evidenced route towards the IT/OT boundary. Preserve the distinctions between the business agent, SOC assistant and adversary.

The six decisions are:

1. **Triage:** whose evidence do we trust when the AI summary and source events differ?
2. **Identity containment:** what access survives after the host/agent is stopped?
3. **Automation authority:** which responses may act without individual approval?
4. **Mine/site boundary:** how do we restrict contractor access while keeping the plant in a known state?
5. **Data and recovery:** what evidence permits phased recovery?
6. **Board mandate:** what earns Agent 0 permission to return?

The detailed concept contains 24 draft A–D options, conditional facilitator preferences, consequences and branch rules. Refine their clarity and technical accuracy without silently replacing the scenario's learning objectives. Recommendations are conditional on the evidence, not a universally correct product choice.

## Narrative and product treatment — important

The exercise is about people making decisions in a familiar Microsoft environment. Lead with the mine, the people, what happened and what needs deciding. Weave specific tools into the evidence where they have a real role. Avoid product positioning, feature lists, slogans or making purchase the correct answer.

For example, a synthetic briefing might say:

> Defender shows the integration host contacting an unfamiliar address. Sentinel has linked the activity to Agent 0's application sign-in. Purview DLP blocked a contractor document transfer through the collaboration channel it covers; the separate storage connection is still being investigated. The supervisor believes this is scheduled vendor work, but nobody has confirmed the change record. What do you restrict now, and what evidence would change your decision?

Each observation has a source, timestamp, scope and uncertainty. The products need not contradict each other: they may observe different parts of the event. A participant should be able to reason without specialist product knowledge. Use optional detail, a glossary and facilitator notes for deeper product explanations. Retain Rich's final recap to connect the whole chain.

Include the relevant capabilities naturally across the story: Sentinel, Defender XDR/Endpoint, Defender for Cloud posture, Security Exposure Management, external attack-surface management, Entra Workload ID and appropriate Conditional Access, Key Vault, Entra Agent ID, Agent 365, Purview data/AI protection, database/storage threat protection, OT visibility and recovery controls. Do not cram every name into every inject.

Verify current claims against official Microsoft documentation. Check the exact identity type, supported workload, configured protection, licensing/availability and enforcement boundary. In particular:

- Workload, managed, user and agent identities do not share identical Conditional Access behaviour.
- Native Defender attack disruption, custom Sentinel playbooks and generative agents are different mechanisms.
- Purview coverage depends on the actual channel/application and policy; a blocked document transfer does not prove that every API/storage path is safe.
- Defender for IoT supplies observations; site engineering and approved operational procedures own plant actions.
- Immutable backups are not automatically offline, clean or sufficient for accepted recovery.
- Do not carry V1's utility-specific regulatory status, invented AI-reporting requirement or fixed insurance reduction into mining.

## Runtime and versioning requirements

The hub already stores `variant=riverbend` for V1 and `variant=agent0` for new V2 rooms. **That identifier currently does not select a separate scenario at runtime.** Both still use the Riverbend module.

Before rewriting content, introduce explicit scenario/content revision resolution using persisted room data. Pin legacy Riverbend rooms and Agent 0 placeholder rooms to the content they were created with. Do not silently reinterpret old choices, outcomes or reports. Choose a backward-compatible migration/default policy and document it before applying it.

Route all relevant data through the resolved scenario: organisation, launch, stages, rounds, timers, action constraints, consequences, state/meter interpretation, facilitator recommendations, report and CSV. Current code has global Riverbend constants, a hardcoded `BEST_MOVE` map and Riverbend/deck/run-clock wording; those all need inspection. A landing-page rename or swapping one global content module is insufficient.

Maintain the existing control flow and authentication boundaries:

- One device per table, A–D decision, rationale, confidence and lock.
- Facilitator closes → explains options → publishes split/consequences → advances.
- Handover, reopening, projector display tokens, facilitator controls and exports retain their intended behaviour.
- Future content, recommendations and consequences must not leak to participants before the permitted stage.
- No participant ranking. Rich's conditional recommendations must not be reduced to an unjustified V2 “matched Richard” score.

Earlier choices must materially change subsequent evidence and outcomes. A well-contained table can investigate historical attempts or blocked activity; do not force successful exfiltration, encryption or physical damage regardless of earlier actions. Label visual state as a simulation; do not imply that a numeric score proves a mine is safe.

## Implementation and completion

1. Inspect current main and pending PR state; read the repository concept and applicable repo instructions.
2. Resolve the homepage footer PRs through the normal review process, or base work on their approved equivalent. Avoid duplicating them.
3. Prepare the scenario/revision architecture and migration policy, then implement the reviewed mining content and briefing UI on a feature branch.
4. Make participant, facilitator, projector, reports, exports, documentation and relevant companion pages consistent with the selected edition. Preserve V1.
5. Keep shared changes aligned across repos without overwriting framework-specific routing, API plumbing or CSS resets.
6. Validate all six rounds end to end, state transitions, branched consequences, version pinning, authentication boundaries and report/export accuracy. Check phone and projector layout, reduced motion and readable context. Follow repository restrictions on local servers/tests; use permitted builds and deployed verification where required.
7. Produce paired reviewable PRs and a preview. Summarise the exact changes, validation, unresolved product/site assumptions and conceptual decisions requiring Rich/Scott. Do not claim they have signed off.
8. **Review boundary:** the user requested conceptual validation before rolling out the rewritten mining scenarios. Build a concrete preview now; production rollout of the new scenario follows acceptance of the reviewed concept/content and rehearsal. Do not treat the earlier homepage-only production release as approval of all new scenario content.

Do not send messages to Rich or Scott unless the user separately authorises it. Provide a review pack they can share.

## Repository-contained design documents

Read these committed files in either repository:

- `docs/agent-0/README.md` — entry point and implementation/review status.
- `docs/agent-0/agent-0-build-handoff.md` — this execution prompt.
- `docs/agent-0/agent-0-mining-concept-v0.1.md` — detailed design, all 24 options and sources.
- `docs/agent-0/agent-0-concept-review-brief.md` — short review brief.

The concept's source register contains official documentation links. Recheck time-sensitive capabilities rather than assuming the original research stays current. Treat the documents as a proposed design, not evidence of Rich/Scott approval. Before implementation, fetch the latest main and inspect pending PRs; the documentation branch may lag later application fixes. Use a new implementation branch and reconcile the current code with the documented design.
