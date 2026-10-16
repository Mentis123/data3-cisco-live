# Agent 0 — the mine keeps moving

**Concept review v0.1 · 16 October 2026 · Prepared for Adam, Rich and Scott**

**Status: proposed design for validation. This document does not change the deployed scenarios.**

## 1. The proposition

Agent 0 puts a mining leadership team inside an AI-enabled cyber incident. Participants discover how people, operating procedures and Microsoft security capabilities work together: what a product can show, what a control can do, what it cannot do, and who must authorise the next action.

Keep the original exercise's progression from analyst to board, its table discussion and its visible consequences. Rebuild the incident, evidence, questions and facilitator explanations around a mining organisation. This is more than replacing Riverbend's name or adding product names to old questions.

Suggested opening framing:

> This exercise is about your decisions under pressure. The evidence names the systems your security team uses, so you can see what supports each step. You do not need to know which buttons to click. You do need to decide who acts, on what evidence, with which limits, and how you will know the action worked.

Scott's feedback is addressed through product evidence and control context in every round. Rich's end-of-session product recap remains: it joins those decisions into one coherent defence story.

### Narrative tone: familiar tools in the working environment

Lead with what happened to the mine and what the people need to decide. Name a product naturally when it supplies a relevant observation or action: “Sentinel has linked the sign-in to the maintenance host”; “Purview DLP blocked this document transfer through the covered channel.” Keep the main question about the operational decision. Use source labels and optional context for capability detail, with the fuller product map in the facilitator notes and debrief. A round may need only one or two named tools. Avoid product slogans, feature lists and wording that makes buying a product the answer.

Illustrative participant voice (synthetic evidence, for review):

> The night shift is waiting for its maintenance work packs. Defender shows the integration host contacting an unfamiliar address, and Sentinel has linked the activity to Agent 0's application sign-in. Purview DLP blocked a contractor document being shared through the collaboration channel it covers; the separate storage connection is still being investigated. The supervisor believes this is scheduled vendor work, but nobody has confirmed the change record. What do you restrict now, and what evidence would change your decision?

The apparent tension is about different observations and coverage, not products contradicting one another for dramatic effect. The participant should understand the stakes without needing product-specific knowledge.

### Outcomes participants should leave with

- Explain the difference between an alert, an AI interpretation, an authorised response and a verified outcome.
- Trace an agent's identity, permissions, data access and operational dependencies.
- Authorise rapid containment without giving automation unrestricted plant access.
- Separate cyber containment, process safety, data impact and recovery readiness.
- Turn an observed gap into an accountable improvement action.

## 2. The fictional customer

**Ironvale Mining** is a fictional Australian hard-rock miner with a remote open-pit operation and processing plant, a central SOC in Perth, and specialist maintenance contractors. The commodity, production figures and commercial deadlines are deliberately unspecified until the concept is accepted.

The processing plant depends on local control systems and site personnel. Corporate IT supports maintenance scheduling, supplier collaboration, engineering documents and production reporting. A lost maintenance integration can delay work and production planning; it does not automatically stop a safety system.

**Agent 0** is the company's maintenance coordination agent, not the name of the attacker. It summarises contractor documents, assembles work packs and creates maintenance requests. It cannot directly change PLC logic, start equipment or grant work permits. Making a useful business agent the affected system gives the later restart decision a real business purpose.

Three distinct things must stay clear throughout:

| Actor | Function | Authority |
| --- | --- | --- |
| Agent 0 | Business maintenance coordination | Read approved documents and make requests through defined integrations |
| SOC assistant / Security Copilot workflow | Summarise and help investigate evidence | Limited by its configured tools, permissions and approved workflows |
| Adversary | Misuses a compromised integration host and credentials | No legitimate authority; its influence is not equivalent to control of all AI |

### Proposed environment and trust boundaries

```text
Contractor portal / maintenance documents
                  |
       Agent 0 integration host in Azure
                  |
      Entra service principal + Key Vault
                  |
   Maintenance storage / work-order data
                  |
   Separate contractor remote-access broker
                  |
               OT DMZ
                  |
  Historian / approved engineering access
                  |
       Processing plant control network

Independent observations: Defender endpoint/cloud signals,
Entra and vault logs, Sentinel correlation, OT network sensor,
and site operator confirmation.
```

