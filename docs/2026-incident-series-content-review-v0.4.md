# Adaptive Incident Challenge

## Four-incident content and logic review

| Field | Value |
|---|---|
| Product | Data<sup>#</sup>3 Cisco Live 2026 booth activation |
| Build | Four-incident prototype series |
| Content review | v0.4 |
| Prepared | 28 August 2026 |
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
| Incident premise | 30 words | 24 words |
| New stage context | 22 words | 20 words |
| Action | 16 words | 14 words |
| Consequence | 24 words | 14 words |
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
| Detect | Establish the first useful signal | What matters first? |
| Contain | Stop the incident compounding | What do you limit? |
| Recover | Restore useful service safely | What do you bring back? |
| Complicate | Introduce a cross-domain dependency | What changes now? |
| Govern | Define safe reactivation or recurrence control | What must remain true? |

At least two stages in every incident change their context according to hidden state from earlier decisions.

## Incident one: Runaway agent

### Central tension

Contain automation without discarding the service value it provides.

### Logic progression

1. Limit retry pressure
2. Test a fallback without transferring the incident
3. Reduce the identity and tool blast radius
4. Restore automation according to consequence
5. Reactivate through observable controls

### Intended learning

- Automated retries can compound a service incident.
- Agent authority follows identity, tool access, and network reach.
- Recovery should be staged, observable, and reversible.
- Human involvement should increase with consequence, not apply blindly to every action.

## Incident two: Edge under pressure

### Central tension

Restore distributed inference without moving compute pressure into the network or hiding model-quality risk.

### Logic progression

1. Correlate model, camera, compute, network, and business signals
2. Create capacity while preserving evidence
3. Protect site operations from cloud-spillover traffic
4. Isolate an input-pipeline shift
5. Release by cohort with business and technical abort thresholds

### Intended learning

- Edge incidents cross model, infrastructure, and network boundaries.
- Cloud fallback transfers load and cost; it does not remove them.
- Model quality depends on the input pipeline.
- Distributed change needs cohort-level observability and rollback.

## Incident three: Poisoned context

### Central tension

Stop unsafe action while preserving the evidence needed to find every copy and control gap.

### Logic progression

1. Block actions while retaining useful read-only service
2. Trace source and index lineage
3. Replace shared authority with action-scoped identity
4. Remove persistent copies from caches and memory
5. Test retrieval, prompts, resources, tools, and approvals as one chain

### Intended learning

- Agent context is part of the AI supply chain.
- Deleting a source does not remove cached or remembered instructions.
- Tool access needs identity, ownership, scope, and runtime policy.
- Clean model output does not prove a safe action chain.

## Incident four: Broken hand-off

### Central tension

Restore fast service without making customers repeat work or asking people to trust context they cannot verify.

### Logic progression

1. Route high-impact cases to accountable people with source context
2. Trace transcription, summary, and routing as one hand-off
3. Minimise and scope identity data
4. Restore summaries with source verification
5. Measure customer, human, quality, and operational outcomes together

### Intended learning

- Human escalation is a designed system behaviour, not a failure state.
- Context must remain attributable to its source.
- Receiving staff need a fast verification and override path.
- Queue speed alone does not measure hand-off quality.

## Scoring and response-style review

### Incident score

- Each incident has a best possible score of 100.
- Lowest possible scores range from 78 to 80.
- Scores compare the balance achieved in this scenario; they do not diagnose professional competence.
- Time is displayed separately and does not change the prototype score.

### Response style

Response style now depends on the pattern of decisions, not the score:

- A style selected three or more times becomes the result style.
- A mixed path becomes **Adaptive responder**.
- A tie resolves to the style of the final decision.

This separation is intentional. The score describes decision balance. The style describes the participant's response pattern.

All four styles are reachable in every incident:

- Adaptive responder
- Rapid restorer
- Evidence-first investigator
- Controlled stabiliser

## Completion and replay logic

The prototype uses device-local history only:

- The first unplayed incident is selected automatically.
- Every incident card shows **Unplayed**, **Next**, or the participant's best score.
- Completion survives refresh on the same device.
- The result offers the next unplayed incident.
- Replay retains the completion record and updates the best score and time.
- **New player on this device** clears local history after confirmation.
- No identity, personal information, database, or network submission is required.

Device-local history is appropriate for prototype validation. Event release still needs an explicit shared-device and participant-session policy.

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
- Participant-copy limits pass automatically.
- The production client build succeeds.
- Current and archive routes remain available.
- No database or environment change is required.

## Event-release review still required

Before the event release, Data<sup>#</sup>3 should assign a suitably qualified owner to each incident to validate:

- Technical realism
- Consequence plausibility
- Score weighting
- Terminology
- Relevant booth conversation and short-session connection
- Any legal, privacy, safety, or compliance implications

The prototype is designed to collect those challenges without presenting participant text as an instruction or publishing it automatically.
