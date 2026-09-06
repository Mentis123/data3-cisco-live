# Decision Room

The live tabletop instrument is mounted at `/decision-room` and supports the Enterprise (Project Atlas) and Government (Civic Assist) scenarios.

## Production configuration

- `DECISION_ROOM_ADMIN_KEY`: facilitator password. If omitted, the app uses the existing `ADMIN_KEY`.
- `DATABASE_URL` or an existing supported `POSTGRES_URL` variant: Neon/Postgres connection used for rooms, teams, decisions and the event ledger.

The API creates its four workshop tables on first use if they do not exist. The same schema is recorded in `migrations/20260906090000_decision_room.sql` for controlled migrations.

## Run-of-show

1. Adam opens `/decision-room`, selects **Facilitate**, chooses the audience and table count, and creates the room.
2. Put the facilitator view on Adam's device. Open its **presenter console** in the screen-shared window.
3. Attendees scan the QR code, enter their table number and wait in the lobby.
4. Adam starts the room. Each table chooses an action, records the trade-off it accepts and names evidence that would reverse its call.
5. Adam may publish the room pattern and select strong reasoning for the screen. This is a sense-making view, not a leaderboard.
6. Adam advances the reveal twice. Previous responses remain in the decision ledger; future facts are never sent to participant devices early.
7. Richard, as Security Counsel, reflects on the reasoning: authority, containment scope, continuity, evidence and restart conditions. He does not score winners.
8. Export the CSV after the exercise, then end the room. Use **Reset** only when intentionally clearing every response and table login in that room.

## Access model

- Facilitator calls require the facilitator key.
- The presenter console uses a separate, room-scoped display token.
- Each table receives a random token at join; only its hash is stored.
- A table cannot edit after locking unless Adam reopens it.
- Vercel production refuses in-memory operation when the database connection is missing.
