# Adaptive Incident Challenge

## Product requirements document

| Field | Value |
|---|---|
| Product | Data<sup>#</sup>3 Cisco Live 2026 booth activation |
| Working title | Adaptive Incident Challenge |
| PRD version | 1.0 |
| Prototype version | v0.3 |
| Status | Validation build |
| Prepared | 27 August 2026 |
| Primary audience | Mo Pfahl, Graham Robinson, Adam Rappaport, practice leaders, booth team, and scenario reviewers |
| Reference incident | Runaway agent |

## 1. Executive summary

The Adaptive Incident Challenge is a short, replayable, tabletop-style experience. A participant receives an artificial intelligence (AI) incident, makes five decisions under uncertainty, sees the consequences propagate, and receives a result describing the balance they struck between service restoration, containment, evidence, and control.

The participant experience must remain immediately understandable:

> Start. Read. Decide. See the consequence. Continue. Discover your response style.

The sophistication sits beneath that flow. Every action is plausible, every action has a cost, and the scoring model rewards the strongest balance without pretending that real incident response has one universally correct answer.

The product also supports a second, optional interaction: **Challenge the scenario**. Participants can identify a missed action, consequence, scoring assumption, or environmental constraint. Accepted contributions can be incorporated through a controlled, AI-assisted publishing workflow, demonstrating how Data<sup>#</sup>3 uses modern AI methods to build, learn, and improve.

### Booth explanation

> You will get an AI incident. Make five calls, see what happens, and discover your response style.

## 2. Product history and archive model

| Version | Product direction | Route | Status |
|---|---|---|---|
| v0.1 | Cascade, Permission to act, and Signal Room concept experiments | `/2026alpha/archive/v0.1` | Archived |
| v0.2 | Four-focus adaptive-difficulty quiz | `/2026alpha/archive/v0.2` | Archived |
| v0.3 | Stateful, consequence-led incident challenge | `/2026alpha` | Current validation build |

The archive must preserve working prototypes and clearly identify them as superseded. Earlier direct links remain functional for continuity.

## 3. Source decisions

### Strongly agreed

- The opening contains one clear start action.
- The game assigns the initial incident.
- Player-facing language describes observable symptoms, not a specialist organisational role.
- The interaction is based on consequences and trade-offs rather than trivia or binary correctness.
- Security tabletop exercises provide the design reference.
- Consequences are revealed after the participant commits to an action.
- Three actions are presented at each decision point.
- A preferable response can exist without portraying every other response as incompetent.
- Decision quality is the primary score input.
- Completion time can differentiate otherwise similar scores.
- The result describes a response style demonstrated in this incident.
- Participants can challenge assumptions, actions, consequences, and scoring.
- Live revision is a useful demonstration of AI-assisted development.
- Connections to short sessions must not complicate active gameplay.
- The build and improvement story is revealed after play, not before it.

### Product defaults adopted for v0.3

- Four distinct incidents will eventually use one common decision model.
- Each incident contains five decision stages.
- Target completion time is under two minutes, excluding the optional result exploration.
- The scenario, not question difficulty, adapts to participant decisions.
- Time is displayed but does not change the incident score in v0.3.
- Contribution recognition remains separate from gameplay score.
- The first validation build contains one complete incident and no leaderboard submission.

### Still unresolved for event release

- Final merchandise and fulfilment process
- Final leaderboard time weighting
- Public display-name and privacy rules
- Final names for response styles
- Remaining three incident subjects and subject-matter owners
- Final presentation titles and destination links
- Who can approve live content and scoring changes
- Whether event publishing requires one or two approvers
- Shared-device reset and participant-session policy

## 4. Problem

The 2025 activation demonstrated that a familiar, fast game creates booth engagement and starts useful AI conversations. Its secondary data-collection activity was too long, confusing, and produced unreliable information.

