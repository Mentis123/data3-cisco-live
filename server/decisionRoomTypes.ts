/**
 * Decision Room — the scenario contract.
 *
 * A room is pinned to one scenario revision when it is created (the
 * `scenario` column on workshop_sessions). Everything a device sees — the
 * organisation, the launch, every round, consequences, the state model, the
 * facilitator guidance, the run plan and the report — is resolved from that
 * revision, never from a global constant. A published revision is never edited
 * in a way that changes what an existing room's choices meant: change content
 * by adding a new revision key and pointing new rooms at it.
 *
 * Visibility, enforced in scenarios.ts / api.ts:
 *   participant, round open      → organisation, round (situation, feed, briefing, option labels)
 *   participant, round published → + the table's own consequence and the round's reveal
 *   projector (display token)    → the same as a participant minus any one table's consequence
 *   facilitator (admin key)      → + guidance, best move, run plan, report and CSV
 */

export type OptionKey = "A" | "B" | "C" | "D";
export type StageStatus = "secure" | "watched" | "at risk" | "compromised" | "contained" | "blind" | "safe state";
export type Tone = "good" | "warn" | "bad" | "neutral";

/**
 * A condition on this table's history. Round conditions read the table's locked
 * option in an earlier round (1-based). Fact conditions read the table's
 * simulated state as it stood when the round opened (after replaying every
 * earlier published choice).
 */
export type Condition =
  | { round: number; option: string }
  | { round: number; anyOf: string[] }
  | { fact: string; anyOf: string[] }
  | { all: Condition[] };

export type Change = { t: string; d: "up" | "down" | "flag" };

export type Consequence = {
  you: string;
  body: string;
  changes: Change[];
  /** Numeric meter deltas (Riverbend). */
  meters?: Record<string, number>;
  /** Named-state transitions (Ironvale): fact id → value id from that fact's `values`. */
  sets?: Record<string, string>;
};

export type OptionContent = {
  key: OptionKey;
  label: string;
  /** One line shown under the label on the table device: the cost the table accepts. */
  cost?: string;
  consequence: Consequence;
  /** Alternative outcomes when a condition on this table's history holds. First match wins. */
  variants?: { when: Condition; consequence: Consequence }[];
};

export type FeedMessage = { kind: "alert" | "soc" | "exec" | "legal" | "press" | "ot"; who: string; text: string };

/** One sourced observation. Synthetic exercise material, labelled as such on screen. */
export type Evidence = {
  /** Where it comes from, e.g. "Microsoft Sentinel · incident timeline". */
  source: string;
  /** Event time, and discovery time when they differ, e.g. "18:31 event · 18:40 seen". */
  at: string;
  /** Asset, identity or channel it covers, e.g. "agent0-int-01 (Azure VM)". */
  scope: string;
  observation: string;
  /** Plain-English "so what" for a non-specialist. */
  implication: string;
  /** "evidence" = a recorded observation; "interpretation" = an AI or human reading of evidence. */
  kind: "evidence" | "interpretation";
  certainty: "confirmed" | "partial" | "unverified";
};

export type Control = { product: string; capability: string; limit: string; owner: string };

export type Briefing = {
  /** "You are…" and what you may authorise. */
  role: string;
  /** e.g. "Next ten minutes". */
  horizon: string;
  /** What changed: one short paragraph. */
  changed: string;
  evidence: Evidence[];
  /** The visible gap that matters to the decision. */
  unknown: string;
  /** Who or what is affected, what keeps working, the cost of delay. */
  stakes: string;
  /** Duties assumed to run in parallel whatever the table picks. */
  parallel?: string;
  /** Optional context: product → capability → limit → owner. Never labels an option as recommended. */
  controls: Control[];
  glossary?: { term: string; meaning: string }[];
  /** History-dependent replacements for `changed` / `evidence` / `unknown`. First match wins. */
  variants?: { when: Condition; changed?: string; evidence?: Evidence[]; unknown?: string }[];
};

/** Shown to every device only after the round is published. */
export type Reveal = {
  /** What the control in play could and could not do. */
  boundary: string;
  /** Decision → process → technology → gap → next step, in two or three sentences. */
  lesson: string;
  /** The closing prompts for table discussion. */
  questions: string[];
};

/** Facilitator-only: Rich's conditional reasoning. Never sent to a table or the projector. */
export type Guidance = {
  preferred: OptionKey;
  /** The conditions under which the preference holds. */
  conditions: string;
  /** A defensible alternative and when it wins. */
  alternative: string;
  /** The evidence that would change the recommendation. */
  changeEvidence: string;
  /** The facilitator notes: product detail and talking points. */
  notes: string[];
};

