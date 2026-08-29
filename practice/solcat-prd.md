# Product Requirements Document — Data#3 Practice Solution Prism

**Document type**: Product Requirements Document
**Product**: Interactive Practice, Lens, Solution and Industry Catalogue
**Working title**: Practice Solution Prism (URL: `/solcat`)
**Primary audiences**: Sellers, specialists, Practice Managers, industry teams, marketing, delivery leaders and executives
**Initial deployment**: Self-contained standalone HTML demonstrator
**Future-state deployment**: StaffNet / Sales Hub intelligence layer
**Product owner**: Adam Rappaport
**Status**: Build-ready specification
**Language**: Australian English
**Version**: 2.2
**Data basis**: Internal catalogue evidence, Work IQ-sourced material, the Service & Solutions Capability structure (practice slide, May 2026), synthesised four-lens classifications and clearly marked illustrative records

**v2.2 changelog** — aligns the practice model to the confirmed Service & Solutions Capability structure:
- **Seven delivery practices locked** (§5.1): Data & AI, Security, Apps & Automation, End User Computing, Collaboration, Networking, Hybrid Cloud.
- **Business Advisory repositioned** as the Digital Strategy capability layer (Business Aspect-led), not an eighth peer practice. Its catalogue records remain fully in scope.
- **Lifecycle Services added** as the Digital Lifecycle capability layer; the §24 "Managed Services" reference now resolves to it.
- Practice records gain `layer` and `delivery` fields (§25.4); matrix rows group by capability layer (§10.1); Vendor Alliances noted as context for the Product and Vendor View (§5.4).
- The capability slide is a structural reference only — it does not supersede catalogue evidence on solution scope or naming.

**v2.1 changelog** — integrates the *Data#3 Brand Guidelines (August 2024)* in full:
- New §36 Brand and Visual Identity Requirements (normative).
- §10.1 lens colours re-specified from the Data#3 palette (green/orange of v2.0 were off-palette).
- Dark mode promoted from Could-Have (§29) to the default experience per brand dark-mode doctrine.
- Typography, iconography, imagery, logo usage, accessibility and copywriting rules made explicit and testable (§31 extended).
- All UI copy is subject to the Data#3 tone-of-voice and grammar rules (§36.6).

---

## 1. Executive Summary

Build a polished interactive application that organises Data#3's products, services and customer solutions across four connected dimensions: **Practice, Commercial lens, Solution, Industry**.

The four commercial lenses are: **Advisory, Packaged, Bespoke, Managed**.

The application must allow users to view the same governed solution catalogue from multiple perspectives:

- All practices across all four lenses
- One lens across all practices
- One practice across all four lenses
- One industry across all relevant practices and lenses
- One product or vendor across all related solutions
- One customer problem across all matching solutions
- Cross-practice or cross-industry solution relationships
- Portfolio coverage, gaps, ownership, maturity and freshness

The product must not behave like a static repository or a collection of SharePoint pages. It must act as an intelligent navigation, solution discovery and catalogue-governance layer over existing StaffNet, Sales Hub, SID and practice content.

The central product idea: **Every practice has four ways to create value. Every solution has an entry point, accountable ownership, industry relevance and a pathway to recurring value.**

## 2. Current Internal Foundation

The Solution Catalogue 2026 provides a substantial starting structure across: Business Advisory, Cybersecurity, Data & AI, Apps & Automation, End User Computing, Collaboration, Hybrid Cloud, Networking.

That catalogue uses customer-oriented headings — *What do I plan for? What are my risks? What solutions do I need? What products do I buy? Can you manage it for me?* — broadly associated with Advisory, Assurance, Solution Type, Vendors and Products, and Managed Services.

This product must preserve that customer-centred intent while translating catalogue content into the four-lens model (Advisory, Packaged, Bespoke, Managed). The four-lens assignment is a working commercial classification and must not silently overwrite the source catalogue's meaning.

## 3. Problem Statement

Data#3 has extensive customer capabilities, but information is distributed across solution catalogues, StaffNet, practice sales-enablement sites, industry sites, SID, proposal libraries, product pages, vendor content, Microsoft and partner enablement, Teams discussions, individual subject-matter experts, practice plans and managed-service material.

This produces: sellers not knowing what to position; similar capabilities described differently across practices; products confused with solutions; unclear practice ownership; industry relevance held in heads not metadata; solutions invisible on relevant industry sites; industry teams unaware of practice solutions and vice versa; disconnected advisory/implementation/managed motions; hard-to-find packaged entry offers; stale records without owners and review dates; no single portfolio view of duplication, gaps and commercial progression; and static sites that force users to know where content lives before they can find it.

## 4. Product Vision

Create a common solution intelligence layer that lets a user begin with any of: a practice, a lens, an industry, a customer problem, a business outcome, a solution, a product, a vendor, a capability, a customer maturity level.

The application then answers: What solutions are relevant? What customer need does each address? Which practice owns it, and which contribute? Which industries does it touch, and is that confirmed or suggested? Which products and vendors support it? What can a seller position now, and what needs specialist qualification? How current and trustworthy is the information? What should occur next? Is there a pathway to managed or recurring value? Which StaffNet, SID, practice or industry content is related?

It should feel like a combination of: a visual solution catalogue, an intelligent seller navigation layer, a Practice Manager portfolio workspace, an industry-solution alignment tool, a catalogue-governance platform, a presenter-friendly executive map, and a future virtual Practice Manager foundation.

## 5. Core Product Model

### 5.1 Practice

A practice is an organisational capability domain. The practice model follows the confirmed Service & Solutions Capability structure:

**The seven delivery practices** (locked):

| Practice | Capability layer | Delivery |
|---|---|---|
| Data & AI | Digital Innovation | Data#3 with Business Aspect |
| Security | Digital Innovation | Data#3 with Business Aspect |
| Apps & Automation | Digital Innovation | Data#3 with Business Aspect |
| End User Computing | Digital Foundation | Data#3 |
| Collaboration | Digital Foundation | Data#3 |
| Networking | Digital Foundation | Data#3 |
| Hybrid Cloud | Digital Foundation | Data#3 |

**Two capability layers** (first-class catalogue entities, distinct from the seven practices):

- **Business Advisory** — the Digital Strategy layer, Business Aspect-led. It spans all delivery practices and retains its full solution portfolio (§23.1). It renders as its own band in the matrix, above the seven practices, and is never counted as "one of the seven".
- **Lifecycle Services** — the Digital Lifecycle layer, spanning beneath the delivery practices. It is the natural organisational home of many Managed-lens motions; managed solutions remain owned by their practice, with Lifecycle Services recorded as the delivering layer where applicable.

