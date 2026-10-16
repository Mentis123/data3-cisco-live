/**
 * Ironvale Mining — the Agent 0 mining edition of the Decision Room.
 *
 * Revision 0.1. PREVIEW content pending Rich/Scott review: the options,
 * consequences, evidence and facilitator preferences follow
 * docs/agent-0/agent-0-mining-concept-v0.1.md and are proposals, not an answer
 * key. Every organisation, host, identity, ticket and alert here is synthetic
 * exercise material; nothing is customer data or a claim about a real
 * deployment. Product behaviour is described only as far as the concept's
 * source register supports it, and must be rechecked before publication.
 *
 * Shape: six rounds (triage + five injects), each with a self-contained
 * briefing, a reveal shown after publication, and facilitator-only guidance.
 * Outcomes are driven by named simulation facts (see `facts`), not meters. The
 * state panel is an exercise model, never telemetry. Earlier choices change
 * later evidence and consequences through `variants` and `pathVariants`.
 * No choice causes a safety incident, forced encryption or a fixed quantity of
 * data loss.
 */
import type {
  Change, Condition, Consequence, Evidence, FactDef, OptionContent, RoundContent, Scenario, StageStatus,
} from "./decisionRoomTypes.js";

/* ------------------------------------------------------------------ helpers */

const c = (t: string, d: Change["d"]): Change => ({ t, d });
const F = (fact: string, ...anyOf: string[]): Condition => ({ fact, anyOf });
const R = (round: number, option: string): Condition => ({ round, option });
const RA = (round: number, ...anyOf: string[]): Condition => ({ round, anyOf });
const ALL = (...all: Condition[]): Condition => ({ all });

const E = (
  source: string, at: string, scope: string, observation: string, implication: string,
  certainty: Evidence["certainty"] = "confirmed", kind: Evidence["kind"] = "evidence",
): Evidence => ({ source, at, scope, observation, implication, kind, certainty });

const QUESTIONS = ["What supported the process?", "What was missing?", "Who owns the improvement?"];

/** Generates one path variant for every combination of the given fact groups. */
type Dim = { fact: string; groups: string[][] };
function combos(dims: Dim[], make: (pick: number[]) => StageStatus[]): { when: Condition; path: StageStatus[] }[] {
  const out: { when: Condition; path: StageStatus[] }[] = [];
  const walk = (d: number, picked: number[]) => {
    if (d === dims.length) {
      out.push({ when: ALL(...picked.map((g, i) => F(dims[i].fact, ...dims[i].groups[g]))), path: make(picked) });
      return;
    }
    dims[d].groups.forEach((_, g) => walk(d + 1, [...picked, g]));
  };
  walk(0, []);
  return out;
}

const HOST: Dim = { fact: "host", groups: [["active"], ["restricted"], ["isolated"]] };
const IDN: Dim = { fact: "identity", groups: [["live"], ["signins-blocked"], ["contained", "broad-rotation"]] };
const CON: Dim = { fact: "contractor", groups: [["unknown", "monitored"], ["active"], ["restricted"], ["uplink-cut"]] };
const SITE: Dim = { fact: "site", groups: [["unverified"], ["stable"], ["safe-state"]] };
const DATA: Dim = { fact: "data", groups: [["assessing"], ["attempts-blocked"], ["access-confirmed"]] };

const hostS = (h: number): StageStatus => (["compromised", "watched", "contained"] as StageStatus[])[h];
const idS = (i: number): StageStatus => (["compromised", "at risk", "contained"] as StageStatus[])[i];
const brokerS = (cn: number, i: number): StageStatus =>
  cn === 1 ? "compromised" : cn === 2 || cn === 3 ? "contained" : i === 0 ? "at risk" : "watched";
const otS = (cn: number): StageStatus => (cn === 3 ? "blind" : cn === 1 ? "at risk" : "watched");
const plantS = (s: number, cn: number): StageStatus => (s === 2 ? "safe state" : cn === 1 ? "watched" : "secure");

/** Identity not yet closed: fresh use or non-Entra access may still work. */
const ACTIVE_PATH = F("identity", "live", "signins-blocked");
const WEAK = F("identity", "live");
const STRONG = ALL(F("identity", "contained", "broad-rotation"), F("host", "isolated", "restricted"));

/* ------------------------------------------------------------------- facts */

const FACTS: FactDef[] = [
  { id: "host", name: "Integration host", initial: "active", values: {
    active: { label: "running, not restricted", tone: "bad" },
    restricted: { label: "outbound path restricted", tone: "warn" },
    isolated: { label: "isolated", tone: "good" },
  } },
  { id: "identity", name: "Agent 0 service identity", initial: "live", values: {
    live: { label: "still usable", tone: "bad" },
    "signins-blocked": { label: "new sign-ins blocked; issued access unverified", tone: "warn" },
    contained: { label: "restricted, credential rotated, tested", tone: "good" },
    "broad-rotation": { label: "all platform credentials rotated; dependencies failing", tone: "warn" },
  } },
  { id: "automation", name: "Automated response authority", initial: "not-set", values: {
    "not-set": { label: "not yet decided", tone: "neutral" },
    bounded: { label: "listed IT actions, audited; site actions need approval", tone: "good" },
    "enrich-only": { label: "enrichment only; containment is manual", tone: "warn" },
    manual: { label: "analyst approval for every action", tone: "warn" },
    unbounded: { label: "wide scope on all related assets", tone: "bad" },
  } },
  { id: "contractor", name: "Contractor access path", initial: "unknown", values: {
    unknown: { label: "status unknown", tone: "warn" },
    active: { label: "unauthorised session open", tone: "bad" },
    restricted: { label: "broker restricted with the site lead", tone: "good" },
    monitored: { label: "connected, under observation", tone: "warn" },
    "uplink-cut": { label: "wider uplink cut; visibility reduced", tone: "warn" },
  } },
  { id: "site", name: "Processing plant", initial: "unverified", values: {
    unverified: { label: "state not independently confirmed", tone: "warn" },
    stable: { label: "confirmed stable by the site", tone: "good" },
    "safe-state": { label: "in the site's controlled safe state", tone: "neutral" },
  } },
  { id: "data", name: "Data access", initial: "assessing", values: {
    assessing: { label: "being assessed", tone: "warn" },
    "attempts-blocked": { label: "attempts blocked or historical", tone: "good" },
    "access-confirmed": { label: "completed access confirmed", tone: "bad" },
  } },
  { id: "recovery", name: "Recovery", initial: "not-started", values: {
    "not-started": { label: "not started", tone: "neutral" },
    unvalidated: { label: "restored without isolated validation", tone: "bad" },
    validated: { label: "validated in isolation; accepted by checks", tone: "good" },
    held: { label: "held pending assessment", tone: "warn" },
    rebuilding: { label: "rebuilding from known-good source", tone: "neutral" },
  } },
  { id: "mandate", name: "Agent 0 mandate", initial: "pending", values: {
    pending: { label: "awaiting the board", tone: "neutral" },
    gated: { label: "staged return, gated on named owners", tone: "good" },
    suspended: { label: "suspended pending independent review", tone: "neutral" },
    returned: { label: "returned to former role", tone: "bad" },
    replatform: { label: "to be replaced on a new platform", tone: "warn" },
  } },
];

/* ------------------------------------------------------------------ rounds */