export type RoundContent = {
  roundNo: number;
  id: string;
  seat: string;
  when: string;
  title: string;
  prompt: string;
  /** Short situation lines. With a briefing these are a compact summary for the projector. */
  situation: string[];
  feed: FeedMessage[];
  options: OptionContent[];
  /** Attack-path statuses, in stage order, as the round opens. */
  path: StageStatus[];
  /** History-dependent paths. First match wins. */
  pathVariants?: { when: Condition; path: StageStatus[] }[];
  durationSeconds: number;
  briefing?: Briefing;
  reveal?: Reveal;
  guidance?: Guidance;
};

export type Stage = { id: string; name: string; sub: string };
export type MeterDef = { id: string; name: string; good: boolean };
/** A named simulation state, e.g. "Integration host" → "isolated". */
export type FactDef = { id: string; name: string; initial: string; values: Record<string, { label: string; tone: Tone }> };

export type Organisation = { name: string; tagline: string; estate: string; holds: string; reach: string; objective: string };

export type Launch = {
  /** Panel title for `profile`, e.g. "The adversary" or "Warnings before the night shift". */
  profileTitle: string;
  /** Prefix for each profile note, e.g. "mirrors" (Riverbend) or "source" (Ironvale). */
  notePrefix: string;
  profile: { label: string; value: string; note: string }[];
  /** Disclaimer under the profile panel. */
  profileHint: string;
  /** Header on the projector terminal, e.g. "agent@riverbend — autonomous". */
  terminal: string;
  lines: { t: string; text: string; tone: "plain" | "sys" | "er" }[];
  /** Projector attack path and caption for each number of visible lines (index 0 = nothing shown yet). */
  steps: { note: string; path: StageStatus[] }[];
};

export type RunSegment = { key: string; label: string; from: number; to: number; slides: string };
export type RunPlan = {
  totalMinutes: number;
  /** Minutes of each round given to tables deciding; the rest is reveal and discussion. */
  decideMinutes: number;
  /** Index into `segments` of the launch segment, then six round segments, then the close. */
  segments: RunSegment[];
  /** Advice lines that name slides; kept generic when there is no deck. */
  advice: { openingBehind: string; closingBehind: string; roundBehind: string; openingTighten: string; roundTighten: string };
  /** On-schedule advice during the close, first whose `until` minute is still ahead. `{74}` prints the re-fitted clock time of minute 74. */
  closeMilestones?: { until: number; text: string }[];
};

export type Scenario = {
  /** Persisted on the room, e.g. "riverbend@1". Never reuse a key for different content. */
  key: string;
  family: "riverbend" | "ironvale";
  revision: string;
  /** "live" = approved for customer rooms; "preview" = review/rehearsal only. */
  status: "live" | "preview";
  brand: {
    /** Header kicker, e.g. "WHEN THE AGENT ATTACKS · RIVERBEND". */
    kicker: string;
    /** Short name used in labels, e.g. "Riverbend" / "Ironvale". */
    short: string;
    reportTitle: string;
    pathTitle: string;
    /** Labels the visual state as an exercise model, when the scenario wants it said. */
    simulationNote?: string;
    lobby: { title: string; hint: string };
    launched: { title: string; body: string };
    ended: { title: string; body: string };
    /** Projector headline in the lobby and during the launch. */
    consoleLobby: string;
    consoleLaunched: string;
    /** Report footnote under the table journeys. */
    reportNote: string;
    /** "best-move" compares the room with one preferred letter; "conditional" shows guidance and never scores. */
    reportMode: "best-move" | "conditional";
  };
  organisation: Organisation;
  launch: Launch;
  stages: Stage[];
  /** Either numeric meters (Riverbend) or named facts (Ironvale). */
  meters?: MeterDef[];
  initialMeters?: Record<string, number>;
  facts?: FactDef[];
  rounds: RoundContent[];
  /** Facilitator report only (best-move mode). */
  bestMove?: Record<number, OptionKey>;
  runPlan: RunPlan;
};

/* ------------------------------------------------------------ API payload shapes
 * What the client receives. The client never imports the scenario modules.
 */

export type ScenarioInfo = { key: string; family: Scenario["family"]; revision: string; status: Scenario["status"]; brand: Scenario["brand"] };
export type FactState = { id: string; name: string; value: string; label: string; tone: Tone };
export type PublicRound = {
  roundNo: number; id: string; seat: string; when: string; title: string; prompt: string;
  situation: string[]; feed: FeedMessage[];
  options: { key: OptionKey; label: string; cost?: string }[];
  path: StageStatus[]; durationSeconds: number;
  /** Already resolved for this table's history (variants applied, `variants` removed). */
  briefing?: Omit<Briefing, "variants">;
};
export type Dashboard = {
  path: StageStatus[];
  stages: Stage[];
  meters?: Record<string, number>;
  meterKeys?: MeterDef[];
  facts?: FactState[];
};