The early 2026 concepts introduced stronger messaging but still required participants to understand a category, path, or framework before making a meaningful decision. The v0.2 adaptive quiz improved clarity but remained a knowledge test composed of independent questions. Correctness, not propagation, drove the experience.

The product needs to preserve trivia-level accessibility while demonstrating tabletop-level judgement and the distinctiveness of live AI-assisted improvement.

## 5. Audience

### Primary participant

An enterprise or corporate technology professional attending Cisco Live. They may work across networking, security, infrastructure, collaboration, operations, architecture, development, governance, or AI. The experience must not assume their organisation has separate specialist teams.

### Booth colleague

A Data<sup>#</sup>3 colleague who may invite participation, explain the reward, discuss the result, facilitate a scenario challenge, or bridge to a short session.

### Scenario reviewer

A suitably qualified subject-matter expert who validates scenario realism, action plausibility, consequences, scoring, and debrief language.

### Content publisher

An authorised team member who reviews, previews, publishes, and can roll back scenario changes.

## 6. Product objectives

The experience will:

- Be understandable without a spoken explanation
- Begin with one obvious action
- Create a meaningful decision within 15 seconds of starting
- Reveal the risks of both action and inaction
- Demonstrate that AI incidents cross technical and organisational boundaries
- Explain consequences without shaming the participant
- Produce a defensible, differentiated result
- Encourage replay without requiring category selection
- Create a natural conversation with Data<sup>#</sup>3 engineers
- Support credible participant contributions
- Demonstrate controlled AI-assisted development
- Connect naturally to relevant short sessions after play

## 7. Non-goals

v0.3 will not:

- Test Cisco product trivia
- Diagnose a participant's professional personality
- Generate questions or scores using a live language model
- Ask the participant to choose a department, technical category, role, or difficulty
- Display a complex operational dashboard during play
- Build a fully branching 243-path narrative
- Depend on a raffle or unconfirmed merchandise
- Submit personal information or leaderboard entries
- Publish participant suggestions directly to production
- Advertise sessions during active decisions

## 8. Experience principles

### Immediate comprehension

A first-time participant sees one start button and understands that they are entering an incident challenge.

### Meaningful choices only

The interface removes administrative choices. Agency begins when the participant has enough context to make a consequential decision.

### No consequence-free answer

Every option has an intended benefit, an immediate risk, and a cost of delay or action.

### Consequence before judgement

The game explains what the action changed. It does not lead with correct, incorrect, good, or bad.

### Simple surface, sophisticated model

The participant reads short incident updates. Hidden state, scoring, versioning, and governance remain beneath the interface.

### Human accountability

AI can draft and accelerate improvements. A qualified person owns scenario truth, scoring, and publishing decisions.

## 9. End-to-end participant journey

### 9.1 Start

Required content:

- Headline: **Can you contain the incident?**
- Supporting line: **Make the calls. Manage the trade-offs. See the consequences.**
- Five decisions
- Under two minutes
- One button: **Start the challenge**
- Quiet link to the prototype archive

The current participation reward may be mentioned only when confirmed. Registration, scoring instructions, categories, and technology explanations are excluded.

### 9.2 Incident assignment

Start immediately assigns an incident that the current participant session has not completed. The incident title, current symptoms, affected people or service, and one urgency signal appear before the first decision.

v0.3 contains only the Runaway agent incident and therefore assigns it every time.

### 9.3 Decision stage

Each stage presents:

1. Stage label and progress
2. New incident information
3. A direct question
4. Three plausible actions
5. A persistent **Exit challenge** action

Actions are not labelled rapid, measured, or cautious. Their operational differences must be inferred.

### 9.4 Consequence

After selection, the same surface reveals:

- Heading: **Consequence**
- One concise explanation of the benefit and exposure created
- Two short impact signals
- One button: **Continue incident** or **See my result**

The participant cannot change the selected action after seeing the consequence.

### 9.5 Result

Required content:

