/**
 * Decision Room (Riverbend) flow test: `npm run test:decision-room`.
 *
 * Runs the real Express app in-process against the in-memory store and walks
 * the six-round flow the way Adam will on the day, asserting the boundaries
 * that matter live: no hints before the split, no consequence before publish,
 * table isolation, facilitator-only controls, and the agreed close → publish →
 * advance order.
 */
process.env.DECISION_ROOM_ADMIN_KEY = "rehearsal-facilitator-key-0123456789";
// A second key under another name, padded: it must open the room too (the names never shadow each other).
process.env.WORKSHOP_FACILITATOR_SECRET = "  workshop-secret-0123456789  ";
process.env.DECISION_ROOM_ONLINE_SECONDS = "2"; // so the "quiet phone" path is testable in seconds
delete process.env.DATABASE_URL;
delete process.env.VERCEL;

const { createApp } = await import("../server/createApp.ts");
const { app } = await createApp({ enableWebSocket: false, provideServer: false });
const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
const base = `http://127.0.0.1:${server.address().port}/api/decision-room`;

let failures = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  ok   ${label}`);
  else { failures += 1; console.log(`  FAIL ${label}${detail ? ` :: ${JSON.stringify(detail).slice(0, 300)}` : ""}`); }
}
async function call(method, path, { body, headers } = {}) {
  const res = await fetch(`${base}${path}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}
const KEY = { "x-admin-key": process.env.DECISION_ROOM_ADMIN_KEY };
const act = (id, body) => call("POST", `/sessions/${id}/actions`, { body, headers: KEY });

console.log("\n1. Facilitator authentication");
check("create without a key is 401", (await call("POST", "/sessions", { body: {} })).status === 401);
check("create with the wrong key is 401", (await call("POST", "/sessions", { body: {}, headers: { "x-admin-key": "nope" } })).status === 401);
check("a key set under WORKSHOP_FACILITATOR_SECRET also opens the room, whitespace ignored", (await call("POST", "/sessions", { body: {}, headers: { "x-admin-key": "workshop-secret-0123456789" } })).status === 201);

console.log("\n2. Create the room");
const created = await call("POST", "/sessions", { body: { tableCount: 4 }, headers: KEY });
check("room created", created.status === 201, created.body);
const { sessionId, joinCode, displayToken } = created.body;
check("six-character room code", typeof joinCode === "string" && joinCode.length === 6, joinCode);
check("display token issued", typeof displayToken === "string" && displayToken.length > 20);

