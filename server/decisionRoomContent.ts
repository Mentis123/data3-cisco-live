/**
 * Riverbend Water & Energy — scenario content for the Decision Room.
 *
 * Mirrors Richard's deck ("When the agent attacks", 27 slides) round for round:
 * Triage, then Injects 1–5, each with the deck's situation lines and A–D options
 * in the deck's order. The narrative consequence each table sees after its round
 * is published is ported from the Riverbend Crisis Room companion.
 *
 * Exported as the pinned `riverbend@1` scenario (see types.ts and scenarios.ts).
 * Everything here is served from the API, and only for the round that is open.
 * Consequences are returned only once the facilitator publishes a round, so no
 * device can read ahead and nothing hints at the "best move" before Richard
 * reveals it on the slide.
 */

import type { MeterDef, OptionKey, RoundContent, Scenario, Stage, StageStatus } from "./decisionRoomTypes.js";

export type MeterKey = "containment" | "service" | "exposure" | "otsafety" | "trust" | "standing" | "cover";
export type Meters = Record<MeterKey, number>;

const STAGES: Stage[] = [
  { id: "foothold", name: "Foothold", sub: "Customer-assist AI agent" },
  { id: "creds", name: "Credentials", sub: "API keys & cloud secrets" },
  { id: "store", name: "Object store", sub: "Backups & infra state" },
  { id: "config", name: "Config service", sub: "1,342 service configs" },
  { id: "data", name: "Billing & CRM", sub: "Customer PII, payments" },
  { id: "gateway", name: "OT gateway", sub: "SCADA / IIoT bridge" },
  { id: "control", name: "Control systems", sub: "Water & grid control" },
];

const METERS: MeterDef[] = [
  { id: "containment", name: "Attacker contained", good: true },
  { id: "service", name: "Service uptime", good: true },
  { id: "exposure", name: "Data exposure", good: false },
  { id: "otsafety", name: "OT safety", good: true },
  { id: "trust", name: "Tooling trust", good: true },
  { id: "standing", name: "External standing", good: true },
  { id: "cover", name: "Insurer cover", good: true },
];

const INITIAL_METERS: Meters = { containment: 8, service: 100, exposure: 0, otsafety: 92, trust: 68, standing: 100, cover: 100 };

const ORGANISATION = {
  name: "Riverbend Water & Energy",
  tagline: "State-owned water and energy utility · 1.4 million customers · critical infrastructure under SOCI",
  estate: "A customer-assist AI agent, M365 Copilot across staff, an AI SOC triage assistant, and a third-party AI chatbot wired into the CRM.",
  holds: "LLM API keys and cloud credentials in app environments; customer PII; concession and payment data; a cloud AI compute budget.",
  reach: "Object store, config service, billing database, the CRM via a SaaS token — and a SCADA/IIoT gateway bridging to water and energy control systems.",
  objective: "Protect customers and critical services, meet your obligations, preserve evidence.",
};

/** The opener Adam plays on the projector before triage: one launch, fixed to the scenario. */
const LAUNCH_LINES = [
  { t: "t+0.0s", text: "foothold · internet-facing customer-assist AI agent", tone: "plain" },
  { t: "t+0.4s", text: "reading environment… API keys & cloud creds located", tone: "sys" },
  { t: "t+2.0s", text: "self-planning next objectives… no human in the loop", tone: "sys" },
  { t: "t+5.0s", text: "// target path: store → config → data → OT gateway", tone: "sys" },
  { t: "t+8.0s", text: "object store reached · a 30-min beacon is now running", tone: "plain" },
  { t: "t+9.5s", text: "[STAGED] customer PII located · encryption & extortion prepared", tone: "er" },
  { t: "t+31s", text: "…but its first move tripped a faint signal in your SOC. The watch is yours.", tone: "sys" },
] as const;

/** The projector's attack path during the launch: stages light up in step with the attacker terminal. */
function launchPath(visible: number): StageStatus[] {
  const p: StageStatus[] = ["secure", "secure", "secure", "secure", "secure", "secure", "secure"];
  if (visible >= 1) p[0] = "compromised";
  if (visible >= 2) p[1] = "compromised";
  if (visible >= 4) { p[2] = "at risk"; p[3] = "at risk"; p[4] = "at risk"; p[5] = "at risk"; }
  if (visible >= 5) p[2] = "compromised";
  if (visible >= 6) p[4] = "compromised";
  return p;
}
const LAUNCH_NOTES = ["", "foothold taken", "credentials harvested", "planning, no human in the loop", "target path mapped", "beacon running", "customer data staged", "a faint signal in the SOC"];

