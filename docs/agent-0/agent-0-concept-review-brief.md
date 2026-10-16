# Agent 0 — mining concept for Rich and Scott

**Review brief v0.1 · 16 October 2026 · Proposed direction, not approved content**

## The idea

A fictional Australian hard-rock miner, **Ironvale Mining**, uses **Agent 0** to coordinate maintenance work. A compromised integration host and excessive access create a path from business systems towards contractor access at the processing plant. The agent cannot directly control machinery.

Participants work from analyst to board: verify evidence, contain identities, bound automation, coordinate with site operations, establish recovery confidence and decide what earns the agent permission to return.

The products appear as evidence and available controls throughout. Keep the final Microsoft product recap as the whole-chain explanation. The exercise tests judgement, not knowledge of product menus.

**Tone:** the tools are part of the team's familiar working environment. Lead with the incident, people and operational stakes; name products where they supply relevant evidence or controls. Keep detailed capability explanations in optional context and facilitator notes. Avoid product slogans, feature lists or turning a decision into a buying recommendation.

## The six decisions

| Round | Decision | Technology in context |
| --- | --- | --- |
| Triage | What do you trust when an AI summary and source evidence disagree? | Sentinel, Defender endpoint evidence, Security Copilot workflow |
| Inject 1 | What access survives after the agent or host is stopped? | Entra Workload ID, appropriate Conditional Access, Key Vault; agent ownership gap |
| Inject 2 | Which actions can run without individual approval? | Defender XDR attack disruption, configured Sentinel playbooks, bounded agent tools |
| Inject 3 | How do you restrict contractor access while the site stays in a known state? | Defender for IoT observations, Sentinel context, site-controlled network actions |
| Inject 4 | What evidence is sufficient to start phased recovery? | Purview data/AI context, Defender for SQL/storage, validated recovery points |
| Inject 5 | What conditions earn Agent 0 permission to return? | Exposure/posture evidence, external attack-surface review, Agent 365 and Entra Agent ID governance |

The opening scene shows unresolved exposure and ownership findings; the board revisits whether they were actually fixed.

## What changes in the experience

Each inject gives the role, what changed, sourced evidence, what remains unknown, operational stakes and one priority question. Tables choose A–D, explain the trade-off and record confidence. The reveal explains the supporting process, product scope and alternative reasoning.

Earlier choices change later evidence and consequences. Successful containment must reduce harm. Physical safety, data loss and recovery readiness are separate questions; visual meters are labelled as an exercise model.

## Review requests

**Rich:** validate the incident arc, realistic decision pressure, four credible alternatives per question, recommendation conditions and 90-minute pacing.

**Scott:** validate the product-to-process map, customer learning outcomes and how identified gaps connect to approved services without turning the session into a product quiz or overt pitch.

**Together:** nominate a mining OT/site reviewer and an identity specialist. Confirm the maintenance-agent setting, contractor boundary, product assumptions and how the after-action report should acknowledge reasonable alternatives.

Product boundaries matter: workload and agent identity controls have different scopes; Purview protection depends on the data path; OT visibility is not plant control; immutable backups are not automatically offline or validated. The full concept includes current primary-source references and flags assumptions for review.

## Decision sought

Approve the direction, amend specific rounds, or request a different story before implementation. The full companion concept contains 24 draft options, conditional facilitator preferences, branching rules, product mapping and a version-safe implementation plan.

The live V1 and Agent 0 placeholder scenarios have not been changed in this planning pass. A future rewrite must preserve existing rooms and use an explicit content revision rather than silently changing what an old room means.