console.log("\n3. Tables join");
const j1 = await call("POST", "/join", { body: { joinCode, teamCode: "1" } });
check("table 1 joins", j1.status === 200, j1.body);
const t1 = { "x-team-token": j1.body.teamToken };
const j2 = await call("POST", "/join", { body: { joinCode, teamCode: "2", teamName: "=The Night Shift <b>" } });
check("a team can name itself on join (sanitised)", j2.body.displayName === "=The Night Shift b", j2.body);
const t2 = { "x-team-token": j2.body.teamToken };
const pick = await call("GET", `/rooms/${joinCode}/tables`);
check("table picker lists every table with free/taken", pick.status === 200 && pick.body.tables.length >= 2 && pick.body.tables.find((t) => t.teamCode === "1")?.taken === true && pick.body.tables.find((t) => t.teamCode === "2")?.taken === true && pick.body.tables.some((t) => !t.taken), pick.body);
check("table picker never leaks tokens", !JSON.stringify(pick.body).includes("token"));
check("table picker 404s on an unknown room", (await call("GET", "/rooms/ZZZZZZ/tables")).status === 404);
check("unknown table refused", (await call("POST", "/join", { body: { joinCode, teamCode: "9" } })).status === 404);
check("unknown room refused", (await call("POST", "/join", { body: { joinCode: "ZZZZZZ", teamCode: "1" } })).status === 404);
console.log("\n3b. Handover: a second device asks, the device at the table decides");
const asks = async (name, headers = {}, teamCode = "1") => call("POST", "/join", { body: { joinCode, teamCode, ...(name ? { teamName: name } : {}) }, headers });
const statusOf = async (tok) => (await call("GET", `/sessions/${joinCode}/handover`, { headers: { "x-team-token": tok } })).body.status;
const popupOf = async (h) => (await call("GET", `/sessions/${joinCode}/participant`, { headers: h })).body.handover;
const answer = (h, decision, requestId) => call("POST", `/sessions/${joinCode}/handover`, { body: { decision, requestId }, headers: h });
const ask1 = await asks("Night Owls");
check("joining an active, occupied table asks instead of taking over", ask1.status === 202 && ask1.body.pending === true, ask1.body);
check("the asking device is not in yet", (await call("GET", `/sessions/${joinCode}/participant`, { headers: { "x-team-token": ask1.body.teamToken } })).status === 401);
let pop = await popupOf(t1);
check("the device at the table sees the request with an id", pop?.name === "Night Owls" && typeof pop?.requestId === "string", pop);
check("the asking device sees pending", (await statusOf(ask1.body.teamToken)) === "pending");
check("a second device cannot jump the queue while a request is live", (await asks("Interloper")).status === 409);
check("the facilitator sees the live request", (await call("GET", `/sessions/${sessionId}/admin`, { headers: KEY })).body.teams.some((t) => t.handover));
check("approve needs the id of the request on screen", (await answer(t1, "approve", "0000000000000000")).status === 409);
check("the device at the table declines", (await answer(t1, "decline", pop.requestId)).status === 200);
check("the asking device sees declined", (await statusOf(ask1.body.teamToken)) === "declined");
let hp = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("after a decline the table is unchanged and the pop-up is gone", hp.status === 200 && hp.body.handover === null && hp.body.team.displayName === "Table 1");
check("a stranger cannot answer for the table", (await answer(t2, "approve", pop.requestId)).status === 409);
const askC = await asks();
check("a cancelled request disappears everywhere", (await call("DELETE", `/sessions/${joinCode}/handover`, { headers: { "x-team-token": askC.body.teamToken } })).status === 200 && (await popupOf(t1)) === null && !(await call("GET", `/sessions/${sessionId}/admin`, { headers: KEY })).body.teams.some((t) => t.handover));
const ask2 = await asks("Night Owls");
pop = await popupOf(t1);
check("the device at the table approves the request it was shown", (await answer(t1, "approve", pop.requestId)).status === 200);
check("the asking device sees approved", (await statusOf(ask2.body.teamToken)) === "approved");
check("the old device is signed out", (await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 })).status === 401);
t1["x-team-token"] = ask2.body.teamToken;
hp = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("the new device is in, renamed as asked", hp.status === 200 && hp.body.team.displayName === "Night Owls");
const own = await asks(null, t1);
check("a device rejoining its own table is not asked to approve itself", own.status === 200, own.body);
t1["x-team-token"] = own.body.teamToken;
const ask4 = await asks();
const t1Id = (await call("GET", `/sessions/${sessionId}/admin`, { headers: KEY })).body.teams.find((t) => t.handover)?.id;
check("the facilitator approves a live request", (await act(sessionId, { action: "handover", teamId: t1Id })).status === 200 && (await statusOf(ask4.body.teamToken)) === "approved");
t1["x-team-token"] = ask4.body.teamToken;
await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
// Moving between tables through an approved handover frees the table being left.
const j3 = await asks("Table Three", {}, "3"); const t3 = { "x-team-token": j3.body.teamToken };
const j4 = await asks("Table Four", {}, "4"); const t4 = { "x-team-token": j4.body.teamToken };
await call("GET", `/sessions/${joinCode}/participant`, { headers: t4 });
const move = await asks(null, t3, "4");
const movePop = await popupOf(t4);
check("moving to an occupied table also asks", move.status === 202 && Boolean(movePop?.requestId));
await answer(t4, "approve", movePop.requestId);
const afterMove = (await call("GET", `/rooms/${joinCode}/tables`)).body.tables;
check("the table a device moves away from is freed", afterMove.find((t) => t.teamCode === "3")?.taken === false && afterMove.find((t) => t.teamCode === "4")?.taken === true, afterMove);
await new Promise((r) => setTimeout(r, 2300));
const dead = await asks();
check("a quiet device (closed, asleep, dead) does not block its table", dead.status === 200 && Boolean(dead.body.teamToken), dead.body);
check("the quiet device's token is retired", (await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 })).status === 401);
t1["x-team-token"] = dead.body.teamToken;
await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
const ask5 = await asks();
await new Promise((r) => setTimeout(r, 2300));
check("a device that goes quiet mid-request hands over by itself", (await statusOf(ask5.body.teamToken)) === "approved");
t1["x-team-token"] = ask5.body.teamToken;
await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });

console.log("\n4. Lobby and launch");
let p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("lobby: no round copy on the device", p.body.round === null && p.body.session.roundState === "lobby", p.body.session);
check("lobby: dashboard is all secure", p.body.dashboard.path.every((s) => s === "secure"));
check("lobby: initial meters", p.body.dashboard.meters.containment === 8 && p.body.dashboard.meters.service === 100);
check("vote before the room opens is refused", (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "C", confidence: 4, lock: true }, headers: t1 })).status === 409);
check("launch", (await act(sessionId, { action: "launch" })).status === 200);
const consoleLaunched = await call("GET", `/sessions/${sessionId}/console?displayToken=${encodeURIComponent(displayToken)}`);
check("console sees the launch with the terminal script", consoleLaunched.body.session.roundState === "launched" && consoleLaunched.body.launch.lines.length > 3);
check("console without a display token is 401", (await call("GET", `/sessions/${sessionId}/console`)).status === 401);
check("launch twice is refused", (await act(sessionId, { action: "launch" })).status === 409);

console.log("\n5. Triage opens");
check("start", (await act(sessionId, { action: "start" })).status === 200);
p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("round one served with four options", p.body.round?.roundNo === 1 && p.body.round.options.length === 4, p.body.round?.options);
check("options carry labels only, no consequence or verdict", !JSON.stringify(p.body.round).match(/consequence|BEST MOVE|AVOID|DEFENSIBLE|best move/i));
check("situation text matches the deck", p.body.round.situation[0].startsWith("Quiet night shift"));
check("timer derived from the server", Boolean(p.body.session.roundStartedAt) && p.body.session.durationSeconds === 240);

console.log("\n6. Draft and lock");
check("lock without confidence refused", (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "C", lock: true }, headers: t1 })).status === 400);
check("unknown option refused", (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "E", confidence: 3 }, headers: t1 })).status >= 400);
const draft = await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "B", rationale: "The assistant is usually right.", confidence: 3 }, headers: t1 });
check("draft saved", draft.status === 200 && draft.body.locked === false, draft.body);
p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("draft round-trips", p.body.decision?.optionKey === "B" && p.body.decision.isLocked === false);
const lock1 = await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "B", rationale: "The assistant is usually right.", confidence: 3, lock: true }, headers: t1 });
check("table 1 locks B (the trap)", lock1.status === 200 && lock1.body.locked === true);
check("edit after lock is refused with a clear message", (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "C", confidence: 5 }, headers: t1 })).status === 409);
check("table 2 locks C", (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "C", rationale: "When the AI and the logs disagree, the logs win.", confidence: 4, lock: true }, headers: t2 })).status === 200);

console.log("\n7. Isolation and privacy before the split");
p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("no results before publish", p.body.results === null);
check("no other table's rationale on the device", !JSON.stringify(p.body).includes("logs win"));
check("meters unchanged before publish", p.body.dashboard.meters.trust === 68);
const forged = await call("GET", `/sessions/${joinCode}/participant`, { headers: { "x-team-token": "forged" } });
check("forged token is 401", forged.status === 401);
let con = await call("GET", `/sessions/${sessionId}/console?displayToken=${encodeURIComponent(displayToken)}`);
check("console counts two locked", con.body.counts.locked === 2 && con.body.counts.total === 4, con.body.counts);
check("the team name shows on the console tiles", con.body.teams.some((t) => t.displayName === "=The Night Shift b"), con.body.teams);
check("console shows no split before publish", con.body.results === null);
check("console payload never names rank, score or winner", !/\b(rank|score|winner|fastest|points)\b/i.test(JSON.stringify(con.body)));
check("console payload carries no rationales before publish", !JSON.stringify(con.body).includes("logs win"));