**Vendor Alliances** is a cross-cutting function (vendor-aligned expertise supporting practice development and profitability). It is not a practice or layer record; it is context for the Product and Vendor View (§5.4) and vendor metadata.

Naming: internal sources vary ("Cybersecurity" vs "Security"; "Data & AI" vs "Artificial Intelligence"; "Apps & Automation" vs "Applications & Automation"), so practice names are configurable, recording both source and display names. Defaults follow the capability structure, with catalogue variants preserved as source names:

```json
{
  "id": "practice-security",
  "sourceName": "Cybersecurity",
  "displayName": "Security",
  "aliases": ["Cybersecurity"],
  "layer": "digital-innovation",
  "delivery": "d3-with-ba",
  "namingStatus": "confirmed-by-capability-structure",
  "active": true
}
```

The same pattern applies to `practice-data-ai` (source "Data & AI", display "Data & AI" — the earlier "Artificial Intelligence" display option remains recorded as an alias pending owner confirmation) and `practice-apps-automation` (source "Apps & Automation", alias "Applications & Automation").

No practice or layer name may be permanently embedded into the application layout. The delivery field records Business Aspect involvement (`ba`, `d3-with-ba`, `d3`) and must be rendered as a text chip, not by colour alone — and not with the source slide's green/gold/blue, which are not §36.3 palette values.

### 5.2 Commercial Lens

**Advisory** — *What should we do, why does it matter and how should we proceed?* Strategy, governance, readiness, discovery, architecture, business case, roadmap, operating model, risk, prioritisation, transformation advice.

**Packaged** — *How can we begin quickly with controlled scope and predictable outputs?* Assessment, accelerator, quick start, health check, readiness engagement, fixed-scope workshop, prototype, foundation, defined deployment offer.

**Bespoke** — *What must be designed, integrated or built specifically for us?* Customer-specific design, production engineering, migration, integration, custom workflow, platform implementation, application development, complex transformation, squad-based delivery.

**Managed** — *How will we operate, secure, support and improve this capability over time?* Platform operations, monitoring, support, optimisation, governance, security operations, FinOps, lifecycle management, adoption support, continuous improvement, managed infrastructure.

### 5.3 Solution

A solution is something a customer can meaningfully buy, commission or consume to achieve an outcome. It can combine products, advisory, professional services, packaged intellectual property, customer-specific engineering, managed services, multiple practices and multiple industry applications.

### 5.4 Product

A product is a vendor technology, platform, licence, device, appliance or technical component. Products must support solutions, not become the top-level catalogue structure. Examples: Azure AI Foundry, Microsoft 365 Copilot, Microsoft Sentinel, Azure Local, Cisco Catalyst, Microsoft Surface, ServiceNow, Microsoft Fabric.

### 5.5 Industry

An industry is a customer-market classification aligned to the existing StaffNet industry sites and SID structure. Use the same industry entities, names and identifiers as the StaffNet/SID project wherever available. **The application must not create a competing industry taxonomy.**

Support: a single solution touching multiple industries; a single industry containing solutions from multiple practices; industry-specific customer triggers; industry-specific evidence, stories and collateral; industry-owner and practice-owner review; industry-relevance confidence; two-way industry↔solution navigation.

Education is initially an industry, not an approved practice.

## 6. Commercial Model

```
ADVISORY   — find and qualify the value
   ↓
PACKAGED   — begin quickly and prove momentum
   ↓
BESPOKE    — productionise what requires differentiation
   ↓
MANAGED    — operate, optimise and discover what comes next
   ↺
```

Advisory creates clarity and qualified demand. Packaged creates momentum and confidence. Bespoke creates differentiated production value. Managed sustains outcomes and creates expansion.

A solution can have one primary lens, supporting lenses, one primary practice, contributing practices, several industries, several products, preceding solutions, next-best solutions and a managed destination. **The data model must support many-to-many relationships.**

## 7. Primary User Groups

**7.1 Sellers and Account Executives** — What can I sell? What customer signal should I listen for? Which offer is the best starting point? Which practice or specialist should I engage? Which industries commonly use this solution? What collateral can I use? What should I position next?

**7.2 Sales Specialists and Solution Architects** — Which solutions apply to the opportunity? Which products and practices are involved? Packaged or custom? What qualification is required? What prerequisites apply? What evidence supports the industry fit? What gaps remain?

**7.3 Practice Managers** — What does the practice own and contribute to? Is the portfolio balanced across four lenses? Which industries consume or could consume these solutions? Which offers need investment? Which records need review? Where are managed-service gaps, duplicates, and records lacking owners, collateral or evidence?

**7.4 Industry Teams** — What solutions are relevant to this industry, and who owns them? Which are genuinely industry-specific vs broadly applicable? What triggers are unique to the industry? What evidence exists? Which gaps should be raised with practices? What should appear on the StaffNet industry site?

**7.5 Executives** — Is the portfolio cohesive? Is each practice balanced across lenses? Which industries have strong or weak coverage? Where do cross-practice plays work? Where is recurring-value conversion missing? Which propositions need investment?

**7.6 Marketing and Enablement** — Which solutions are approved for promotion? Which industry pages should surface each solution? Which records have approved messaging? Where are case studies missing? Which collateral is outdated? Which themes support campaigns?

**7.7 Catalogue Administrators** — Maintain the catalogue; manage classifications and taxonomies; resolve duplicates; review stale content; assign owners and curators; manage industry mappings; publish or archive; import and export; monitor validation queues.

## 8. Primary Application Views

Portfolio Overview · Practice × Lens Matrix · Practice View · Lens View · Industry View · Solution View · Product and Vendor View · Relationship / Journey View · Portfolio Health View · Admin Control Centre · Practice Admin Workspace · Industry Mapping Workspace · Presenter Mode.

## 9. Portfolio Overview

The landing page provides: the four commercial lenses; active practices; active industries; featured cross-practice solutions; recently reviewed solutions; records needing review; proposed portfolio gaps; quick search; common navigation entry points.

Entry cards: Explore by customer problem · Explore by practice · Explore by lens · Explore by industry · Explore by product · Manage the catalogue.

The experience must remain useful without analytical charts. Any displayed totals must be computed directly from the current prototype dataset and labelled as prototype catalogue totals.

## 10. Practice × Lens Matrix

### 10.1 Default Layout

Practices as rows; Advisory, Packaged, Bespoke and Managed as columns; solutions within cells.