The principal incident hypothesis is compromise of the externally reachable integration host. A legacy credential and excessive permissions expand its reach. A suspicious contractor document may explain misleading AI output, but prompt injection alone does not confer code execution or bypass authorisation. The exact initial exploit is not a participant learning dependency.

The Entra application identity is initially a conventional, single-tenant service principal. Do not silently treat it as an Entra agent identity or a managed identity. Agent ID / Agent 365 then have a clear governance role: distinguish the current unmanaged integration from the target managed agent lifecycle.

The contractor broker is a second trust boundary, not an unexplained direct route from a chatbot to a controller. At T0, the attacker may already have copied its credential. That makes later investigation necessary even after good initial containment. Show evidence of this timing; do not invent a new foothold simply to force the next round.

**Fictional configuration assumptions to validate:** connectors and retention are configured; relevant Defender plans are enabled on the stated workloads; the OT sensor has independent local visibility; a nominated site controller owns operational safety; specified backups exist. Owning a licence is not proof that any of these controls is operating.

## 3. What every inject shows

### Opening scene: the warnings before the night shift

Give the room a small, synthetic pre-incident evidence strip: external attack-surface discovery found an older contractor endpoint; a Defender for Cloud posture finding identified excessive access on the integration; the exposure view links the affected assets where the configured connectors provide that relationship. The agent ownership record has an unresolved handover. Nobody had yet confirmed remediation. These are explicit fictional findings, not a claim that any product automatically discovers every dependency. [S6, S13, S14]

This makes prevention part of the story before the first alert: the tools produced information, but ownership and process did not turn it into a completed control. Revisit the same evidence in the board round to ask what has actually changed.

### Briefing pattern

Use one consistent, self-contained briefing rather than relying on spoken narration to fill gaps:

1. **Your role and decision horizon:** who you are, what you may authorise, and what needs deciding now.
2. **What changed:** one short paragraph; timestamps distinguish event time from discovery time.
3. **What we know:** two or three sourced evidence cards with source, timestamp, asset/identity and a plain-English implication.
4. **What remains uncertain:** a visible gap that matters to the decision, not a hidden trick.
5. **Operational stakes:** who or what is affected, what keeps working, and the consequence of delay.
6. **Available controls:** product → capability → scope/limit → responsible person. No option is labelled as the recommended answer.
7. **One question, four credible actions:** choose a priority posture; essential parallel duties are assumed and stated.
8. **Table rationale and confidence:** name the accepted trade-off and the evidence that would make you change course.

Keep the default reading layer short: approximately 100–140 words plus three compact evidence cards and the options. Expandable context can define unfamiliar terms. Mark all screenshots, alerts and identifiers as synthetic exercise material; avoid imitating a genuine product alert more precisely than the evidence supports.

On publication, show the table's consequence, the control boundary and Rich's reasoning. Before publication, do not reveal facilitator preferences, other tables' answers or future inject content. Finish each round with: **What supported the process? What was missing? Who owns the improvement?**

## 4. Six-round scenario design

The provisional preferences below are facilitator hypotheses, not a final answer key. Rich should challenge them against the stated evidence. All A–D choices are alternative priorities with costs; none excuses neglecting safety, escalation or legally required work.

### Triage — whose version of events do you trust?

**Seat:** duty SOC analyst. **Time:** Friday 18:40, first suspicious signal. **Decision horizon:** next ten minutes.

**Participant briefing:** Sentinel has associated unusual Entra application sign-ins with activity on Agent 0's Azure integration host. A configured SOC summarisation workflow describes it as scheduled maintenance, but its supporting ticket cannot be found. Defender endpoint evidence shows an unexpected process contacting an unfamiliar destination. Maintenance requests are still processing. Nothing establishes plant control compromise. The on-call lead needs a defensible incident classification and an initial protective action.

**Evidence cards:** Sentinel incident timeline; Entra application sign-in excerpt; Defender for Endpoint process/network observation. The AI summary is separately labelled as an interpretation, with the missing citation visible.

**Question:** What do you prioritise before accepting the summary or expanding containment?

