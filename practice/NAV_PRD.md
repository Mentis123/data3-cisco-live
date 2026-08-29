# Data#3 Navigator Prototype — Product Requirements

**Route:** `/nav`  
**Status:** High-fidelity demonstrator  
**Audience:** Data#3 employees, sales leaders, practice leaders, enablement leaders and executives  
**Delivery model:** One self-contained responsive HTML page with deterministic sample data

## Product definition

Navigator is the guided employee-action layer between **Sid**, the StaffNet intelligent directory, and **Sol**, the governed solution catalogue. It starts with the employee and their mission, asks only the next useful question, explains why information is relevant, and finishes with a practical output such as a meeting pack, readiness card, positioning plan or comparison pack.

Navigator is not a replacement for Sid or Sol. **Sid** remains the trust and directory layer: recognised destination, owner, freshness, people and the Read / Listen / Ask / Connect experience. **Sol** remains the governed catalogue and relationship layer: practice, commercial lens, solution, industry, product, status, confidence and provenance. **Navigator** orchestrates those capabilities around an employee mission.

## Problem and objective

Employees cannot retain or navigate the full product and solution universe. A search box assumes they know the right term; a blank chatbot assumes they know what to ask; a permanent filter wall exposes the system's taxonomy before it understands the employee's task.

Within sixty seconds, a viewer should understand that Navigator recognises the employee and mission, guides rather than overwhelms, uses explicit context to narrow a large information universe, explains every recommendation, preserves source ownership/status/freshness, and helps the employee complete a practical task.

## Core experience

`Launch → Orient → Add context → Discover → Understand → Apply → Complete`

Every journey uses the same state machine. Role and mission change the questions, content, level of detail, recommended actions and final artifact.

The opening interaction is a natural sentence: show me the experience as a role who needs to accomplish a mission. One-click sample journeys cover Account Executive meeting preparation, New Seller learning, Generalist Seller positioning, and Technical Presales comparison.

The prototype asks one primary question at a time. Each answer becomes a visible removable context chip, changes the guide explanation, changes recommendation count and ordering, influences language and depth, and carries through to the final artifact. Explicit choices always outrank inferred profile context.

The discovery workspace presents ranked content cards, trust and approval badges, reason-for-recommendation text, source-route text linking the Sol relationship to the Sid recognised destination, and the ability to remove context and visibly broaden results. Positioning outputs are labelled as hypotheses to validate, not definitive recommendations.

Content opens as a purpose-built briefing rather than a document viewer. Employees can switch between Executive, Commercial and Technical views. Source metadata shows owner, reviewed date and route through catalogue and directory layers.

Concrete actions are offered before free text: build a one-page meeting brief, generate discovery questions, prepare for an objection, quiz me, compare options, or create a specialist handoff. The demonstrator is deterministic and does not claim live tenant search, production AI or generated enterprise facts.

## Practical completion

- Prepare for a meeting → Meeting pack
- Learn a core offer → Readiness card
- Decide what to position → Positioning conversation plan
- Compare two solutions → Technical decision pack
- Handle an objection → Approved talk track

## Supported roles and missions

Roles: Account Executive, New Seller, Generalist Seller, Technical Presales Engineer, Practice Specialist and Sales Manager.

Missions: prepare for a customer meeting, learn or refresh a product, decide what to position, compare two solutions, handle an objection, find customer proof, build a customer follow-up and explore an industry.

## Sid and Sol integration contract

Navigator consumes canonical solution identity, practices, commercial lens, industry/product relationships, customer problem/outcome, triggers/personas, qualification questions, status/confidence/provenance, owner/curator/review dates and related motions from Sol.

Navigator consumes recognised content destination, stable route, owner, lifecycle status, replacement routing, Read / Listen / Ask / Connect modes, and people/team handoff from Sid.

Navigator owns employee role and mission state, explicit journey context, journey recipe and step ordering, recommendation explanation, selected action and assembled task artifact. It must not create a competing practice, industry, product or content taxonomy.

## Recommendation principles

Ranking is deterministic: mission match + explicit context match + employee-role relevance + strategic priority + suitable content type + source freshness. Every recommendation displays a reason; no item appears solely because of opaque personalisation.

Production controls should apply permission/approval first, followed by explicit context, mission fit, role relevance, strategic priority, freshness, usefulness signals, diversity and deduplication.

## Security and delivery

The page lives at `nav/index.html`. `/nav` is deliberately absent from the Express `OPEN_PATHS` allow-list, so the existing password middleware protects the route and its payload assets. No new credential, cookie, bypass or public asset path is introduced.

## Prototype boundaries

The experience is front-end-only and intentionally deterministic. Entra profile data, live Sid registry, live Sol catalogue APIs, CRM context, production recommendation signals and source-grounded generative AI are represented rather than integrated. This boundary is stated in the UI.

## Validation

Validation covers JavaScript syntax, desktop and mobile golden paths, context selection/removal, recommendation reasons and trust badges, Executive/Commercial/Technical switching, artifact creation/completion, mobile guide behaviour, and horizontal overflow.