Rows are grouped into capability-layer bands mirroring the Service & Solutions Capability structure: **Digital Strategy** (Business Advisory) on top, then **Digital Innovation** (Data & AI, Security, Apps & Automation), then **Digital Foundation** (End User Computing, Collaboration, Networking, Hybrid Cloud), with **Digital Lifecycle** (Lifecycle Services) as the closing band. Band labels are subtle row-group headers; the bands make the matrix read as the organisation's own structure on a shared screen.

**Lens colours are drawn exclusively from the Data#3 brand palette (see §36.3) and remain constant:**

| Lens | Dark-surface colour | Light-surface / text-safe variant |
|---|---|---|
| Advisory | Data#3 Light Blue `#00AEFF` | Data#3 Blue `#007BC3` |
| Packaged | Aqua `#00FFFF` | Dark Teal `#245B79` |
| Bespoke | Cool Lilac `#9B9BFF` | Cool Purple `#7300FF` |
| Managed | Magenta `#FF00FF` | Dark Magenta `#B30089` |

Rationale: v2.0's green and orange are not Data#3 palette colours. Advisory keeps the blue association from v2.0; Bespoke keeps purple. The matrix qualifies as data visualisation, so the Data Visualisation Palette (§36.3) is legitimately available to it. Every lens is additionally encoded with its initial letter chip (A/P/B/M) so colour is never the only differentiator (§36.7 accessibility).

### 10.2 Solution Cards

Each compact card shows: solution name; one-line customer outcome; status; confidence; primary practice; cross-practice indicator; industry indicator; count or icons of mapped industries; product/vendor tags where useful; next-motion indicator; provenance indicator.

### 10.3 Industry Interaction

From any solution card the user can: see mapped industries; open the industry list; filter the matrix by an industry; flag an additional industry; question or remove an existing association (subject to permissions); open the corresponding industry view.

### 10.4 Density Options

**Executive**: name, status, major relationships, portfolio gaps. **Standard**: adds outcome, industry indicators, ownership, products. **Detailed**: adds customer triggers, outputs, relationships, freshness, collateral, provenance.

## 11. Practice View

Selecting a practice displays: name; description; owner (where supplied); source-name and display-name status; portfolio across all four lenses; industries touched; products and vendors; cross-practice solutions; portfolio gaps; readiness distribution; records requiring review; solution owners and curators; related StaffNet or practice destinations; recommended management actions.

The view answers: *Does this practice provide a coherent path from advice to fast entry, production delivery and ongoing operation?*

### 11.1 Industry Coverage within a Practice

Show: industries mapped to the practice's solutions; solutions per industry; confirmed, suggested and disputed mappings; unmapped solutions; industry pages lacking solution coverage; broadly applicable solutions; industry-specific offers.

### 11.2 Practice Management Actions

Authorised practice administrators can: add a solution; edit practice-owned solutions; propose changes to contributed solutions; assign primary and supporting lenses; add or remove products; flag industries; nominate industry-specific customer triggers; set offer status; set customer-facing visibility; attach collateral; assign owner and curator; nominate next-best solutions; submit a record for approval; archive or supersede a record; view practice-level validation issues.

## 12. Lens View

Compare one commercial motion across practices. Example questions: What Advisory solutions exist? Which practices lack a packaged entry offer? Which bespoke capabilities have no managed destination? Which managed offers lack an entry motion? Which industries are strongly or weakly represented? Which offers appear duplicated? Which customer outcomes recur across practices?

Must support: practice grouping, industry filtering, product filtering, status filtering, provenance filtering, compare mode, gap mode.

## 13. Industry View

A first-class experience, not only a filter.

### 13.1 Industry Overview

Each industry page displays: industry name; SID or StaffNet identifier; summary (where available); owner, lead or curator (where supplied); related StaffNet industry page; related SID destination; relevant customer challenges and personas; contributing practices; solutions by lens; products and vendors; industry evidence and collateral; portfolio gaps; records awaiting industry validation.

### 13.2 Industry × Lens Matrix

Within an industry: Practice | Advisory | Packaged | Bespoke | Managed. Only solutions mapped to the selected industry appear.

### 13.3 Industry Relevance Types

**Core** (designed directly for the industry) · **Strong** (commonly useful) · **Applicable** (broad solution with recognised relevance) · **Emerging** (potential play requiring validation) · **Illustrative** (demonstration-only).

### 13.4 Industry Relationship Status

Proposed · Practice-confirmed · Industry-confirmed · Jointly confirmed · Needs review · Rejected · Archived.

### 13.5 Industry Mapping Context

A person flagging an industry can add: why the solution touches the industry; relevant customer problem; regulation or constraint; example use case; customer evidence; applicable collateral; suggested industry wording; source note. Mandatory fields: industry, relevance type, short rationale only.

### 13.6 Industry Administration

Industry administrators can: review newly flagged relationships; confirm or reject relevance; improve industry-specific context; add evidence; mark core or applicable; request input from the owning practice; identify catalogue gaps; choose whether a solution surfaces on the associated StaffNet industry site; adjust industry display order; export industry-specific records.

## 14. Flag an Industry Workflow

Any authenticated or simulated authorised user can choose **Flag industry relevance**.

### 14.1 Interaction

Open a solution → select "Flag industry relevance" → search or browse the StaffNet/SID industry taxonomy → select one or more industries → choose relevance (Core / Strong / Applicable / Emerging) → enter a short rationale → optionally add trigger, use case, evidence, link, note → submit. The mapping enters the relevant review queue.

### 14.2 Review Logic

The owning practice confirms the capability; the industry owner confirms the relevance; jointly confirmed when both approve. Rejection preserves the record and reason in audit history. Conflicting responses appear in a resolution queue. The standalone prototype may simulate this locally.

### 14.3 Quick Flag

Cards may include a compact flag icon: select industry, select relevance, add rationale, save as proposed. Quick Flag must never automatically publish a confirmed mapping.

## 15. Solution Detail View

Every solution includes:

**15.1 Identity** — ID, name, short name, approved display name, description, customer problem, customer outcome.
**15.2 Classification** — primary practice, contributing practices, primary lens, supporting lenses, capability category, solution type, status, maturity, provenance, confidence.
**15.3 Industry** — mapped industries, relevance type, relationship status, industry rationale, industry triggers, use cases, collateral, validation history, flag-industry control.
**15.4 Customer Qualification** — triggers, personas, qualification questions, inclusion/exclusion criteria, prerequisites, relevant maturity level.
**15.5 Delivery and Commercial** — scope summary, key activities, outputs, delivery model, commercial model, funding applicability (if approved), indicative duration (if approved), pricing visibility setting, required roles, delivery availability.
**15.6 Technology** — products, vendors, platforms, data requirements, security considerations, governance considerations, integration dependencies.
**15.7 Governance** — owner, curator, approver, contributors, last reviewed, next review, change history, known gaps.
**15.8 Content and Relationships** — collateral, proposal templates, scope templates, case studies, customer evidence, delivery artefacts, related StaffNet pages, related SID records, preceding solutions, next-best solutions, managed destination, alternatives, common pairings.

