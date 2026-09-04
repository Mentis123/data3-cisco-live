/**
 * Decision Room smoke test: `npm run test:decision-room`.
 *
 * Runs the real Express app in-process against the in-memory store and walks the
 * full facilitator + table flow, asserting the security boundaries as it goes.
 */
process.env.WORKSHOP_FACILITATOR_SECRET = "rehearsal-secret-key-0123456789";
delete process.env.DATABASE_URL;

const { createApp } = await import("../server/createApp.ts");
const { app } = await createApp({ enableWebSocket: false, provideServer: false });

const server = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const base = `http://127.0.0.1:${server.address().port}`;

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` :: ${JSON.stringify(detail)}` : ""}`);
  }
}

async function call(method, path, { body, headers } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

const KEY = { "x-workshop-key": process.env.WORKSHOP_FACILITATOR_SECRET };

console.log("\n1. Facilitator authentication");
check("create without a key is 401", (await call("POST", "/api/workshops", { body: { variant: "enterprise" } })).status === 401);
check("create with a wrong key is 401", (await call("POST", "/api/workshops", { body: { variant: "enterprise" }, headers: { "x-workshop-key": "wrong" } })).status === 401);

console.log("\n2. Session creation");
const created = await call("POST", "/api/workshops", { body: { variant: "enterprise", tableCount: 4 }, headers: KEY });
check("session created", created.status === 201, created.body);
const { id: sessionId, joinCode, consoleKey } = created.body;
check("join code issued", typeof joinCode === "string" && joinCode.length === 6, joinCode);
check("console key is unguessable", typeof consoleKey === "string" && consoleKey.length === 32);

console.log("\n3. Joining a table");
const join1 = await call("POST", `/api/workshops/${joinCode}/join`, { body: { tableCode: "1" } });
check("table 1 joined", join1.status === 200, join1.body);
const token1 = join1.body.token;
const join2 = await call("POST", `/api/workshops/${joinCode}/join`, { body: { tableCode: "2" } });
const token2 = join2.body.token;
check("unknown table refused", (await call("POST", `/api/workshops/${joinCode}/join`, { body: { tableCode: "99" } })).status === 404);
const rejoin = await call("POST", `/api/workshops/${joinCode}/join`, { body: { tableCode: "1" } });
check("second device at the same table is allowed", rejoin.status === 200);

console.log("\n4. Round gating");
const beforeOpen = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "A", confidence: 3, lock: true }, headers: { "x-table-token": token1 } });
check("cannot submit before the round opens", beforeOpen.status === 409, beforeOpen.body);
const pendingState = await call("GET", `/api/workshops/${joinCode}/state`, { headers: { "x-table-token": token1 } });
check("pending round exposes no task copy", pendingState.body.round === null);

check("round opens", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "open" }, headers: KEY })).status === 200);
const openState = await call("GET", `/api/workshops/${joinCode}/state`, { headers: { "x-table-token": token1 } });
check("open round serves its task", Boolean(openState.body.round?.task));
check("timer derived from the server", Boolean(openState.body.round?.timer?.endsAt));
check("only round one carries options", openState.body.round.options.length === 3);

console.log("\n5. Draft, lock and the locked state");
const draft = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "B", confidence: 4, rationale: "Narrowest boundary that stops the sharing path." }, headers: { "x-table-token": token1 } });
check("draft saved", draft.status === 200 && draft.body.decision.isLocked === false, draft.body);
const sameTableOtherDevice = await call("GET", `/api/workshops/${joinCode}/state`, { headers: { "x-table-token": rejoin.body.token } });
check("two devices at one table share the draft", sameTableOtherDevice.body.decision?.optionKey === "B");
const badLock = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "B", lock: true }, headers: { "x-table-token": token1 } });
check("lock without confidence is refused", badLock.status === 400, badLock.body);
const bothChoices = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "B", ownAction: "Something else" }, headers: { "x-table-token": token1 } });
check("option and own action together is refused", bothChoices.status === 400, bothChoices.body);
const locked = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "B", confidence: 4, rationale: "Narrowest boundary that stops the sharing path.", lock: true }, headers: { "x-table-token": token1 } });
check("lock accepted", locked.status === 200 && locked.body.decision.isLocked === true);
const afterLock = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "A", confidence: 1 }, headers: { "x-table-token": token1 } });
check("edit after lock returns a clear locked state", afterLock.status === 409, afterLock.body);

await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { ownAction: "Quarantine the document and freeze the connector.", confidence: 2, rationale: "We keep the service up while we preserve the trace.", lock: true }, headers: { "x-table-token": token2 } });

console.log("\n6. Table isolation");
const table2View = await call("GET", `/api/workshops/${joinCode}/state`, { headers: { "x-table-token": token2 } });
check("a table sees only its own response", table2View.body.decision.ownAction.startsWith("Quarantine"));
check("participant payload carries no other table's response", !JSON.stringify(table2View.body).includes("Narrowest boundary"));
const forged = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "A", confidence: 1 }, headers: { "x-table-token": `${token1.split(".")[0]}.forged` } });
check("a forged token is rejected", forged.status === 401, forged.body);

console.log("\n7. Console before publication");
const consoleBefore = await call("GET", `/api/workshops/console/${consoleKey}`);
check("console reports counts", consoleBefore.body.counts.locked === 2 && consoleBefore.body.counts.total === 4, consoleBefore.body.counts);
check("no distribution before publication", consoleBefore.body.results.distribution.length === 0);
check("no rationales before publication", !JSON.stringify(consoleBefore.body).includes("Narrowest boundary"));
check("no lock times on the console", !JSON.stringify(consoleBefore.body).includes("lockedAt"));
check("no rank, score or winner anywhere in the payload", !/\b(rank|score|winner|fastest|points)\b/i.test(JSON.stringify(consoleBefore.body)));
check("unknown console key is 404", (await call("GET", "/api/workshops/console/deadbeefdeadbeefdeadbeefdeadbeef")).status === 404);

console.log("\n8. Publish, select and hide");
check("publish before close is refused", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "publish" }, headers: KEY })).status === 409);
check("round closes", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "close" }, headers: KEY })).status === 200);
const admin = await call("GET", `/api/workshops/${sessionId}/admin`, { headers: KEY });
check("admin sees rationales privately", JSON.stringify(admin.body).includes("Narrowest boundary"));
const decisionIds = admin.body.tables.filter((t) => t.decision).map((t) => t.decision.id);
for (const decisionId of decisionIds) {
  await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "select", decisionId, selected: true }, headers: KEY });
}
check("published", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "publish" }, headers: KEY })).status === 200);
const consoleAfter = await call("GET", `/api/workshops/console/${consoleKey}`);
check("distribution appears after publication", consoleAfter.body.results.distribution.some((d) => d.key === "B" && d.count === 1), consoleAfter.body.results.distribution);
check("own action counted separately", consoleAfter.body.results.distribution.some((d) => d.key === "own" && d.count === 1));
check("confidence spread reported", consoleAfter.body.results.confidence.median === 3);
check("two rationales projected", consoleAfter.body.results.rationales.length === 2);
check("rationales are unattributed", !JSON.stringify(consoleAfter.body.results.rationales).includes("Table"));
check("hide works", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "hide" }, headers: KEY })).status === 200);
check("hidden results disappear", (await call("GET", `/api/workshops/console/${consoleKey}`)).body.resultsVisible === false);

console.log("\n9. Reopen one table");
const table1 = admin.body.tables.find((t) => t.tableCode === "1");
check("reopen accepted", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "reopen", teamId: table1.id }, headers: KEY })).status === 200);
const afterReopen = await call("GET", `/api/workshops/${sessionId}/admin`, { headers: KEY });
check("only that table is unlocked", afterReopen.body.tables.find((t) => t.tableCode === "1").decision.isLocked === false && afterReopen.body.tables.find((t) => t.tableCode === "2").decision.isLocked === true);

console.log("\n10. Advance and later rounds");
check("advance to round two", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "advance" }, headers: KEY })).status === 200);
await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "open" }, headers: KEY });
const round2 = await call("GET", `/api/workshops/${joinCode}/state`, { headers: { "x-table-token": token1 } });
check("round two has no options", round2.body.round.options.length === 0);
check("round two draft is empty for this table", round2.body.decision === null);
const r2lock = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { ownAction: "Security lead owns it; isolate the connector.", confidence: 4, lock: true }, headers: { "x-table-token": token1 } });
check("round two locks with own action", r2lock.status === 200 && r2lock.body.decision.isLocked);
check("a round-one option key is refused in round two", (await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { optionKey: "A", confidence: 3 }, headers: { "x-table-token": token2 } })).status === 400);

console.log("\n11. Export and end");
const exported = await call("GET", `/api/workshops/${sessionId}/export`, { headers: KEY });
check("export authenticated only", (await call("GET", `/api/workshops/${sessionId}/export`)).status === 401);
check("export carries decisions", exported.body.decisions.length >= 3, exported.body.decisions?.length);
const exportedRecords = JSON.stringify({ session: exported.body.session, decisions: exported.body.decisions });
check("export has no personal data", !/email|firstName|lastName|participantId/i.test(exportedRecords));
check("export identifies tables by label only", exported.body.decisions.every((d) => /^Table \d+$/.test(d.table)));
check("session ends", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "end" }, headers: KEY })).status === 200);
const afterEnd = await call("PUT", `/api/workshops/${joinCode}/decision`, { body: { ownAction: "late", confidence: 1 }, headers: { "x-table-token": token1 } });
check("table tokens stop working once the session ends", afterEnd.status === 410, afterEnd.body);

console.log("\n12. Reset");
check("reset accepted", (await call("POST", `/api/workshops/${sessionId}/actions`, { body: { action: "reset" }, headers: KEY })).status === 200);
const afterReset = await call("GET", `/api/workshops/${sessionId}/admin`, { headers: KEY });
check("decisions cleared and round one pending", afterReset.body.tables.every((t) => !t.decision) && afterReset.body.session.activeRound === 1 && afterReset.body.rounds[0].state === "pending");

server.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