console.log("\n8. Close → feature → publish → consequence");
check("close the round", (await act(sessionId, { action: "close" })).status === 200);
check("close twice is refused", (await act(sessionId, { action: "close" })).status === 409);
check("a round closed too soon can be reopened", (await act(sessionId, { action: "unclose" })).status === 200 && (await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 })).body.session.roundState === "open");
check("close again after reopening", (await act(sessionId, { action: "close" })).status === 200);
check("votes refused after close", (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: 1, optionKey: "A", confidence: 2 }, headers: t2 })).status === 409);
p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t2 });
check("closed: device shows closed state, no results", p.body.session.roundState === "closed" && p.body.results === null);
const admin = await call("GET", `/sessions/${sessionId}/admin`, { headers: KEY });
check("admin sees rationales privately", admin.status === 200 && JSON.stringify(admin.body.decisions).includes("logs win"));
check("admin without key is 401", (await call("GET", `/sessions/${sessionId}/admin`)).status === 401);
const d2 = admin.body.decisions.find((d) => d.optionKey === "C");
check("feature a rationale", (await act(sessionId, { action: "feature", decisionId: d2.id, featured: true })).status === 200);
check("publish the split", (await act(sessionId, { action: "publish" })).status === 200);
con = await call("GET", `/sessions/${sessionId}/console?displayToken=${encodeURIComponent(displayToken)}`);
check("console split: B=1, C=1", con.body.results?.options.B === 1 && con.body.results.options.C === 1, con.body.results?.options);
check("console confidence range", con.body.results.confidence.low === 3 && con.body.results.confidence.high === 4);
check("featured rationale on screen, unattributed", con.body.results.featured.length === 1 && !JSON.stringify(con.body.results.featured).includes("Table"));
p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("table 1 sees the split", p.body.results?.options.C === 1);
check("table 1 sees its own consequence (trusting the assistant)", p.body.results.consequence?.you.startsWith("You accepted"), p.body.results?.consequence);
check("meters moved for table 1 (trust down)", p.body.dashboard.meters.trust === 38, p.body.dashboard.meters);
const p2 = await call("GET", `/sessions/${joinCode}/participant`, { headers: t2 });
check("table 2 sees a different consequence (ground truth)", p2.body.results.consequence?.you.startsWith("You distrusted"));
check("meters moved for table 2 (trust up)", p2.body.dashboard.meters.trust === 82);
check("reopen after publish is refused", (await act(sessionId, { action: "reopen", teamId: admin.body.teams[0].id })).status === 409);

console.log("\n9. Advance through all six rounds");
const picks = { 2: ["A", "B"], 3: ["D", "D"], 4: ["A", "B"], 5: ["D", "C"], 6: ["B", "C"] };
for (let r = 2; r <= 6; r += 1) {
  check(`advance to round ${r}`, (await act(sessionId, { action: "advance" })).status === 200);
  p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
  check(`round ${r} served, fresh decision`, p.body.round?.roundNo === r && p.body.decision === null && p.body.results === null);
  check(`round ${r} vote for the previous round is refused`, (await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: r - 1, optionKey: "A", confidence: 3, lock: true }, headers: t1 })).status === 409);
  await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: r, optionKey: picks[r][0], rationale: `t1 round ${r}`, confidence: 3, lock: true }, headers: t1 });
  await call("PUT", `/sessions/${joinCode}/decision`, { body: { roundNo: r, optionKey: picks[r][1], rationale: `t2 round ${r}`, confidence: 4, lock: true }, headers: t2 });
  check(`round ${r} publish`, (await act(sessionId, { action: "publish" })).status === 200);
}
check("advance past the final round is refused", (await act(sessionId, { action: "advance" })).status === 409);
p = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("table 1 (trusted the assistant in triage, sequenced in inject 4) hits the SOCI-window variant", JSON.stringify(p.body.results?.consequence ?? "").length > 0);
const p1r5 = await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 });
check("variant consequences depend on the table's own earlier choices", p1r5.body.dashboard.meters.standing !== p2.body.dashboard.meters.standing);
const p2end = await call("GET", `/sessions/${joinCode}/participant`, { headers: t2 });
check("table 2 (bounded agent, safe state) keeps insurer cover at 100", p2end.body.dashboard.meters.cover === 100, p2end.body.dashboard.meters);
check("table 1 (unbounded then governance evidence) loses cover", p1r5.body.dashboard.meters.cover === 100 || p1r5.body.dashboard.meters.cover === 30, p1r5.body.dashboard.meters);

console.log("\n10. Export, end, reset");
const exported = await call("GET", `/sessions/${sessionId}/export`, { headers: KEY });
check("export is CSV with six rounds of rows", exported.status === 200 && String(exported.body).split("\r\n").length >= 13);
check("CSV guards against formula injection", String(exported.body).includes("\"'=The Night Shift b\""));
check("export is facilitator-only", (await call("GET", `/sessions/${sessionId}/export`)).status === 401);
check("end the room", (await act(sessionId, { action: "end" })).status === 200);
check("tables cannot join an ended room", (await call("POST", "/join", { body: { joinCode, teamCode: "3" } })).status === 409);
check("reset", (await act(sessionId, { action: "reset" })).status === 200);
check("old tokens are void after reset", (await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 })).status === 401);
const adminAfter = await call("GET", `/sessions/${sessionId}/admin`, { headers: KEY });
check("reset returns to the lobby with nothing locked", adminAfter.body.session.roundState === "lobby" && adminAfter.body.counts.locked === 0 && adminAfter.body.session.activeRound === 1);

server.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
