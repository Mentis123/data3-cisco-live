# Navigator Account Conversation Brief

## Decision

Prototype this as a focused route at `/nav/account`, linked from the main Navigator as the ready-made view **AE · research an account**.

This is deliberately a separate experiment for now. Catalogue discovery and account preparation share the same Navigator shell, but they solve different cognitive jobs:

- Catalogue discovery asks: **what might be relevant?**
- Account preparation asks: **what is already true here, who knows it, and what should I discuss next?**

Combining both into the first Navigator screen would recreate the overwhelm the prototype is meant to remove. If the account brief tests well, it should become a first-class `Prepare for an account conversation` mission using the same shared Navigator state and components.

## Seller promise

> Before a customer meeting, give me the four or five evidence-backed conversations worth having, show me what Data#3 is already doing in the account, and tell me who I need to involve internally.

The output is a brief, not a search result page and not a product list.

## Build-first interaction

The main `/nav` page now starts with no recommendations. The employee can adjust Current View without receiving a wall of results. Recommendations appear only after they choose **Build your starting view** or a ready-made scenario.

When revealed, the general Navigator initially shows only the top five starting points. The employee may deliberately expand to the full result set.

The account prototype follows the same rule. Before build, it shows only:

1. account,
2. conversation focus,
3. Build my account brief.

## Account brief output

The prototype produces:

- one prominent **account-team signal** when work in flight could be duplicated or contradicted,
- exactly **five conversation moves**,
- a customer-ready opener for every move,
- why the move matters now,
- the specific account evidence supporting it,
- what to validate before the meeting,
- confidence and named source records,
- current and recent work across practices,
- internal people to involve,
- known customer stakeholders,
- an account timeline for the last 12 months,
- relevant SolCat offers only after the conversation framing is clear.

## Richard scenario represented

The synthetic Queensland shared-services scenario demonstrates the key failure mode described in feedback:

- a Security conversation is being prepared,
- Business Advisory is already delivering an Essential Eight uplift,
- the account brief surfaces that work before recommendations,
- it tells the seller to coordinate with the delivery lead,
- it reframes the next conversation around shared-control ownership, continuous assurance, SOC operating model, identity boundaries and cyber recovery,
- it maps those conversations to a small number of solutions without turning the page into a catalogue.

All account names, people, activities and documents in the prototype are synthetic.

## Production information contract

### Salesforce

- account and parent-account identity,
- account team and opportunity ownership,
- open, won and lost opportunities,
- products and services sold,
- activities, meeting notes and account plans,
- renewals and commercial milestones,
- engagement recency.

### SharePoint and recognised Sid destinations

- statements of work,
- delivery status and project artefacts,
- workshop outputs and assessments,
- account plans and briefings,
- recognised content owner and freshness,
- replacement or superseded-document routing,
- relevant internal people and teams.

### SolCat

- canonical solution identity,
- primary and contributing practices,
- customer problem and outcome,
- triggers, personas and qualification questions,
- lifecycle fit,
- status, confidence and provenance,
- related motions and dependencies.

### Optional account research layer

- public organisation structure and mandate,
- current executive roles,
- strategic plans, annual reports and public initiatives,
- material public events and procurement notices.

Public research must be separately labelled from internal account evidence.

## Evidence and trust rules

1. Permissions are applied before retrieval or synthesis.
2. Every material account claim retains a source route and freshness signal.
3. Work already in flight is shown before new recommendations.
4. Account owner, delivery owner and relevant practice lead are visible at the point of action.
5. Missing evidence produces a visible gap or question, never an invented fact.
6. Inferred opportunities are labelled as hypotheses to validate.
7. The system should detect likely duplication across practices and prompt internal coordination.
8. Customer-ready language is generated from governed evidence, not used to fabricate account history.
9. Employee feedback can flag stale, incomplete or incorrectly connected records.
10. The brief is regenerated on demand from current account memory; it is not treated as a permanent source of truth.

## Ranking logic

The five conversation moves should be ranked by:

1. collision or dependency with active delivery,
2. fit to the employee's stated conversation focus,
3. recency and strength of account evidence,
4. importance to known customer stakeholders,
5. strategic account priority,
6. novelty relative to recent customer conversations,
7. ability to produce a concrete next action,
8. diversity across problem, operating model and solution themes.

The system should avoid returning five variants of the same product discussion.

## Production experience sequence

`Choose account → choose conversation → assemble account memory → detect collisions → rank five moves → coordinate people → prepare customer conversation → capture outcome back to CRM`

The final production action should write a concise, source-linked meeting outcome back to Salesforce so the account memory improves rather than becoming another disconnected portal.

## Prototype boundaries

The `/nav/account` page is deterministic and front-end-only. It does not connect to Salesforce, SharePoint, Microsoft Graph, public web research, Sid or SolCat. It represents the intended information model and interaction using embedded synthetic data.