- Incident score out of 100
- Completion time
- Response style, explicitly limited to this incident
- One strength
- One trade-off
- Final service, containment, evidence, and governance state
- Build statement: **Built with AI. Improved by the people who play it.**
- **Replay this incident** in v0.3; **Try another incident** after more incidents exist
- **Challenge the scenario**
- Related theme; a session link is added only after titles are confirmed
- Persistent **Exit challenge** action

### 9.6 Challenge the scenario

Challenge types:

- Missing action
- Missed consequence
- Questionable score
- Environmental assumption

The participant supplies a short explanation. In v0.3 the interaction is local-only and explicitly says that nothing has been submitted. Event release requires persistence and staff review.

## 10. Scenario architecture

The product will use four distinct incidents with one common operating model:

1. Detect and assess
2. Contain or intervene
3. Stabilise or restore
4. Handle a cross-domain complication
5. Govern reactivation or recurrence

The four incidents are a scenario family. They differ in setting and technical content but test the same central tension:

> How do you balance the risk of acting too quickly against the risk of waiting too long?

### Candidate incident family

| Incident | Central tension | Related content theme |
|---|---|---|
| Runaway agent | Contain automation without abandoning service | Agents, commands, and guardrails |
| Edge AI degradation | Restore performance without acting while blind | Local AI, edge placement, resilience, and token economics |
| Corrupted agent context | Stop unsafe action while identifying propagation | Retrieval, knowledge structures, provenance, and Model Context Protocol |
| Customer hand-off failure | Recover service while preserving human accountability | Collaboration, identity, escalation, and trust |

Only Runaway agent is approved for v0.3 implementation. The others require separate decision matrices and subject-matter review.

## 11. State and propagation model

Each incident carries four hidden state dimensions, clamped from zero to 100:

| Dimension | Meaning |
|---|---|
| Service | Stability and availability experienced by users or customers |
| Containment | Degree to which the incident has stopped spreading or compounding |
| Evidence | Quality, preservation, and confidence of the information available |
| Governance | Strength of authority, traceability, identity, and operational control |

Runaway agent starts at:

- Service: 40
- Containment: 25
- Evidence: 30
- Governance: 45

Each action changes two or more dimensions. The next stage selects a concise context variant from the accumulated state. State affects narrative propagation and the result debrief; it is not separately added to the decision score in v0.3, avoiding double scoring.

## 12. Decision scoring

Each stage offers three credible options worth 14 to 20 points. Points represent the scenario authors' judgement of how well the action balances the available evidence, service impact, containment, and control at that moment.

- Maximum score: 100
- Minimum score in the reference matrix: 73
- Completion time: recorded and displayed
- v0.3 time effect: none
- Event recommendation: use time as a tiebreaker before considering any small bonus

Player-facing language:

> There is no consequence-free answer. Some responses create a better balance based on the information available.

The interface does not reveal option points during play. The result can explain the central scoring trade-off.

## 13. Reference incident: Runaway agent

### Incident premise

An autonomous customer-service agent is repeatedly calling a degraded fulfilment service. Response times are climbing, retries are multiplying, and customers are beginning to abandon sessions. The cause is not yet confirmed.

### Initial state

| Service | Containment | Evidence | Governance |
|---:|---:|---:|---:|
| 40 | 25 | 30 | 45 |

### Stage one: Stop the retry pressure

**New information:** The agent has retried the same failed calls thousands of times. The fulfilment service is still responding, but latency and abandonment are rising.

**Question:** What do you do first?