| Option | Proposed action | Accepted cost / likely outcome |
| --- | --- | --- |
| A | Classify a major incident and isolate the integration host immediately. | Removes one active path quickly; disrupts maintenance coordination before scope is established. |
| B | Obtain the service owner's change confirmation before changing access. | Preserves a potentially legitimate service; relies on a callback while suspicious activity continues. |
| C | Escalate provisionally, check source events and restrict the suspicious outbound path. | Adds an analyst task and may interrupt an integration; gives a bounded, evidence-led starting point. |
| D | Put Agent 0 into read-only mode and investigate the identity before host isolation. | Limits business-agent writes; may leave a separately compromised host active. |

**Provisional preference: C**, given independent suspicious events and a missing supporting record. A can be defensible if fresh evidence establishes imminent harm; the briefing must not imply that checking logs always outranks urgent containment.

**Product/process lesson:** Sentinel brings the evidence together; Defender contributes endpoint observations; Security Copilot can support analysis. None removes the analyst's responsibility to test the evidence. Use a fictional configured workflow, not an unsupported claim that a named Microsoft agent routinely fabricates and automatically closes this class of incident. [S1, S2]

**Rich review:** Is the initial threshold and bounded action credible? What one fact would justify immediate host isolation instead?

### Inject 1 — stopping an agent is not the same as stopping its credentials

**Seat:** identity/security engineer. **Time:** 19:00. **Decision horizon:** contain access without breaking every maintenance dependency.

**Participant briefing:** The integration host used `spn-agent0-ops` to obtain tokens and read a Key Vault secret used by a legacy maintenance connector. The principal has broader storage access than its work requires. Agent 0 is not registered in the proposed governed agent inventory. The host is isolated or restricted according to the table's last choice, but previously issued access and a copied downstream credential need separate treatment. The site can use a manual work-request process for a limited period.

**Evidence cards:** Entra identity/type and sign-in record; vault secret-read audit; an owner/dependency record showing the maintenance connector and its manual fallback.

**Question:** Which containment boundary do you authorise now?

| Option | Proposed action | Accepted cost / likely outcome |
| --- | --- | --- |
| A | Restrict the affected principal and rotate the exposed integration credential with the service owner. | Interrupts the integration; addresses identity and downstream access while testing that access has stopped. |
| B | Disable Agent 0's front end and leave the shared connector running. | Keeps established maintenance integrations available; stolen access may survive the UI shutdown. |
| C | Rotate all maintenance-platform credentials immediately. | Broad containment coverage; increases site-wide dependency failures and recovery coordination. |
| D | Block new sign-ins for the principal, then observe before rotating shared secrets. | Smaller immediate business impact; leaves uncertainty about already-issued or non-Entra access. |

**Provisional preference: A**, with an explicit verification step and a supported rotation plan. It is not a promise that one identity action invalidates every token or API key instantly.

**Product/process lesson:** Workload ID, workload Conditional Access and Key Vault address different pieces. Workload Conditional Access has identity and resource boundaries; the same policy does not automatically cover managed identities, every external API or agent-specific identity flows. Entra Agent ID / Agent 365 belong in the ownership, lifecycle and appropriate access design, not as a fictional universal emergency switch. [S3–S6]

**Dependency:** if credentials were contained early, show failed new access and historical secret-read evidence. If they remain live, show fresh successful use. Both are plausible versions of the same investigation.

**Scott review:** Does the identity model make the product roles and their limits easy to explain?

### Inject 2 — what may act without asking you?

**Seat:** SOC lead / response engineer. **Time:** 19:15. **Decision horizon:** next fifteen minutes of response authority.

**Participant briefing:** Analysts are handling repeated activity from identities and devices associated with the incident. A configured Sentinel response playbook can enrich evidence and contain specified IT assets. Defender XDR may also apply its own supported attack-disruption actions; those are distinct from the custom workflow. The site broker and engineering systems are not approved targets for the playbook. A proposed extension would cross that boundary. A contractor-supplied text excerpt has also appeared in an AI recommendation without sufficient source context.

**Evidence cards:** action/approval matrix; named proposed targets; evidence provenance and the applicable independent detection. For a well-contained table, the activity is blocked attempts and investigation backlog rather than an attacker mysteriously escaping.

**Question:** What response authority do you delegate for this window?