const triage: RoundContent = {
  roundNo: 1,
  id: "triage",
  seat: "Triage · Duty SOC analyst",
  when: "Friday 18:40",
  title: "Whose version of events do you trust?",
  prompt: "What do you prioritise before accepting the summary or expanding containment?",
  durationSeconds: 300,
  situation: [
    "Friday 18:40. The night shift is waiting for its maintenance work packs.",
    "Sentinel has linked an unfamiliar sign-in by Agent 0's application identity to its integration host, agent0-int-01.",
    "The SOC summary says scheduled maintenance, but cites no change ticket.",
    "Defender sees an unexpected process on that host contacting an unfamiliar address. Nothing suggests the plant is affected.",
  ],
  feed: [
    { kind: "alert", who: "Microsoft Sentinel (synthetic)", text: "Incident 1: unusual application sign-in correlated with agent0-int-01." },
    { kind: "soc", who: "SOC summary workflow", text: "Likely scheduled vendor maintenance. No change ticket cited." },
  ],
  path: ["watched", "at risk", "at risk", "secure", "secure", "secure", "secure"],
  options: [
    {
      key: "A",
      label: "Declare a major incident and isolate the integration host straight away",
      cost: "Removes one active path quickly; maintenance coordination stops before scope is known.",
      consequence: {
        you: "You declared a major incident and isolated agent0-int-01.",
        body: "The unfamiliar process loses its route out within minutes and the host's state is preserved for investigation. Work-pack requests stop and the night shift is told to use the manual request form. You acted before the scope was known, so whether the application identity is being used elsewhere is still open.",
        changes: [c("Host isolated", "flag"), c("Maintenance requests halted", "down"), c("Identity use still unchecked", "flag")],
        sets: { host: "isolated" },
      },
    },
    {
      key: "B",
      label: "Get the service owner's change confirmation before changing any access",
      cost: "Preserves a possibly legitimate service; relies on a callback while suspicious activity continues.",
      consequence: {
        you: "You waited for the service owner to confirm the change.",
        body: "The owner cannot be reached for 25 minutes. The unfamiliar process keeps running and the application identity signs in again at 18:52. Maintenance requests keep flowing, and nobody has yet checked the source events for themselves. Nothing shows the plant is affected.",
        changes: [c("Host still running", "flag"), c("Time spent on a callback", "down"), c("Maintenance requests continue", "up")],
        sets: { host: "active" },
      },
    },
    {
      key: "C",
      label: "Escalate provisionally, check the source events and restrict the suspicious outbound path",
      cost: "Adds an analyst task and may interrupt the integration; gives a bounded, evidence-led start.",
      consequence: {
        you: "You escalated provisionally, checked the source events and blocked the outbound path.",
        body: "The sign-in and the process both exist in the source logs, and the summary's claim has no record behind it. The unfamiliar destination is blocked at the host, which keeps serving internal requests. The on-call lead is warned and has a clear basis to decide the next step. The identity question is still open.",
        changes: [c("Outbound path restricted", "flag"), c("Events verified at source", "up"), c("On-call lead informed", "up")],
        sets: { host: "restricted" },
      },
    },
    {
      key: "D",
      label: "Put Agent 0 into read-only mode and investigate its identity before isolating the host",
      cost: "Limits what the business agent can write; a separately compromised host stays active.",
      consequence: {
        you: "You set Agent 0 to read-only and began looking at its identity.",
        body: "Agent 0 can no longer create or change maintenance requests, which limits what a misused agent could write. The unexpected process is on the host, not in the agent, and it carries on. You have bought time to read the identity's sign-in history, but the host is still running.",
        changes: [c("Agent 0 writes stopped", "flag"), c("Host still running", "flag"), c("Identity review begun", "up")],
        sets: { host: "active" },
      },
    },
  ],
  briefing: {
    role: "You are the duty SOC analyst in Perth. You can classify the incident, escalate to the on-call lead and request protective actions on IT assets. You cannot change plant systems.",
    horizon: "Next ten minutes",
    changed: "At 18:31 an unfamiliar sign-in used the identity Agent 0 runs under. At 18:36 Defender saw an unexpected process on agent0-int-01 contact an address nobody recognises. Agent 0 is still building work packs for the night shift. A configured SOC summary workflow calls this scheduled maintenance but cites no change record. Nothing shows the plant is affected.",
    evidence: [
      E("Microsoft Sentinel · incident timeline", "18:31 event · 18:40 seen", "agent0-int-01 and Agent 0 application identity",
        "An application sign-in from an unfamiliar address is linked to the Agent 0 integration host.",
        "The two events probably belong together. That is correlation, not proof of intent.", "partial"),
      E("Defender for Endpoint · process and network", "18:36 event · 18:39 seen", "agent0-int-01 (Azure VM)",
        "An unexpected process opened a connection to an unfamiliar destination.",
        "Something on the host is behaving oddly. It does not say who started it."),
      E("SOC summary workflow (interpretation)", "18:38", "Incident 1 summary",
        "Calls the activity scheduled maintenance. The citation for its change ticket is missing.",
        "A reading of the evidence, not evidence. It cannot be checked until the source is found.", "unverified", "interpretation"),
    ],
    unknown: "Whether anyone approved this. The change record cannot be found, and the service owner has not yet been reached.",
    stakes: "The night shift's work packs depend on Agent 0. Isolating it delays them. Leaving it running risks wider access to documents and credentials.",
    parallel: "Whatever you choose: keep the original alerts, tell the on-call lead, and leave plant systems alone.",
    controls: [
      { product: "Microsoft Sentinel", capability: "Brings alerts and sign-ins into one incident timeline", limit: "Only as complete as the connected data; correlation is not intent", owner: "SOC lead" },
      { product: "Defender for Endpoint", capability: "Shows host activity; can isolate a device or collect evidence", limit: "Acts on the host only; does not cancel access already granted elsewhere", owner: "Duty analyst, with on-call approval" },
      { product: "SOC summary workflow (fictional Security Copilot setup)", capability: "Drafts a plain-language reading of the evidence", limit: "Its output is an interpretation, only as good as the sources it cites", owner: "SOC lead" },
    ],
    glossary: [
      { term: "Application sign-in", meaning: "A program, not a person, proving who it is to Microsoft Entra. Agent 0 does this to reach its data." },
      { term: "Isolating a host", meaning: "Cutting a machine off the network so it cannot be used, while keeping it available to investigate." },
      { term: "Interpretation", meaning: "Someone's or something's reading of the evidence. Useful, but checked against the source." },
    ],
  },
  reveal: {
    boundary: "Sentinel gathered the evidence and Defender added a host observation. The summary offered an interpretation. None of them classified the incident or authorised an action; people did.",
    lesson: "The decision was how much to trust a summary with no source behind it. Tools supplied events, and the process (checking at source, escalating, a bounded block) turned those events into a defensible step. The gap to look for is whether anyone can show where each claim in a summary came from.",
    questions: QUESTIONS,
  },
  guidance: {
    preferred: "C",
    conditions: "Two independent suspicious events, a missing change record and no sign of harm to people or the plant.",
    alternative: "A wins if fresh evidence shows imminent harm or active spread. B is defensible only if the callback is fast and a stop condition is set.",
    changeEvidence: "A confirmed change record would favour B. Evidence of data leaving or of a second host would favour A.",
    notes: [
      "Product/process lesson: Sentinel brings evidence together, Defender contributes the endpoint view, Security Copilot can help analysis. None removes the analyst's duty to test the evidence. The summary workflow is a fictional configuration; do not claim a named Microsoft agent routinely fabricates and closes this class of incident. [S1, S2]",
      "Do not imply that checking logs always outranks urgent containment. A is a strong answer if the room can name what justifies it.",
      "Review for Rich: is the threshold and the bounded action credible? What one fact would justify isolating the host at once?",
    ],
  },
};

