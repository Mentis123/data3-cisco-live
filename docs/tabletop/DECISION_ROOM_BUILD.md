# Decision Room — build notes

Implementation of the Decision Room PRD v1.1 (`revised/Decision Room - Product Requirements Document - v1.1.docx`) inside this repository. It is a room instrument for the "When the agent acts" tabletop: it reports what the room is doing and never ranks, scores or declares a winner.

## Routes

| Route | Who | Purpose |
| --- | --- | --- |
| `/workshop` | Table scribe | Enter the session code |
| `/workshop/:joinCode` | Table scribe | Choose a table, draft, lock |
| `/workshop/console/:consoleKey` | Projector | Room state and published results |
| `/workshop/admin` | Adam | Create a session, or find one by join code |
| `/workshop/admin/:sessionId` | Adam | Round controls, tables, export |

## API

| Method and path | Auth | Behaviour |
| --- | --- | --- |
| `POST /api/workshops` | Facilitator | Create a session; returns join code and console key |
| `GET /api/workshops/lookup/:joinCode` | Facilitator | Recover a session after a lost tab |
| `POST /api/workshops/:joinCode/join` | None | Claim a table, receive a table token |
| `GET /api/workshops/:joinCode/state` | Table token (optional) | Open round plus this table's own response |
| `PUT /api/workshops/:joinCode/decision` | Table token | Draft, or lock atomically |
| `GET /api/workshops/console/:consoleKey` | Console key | Aggregate room state; published results only |
| `GET /api/workshops/:id/admin` | Facilitator | Full moderator view including private rationales |
| `POST /api/workshops/:id/actions` | Facilitator | `open, close, publish, hide, advance, reopen, select, end, reset` |
| `GET /api/workshops/:id/export` | Facilitator | JSON export |

## Environment

`WORKSHOP_FACILITATOR_SECRET` — required, at least 16 characters, **no default in code**. Without it every facilitator route returns 503 and the admin interface is unusable; it never falls back to `ADMIN_KEY`. Set it in Vercel, not in the repository.

`WORKSHOP_TOKEN_SECRET` — optional. Signs table tokens; falls back to the facilitator secret.

## State transitions

Session: `live → ended`, with `reset` returning a live session to round one and clearing every response.

Round: `pending → open → closed → published`, with `hide` returning `published → closed`. Participants can only reach the active round, and only once it is open; a pending round returns no task copy at all.

Table (derived, not stored): `waiting → joined → drafting → locked`. Drafting is inferred from a saved draft, so tables never set a state by hand.

Guards worth knowing live: publish requires a closed round; reopening a table or a round requires results to be hidden first; a locked table gets a clear 409 rather than a silent failure.

## Security boundaries

- Facilitator routes compare the `x-workshop-key` header against the secret with a timing-safe comparison.
- Table tokens are HMACs bound to session and table, sent as `x-table-token`. Ending the session stops every token immediately.
- Participant payloads carry only the open round and that table's own response. Reveal text is never sent to a device: it is projected from the deck, read aloud, and printed in the pack.
- Round task copy lives in `server/workshop/content.ts` and is served only for the open round, so unreleased copy cannot sit in the client bundle. The built bundle contains the two system names (which are on the slides anyway) and no round facts, tasks or reveals.
- The console route is keyed by a 128-bit console key and returns published data only, so it is safe to project and safe to hand to Richard without a login.
- Rationales are capped at 240 characters, escaped by React on render, and private until Adam selects them.

## Deliberate deviations from the PRD

1. **Table tokens are stateless HMACs, not stored hashes.** The PRD data model lists `token_hash` on `workshop_teams`. A stored single hash cannot satisfy the PRD's own acceptance test that two devices at one table share a draft, because issuing a second token would invalidate the first. HMAC tokens bound to session and table give the same forgery resistance, allow a second device at the same table, and are revoked wholesale when the session ends. The column is not in the schema.
2. **Table state is derived, not stored.** The PRD lists a `state` column. Deriving it from the table's decision removes a second source of truth that could disagree with the responses themselves.
3. **Tables are created at runtime if the migration has not been applied.** `migrations/20260904120000_add_decision_room.sql` is the reviewed migration; `ensureTables()` also creates them on first use, so a fresh deployment on event day cannot fail because a migration step was missed.

## Storage

Neon through Drizzle when a connection string is set; an in-memory store otherwise, so the whole flow can be rehearsed locally with no database. The in-memory store does not retain audit events and does not survive a restart — it is for rehearsal, not the event.

## Tests

```bash
npm run test:decision-room
```

Runs the real Express app in-process against the in-memory store and walks the full flow: authentication, session creation, joining, round gating, draft, lock, the locked state, table isolation, forged tokens, the console before and after publication, publish/select/hide, reopening one table, later rounds, export, ending the session and reset. 47 assertions, including the negative ones that matter live — no distribution before publication, no rationales or lock times on the console, no rank/score/winner language in any payload, and no personal data in the export.

Verified separately: with `WORKSHOP_FACILITATOR_SECRET` unset, every facilitator route returns 503, including a request carrying the legacy admin key.

## What was not built

Everything the PRD v1.1 amendments cut: session duplication, pause, table renaming, CSV export, presenter-safe mode, the display-items table, idle polling and the 50-table load target. Retention is manual — export, then delete the session.
