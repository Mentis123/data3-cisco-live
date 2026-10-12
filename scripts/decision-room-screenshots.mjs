// Visual QA for the Riverbend Decision Room: seeds a room through the API and screenshots every screen state.
import { chromium } from "playwright-core";
const OUT = process.argv[2];
const BASE = "http://127.0.0.1:5199";
const API = `${BASE}/api/decision-room`;
const KEY = "rehearsal-facilitator-key-0123456789";
const H = { "Content-Type": "application/json", "x-admin-key": KEY };
const post = (path, body, headers = {}) => fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }).then((r) => r.json());
const act = (id, body) => post(`/sessions/${id}/actions`, body, H);

const room = await post("/sessions", { tableCount: 6 }, H);
const tokens = [];
for (const code of ["1", "2", "3", "4", "5"]) tokens.push((await post("/join", { joinCode: room.joinCode, teamCode: code })).teamToken);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const errors = [];
const desktop = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
async function shot(ctx, url, name, { init, full = false, wait = 1500 } = {}) {
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`${name}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  if (init) await page.addInitScript(init.fn, init.arg);
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await page.close();
}
const tableInit = (i) => ({ fn: ([code, token]) => localStorage.setItem(`decision-room-token-placeholder`, "") || localStorage.setItem(`decision-room-team:${code}`, token), arg: [room.joinCode, tokens[i]] });
const consoleUrl = `/decision-room/console/${room.sessionId}?displayToken=${encodeURIComponent(room.displayToken)}`;
const adminInit = { fn: (k) => localStorage.setItem("decision-room-admin-key", k), arg: KEY };

// Landing + lobby
await shot(mobile, "/decision-room", "01-landing-join", { full: true });
await shot(mobile, `/decision-room/session/${room.joinCode}`, "02-table-lobby", { init: tableInit(0), full: true });
await shot(desktop, consoleUrl, "03-console-lobby");
await shot(desktop, `/decision-room/admin/${room.sessionId}`, "04-admin-lobby", { init: adminInit, full: true });

// Launch
await act(room.sessionId, { action: "launch" });
await shot(desktop, consoleUrl, "05-console-launched", { wait: 6500 });
await shot(mobile, `/decision-room/session/${room.joinCode}`, "06-table-launched", { init: tableInit(0), full: true });

// Start triage; four tables lock, one drafts
await act(room.sessionId, { action: "start" });
await shot(mobile, `/decision-room/session/${room.joinCode}`, "07-table-triage-open", { init: tableInit(4), full: true });
const votes = [
  ["B", "The assistant is usually right and it's 2am.", 3, true],
  ["C", "When the AI summary and the raw logs disagree, the logs win.", 4, true],
  ["C", "Two cited log lines don't exist. That's not noise.", 5, true],
  ["D", "Find out whether this beacon is on anything else before we make noise.", 3, true],
  ["A", "Critical asset, low appetite: page now, apologise later.", 2, false],
];
for (let i = 0; i < votes.length; i += 1) {
  const [optionKey, rationale, confidence, lock] = votes[i];
  await fetch(`${API}/sessions/${room.joinCode}/decision`, { method: "PUT", headers: { "Content-Type": "application/json", "x-team-token": tokens[i] }, body: JSON.stringify({ roundNo: 1, optionKey, rationale, confidence, lock }) });
}
await shot(mobile, `/decision-room/session/${room.joinCode}`, "08-table-locked", { init: tableInit(1), full: true });
await shot(desktop, consoleUrl, "09-console-open");
await shot(desktop, `/decision-room/admin/${room.sessionId}`, "10-admin-open", { init: adminInit, full: true });

// Close, feature two, publish
await act(room.sessionId, { action: "close" });
await shot(mobile, `/decision-room/session/${room.joinCode}`, "11-table-closed", { init: tableInit(1), full: true });
const admin = await fetch(`${API}/sessions/${room.sessionId}/admin`, { headers: H }).then((r) => r.json());
for (const d of admin.decisions.filter((x) => x.isLocked && x.rationale).slice(1, 3)) await act(room.sessionId, { action: "feature", decisionId: d.id, featured: true });
await act(room.sessionId, { action: "publish" });
await shot(desktop, consoleUrl, "12-console-published");
await shot(mobile, `/decision-room/session/${room.joinCode}`, "13-table-published-trap", { init: tableInit(0), full: true });
await shot(mobile, `/decision-room/session/${room.joinCode}`, "14-table-published-groundtruth", { init: tableInit(1), full: true });
await shot(desktop, `/decision-room/admin/${room.sessionId}`, "15-admin-published", { init: adminInit, full: true });

// Inject 3 state for the attack path visuals
for (const r of [2, 3]) { await act(room.sessionId, { action: "advance" }); await fetch(`${API}/sessions/${room.joinCode}/decision`, { method: "PUT", headers: { "Content-Type": "application/json", "x-team-token": tokens[1] }, body: JSON.stringify({ roundNo: r, optionKey: "B", rationale: "x", confidence: 4, lock: true }) }); await act(room.sessionId, { action: "publish" }); }
await act(room.sessionId, { action: "advance" });
await shot(mobile, `/decision-room/session/${room.joinCode}`, "16-table-inject3-open", { init: tableInit(1), full: true });
await shot(desktop, consoleUrl, "17-console-inject3");

// Standalone crisis room
await shot(desktop, "/crisis-room", "18-crisis-room-static");

await browser.close();
console.log("room", room.joinCode, "errors:", errors.length ? errors : "none");