| Option | Proposed action | Accepted cost / likely outcome |
| --- | --- | --- |
| A | Require analyst approval for every containment action. | Strong direct oversight; limited staffing slows repetitive IT response. |
| B | Permit the wider workflow on all incident-related assets for fifteen minutes. | Faster coverage; an incorrect asset association can interrupt an operational dependency. |
| C | Run the workflow for enrichment only; make containment a separate manual workstream. | Produces evidence quickly; hands-on containment remains a bottleneck. |
| D | Authorise specified IT actions with audit and reversal checks; require approval for site-boundary actions. | Buys speed within a tested scope; accepts that site actions need a different authority path. |

**Provisional preference: D.** The design assumes this IT action set has already been tested. If it has not, C becomes a stronger initial posture; participants must be told which situation applies.

**Product/process lesson:** distinguish native Defender XDR attack disruption, Sentinel automation/playbooks and Security Copilot agents. They have different triggers and permissions. Built-in disruption is not an unconstrained generative agent or an assurance of containment on every asset. [S1, S2, S7]

**Rich review:** Is the approval boundary actionable under time pressure, or does it create another manual queue? Which action is safe enough to pre-authorise?

### Inject 3 — contain the access; keep the plant in a known state

**Seat:** incident commander with the site OT lead. **Time:** 19:35. **Decision horizon:** authority over the IT/OT boundary.

**Participant briefing:** An OT network sensor reports unfamiliar communications from the contractor access broker towards an engineering workstation. This is evidence of a suspicious path, not proof that controller logic has changed. The site lead says local process indications are stable and the broker is not part of the safety instrumented system. It is needed for a planned vendor support task. The vendor offers to disconnect it, while an unverified call claims to be the incident commander and asks for broader changes.

**Evidence cards:** Defender for IoT observation with sensor coverage; a simple broker → engineering workstation → control-network map; authenticated site confirmation and an approved safe-state procedure.

**Question:** What do you authorise at the site boundary?

| Option | Proposed action | Accepted cost / likely outcome |
| --- | --- | --- |
| A | Ask the site to begin its controlled plant safe-state procedure before changing access. | Conservative operational posture; accepts a production interruption even if only the broker is affected. |
| B | Verify the caller independently, restrict the broker with the site lead, and retain local monitoring. | Stops the suspect route within known dependencies; delays vendor support and needs site coordination. |
| C | Keep the broker connected under close observation until the vendor validates its session. | Preserves support capability; leaves the suspicious path available longer. |
| D | Authorise IT to cut the wider OT uplink immediately. | Restricts more paths quickly; removes visibility and integrations beyond the confirmed broker scope. |

**Provisional preference: B under the stated stable conditions.** If independent site evidence shows an immediate process hazard, the site safety procedure takes precedence. No generic cyber rule decides a mine's safe operating state.

**Product/process lesson:** Defender for IoT supplies network visibility and observations; Sentinel can correlate them. The isolation change is performed through the site's approved access/network controls and authority. The sensor does not operate a crusher, prove a safety system is intact or autonomously authorise shutdown. [S8]

**Branch:** early containment can turn this inject into a previously attempted path now confirmed blocked. Late containment can show an active unauthorised session. There is no inevitable physical safety incident.

**OT reviewer requirement:** confirm the proposed mine topology, dependencies, caller-verification method and safe-state wording before content approval.

### Inject 4 — can you trust what you are about to restore?

**Seat:** CISO with recovery, privacy and site leads. **Time:** 22:00. **Decision horizon:** authority to begin phased recovery.

**Participant briefing:** Defender for SQL and storage observations identify unusual reads associated with the incident. Purview evidence identifies sensitive contractor documents exposed through an over-permissioned collaboration location; it does not establish what left through every storage or API path. A protected engineering-support VM backup is available, but the application owner has not validated the restore in isolation. The next shift needs maintenance work packs. Legal/privacy staff are assessing notification obligations in parallel using the evidence available.

**Evidence cards:** database/storage activity timeline distinguishing attempted and completed reads; Purview classification/AI data-use context for the supported collaboration path; a recovery record with backup age, protection state, last test and unresolved validation.

**Question:** What recovery posture do you approve for the next shift?

| Option | Proposed action | Accepted cost / likely outcome |
| --- | --- | --- |
| A | Restore the available backup directly into production under heightened monitoring. | Shorter service interruption; trusts an unvalidated restore and its dependencies. |
| B | Hold recovery until the complete incident and data-loss assessment is finished. | Avoids acting on incomplete scope; may delay recoverable services unnecessarily. |
| C | Validate a clean restore in isolation and release essential services through agreed acceptance checks. | Takes validation time and uses manual work packs meanwhile; makes recovery evidence explicit. |
| D | Rebuild the affected integration from known-good source before restoring any related service. | Strong separation from compromised runtime; longer disruption and configuration-validation effort. |

