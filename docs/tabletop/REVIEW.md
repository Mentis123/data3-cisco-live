# When the Agent Acts: live-event review of the full package

Reviewed as one system on 4 September 2026: both v5 decks (every slide and every speaker note), the v3 Facilitator and Participant Pack, and the Decision Room PRD v1, checked against the `data3-cisco-live` repository. Revised copies are in `revised/`; the untouched originals are in `originals/`.

## 1. Executive verdict

**Ready with minor changes, and the changes are applied.** The design is sound: the framing is strong, the three-round reveal structure works, the six-field lock is the right output, and the Security Counsel role is well bounded. As submitted, though, it would not have run cleanly. The role cards gave away both reveals, there was no moment or screen for tables to join the console, Adam was expected to switch between PowerPoint and a browser mid-round, report-back did not scale past six tables, there was no per-round paper card, and nothing covered Richard being late or absent. The PRD asked for more than the room needs.

With v6 decks, v4 pack and PRD v1.1, the workshop is runnable on paper today. Decision Room remains optional and should only be used live once it has been rehearsed twice end to end.

## 2. Five most important risks, ranked by live-event impact

1. **The role cards pre-empted both reveals.** The identity lead's private fact was the shared-identity loop from reveal two, the incident commander's fact was the logging or trace problem from reveal one, and the comms fact was the customer or media pressure from reveal two. Tables would have discussed the reveals in round one and the reveals would have changed nothing. Fixed: every duplicating fact is rewritten to add pressure or uncertainty without disclosing the reveal.
2. **Report-back overruns and eats Richard's four minutes.** Two minutes per table plus Adam's question is closer to three minutes in practice. Six tables is 18 minutes, eight is 24, and the pack only paired tables above eight. Fixed: scaling rule (four tables, three minutes; five or six, two minutes; seven or eight, pairs), hard stop at 01:20, and Richard's slot protected.
3. **Adam had to operate two screens.** Slide 10's note said to show the console distribution before revealing, which means leaving the deck on the projector. Fixed: a show of hands on slide 9 before advancing is the distribution; the console is a private instrument on Adam's device, never a projected dependency.
4. **The technology had no on-ramp and no per-round paper path.** No slide or moment told scribes to join, and the pack's "paper decision cards" did not exist. Fixed: join line on slide 8 pointing to QR table cards, a five-minute block that includes joining, and a printed round lock card sheet per table.
5. **Decision Room is unbuilt and the PRD was over-scoped.** Fifty tables, load tests, duplication, pause, rename, CSV, three participant states and a durable rate limiter add build time without helping the room. If the build slips, Adam runs on paper, which the pack now supports fully. Fixed in PRD v1.1 with an amendments page that prevails over later sections.

Two further items outside the package but found in the repository: the admin routes fall back to a hard-coded default key when `ADMIN_KEY` is unset, and a `.env.local` containing `ADMIN_KEY` is committed and not gitignored. PRD v1.1 forbids reusing that pattern for facilitator authentication. Rotate the key and remove the file from history separately.

## 3. Realistic minute-by-minute dry run

Clock times are from session start. "Plan" is the run of show; "Real" is what a room of CISOs actually does.

| Clock | Plan | Real | What happens and where it drifts |
| --- | --- | --- | --- |
| 00:00–00:15 | 15 | 16–17 | People settle, Adam introduces himself and Richard, seven slides. Slide 5 (workflow boundary) is the one to cut if the room started late. |
| 00:15–00:20 | 5 | 6–7 | Roles, brief, first two unknowns, and the scribe joins the console. Six roles across five to eight people needs the table-size rule in the pack. |
| 00:20–00:32 | 12 | 12 | Facts read once, ten minutes of table work, warning at nine, close at eleven, show of hands on slide 9. Holds if Adam closes on time. |
| 00:32–00:44 | 12 | 11–12 | Three reveal lines, one high-confidence and one low-confidence voice (one minute each), eight-minute timer, close at 00:43. Drifts if the two voices become a debate. |
| 00:44–00:56 | 12 | 12 | All reveal-two lines at once, eight-minute timer, last two minutes to confirm every table has a named lead. |
| 00:56–01:02 | 6 | 7 | Six fields on one page. Tables always want one more minute; warn at four. |
| 01:02–01:20 | 18 | 17–19 | Six tables at two minutes plus the reversal question. Order starts with a low-confidence table. Hard stop 01:20. |
| 01:20–01:24 | 4 | 4–5 | Richard from the listening card. Adam does not add commentary. |
| 01:24–01:28 | 4 | 3–4 | Control map only. No product depth. |
| 01:28–01:30 | 2 | 2 | Five questions and the closing line. |

