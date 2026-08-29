# Navigator Alignment Notes — SID and Sol

Navigator was adapted after reviewing `/sid` (`staffnet-intelligent-directory.html`), `/solcat` (`staffnet-solution-prism.html`), `server.js`, and the repository conventions.

## Patterns retained from SID

Task-first entry rather than repository-first navigation; visible employee role; guided-tour language explaining what changed and why; recognised destination, content owner and freshness; Read / Listen / Ask / Connect consumption and handoff modes; human escalation when content is insufficient; explicit deterministic-demo boundaries; and the Data#3 dark-navy high-contrast visual system.

## Patterns retained from Sol

One governed catalogue rather than a second taxonomy; practice, commercial lens, industry, product and solution relationships; visible status, confidence and provenance; recommendation explanations; differentiation of proposed ideas from approved saleable offers; positioning suggestions as hypotheses requiring validation; deterministic matching; refusal to invent an answer; source owner and review date at point of use; and static HTML/JavaScript consistent with existing demonstrators.

## Navigator's distinct responsibility

SID answers **where the trusted information and people live**. Sol answers **what the governed offer is and how it relates to the portfolio**. Navigator answers **what this employee should do next in this situation**.

Navigator therefore does not duplicate catalogue administration or directory governance. It composes those concepts into a guided mission journey.

## Route and security

Page: `nav/index.html`. Entry URL: `/nav`. The route is deliberately absent from `OPEN_PATHS`, so requests pass through the existing password middleware before Express serves the static directory page. No new credential, cookie, bypass or public asset path is introduced.

## Mobile implementation

The phone experience uses a compact application header; single-column launcher, questions, results and artifacts; horizontally scrollable context chips; touch-sized controls; non-sticky content actions; responsive source metadata; a collapsible bottom guide with persistent Next action; and reduced-motion support.

## Prototype boundaries

The experience is front-end-only and intentionally deterministic. Entra profile data, live Sid registry, live Sol catalogue APIs, CRM account/opportunity context, production recommendation signals and source-grounded generative AI are represented rather than integrated.

## Validation completed

JavaScript syntax; desktop golden path; mobile golden path at 390 × 844; context selection/removal; recommendation reasons and trust badges; Executive/Commercial/Technical switching; artifact creation/completion; mobile guide expand/collapse; and no horizontal overflow in tested states.