const inject1: RoundContent = {
  roundNo: 2,
  id: "inject1",
  seat: "Inject 1 · Identity engineer",
  when: "Friday 19:00",
  title: "Stopping an agent is not stopping its credentials",
  prompt: "Which containment boundary do you authorise now?",
  durationSeconds: 300,
  situation: [
    "19:00. The host has used spn-agent0-ops to get tokens and read a vault secret for the old maintenance connector.",
    "That identity can reach more storage than its work needs, and Agent 0 is not in any governed agent inventory.",
    "Stopping the host does not by itself recall tokens already issued or a copied credential.",
    "The site can run on manual work requests for a limited time.",
  ],
  feed: [
    { kind: "alert", who: "Entra sign-in log (synthetic)", text: "spn-agent0-ops signed in again after the first alert." },
    { kind: "soc", who: "Key Vault audit (synthetic)", text: "Secret kv-agent0-legacy-connector read at 18:33 by spn-agent0-ops." },
  ],
  path: ["watched", "watched", "compromised", "at risk", "watched", "secure", "secure"],
  pathVariants: combos([HOST], ([h]) => [
    "watched", hostS(h), h === 0 ? "compromised" : "at risk", h === 0 ? "at risk" : "watched",
    h === 0 ? "watched" : "secure", "secure", "secure",
  ]),
  options: [
    {
      key: "A",
      label: "Restrict spn-agent0-ops and rotate the exposed connector credential with the service owner",
      cost: "Interrupts the integration; closes identity and downstream access, and you test that it worked.",
      consequence: {
        you: "You restricted the principal and rotated the credential with its owner.",
        body: "New sign-ins by spn-agent0-ops fail, the connector is re-keyed, and your test shows the new secret works and the old one is refused. The legacy connector is down until cutover is finished, so maintenance requests move to the manual form. A copy of the old secret held elsewhere is now useless; tokens issued before the restriction can stay valid until they expire, so the sign-in and resource logs stay under watch.",
        changes: [c("Principal restricted", "flag"), c("Credential rotated and tested", "up"), c("Connector down; manual requests", "down")],
        sets: { identity: "contained" },
      },
      variants: [
        {
          when: RA(1, "B", "D"),
          consequence: {
            you: "You restricted the principal and rotated the credential with its owner.",
            body: "The host was still running, and at 19:06 it tried the old secret again and was refused. That attempt is your proof the rotation took effect. The legacy connector is down until cutover, so maintenance requests move to the manual form.",
            changes: [c("Principal restricted", "flag"), c("Old secret refused at 19:06", "up"), c("Connector down; manual requests", "down")],
            sets: { identity: "contained" },
          },
        },
      ],
    },
    {
      key: "B",
      label: "Disable Agent 0's front end and leave the shared connector running",
      cost: "Keeps established maintenance integrations available; stolen access may survive the front-end shutdown.",
      consequence: {
        you: "You disabled Agent 0's front end and left the connector running.",
        body: "Staff can no longer talk to Agent 0, and maintenance integrations carry on. The identity and the connector credential were not touched. At 19:08 spn-agent0-ops signs in successfully from an address that is not the host, so the access did not depend on the front end at all.",
        changes: [c("Front end off", "flag"), c("Integrations keep running", "up"), c("Fresh use at 19:08", "down")],
        sets: { identity: "live" },
      },
      variants: [
        {
          when: R(1, "A"),
          consequence: {
            you: "You disabled Agent 0's front end and left the connector running.",
            body: "The host was already isolated, so the shutdown changes little. The identity and connector credential were not touched, and at 19:08 spn-agent0-ops signs in again from an address that is not the host. Isolating the host did not close the identity.",
            changes: [c("Front end off (little effect)", "flag"), c("Fresh use at 19:08", "down"), c("Credential still valid", "down")],
            sets: { identity: "live" },
          },
        },
      ],
    },
    {
      key: "C",
      label: "Rotate every maintenance-platform credential at once",
      cost: "Widest coverage; increases site-wide dependency failures and recovery coordination.",
      consequence: {
        you: "You rotated every maintenance-platform credential.",
        body: "The copied credential and every other platform secret are replaced, so whatever was taken is useless. Several dependent integrations stop at once, including links to the planner and the contractor ticketing system, and each now needs a new secret and a test. You closed the identity question and opened a long coordination job.",
        changes: [c("All credentials replaced", "up"), c("Many integrations failing", "down"), c("Long recovery coordination", "flag")],
        sets: { identity: "broad-rotation" },
      },
    },
    {
      key: "D",
      label: "Block new sign-ins for the principal, then observe before rotating shared secrets",
      cost: "Smaller immediate business impact; leaves already-issued and non-Entra access uncertain.",
      consequence: {
        you: "You blocked new sign-ins and decided to watch before rotating.",
        body: "New sign-ins by spn-agent0-ops are refused and the connector keeps working. At 19:10 one request still succeeds on a token issued earlier, and the vault secret is unchanged, so a copy of it would work in any case. You have narrowed the problem without proving it closed.",
        changes: [c("New sign-ins blocked", "flag"), c("Issued token still accepted", "down"), c("Connector keeps running", "up")],
        sets: { identity: "signins-blocked" },
      },
      variants: [
        {
          when: R(1, "A"),
          consequence: {
            you: "You blocked new sign-ins and decided to watch before rotating.",
            body: "With the host already isolated, the next few minutes look clean, which is reassuring but not proof. A token issued earlier is still valid until it expires, and the connector credential is unchanged, so it remains a separate path you have not closed.",
            changes: [c("New sign-ins blocked", "flag"), c("Quiet, but unproven", "flag"), c("Connector credential unchanged", "down")],
            sets: { identity: "signins-blocked" },
          },
        },
      ],
    },
  ],
  briefing: {
    role: "You are the identity and security engineer. You can restrict service identities and, with the service owner, rotate secrets. You cannot change plant systems.",
    horizon: "Until the service owner can cut over",
    changed: "Agent 0's integration host got tokens as spn-agent0-ops and read a vault secret used by the old maintenance connector. The principal can reach more storage than its work needs, and Agent 0 is not registered in any governed agent inventory. Your last choice changed what the host can still do, but not what the identity or a copied credential can do. The site can run on manual work requests for a while.",
    evidence: [
      E("Microsoft Entra · sign-in log", "18:31 to 18:55", "spn-agent0-ops (single-tenant service principal)",
        "Sign-ins from the host at 18:31 and 18:55. The identity is a conventional app registration, not a managed or agent identity.",
        "Restricting the host did not stop the identity being used. The wrong control would not help."),
      E("Azure Key Vault · secret audit", "18:33", "kv-agent0-legacy-connector",
        "spn-agent0-ops read the connector secret once. No later reads.",
        "Anyone holding a copy can use it, wherever they are, until it changes."),
      E("Ownership and dependency record", "Updated 17:10", "Maintenance connector",
        "The connector depends on that secret. A manual work-request process can cover up to 12 hours.",
        "You can interrupt it safely for a short time. Someone must own the cutover.", "partial"),
    ],
    unknown: "Whether the copied credential has been used elsewhere, and whether any already-issued tokens are still usable.",
    stakes: "Stopping the identity interrupts maintenance coordination. Leaving it live may leave the credential working long after Agent 0 is off.",
    parallel: "Whatever you choose: log what was read, keep the sign-in records, tell the incident lead, and keep the manual fallback running.",
    controls: [
      { product: "Entra Workload ID with Conditional Access for workload identities", capability: "Can block sign-ins by a single-tenant service principal", limit: "Single-tenant service principals only; not managed identities or external API keys; needs Workload ID premium licensing; does not revoke tokens already issued", owner: "Identity engineer" },
      { product: "Azure Key Vault", capability: "Holds the secret, logs reads, lets the owner rotate it", limit: "Cannot recall a copy; rotation needs every consumer updated", owner: "Service owner with identity engineer" },
      { product: "Entra Agent ID and Microsoft Agent 365", capability: "Register agents, name a sponsor, govern access over their lifetime", limit: "Agent 0 is not registered today, so there is nothing yet to act on there", owner: "Agent sponsor (unassigned)" },
    ],
    glossary: [
      { term: "Service principal", meaning: "An identity for an application. Spn-agent0-ops is an ordinary one, set up by hand." },
      { term: "Token", meaning: "A short-lived pass issued after a sign-in. Blocking new sign-ins does not recall passes already handed out." },
      { term: "Rotating a secret", meaning: "Replacing a password-like value so an old copy stops working." },
    ],
    variants: [
      {
        when: R(1, "A"),
        changed: "The host is isolated, but spn-agent0-ops can still be used from outside it. It got tokens and read a vault secret for the old maintenance connector before isolation. The principal can reach more storage than its work needs, and Agent 0 is not in any governed agent inventory. The site can run on manual work requests for a while.",
        evidence: [
          E("Microsoft Entra · sign-in log", "18:31 to 18:44", "spn-agent0-ops (single-tenant service principal)",
            "Last successful sign-in at 18:44, just before isolation. Tokens issued then may remain valid until they expire.",
            "The host is quiet. The identity itself is not closed.", "partial"),
          E("Azure Key Vault · secret audit", "18:33", "kv-agent0-legacy-connector",
            "spn-agent0-ops read the connector secret once, before isolation.",
            "Anyone holding a copy can use it from anywhere until it changes."),
          E("Ownership and dependency record", "Updated 17:10", "Maintenance connector",
            "The connector depends on that secret. A manual work-request process can cover up to 12 hours.",
            "You can interrupt it safely for a short time. Someone must own the cutover.", "partial"),
        ],
      },
      {
        when: RA(1, "B", "D"),
        changed: "The host is still running and keeps using spn-agent0-ops. It has read a vault secret for the old maintenance connector. The principal can reach more storage than its work needs, and Agent 0 is not in any governed agent inventory. Your last choice did not stop the host's use of the identity. The site can run on manual work requests for a while.",
        evidence: [
          E("Microsoft Entra · sign-in log", "18:31 to 18:58", "spn-agent0-ops (single-tenant service principal)",
            "Repeated successful sign-ins from the host at 18:31, 18:52 and 18:58.",
            "The identity is being used right now. Stopping the host alone is not enough."),
          E("Azure Key Vault · secret audit", "18:33 and 18:57", "kv-agent0-legacy-connector",
            "The connector secret was read at 18:33 and again at 18:57.",
            "More than one read raises the chance a copy exists."),
          E("Ownership and dependency record", "Updated 17:10", "Maintenance connector",
            "The connector depends on that secret. A manual work-request process can cover up to 12 hours.",
            "You can interrupt it safely for a short time. Someone must own the cutover.", "partial"),
        ],
      },
    ],
  },
  reveal: {
    boundary: "Conditional Access for workload identities can block new sign-ins by this single-tenant service principal. It does not recall tokens already issued, and it does not cover managed identities or every external credential. Key Vault records the read but cannot recall a copy.",
    lesson: "The decision was where to draw the containment line: the front end, the identity, the secret or everything. Workload ID, Conditional Access and Key Vault each address one piece, and each is only useful if someone then tests that access has stopped. The visible gap is that nobody owns Agent 0 as an agent.",
    questions: QUESTIONS,
  },
  guidance: {
    preferred: "A",
    conditions: "A service owner is available to rotate and a manual fallback exists. The verification step (test the old secret fails) is part of the answer.",
    alternative: "C is right if you cannot tell which secrets the identity could read. D is a reasonable first ten minutes if the dependency is critical, if rotation is then scheduled.",
    changeEvidence: "Evidence the identity read more than one secret would favour C. A critical dependency with no fallback would favour D first.",
    notes: [
      "spn-agent0-ops is a conventional single-tenant service principal. It is not a managed identity and not an Entra agent identity. Do not present Agent ID as an emergency switch. [S3-S6]",
      "Blocking new sign-ins is not revocation of issued tokens or of a copied non-Entra credential. Stress the verification step.",
      "Review for Scott: do the product roles and their limits explain themselves without a product quiz?",
    ],
  },
};