## 16. Search and Intelligent Navigation

### 16.1 Search Index

Covers: solution names, descriptions, practices, lenses, industries, industry aliases, customer problems, outcomes, products, vendors, customer triggers, use cases, owners, collateral titles, tags.

### 16.2 Filters

Practice · Lens · Industry · Industry relevance · Industry relationship status · Product · Vendor · Customer outcome · Customer problem · Offer status · Maturity · Confidence · Provenance · Commercial model · Delivery model · Owner · Curator · Customer-facing status · Cross-practice · Managed pathway · Collateral availability · Review status.

### 16.3 Results

Each result explains: why it matched, primary practice, primary lens, relevant industries, status, confidence, recommended next action.

### 16.4 Prototype Recommendation Logic

The MVP may use transparent deterministic matching rules. It must not claim to provide AI-generated recommendations if it is only applying configured filters and keywords. This aligns with the brand's transparency requirements for AI use (§36.8). Disclosure text:

> Recommendations in this prototype use configured catalogue relationships and matching rules. Formal opportunity qualification and solution architecture remain required.

## 17. Catalogue Administration Model

Three levels: global catalogue administration, practice catalogue administration, industry mapping administration.

## 18. Global Admin Control Centre

**18.1 Dashboard** — records requiring review; proposed records; proposed industry mappings; stale records; missing owners, curators, industries, managed pathways, collateral; duplicate candidates; broken relationships; archived records; import validation issues.

**18.2 Global Taxonomy Management** — practices, lenses, industries, industry aliases, products, vendors, customer outcomes, personas, statuses, maturity values, commercial models, delivery models, provenance types, relationship types.

**18.3 Global Solution Management** — add, edit, duplicate, merge, archive and restore solutions; reassign primary practice; add contributing practices; change lens assignments; bulk-map industries; manage products, owners, relationships; change publication states; run data-quality validation; import and export; view audit history; reset prototype data.

**18.4 Bulk Operations** — bulk change status, assign practice, assign owner, add industry, request review, archive, export, update review dates. Destructive bulk actions must show a preview before applying.

## 19. Practice Admin Workspace

**19.1 Practice Dashboard** — total practice records in prototype data; records by lens, status, confidence; related industries; unmapped solutions; missing owners, collateral, next motion, managed destination; stale records; cross-practice records awaiting review. Counts are calculated from current data, never represented as enterprise-wide official metrics.

**19.2 Practice Catalogue Table** — columns: solution name, primary lens, supporting lenses, industries, status, confidence, owner, curator, last reviewed, next motion, collateral status, provenance.

**19.3 Practice Actions** — create, edit, clone solutions; propose cross-practice relationships; map industries; review incoming contributor requests; request industry confirmation; publish or unpublish; archive or supersede; export practice catalogue; identify practice gaps; compare with another practice.

**19.4 Practice Gap Board** — gaps grouped under: Advisory, Packaged, Bespoke, Managed, industry coverage, commercial readiness, delivery readiness, collateral readiness, managed conversion, ownership.

## 20. Industry Mapping Admin Workspace

**20.1 Queues** — new proposed mappings; awaiting practice confirmation; awaiting industry confirmation; conflicting mappings; needs evidence; needs review; approved; rejected; archived.

**20.2 Matrix** — industries as rows; practices or solutions as columns; mapping status per cell; relevance intensity; coverage gaps.

**20.3 Management Actions** — confirm; reject; request clarification; change relevance; add industry context; attach evidence; nominate StaffNet visibility; nominate SID linkage; add industry-specific wording; record review notes.

## 21. Roles and Permissions

Simulated permissions modelling these roles:

- **Global Catalogue Administrator** — full control over taxonomies, solutions, practices, industries, imports, exports, publication, audit history.
- **Practice Administrator** — practice-owned solutions, practice metadata, contributed relationships, practice industry mappings, practice review queue.
- **Industry Administrator** — industry metadata, rationale, relevance confirmation, collateral, visibility.
- **Solution Owner** — commercial integrity, scope, status, practice alignment, progression.
- **Solution Curator** — content freshness, metadata, links, collateral, review dates.
- **Contributor** — suggest edits, flag industries, propose relationships, add notes, submit evidence.
- **Read-Only User** — search, filter, view, compare, present, flag a suggested correction or industry relationship.

## 22. Record Provenance and Confidence

**Provenance**: Evidence-backed · Evidence-backed, lens synthesised · Synthesised opportunity · Mock / illustrative.
**Confidence**: Verified · Current · Needs review · Draft · Archived.
**Industry confidence**: Practice-confirmed · Industry-confirmed · Jointly confirmed · Proposed · Disputed · Rejected.

The application must never make proposed content visually indistinguishable from confirmed content.

## 23. Seed Catalogue

Launch with at least: the seven delivery practices plus the Business Advisory and Lifecycle Services layers (§5.1); 4 lenses; 45 solutions; 35 products; 12 vendors; industry taxonomy placeholders compatible with StaffNet/SID; 15 cross-practice relationships; 10 solution progression relationships; 20 customer-trigger phrases; 8 deliberate portfolio gaps; 5 proposed or illustrative records; 5 records requiring review.

### 23.1 Business Advisory (Digital Strategy layer)
**Advisory**: Digital Strategy & Roadmaps · Business Analysis · CIO & IT Leadership Advisory · Business Process Optimisation · Enterprise Architecture · Business Case Development · Technology Advisory · Programme, Project & PMO Management · ICT Operations Advisory · Organisational Change Management · Transformation Strategy & Planning.
**Synthesised Packaged**: Digital Strategy Sprint · Operating Model Review · Business Case Workshop · Change Readiness Assessment · Technology Roadmap Assessment.
**Synthesised Bespoke**: Enterprise Operating Model Design · Transformation Programme Design · Customer-Specific Process Redesign · Strategic Resource Augmentation.
**Synthesised Managed**: Virtual CIO Advisory · Ongoing Architecture Governance · Transformation Office as a Service.
*The underlying capabilities appear in the current catalogue; the four-lens packaging requires validation.*