| ID | Action | Benefit | Exposure | Consequence | Impact signals | State effects | Points | Style |
|---|---|---|---|---|---|---|---:|---|
| R1-A | Pause the customer-service agent and queue new requests for manual processing | Stops automated pressure immediately | Customer requests accumulate and manual capacity is limited | Retry pressure falls immediately. The affected service gets breathing room, but the customer queue begins growing faster than the manual team can clear it. | Spread contained; backlog growing | Service -8, Containment +26, Evidence +4, Governance +6 | 17 | Controlled |
| R1-B | Apply a retry budget and circuit breaker while keeping low-risk requests online | Reduces compounding load while retaining partial service | Some transactions remain exposed to an unconfirmed fault | Automated pressure drops and low-risk requests continue. The fulfilment service remains degraded, but the incident is no longer accelerating at the same rate. | Pressure reduced; partial service retained | Service +10, Containment +20, Evidence +3, Governance +4 | 20 | Adaptive |
| R1-C | Hold changes for 90 seconds and capture traces across the agent and service | Improves evidence before intervention | Customer impact and retry load continue during observation | The trace exposes a repeatable call pattern, but the extra observation window increases abandonment and pushes the fulfilment service closer to saturation. | Evidence improved; impact expanding | Service -10, Containment -5, Evidence +24, Governance +2 | 14 | Evidence-first |

### Stage two: Choose a recovery path

**State-aware context:** If containment is at least 45, retry pressure is slowing but queued or partial customer service remains. Otherwise, the retry storm is spreading to adjacent workflows. A secondary fulfilment endpoint is available but has not carried production volume this week.

**Question:** How do you use the fallback?

| ID | Action | Benefit | Exposure | Consequence | Impact signals | State effects | Points | Style |
|---|---|---|---|---|---|---|---:|---|
| R2-A | Redirect all customer requests to the fallback and monitor it under full load | Restores service fastest if the fallback holds | An untested dependency receives the entire production load | Customer throughput improves quickly. The fallback begins showing resource pressure, leaving little room if demand rises again. | Service restored; fallback exposed | Service +24, Containment +2, Evidence +2, Governance -5 | 15 | Rapid |
| R2-B | Keep the agent restricted until the original service failure is confirmed | Preserves a controlled environment and clean evidence | Customer impact continues while diagnosis proceeds | Evidence quality improves and the original failure becomes easier to isolate. Customer queues continue to grow during the controlled pause. | Cause narrowing; recovery delayed | Service -8, Containment +8, Evidence +22, Governance +7 | 18 | Evidence-first |
| R2-C | Send a small percentage of requests to the fallback with live abort thresholds | Tests recovery under production conditions with bounded exposure | Service returns gradually rather than immediately | The fallback handles the canary cleanly, giving the team evidence to increase traffic without transferring the full incident to another service. | Recovery tested; exposure bounded | Service +17, Containment +10, Evidence +13, Governance +8 | 20 | Adaptive |

### Stage three: Reduce the identity blast radius

**New information:** Investigation shows that the agent uses a shared service identity with write access across test and production. No malicious activity is confirmed, but the same credential can call several administrative tools.

**Question:** How do you contain the authority?

| ID | Action | Benefit | Exposure | Consequence | Impact signals | State effects | Points | Style |
|---|---|---|---|---|---|---|---:|---|
| R3-A | Revoke the agent token and issue a scoped, time-limited identity for recovery actions | Contains authority while preserving controlled remediation | Identity changes may slow recovery and expose integration assumptions | The agent loses broad production authority. Recovery continues through a traceable identity, although several automated steps now require explicit approval. | Authority bounded; recovery controlled | Service -2, Containment +18, Evidence +8, Governance +24 | 20 | Controlled |
| R3-B | Rotate the shared credential across every dependent service immediately | Invalidates the exposed credential quickly | Simultaneous rotation can interrupt unrelated services and obscure the incident boundary | The original credential stops working, but two unrelated integrations fail during rotation and create a second recovery queue. | Credential invalidated; blast radius widened | Service -14, Containment +14, Evidence -5, Governance +12 | 16 | Rapid |
| R3-C | Restrict the agent's network path and monitor every tool call before changing identity | Preserves continuity and produces detailed behavioural evidence | Broad authority still exists if the network restriction is bypassed or incomplete | Tool-call visibility improves and no new abnormal actions appear. The shared identity remains a latent control weakness during recovery. | Behaviour visible; authority remains broad | Service +3, Containment +7, Evidence +20, Governance -2 | 15 | Evidence-first |