const inject2: RoundContent = {
  roundNo: 3,
  id: "inject2",
  seat: "Inject 2 · SOC lead",
  when: "Friday 19:15",
  title: "What may act without asking you?",
  prompt: "What response authority do you delegate for this window?",
  durationSeconds: 300,
  situation: [
    "19:15. Analysts are handling repeated activity from identities and devices tied to the incident.",
    "A configured Sentinel playbook can enrich evidence and contain listed IT assets. Defender XDR may also apply its own supported disruption.",
    "A proposed extension would let the playbook reach the contractor broker and an engineering workstation. Neither is approved.",
    "A contractor-supplied text excerpt has appeared in an AI recommendation with no source.",
  ],
  feed: [
    { kind: "soc", who: "Sentinel playbook (synthetic)", text: "Extension request: add contractor-broker-01 and eng-ws-02 as containment targets." },
    { kind: "alert", who: "Analyst queue", text: "Repeated activity linked to the incident is waiting for decisions." },
  ],
  path: ["watched", "watched", "at risk", "watched", "at risk", "secure", "secure"],
  pathVariants: combos([HOST, IDN], ([h, i]) => [
    "watched", hostS(h), idS(i), i === 0 ? "at risk" : "watched", i === 0 ? "at risk" : "watched", "secure", "secure",
  ]),
  options: [
    {
      key: "A",
      label: "Require analyst approval for every containment action",
      cost: "Strong direct oversight; limited staffing slows repetitive IT response.",
      consequence: {
        you: "You required analyst approval for every action.",
        body: "Each action has a named person behind it and nothing fires on a wrong association. The queue grows, though, and repetitive isolations wait for an analyst. The audit trail is clean and the response is slower than it needs to be.",
        changes: [c("Every action approved", "up"), c("Queue growing", "down"), c("Clean audit trail", "up")],
        sets: { automation: "manual" },
      },
      variants: [
        {
          when: WEAK,
          consequence: {
            you: "You required analyst approval for every action.",
            body: "With the identity still usable, new activity keeps arriving. Each item waits for an analyst, and the backlog grows faster than the team can clear it. Oversight is strong, but containment is behind the events.",
            changes: [c("Every action approved", "up"), c("Backlog outpaces analysts", "down"), c("Containment lags", "down")],
            sets: { automation: "manual" },
          },
        },
      ],
    },
    {
      key: "B",
      label: "Permit the wider workflow on all incident-related assets for fifteen minutes",
      cost: "Faster coverage; a wrong asset association can interrupt an operational dependency.",
      consequence: {
        you: "You allowed the wider workflow on all related assets for fifteen minutes.",
        body: "Coverage is quick. The extension also pulls in eng-ws-02 on the strength of an association, and its isolation interrupts a vendor support task the planned maintenance depended on. The action can be reversed, but it was taken without anyone asking whether that machine belonged in scope. It is not a safety event.",
        changes: [c("Fast coverage", "up"), c("Vendor task interrupted", "down"), c("Scope wrongly widened", "flag")],
        sets: { automation: "unbounded" },
      },
      variants: [
        {
          when: WEAK,
          consequence: {
            you: "You allowed the wider workflow on all related assets for fifteen minutes.",
            body: "The workflow acts on a stream of fresh activity and covers a lot quickly. It also isolates eng-ws-02 on an association and interrupts the vendor task. More actions fire, and more of them need checking afterwards. It is not a safety event.",
            changes: [c("Fast, wide coverage", "up"), c("Vendor task interrupted", "down"), c("More actions to review", "flag")],
            sets: { automation: "unbounded" },
          },
        },
      ],
    },
    {
      key: "C",
      label: "Run the workflow for enrichment only; make containment a separate manual workstream",
      cost: "Produces evidence quickly; hands-on containment remains a bottleneck.",
      consequence: {
        you: "You limited the workflow to enrichment and kept containment manual.",
        body: "Analysts get evidence faster and nothing acts on its own. Containment depends on the few people doing it by hand. The evidence is better than the speed of response.",
        changes: [c("Faster evidence", "up"), c("Containment is manual", "flag"), c("Few hands on actions", "down")],
        sets: { automation: "enrich-only" },
      },
      variants: [
        {
          when: WEAK,
          consequence: {
            you: "You limited the workflow to enrichment and kept containment manual.",
            body: "Evidence arrives quickly, but with fresh activity still coming, the manual workstream cannot keep pace. You know more than you can act on.",
            changes: [c("Faster evidence", "up"), c("Containment can't keep pace", "down")],
            sets: { automation: "enrich-only" },
          },
        },
      ],
    },
    {
      key: "D",
      label: "Pre-authorise listed IT actions with audit and reversal checks; require approval for site-boundary actions",
      cost: "Buys speed within a tested scope; site actions still need a different authority path.",
      consequence: {
        you: "You authorised listed IT actions and kept site-boundary actions for approval.",
        body: "Repetitive isolations on listed IT assets run on their own, are logged, and can be reversed. The broker and engineering workstation are left out of scope, so site-boundary actions come to you. The speed is real because the scope was tested before tonight. It assumes the listed actions have in fact been tested.",
        changes: [c("Listed actions automated", "up"), c("Site actions need approval", "flag"), c("Audit and reversal checks", "up")],
        sets: { automation: "bounded" },
      },
      variants: [
        {
          when: WEAK,
          consequence: {
            you: "You authorised listed IT actions and kept site-boundary actions for approval.",
            body: "With fresh activity still arriving, the listed actions absorb the repetitive work and analysts are free for judgement calls. The broker and engineering workstation stay out of automated scope, so those decisions come to you.",
            changes: [c("Repetitive work absorbed", "up"), c("Site actions need approval", "flag")],
            sets: { automation: "bounded" },
          },
        },
      ],
    },
  ],
  briefing: {
    role: "You are the SOC lead. You decide what the response tooling may do without asking an analyst, for the next fifteen minutes. You cannot authorise changes at the site.",
    horizon: "Next fifteen minutes",
    changed: "Analysts are handling repeated activity linked to the incident. A configured Sentinel playbook can enrich evidence and contain listed IT assets. Defender XDR may also apply its own supported disruption, which is a separate thing. The site broker and engineering systems are not approved playbook targets, and a proposed extension would add them. A contractor excerpt also appears in an AI recommendation without its source.",
    evidence: [
      E("Microsoft Sentinel · incident queue", "18:50 to 19:12", "Incident 1 and linked entities",
        "Blocked attempts and a backlog of items to investigate. Nothing new has succeeded.",
        "The earlier containment is holding. The risk now is workload, not an attacker getting loose.", "confirmed"),
      E("Playbook action and approval matrix", "Version 3 · last tested 12 Sep", "ironvale-contain-IT; proposed extension",
        "Approved: enrich, isolate IT hosts, disable accounts. Not approved: contractor-broker-01, eng-ws-02.",
        "The tested scope stops at the IT estate. The extension would cross into the site boundary.", "confirmed"),
      E("AI recommendation (interpretation)", "19:08", "Contractor-supplied excerpt",
        "Recommends adding the broker, quoting a contractor text with no source or date.",
        "An unsourced excerpt is influencing a decision. It is not evidence.", "unverified", "interpretation"),
    ],
    unknown: "Whether the new targets are truly part of the incident, or only associated with it by an address or a shared account.",
    stakes: "Faster automation covers more ground but can interrupt a working dependency if an association is wrong. Slower approval keeps control but may leave activity unchecked.",
    parallel: "Whatever you choose: log every action, keep the original evidence, and tell the incident commander before any site-boundary change.",
    controls: [
      { product: "Defender XDR automatic attack disruption", capability: "Applies its own supported containment on covered signals", limit: "Built into Defender XDR with prerequisites (licensed Defender workloads deployed, device discovery and so on); distinct from configured Sentinel playbooks, not on every asset", owner: "SOC lead (configuration)" },
      { product: "Microsoft Sentinel playbooks", capability: "Run configured actions, such as enrich or isolate, on defined targets", limit: "Only what was built and tested; broker and engineering systems are not approved", owner: "SOC lead with engineering" },
      { product: "Security Copilot agents", capability: "Summarise and suggest next steps from evidence", limit: "Limited by configured tools and permissions; output needs a source", owner: "SOC lead" },
    ],
    glossary: [
      { term: "Playbook", meaning: "A set of automated steps Sentinel runs when told to, for example isolating a device." },
      { term: "Attack disruption", meaning: "A built-in Defender response that acts automatically on certain high-confidence attacks. It is separate from playbooks you build." },
      { term: "Enrichment", meaning: "Adding context to an alert, such as who owns a machine, without changing anything." },
    ],
    variants: [
      {
        when: WEAK,
        changed: "Analysts are handling repeated activity linked to the incident, and new items keep arriving. A configured Sentinel playbook can enrich evidence and contain listed IT assets. Defender XDR may also apply its own supported disruption, which is a separate thing. The broker and engineering systems are not approved targets, and a proposed extension would add them. A contractor excerpt appears in an AI recommendation without its source.",
        evidence: [
          E("Microsoft Sentinel · incident queue", "18:50 to 19:12", "Incident 1 and linked entities",
            "Fresh successful sign-ins by the Agent 0 identity at 19:08 and 19:11. The queue is growing faster than analysts can clear it.",
            "The attacker's access is still working, so decisions are being made under pressure.", "confirmed"),
          E("Playbook action and approval matrix", "Version 3 · last tested 12 Sep", "ironvale-contain-IT; proposed extension",
            "Approved: enrich, isolate IT hosts, disable accounts. Not approved: contractor-broker-01, eng-ws-02.",
            "The tested scope stops at the IT estate. The extension would cross into the site boundary.", "confirmed"),
          E("AI recommendation (interpretation)", "19:08", "Contractor-supplied excerpt",
            "Recommends adding the broker, quoting a contractor text with no source or date.",
            "An unsourced excerpt is influencing a decision. It is not evidence.", "unverified", "interpretation"),
        ],
      },
    ],
  },
  reveal: {
    boundary: "Defender's built-in attack disruption, Sentinel playbooks and Security Copilot agents have different triggers and permissions. None of them is an assurance of containment on every asset, and none was approved to act at the site boundary.",
    lesson: "The decision was how much authority to hand to automation and where it stops. A tested, logged, reversible scope speeds up repetitive work. Anything that touches the site needs a different authority path. The gap to look for is whether the room could say, before the incident, which action is safe enough to pre-authorise.",
    questions: QUESTIONS,
  },
  guidance: {
    preferred: "D",
    conditions: "The listed IT actions have already been tested, logged and can be reversed. If they have not, C is the stronger starting point.",
    alternative: "C wins when the action set is untested or the asset associations are doubtful. A wins in a small team with low volume.",
    changeEvidence: "A test record of the playbook would favour D. A recent mis-association would favour C or A.",
    notes: [
      "Keep native Defender XDR attack disruption, configured Sentinel playbooks and Security Copilot agents distinct. Built-in disruption is not an unconstrained generative agent. [S1, S2, S7]",
      "The state shown to the room tells them whether the playbook was tested. Tell the room which applies.",
      "Review for Rich: is the approval boundary workable under time pressure, or does it create another manual queue? Which action is safe enough to pre-authorise?",
    ],
  },
};

