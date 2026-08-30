import type { ResponseStyle } from "./incident-v03-data";

export type ResponseChoice = {
  option: {
    style: ResponseStyle;
  };
};

export type ResponseArchetypeKey =
  | ResponseStyle
  | "adaptive-controlled"
  | "adaptive-evidence"
  | "adaptive-rapid"
  | "controlled-evidence"
  | "controlled-rapid"
  | "evidence-rapid";

export type ResponseArchetype = {
  title: string;
  description: string;
  strength: string;
  tradeoff: string;
};

export type ResponseAnalysis = {
  key: ResponseArchetypeKey;
  profile: ResponseArchetype;
  primary: ResponseStyle;
  secondary: ResponseStyle;
  counts: Record<ResponseStyle, number>;
};

const styleOrder: ResponseStyle[] = ["controlled", "evidence", "rapid", "adaptive"];

export const responseStyleLabels: Record<ResponseStyle, string> = {
  controlled: "Containment",
  evidence: "Evidence",
  rapid: "Recovery",
  adaptive: "Adaptability",
};

export const responseArchetypes: Record<ResponseArchetypeKey, ResponseArchetype> = {
  controlled: {
    title: "The first responder",
    description: "You create a safe boundary before asking the system to recover.",
    strength: "You limit the blast radius and make consequential actions accountable.",
    tradeoff: "You can over-isolate service or keep people in the loop for too long.",
  },
  evidence: {
    title: "The investigator",
    description: "You protect the trail from signal to decision before it disappears.",
    strength: "You recover with a defensible view of cause, impact, and trust.",
    tradeoff: "Evidence gathering can extend customer or operational impact.",
  },
  rapid: {
    title: "The restorer",
    description: "You prioritise useful service and keep the organisation moving under pressure.",
    strength: "You find the shortest credible path back to customer value.",
    tradeoff: "Speed can hide the cause, transfer the risk, or repeat the fault.",
  },
  adaptive: {
    title: "The adaptive strategist",
    description: "You change posture as the incident reveals new constraints.",
    strength: "You preserve options and respond to the conditions in front of you.",
    tradeoff: "Frequent course changes need clear ownership and strong observability.",
  },
  "adaptive-controlled": {
    title: "The measured commander",
    description: "You bound the risk, then adjust the controls as conditions change.",
    strength: "You combine disciplined containment with practical flexibility.",
    tradeoff: "Changing boundaries under pressure can confuse ownership if they are not explicit.",
  },
  "adaptive-evidence": {
    title: "The systems thinker",
    description: "You read the whole system, then adapt as stronger evidence arrives.",
    strength: "You make context-rich decisions without becoming locked to the first theory.",
    tradeoff: "You may wait for one more signal when a harder intervention is needed.",
  },
  "adaptive-rapid": {
    title: "The pragmatic operator",
    description: "You restore useful service in stages and adjust from real-world feedback.",
    strength: "You create momentum without making one irreversible recovery bet.",
    tradeoff: "A temporary workaround can become permanent before the cause is resolved.",
  },
  "controlled-evidence": {
    title: "The forensic guardian",
    description: "You tighten the trust boundary while preserving the evidence inside it.",
    strength: "You make containment and recovery highly defensible.",
    tradeoff: "Thorough control can extend disruption and increase manual workload.",
  },
  "controlled-rapid": {
    title: "The crisis commander",
    description: "You stop the immediate harm, then push hard to restore critical service.",
    strength: "You combine decisive control with a strong bias for customer continuity.",
    tradeoff: "Fast recovery can outrun the evidence needed to prevent recurrence.",
  },
  "evidence-rapid": {
    title: "The diagnostic restorer",
    description: "You gather enough proof to recover without losing the path to root cause.",
    strength: "You turn evidence into practical recovery decisions quickly.",
    tradeoff: "The approach depends on judging when the evidence is truly sufficient.",
  },
};

const pairKeyFor = (first: ResponseStyle, second: ResponseStyle): ResponseArchetypeKey => {
  const pair = new Set<ResponseStyle>([first, second]);
  if (pair.has("adaptive") && pair.has("controlled")) return "adaptive-controlled";
  if (pair.has("adaptive") && pair.has("evidence")) return "adaptive-evidence";
  if (pair.has("adaptive") && pair.has("rapid")) return "adaptive-rapid";
  if (pair.has("controlled") && pair.has("evidence")) return "controlled-evidence";
  if (pair.has("controlled") && pair.has("rapid")) return "controlled-rapid";
  return "evidence-rapid";
};

export function analyseResponse(choices: ResponseChoice[]): ResponseAnalysis {
  const counts = choices.reduce<Record<ResponseStyle, number>>(
    (result, choice) => ({ ...result, [choice.option.style]: result[choice.option.style] + 1 }),
    { adaptive: 0, rapid: 0, evidence: 0, controlled: 0 },
  );

  const firstSeen = Object.fromEntries(
    styleOrder.map((style) => {
      const index = choices.findIndex((choice) => choice.option.style === style);
      return [style, index === -1 ? Number.POSITIVE_INFINITY : index];
    }),
  ) as Record<ResponseStyle, number>;

  const ranked = [...styleOrder].sort(
    (first, second) => counts[second] - counts[first] || firstSeen[first] - firstSeen[second],
  );
  const primary = ranked[0];
  const secondary = ranked.find((style) => style !== primary && counts[style] > 0) ?? ranked[1];
  const isDominant = counts[primary] - counts[secondary] >= 2;
  const key = isDominant ? primary : pairKeyFor(primary, secondary);

  return {
    key,
    profile: responseArchetypes[key],
    primary,
    secondary,
    counts,
  };
}

export function scoreBandFor(score: number) {
  if (score >= 95) return "Exceptional decision quality";
  if (score >= 88) return "Strong decision quality";
  if (score >= 80) return "Sound decision quality";
  return "Risk-exposed decision quality";
}