**Provisional preference: C**, assuming the isolated validation capability exists. D may be required where there is no trustworthy recovery point or provenance. Notification assessment continues whichever option is chosen; waiting for complete certainty must not become a universal reporting rule.

**Product/process lesson:** Purview DSPM and its associated protections help understand and govern covered data use; the enforcement mechanism and coverage must be named. Database/storage threat protection and recovery systems serve different purposes. Immutable backups protect recovery points; they do not establish that a backup is clean, offline or sufficient for safe restoration. [S9–S12]

**Branch:** show blocked reads and a limited impact assessment if earlier containment worked; confirmed access and more extensive assessment if it did not. Do not declare a fixed quantity exfiltrated in every path.

**Rich review:** Does this question have one clear priority? Which recovery acceptance tests should the executive understand without being asked to perform technical restore steps?

### Inject 5 — what earns Agent 0 permission to return?

**Seat:** board / executive risk committee with operational accountability. **Time:** following morning. **Decision horizon:** the next operating period and a funded improvement programme.

**Participant briefing:** The site is stable or in its agreed safe state. Essential services have a documented recovery position. The incident has exposed gaps in agent ownership, credential scope and the authority of automated response. Maintenance coordination has useful business value, but its full access is not yet justified. Exposure findings and the incident action log show what is fixed, what remains uncertain and which controls are only proposed.

**Evidence cards:** recovery acceptance record; current exposure/dependency summary; an agent ownership and permissions record, with an explicit distinction between the existing legacy service principal and any future Agent ID registration.

**Question:** What operating mandate do you give management for Agent 0?

| Option | Proposed action | Accepted cost / likely outcome |
| --- | --- | --- |
| A | Permit a staged return after named owners verify access, data, response and site-boundary controls. | Restores value gradually; accepts a slower rollout and explicit stop conditions. |
| B | Keep Agent 0 suspended until an independent review concludes. | More assurance before reuse; prolongs manual work and leaves other agents needing separate review. |
| C | Return Agent 0 to its former role with enhanced SOC monitoring. | Faster productivity recovery; monitoring alone leaves governance/control gaps unresolved. |
| D | Replace Agent 0 with a new managed platform before restoring the capability. | Offers a new operating model; migration still needs ownership, permissions, testing and evidence. |

**Provisional preference: A only when the release conditions are met.** For an unresolved table, A means authorising the gated plan, not immediate restart. B can be proportionate where the gates cannot yet be satisfied. Buying or registering a different product is not itself proof of readiness.

**Product/process lesson:** use Security Exposure Management, Defender for Cloud posture, external attack-surface discovery, Agent 365 and Entra Agent ID to support a verifiable improvement plan. The board assigns risk ownership; products do not accept risk on its behalf. [S4–S6, S13, S14]

**Scott review:** Can each gap lead to an understandable next step without making the correct answer “buy the whole stack”?

## 5. Product map for the facilitator

All product appearances are proposed scenario assumptions, not an assertion about a real customer's deployment. Feature names, licensing, supported workloads, availability and integrations need a final check when the approved pack is published.

