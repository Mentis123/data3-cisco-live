# Decision Room — Riverbend run sheet (Adam)

The live room instrument for **When the agent attacks**. One URL for everything:

**`https://data3-cisco-live.vercel.app/decision-room`**

Standalone Crisis Room (Richard's companion, no login): `https://data3-cisco-live.vercel.app/crisis-room`

The same app, same buttons and same paths also run on **`https://d3smbmxdr.vercel.app/decision-room`** (and `/crisis-room`). Use whichever domain is printed on the slide; a room created on one domain lives only on that domain.

## Before the session (10 minutes, once)

1. Vercel → `data3-cisco-live` → Settings → Environment Variables. Confirm `WORKSHOP_FACILITATOR_SECRET` exists and **Production** is ticked. Its value is your **facilitator key**. (Any of `WORKSHOP_FACILITATOR_SECRET`, `DECISION_ROOM_ADMIN_KEY` or `ADMIN_KEY` opens the room; if an older one is still set under another name, both work.)
2. On your laptop: open `/decision-room` → **Facilitate** → facilitator key → tables in the room → **Create room**. You land on your control page. Note the **room code** (six characters).
3. On your control page, click **Open console (projector)**. Drag that window to the projector. It needs no login — it carries its own display token in the link.
4. Print the room code large, or just read it off the console; the join QR is on your control page.

## What the room sees and what you say

> "One device per table — a laptop or a phone. Go to **data3-cisco-live.vercel.app/decision-room**, scan the QR on the screen (or tap **Join a table** and type the room code), tap your table number — green means free — and give your team a name. You're now watching Riverbend's systems. Nothing is wrong yet."

Each table's device shows the Riverbend attack path and six live meters. In the lobby everything is green: monitoring mode.

## The five buttons, in order

Your control page has five numbered buttons. Use them left to right.

| # | Button | What happens | When |
|---|---|---|---|
| 1 | **Launch the attack** | Projector plays the dramatised attacker run (about 30 seconds). Table screens show "something tripped a faint signal". | After slide 9 (Riverbend), before slide 10. |
| 2 | **Start · open triage** | Round 1 opens on every table's screen with the situation and A–D. Four-minute clock starts on the projector. | When you put slide 10 up. |
| 3 | **Close round** | Table screens stop accepting votes. Projector says "round closed". Nothing is shown yet. | When the clock runs out or every table is locked. |
| 4 | **Show the split** | Projector shows the A/B/C/D bars, confidence range and up to two rationales you picked. Each table's screen shows its own consequence and its meters move. | **After** Richard has walked the option slide and revealed the best move. |
| 5 | **Next · round N** | Opens the next round. Table screens reset. Clock restarts. | When discussion is done and the next situation slide is up. |

Then back to 3 for each of the six rounds: Triage, Inject 1, 2, 3, 4, 5.

**The agreed order inside a round:** tables lock → you press **Close** → Richard walks the option slide (best move as the punchline, last click) → you press **Show the split** → "Here's where the room landed" → discussion → **Next**.

While tables are debating, scan "This round's responses" on your control page and press **Put on screen** on up to two rationales worth reading aloud. They appear unattributed when you show the split.

## If something goes wrong

- **A table wants to move to another device** (laptop battery, swapping to a phone): they pick their table again on the new device. If the old device is still open it gets a pop-up to **Approve** the handover; if it is closed, asleep or dead, the new device gets straight in within about a minute and a half. While a device is waiting, your Tables list shows **Approve handover** if you want to speed it up.
- **A table locked the wrong answer and begs**: press **Reopen** next to that table (only possible before you show the split).
- **Wi-Fi dies**: say "paper from here". Tables use the printed lock card, you take a show of hands for the split, the projector keeps its last screen. Nothing else changes.
- **You lose your control tab**: open `/decision-room` → **Facilitate** → the key is remembered → create nothing; instead use the browser back button or re-open `/decision-room/admin/<session id>` from history. If truly lost, the console's URL still works and you can run the room from paper.
- **Projector loses the console**: open the link from your control page again; the display token is in the link.

## After

**Export CSV** (one row per table per round), then **End room**. Never **Reset** unless you want every response and every table login gone.

## What never happens

No scores, no ranking, no winner, no table named on the projector. The best move lives on Richard's slide and is never sent to a table's device. Consequences and meters only move after you show the split.
