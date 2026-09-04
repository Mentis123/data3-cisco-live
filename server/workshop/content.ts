/**
 * Decision Room scenario copy.
 *
 * This lives server side on purpose. Participant devices only ever receive the
 * content for the round that is currently open, so unreleased round copy cannot
 * sit in the client bundle. Reveal text is not here at all: reveals are
 * projected from the deck and read aloud, exactly as they are in the printed
 * pack.
 */

export type WorkshopRoundOption = {
  key: string;
  label: string;
};

export type WorkshopRoundContent = {
  contentKey: string;
  roundNumber: number;
  durationSeconds: number;
  /** Shown on the slide as well; repeated here so a table can re-read it. */
  heading: string;
  task: string;
  /** Round one only. Later rounds lock one sentence plus confidence. */
  options: WorkshopRoundOption[];
  lockHint: string;
};

export type WorkshopVariantContent = {
  label: string;
  system: string;
  rounds: WorkshopRoundContent[];
};

const SHARED_OWN_ACTION_HINT = "Or write your own action, stated precisely.";

export const workshopContent: Record<string, WorkshopVariantContent> = {
  enterprise: {
    label: "Enterprise",
    system: "Project Atlas",
    rounds: [
      {
        contentKey: "enterprise.round1",
        roundNumber: 1,
        durationSeconds: 12 * 60,
        heading: "Round one · 09:17 · Legitimate identity, unexpected reach",
        task: "What do you stop first? Take the facts as given and name the unknown that matters most.",
        options: [
          { key: "A", label: "Pause the entire agent" },
          { key: "B", label: "Disable sharing and write actions; retain read-only evidence access" },
          { key: "C", label: "Observe for ten more minutes and capture the full chain" },
        ],
        lockHint: `Lock: option or own action · confidence 1–5 · one-sentence rationale. ${SHARED_OWN_ACTION_HINT}`,
      },
      {
        contentKey: "enterprise.round2",
        roundNumber: 2,
        durationSeconds: 8 * 60,
        heading: "Round two · Name the lead, scope containment, preserve evidence",
        task: "Who owns the incident decision now? What do you isolate first, and what must be preserved before your next action changes it? Use the printed task page for the full structure.",
        options: [],
        lockHint: "Lock: one sentence carrying the lead and containment scope · confidence 1–5.",
      },
      {
        contentKey: "enterprise.round3",
        roundNumber: 3,
        durationSeconds: 8 * 60,
        heading: "Round three · Containment is now a continuity decision",
        task: "Choose the trade-off now: containment, continuity and communications. Define the minimum conditions before restart.",
        options: [],
        lockHint: "Lock: the action you take now and the consequence you accept · confidence 1–5.",
      },
    ],
  },
  government: {
    label: "Government",
    system: "Civic Assist",
    rounds: [
      {
        contentKey: "government.round1",
        roundNumber: 1,
        durationSeconds: 12 * 60,
        heading: "Round one · 11:06 · Approved task, abnormal data path",
        task: "What do you stop first? Take the facts as given and name the unknown that matters most.",
        options: [
          { key: "A", label: "Pause Civic Assist completely" },
          { key: "B", label: "Remove export and write privileges; retain scoped read access" },
          { key: "C", label: "Observe for ten more minutes while capturing telemetry" },
        ],
        lockHint: `Lock: option or own action · confidence 1–5 · one-sentence rationale. ${SHARED_OWN_ACTION_HINT}`,
      },
      {
        contentKey: "government.round2",
        roundNumber: 2,
        durationSeconds: 8 * 60,
        heading: "Round two · Declare the structure, reconstruct the path, act before certainty",
        task: "Who leads, who advises and who holds communication authority? What evidence is sufficient to contain now, and what remains unconfirmed? Use the printed task page for the full structure.",
        options: [],
        lockHint: "Lock: one sentence carrying the lead and containment scope · confidence 1–5.",
      },
      {
        contentKey: "government.round3",
        roundNumber: 3,
        durationSeconds: 8 * 60,
        heading: "Round three · Containment collides with essential service",
        task: "Set containment scope and the continuity measure that keeps essential notifications available. Name who approves the first public line and who may authorise restart.",
        options: [],
        lockHint: "Lock: the action you take now and the service consequence you accept · confidence 1–5.",
      },
    ],
  },
};

export function variantContent(variant: string): WorkshopVariantContent | null {
  return workshopContent[variant] ?? null;
}

export function roundContent(variant: string, roundNumber: number): WorkshopRoundContent | null {
  return variantContent(variant)?.rounds.find((round) => round.roundNumber === roundNumber) ?? null;
}

export const WORKSHOP_ROUND_COUNT = 3;