| Capability from the feedback | Where it earns its place | What the participant learns |
| --- | --- | --- |
| Security Exposure Management | Opening dependency card; round 6 remediation evidence | Relate exposures to the critical business path; a posture graph is not a live incident verdict. |
| Defender for Cloud posture | Pre-existing exposure/permission finding; round 6 owner actions | A known issue needs an owner and remediation; displaying it did not prevent the incident. |
| Defender External Attack Surface Management | Opening discovery of the exposed contractor/integration surface | External discovery and internal investigation provide different views. |
| Entra Workload ID and workload Conditional Access | Round 2 sign-ins, identity type and containment | Match a control to the identity actually used; verify effects on downstream access. |
| Key Vault | Round 2 secret-read evidence and rotation dependency | Secure storage does not save a secret from an identity already allowed to read it. |
| Entra Agent ID and Microsoft Agent 365 | Rounds 2 and 6 ownership/registration gap and future lifecycle | Know which agent exists, who sponsors it and what it may access. Do not conflate registry coverage with universal protection. |
| Purview DSPM, including AI data-risk context | Round 5 supported collaboration/AI channel; round 6 policy validation | Distinguish permissions, classification, policy enforcement and observed data use. |
| Defender for databases, using the appropriate SQL plan | Round 5 SQL threat evidence | Database threat signals help scope investigation; they are not backup or recovery. |
| Immutable and offline backups | Round 5 recovery evidence | Distinct properties requiring separate proof; a fictional offline copy must be explicitly part of the scenario, not inferred from immutability. |
| Defender XDR and Defender for Endpoint | Round 1 observations; round 3 disruption/containment | Distinguish detected activity, configured automatic response and verified outcome. |
| Microsoft Sentinel | Incident evidence throughout; round 3 playbook | Correlation depends on available data; orchestration needs configured actions and authority. |
| OT / east-west visibility, using Defender for IoT | Round 4 | A sensor shows activity within coverage; site engineering determines operational significance. |
| Automatic attack disruption | Round 3 | A supported native capability with prerequisites; separate it from custom automation. |
| Agentic SOC / Security Copilot | Rounds 1 and 3 | Work faster with evidence provenance, limited permissions and human accountability. |

The updated Purview documentation now distinguishes the classic “DSPM for AI” experience from the newer DSPM experience. Use the terminology appropriate to the chosen tenant and release; do not freeze the screenshot's older label into a new pack without checking. [S9]

## 6. Consequences and discussion quality

### Preserve player agency

Use a shared six-round cadence with state-dependent evidence and outcomes. Choose branch wording from explicit facts, not from a simple morality score:

- Has the integration host been contained?
- Have the principal and downstream credential been addressed and verified?
- Is response authority bounded and logged?
- Is the contractor path blocked, active or unknown?
- Is the site operationally stable, deliberately paused or unverified?
- Is data access prevented, observed or still under assessment?
- Has recovery been tested and accepted?

These are simulation states, not production telemetry. A high-confidence answer can still be wrong; a good answer can still incur lost production. Do not imply that a meter reading of 98 means a mine is 98% safe.

**Proposed display:** retain visual movement but label it as an exercise model. Prefer named states such as “access restricted”, “scope unverified”, “site confirmed stable” and “restore not tested”. If numeric meters remain for engagement, explain their illustrative nature and keep independent safety/recovery acceptance checks.

Earlier good choices must prevent or reduce later harm. Later events can reveal historical activity or a separately evidenced pre-existing path. Do not force encryption, exfiltration or a physical event regardless of player action.

### Assess the reasoning

Rich's explanation should name the preferred action under the stated conditions, the trade-off, an acceptable alternative and the evidence that would change the recommendation. For board decisions, a conditional recommendation may be more useful than one universal best letter.

The participant screen stays unranked. After-action feedback should identify the table's choices, rationale, confidence, unresolved dependencies and practical improvement actions. Do not carry V1's “matched Richard” logic into V2 without agreeing how nuanced/conditional responses are represented.

## 7. Delivery shape and responsible commercial connection

**Proposed 90-minute version:** 8 minutes setting and control map; 6 minutes roles/rules and practice; 30 minutes for six five-minute decision windows; 24 minutes for six four-minute reveals/discussions; 10 minutes whole-chain debrief; 8 minutes customer action planning; 4 minutes buffer. Rich should validate the pacing against the first run.

At each reveal, connect: **decision → supporting process → relevant technology → coverage gap → accountable next step**. Keep commercial discussion in the final action-planning segment or a follow-up requested by the customer.

| Observed gap | Candidate next conversation, subject to actual service availability |
| --- | --- |
| Teams cannot distinguish alerts from validated evidence | SOC workflow and telemetry coverage review |
| No owner knows the agent's access or downstream secrets | Workload/agent identity and permissions assessment |
| Nobody can explain automated response authority | Incident-response playbook and automation assurance exercise |
| IT/OT boundary or approval path is unclear | Joint IT/OT dependency and response workshop |
| Sensitive data use is unknown | Data/AI governance and Purview coverage assessment |
| Backups exist but restoration is unproven | Recovery readiness and restore rehearsal |

These are proposed follow-up categories, not claims that a particular packaged Data#3 offering exists or guarantees a result. Scott should map them to approved offerings and owners.