const c = (t: string, d: "up" | "down" | "flag") => ({ t, d });

const ROUNDS: RoundContent[] = [
  {
    roundNo: 1,
    id: "triage",
    seat: "Triage · SOC analyst",
    when: "Thursday 02:10",
    title: "Is this even an incident?",
    prompt: "What is your priority?",
    durationSeconds: 4 * 60,
    situation: [
      "Quiet night shift. Your AI SOC assistant auto-closed a cluster of alerts as ‘benign — routine maintenance job’.",
      "But the raw telemetry doesn’t match its summary: the ‘maintenance’ account is one no one recognises, and two log lines it quotes as evidence don’t exist in the raw logs.",
      "EDR shows a faint 30-minute beacon the assistant never mentioned. Nothing is confirmed.",
      "Nobody is paged yet. The next move is yours.",
    ],
    feed: [
      { kind: "soc", who: "AI SOC assistant", text: "Cluster auto-closed: benign — routine maintenance. No action needed." },
      { kind: "alert", who: "What you notice", text: "The ‘maintenance’ account is unrecognised, two cited log lines don’t exist, and EDR shows a faint 30-minute beacon the assistant never mentioned." },
    ],
    path: ["watched", "secure", "secure", "secure", "secure", "secure", "secure"],
    options: [
      {
        key: "A",
        label: "Raise a full incident and page on-call now, on suspicion",
        consequence: {
          you: "You escalated before you had the full picture.",
          body: "The crisis team spins up fast — but with no confirmed facts yet, the first 30 minutes are spent asking ‘what do we actually have?’. Readiness is high; clarity is not.",
          changes: [c("Crisis team ready", "flag"), c("− Standing (slight)", "down")],
          meters: { containment: 3, standing: -3 },
        },
      },
      {
        key: "B",
        label: "Trust the assistant’s ‘benign’ verdict; note it for day shift",
        consequence: {
          you: "You accepted the ‘benign’ verdict and moved on.",
          body: "The assistant was wrong — the log content that fed it was planted. Five hours pass before anyone looks again. By then the attacker is three systems deeper and the beacon never stopped.",
          changes: [c("− Tooling trust", "down"), c("Attacker advanced to Config", "flag"), c("+ Data exposure", "down"), c("~5 hours lost", "flag")],
          meters: { trust: -30, exposure: 12 },
        },
      },
      {
        key: "C",
        label: "Go to ground truth — rebuild the timeline from raw logs yourself",
        consequence: {
          you: "You distrusted the summary and pulled the raw logs.",
          body: "Ground truth established in 20 minutes: the account is attacker-controlled and the beacon is live. You caught what the assistant missed — and you now have a clean evidence trail.",
          changes: [c("+ Tooling trust", "up"), c("+ Containment", "up"), c("Evidence trail started", "flag")],
          meters: { trust: 14, containment: 6 },
        },
      },
      {
        key: "D",
        label: "Scope quietly — hunt that account and beacon elsewhere first",
        consequence: {
          you: "You went wide before going loud.",
          body: "The beacon appears on two more hosts: this is lateral, not local. You’ve mapped the real blast radius before committing — at the cost of a few minutes.",
          changes: [c("Lateral movement confirmed", "flag"), c("+ Containment", "up"), c("Evidence trail started", "flag")],
          meters: { containment: 4 },
        },
      },
    ],
  },
  {
    roundNo: 2,
    id: "inject1",
    seat: "Inject 1 · SOC analyst",
    when: "Friday 19:34",
    title: "Something is moving at machine speed",
    prompt: "What is your priority?",
    durationSeconds: 4 * 60,
    situation: [
      "It’s real. The customer-assist AI agent host is running 600+ self-narrating commands in 40 minutes — a secrets sweep, internal scans, object-store logins on default passwords.",
      "But some ‘evidence’ is inconsistent: timestamps that don’t line up, a decoy alert pointing at an innocent server. It may be seeding noise to misdirect you.",
      "Isolating this host also severs a monitoring path toward the SCADA/IIoT gateway — you’d lose eyes on the segment that matters most.",
      "It’s Friday 7:34pm. Whatever you do, the attacker will see your response and adapt within seconds.",
    ],
    feed: [
      { kind: "alert", who: "Defender for Cloud", text: "600+ self-narrating commands in 40 min on the AI agent host. Beacon live to an external IP." },
      { kind: "soc", who: "SIEM", text: "A decoy alert is firing on an innocent server. Isolating the real host also blinds your path to the OT gateway." },
    ],
    path: ["compromised", "at risk", "watched", "secure", "secure", "secure", "secure"],
    options: [
      {
        key: "A",
        label: "Isolate the host now and accept the monitoring blind spot",
        consequence: {
          you: "You pulled it off the wire.",
          body: "Beacon dead, foothold contained — the agent can’t adapt around a cut cable. But your sensor path to the OT segment went dark with it. You’re now blind where it matters most.",
          changes: [c("+ Containment", "up"), c("Foothold contained", "flag"), c("OT segment: BLIND", "down")],
          meters: { containment: 34 },
        },
      },
      {
        key: "B",
        label: "Keep it live but put eyes on the OT gateway first",
        consequence: {
          you: "You protected visibility over the crown jewels.",
          body: "The OT gateway is now instrumented — you’ll see the attacker coming. But leaving the agent live cost you: it reached the config service while you wired up sensors.",
          changes: [c("OT gateway: WATCHED", "flag"), c("Attacker reached Config", "down")],
          meters: { containment: 4 },
        },
      },
      {
        key: "C",
        label: "Rotate every credential the host could have seen",
        consequence: {
          you: "You burned the stolen keys.",
          body: "Harvested cloud and object-store credentials are now worthless, closing several paths. One app had a key hard-coded, so a dependent service dropped when you rotated.",
          changes: [c("+ Containment", "up"), c("Credential paths cut", "flag"), c("− Service uptime", "down")],
          meters: { containment: 16, service: -10 },
        },
      },
      {
        key: "D",
        label: "Trust nothing — re-verify the evidence before you act",
        consequence: {
          you: "You refused to be misdirected.",
          body: "The decoy on the innocent server is unmasked — you didn’t waste your one response on it. The real host is confirmed, but the attacker crept forward during the check.",
          changes: [c("Decoy unmasked", "flag"), c("+ Tooling trust", "up"), c("Attacker crept forward", "down")],
          meters: { trust: 6 },
        },
      },
    ],
  },
  {
    roundNo: 3,
    id: "inject2",
    seat: "Inject 2 · Security engineer",
    when: "Friday 20:40",
    title: "Faster than any human can respond",
    prompt: "What is your priority?",
    durationSeconds: 4 * 60,
    situation: [
      "Every manual containment you make, the attacker counters within seconds. You are losing the race.",
      "Your platform offers to hand containment to your autonomous response agent — machine speed, broad privilege, choices you can’t predict.",
      "The attacker is already trying to poison that defensive agent and turn it against you.",
      "And harvested keys are running the attacker’s own agent on your cloud compute.",
    ],
    feed: [
      { kind: "alert", who: "War room", text: "Every manual move is countered within seconds. You cannot keep pace by hand." },
      { kind: "soc", who: "Response platform", text: "Hand off to the autonomous agent? It’s fast, broadly privileged — and the attacker is already feeding it crafted inputs." },
    ],
    path: ["compromised", "compromised", "compromised", "at risk", "secure", "secure", "secure"],
    options: [
      {
        key: "A",
        label: "Unleash the autonomous response agent to match its tempo",
        consequence: {
          you: "You gave a system you can’t predict the keys.",
          body: "It matches the attacker’s tempo and claws back ground fast — then, fed a poisoned input, it quarantines the billing platform by mistake. You won the race and tripped over your own runner.",
          changes: [c("+ Containment", "up"), c("− Service (billing quarantined)", "down"), c("− Tooling trust", "down"), c("Agent: UNBOUNDED", "flag")],
          meters: { containment: 26, trust: -22, service: -18 },
        },
      },
      {
        key: "B",
        label: "Human-on-the-loop: the agent proposes, a human approves",
        consequence: {
          you: "You kept a hand on every action.",
          body: "Clean and accountable — nothing happens you didn’t sanction. But approvals cost seconds, and the attacker reached the customer data tier while you were clicking ‘confirm’.",
          changes: [c("+ Containment", "up"), c("+ Tooling trust", "up"), c("Attacker reached Billing/CRM", "down")],
          meters: { containment: 10, trust: 4, exposure: 10 },
        },
      },
      {
        key: "C",
        label: "Disable the defensive agent — it’s being targeted",
        consequence: {
          you: "You denied the attacker a weapon — and yourself a tool.",
          body: "It can’t be turned against you now. It also isn’t helping: without machine-speed response the attacker surges, reaching the OT gateway.",
          changes: [c("Agent: OFFLINE", "flag"), c("Attacker surged to OT gateway", "down")],
          meters: { containment: -4, trust: 2 },
        },
      },
      {
        key: "D",
        label: "Bound it: let it act, but only on reversible actions",
        consequence: {
          you: "You gave it speed inside a cage.",
          body: "The agent isolates and blocks at machine speed but may never delete, drop or touch OT. You’re back in the race — and because the rules of engagement were explicit, you have an auditable override trail.",
          changes: [c("+ Containment", "up"), c("+ Tooling trust", "up"), c("Agent: BOUNDED", "flag"), c("Override evidence captured", "flag")],
          meters: { containment: 24, trust: 6 },
        },
      },
    ],
  },
  {
    roundNo: 4,
    id: "inject3",
    seat: "Inject 3 · Security manager",
    when: "Saturday 02:00",
    title: "Containment could cause the harm",
    prompt: "What is your priority?",
    durationSeconds: 4 * 60,
    situation: [
      "The attacker has reached the SCADA/IIoT gateway bridging to water and grid control — the real Dragos pattern.",
      "Your playbook says isolate. But on live OT, isolating could trip safety-critical control and harm the public.",
      "Leave it connected and the attacker may reach the controls. IT and OT engineers are at odds.",
      "A video call from your ‘incident commander’ is giving OT orders — but something is off.",
    ],
    feed: [
      { kind: "ot", who: "OT monitoring", text: "Attacker at the SCADA/IIoT gateway, bridging to water-treatment and grid control." },
      { kind: "exec", who: "On the bridge", text: "A video call from your ‘incident commander’ is giving OT instructions. Something about it is off." },
    ],
    path: ["compromised", "compromised", "compromised", "compromised", "at risk", "compromised", "at risk"],
    options: [
      {
        key: "A",
        label: "Isolate the OT segment now — stop the attacker",
        consequence: {
          you: "You cut a live segment blind.",
          body: "The isolation tripped a pressure-control loop. A boil-water precaution is now in force across two suburbs — a real safety event, and the one outcome worse than a breach.",
          changes: [c("OT gateway contained", "flag"), c("SAFETY EVENT", "down"), c("− Service", "down"), c("− Standing", "down")],
          meters: { containment: 14, otsafety: -40, service: -22, standing: -14 },
        },
        variants: [
          {
            when: { round: 2, option: "B" },
            consequence: {
              you: "You cut the segment fast — with eyes open.",
              body: "Because you put eyes on the OT gateway on Friday night, engineers caught the trip risk and rode it out. The attacker’s OT path is cut; a pressure wobble was contained before it reached customers.",
              changes: [c("OT gateway contained", "flag"), c("− OT safety (recovered)", "down")],
              meters: { containment: 14, otsafety: -14 },
            },
          },
        ],
      },
      {
        key: "B",
        label: "Fail OT to a safe manual state first, then isolate",
        consequence: {
          you: "Safety led; containment followed.",
          body: "OT engineers bring treatment and grid to a known-safe manual state, then you isolate cleanly — no trip, no public impact. Slower by design, and the attacker’s OT path is cut without harm.",
          changes: [c("OT: safe manual state", "flag"), c("+ OT safety", "up"), c("+ Containment", "up")],
          meters: { otsafety: 6, containment: 16 },
        },
      },
      {
        key: "C",
        label: "Keep OT running; wall it off at the IT boundary",
        consequence: {
          you: "You chose continuity and held the line.",
          body: "Water and power keep flowing; the IT/OT boundary holds for now. You’ve preserved service on the bet that the attacker hasn’t crossed — a bet you’ll re-check every few minutes.",
          changes: [c("Service preserved", "up"), c("Boundary holding (for now)", "flag")],
          meters: { service: 4, otsafety: -8 },
        },
      },
      {
        key: "D",
        label: "Freeze OT actions until the ‘commander’ is re-verified",
        consequence: {
          you: "You trusted no face you couldn’t authenticate.",
          body: "An out-of-band call-back exposes it: the ‘incident commander’ is a deepfake, and its instruction would have opened an OT valve sequence. You stopped a forged physical action — but the attacker is still at the gateway.",
          changes: [c("Deepfake exposed", "flag"), c("Forged OT action blocked", "up"), c("Gateway still contested", "down")],
          meters: { standing: 6, otsafety: 2 },
        },
      },
    ],
  },
  {
    roundNo: 5,
    id: "inject4",
    seat: "Inject 4 · CISO",
    when: "Saturday 18:00",
    title: "Every clock is a different colour",
    prompt: "What is your priority?",
    durationSeconds: 4 * 60,
    situation: [
      "Configs encrypted (key never stored), databases dropped, 18 GB exfiltrated, a dark-web post live. SOCI and NDB clocks are running.",
      "A new mandatory AI-incident report is also triggered — but the facts are still unverified.",
      "Your insurer signals the AI-driven attack may fall under a new sub-limit — cover could drop to ~10% without proof of human override and governance.",
      "Your LLM provider may be implicated, and paying may now breach sanctions.",
    ],
    feed: [
      { kind: "legal", who: "Legal counsel", text: "SOCI 12h and NDB clocks running. A mandatory AI-incident report is also triggered by the autonomous nature — facts still unverified." },
      { kind: "alert", who: "Insurance broker", text: "The AI-driven attack may fall under a new AI sub-limit — cover could drop to ~10% without proof of a tested human override and governance." },
    ],
    path: ["contained", "contained", "compromised", "compromised", "compromised", "contained", "safe state"],
    options: [
      {
        key: "A",
        label: "Report everything now, on current unverified facts",
        consequence: {
          you: "You chose maximum transparency, fast.",
          body: "Every regulator hears from you inside the hour — including two claims that later prove wrong and can’t be retracted. Honest, but messy, and the correction costs you some credibility.",
          changes: [c("Clocks satisfied", "up"), c("Unretractable errors", "down")],
          meters: { standing: 1 },
        },
      },
      {
        key: "B",
        label: "Prioritise recovery and customers; accept reporting lag",
        consequence: {
          you: "You put the public ahead of the paperwork.",
          body: "Restoration accelerates and customer harm eases — but the statutory silence is noticed. Late reporting is its own offence, and the regulator opens on that, not the breach.",
          changes: [c("+ Service / − Exposure", "up"), c("Statutory breach", "down"), c("− Standing", "down")],
          meters: { service: 14, exposure: -6, standing: -14 },
        },
      },
      {
        key: "C",
        label: "Lock down the governance evidence so cover isn’t voided",
        consequence: {
          you: "You reached for evidence you don’t have.",
          body: "Without a tested human override or a clean audit trail from Friday night, there’s little to show. The insurer applies the AI sub-limit: cover drops to ~10%.",
          changes: [c("Cover cut to ~10%", "down"), c("− Standing", "down")],
          meters: { cover: -70, standing: -4 },
        },
        variants: [
          {
            when: { round: 3, anyOf: ["B", "D"] },
            consequence: {
              you: "You protected the risk transfer.",
              body: "Because you kept a human override and an auditable trail through Friday night, the governance pack writes itself. Your insurer confirms cover stands — a seven-figure difference.",
              changes: [c("Insurer cover held (~100%)", "up"), c("+ Standing", "up")],
              meters: { standing: 4 },
            },
          },
        ],
      },
      {
        key: "D",
        label: "Stabilise the facts, then report in a coordinated sequence",
        consequence: {
          you: "You bought a few hours and reported on evidence.",
          body: "Each duty is met in the right order, documented throughout. Regulators get accurate scope, not the attacker’s claims — and your contemporaneous notes will matter later.",
          changes: [c("Clean, ordered reporting", "up"), c("+ Standing", "up")],
          meters: { standing: 10 },
        },
        variants: [
          {
            when: { round: 1, option: "B" },
            consequence: {
              you: "You sequenced it properly — too late.",
              body: "Your reports are clean and evidence-based, but the SOCI clock ran out during the hours lost on Thursday night. A late statutory notification is now its own finding against you.",
              changes: [c("Evidence-based reports", "up"), c("SOCI window missed", "down")],
              meters: { standing: -12 },
            },
          },
        ],
      },
    ],
  },
  {
    roundNo: 6,
    id: "inject5",
    seat: "Inject 5 · The board",
    when: "Sunday 11:00",
    title: "Do we even keep using this?",
    prompt: "What is your priority?",
    durationSeconds: 4 * 60,
    situation: [
      "The attack used your own AI estate, an AI-faked contractor, and came within one weak password of the water controls.",
      "A deepfaked video of your CEO is ‘reassuring customers’ and moving the market; a minister and the regulator want answers today.",
      "Agentic AI is also what makes the business competitive — pausing it has a real cost; keeping it keeps the risk.",
      "Insurance cover is uncertain, and attacks now out-pace human decision loops. The board must set the stance.",
    ],
    feed: [
      { kind: "press", who: "The reckoning", text: "It used your own AI estate, an AI-faked contractor, and came within one weak password of the water controls." },
      { kind: "press", who: "Market desk", text: "A deepfaked CEO is ‘reassuring’ customers and moving the share price." },
      { kind: "alert", who: "The dilemma", text: "Agentic AI is also what makes you competitive. Pausing has a cost; keeping it keeps the risk. Set the stance." },
    ],
    path: ["contained", "contained", "contained", "contained", "contained", "contained", "safe state"],
    options: [
      {
        key: "A",
        label: "Pause all agentic AI across the business pending review",
        consequence: {
          you: "You removed the surface — and a capability.",
          body: "The board votes to suspend agentic AI pending review. The attack surface that just hurt you shrinks to near zero and the regulator is reassured — but competitors keep shipping while you’re stood down.",
          changes: [c("Risk surface down", "up"), c("Competitive cost", "flag")],
          meters: { standing: 6 },
        },
      },
      {
        key: "B",
        label: "Accept the risk and press on — it’s the cost of doing business",
        consequence: {
          you: "You bet nothing would change.",
          body: "The business keeps its edge and avoids over-correcting — but the surface that was breached is untouched, and the next agent will be faster.",
          changes: [c("Capability retained", "flag"), c("− Standing", "down")],
          meters: { standing: -12 },
        },
        variants: [
          {
            when: { round: 4, option: "A" },
            consequence: {
              you: "You bet nothing would change.",
              body: "After a public safety event, choosing to press on unchanged is a decision the board will struggle to defend to a regulator or a court.",
              changes: [c("Capability retained", "flag"), c("− Standing", "down")],
              meters: { standing: -22 },
            },
          },
        ],
      },
      {
        key: "C",
        label: "Keep agentic AI, but mandate governance and overrides",
        consequence: {
          you: "You chose to keep the capability and cage it.",
          body: "Human override, agent identity and least-privilege, deepfake-resistant comms and a named AI-risk owner are mandated. The intent is right; with little tested evidence from the incident, the board asks to see it proven within 90 days.",
          changes: [c("Governance mandated", "flag"), c("+ Standing", "up")],
          meters: { standing: 6 },
        },
        variants: [
          {
            when: { round: 3, anyOf: ["B", "D"] },
            consequence: {
              you: "You chose to keep the capability and cage it.",
              body: "Human override, agent identity and least-privilege, deepfake-resistant comms and a named AI-risk owner — and you can point to a night where exactly those controls held. The board backs a resilient, not a retreating, Riverbend.",
              changes: [c("Governance mandated", "flag"), c("+ Standing (proven)", "up")],
              meters: { standing: 14 },
            },
          },
        ],
      },
      {
        key: "D",
        label: "Get ahead of it: regulator, market and an independent review",
        consequence: {
          you: "You took the narrative back.",
          body: "An honest account, an independent review and — critically — pre-authenticated executive channels. The deepfaked CEO loses its audience, and the minister hears it from you first.",
          changes: [c("Narrative reclaimed", "up"), c("Deepfake neutralised", "flag")],
          meters: { standing: 10 },
        },
      },
    ],
  },
];