const inject3: RoundContent = {
  roundNo: 4,
  id: "inject3",
  seat: "Inject 3 · Incident commander + site OT lead",
  when: "Friday 19:35",
  title: "Contain the access; keep the plant in a known state",
  prompt: "What do you authorise at the site boundary?",
  durationSeconds: 300,
  situation: [
    "19:35. The OT sensor sees unfamiliar traffic from the contractor access broker towards an engineering workstation.",
    "That shows a suspicious path. It does not show that controller logic has changed.",
    "The site lead says local process indications are stable. The broker is outside the safety instrumented system and is needed for a planned vendor task.",
    "A caller claiming to be the incident commander asks for broader changes. Nobody has verified them.",
  ],
  feed: [
    { kind: "ot", who: "Defender for IoT (synthetic)", text: "Unfamiliar traffic: contractor-broker-01 towards eng-ws-02." },
    { kind: "ot", who: "Site control room", text: "Local process indications stable. Broker is not part of the safety system." },
  ],
  path: ["watched", "watched", "at risk", "watched", "at risk", "watched", "secure"],
  pathVariants: combos([HOST, IDN], ([h, i]) => [
    "watched", hostS(h), idS(i), i === 0 ? "at risk" : "watched",
    i <= 1 ? "compromised" : "watched", i <= 1 ? "at risk" : "watched", i <= 1 ? "watched" : "secure",
  ]),
  options: [
    {
      key: "A",
      label: "Ask the site to begin its controlled plant safe-state procedure before changing access",
      cost: "Conservative operational posture; accepts a production interruption even if only the broker is affected.",
      consequence: {
        you: "You asked the site to begin its controlled safe-state procedure.",
        body: "The site runs its own procedure and brings the plant to its safe state in a controlled sequence. The plant is safe and production stops. The broker is still connected, and the access question has not been addressed. This is a conservative, operational choice by the site. It is not a response to harm.",
        changes: [c("Plant in safe state", "flag"), c("Production interrupted", "down"), c("Broker question still open", "flag")],
        sets: { site: "safe-state" },
      },
      variants: [
        {
          when: ACTIVE_PATH,
          consequence: {
            you: "You asked the site to begin its controlled safe-state procedure.",
            body: "The plant is brought to its safe state in a controlled way and production stops. The unauthorised broker session is still open, though, because stopping the plant does nothing to it. The site is as safe as its own procedure makes it, and the access path is now known to be active.",
            changes: [c("Plant in safe state", "flag"), c("Production interrupted", "down"), c("Open session not addressed", "down")],
            sets: { site: "safe-state", contractor: "active" },
          },
        },
      ],
    },
    {
      key: "B",
      label: "Verify the caller independently, restrict the broker with the site lead and keep local monitoring",
      cost: "Stops the suspect route within known dependencies; delays vendor support and needs site coordination.",
      consequence: {
        you: "You verified the caller, restricted the broker with the site lead and kept monitoring.",
        body: "The caller fails an independent callback and is not acted on. The site lead and IT restrict the broker within known dependencies, and local monitoring stays in place. The planned vendor task is delayed. The plant stays in its normal state, as confirmed by the site.",
        changes: [c("Caller not acted on", "up"), c("Broker restricted", "flag"), c("Vendor task delayed", "down"), c("Plant confirmed stable", "up")],
        sets: { contractor: "restricted", site: "stable" },
      },
      variants: [
        {
          when: ACTIVE_PATH,
          consequence: {
            you: "You verified the caller, restricted the broker with the site lead and kept monitoring.",
            body: "The caller fails an independent callback and is not acted on. Restricting the broker with the site lead ends the open unauthorised session, and its logs are kept. The planned vendor task is delayed. The site confirms the plant is stable.",
            changes: [c("Open session ended", "up"), c("Broker logs preserved", "up"), c("Vendor task delayed", "down"), c("Plant confirmed stable", "up")],
            sets: { contractor: "restricted", site: "stable" },
          },
        },
      ],
    },
    {
      key: "C",
      label: "Keep the broker connected under close observation until the vendor validates its session",
      cost: "Preserves support capability; leaves the suspicious path available longer.",
      consequence: {
        you: "You kept the broker connected and watched it closely.",
        body: "The vendor support task goes ahead, and the sensor and site watch the path. Nothing happens during the window, and the path remains available throughout. You are relying on observation to catch what you chose not to prevent.",
        changes: [c("Vendor support preserved", "up"), c("Path stays open", "flag"), c("Close observation", "flag")],
        sets: { contractor: "monitored" },
      },
      variants: [
        {
          when: ACTIVE_PATH,
          consequence: {
            you: "You kept the broker connected and watched it closely.",
            body: "The open unauthorised session continues while you wait for the vendor to validate. The sensor and the site watch it, and the process indications stay stable. The path is open for longer than anyone intended, and what the session reaches is still being learned.",
            changes: [c("Unauthorised session continues", "down"), c("Vendor support preserved", "up"), c("Process still stable", "flag")],
            sets: { contractor: "active" },
          },
        },
      ],
    },
    {
      key: "D",
      label: "Authorise IT to cut the wider OT uplink immediately",
      cost: "Restricts more paths quickly; removes visibility and integrations beyond the confirmed broker scope.",
      consequence: {
        you: "You authorised IT to cut the wider OT uplink.",
        body: "The suspicious path is gone, and so is much else. The sensor feed, the historian link to corporate planning and remote vendor support are lost. The plant runs locally as designed. Nothing unsafe follows, but you can no longer see the site boundary from Perth.",
        changes: [c("Suspect path removed", "up"), c("Visibility lost", "down"), c("Integrations lost", "down")],
        sets: { contractor: "uplink-cut", site: "unverified" },
      },
      variants: [
        {
          when: ACTIVE_PATH,
          consequence: {
            you: "You authorised IT to cut the wider OT uplink.",
            body: "The open unauthorised session ends with the uplink, and so do the sensor feed, the historian link and remote vendor support. The plant runs locally as designed and nothing unsafe follows. You cannot now see the boundary from Perth, so you cannot prove what the session reached.",
            changes: [c("Open session ended", "up"), c("Visibility lost", "down"), c("Cannot prove what it reached", "flag")],
            sets: { contractor: "uplink-cut", site: "unverified" },
          },
        },
      ],
    },
  ],
  briefing: {
    role: "You are the incident commander, with the site OT lead beside you. You can ask the site to take actions at the IT/OT boundary. The site owns the plant and its safe-state procedure.",
    horizon: "Authority over the IT/OT boundary",
    changed: "The OT sensor reports unfamiliar traffic from the contractor access broker towards an engineering workstation. That is a suspicious path, not proof that controller logic has changed. The site lead says local process indications are stable, and the broker is not part of the safety system but is needed for a planned vendor task. The vendor offers to disconnect it. A caller claiming to be you asks for broader changes.",
    evidence: [
      E("Defender for IoT · network observation", "19:02 to 19:28", "contractor-broker-01 to eng-ws-02 (OT DMZ)",
        "Three connection attempts from the broker to the engineering workstation. The vendor's broker log shows authentication failures. No session open.",
        "The path was tried and refused. The sensor sees only what it covers.", "partial"),
      E("Dependency map (site engineering)", "Updated 14 Oct", "Broker, engineering workstation, control network",
        "Broker reaches the workstation. The workstation reaches the control network only through approved changes.",
        "Reaching the workstation is not the same as reaching a controller.", "partial"),
      E("Site control room and unverified call", "19:30 and 19:33", "Site lead; caller claiming to be the incident commander",
        "The site lead confirms stable indications over a verified line. The caller's identity is not confirmed.",
        "The site's word is evidence. The caller's is not, until independently verified.", "partial"),
    ],
    unknown: "Whether the broker's copied credential has been used to connect, and what the engineering workstation can reach beyond the DMZ.",
    stakes: "Restricting the broker delays a planned vendor task. Leaving it connected keeps the suspect path open. Cutting the wider uplink loses visibility and integrations. Stopping the plant interrupts production.",
    parallel: "Whatever you choose: the site's own safety procedures continue, and no one outside the site changes plant systems.",
    controls: [
      { product: "Defender for IoT", capability: "Agentless network monitoring that raises observations on OT traffic", limit: "Sees only what its sensors cover; what an observation means for the plant is for site engineering to judge", owner: "OT security lead" },
      { product: "Microsoft Sentinel", capability: "Correlates the OT observation with the IT incident", limit: "Depends on data connected; cannot change the site's network", owner: "SOC lead" },
      { product: "Site access and network controls", capability: "Restrict or disconnect the broker and the uplink", limit: "Used under site authority and approved procedures; the safe-state procedure is the site's own", owner: "Site OT lead" },
    ],
    glossary: [
      { term: "Access broker", meaning: "A separate system that lets a contractor reach equipment remotely. It is a different trust boundary from Agent 0." },
      { term: "OT DMZ", meaning: "A buffer network between corporate IT and the plant's control networks." },
      { term: "Safe state", meaning: "The plant condition the site defines as safe to stop in. The site, not the SOC, decides when and how." },
    ],
    variants: [
      {
        when: ACTIVE_PATH,
        changed: "The OT sensor reports an open session from the contractor access broker to an engineering workstation, using the vendor's service account. That is an unauthorised session, not proof that controller logic has changed. The site lead says local process indications are stable, and the broker is not part of the safety system but is needed for a planned vendor task. A caller claiming to be you asks for broader changes.",
        evidence: [
          E("Defender for IoT · network observation", "19:12 to 19:30", "contractor-broker-01 to eng-ws-02 (OT DMZ)",
            "A session is open from the broker to the engineering workstation, started at 19:12 with the vendor's service account.",
            "Someone is connected now, using a credential the vendor did not use for this task.", "partial"),
          E("Dependency map (site engineering)", "Updated 14 Oct", "Broker, engineering workstation, control network",
            "Broker reaches the workstation. The workstation reaches the control network only through approved changes.",
            "Reaching the workstation is not the same as reaching a controller.", "partial"),
          E("Site control room and unverified call", "19:30 and 19:33", "Site lead; caller claiming to be the incident commander",
            "The site lead confirms stable indications over a verified line. The caller's identity is not confirmed.",
            "The site's word is evidence. The caller's is not, until independently verified.", "partial"),
        ],
        unknown: "What the open session has touched, and what the engineering workstation can reach beyond the DMZ.",
      },
      {
        when: F("automation", "unbounded"),
        changed: "The OT sensor reports earlier attempts from the contractor access broker towards an engineering workstation, now refused. That is a suspicious path, not proof that controller logic has changed. The wider playbook has already isolated the engineering workstation, which the vendor needed for a planned task, and the vendor cannot easily verify its own session. The site lead says local process indications are stable. A caller claiming to be you asks for broader changes.",
        evidence: [
          E("Defender for IoT · network observation", "19:02 to 19:28", "contractor-broker-01 to eng-ws-02 (OT DMZ)",
            "Three connection attempts from the broker to the workstation, refused. The workstation was then isolated by the playbook at 19:20.",
            "The path was tried and refused. The playbook has also cut a dependency the vendor needed.", "partial"),
          E("Dependency map (site engineering)", "Updated 14 Oct", "Broker, engineering workstation, control network",
            "Broker reaches the workstation. The workstation reaches the control network only through approved changes.",
            "Reaching the workstation is not the same as reaching a controller.", "partial"),
          E("Site control room and unverified call", "19:30 and 19:33", "Site lead; caller claiming to be the incident commander",
            "The site lead confirms stable indications over a verified line. The caller's identity is not confirmed.",
            "The site's word is evidence. The caller's is not, until independently verified.", "partial"),
        ],
      },
    ],
  },
  reveal: {
    boundary: "Defender for IoT supplied an observation and Sentinel correlated it. Restricting the broker is done through the site's own access and network controls, under the site's authority. What an observation means for the plant, and any shutdown, is decided by site engineering under approved procedures; the sensor output alone does not establish that a safety system is intact.",
    lesson: "The decision was how to cut a suspect path without confusing cyber containment with plant safety. A verified site lead, a known dependency map and an approved procedure made a bounded step possible. The gap to look for is whether IT and site know who may order what, and how they verify each other under pressure.",
    questions: QUESTIONS,
  },
  guidance: {
    preferred: "B",
    conditions: "The site lead confirms stable indications over a verified channel and the broker is outside the safety system. If independent site evidence shows an immediate process hazard, the site's own procedure takes precedence.",
    alternative: "A wins when the site judges the process uncertain, as a site decision. C is defensible only with a fixed time limit and a stop condition. D is worth considering if the site cannot define the broker's dependencies.",
    changeEvidence: "A process hazard reported by the site favours A. A vendor validating its session in real time favours C. An unknown dependency map favours D.",
    notes: [
      "Defender for IoT provides agentless network monitoring and observations within sensor coverage. Site engineering and approved procedures own plant actions. Do not suggest the sensor output proves a safety system is intact or that a generic cyber rule decides a mine's safe state. [S8]",
      "D is a loss of visibility and integrations, not a safety event. A is conservative lost production, not harm to people.",
      "OT reviewer requirement: confirm the mine topology, dependencies, caller-verification method and safe-state wording before content approval.",
    ],
  },
};

/* Recovery data bits for round 5: composed with each option. */
type DataState = "blocked" | "mixed" | "confirmed";
const DATA_BITS: Record<DataState, { text: string; set: string; chip: Change }> = {
  blocked: {
    text: "The earlier reads show as attempts that failed, so the assessment narrows to what was exposed in the collaboration location. Legal and privacy keep assessing notification in parallel.",
    set: "attempts-blocked",
    chip: c("Reads shown as attempts", "up"),
  },
  mixed: {
    text: "The read records are mixed: some completed, some refused. The assessment continues with a wider log review, and legal and privacy assess notification in parallel.",
    set: "assessing",
    chip: c("Impact still being scoped", "flag"),
  },
  confirmed: {
    text: "Records show completed reads of work orders and contractor documents. The assessment widens to every storage and API path, and legal and privacy assess notification in parallel using what is known so far. How much was taken is not established.",
    set: "access-confirmed",
    chip: c("Access confirmed; scope widening", "down"),
  },
};

