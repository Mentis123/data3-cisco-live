# Decision Room — Riverbend edition

The live tabletop instrument for **When the agent attacks** (Richard's deck, 27 slides) is mounted at `/decision-room`. One scenario — Riverbend Water & Energy — six rounds: Triage, then Injects 1–5. Tables vote A–D on one phone, write one sentence, pick a confidence and lock. The projected console shows who has locked and, when Adam chooses, where the room landed.

Operator instructions live in [`docs/tabletop/RIVERBEND_RUN_SHEET.md`](tabletop/RIVERBEND_RUN_SHEET.md). Richard's standalone companion is served at `/crisis-room`.

## Production configuration

- **Facilitator key**: any of `WORKSHOP_FACILITATOR_SECRET`, `DECISION_ROOM_ADMIN_KEY` or the legacy `ADMIN_KEY`. If more than one is set, each of them opens the room (they never shadow one another), and surrounding whitespace is ignored. Set it in Vercel (Production) and redeploy; env vars are snapshotted at build time. A rejected key is logged with the *names* of the variables the function received, never their values.
- `DATABASE_URL` or a `POSTGRES_URL*` variant: Neon connection for rooms, tables, decisions and the event ledger. On Vercel the API refuses to run in memory.

The API creates the four `workshop_*` tables on first use and relaxes the September three-round constraints in place (`ALTER TABLE … DROP CONSTRAINT IF EXISTS`), so the production tables carry over without a destructive migration. `migrations/20260906090000_decision_room.sql` remains the recorded baseline.

## Round flow (as agreed on the 12 October call)

```
lobby ──launch──▶ launched ──start──▶ round 1 open ──close──▶ closed ──publish──▶ published ──advance──▶ round 2 open … round 6 ──end──▶ ended
```

Inside a round: tables lock → **Close round** → Richard walks the option slide (best move last) → **Show the split** → discuss → **Next**.

## What each surface shows

| Surface | Before start | Round open | Closed | Published |
|---|---|---|---|---|
| Phone (one per table) | Riverbend dashboard, all secure, "monitoring mode" | Feed, situation, A–D, rationale, confidence, lock | "Round closed. Richard is walking the options." | The split, **that table's** consequence, meters moved |
| Console (projector) | Adversary profile; after **Launch**, the dramatised run | Timer, joined/drafting/locked, table tiles, the four option labels | "Round closed" | A/B/C/D bars, confidence range, up to two unattributed rationales |
| Admin (Adam) | Five numbered buttons in flow order, QR, console link | Live responses with rationales; reopen; put on screen | — | — |

## Boundaries

- Facilitator routes require the key (timing-safe compare). The console uses a room-scoped display token carried in its link. Each table holds a random token; only its hash is stored. A table can rejoin (dead phone, second device); the old token is retired.
- Round copy is served only for the open round. **Consequences, meters and the split are returned only after publish.** Verdict labels and the "best move" never leave the deck. Verified by grepping the built bundle: no situation, consequence or verdict text ships in it.
- No rank, score, lock time or winner anywhere in any payload (asserted by the test).
- Ending the room stops every table token. Reset clears every response and table login.

## Tests

```bash
npm run test:decision-room      # in-process, in-memory store, 94 assertions across all six rounds
node scripts/decision-room-screenshots.mjs <outdir>   # against a dev server on :5199, screenshots every state
```

## Content

`server/decisionRoomContent.ts` holds the six rounds in the deck's wording and option order, the per-option consequences ported from the Crisis Room (with variants that depend on a table's earlier choices — e.g. a table that watched the OT gateway in Inject 1 rides out the isolation in Inject 3), the live-state meters, and the launch script. Edit the deck and this file together.