/** Richard's strongest answer per round, from the deck's speaker notes. Facilitator report only; never sent to a table. */
const BEST_MOVE: Record<number, OptionKey> = { 1: "C", 2: "A", 3: "D", 4: "B", 5: "D", 6: "C" };

/**
 * Riverbend, revision 1: the customer-tested V1 (CISO Basecamp) content, and the
 * content every room created before scenario pinning ran — including the early
 * Agent 0 placeholder rooms. Frozen: never change what a choice here means.
 */
export const RIVERBEND: Scenario = {
  key: "riverbend@1",
  family: "riverbend",
  revision: "1",
  status: "live",
  brand: {
    kicker: "WHEN THE AGENT ATTACKS · RIVERBEND",
    short: "Riverbend",
    reportTitle: "When the agent attacked Riverbend",
    pathTitle: "Riverbend · attack path",
    lobby: { title: "Monitoring mode", hint: "Read the printed brief. Agree who speaks for the table. Adam will open the first round." },
    launched: { title: "Something tripped a faint signal in the SOC.", body: "Nothing is confirmed. Stand by for triage." },
    ended: { title: "The room has closed.", body: "Thank you. Take one control to test, an owner and a date back with you." },
    consoleLobby: "All systems nominal.",
    consoleLaunched: "Machine speed.",
    reportNote: "Where each table’s Riverbend finished after replaying its six calls through the Crisis Room consequences.",
    reportMode: "best-move",
  },
  organisation: ORGANISATION,
  launch: {
    profileTitle: "The adversary",
    notePrefix: "mirrors",
    profile: [
      { label: "Objective", value: "Encrypt, exfiltrate, extort", note: "JADEPUFFER" },
      { label: "Entry point", value: "Exposed AI agent", note: "Langflow RCE" },
      { label: "Autonomy", value: "Fully autonomous", note: "JADEPUFFER" },
    ],
    profileHint: "Fictional and narrative only. No tools, no code, no exploit steps — this exists to show how cheap and modular these choices have become.",
    terminal: "agent@riverbend — autonomous",
    lines: LAUNCH_LINES.map((line) => ({ ...line })),
    steps: LAUNCH_NOTES.map((note, visible) => ({ note, path: launchPath(visible) })),
  },
  stages: STAGES,
  meters: METERS,
  initialMeters: INITIAL_METERS,
  rounds: ROUNDS,
  bestMove: BEST_MOVE,
  runPlan: {
    totalMinutes: 90,
    decideMinutes: 4,
    // Minutes from the start. Deck timings, with Inject 5's overlap with the debrief normalised.
    segments: [
      { key: "open", label: "Opening", from: 0, to: 17, slides: "slides 1–8" },
      { key: "launch", label: "Riverbend · launch", from: 17, to: 18, slides: "slide 9" },
      { key: "r1", label: "Triage", from: 18, to: 25, slides: "slides 10–11" },
      { key: "r2", label: "Inject 1", from: 25, to: 33, slides: "slides 12–13" },
      { key: "r3", label: "Inject 2", from: 33, to: 41, slides: "slides 14–15" },
      { key: "r4", label: "Inject 3", from: 41, to: 50, slides: "slides 16–17" },
      { key: "r5", label: "Inject 4", from: 50, to: 59, slides: "slides 18–19" },
      { key: "r6", label: "Inject 5", from: 59, to: 68, slides: "slides 20–21" },
      { key: "close", label: "Debrief & close", from: 68, to: 90, slides: "slides 22–27" },
    ],
    advice: {
      openingBehind: "Move through the opening slides faster and launch.",
      closingBehind: "Cut the table discussion (slide 25) and go to the close.",
      roundBehind: "Keep option reviews to 2 minutes and move on after one comment from the room.",
      openingTighten: "Shorten the landscape slides and get to Riverbend.",
      roundTighten: "Take one comment per round, then Next.",
    },
    closeMilestones: [
      { until: 77, text: "On schedule. Protect (slide 24) by {74}, table discussion by {77}, close by {83}." },
      { until: 83, text: "On schedule. Move to the close (slide 26) by {83}." },
    ],
  },
};