### 23.2 Security (source name: Cybersecurity)
**Advisory**: Cybersecurity Assessment & Strategy · Privacy Assessment & Guidance · GRC Advisory · Security Architecture Review · Zero Trust Strategy · Resilience & Business Continuity.
**Packaged**: Cyber Maturity Assessment · Essential Eight / ISO / NIST Assessment · Identity & Access Assessment · Vulnerability Assessment · Penetration Testing · Cloud Security Review · Endpoint Security Assessment · AI Governance Assessment.
**Bespoke**: Endpoint Security · Identity & Access · Information Protection & DLP · SIEM & Security Analytics · Cloud Security · Network Security · AI Agent & Application Security.
**Managed**: Managed Detection & Response · Managed EDR · Managed Threat Intelligence · Managed Firewall · Vulnerability Management · Virtual CISO · Managed SOC.
*Current Security material also identifies AI Governance & Posture Management, AI Data Security & DLP, AI Agent & Application Security and AI-Assisted Detection & Response.*

### 23.3 Data & AI (alias: Artificial Intelligence)
**Advisory**: AI Strategy & Roadmap · AI Governance · Responsible AI Review · AI Use-Case Prioritisation · AI Readiness · Data Strategy and Architecture · Information Governance · Data Platform Modernisation Advisory.
**Packaged**: Microsoft AI Innovation · AI Envisioning · AI Readiness Assessment · Copilot Readiness Assessment · Copilot Studio Agent Prototyping · E7 Foundation Workshop · AI Foundry Landing Zone · Copilot Cowork Accelerator · Fabric Health Check.
**Bespoke**: Custom Agents · Copilot Studio Solutions · Foundry Agent Solutions · AI Business Automation · Data Integration · Analytics and BI · Machine Learning · Custom AI Workflows.
**Managed**: AI Agent Managed Service · Agent Lifecycle Management · AI Health Check & Optimisation · AI FinOps (proposed) · Model and Platform Monitoring (proposed) · Managed AI Platform Operations (proposed).
*Microsoft AI Innovation and Copilot Studio Agent Prototyping are described internally as packaged offerings with defined enablement and proposal material.*

### 23.4 Apps & Automation
**Advisory**: Application Modernisation Strategy · CRM & ERP Strategy · ITSM Strategy · Low-Code & Automation Strategy · Integration Architecture Review.
**Packaged**: Application Health Check · Modernisation Assessment · Business Continuity Review · Compliance & Licensing Audit · Content Management Assessment · User Adoption Assessment.
**Bespoke**: Dynamics 365 Implementation · ServiceNow Implementation · CRM & ERP Transformation · Power Apps Solutions · Power Automate Workflows · Custom Integration · Application Refactoring.
**Managed (partially synthesised)**: Dynamics 365 Support · ServiceNow Platform Support · Power Platform Governance and Support · Managed Automation Operations · Application Optimisation.

### 23.5 End User Computing
**Advisory**: Device Strategy · Windows 11 Roadmap · Endpoint Management Strategy · Virtual Desktop Strategy · Device Lifecycle Planning.
**Packaged**: Device Readiness Assessment · Windows 11 Readiness Assessment · Endpoint Security Assessment · Virtual Desktop Readiness Assessment.
**Bespoke**: Windows 11 Deployment · Microsoft Intune Implementation · Windows Autopilot Deployment · Azure Virtual Desktop · Windows 365 · Device Rollout and Migration.
**Managed**: Device as a Service · Managed Print · Managed Service Desk · Managed Endpoint · Device Lifecycle Management · Hardware Recovery.

### 23.6 Collaboration
**Advisory**: Digital Workplace Strategy · Employee Experience Strategy · Collaboration Strategy · Meeting and Voice Strategy.
**Packaged**: Collaboration & Meeting Room Audit · Employee Experience Assessment · Voice & UC Readiness · Meeting Room Readiness.
**Bespoke**: Microsoft Teams Deployment · Cisco Webex Deployment · Teams Rooms · Cisco Video Solutions · Room Booking Solutions · Unified Communications.
**Managed**: Managed Meeting Rooms · Managed Collaboration Platform (proposed) · Managed Voice (proposed) · Meeting Room Monitoring and Support (proposed).

### 23.7 Hybrid Cloud
**Advisory**: Cloud & Data Centre Strategy · Container & Platform Strategy · Data Centre Modernisation · Workload Placement · Cloud Economics · AI Infrastructure & Sovereignty Advisory (proposed).
**Packaged**: Cloud Readiness Assessment · Backup & DR Assessment · Cloud Security & Compliance Review · Container Security Assessment · FinOps Review · IaC Maturity Assessment · Infrastructure Health Assessment · Azure Local Assessment.
**Bespoke**: Azure and AWS Foundations · Hybrid & Private Cloud · Azure Local · Virtualisation · Kubernetes and OpenShift · Infrastructure as Code · AI-Ready Infrastructure · Accelerated Compute.
**Managed**: Managed Azure · Managed Backup & Recovery · Managed Hybrid Infrastructure · Cloud Optimisation · Managed Kubernetes · Infrastructure Operations.

### 23.8 Networking
**Advisory**: Network Strategy & Architecture · SASE Strategy · Unified Communications Strategy · Zero Trust Network Strategy.
**Packaged**: Network Readiness Assessment · SD-WAN & SASE Readiness · Wireless Site Survey · Zero Trust & Security Assessment.
**Bespoke**: Enterprise Switching · Wireless · SD-WAN · Network Access Control · Network Management · SASE / SSE · Internet Connectivity · Voice Services.
**Managed**: Managed Network · Managed SD-WAN · Managed SASE · Managed Connectivity · Network Monitoring and Operations.
*A Network Management packaged service is in development and must not appear as currently saleable.*

**Note on ampersands**: source names retaining "&" (for example "Data & AI", "Apps & Automation", "Identity & Access") are preserved verbatim as source data. New UI copy authored for this product uses "and" per §36.6.

## 24. Cross-Practice Seed Records

**Secure M365 Copilot Adoption** — primary lens Packaged; primary practice Artificial Intelligence; contributors Cybersecurity, Collaboration, Business Advisory; managed destination: adoption and governance support; candidate industries configured through SID taxonomy.

**AI Security Posture & Governance** — primary lens Packaged; practices Cybersecurity, Artificial Intelligence, Collaboration; triggers: shadow AI, agent sprawl, sensitive information exposure, weak auditability; status: requires packaged-scope validation.

**Private / Sovereign AI Foundation** — primary lens Packaged; conversion Bespoke; managed destination Managed Hybrid AI Platform; practices Hybrid Cloud, Artificial Intelligence, Cybersecurity, Networking; status: Proposed. *Internal sources establish active enablement around Cisco/NVIDIA AI infrastructure, secure AI-ready data centres, capacity planning and sovereign AI themes, but do not establish this exact offer as approved.*