function recoveryOption(key: "A" | "B" | "C" | "D", label: string, cost: string, you: string, rec: string, recSet: string, chips: Change[]): OptionContent {
  const mk = (ds: DataState): Consequence => ({
    you,
    body: `${rec} ${DATA_BITS[ds].text}`,
    changes: [...chips, DATA_BITS[ds].chip],
    sets: { recovery: recSet, data: DATA_BITS[ds].set },
  });
  return { key, label, cost, consequence: mk("mixed"), variants: [{ when: WEAK, consequence: mk("confirmed") }, { when: STRONG, consequence: mk("blocked") }] };
}

const RECOVERY_CARD = E("Recovery record (protected backup)", "Backup 17:00 · last test none", "Engineering-support VM backup",
  "An immutable backup exists, protected from change. It has not been restored in isolation. No offline copy is recorded.",
  "Protected is not the same as clean, offline or ready to run. Nobody has tested the restore.", "partial");

const inject4: RoundContent = {
  roundNo: 5,
  id: "inject4",
  seat: "Inject 4 · CISO",
  when: "Friday 22:00",
  title: "Can you trust what you are about to restore?",
  prompt: "What recovery posture do you approve for the next shift?",
  durationSeconds: 300,
  situation: [
    "22:00. Defender has flagged unusual reads on maintenance data, and Purview shows sensitive contractor documents in an over-permissioned location.",
    "An engineering-support VM backup is protected, but the application owner has not validated a restore in isolation.",
    "The next shift needs maintenance work packs.",
    "Legal and privacy are assessing notification obligations in parallel.",
  ],
  feed: [
    { kind: "legal", who: "Legal and privacy", text: "Assessing notification obligations in parallel, using the evidence available." },
    { kind: "exec", who: "Maintenance superintendent", text: "The next shift starts at 06:00. Paper work packs are slowing the crews." },
  ],
  path: ["watched", "watched", "contained", "watched", "watched", "watched", "secure"],
  pathVariants: combos([HOST, IDN, CON, SITE], ([h, i, cn, s]) => [
    "watched", hostS(h), idS(i), i === 0 ? "at risk" : "watched", brokerS(cn, i), otS(cn), plantS(s, cn),
  ]),
  options: [
    recoveryOption("A", "Restore the available backup directly into production under heightened monitoring",
      "Shorter service interruption; trusts an unvalidated restore and its dependencies.",
      "You restored the backup straight into production under heightened monitoring.",
      "Work packs return within the hour. The restore also brings back a connector configuration whose source nobody has checked, and you are relying on monitoring to find any problem in it.",
      "unvalidated", [c("Work packs return fast", "up"), c("Restore not validated", "down")]),
    recoveryOption("B", "Hold recovery until the complete incident and data-loss assessment is finished",
      "Avoids acting on incomplete scope; may delay recoverable services unnecessarily.",
      "You held recovery until the assessment is complete.",
      "Nothing is restored, and the next shift works from paper packs. Recoverable services wait on an assessment that has no fixed end, though no restore was done on incomplete scope.",
      "held", [c("No restore on incomplete scope", "up"), c("Manual packs continue", "down")]),
    recoveryOption("C", "Validate a clean restore in isolation and release essential services through agreed acceptance checks",
      "Takes validation time and uses manual work packs meanwhile; makes recovery evidence explicit.",
      "You validated a restore in isolation and set acceptance checks.",
      "The isolated restore finds a stale connector setting and corrects it. Essential services are released against the agreed checks, a few hours later than a direct restore, with manual packs in between.",
      "validated", [c("Restore validated in isolation", "up"), c("Release against checks", "up"), c("Manual packs meanwhile", "down")]),
    recoveryOption("D", "Rebuild the affected integration from known-good source before restoring any related service",
      "Strong separation from the compromised runtime; longer disruption and configuration-validation effort.",
      "You rebuilt the integration from known-good source.",
      "The new integration shares nothing with the old runtime, and its configuration is checked as it is built. It is the longest disruption of the four and the strongest separation.",
      "rebuilding", [c("Clean separation from old runtime", "up"), c("Longest disruption", "down")]),
  ],
  briefing: {
    role: "You are the CISO, with recovery, privacy and site leads at the table. You can approve a phased recovery. You do not perform technical restore steps.",
    horizon: "Authority to begin phased recovery",
    changed: "Defender for SQL and storage show unusual reads tied to the incident. Purview shows sensitive contractor documents in an over-permissioned collaboration location, which is not the same as showing what left through every storage or API path. A protected backup exists but has not been validated in isolation. The next shift needs work packs. Legal and privacy are assessing notification in parallel.",
    evidence: [
      E("Defender for SQL and storage · activity timeline", "18:34 to 21:40", "Maintenance database and work-order storage",
        "Reads by the Agent 0 identity. Some completed, some refused. The record separates attempts from completions.",
        "Shows what was tried and what succeeded, which matters for the assessment.", "partial"),
      E("Microsoft Purview · classification and DLP", "21:10", "Contractor documents in a collaboration location",
        "Sensitive contractor documents are exposed to more people than needed. DLP blocked one transfer through the channel it covers.",
        "A blocked transfer on one channel says nothing about storage or API paths it does not cover.", "partial"),
      RECOVERY_CARD,
    ],
    unknown: "What was read through paths the data tools do not cover, and whether the backup's configuration can be trusted.",
    stakes: "A faster restore returns the work packs sooner but may reintroduce a problem. A slower one keeps crews on paper longer. The notification assessment continues either way.",
    parallel: "Whatever you choose: legal and privacy continue their assessment now. They do not wait for the recovery decision, and the assessment period never excuses delaying a notification already known to be required.",
    controls: [
      { product: "Defender for SQL and Defender for Storage", capability: "Raise threat signals on database and storage activity", limit: "Help scope the investigation; they are not backup or recovery", owner: "Security engineer" },
      { product: "Microsoft Purview (DSPM and DLP)", capability: "Classify data, show exposure, and block transfers through covered channels", limit: "Coverage depends on the channel and policy; a blocked transfer does not prove other paths safe", owner: "Privacy and data owner" },
      { product: "Azure Backup immutable vault", capability: "Protects recovery points from deletion or modification (a logical air gap)", limit: "Immutable is not offline, not proof of a clean restore, and not accepted recovery", owner: "Application owner with recovery lead" },
    ],
    glossary: [
      { term: "Immutable backup", meaning: "A copy that cannot be changed. It does not prove the copy is free of the problem you are recovering from." },
      { term: "DLP", meaning: "Data loss prevention: rules that block or flag sensitive data leaving through channels the policy covers." },
      { term: "Acceptance checks", meaning: "Agreed tests a restored service must pass before it is released." },
    ],
    variants: [
      {
        when: WEAK,
        changed: "Defender for SQL and storage show completed reads tied to the incident. Purview shows sensitive contractor documents in an over-permissioned collaboration location, which is not the same as showing what left through every storage or API path. A protected backup exists but has not been validated in isolation. The next shift needs work packs. Legal and privacy are assessing notification in parallel.",
        evidence: [
          E("Defender for SQL and storage · activity timeline", "18:34 to 21:40", "Maintenance database and work-order storage",
            "Completed reads by the Agent 0 identity of work orders and stored documents, continuing after 19:00.",
            "Access is confirmed, not just attempted. The assessment now has to widen.", "confirmed"),
          E("Microsoft Purview · classification and DLP", "21:10", "Contractor documents in a collaboration location",
            "Sensitive contractor documents are exposed to more people than needed. DLP blocked one transfer through the channel it covers; the storage path is under investigation.",
            "A blocked transfer on one channel says nothing about the storage path where reads were completed.", "partial"),
          RECOVERY_CARD,
        ],
        unknown: "How much was read through storage and API paths, and whether the backup's configuration can be trusted.",
      },
      {
        when: STRONG,
        changed: "Defender for SQL and storage show reads tied to the incident that were refused after containment. Purview shows sensitive contractor documents in an over-permissioned collaboration location, which is not the same as showing what left through every storage or API path. A protected backup exists but has not been validated in isolation. The next shift needs work packs. Legal and privacy are assessing notification in parallel.",
        evidence: [
          E("Defender for SQL and storage · activity timeline", "18:34 to 19:20", "Maintenance database and work-order storage",
            "Reads by the Agent 0 identity were attempted and refused after containment. Earlier history is being checked.",
            "The record suggests attempts rather than completed access. Absence of an alert is not proof of no loss.", "partial"),
          E("Microsoft Purview · classification and DLP", "21:10", "Contractor documents in a collaboration location",
            "Sensitive contractor documents are exposed to more people than needed. DLP blocked one transfer through the channel it covers.",
            "A blocked transfer on one channel says nothing about storage or API paths it does not cover.", "partial"),
          RECOVERY_CARD,
        ],
        unknown: "Whether any completed read happened before containment, and whether the backup's configuration can be trusted.",
      },
    ],
  },
  reveal: {
    boundary: "Defender's database and storage signals help scope what happened. Purview covers the channels and policies it is set up for. An immutable backup protects a recovery point from change, but it does not show that the point is clean, offline or fit to run.",
    lesson: "The decision was what evidence earns a restore. Detection, data governance and backup do different jobs, and recovery needs its own acceptance checks. The gap to look for is a restore nobody has tested in isolation, and an executive who cannot say what 'accepted' means.",
    questions: QUESTIONS,
  },
  guidance: {
    preferred: "C",
    conditions: "An isolated validation capability exists and manual work packs can cover the delay. Notification assessment continues whatever is chosen.",
    alternative: "D is right where there is no trustworthy recovery point or provenance. B suits a small, non-urgent service. A is defensible only for a low-risk, well-understood service.",
    changeEvidence: "No isolated validation capability favours D or B. Evidence the recovery point predates the first suspicious activity strengthens C.",
    notes: [
      "Purview coverage depends on the channel and policy; name the enforcement mechanism. A blocked transfer does not prove storage or API paths safe. Use the terminology that suits the tenant and release. [S9]",
      "Immutable backup is not offline, clean or accepted recovery. A fictional offline copy would have to be stated, not inferred. [S10-S12]",
      "The 30-day NDB assessment period is a maximum, not permission to wait: once a breach is assessed as eligible, notify as soon as practicable. Legal and privacy assess obligations for this entity; SOCI status is not inferred from 'mining'. [S15, S16]",
      "Review for Rich: does this round have one clear priority? Which acceptance tests should an executive understand without doing technical steps?",
    ],
  },
};