Realistic total is 93 to 96 minutes with no recovery. There is no buffer in the agenda, so recovery has to come from three deliberate cuts: slide 5 (2.5 minutes), one voice instead of two after reveal one (1 minute), and the 01:20 hard stop on reports (up to 3 minutes). With those, 90 minutes is achievable; without them, expect to finish at about 01:34.

Device joining is the hidden cost. Budget it inside the 00:15–00:20 block and let the console be optional: a table that has not joined by 00:20 uses paper for round one and joins during round two if the scribe wants to.

## 4. Participant friction by stage

- **Arrival and roles.** Six roles for five to eight people is not self-evident. Fixed with the table-size rule on both role cards and in the slide 8 note. The scribe was named on slide 7 but not on the role cards; the challenger is now explicitly "challenger and scribe".
- **Joining.** No screen said how or when to join. Fixed with the slide 8 line and QR table cards. Nothing on a participant device is required to take part.
- **Round one.** Clear. Four options on the slide, on the brief and on the lock card match. Tables interpreting the scenario differently is fine; the notes already say facts are as given and the challenger must state reversal evidence. The "which answer is correct" line is scripted in the notes and the operator card.
- **Reveal one and round two.** The task on the slide (name the lead, scope containment, preserve evidence) is clear. Friction was that the digital lock shape (option, confidence, rationale) did not fit a round with no options. Fixed: rounds two and three lock one sentence plus confidence digitally; the fuller structure sits on the printed task page and lock card.
- **Reveal two and round three.** Strongest moment in the exercise. The loop only works if the shared-identity fact is new, which is why the role-card fix matters most here.
- **Lock.** The canvas and slide 12 match field for field. Six minutes is tight but forces the discipline the slide title asks for.
- **Reports.** Three lines are clear. Quiet tables get the challenger question; dominant voices get a question addressed by role. An unconventional but defensible response is handled by the reversal question and by Richard's lens on specificity, not by any correctness test.
- **Security Counsel and close.** Participants leave with the five board questions and the control map. No ranking, no winner, no scores anywhere in the package after the "tie-break" line was removed.

## 5. Adam's simplified operator checklist

The full card is printed in the pack (v4, page 6, "Operator card"). In short:

| Clock | Say | Show | Do | Watch |
| --- | --- | --- | --- | --- |
| 00:00 | Slides 1 to 7; "no answer key, reasoning beats speed" | Slides 1–7 | Nothing | Finish by 00:15; cut slide 5 if late |
| 00:15 | "Five minutes: roles, brief, two unknowns. Scribe, join with the QR card or keep paper." | Slide 8 | Timer 5; open round one at 00:19 | Every table has a scribe and challenger |
| 00:20 | Facts once; "lock at ten"; warning at nine | Slide 9 | Timer 12; close at 11; show of hands | Quiet tables, dominant voices, "which is correct" |
| 00:32 | Three reveal lines; two voices; "eight minutes" | Slide 10 | Timer 8 from 00:35; close 00:43 | Tables stuck on "was the link opened" |
| 00:44 | All reveal lines; "this is the loop" | Slide 11 | Timer 8 from 00:46; close 00:55 | Identity revoked with no continuity plan |
| 00:56 | "Six minutes, six fields, challenger then commander locks" | Slide 12 | Timer 6; choose report order | Warn at 01:00 |
| 01:02 | "Two minutes, three lines"; reversal question | Slide 13 | Per-table timer; stop at 01:20 | Time; Richard's notes |
| 01:20 | Hand-off line to Richard | Slide 13 | Stand aside | Four minutes |
| 01:24 | "Map the workflow first" | Slide 14 | Nothing | No product depth |
| 01:28 | Five questions; closing line | Slide 15 | Export, then end session | Land at 01:30 |