**AI-Enabled Managed Services Improvement** — primary lens Managed; delivered through the Lifecycle Services layer with Data & AI and Apps & Automation; status: internal capability concept; customer-facing: No.

## 25. Data Model

### 25.1 Industry Object
```json
{
  "id": "industry-education",
  "sidId": "SID_IDENTIFIER_IF_AVAILABLE",
  "name": "Education",
  "aliases": ["Schools", "Higher Education"],
  "staffnetUrl": "",
  "sidUrl": "",
  "description": "",
  "owner": "Owner to be confirmed",
  "curator": "Curator to be confirmed",
  "status": "active",
  "source": "StaffNet/SID taxonomy"
}
```

### 25.2 Solution-Industry Relationship
```json
{
  "id": "solution-industry-001",
  "solutionId": "solution-secure-copilot-adoption",
  "industryId": "industry-education",
  "relevance": "strong",
  "status": "proposed",
  "rationale": "Education organisations may require secure AI adoption, information protection and user enablement.",
  "customerTriggers": [],
  "useCases": [],
  "evidenceLinks": [],
  "staffnetVisibility": "proposed",
  "practiceApproval": "pending",
  "industryApproval": "pending",
  "submittedBy": "Prototype user",
  "submittedAt": "2026-08-03",
  "lastReviewed": null
}
```

### 25.3 Solution Object
```json
{
  "id": "solution-ai-foundry-landing-zone",
  "name": "AI Foundry Landing Zone",
  "shortDescription": "Establish a governed and repeatable foundation for Azure AI workloads.",
  "customerProblem": "The customer needs a controlled foundation for AI adoption.",
  "customerOutcome": "A secure foundation and pathway from initial use case to production.",
  "primaryPractice": "practice-ai",
  "contributingPractices": ["practice-cybersecurity", "practice-hybrid-cloud"],
  "primaryLens": "lens-packaged",
  "supportingLenses": ["lens-advisory", "lens-bespoke", "lens-managed"],
  "products": ["product-azure-ai-foundry"],
  "industryRelationships": [],
  "status": "saleable",
  "confidence": "current",
  "provenance": "evidence-backed-lens-synthesised",
  "owner": "Owner to be confirmed",
  "curator": "Curator to be confirmed",
  "customerFacing": true,
  "precededBy": [],
  "nextSolutions": []
}
```

### 25.4 Practice Object
```json
{
  "id": "practice-data-ai",
  "sourceName": "Data & AI",
  "displayName": "Data & AI",
  "aliases": ["Artificial Intelligence"],
  "description": "AI and data-related customer strategy, adoption, engineering and operational capabilities.",
  "layer": "digital-innovation",
  "delivery": "d3-with-ba",
  "owner": "Owner to be confirmed",
  "curator": "Curator to be confirmed",
  "status": "active",
  "namingStatus": "confirmed-by-capability-structure",
  "colour": "#9B9BFF",
  "pattern": "rings"
}
```
Practice `colour` values must be drawn from the Data#3 palette (§36.3). `layer` is one of `digital-strategy | digital-innovation | digital-foundation | digital-lifecycle`; `delivery` is one of `ba | d3-with-ba | d3` (§5.1). Business Advisory and Lifecycle Services are stored as practice-shaped records with `layer` set to their band and a `isCapabilityLayer: true` marker so views can distinguish the seven delivery practices from the two layers without special-case code.

## 26. Responsive Experience

**Desktop**: full matrix, sticky headers, side filters, expandable details, admin tables, industry mapping matrix.
**Tablet**: reduced-density matrix, collapsible filters, slide-over details, touch-friendly administration.
**Mobile**: never shrink the complete matrix until unreadable. Use practice-first navigation, lens selector, industry selector, card results, full-screen details, bottom-sheet filters, quick industry flag, compact admin review queues.

The standalone file must work effectively in Edge on iOS. All breakpoints must maintain the accessibility rules in §36.7 (contrast, minimum text sizes, line spacing).

## 27. Presenter Mode

Guided sequence: introduce four lenses → show all practices → filter to one lens → compare Security and Hybrid Cloud → select one industry → show cross-practice solutions for that industry → open one solution → show products, practices and industries → show the pathway to Managed → finish with portfolio gaps and governance.

Presenter Mode must hide: draft notes, internal-only fields, admin controls, unapproved pricing, private evidence, change history.

Presenter Mode text sizes follow §36.7 (large-text guidance 18–30pt equivalents) so shared-screen legibility is guaranteed, and it renders on the brand dark surface (§36.4) for maximum brand recognition in a projected setting.

## 28. Standalone HTML Requirements

One self-contained HTML file with: embedded CSS; embedded JavaScript; embedded JSON seed data; no server requirement; no authentication requirement; no external runtime dependency (this includes fonts — see §36.5 for the system-font stack); direct filesystem operation; localStorage persistence; JSON import/export; reset-to-default control; safe escaping of imported content; responsive layout; Microsoft Edge optimisation.

Simulated authentication and approval roles may be selected through a prototype role switcher. Imported JSON must be validated before replacing local data.

## 29. MVP Scope

**Must Have**: Practice × Lens matrix · Practice View · Lens View · Industry View · Solution detail · Product/vendor relationships · Global search · Combined filters · Industry flagging · Industry relationship review · Global Admin Control Centre · Practice Admin Workspace · Industry Mapping Workspace · Provenance and confidence · Admin role simulation · Presenter Mode · Responsive mobile layout · Local persistence · JSON import/export · Populated seed catalogue · Portfolio gap visibility · **Brand-compliant dark-mode visual system (§36)**.

**Should Have**: Compare solutions · Bulk catalogue actions · Change history · Saved views · Print view (light-surface variant per §36.4) · Guided presenter journey · Data-quality validation · Duplicate warnings · Industry coverage heatmap · Practice gap board · Keyboard shortcuts.

**Could Have**: CSV export · URL-encoded view state · Favourites · Recently viewed · Suggested industry mappings · StaffNet preview card · SID preview card · Opportunity scenario simulator. *(Dark mode is removed from Could-Have: it is now the default experience per §36.4.)*

**Out of MVP**: Live SharePoint integration · Live SID integration · Salesforce integration · Microsoft Graph integration · Production authentication · Real approval notifications · Multi-user editing · Automated AI classification · Production telemetry · Automated publishing to StaffNet · Automated industry-site modification.

## 30. Portfolio Data Quality Rules