### Stage four: Restore customer operations

**State-aware context:** Customer demand is returning. If service is below 55, queues and abandonment remain material. If containment is below 60, the incident is still capable of compounding. Low-risk requests can now complete, but high-impact fulfilment changes still require judgement.

**Question:** What do you restore next?

| ID | Action | Benefit | Exposure | Consequence | Impact signals | State effects | Points | Style |
|---|---|---|---|---|---|---|---:|---|
| R4-A | Restore every agent intent and rely on enhanced monitoring to catch regression | Clears customer queues and resumes full automation quickly | Monitoring detects failure after an unsafe action has already begun | Backlogs fall rapidly. One high-impact request triggers the same degraded dependency before monitoring stops the action. | Queues clearing; regression detected | Service +22, Containment -8, Evidence +4, Governance -7 | 16 | Rapid |
| R4-B | Restore low-risk intents and hand high-impact requests to people with full context | Recovers useful capacity while keeping consequential actions accountable | Manual hand-offs remain slower and require available staff | Most customers return to normal service. High-impact requests move more slowly, but every exception retains context and a named decision owner. | Capacity restored; authority preserved | Service +16, Containment +10, Evidence +8, Governance +17 | 20 | Adaptive |
| R4-C | Keep the agent restricted and clear the entire customer backlog manually | Avoids further automated exposure | Customer recovery is limited by manual capacity and fatigue | No automated regression occurs. The backlog falls slowly and the manual team begins deferring lower-priority work. | Exposure minimised; recovery constrained | Service +3, Containment +15, Evidence +8, Governance +10 | 17 | Controlled |

### Stage five: Set the reactivation gate

**State-aware context:** Immediate customer impact is stabilising. The team can now decide how the agent returns to normal operation. Root cause confidence and governance control depend on the earlier choices.

**Question:** What must be true before full reactivation?

| ID | Action | Benefit | Exposure | Consequence | Impact signals | State effects | Points | Style |
|---|---|---|---|---|---|---|---:|---|
| R5-A | Re-enable the agent after synthetic tests pass and review production behaviour afterwards | Returns automation quickly against a repeatable test | Synthetic success may miss real identities, workloads, and dependency behaviour | Synthetic checks pass and service resumes. Production monitoring inherits the burden of detecting any condition the test did not reproduce. | Automation restored; residual uncertainty | Service +18, Containment -3, Evidence +5, Governance +1 | 15 | Rapid |
| R5-B | Keep the agent disabled until a formal root-cause review and control assessment finish | Maximises confidence before reactivation | Benefits remain unavailable and operational work stays manual | The incident becomes well documented and the control review identifies structural improvements. Customers and staff continue carrying the cost of manual service. | Confidence high; value deferred | Service -5, Containment +9, Evidence +20, Governance +18 | 17 | Evidence-first |
| R5-C | Re-enable in stages with scoped authority, live outcome thresholds, a full trace, and an independent kill switch | Restores value while matching autonomy to current evidence | Requires strong observability and operational ownership throughout the rollout | The agent resumes low-risk work first. Live thresholds and a separate stop control allow the team to expand authority only while outcomes remain acceptable. | Value restored; autonomy bounded | Service +16, Containment +14, Evidence +12, Governance +20 | 20 | Adaptive |

## 14. Response styles

The result is titled **Your response style in this incident**. It must never imply a psychological or professional diagnosis.

### Adaptive responder

**Rule:** Score at least 86, or no single style appears in more than two decisions.

**Strength:** Balanced restoration, evidence, containment, and control as conditions changed.