If technology fails: say "paper from here" and change nothing else. Without a producer: the visible timer is the only instrument; pre-set 5, 12, 8, 8, 6 and 2 minutes.

## 6. Richard's Security Counsel briefing (five minutes of preparation)

You are Security Counsel, not a judge. There is no answer key, no score and no winner. Read this and the quality rubric, then listen.

**Listen for five things during the reports.** Containment: did the table act at the narrowest effective boundary and name the consequence? Continuity: did it protect the essential service while containing the harmful path? Evidence: did it preserve enough of the instruction-to-action chain to investigate? Decision rights: was one person accountable, with clear advisory and restart authority? Uncertainty: did it separate confirmed fact, reasonable suspicion and unknown scope? Note one example of each on the listening card in the pack.

**Four minutes, four moves.** Name one thing the room handled well (45 seconds). Recognise two strong reasoning patterns, described as decisions rather than tables (90 seconds). Surface one recurring blind spot and say why it matters in a real incident (60 seconds). Land one practical action leaders can take back (45 seconds).

**Opening line.** "There was no single correct option here. I was listening for decisions that were specific, defensible and capable of changing when the evidence changed."

**Guardrails.** Do not correct every table. Do not mention products. If you arrive late, Adam gives you the listening card and the round-one show of hands, and you speak from the reports only. If you cannot attend, Adam delivers this structure himself.

## 7. Decision Room PRD assessment

**Fit with the repository (verified).** React 18, Vite, Wouter and TanStack Query are present. Express is wrapped for Vercel in `api/index.ts` with WebSockets disabled. Neon serverless plus Drizzle is wired in `server/db.ts` with an in-memory fallback. Five-second polling is already used in the admin and leaderboard pages. QR libraries are installed. Migrations are SQL files under `migrations/` plus `drizzle-kit push`. The HMAC-signed run token in `server/alpha2026Leaderboard.ts` is a reusable pattern for table resume tokens. Three things do not fit and PRD v1.1 addresses them: the in-memory rate-limit map in `server/routes.ts`, the default admin key fallback, and the fact that the 2026alpha challenge is single-player and scored, so its mechanics are not the session, table and round model the workshop needs.

**Must keep.** Session with join code and QR; pre-created tables with hashed resume tokens; server-authoritative open, close, publish and advance in transactions; draft and atomic lock; reopen one table with audit; console with timer, counts, round-one distribution, confidence spread, two selected rationales, last-updated and offline state; facilitator authentication from a dedicated secret; five-second polling with a revision; JSON export; paper instruction on every screen.

**Should change.** States become joined, drafting and locked, with drafting inferred from a saved draft. Only round one has options; rounds two and three lock one sentence plus confidence. Reveal text never reaches participant devices, which removes the unreleased-reveal risk class entirely. Console keyed by an unguessable key and returning published data only. Rate limiting replaced by validation, tokens and constraints. Manual export-then-delete instead of a scheduled retention job. Close and reopen semantics defined. Timer derived from server-side opened-at.

**Cut from v1.** Fifty-table target and load test; duplication, pause, rename, CSV, presenter-safe mode; the display-items table; fifteen-second idle polling.

**State transitions and security boundaries.** Session: draft, live, ended. Round: pending, open, closed, published, with reveal released as a separate flag shown on the slide, not the device. Table: joined, drafting, locked. Every participant query is scoped by session and table server-side; console and participant payloads carry no unpublished rationale or other table's response; admin routes refuse to start without the secret. Acceptance tests for each are listed on the amendments page.

## 8. Exact edits made, by file and slide or page