Warn when: a solution lacks a primary practice, primary lens, owner, curator, customer outcome or customer-facing status; a solution is marked saleable but has no collateral; a packaged offer has no next motion; a bespoke solution has no managed destination; a managed offer has no entry pathway; an industry mapping has no rationale or is stale; a product is being presented as a solution; a relationship references a missing record; two solutions may be duplicates; a practice name requires confirmation; a proposed solution appears in Presenter Mode without disclosure.

Warnings should not block saving unless a required technical field is absent.

## 31. Acceptance Criteria

**Functional** — Users can navigate by practice, lens, industry, product and customer problem. Users can flag one or more industries against a solution. Industry mappings retain rationale and approval status. Practice administrators manage their own portfolio; global administrators manage the whole catalogue; industry administrators validate industry relationships. Users can distinguish products from solutions. Cross-practice solutions are visible. Next-best motions are navigable. Admin changes persist locally. JSON import/export functions correctly. Reset restores seed data. Presenter Mode hides internal controls. Mobile interaction remains usable.

**Data Integrity** — Unique IDs exist. Relationships reference valid IDs. Industry mappings retain submission and review state. Archived records do not break navigation. Imported text is escaped. Mock records remain marked. Provenance is never removed silently. Source and display practice names are retained. StaffNet/SID identifiers can be added without changing record IDs.

**Visual** — Lens colours remain consistent and are drawn only from the Data#3 palette (§36.3). Practices remain distinguishable by colour, icon and pattern. Industry tags remain readable. Proposed mappings look different from confirmed mappings. Shared-screen text remains legible. No clipped or overlapping content. Empty states are intentional. Review queues are easy to scan.

**Brand (new in v2.1)** — The default experience uses the brand dark surface (§36.4). All colours used anywhere in the UI resolve to §36.3 palette values. Typography follows §36.5. Every rendering of the company name superscripts the hash (§36.6). UI copy passes the §36.6 copywriting checklist. Contrast meets §36.7. No element imitates or alters the Data#3 logo contrary to §36.2. The tagline, when used, appears exactly as "Delivering the Digital Future." (§36.9).

## 32. Required Deliverables from the Build Agent

One self-contained HTML file · feature list · known limitations · simulated elements list · assumptions · embedded data-model description · catalogue administration guide · practice administration guide · industry mapping guide · JSON import/export guide · presenter run sheet · prototype disclosure · future integration summary · seed-data provenance summary · list of portfolio gaps represented in the prototype · **brand-compliance summary mapping the delivered UI to §36 (new in v2.1)**.

## 33. Prototype Disclosure

Display prominently in About and Admin areas:

> **Prototype catalogue disclosure**
> This demonstrator combines content grounded in internal Data#3 catalogue and enablement material with synthesised four-lens classifications and illustrative future-state records. Practice names, solution scope, ownership, industry relevance and customer-facing availability require catalogue-owner validation. Proposed and illustrative records are not approved customer offers.

## 34. Build Instructions

The build agent must: build the functional application, not only wireframes; use the supplied seeded catalogue; include all core administration interfaces; treat industries as many-to-many; use the StaffNet/SID industry taxonomy provided in the broader project context; avoid creating a competing industry structure; preserve source identifiers; make practice names configurable; mark all synthesis and mock data; avoid inventing pricing; avoid inventing owners ("Owner to be confirmed" where required); never present a proposed solution as approved; preserve Admin Mode editability for every seed record; make portfolio gaps visible; make industry flagging available from cards and detail views; keep global, practice and industry administration distinct; optimise screen-sharing and mobile use; use professional Australian English; provide sensible defaults without requesting confirmation; **apply §36 brand requirements to every screen, string and state — brand compliance is not a polish pass, it is a build constraint**.

## 35. Final Product Test

Before considering the build complete, verify the application answers: What can Data#3 offer? Which practice owns it? Which practices contribute? Which lens does it primarily serve? Which industries does it touch? Who confirmed the industry relevance? What customer problem does it solve? Which products support it? Is it saleable, proposed or illustrative? How current is the information? What collateral is available? What should the customer do next? How does it progress towards recurring value? Where are the portfolio gaps? Who must review or improve the record?

If the application cannot answer all fifteen, the catalogue-management model is incomplete.

---

## 36. Brand and Visual Identity Requirements (new in v2.1 — normative)

Source: *Data#3 Brand Guidelines, August 2024*. Where this section conflicts with earlier sections, this section prevails. Contact for brand queries: brand@data3.com.au.

### 36.1 Brand foundation the product must express

- Purpose: enable our customers' success. Vision: harness the power of people and technology for a better future.
- Brand principles to reflect in design and copy: **Human first** (approachable, clear, simple language), **Grounded in experience**, **Reliable**, **Ever-evolving / forward thinking**, **Experts in our field**, **Educative**, **Trustworthy**, **Pioneering**.
- The product is an internal-facing tool, so the Website tone profile applies: professional, corporate, educational, consultative, clear, jargon-free.

### 36.2 Logo

- Use only supplied Data#3 logo files (standard, blue boxed, or lockup). The **blue boxed logo is the preferred variation in design work** and may only be used flush against an artwork edge — in this application, anchored to the edge of the top bar is acceptable.
- Never recreate, crop, recolour, distort, rotate, add effects to, or re-typeset the logo. Logo colours are limited to Data#3 blue, white or black.
- Maintain clear space equal to the 'D' dimension around the logo.
- If no approved logo file is supplied to the build, render the product title as plain text ("Data#3 Practice Solution Prism" with a superscripted hash) and do **not** fabricate a logo. The hash-only mark (`#` in Helvetica Neue 85, as used by the data3.com favicon) may be used as the favicon, noting it is an unofficial logomark; flag it for Marcomms review in the known-limitations deliverable.

### 36.3 Colour palette (exclusive)

Every colour in the UI must resolve to one of these values (plus white `#FFFFFF` and black `#000000` for logo/text variants). No other hues.

**Primary palette** (the foundation of the design):
| Name | HEX | RGB |
|---|---|---|
| Data#3 Blue Black | `#000025` | 0-0-36 |
| Data#3 Blue | `#007BC3` | 0-123-195 |
| Data#3 Light Blue | `#00AEFF` | 0-174-255 |
| Data#3 Pale Blue | `#78DCFF` | 120-220-255 |
| Light Grey | `#9D9FA2` | 157-159-162 |
| Grey White | `#EEEEEE` | 238-238-238 |

**Secondary palette** (sparing accents — e.g. CTAs; primary colours must dominate):
| Name | HEX |
|---|---|
| Aqua | `#00FFFF` |
| Blue1 | `#0000FF` |
| Cool Purple | `#7300FF` |
| Cool Lilac | `#9B9BFF` |
| Magenta | `#FF00FF` |
| Dark Blue | `#000087` |

