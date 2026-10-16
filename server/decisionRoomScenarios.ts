/**
 * Decision Room — scenario registry, revision pinning and replay.
 *
 * Migration policy (docs/DECISION_ROOM_VERSIONS.md, "Scenario revisions"):
 *   - Every room stores the scenario key it was created with (workshop_sessions.scenario).
 *   - A room with no stored key was created before pinning existed. Every such room —
 *     V1 CISO Basecamp and the early Agent 0 placeholder rooms alike — ran Riverbend,
 *     so it resolves to `riverbend@1` and keeps meaning exactly what it meant.
 *   - A stored key this build does not know is refused, never reinterpreted.
 *   - New V1 rooms get `riverbend@1`. New Agent 0 rooms get the Ironvale mining
 *     preview everywhere except production, where they stay on `riverbend@1` until
 *     DECISION_ROOM_AGENT0_SCENARIO names the approved Ironvale revision.
 */

import { RIVERBEND } from "./decisionRoomContent.js";
import { IRONVALE } from "./decisionRoomIronvale.js";
import type { Condition, Consequence, Dashboard, FactState, PublicRound, RoundContent, Scenario, ScenarioInfo, StageStatus } from "./decisionRoomTypes.js";

export const SCENARIOS: Record<string, Scenario> = { [RIVERBEND.key]: RIVERBEND, [IRONVALE.key]: IRONVALE };
/** What a room created before scenario pinning ran. */
export const LEGACY_SCENARIO_KEY = RIVERBEND.key;

/** The scenario a new room of this variant is pinned to. */
export function scenarioKeyForNewRoom(variant: string) {
  if (variant !== "agent0") return RIVERBEND.key;
  const configured = (process.env.DECISION_ROOM_AGENT0_SCENARIO ?? "").trim();
  if (configured) return SCENARIOS[configured] ? configured : RIVERBEND.key;
  // Preview content stays out of production rooms until it is approved and named explicitly.
  return process.env.VERCEL_ENV === "production" ? RIVERBEND.key : IRONVALE.key;
}

/** The scenario a stored room runs; null when the stored key is unknown to this build. */
export function resolveScenario(storedKey: string | null | undefined): Scenario | null {
  if (!storedKey) return SCENARIOS[LEGACY_SCENARIO_KEY];
  return SCENARIOS[storedKey] ?? null;
}

export function scenarioInfo(scenario: Scenario): ScenarioInfo {
  return { key: scenario.key, family: scenario.family, revision: scenario.revision, status: scenario.status, brand: scenario.brand };
}
export const roundCount = (scenario: Scenario) => scenario.rounds.length;
export function roundContent(scenario: Scenario, roundNo: number): RoundContent | null {
  return scenario.rounds.find((round) => round.roundNo === roundNo) ?? null;
}

/* ------------------------------------------------------------ replay
 * A table's state is a pure function of its published choices: replay each
 * round's consequence in order. Conditions read the choices and the state as it
 * stood when that round opened, so an earlier call changes later outcomes.
 */
type Facts = Record<string, string>;
type Replay = { meters: Record<string, number>; facts: Facts };

function holds(condition: Condition, choices: Map<number, string>, facts: Facts): boolean {
  if ("all" in condition) return condition.all.every((entry) => holds(entry, choices, facts));
  if ("fact" in condition) return condition.anyOf.includes(facts[condition.fact]);
  const chosen = choices.get(condition.round);
  if (!chosen) return false;
  return "option" in condition ? chosen === condition.option : condition.anyOf.includes(chosen);
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
function initial(scenario: Scenario): Replay {
  return { meters: { ...(scenario.initialMeters ?? {}) }, facts: Object.fromEntries((scenario.facts ?? []).map((fact) => [fact.id, fact.initial])) };
}
function pick(scenario: Scenario, roundNo: number, optionKey: string, choices: Map<number, string>, facts: Facts): Consequence | null {
  const option = roundContent(scenario, roundNo)?.options.find((entry) => entry.key === optionKey);
  if (!option) return null;
  return option.variants?.find((entry) => holds(entry.when, choices, facts))?.consequence ?? option.consequence;
}
function apply(scenario: Scenario, state: Replay, consequence: Consequence) {
  for (const [key, delta] of Object.entries(consequence.meters ?? {})) if (key in state.meters) state.meters[key] = clamp(state.meters[key] + delta);
  for (const [key, value] of Object.entries(consequence.sets ?? {})) if (scenario.facts?.find((fact) => fact.id === key)?.values[value]) state.facts[key] = value;
}
/** The table's state after replaying its choices for rounds 1..upToRound. */
export function replay(scenario: Scenario, choices: Map<number, string>, upToRound: number): Replay {
  const state = initial(scenario);
  for (let roundNo = 1; roundNo <= upToRound; roundNo += 1) {
    const chosen = choices.get(roundNo);
    const consequence = chosen ? pick(scenario, roundNo, chosen, choices, state.facts) : null;
    if (consequence) apply(scenario, state, consequence);
  }
  return state;
}
/** The consequence a table sees for its locked option, given its earlier locked choices. */
export function consequenceFor(scenario: Scenario, roundNo: number, optionKey: string, choices: Map<number, string>) {
  return pick(scenario, roundNo, optionKey, choices, replay(scenario, choices, roundNo - 1).facts);
}
export function factStates(scenario: Scenario, facts: Facts): FactState[] {
  return (scenario.facts ?? []).map((fact) => { const value = facts[fact.id] ?? fact.initial; const v = fact.values[value]; return { id: fact.id, name: fact.name, value, label: v?.label ?? value, tone: v?.tone ?? "neutral" }; });
}

/* ------------------------------------------------------------ what devices see */

/** Participant-safe shape of a round, resolved for one table's history: no consequences, no guidance, no reveal. */
export function publicRound(scenario: Scenario, round: RoundContent, choices: Map<number, string> = new Map()): PublicRound {
  const facts = replay(scenario, choices, round.roundNo - 1).facts;
  let briefing: PublicRound["briefing"];
  if (round.briefing) {
    const { variants, ...base } = round.briefing;
    const variant = variants?.find((entry) => holds(entry.when, choices, facts));
    briefing = { ...base, changed: variant?.changed ?? base.changed, evidence: variant?.evidence ?? base.evidence, unknown: variant?.unknown ?? base.unknown };
  }
  return {
    roundNo: round.roundNo, id: round.id, seat: round.seat, when: round.when, title: round.title, prompt: round.prompt,
    situation: round.situation, feed: round.feed,
    options: round.options.map((option) => ({ key: option.key, label: option.label, ...(option.cost ? { cost: option.cost } : {}) })),
    path: pathFor(scenario, round, choices, facts), durationSeconds: round.durationSeconds,
    ...(briefing ? { briefing } : {}),
  };
}
function pathFor(scenario: Scenario, round: RoundContent, choices: Map<number, string>, facts: Facts): StageStatus[] {
  return round.pathVariants?.find((entry) => holds(entry.when, choices, facts))?.path ?? round.path;
}
/** The table's dashboard for the active round: its state after its published choices. */
export function dashboardFor(scenario: Scenario, choices: Map<number, string>, upToRound: number, round: RoundContent | null): Dashboard {
  const state = replay(scenario, choices, upToRound);
  const path = round ? pathFor(scenario, round, choices, replay(scenario, choices, round.roundNo - 1).facts) : scenario.stages.map(() => "secure" as const);
  return {
    path, stages: scenario.stages,
    ...(scenario.meters ? { meters: state.meters, meterKeys: scenario.meters } : {}),
    ...(scenario.facts ? { facts: factStates(scenario, state.facts) } : {}),
  };
}