The customer takeaway is a small gap register: observed gap, business impact, current control/evidence, accountable owner, next action and target date. No unsolicited sales outreach is part of this plan.

## 8. Claims and assumptions to remove or validate

- Do not transplant utility-specific customers, billing data, water-control outcomes or named regulatory status into mining.
- Do not treat an OT alert as proof of unsafe physical operation or assume an IT isolation always interrupts safety controls.
- Avoid portraying Microsoft safeguards as universally active, universally ineffective or defeated merely by “AI”. State the configured scope and the actual failure path.
- Do not claim that one Conditional Access policy covers human users, all workload types, agent identities and direct API keys alike.
- Do not claim that a Purview posture finding proves an SQL or blob export was blocked, or that absence of an alert proves no loss.
- Do not equate an immutable cloud backup with an offline copy, a clean restore or accepted operational recovery.
- Do not carry over an invented mandatory AI-incident report or a fixed insurance reduction. Introduce such constraints only if specifically evidenced or clearly fictional policy facts.
- Legal/privacy staff assess obligations applicable to the entity and incident. SOCI status is an asset/applicability question; do not infer it from the word “mining”. NDB assessment and notification are different decisions; do not portray a maximum assessment period as permission to delay a known notification obligation. [S15, S16]
- Leave speculative attribution and unsupported “real attack” parallels out of the core participant facts. An AI-enabled adversary is an exercise premise, not a forensic conclusion from command volume.

## 9. What Rich and Scott should validate before implementation

| Reviewer | Decision needed | Evidence of conceptual acceptance |
| --- | --- | --- |
| Rich | Does the six-round arc produce worthwhile debate? Are the provisional preferences justified, and the alternatives credible? | Each round has an agreed objective, primary decision, preference/conditions, reveal and accepted trade-off. |
| Scott | Does every named product support the SecOps step shown? Does the control map explain process before suggesting a service? | Agreed product map, coverage limits and appropriate approved follow-up offerings. |
| Mining OT/site practitioner, nominated by Rich/Scott | Are site dependencies, authority boundaries and safe-state decisions believable? | Validated topology and wording; no cyber exercise instruction masquerading as a plant operating procedure. |
| Adam | Is the scenario self-explanatory on a phone/projector? Does it remain engaging without a product quiz? | Accepted briefing template, visual states, interaction flow and pacing. |
| Technical/identity specialist | Are principal types, token/secret treatment and feature prerequisites accurate? | Approved identity path and product/tenant assumptions. |

**Specific review questions:**

1. Is Agent 0's maintenance-coordination role the right business anchor?
2. Should the maintenance/contractor boundary be the main route to OT, or is another mining dependency more representative?
3. Do we keep all six seats, particularly the separate automation-authority round?
4. Are any A–D options weak, obviously “wrong”, or answerable without reading the evidence?
5. Which counterfactual should change each provisional recommendation?
6. Which Microsoft capabilities are essential to the base edition, and which should be marked as an optional customer variant?
7. How should the report represent reasonable alternatives to Rich's preference?
8. Which mining and identity reviewers should resolve the remaining technical assumptions?
9. Is the 90-minute format right, and where can discussion time be recovered?
10. What is the final customer takeaway and the permitted commercial connection?

**Review boundary requested by Adam:** validate the concept before rewriting or deploying the live Agent 0 experience. Rich and Scott can approve the direction with changes; that is not yet approval of unreviewed product claims or final operational copy.

## 10. Implementation plan after conceptual validation