**Trade-off:** Depends on good observability and clear decision ownership; without them, a nuanced response can become operationally complex.

### Rapid restorer

**Rule:** Rapid is the most frequently selected style after the Adaptive responder rule.

**Strength:** Protected customer momentum and restored useful service quickly.

**Trade-off:** Accepted more residual uncertainty and a greater chance of moving the incident elsewhere.

### Evidence-first investigator

**Rule:** Evidence-first is the most frequently selected remaining style.

**Strength:** Preserved information and reduced the chance of treating symptoms as cause.

**Trade-off:** Extended the period in which customers and operations carried the impact.

### Controlled stabiliser

**Rule:** Controlled is the most frequently selected remaining style. Ties resolve to the style of the final selected action.

**Strength:** Reduced blast radius and kept consequential actions attributable.

**Trade-off:** Introduced approvals and manual steps that slowed full restoration.

## 15. Replay and session behaviour

### Validation build

- Replay resets time, decisions, score, style, and incident state.
- v0.3 serves the same reference incident.
- No browser history is written beyond the active React session.

### Event release recommendation

- Create an anonymous participant session at Start.
- Assign from scenarios not completed in that session.
- Record completed scenario identifiers server-side.
- Permit an explicit **New player** reset on shared devices.
- Expire inactive shared-device sessions.
- Use device storage only to resume an active session, not as participant identity.

## 16. Leaderboard model

The leaderboard is specified but not active in v0.3.

### Ranking

1. Higher incident score
2. Faster completion time for equal scores
3. Earlier completion timestamp for exact ties

### Entry

- Completion is possible without personal information.
- At the result, a participant may optionally enter an alias for the leaderboard.
- Participation merchandise is independent of rank.
- Contribution recognition appears as a badge and does not change incident score.

### Public fields

- Alias or approved display-name format
- Incident score
- Completion time
- Incident title
- Contribution badge, if accepted

No email address, employer, or sensitive technical contribution appears publicly.

## 17. Large-screen experience

The booth display rotates between:

- Current leaderboard
- Provocative incident teaser
- Response-style distribution
- Challenge our assumptions invitation
- Accepted contribution spotlight
- Upcoming short-session promotion

The display is legible at distance, contains no sensitive participant data, and helps explain the activity without requiring a booth colleague to begin every interaction.

## 18. Short-session connection

The game remains free of presentation promotion during active decisions.

After completion, the incident maps to one relevant theme:

- Local AI and device-based capability
- Agents, commands, and guardrails
- Information for agents, including retrieval, knowledge structures, and Model Context Protocol

The Runaway agent result uses the theme **Agents, commands, and guardrails**. A destination link is added only after the session title, time, and destination are confirmed.

Each incident also receives a booth conversation card containing:

- What the incident illustrates
- The central trade-off
- One customer-discovery question
- One challenge prompt
- The related short session

## 19. Challenge and live-improvement workflow

### Participant flow

1. Select challenge type
2. Describe the missed action, consequence, scoring issue, or environmental assumption
3. Submit to the booth review queue
4. Receive a submission acknowledgement

### Staff flow

1. Triage for relevance and safety
2. Ask clarifying questions in person when possible
3. Mark as declined, held, or accepted for drafting
4. Use AI to draft the smallest proposed content change
5. Review the content, state effects, score, profile impact, and affected scenario paths
6. Preview the complete scenario version
7. Receive authorised approval
8. Publish a new immutable scenario version
9. Confirm the public experience and retain rollback
10. Apply a contributor badge separately when appropriate

No participant text becomes an instruction to an AI system or production change without review.

## 20. Content governance

Every production scenario version requires:

- Named scenario owner
- Named subject-matter reviewer
- Scoring rationale for every option
- Consequence and state-effect review
- Data<sup>#</sup>3 brand review
- Accessibility and plain-language review
- Version identifier and score-model hash
- Preview approval
- Publish timestamp and publisher identity
- Rollback target

