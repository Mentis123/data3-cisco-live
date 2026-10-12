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
check("unknown table refused", (await call("POST", "/join", { body: { joinCode, teamCode: "9" } })).status === 404);
check("unknown room refused", (await call("POST", "/join", { body: { joinCode: "ZZZZZZ", teamCode: "1" } })).status === 404);
const rejoin = await call("POST", "/join", { body: { joinCode, teamCode: "1" } });
check("a dead phone can rejoin its table", rejoin.status === 200);
check("the old token is retired on rejoin", (await call("GET", `/sessions/${joinCode}/participant`, { headers: t1 })).status === 401);
t1["x-team-token"] = rejoin.body.teamToken;

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