/* Round 6 evidence reused across branches. */
const OWNERSHIP_CARD = E("Agent ownership and permissions record", "Updated 08:00", "Agent 0 and spn-agent0-ops",
  "Agent 0 has no named sponsor. It runs under a legacy service principal, not an Entra agent identity. No registry entry in Agent 365.",
  "Registering it later would help ownership and lifecycle. It would not fix access that is already too wide.", "confirmed");

const inject5: RoundContent = {
  roundNo: 6,
  id: "inject5",
  seat: "Inject 5 · The board",
  when: "Saturday 08:00",
  title: "What earns Agent 0 permission to return?",
  prompt: "What operating mandate do you give management for Agent 0?",
  durationSeconds: 300,
  situation: [
    "Saturday 08:00. The site is stable or in its agreed safe state. Essential services have a documented recovery position.",
    "The incident exposed gaps in agent ownership, credential scope and the authority of automated response.",
    "Maintenance coordination has real business value, but its full access is not yet justified.",
    "The exposure findings and incident action log show what is fixed, what is uncertain and what is only proposed.",
  ],
  feed: [
    { kind: "exec", who: "Chief operating officer", text: "Crews are on manual packs. Is there a date for Agent 0?" },
    { kind: "soc", who: "Incident action log", text: "Items closed, open and proposed are marked separately." },
  ],
  path: ["watched", "contained", "contained", "watched", "contained", "watched", "secure"],
  pathVariants: combos([IDN, CON, SITE, DATA], ([i, cn, s, d]) => [
    "watched", i === 2 ? "contained" : "at risk", idS(i),
    d === 2 ? "compromised" : d === 1 ? "watched" : "at risk", brokerS(cn, i), otS(cn), plantS(s, cn),
  ]),
  options: [
    {
      key: "A",
      label: "Permit a staged return after named owners verify access, data, response and site-boundary controls",
      cost: "Restores value gradually; accepts a slower rollout and explicit stop conditions.",
      consequence: {
        you: "You authorised a staged return, gated on named owners.",
        body: "Management returns with a plan: owners for access, data, response and the site boundary each verify their gate, and each stage has a stop condition. Value returns in steps, and the first stage is a read-only slice. The board has assigned risk ownership; no product accepted it on its behalf.",
        changes: [c("Staged return, gated", "up"), c("Named owners and stop conditions", "up"), c("Slower rollout", "down")],
        sets: { mandate: "gated" },
      },
      variants: [
        {
          when: WEAK,
          consequence: {
            you: "You authorised a staged return, gated on named owners.",
            body: "The plan is approved, but the first gate cannot be met: the service identity was never closed and its access is not yet verified. Nothing restarts until that gate is passed and evidenced. The plan is authorised and the return waits.",
            changes: [c("Plan authorised", "up"), c("First gate not yet met", "flag"), c("Nothing restarts yet", "down")],
            sets: { mandate: "gated" },
          },
        },
        {
          when: F("recovery", "unvalidated", "held"),
          consequence: {
            you: "You authorised a staged return, gated on named owners.",
            body: "The plan is approved, but the recovery gate is open: the restore is not validated or the assessment has not finished. The first stage waits for acceptance checks. The plan is authorised and the return waits on evidence.",
            changes: [c("Plan authorised", "up"), c("Recovery gate open", "flag"), c("Return waits on evidence", "down")],
            sets: { mandate: "gated" },
          },
        },
      ],
    },
    {
      key: "B",
      label: "Keep Agent 0 suspended until an independent review concludes",
      cost: "More assurance before reuse; prolongs manual work and leaves other agents needing separate review.",
      consequence: {
        you: "You kept Agent 0 suspended pending an independent review.",
        body: "Nothing returns until the review reports. The assurance is stronger, but the crews stay on manual packs for longer. Other agents run on the same patterns and have not been looked at, and they now need their own review.",
        changes: [c("Independent assurance", "up"), c("Manual work continues", "down"), c("Other agents unreviewed", "flag")],
        sets: { mandate: "suspended" },
      },
    },
    {
      key: "C",
      label: "Return Agent 0 to its former role with enhanced SOC monitoring",
      cost: "Faster productivity recovery; monitoring alone leaves governance and control gaps unresolved.",
      consequence: {
        you: "You returned Agent 0 to its former role with enhanced monitoring.",
        body: "Maintenance coordination is back quickly. The service principal keeps the same broad storage access and still has no named sponsor, and monitoring can describe misuse only after it happens. The governance gaps the incident exposed are unchanged.",
        changes: [c("Productivity restored", "up"), c("Same access, no owner", "down"), c("Gaps still open", "flag")],
        sets: { mandate: "returned" },
      },
      variants: [
        {
          when: WEAK,
          consequence: {
            you: "You returned Agent 0 to its former role with enhanced monitoring.",
            body: "Agent 0 returns while the service identity has never been closed or verified. Monitoring now watches an identity whose access is still wider than needed, and the credential you cannot account for is still out there.",
            changes: [c("Productivity restored", "up"), c("Identity never verified", "down"), c("Gaps still open", "flag")],
            sets: { mandate: "returned" },
          },
        },
        {
          when: F("recovery", "unvalidated"),
          consequence: {
            you: "You returned Agent 0 to its former role with enhanced monitoring.",
            body: "Agent 0 returns on a restore that was never validated in isolation, with the same broad access and no named sponsor. Monitoring is the only thing standing between those gaps and the next incident.",
            changes: [c("Productivity restored", "up"), c("Unvalidated restore", "down"), c("Gaps still open", "flag")],
            sets: { mandate: "returned" },
          },
        },
      ],
    },
    {
      key: "D",
      label: "Replace Agent 0 with a new managed platform before restoring the capability",
      cost: "Offers a new operating model; migration still needs ownership, permissions, testing and evidence.",
      consequence: {
        you: "You decided to replace Agent 0 on a new managed platform.",
        body: "A fresh start with a managed agent lifecycle, but the migration still needs an owner, scoped permissions, testing and evidence before it goes live. A new platform is a starting point, not proof of readiness. Manual work continues in the meantime.",
        changes: [c("New operating model", "up"), c("Migration needs owners and tests", "flag"), c("Manual work continues", "down")],
        sets: { mandate: "replatform" },
      },
    },
  ],
  briefing: {
    role: "You are the board's risk committee, with operational accountability. You set the mandate for management and assign risk ownership. You do not perform technical steps.",
    horizon: "Next operating period and a funded improvement programme",
    changed: "The site is stable or in its agreed safe state, and essential services have a documented recovery position. The incident exposed gaps in agent ownership, credential scope and the authority of automated response. Maintenance coordination has real business value, but its full access is not yet justified. Exposure findings and the action log show what is fixed, what is uncertain and what is only proposed.",
    evidence: [
      E("Recovery acceptance record", "Updated 07:30", "Maintenance services",
        "Essential services have a documented recovery position and agreed acceptance checks. Open items are listed.",
        "Shows what is accepted, which is different from what is merely running.", "partial"),
      E("Security Exposure Management and Defender for Cloud", "Updated 07:45", "Agent 0 path, spn-agent0-ops, contractor endpoint",
        "The excessive-access finding on spn-agent0-ops and the older contractor endpoint are listed. Remediation is proposed, not yet complete.",
        "The tools showed these before the incident. An owner and a date turn a finding into a fix.", "partial"),
      OWNERSHIP_CARD,
    ],
    unknown: "Whether the proposed fixes will hold, and whether other agents carry the same gaps.",
    stakes: "A faster return restores value but leaves gaps open. A slower one keeps crews on manual work. A new platform does not by itself resolve either.",
    parallel: "Whatever you choose: the improvement actions get named owners and dates, and legal and privacy continue their assessment.",
    controls: [
      { product: "Security Exposure Management and Defender for Cloud posture", capability: "Show exposure and misconfiguration along the business path", limit: "Display findings; do not fix them or accept risk", owner: "Security and platform owners" },
      { product: "Microsoft Agent 365 and Entra Agent ID", capability: "Register agents, name sponsors, govern access over their lifetime", limit: "Registry coverage is not universal protection; Agent 0 is not yet registered", owner: "Agent sponsor (to be named)" },
      { product: "Defender External Attack Surface Management", capability: "Discovers internet-facing assets from the outside", limit: "A different view from internal investigation; does not discover every dependency", owner: "Security lead" },
    ],
    glossary: [
      { term: "Staged return", meaning: "Bringing a capability back in steps, each with named owners and a condition to stop." },
      { term: "Risk ownership", meaning: "A named person accepts a residual risk. A product cannot accept it for them." },
      { term: "Gate", meaning: "A condition that must be met, with evidence, before the next stage proceeds." },
    ],
    variants: [
      {
        when: ALL(F("recovery", "validated"), F("contractor", "restricted"), F("identity", "contained", "broad-rotation")),
        changed: "The site is stable or in its agreed safe state. Recovery was validated in isolation, the contractor path is restricted, and the service identity has been closed and tested. The incident still exposed gaps in agent ownership, credential scope and the authority of automated response. Maintenance coordination has real business value. The action log shows what is fixed, what is uncertain and what is only proposed.",
        evidence: [
          E("Recovery acceptance record", "Updated 07:30", "Maintenance services",
            "Restore validated in isolation. Essential services released against agreed checks. Open items listed.",
            "The recovery position is evidenced, not assumed.", "confirmed"),
          E("Security Exposure Management and Defender for Cloud", "Updated 07:45", "Agent 0 path, spn-agent0-ops, contractor endpoint",
            "Broker restricted and the credential rotated and tested. The excessive-access finding and the older contractor endpoint remain open as proposed remediation.",
            "Some risks are closed. The causes the tools showed beforehand still need owners and dates.", "partial"),
          OWNERSHIP_CARD,
        ],
      },
      {
        when: WEAK,
        changed: "The site is stable or in its agreed safe state. The service identity was never closed, so its access to maintenance data is unverified. Essential services have a documented recovery position, but the incident exposed gaps in agent ownership, credential scope and automated response authority. The action log shows what is fixed, what is uncertain and what is only proposed.",
        evidence: [
          E("Recovery acceptance record", "Updated 07:30", "Maintenance services",
            "Essential services have a documented recovery position. Open items include the unverified service identity.",
            "Services are running, but the identity behind them is not proven closed.", "partial"),
          E("Security Exposure Management and Defender for Cloud", "Updated 07:45", "Agent 0 path, spn-agent0-ops, contractor endpoint",
            "spn-agent0-ops is still usable. The excessive-access finding is open, with fresh use recorded after the first alert.",
            "The identity is the live gap. No tool has closed it.", "confirmed"),
          OWNERSHIP_CARD,
        ],
        unknown: "Whether the identity has been used since, and by whom.",
      },
      {
        when: F("recovery", "unvalidated"),
        changed: "The site is stable or in its agreed safe state. Services were restored without validation in isolation, so the recovery position is running but not accepted. The incident exposed gaps in agent ownership, credential scope and automated response authority. The action log shows what is fixed, what is uncertain and what is only proposed.",
        evidence: [
          E("Recovery acceptance record", "Updated 07:30", "Maintenance services",
            "Services restored directly into production. No isolated validation. Acceptance checks not yet run.",
            "Services are running, but nobody has shown the restore is clean.", "partial"),
          E("Security Exposure Management and Defender for Cloud", "Updated 07:45", "Agent 0 path, spn-agent0-ops, contractor endpoint",
            "The excessive-access finding and the older contractor endpoint are listed. Remediation is proposed, not complete.",
            "The tools showed these before the incident. An owner and a date turn a finding into a fix.", "partial"),
          OWNERSHIP_CARD,
        ],
        unknown: "Whether the restored configuration is clean, and whether the unvalidated restore reintroduced anything.",
      },
    ],
  },
  reveal: {
    boundary: "Security Exposure Management, Defender for Cloud posture and external attack-surface discovery showed what was exposed. Agent 365 and Entra Agent ID can record ownership and lifecycle. None of them accepts risk, closes a finding or proves readiness for return.",
    lesson: "The decision was what earns Agent 0 permission to come back. The board assigns risk ownership. Tools supply the evidence for named owners to meet each gate. Buying or registering something new is not itself readiness. The gap to look for is any finding that still has no owner and no date.",
    questions: QUESTIONS,
  },
  guidance: {
    preferred: "A",
    conditions: "The release conditions can be met and named owners exist. For an unresolved table, A means authorising the gated plan, not an immediate restart.",
    alternative: "B is proportionate where the gates cannot yet be satisfied, for example if the identity is still open. D can be right as a medium-term plan, once ownership and testing are in place.",
    changeEvidence: "An open identity or an unvalidated restore would favour B. Evidence the full gate list is met would strengthen A. A named owner and tested permissions would make D credible.",
    notes: [
      "Use Security Exposure Management, Defender for Cloud posture, external attack-surface discovery, Agent 365 and Entra Agent ID to support a verifiable improvement plan. The board assigns risk ownership; a product cannot accept it. [S4-S6, S13, S14]",
      "Keep the existing legacy service principal distinct from any future Agent ID registration. Do not make 'buy the whole stack' the answer.",
      "Review for Scott: can each gap lead to an understandable next step without a product being the answer?",
    ],
  },
};

