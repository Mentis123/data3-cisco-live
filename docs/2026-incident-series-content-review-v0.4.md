# Adaptive Incident Challenge

## Four-incident content and logic review

| Field | Value |
|---|---|
| Product | Data<sup>#</sup>3 Cisco Live 2026 booth activation |
| Build | Tabletop incident series |
| Content review | v0.4 |
| Prepared | 29 August 2026 |
| Audience | Enterprise and corporate technology professionals |
| Status | Ready for participant validation and subject-matter review |

## Review outcome

The four incidents are ready for prototype testing. They use one operating model while testing different engineering tensions:

1. **Runaway agent** — contain automation without abandoning service
2. **Edge under pressure** — restore distributed inference without moving the incident into the network
3. **Poisoned context** — stop unsafe action while tracing context and tool propagation
4. **Broken hand-off** — restore customer service while preserving identity and human accountability

The participant experience stays deliberately small:

> Read the signal. Choose one action. See the consequence. Continue.

The sophistication remains beneath the interface. Each choice updates service, containment, evidence, and governance state. Later context changes according to that state.

## Evidence base

The content is vendor-relevant without becoming a product quiz.

- [Cisco Unified Edge](https://www.cisco.com/c/en/us/products/collateral/servers-unified-computing/unified-edge/unified-edge-at-a-glance.html) informed the edge scenario's converged compute, network, storage, security, and real-time observability model.
- [Cisco Observability](https://www.cisco.com/site/us/en/products/observability/index.html) informed cross-stack correlation across models, agents, infrastructure, networks, and business outcomes.
- [Cisco AI Defense](https://www.cisco.com/c/en/us/products/collateral/security/ai-defense/ai-defense-ds.html) informed prompt injection, memory poisoning, tool misuse, privilege escalation, Model Context Protocol inspection, and runtime enforcement.
- [Cisco's zero-trust approach for agentic AI](https://www.cisco.com/site/us/en/solutions/artificial-intelligence/security/securing-agentic-ai/index.html) informed short-lived identity, least-privilege tool access, accountable ownership, and policy enforcement.
- [Webex Contact Center's 2026 capabilities](https://www.webex.com/us/en/whats-new/2026/spring-release.html) informed transfer-context summaries, AI routing, and virtual-to-human hand-offs.
- [NIST AI Risk Management Framework Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) informed human oversight, post-deployment monitoring, incident response, recovery, override, and change management.
- [CISA's incident response playbook](https://www.cisa.gov/sites/default/files/2024-08/Federal_Government_Cybersecurity_Incident_and_Vulnerability_Response_Playbooks_508C.pdf) informed the detect, contain, recover, and post-incident progression.

These sources validate the engineering patterns. They do not replace a named Data<sup>#</sup>3 subject-matter owner's event-release review.

## Participant-copy limits

The prototype enforces booth-speed content limits:

| Element | Limit | Current maximum |
|---|---:|---:|
| Incident premise | 30 words | 18 words |
| New stage context | 22 words | 20 words |
| Action | 16 words | 9 words |
| Consequence | 24 words | 15 words |
| Engineering principle | 12 words | 10 words |

No participant must read a paragraph before acting. Labels, metadata, and debrief content remain secondary to the current decision.

## Choice-quality rules

Every decision follows these rules:

1. Three actions are technically or operationally defensible.
2. No action is framed as foolish, reckless, or obviously incorrect.
3. Each action has an immediate benefit.
4. Each action creates a cost, exposure, delay, or dependency.
5. The strongest option preserves more future choices through bounded, observable, and reversible action.
6. Security terminology alone does not earn a higher score.
7. The consequence explains the trade-off without showing points or judgement.

## Scenario architecture

Each incident contains five connected stages:

| Stage | Purpose | Participant question |
|---|---|---|
| Contain | Stop the incident compounding | What do you stop first? |
| Preserve | Keep the evidence needed to explain it | What do you capture now? |
| Restore | Return useful service safely | How do you restore service? |
| Guardrail | Prevent the same mechanism recurring | Where does the guardrail go? |
| Reactivate | Graduate trust back into automation | When is it safe to reactivate? |

Every incident adds one concise pressure inject at the recovery decision. At least two stages also change their context according to hidden state from earlier decisions.

## Incident one: Runaway agent

### Central tension

Contain automation without discarding the service value it provides.

### Logic progression

1. Bound or redirect the retry storm
2. Preserve prompts, tool calls, traces, or impact evidence
3. Restore service while the service owner is unavailable
4. Place a durable retry or dependency guardrail
5. Return autonomy through shadow, risk-scoped, or signed-off operation

### Intended learning

- Automated retries can compound a service incident.
- Agent authority follows identity, tool access, and network reach.
- Recovery should be staged, observable, and reversible.
- Human involvement should increase with consequence, not apply blindly to every action.

## Incident two: Edge under pressure

### Central tension

Restore distributed inference without moving compute pressure into the network or hiding model-quality risk.

### Logic progression

1. Isolate sites, fail locally, or intervene across the fleet
2. Collect representative evidence without saturating thin links
3. Restore in waves, from an image, or in local-only mode without the edge specialist
4. Prevent one bad push from cascading
5. Reactivate by site health, canary cohort, or full-fleet monitoring

### Intended learning

- Edge incidents cross model, infrastructure, and network boundaries.
- Cloud fallback transfers load and cost; it does not remove them.
- Model quality depends on the input pipeline.
- Distributed change needs cohort-level observability and rollback.

## Incident three: Poisoned context

### Central tension

Stop unsafe action while preserving the evidence needed to find every copy and control gap.

### Logic progression

1. Cut off the suspect source, constrain operation, or roll back context
2. Preserve the source-to-decision trust trail
3. Rebuild trusted context while a regulator asks for an impact account
4. Control provenance, identity, or unsafe output
5. Restore recommendations through advisory, risk-scoped, or full autonomy

### Intended learning

- Agent context is part of the AI supply chain.
- Deleting a source does not remove cached or remembered instructions.
- Tool access needs identity, ownership, scope, and runtime policy.
- Clean model output does not prove a safe action chain.

## Incident four: Broken hand-off

### Central tension

Restore fast service without making customers repeat work or asking people to trust context they cannot verify.

### Logic progression

1. Stop misrouting while preserving customer continuity
2. Trace routing decisions and transferred context together
3. Recover the backlog while priority customers escalate
4. Validate destination, context integrity, and routing confidence
5. Restore routing through suggest, confidence-scoped, or full automation

### Intended learning

- Human escalation is a designed system behaviour, not a failure state.
- Context must remain attributable to its source.
- Receiving staff need a fast verification and override path.
- Queue speed alone does not measure hand-off quality.

## Scoring and response-style review

### Incident score

- Each incident has a best possible score of 100.
- Lowest possible scores range from 76 to 78.
- Scores compare the balance achieved in this scenario; they do not diagnose professional competence.
- Time is displayed separately and does not change the prototype score.

### Response style

Response style now depends on the pattern of decisions, not the score:

- A style selected three or more times becomes the result style.
- A mixed path becomes **The balancer**.
- A tie resolves to the style of the final decision.

This separation is intentional. The score describes decision balance. The style describes the participant's response pattern.

All four styles are reachable in every incident:

- The balancer
- The restorer
- The investigator
- The first responder

## Completion and replay logic

The prototype keeps incident progress in device-local history without revealing the assigned scenario before play:

- The first unplayed incident is selected automatically behind a generic **Start incident** button.
- A temporary numbered prototype selector allows internal testers to target an incident without exposing its title or premise.
- Completed selector buttons grey out to show that all four incidents are tracked.
- Completion survives refresh on the same device.
- The result offers **Try another incident** while unplayed incidents remain.
- After all four are complete, the result offers **Return to home**.
- Replay retains the completion record and updates the best score and time.
- **New player on this device** clears local history after confirmation.
- No sign-in, email address, company, or contact details are required.

Event release still needs an explicit shared-device and participant-session policy.

## Production identity and leaderboard

The v0.4 prototype does not ask the participant to create a separate leaderboard identity or submit a result. Its result screen notes the intended production integration:

- Reuse the Cisco Live 2025 sign-in and participant pattern rather than adding a second identity step.
- Carry the participant's response style, score, and completion time into the production leaderboard automatically.
- Keep one leaderboard position based on the participant's best run across all four incidents.
- A higher decision-quality score ranks first.
- The fastest server-verified completion time breaks a tied score.
- Each row shows response style, best incident, and incidents completed.
- A better replay or a stronger result in another incident updates the player's existing position.
- Scores and decision paths should be recalculated by the server rather than trusted from the browser.
- The public board must not expose the participant's account identifier or collect another display name.

The existing v0.4 leaderboard service remains available as implementation groundwork, but the current participant flow does not call it. Identity and persistence will be integrated with the proven 2025 production pattern before event release.

## Live improvement invitation

The result screen does not pretend to submit feedback. It asks participants who spot a technical gap, questionable assumption, or stronger move to speak with a Data<sup>#</sup>3 engineer at the booth. This supports the intended live improvement conversation without collecting free text or confidential information.

## Accessibility review

The full build requires:

- Logical heading order on the hub, decision, consequence, and result screens
- Visible keyboard focus on every link, button, and input
- Minimum 48 px primary touch targets
- Minimum 16 px participant-facing body and action copy
- Text labels for completion and consequence state; colour is supplementary
- Focus movement to every new decision, consequence, and result heading
- A polite live region around consequence content only
- Progress-bar values exposed to assistive technology
- Reduced-motion support
- No sound dependency
- No horizontal scrolling at 320 px
- Usability at 200% zoom
- Exit available throughout active play

## Prototype acceptance

The four-incident build is accepted for stakeholder testing when:

- Four incidents appear on the launch hub.
- Every incident contains five stages and three actions per stage.
- All 60 option identifiers are unique.
- Every incident has a maximum score of 100.
- All response styles are reachable in every incident.
- At least two later contexts adapt to earlier state in every incident.
- Completion, replay, next-unplayed, refresh, and new-player logic work locally.
- Leaderboard ordering is score descending, then verified time ascending.
- One public position is retained per anonymous player across all four incidents.
- Result screens link to the live board and invite direct feedback with the booth team.
- Participant-copy limits pass automatically.
- The production client build succeeds.
- Current and archive routes remain available.
- No new environment value or manual database action is required.

## Event-release review still required

Before the event release, Data<sup>#</sup>3 should assign a suitably qualified owner to each incident to validate:

- Technical realism
- Consequence plausibility
- Score weighting
- Terminology
- Relevant booth conversation and short-session connection
- Any legal, privacy, safety, or compliance implications

The prototype is designed to collect those challenges without presenting participant text as an instruction or publishing it automatically.
