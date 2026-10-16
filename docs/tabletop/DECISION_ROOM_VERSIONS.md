# Decision Room version hub

`/decision-room` is the edition selector. `/decision-room/ciso-basecamp` opens
V1 (the original customer-tested Riverbend exercise), and
`/decision-room/agent-0` opens V2 (in development). Both have join, facilitate
and console recovery controls. `/decision-room/join` is the edition-neutral
room-code entry; existing `/join/:code`, session, admin, console and report
links keep working. The short join link still points to the hub.

Agent 0 deliberately uses the original six rounds for this first release.
Its landing page discloses this. The Microsoft-focused story, clearer inject
briefings and customer feedback are the next phase, not implemented here.

New CISO Basecamp rooms retain `variant=riverbend`; Agent 0 rooms persist
`variant=agent0` and `name=Agent 0` using the existing database columns. Existing
rooms and their results are untouched. Future scenario selection must use the
stored variant, not the URL or browser storage. No migration is required.

## Paired update pattern

Live project: `Mentis123/d3smbmxdr` (Next.js).
Fallback: `Mentis123/data3-cisco-live` (Vite/wouter + Express).

| Concern | Live | Fallback |
| --- | --- | --- |
| Hub + scoped CSS | `app/decision-room/VersionHub.tsx`, `version-hub.css` | `client/src/pages/decision-room/VersionHub.tsx`, `version-hub.css` |
| Views | `app/decision-room/DecisionRoom.tsx` | `client/src/pages/decision-room/DecisionRoom.tsx` |
| API | `lib/decision-room/api.ts` + Next request adapter | `server/decisionRoom.ts` |
| Artwork | `public/decision-room-art/` | `client/public/decision-room-art/` |

The hub and its CSS are identical in both repos. Preserve routing adapters and
the Next.js base CSS reset; do not replace one whole implementation with the
other. Add explicit routes in `client/src/App.tsx` for the fallback. Update the
live site's `public/index-page.html` when adding or renaming routes.

## Artwork

Generated with the built-in ImageGen tool; compressed to WebP for the site.
Prompts are recorded in `artwork-prompts.md` alongside this note.
Ambient animation is illustrative, not live customer or system telemetry.
Reduced-motion preferences disable ambient motion and hover transforms.