Changes to points or state effects create a new score model. Leaderboard comparisons across materially different score models must be separated or clearly marked.

## 21. Functional requirements

### Participant application

- Mobile-first start, decision, consequence, result, replay, challenge, and exit flows
- Random unplayed scenario selection when more than one incident is active
- Five decisions per incident
- Three actions per decision
- State propagation and context variants
- Deterministic scoring
- Completion timer
- Response-style calculation
- Optional leaderboard alias at completion
- Accessible keyboard and touch interaction
- Session reset for shared devices

### Scenario administration

- View draft and published scenario versions
- Edit scenario, stage, action, consequence, state effects, points, style, and session mapping
- Validate completeness and scoring bounds
- Preview every action path and result range
- Compare changes
- Publish with approval
- Roll back to a prior version
- Review participant challenges
- Assign contributor recognition

### Booth display

- Rotating content modes
- Near-real-time leaderboard refresh
- Scenario and profile distributions
- Session promotion schedule
- Accepted contribution spotlight

## 22. Technical architecture

### v0.3 validation build

- React and TypeScript in the existing Vite application
- Static, reviewed incident definition in source control
- Deterministic client-side state and scoring
- In-memory active run only
- No database writes or personal information
- Existing Vercel deployment from `main`

### Event architecture

- Existing Vercel application and API surface
- Neon PostgreSQL through the existing serverless-compatible data layer
- Immutable, versioned scenario content
- Anonymous participant sessions
- Server-authoritative completion and leaderboard scoring
- Polling or server-sent updates for the booth display; no dependency on process-local WebSockets
- Authenticated and audited administration

### Proposed tables

| Table | Purpose |
|---|---|
| `scenario_versions` | Immutable scenario content, status, owner, reviewer, and score-model hash |
| `participant_sessions` | Anonymous active session, completed incidents, and expiry |
| `incident_plays` | Scenario version, timing, final score, profile, and final state |
| `incident_decisions` | Stage, option, response time, and state transition |
| `leaderboard_entries` | Optional alias and eligible play reference |
| `scenario_challenges` | Participant contribution and review status |
| `contribution_badges` | Accepted recognition separated from gameplay score |
| `content_audit_log` | Draft, approval, publish, and rollback events |

## 23. Data and privacy

- v0.3 sends no participant or gameplay data.
- Event release collects only information required for session continuity, leaderboard participation, reward fulfilment, and approved analytics.
- Leaderboard entry is optional and purpose-specific.
- Privacy notice appears at the point of collection.
- Public display data is minimised.
- Scenario challenges may contain organisational details; the interface warns participants not to include confidential information.
- Retention periods and access roles are defined before event release.

## 24. Accessibility and mobile requirements

- Design starts at a 390 px viewport and supports 320 px without horizontal scrolling.
- Primary and answer controls are at least 44 px high; 48 px is preferred.
- Body copy uses at least 16 px equivalent on participant surfaces.
- Colour is never the only indicator of state or consequence.
- Focus indicators are visible against the dark background.
- Heading hierarchy remains logical.
- Screen focus moves to each new decision and result heading.
- Consequences are announced through an appropriate live region without trapping interactive controls inside it.
- Reduced-motion preferences are respected.
- Text remains usable at 200% zoom.
- No sound is required in the booth environment.
- Exit challenge is available throughout the active experience.

## 25. Performance and resilience

- Initial participant route should be usable within two seconds on a typical event mobile connection.
- The active incident must remain playable after initial load if connectivity becomes intermittent.
- v0.3 scoring and content require no network round trip.
- Event submissions retry safely using idempotent play identifiers.
- A failed leaderboard or contribution submission never blocks the completion result.
- Static fallbacks remain available if live display data is unavailable.

## 26. Analytics and evaluation

### Validation questions for v0.3

