# /solcat — Practice Solution Prism: Implementation Plan

**Status**: Build-ready plan (no code yet). PRD: `solcat-prd.md` v2.1 in this repo (v2.0 + Data#3 Brand Guidelines Aug 2024 integrated as normative §36), owner Adam Rappaport.
**Deployment target**: `staffnet-solution-prism.html` served at `/solcat` on d3-agent-governance.azurewebsites.net — hidden (linked from nowhere), **ungated** (added to `OPEN_PATHS` in server.js alongside `/sid` and `/100club`), fully self-contained per PRD §28.
**Relationship to siblings**: `/sid` = browser experience story, `/100club` = under-the-hood story, `/solcat` = portfolio & governance story. Shared DNA (Segoe UI, navy top bar, card language, drawer pattern, spotlight tour mechanics) but its own identity — this is a workbench, not a shopfront.

---

## 1. Opinionated calls (where the PRD leaves room)

1. **One file, no framework.** Plain JS + template literals, same discipline as SID. The 100club file proved a rich single-file app works; SolCat is data-heavier but chart-free, so ~400–600KB total including seed JSON. No base64 media.
2. **Hash routing from day one.** `#/matrix`, `#/practice/practice-ai`, `#/lens/packaged`, `#/industry/industry-education`, `#/solution/<id>`, `#/admin`, `#/admin/practice/<id>`, `#/admin/industry`, `#/present`. This gives back/forward, shareable deep links, and delivers the "URL-encoded view state" could-have for free. Filters serialise to query-ish hash params.
3. **Full-DB persistence, not sparse overrides.** Unlike SID's registry-of-overrides, SolCat is an editor: state = one `db` object `{version, taxonomies, solutions, industryRelationships, audit, prefs}`. localStorage key `solcat.db.v1`. Seed lives as a frozen constant; "Reset" restores it; a `seedVersion` stamp lets a newer deploy offer merge-or-reset instead of silently clobbering local edits.
4. **Seed the ENTIRE §23 list with tiered richness.** The PRD says ≥45 solutions but §23 enumerates ~150. Author all ~150 as records with the required minimum (id, name, practice, lens, status, confidence, provenance) — cheap and makes the matrix feel real — and give a **hero subset of ~28** full detail (problem, outcome, triggers, products, relationships, industries, collateral stubs). All 4 cross-practice records from §24 are heroes. This satisfies every count in §23 without authoring 150 essays.
5. **Practice names are data.** `sourceName` vs `displayName` with `namingStatus:'requires-confirmation'` rendered as a small amber dot on the practice header — the governance story on display. No practice name hard-coded in any layout string.
6. **Roles gate affordances, not routes.** A role switcher (Read-only · Contributor · Solution Owner · Practice Admin ▸ pick practice · Industry Admin ▸ pick industry · Global Admin) lives in the top bar like SID's "Viewing as". Buttons render disabled-with-explanation rather than vanish — same "visible but gated" philosophy as SID's Coming-soon tiles, and it demos the permission model without real auth.
7. **The data-quality engine is one pure function.** `validate(db) → Warning[]` with rule ids matching PRD §30. Every dashboard (global, practice gap board, industry queues) is a filtered view over that one array. This is the single highest-leverage component — build it early, everything reports from it.
8. **Deterministic matching, honestly labelled.** Search scoring like SID's `agentMatch` (keyword bags + boosts). The §16.4 disclosure string appears verbatim under any "recommended next action". Never the word "AI" in the results UI.

## 2. Visual system — governed by PRD v2.1 §36 (Data#3 Brand Guidelines, Aug 2024)

**The PRD is now `solcat-prd.md` (v2.1) in this repo — §36 is normative and overrides anything below on conflict.**

- **Dark mode is the DEFAULT** (brand doctrine): background Data#3 Blue Black `#000025`, headings/copy white or Data#3 Light Blue `#00AEFF`. Cards = low-alpha palette tints over the dark surface. The Should-Have print view is the only light-surface variant. This deliberately diverges from SID's light theme — SolCat follows the corporate brand, not the SID prototype.
- **Lens colours (PRD §10.1, brand-palette only)**: Advisory `#00AEFF` (light-blue) / text-safe `#007BC3` · Packaged Aqua `#00FFFF` / `#245B79` · Bespoke Cool Lilac `#9B9BFF` / Cool Purple `#7300FF` · Managed Magenta `#FF00FF` / Dark Magenta `#B30089`. Each lens also carries an A/P/B/M letter chip — colour never the sole differentiator. (v2.0's green/orange were off-palette and are gone.)
- **All colours** must resolve to the §36.3 palette (primary / secondary / data-viz — the matrix legitimately qualifies as data visualisation). No invented hues.
- **Typography**: `"Helvetica Neue", Helvetica, Arial, sans-serif` system stack (no font embedding/fetching), weight-based hierarchy, body ≥16px, line-height ≥1.5, never justified, strict H1→H4 order per view.
- **Icons**: inline SVG, line style, duotone light blue `#00AEFF` + aqua `#00FFFF`. **No emoji** in SolCat (unlike SID).
- **Copy rules baked into a render helper**: `Data<sup>#</sup>3` superscript everywhere, singular verbs, active/confident voice, "and" not "&" in authored copy (source names keep "&" as data), AU numbers/dates, double quotes. See §36.6 checklist.
- **Logo**: only approved files, blue-boxed variant flush to the top-bar edge if supplied; otherwise text-only title and `#` favicon flagged for Marcomms review. Never fabricate a logo.
- **Provenance/confidence must be un-missable** (PRD §22): confirmed = solid card; proposed/illustrative = dashed border + hatched ribbon; needs-review = clock chip (palette colours only). One legend reused on matrix, industry view, presenter mode.
- **Practices**: colours drawn from remaining palette values + pattern token (rings/grid/diag/dots…) as tiny duotone SVG glyphs.
- **Tagline**: "Delivering the Digital Future." verbatim, once, footer/About only.
- Presenter Mode: large-type on the dark surface (18–30pt equivalents) — projected-room legible by construction.

## 3. Data model (as built)

Entities in `db.taxonomies`: practices(7 delivery practices — Data & AI, Security, Apps & Automation, End User Computing, Collaboration, Networking, Hybrid Cloud — plus 2 capability-layer records: Business Advisory `digital-strategy` and Lifecycle Services `digital-lifecycle`, marked `isCapabilityLayer:true`; each record carries `layer` and `delivery` (ba / d3-with-ba / d3) per PRD §5.1), lenses(4), industries (SID taxonomy: Education, Government, Health & Aged Care, Energy, Mining, Financial Services, Not-for-Profit — ids `industry-*`, `sidId` left blank-able per §25.1, **no new industries invented**), products(35), vendors(12), outcomes, personas, statuses, maturity, commercialModels, deliveryModels, provenanceTypes, relevanceTypes, relationshipStatuses. All editable in Global Admin → Taxonomies.

`db.solutions[]` per PRD §25.3 plus: `capabilityCategory, triggers[], qualification{questions,inclusion,exclusion,prereqs}, delivery{scope,activities,outputs,model,commercial,duration,pricingVisibility,roles}, tech{products,vendors,platforms,dataReqs,security,governance,integration}, governance{owner,curator,approver,contributors,lastReviewed,nextReview,gaps[]}, content{collateral[],caseStudies[],staffnetLinks[],sidLinks[]}, relationships{precededBy[],nextSolutions[],managedDestination,alternatives[],pairings[]}`. Owners default `"Owner to be confirmed"` (§34 — never invent owners).

`db.industryRelationships[]` per §25.2 — first-class array (not embedded) so the mapping workspace, queues and audit all operate on one collection. Status machine: proposed → practice-confirmed / industry-confirmed → jointly-confirmed; needs-review / rejected / archived; rejection keeps record + reason (§14.2).

`db.audit[]`: append-only `{at, actor(role), action, targetId, detail}` — powers change history cheaply.

## 4. Views (13 required, PRD §8) and how each earns its keep

1. **Portfolio Overview** (`#/`) — hero strip with the four-lens conversion journey (animated arrows, lens colours), six entry cards (§9), prototype-totals band computed live from db and labelled "prototype catalogue totals", "needs attention" rail fed by `validate()`.
2. **Practice × Lens Matrix** (`#/matrix`) — the centrepiece. CSS grid, sticky practice column + lens header row, solution chips in cells. Rows grouped into capability-layer bands per PRD §10.1 (Digital Strategy → Innovation → Foundation → Lifecycle) so the matrix mirrors the Service & Solutions Capability slide. Density toggle Executive/Standard/Detailed (§10.4) = three chip templates, persisted in prefs. Cell-level gap markers (deliberate seed gaps render as dashed "no packaged entry offer" slots — gaps are *content*, not absence). Filters: industry, product, status, provenance, cross-practice. Clicking a chip opens the solution drawer over the matrix (SID drawer pattern).
3. **Practice View** — identity + naming status, four-lens portfolio strips, industry coverage section (§11.1: confirmed/suggested/disputed/unmapped counts with drill-in), gap board teaser, management actions (role-gated).
4. **Lens View** — one lens across 8 practices; compare mode (pick 2 practices side-by-side) and gap mode (practices with empty cells for this lens float to top).
5. **Industry View** — first-class (§13): overview header (owner "to be confirmed", StaffNet/SID link stubs), industry × lens mini-matrix showing only mapped solutions, relevance-type badges (Core/Strong/Applicable/Emerging/Illustrative), validation queue count, RLAC-style consistency with SID is *not* required here — this page's verbs are Review/Flag/Export.
6. **Solution Detail** — full-screen route AND drawer (same renderer, two containers). Sectioned per §15 with collapsed accordions on mobile. "Flag industry relevance" button always visible (§34).
7. **Product & Vendor View** — product list → solutions supported; explicit "products support solutions" framing; a product page shows which practices/lenses/industries consume it.
8. **Relationship / Journey View** — for a solution: preceded-by → this → next-best → managed destination as a horizontal lens-coloured pipeline; also a global list of the 10 progression chains from seed.
9. **Portfolio Health** — the `validate()` output grouped by rule, with counts, each row deep-linking to the offending record.
10. **Global Admin Control Centre** — dashboard tiles (§18.1) over validate() + queues; taxonomy CRUD; solution table with bulk ops (§18.4 — selection model + preview-before-apply modal for destructive ops); JSON import (validated: schema check, id uniqueness, reference integrity, string escaping) / export / reset.
11. **Practice Admin Workspace** — per-practice dashboard (§19.1, counts labelled prototype-only), catalogue table (§19.2 columns), gap board grouped per §19.4.
12. **Industry Mapping Workspace** — queue tabs (§20.1), industries × practices status matrix (§20.2), row actions (§20.3).
13. **Presenter Mode** (`#/present`) — run-sheet driven (§27's 10 steps), reusing SID's spotlight/tour mechanics (dots, back/next, element highlight + auto-navigation). Hides admin controls, draft notes, internal fields, pricing, history; proposed records visibly watermarked when they appear (§30 last rule). Big-type mode for screen share.

**Mobile** (§26): below 720px the matrix route redirects to practice-first accordion navigation (practice list → lens tabs → cards); drawer becomes full-screen; filters become a bottom sheet; admin reduced to review queues. Test target: Edge on iOS (Safari WebKit constraints: no `showOpenFilePicker` — use `<input type=file>` for import; localStorage fine).

## 5. Workflows to implement exactly

- **Flag an Industry** (§14): from card (quick-flag icon → compact popover: industry, relevance, rationale → saved as *proposed*, never confirmed) and from detail (full form with optional trigger/use-case/evidence/link/note). Both write an industryRelationship + audit entry + land in queues.
- **Review**: practice admin confirms capability; industry admin confirms relevance; both → jointly confirmed. Conflict (one confirms, one rejects) → resolution queue. All simulated locally via the role switcher.
- **Import/export**: export = pretty JSON of db; import = parse → validate → diff summary ("42 solutions, 3 new, 1 invalid — invalid rows listed") → confirm → replace. Escape all imported strings at render time via one `esc()` used *everywhere* (§28, §31).

## 6. Build phases for the delivery agent

Each phase ends runnable; commit per phase; sync nothing to Downloads (repo-only artefact).

- **P0 — Scaffold & route** (~small): file skeleton (chrome, hash router, role switcher, empty views), `app.get('/solcat')` + OPEN_PATHS entry in server.js, disclosure modal (§33 verbatim), About panel.
- **P1 — Data layer** (~large, do second): taxonomies, full §23/§24 seed (~150 records, 28 heroes, 8 deliberate gaps, 5 proposed/illustrative, 5 needs-review, 15 cross-practice + 10 progression relationships, 20 trigger phrases), `validate()` with all §30 rules, localStorage/persist/reset, import/export. **This phase is the bulk of the effort — it's data authorship, not code.**
- **P2 — Matrix + Solution drawer + search/filters**: the demo becomes shareable here.
- **P3 — Practice / Lens / Industry / Product / Journey views.**
- **P4 — Flagging workflow + queues + role gating end-to-end.**
- **P5 — Admin centres + bulk ops + Portfolio Health.**
- **P6 — Presenter Mode, mobile pass, §31 acceptance sweep, §35 fifteen-question self-test, deliverables list (§32) as an ABOUT section inside the file.**

Suggested delivery: P0–P2 in one sitting (that's the "wow" milestone), P3–P6 iteratively.

## 7. Server wiring (do in P0)

```js
// server.js — alongside /sid and /100club
app.get('/solcat', (req, res) => {
    res.sendFile(path.join(__dirname, 'staffnet-solution-prism.html'));
});
// OPEN_PATHS additions: '/solcat', '/staffnet-solution-prism.html'
```
No other assets needed (self-contained; reuse sid-bilby.png ONLY if we decide Sid cameos — default: no Sid on /solcat, it's a different product story).

## 8. Decisions for Adam before/during delivery

1. **Sid cameo?** Keep /solcat Sid-free (my default — different audience, avoids brand confusion) or a small "Sid will index this catalogue" footnote tying the ecosystem together?
2. ~~AI practice display name~~ **Resolved (PRD v2.2)**: seven delivery practices locked per the capability structure — display names Data & AI, Security, Apps & Automation, EUC, Collaboration, Networking, Hybrid Cloud; Business Advisory and Lifecycle Services are capability layers, not peer practices.
3. **Hero-subset picks**: I've assumed the 4 §24 cross-practice records + ~3 per practice (weighted to AI, Security, Hybrid Cloud). Veto/add specific offers you want demo-deep (e.g. Copilot Readiness, MDR, AI Foundry Landing Zone are locks).
4. **Industry set**: locked to SID's seven. Confirm no additions (PRD forbids a competing taxonomy; Education stays an industry).
5. **Name on screen**: "Practice Solution Prism" as the visible product title, "SolCat" only in the URL — or surface "SolCat" as the friendly name?

## 9. Risks / limitations to disclose in-app

- localStorage caps (~5MB) are fine for this data but imports are size-checked (reject >4MB with message).
- Single-browser persistence; no multi-user (PRD out-of-scope, but say it in About).
- Seed synthesis: four-lens classifications are a working model — §33 disclosure shown in About AND Admin, plus per-record provenance chips.
- The ~150-record seed is the schedule risk, not the code. If time-boxed, ship all records thin + heroes rich (as planned) — never fewer records rendered richer, because the matrix's credibility comes from fullness.
