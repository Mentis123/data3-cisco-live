const baseUrl = (process.env.DECISION_ROOM_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const adminKey = process.env.DECISION_ROOM_ADMIN_KEY || process.env.ADMIN_KEY;

if (!adminKey) throw new Error("DECISION_ROOM_ADMIN_KEY or ADMIN_KEY is required");

async function call(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(`${response.status} ${typeof body === "string" ? body.slice(0, 120) : body.message}`);
  return { response, body };
}

const json = (body, headers = {}) => ({
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

let sessionId;
try {
  const created = await call("/api/decision-room/sessions", json(
    { name: "Deployment smoke test", variant: "enterprise", tableCount: 2 },
    { "x-admin-key": adminKey },
  ));
  sessionId = created.body.sessionId;
  const { joinCode, displayToken } = created.body;

  const joined = await call("/api/decision-room/join", json({ joinCode, teamCode: "1" }));
  const teamToken = joined.body.teamToken;

  await call(`/api/decision-room/sessions/${sessionId}/actions`, json({ action: "start" }, { "x-admin-key": adminKey }));
  const participant = await call(`/api/decision-room/sessions/${joinCode}/participant`, { headers: { "x-team-token": teamToken } });
  if (participant.body.session.activeRound !== 1) throw new Error("Participant did not receive round one");

  await call(`/api/decision-room/sessions/${joinCode}/decision`, {
    ...json({ roundNo: 1, optionKey: "B", action: "Block suspect paths", acceptedTradeoff: "Selective containment may miss a related path", reversalEvidence: "Evidence of broader access", confidence: 4, lock: true }, { "x-team-token": teamToken }),
    method: "PUT",
  });
  await call(`/api/decision-room/sessions/${sessionId}/actions`, json({ action: "publish" }, { "x-admin-key": adminKey }));
  const consoleView = await call(`/api/decision-room/sessions/${sessionId}/console?displayToken=${encodeURIComponent(displayToken)}`);
  if (consoleView.body.counts.locked !== 1 || consoleView.body.results?.options?.B !== 1) throw new Error("Console did not aggregate the locked response");

  await call(`/api/decision-room/sessions/${sessionId}/actions`, json({ action: "advance" }, { "x-admin-key": adminKey }));
  const reveal = await call(`/api/decision-room/sessions/${joinCode}/participant`, { headers: { "x-team-token": teamToken } });
  if (reveal.body.session.activeRound !== 2) throw new Error("Participant did not receive reveal one");

  const exported = await call(`/api/decision-room/sessions/${sessionId}/export`, { headers: { "x-admin-key": adminKey } });
  if (!String(exported.body).includes("accepted_tradeoff")) throw new Error("CSV export is missing expected fields");
  console.log("Decision Room smoke test passed: create, join, lock, publish, reveal and export.");
} finally {
  if (sessionId) {
    await call(`/api/decision-room/sessions/${sessionId}/actions`, json({ action: "end" }, { "x-admin-key": adminKey })).catch(() => {});
  }
}