**Both decks (v5 to v6).**
- Slide 7: timing bar 15 / 40 / 6 / 22 / 7 became 15 / 41 / 6 / 22 / 6 and "SYNTHESISE" became "CLOSE" so the bar sums to 90 and matches the run of show (5 + 36 = 41 to decide; 6 to debrief and close; synthesis sits inside the 22-minute report block).
- Slide 8: new muted line at the foot: "Scribe: join the Decision Room with the QR card on your table, or use the paper lock card. Five minutes: roles, brief, first two unknowns."
- Slide 8 notes: the say-line, timer and "open round one at 00:19" instruction; table-size rule.
- Slide 9 notes: in-round timing, show-of-hands room check before advancing, the "which answer is correct" line, quiet-table and dominant-voice prompts, "paper from here".
- Slide 10 notes: removed the instruction to show the console distribution first; replaced with reading the reveal and taking two one-minute voices; in-round timing and the round-two lock shape.
- Slide 11 notes: in-round timing and the shared-identity prompt.
- Slide 12 notes: choose report order and select rationales while tables write.
- Slide 13 notes: scaling rule, hard stop at 01:20, Richard late or absent contingency.
- No visual, colour or layout changes beyond the one added line. Dark Data#3 direction and Australian English preserved. No Signal Gap, GAI Insights or research branding present.

**Pack (v3 to v4).**
- Page 2: "Finishing first confers no score advantage" became "Finishing first earns nothing"; pairing threshold changed from more than eight tables to seven or eight.
- Page 3: "reading, debating or locked" became "joined, drafting or locked"; the tie-break sentence removed.
- Page 4: recommendation corrected (the 2026alpha challenge is not a reusable session model); round-shape row corrected for rounds two and three; data model aligned with the PRD.
- New page 6: Operator card (say, show, do, watch) with technology-failure and no-producer lines.
- Pages 8 and 12 (role cards): five private facts rewritten so they no longer disclose the reveals; challenger renamed "Constructive challenger and scribe" with the scribe duty; table-size rule added.
- New page after the Team response canvas: Round lock cards, one sheet per table, paper fallback for all three rounds.
- Report-back page: scaling and hard-stop paragraph.
- Security Counsel page: preparation line, late and unavailable contingencies, listening card.
- Pre-flight: PDF export of both decks on a second device; print operator card and lock cards; same-day enterprise and government reset rule; QR table card check.

**PRD (v1 to v1.1).**
- Cover: version line.
- New section 00, Review amendments, which prevails over later sections: must keep, should change, cut from v1, additional acceptance tests.
- Sections 02 to 10: states, round shape, reveal handling, console route and key, admin controls, close and reopen rules, export, targets, display-items table, facilitator secret, rate limiting, retention, polling, rehearsal tests.

**Facts checked, not changed.** The Unit 42 investigation at the cited URL is dated 2 September 2026, describes a human-directed intrusion with AI agents, under ten hours from initial access to control across systems, and more than 50 MITRE ATT&CK techniques. Slide 2 and the claims note are accurate as written. The Microsoft capability names on slide 14 match the cited Microsoft Learn locations.

**Recommended but not applied (needs a decision or an asset).** Produce QR table cards with the live short URL and code. Decide whether the government deck's slide 2 title should say "An intrusion" rather than "An enterprise intrusion"; the wording is factual, so it was left. The recovery cuts in section 3 are Adam's call on the day.

## 9. Final rehearsal and event-day go/no-go

**Rehearsal (one week out).**
- Run the full 90 minutes with four people acting as tables and one as Richard, on paper only. Stop at 01:30 and record every drift.
- If Decision Room is to be used: create a session, join from two phones and a laptop, lock, refresh, close a round with one table unlocked, reopen, publish, and inspect network payloads for unpublished content. Then disable Wi-Fi on one phone and on the console and continue on paper. Repeat once more the day before.
- Time the report-back with the intended table count and the reversal question.
- Richard reads the brief and listening card once and confirms the hand-off line.

**Go / no-go on the day.**
- Go on paper if: printed briefs, role cards, reveal pages, canvases and lock cards are on tables; the visible non-web timer works; both decks open with notes on Adam's device and as PDF on a second device; the correct variant deck is loaded; Richard, or the fallback, is confirmed.
- Go on Decision Room only if all of the above plus: two clean rehearsals, a fresh session for this audience, QR table cards open the live session, the console is on a private device, the facilitator secret is set in Vercel and absent from the bundle, and an export has been tested. Otherwise run on paper and say nothing about it to the room.
- Between the enterprise and government sessions: export and end the morning session, create a new one, swap all printed material, reload the government deck, reset the timer.
- Abort the technology mid-session, never the exercise: "paper from here", and continue.