**Data visualisation palette** (only where data is visually represented — the Practice × Lens matrix, heatmaps, gap boards and status chips qualify):
| Name | HEX |
|---|---|
| Dark Green | `#004F33` |
| Green1 | `#00FF00` |
| Dark Magenta | `#B30089` |
| Dark Teal | `#245B79` |
| Light Pink | `#FFB7FF` |
| Green1 Yellow | `#DAFF00` |

Lens colour assignments are fixed in §10.1 and use only these palettes. Practice colours and patterns (§25.4) likewise. Derived tints for surfaces (hover states, hairlines) should be alpha variants of palette colours over the §36.4 background rather than new hues.

### 36.4 Dark mode is the default

Data#3 employs a dark-mode approach across branded assets; it aids accessibility and differentiates the brand. Accordingly:

- Default background: **Data#3 Blue Black `#000025`**. Headings and key copy: **white** or **Data#3 Light Blue `#00AEFF`**.
- Cards and elevated surfaces: subtle lightened variants of Blue Black (e.g. palette colours at low alpha over `#000025`).
- The optional **print view / export** (Should-Have) is the sanctioned light-surface exception, using Grey White `#EEEEEE` / white surfaces with Blue Black text and the light-surface lens variants from §10.1.
- Bright accents (Aqua, Magenta, Green1) are what make the dark surface work — use them for lens identity, status and CTAs, never for body text on light surfaces without the §10.1 text-safe variants.

### 36.5 Typography

- Corporate typefaces: **Helvetica Neue** (weights 45–95) with **Arial** as the fallback. As the file must be dependency-free (§28), use the system stack: `"Helvetica Neue", Helvetica, Arial, sans-serif` and never embed or fetch external fonts.
- The Data#3 wordmark context uses Helvetica Neue 85 (Heavy); emulate weight hierarchy with font-weight, never with a different typeface.
- Content hierarchy: one H1 per view, then H2/H3/H4 in order — no skipped levels (also required for accessibility, §36.7).
- Body text minimum 16px equivalent on screen; large text (headers, callouts) scaled between 18–30pt equivalents in Presenter Mode; line height at least 1.5; **never justify text**.

### 36.6 Tone of voice and copywriting rules (apply to every UI string, empty state, tooltip and seed record authored for this product)

- **Superscript the hash**: wherever "Data#3" appears in rendered copy, the `#` is superscripted (`Data<sup>#</sup>3`). Build this into a shared render helper so it cannot be missed.
- **Data#3 is singular**: "Data#3 is", never "Data#3 are". Use "we/our" only when referring to teams of people.
- **Active voice** and **confident language**: "Data#3 will help you…" not "could help you". This suits §16.3 result explanations.
- **Capitalisation**: capitalise vendor and product names (Microsoft 365 Copilot); capitalise solution/service names when directly referenced ("our Security services") but sentence case in general use; "team" lowercase, the named service capitalised ("the Managed Services team"). No unnecessary capitals elsewhere.
- **Ampersands**: write "and" wherever possible; "&" only in product/vendor names or where space is genuinely short. Source catalogue names containing "&" are preserved as data (§23 note); new UI copy uses "and".
- **Numbers and dates**: spell one–nine, numerals from 10; comma from 1,000; "1 million / 2.3 billion"; ordinals first–ninth then 10th; Australian date order, spelled out in text: "Monday 30 June 2026", no commas.
- **Punctuation**: double quotation marks; colons sparingly; no sentence-initial conjunctions; exclamation marks essentially never in this product's UI.
- Plain language, short sentences, short paragraphs, bulleted lists — write simpler (this is also the accessibility position, §36.7).
- Australian English spelling throughout (already a product requirement; reaffirmed).
- Job titles capitalised. Reference the company as "Data#3" (only "Data#3 Limited" in formal/tender contexts; "The Data#3 Group" when including Business Aspect and Discover Tech — unlikely in this product).
- The About panel may use the approved 21-word boilerplate: *"Data#3 Limited is an ASX-listed company that delivers transformative solutions and services to help solve complex business challenges and enable success."*

### 36.7 Accessibility

- Sufficient contrast between text and background everywhere (the §36.4 dark scheme with white/Light Blue text is the sanctioned baseline; verify lens/status chips meet contrast on `#000025`).
- Minimum body text 16px equivalent; larger text 18–30pt equivalents for headers and callouts; line spacing ≥ 1.5; no justified alignment.
- Logical heading hierarchy (H1 → H2 → H3/H4) per view.
- Colour is never the sole differentiator: lenses carry A/P/B/M letter chips, practices carry icon + pattern, statuses carry text labels.
- Plain-language microcopy per §36.6.
- Keyboard navigability and visible focus states (carried over from Should-Have shortcuts; focus states styled with palette colours).

### 36.8 Using AI (transparency)

The brand requires that AI-generated output never be represented, directly or by omission, as human output — and the reverse discipline applies here: the product must not represent deterministic logic as AI (§16.4). The prototype's synthesised records must remain marked (§22, §33). No real customer names, prices or personal information may appear in seed data.

### 36.9 Tagline and imagery

- Corporate tagline: **"Delivering the Digital Future."** — may appear once, in the footer or About panel, verbatim, never restyled or reworded.
- Imagery, if any is added later, must follow brand imagery rules: cooler tones aligned to the palette, authentic or futuristic (not clichéd or staged), sufficient contrast under any overlaid text. The MVP requires no imagery; do not add decorative stock art.
- Icons follow the brand icon style: **line style, duotone, light blue `#00AEFF` and aqua `#00FFFF`**. Use inline SVG line icons in that duotone for lenses, practices, statuses and navigation; do not use emoji glyphs in this product's UI (a deliberate divergence from SID, which predates this requirement in its own context).

### 36.10 Brand acceptance checklist (build agent self-test)

1. Is every rendered colour a §36.3 palette value (or alpha variant over the dark surface)?
2. Does the default experience render on `#000025` with white/`#00AEFF` headings?
3. Is every "Data#3" superscripted, singular, and correctly capitalised?
4. Do all four lens colours match §10.1 exactly, everywhere they appear?
5. Are icons line-style duotone (light blue + aqua) SVGs, with no emoji?
6. Is the type stack Helvetica Neue/Arial with correct hierarchy, ≥16px body, ≥1.5 line height, no justified text?
7. Is the logo either an approved file used per §36.2 or absent (text-only title), with the favicon choice flagged?
8. Does any copy use "&" outside product/vendor/source names? (It must not.)
9. Does Presenter Mode meet large-text guidance on the dark surface?
10. Is the tagline, if present, verbatim "Delivering the Digital Future."?