/* ---------------------------------------------------------------- scenario */

export const IRONVALE: Scenario = {
  key: "ironvale@0.1",
  family: "ironvale",
  revision: "0.1",
  status: "preview",
  brand: {
    kicker: "AGENT 0 · IRONVALE MINING",
    short: "Ironvale",
    reportTitle: "After Agent 0 at Ironvale",
    pathTitle: "The path to the plant",
    simulationNote: "The state panel is an exercise model, not telemetry. It records what your table chose and what that changes in the scenario. It does not measure how safe a mine is.",
    lobby: {
      title: "Waiting for the night shift",
      hint: "Join with your table code. One device per table. Choose, say why, and lock your answer.",
    },
    launched: {
      title: "The watch is yours",
      body: "The incident has started. Your first briefing opens when the facilitator releases it.",
    },
    ended: {
      title: "That is the night",
      body: "The exercise has ended. Your facilitator will run the whole-chain debrief and the action planning.",
    },
    consoleLobby: "Ironvale Mining · Agent 0 · waiting for tables",
    consoleLaunched: "Ironvale Mining · the night shift begins",
    reportNote: "The states shown are an exercise model, not telemetry. The preferences are Rich's conditional hypotheses under stated evidence, not an answer key. Reasonable alternatives are recorded beside them.",
    reportMode: "conditional",
  },
  organisation: {
    name: "Ironvale Mining",
    tagline: "A fictional Australian hard-rock miner · remote open pit and processing plant · central SOC in Perth · specialist maintenance contractors",
    estate: "Agent 0, a maintenance coordination agent that summarises contractor documents, assembles work packs and raises maintenance requests. A SOC assistant workflow, separate from Agent 0, helps analysts. Contractors reach equipment through a separate remote-access broker.",
    holds: "Maintenance schedules and work orders, contractor documents, engineering support files and the credentials that connect them.",
    reach: "Agent 0 cannot change controller logic, start equipment or grant work permits. A lost maintenance integration delays work and production planning; it does not by itself stop a safety system.",
    objective: "Keep people safe, keep the plant in a known state, preserve evidence and keep maintenance moving.",
  },
  launch: {
    profileTitle: "Warnings before the night shift",
    notePrefix: "source",
    profile: [
      { label: "Exposed endpoint", value: "An older contractor endpoint is reachable from the internet", note: "Defender External Attack Surface Management (synthetic finding)" },
      { label: "Excessive access", value: "The integration identity can reach more storage than its work needs", note: "Defender for Cloud posture (synthetic finding)" },
      { label: "Unresolved handover", value: "Agent 0 has no named sponsor after a team change", note: "Agent ownership record (synthetic entry)" },
    ],
    profileHint: "These are fictional findings. The tools produced the information, and ownership and process had not yet turned it into a fix. No product discovers every dependency automatically.",
    terminal: "ironvale-soc — night shift timeline",
    lines: [
      { t: "Thu 09:12", text: "external attack-surface discovery lists an older contractor endpoint", tone: "sys" },
      { t: "Thu 11:40", text: "posture finding: spn-agent0-ops can reach more storage than its work needs", tone: "sys" },
      { t: "Thu 15:05", text: "agent ownership record: handover unresolved, no remediation owner", tone: "sys" },
      { t: "Fri 17:30", text: "night shift due at 20:00 · work packs queued for the open-pit crews", tone: "plain" },
      { t: "Fri 18:31", text: "an unfamiliar sign-in uses Agent 0's application identity", tone: "plain" },
      { t: "Fri 18:36", text: "Defender notes an unexpected process on agent0-int-01 contacting an unfamiliar address", tone: "er" },
      { t: "Fri 18:40", text: "a Sentinel incident links an unfamiliar app sign-in to the Agent 0 host. The watch is yours.", tone: "sys" },
    ],
    steps: [
      { note: "Quiet before the night shift. Every link in the chain is secure.", path: ["secure", "secure", "secure", "secure", "secure", "secure", "secure"] },
      { note: "A warning from outside: an older contractor endpoint is exposed.", path: ["watched", "secure", "secure", "secure", "secure", "secure", "secure"] },
      { note: "A second warning: the integration identity has too much access.", path: ["watched", "secure", "watched", "secure", "secure", "secure", "secure"] },
      { note: "A third: nobody owns Agent 0 after the handover.", path: ["watched", "watched", "watched", "secure", "secure", "secure", "secure"] },
      { note: "Friday evening. The crews are waiting for their work packs.", path: ["watched", "watched", "watched", "secure", "secure", "secure", "secure"] },
      { note: "18:31. An unfamiliar sign-in uses Agent 0's identity.", path: ["watched", "watched", "at risk", "secure", "secure", "secure", "secure"] },
      { note: "18:36. The Agent 0 host does something unexpected.", path: ["watched", "at risk", "at risk", "secure", "secure", "secure", "secure"] },
      { note: "18:40. Sentinel links the two. Nothing shows the plant is affected.", path: ["watched", "at risk", "at risk", "watched", "secure", "secure", "secure"] },
    ],
  },
  stages: [
    { id: "portal", name: "Contractor portal", sub: "Maintenance documents" },
    { id: "host", name: "Integration host", sub: "Agent 0 runtime in Azure" },
    { id: "identity", name: "Service principal & Key Vault", sub: "spn-agent0-ops" },
    { id: "data", name: "Maintenance data", sub: "Work orders & storage" },
    { id: "broker", name: "Contractor access broker", sub: "Separate remote access" },
    { id: "otdmz", name: "OT DMZ", sub: "Historian & engineering workstation" },
    { id: "plant", name: "Processing plant control", sub: "Site-owned, local control" },
  ],
  facts: FACTS,
  rounds: [triage, inject1, inject2, inject3, inject4, inject5],
  runPlan: {
    totalMinutes: 90,
    decideMinutes: 5,
    segments: [
      { key: "open", label: "Setting, control map, roles & practice", from: 0, to: 14, slides: "Briefing pack: the setting, control map and roles" },
      { key: "launch", label: "Launch: warnings before the night shift", from: 14, to: 15, slides: "Projector: the pre-incident timeline" },
      { key: "r1", label: "Triage · Duty SOC analyst", from: 15, to: 24, slides: "Briefing pack: Triage" },
      { key: "r2", label: "Inject 1 · Identity engineer", from: 24, to: 33, slides: "Briefing pack: Inject 1" },
      { key: "r3", label: "Inject 2 · SOC lead", from: 33, to: 42, slides: "Briefing pack: Inject 2" },
      { key: "r4", label: "Inject 3 · Incident commander + site OT lead", from: 42, to: 51, slides: "Briefing pack: Inject 3" },
      { key: "r5", label: "Inject 4 · CISO", from: 51, to: 60, slides: "Briefing pack: Inject 4" },
      { key: "r6", label: "Inject 5 · The board", from: 60, to: 69, slides: "Briefing pack: Inject 5" },
      { key: "close", label: "Whole-chain debrief, action planning, buffer", from: 69, to: 90, slides: "Briefing pack: whole-chain debrief and gap register" },
    ],
    advice: {
      openingBehind: "The opening is running long. Shorten the roles and practice, and go straight to the launch.",
      closingBehind: "The close is running long. Settle the gap register first, and leave the rest for a follow-up.",
      roundBehind: "This round is behind. Close the decisions now and keep the reveal to the three closing questions.",
      openingTighten: "Tighten the opening: name the setting, show the control map once, then launch.",
      roundTighten: "Tighten the round: one point from the reveal, then the three closing questions.",
    },
    closeMilestones: [
      { until: 79, text: "On schedule. Whole-chain debrief now; customer action planning by {79}, close by {87}." },
      { until: 87, text: "On schedule. Action planning: fill the gap register; close by {87}." },
    ],
  },
};