1. **Approve the scenario architecture:** freeze the fictional estate, identity types, attack-path hypothesis, learning objectives and six decisions.
2. **Write the reviewed content pack:** participant briefings, 24 options, evidence cards, branch outcomes, facilitator notes, glossary, product/coverage register and debrief. Give every factual product claim a source and every fictional assumption a label.
3. **Agree version handling before changing content:** the existing hub stores `variant=agent0`, but the runtime still uses Riverbend content. Resolve organisation, launch, rounds, consequences, state labels, report guidance and timing from the room's persisted scenario/version. Preserve legacy `riverbend` rooms. Existing Agent 0 rooms created under the original placeholder must not be silently reinterpreted when content changes; pin a content revision or explicitly distinguish legacy placeholder rooms. Choose and record that migration policy before implementation.
4. **Make every surface version-aware:** participant, facilitator, projector, printable report, CSV, run sheet and any standalone companion. Current report answer keys, Riverbend labels and run-clock/deck assumptions need explicit separation. A new landing page alone does not accomplish this.
5. **Build the briefing/evidence interface:** readable core context, source/time/coverage, concise glossary, one decision and a reveal. Keep answer guidance server-side and facilitator-only; show consequences only on publish.
6. **Model and check branches:** prove that earlier controls change later evidence/outcomes; locked/closed/reopened/published states behave as agreed; uncertainty does not become a fake “all clear”. Test the complete path through all six rounds, not only each isolated question.
7. **Keep the paired repos aligned:** implement shared content/UI in `d3smbmxdr`, mirror the agreed changes into `data3-cisco-live`, preserve the native Next.js and Express/wouter adapters, update indexes/docs and compare shared artefacts.
8. **Rehearse before production:** Rich/Scott content walk-through, mining/identity review, then phone/projector/table-device rehearsal with an uninformed reader. Verify V1 regression, version pinning, facilitator-only disclosures, branch semantics and reporting. Release the approved revision only after the content and rehearsal findings are resolved.

No application changes, commits, merges or deployments are included in this concept-planning pass.

## Source register

Primary sources checked on 16 October 2026. They support product/obligation boundaries; the fictional estate, events, options and consequences above are design proposals. Availability and customer prerequisites must be checked again for the final pack.

- **S1:** [Microsoft Sentinel overview](https://learn.microsoft.com/en-us/azure/sentinel/sentinel-overview) and [running Sentinel playbooks](https://learn.microsoft.com/en-us/azure/sentinel/automation/run-playbooks).
- **S2:** [Security Copilot agents application card](https://learn.microsoft.com/en-us/copilot/security/security-copilot-application-card-agents).
- **S3:** [Conditional Access for workload identities](https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity) and [Conditional Access for agents](https://learn.microsoft.com/en-us/entra/identity/conditional-access/agent-id).
- **S4:** [Microsoft Entra Workload ID documentation](https://learn.microsoft.com/en-us/entra/workload-id/).
- **S5:** [Azure Key Vault security](https://learn.microsoft.com/en-us/azure/key-vault/general/secure-your-key-vault) and [secrets security](https://learn.microsoft.com/en-us/azure/key-vault/secrets/secure-secrets).
- **S6:** [Microsoft Agent 365 overview](https://learn.microsoft.com/en-us/microsoft-agent-365/overview).
- **S7:** [Automatic attack disruption](https://learn.microsoft.com/en-us/defender-xdr/automatic-attack-disruption) and [configuration/prerequisites](https://learn.microsoft.com/en-us/defender-xdr/configure-attack-disruption).
- **S8:** [Defender for IoT overview](https://learn.microsoft.com/en-us/azure/defender-for-iot/organizations/overview) and [OT Zero Trust considerations](https://learn.microsoft.com/en-us/azure/defender-for-iot/organizations/concept-zero-trust).
- **S9:** [Microsoft Purview DSPM](https://learn.microsoft.com/en-us/purview/data-security-posture-management-learn-about) and [DSPM for AI classic/version notice](https://learn.microsoft.com/en-us/purview/dspm-for-ai).
- **S10:** [Defender for SQL](https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-defender-for-sql).
- **S11:** [Defender for Storage](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-storage-introduction).
- **S12:** [Azure Backup security](https://learn.microsoft.com/en-us/azure/backup/secure-backup) and [immutable vault boundaries](https://learn.microsoft.com/en-us/azure/backup/backup-azure-immutable-vault-concept).
- **S13:** [Microsoft Security Exposure Management](https://learn.microsoft.com/en-us/unified-secops/overview-msem-strategy).
- **S14:** [Defender External Attack Surface Management](https://learn.microsoft.com/en-us/azure/external-attack-surface-management/).
- **S15:** [OAIC: Notifiable Data Breaches scheme](https://www.oaic.gov.au/privacy/notifiable-data-breaches/preventing-preparing-for-and-responding-to-data-breaches/data-breach-preparation-and-response/part-4-notifiable-data-breach-ndb-scheme).
- **S16:** [CISC: registering critical infrastructure assets and determining asset classes](https://www.cisc.gov.au/resources-subsite/Documents/register-critical-infrastructure-assets.pdf).
