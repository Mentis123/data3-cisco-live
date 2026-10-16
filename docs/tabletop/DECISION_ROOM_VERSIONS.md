# Decision Room version hub

`/decision-room` is the edition selector. `/decision-room/ciso-basecamp` opens
V1 (the original customer-tested Riverbend exercise), and
`/decision-room/agent-0` opens V2 (the Ironvale Mining preview). Both have join, facilitate
and console recovery controls. `/decision-room/join` is the edition-neutral
room-code entry; existing `/join/:code`, session, admin, console and report
links keep working. The short join link still points to the hub.

## Scenario revisions and migration policy

A room is pinned to one scenario revision when it is created
(`workshop_sessions.scenario`). The organisation, launch, rounds, briefings,
consequences, state model, facilitator guidance, run plan, report and CSV are
all resolved from that revision (`server/decisionRoomScenarios.ts`), never from
the URL, browser storage or a global constant.

| Revision | Edition | Status | Content |
| --- | --- | --- | --- |
| `riverbend@1` | V1 CISO Basecamp, and every room created before pinning | live | `server/decisionRoomContent.ts` |
| `ironvale@0.1` | V2 Agent 0, the mine keeps moving | preview, pending Rich/Scott review | `server/decisionRoomIronvale.ts` |

- **Existing rooms:** the column is added with `ADD COLUMN IF NOT EXISTS` and
  left NULL. NULL resolves to `riverbend@1`, so every earlier room, including
  the Agent 0 placeholder rooms that ran Riverbend, keeps its exact choices,
  consequences, meters and report. No data is rewritten.
- **Unknown keys** (for example a room made by a newer build, viewed on an
  older one) are refused with a 409, never reinterpreted.
- **New V1 rooms** (`variant=riverbend`) are pinned to `riverbend@1`.
- **New Agent 0 rooms** (`variant=agent0`) are pinned to `ironvale@0.1` on
  preview and local builds. On production (`VERCEL_ENV=production`) they stay
  on `riverbend@1` until `DECISION_ROOM_AGENT0_SCENARIO` names the approved
  Ironvale revision. Merging the code does not by itself release the mining
  content to customer rooms.
- **Changing content:** never edit a published revision in a way that changes
  what a choice meant. Copy it to a new key (for example `ironvale@1`), register
  it in `scenarios.ts`, and point new rooms at it.

V1 keeps Richard's single best move in the facilitator report. V2 shows his
conditional guidance (preference, conditions, alternative, the evidence that
would change it) to the facilitator only and never scores tables against it.
V2 replaces numeric meters with named exercise states, labelled as a model.

## Paired update pattern

Live project: `Mentis123/d3smbmxdr` (Next.js).
Fallback: `Mentis123/data3-cisco-live` (Vite/wouter + Express).

| Concern | Live | Fallback |
| --- | --- | --- |
| Hub + scoped CSS | `app/decision-room/VersionHub.tsx`, `version-hub.css` | `client/src/pages/decision-room/VersionHub.tsx`, `version-hub.css` |
| Views | `app/decision-room/DecisionRoom.tsx` | `client/src/pages/decision-room/DecisionRoom.tsx` |
| API | `lib/decision-room/api.ts` + Next request adapter | `server/decisionRoom.ts` |
| Scenarios (mirrored) | `lib/decision-room/types.ts`, `scenarios.ts`, `content.ts`, `ironvale.ts` | `server/decisionRoomTypes.ts`, `decisionRoomScenarios.ts`, `decisionRoomContent.ts`, `decisionRoomIronvale.ts` |
| Artwork | `public/decision-room-art/` | `client/public/decision-room-art/` |

The hub and its CSS are identical in both repos. Preserve routing adapters and
the shared `HomeFooter` credit on the hub and both edition home pages. Its
wording and Tech Wizard link match the Cisco Live home page. Public edition
copy leads with the story and decisions; product detail belongs naturally in
the scenario evidence and optional context, with deeper facilitator notes.
Preserve
the Next.js base CSS reset; do not replace one whole implementation with the
other. Add explicit routes in `client/src/App.tsx` for the fallback. Update the
live site's `public/index-page.html` when adding or renaming routes.

## Artwork

Generated with the built-in ImageGen tool; compressed to WebP for the site.
Prompts are recorded in `artwork-prompts.md` alongside this note.
Ambient animation is illustrative, not live customer or system telemetry.
Reduced-motion preferences disable ambient motion and hover transforms.