- Does a participant begin without explanation?
- Do the three actions feel credible?
- Do consequences feel fair and informative?
- Does the incident feel connected from stage to stage?
- Is the result recognisable as a reflection of the run?
- Does the challenge invitation produce technical conversation?
- Is five decisions the right duration?

### Event measures

- Starts and completions
- Completion rate
- Median completion time
- Score and response-style distribution
- Replay rate
- Scenario distribution
- Challenge submission and acceptance rate
- Session-link engagement
- Reward fulfilment count
- Booth-colleague qualitative observations

Declared technical interest must not be inferred from a single incident assignment.

## 27. v0.3 acceptance criteria

The validation build is accepted when:

- `/2026alpha` contains one Start action and no path choice.
- Start assigns the Runaway agent incident and begins the first decision.
- The incident contains five connected stages and three plausible actions per stage.
- Every action reveals a benefit and a trade-off without correct or incorrect language.
- Choices change hidden state and later context.
- The deterministic incident score totals at most 100.
- Completion time is recorded and displayed but does not change the score.
- The result identifies a response style, strength, and trade-off limited to this incident.
- The result displays final service, containment, evidence, and governance state.
- Replay resets the complete active run.
- Challenge the scenario works as a clearly labelled local-only prototype interaction.
- Exit challenge works during decisions, consequences, and results.
- The version archive exposes v0.2 and v0.1.
- v0.1 preserves the three original prototypes.
- v0.2 preserves the four-focus adaptive quiz.
- The production build succeeds and all current and archive routes resolve.
- No database or personal information is required.

## 28. Release plan

### Phase one: v0.3 validation

- Complete this PRD
- Archive v0.1 and v0.2
- Build the Runaway agent incident
- Conduct stakeholder and participant testing
- Review the scenario with Chris Harvey or another qualified tabletop specialist

### Phase two: scenario family

- Refine the common decision model
- Author and review the remaining three incidents
- Add unplayed-scenario assignment and participant-session replay
- Validate score comparability

### Phase three: event platform

- Add server-authoritative plays and leaderboard
- Add optional alias and privacy notice
- Add challenge persistence and staff review
- Add versioned scenario administration and controlled publishing
- Add rotating booth display

### Phase four: event readiness

- Confirm merchandise and fulfilment
- Confirm presentation content and links
- Complete accessibility, load, resilience, and shared-device testing
- Train booth colleagues and content approvers
- Freeze the release candidate and rehearse rollback

## 29. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The experience becomes too complex | Keep one start action and one decision per screen; reveal sophistication after play |
| Choices still feel like disguised right answers | Require three defensible actions and document each benefit and exposure |
| Scoring feels arbitrary | Maintain an explicit decision matrix and subject-matter review |
| Four incidents become inconsistent | Use one state model, stage structure, score range, and profile framework |
| Response styles feel judgemental | Limit claims to the current incident and pair one strength with one trade-off |
| Live edits damage trust or comparability | Use immutable versions, approval, preview, audit, and rollback |
| Shared devices repeat or leak participant state | Use explicit new-player reset, session expiry, and server-side session history |
| Reward uncertainty distorts the product | Keep participation reward independent of scoring and leaderboard |
| Presentation links overload gameplay | Reveal one contextual connection only after completion |
| Participant challenges contain sensitive information | Warn against confidential content and restrict review access |

## 30. Approval requested

Approval of v0.3 confirms:

1. The adaptive-difficulty quiz is archived as v0.2.
2. The three original concepts are grouped as v0.1.
3. The current product becomes a stateful tabletop-style incident challenge.
4. Runaway agent is the first reference incident.
5. The validation build uses five decisions and the four-dimension state model.
6. Points determine the score; time is displayed but is not yet weighted.
7. Response styles describe this incident only.
8. Challenge the scenario is local-only until the reviewed backend workflow exists.
9. Leaderboard, identity, merchandise, and live publishing remain specified but outside v0.3 implementation.

