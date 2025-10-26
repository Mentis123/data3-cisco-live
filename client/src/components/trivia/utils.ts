import type { TriviaCardCategory } from "@/data/triviaCards";

export interface Data3Stat {
  id: string;
  title: string;
  value: string;
  description?: string | null;
  category: string;
}

export interface TriviaQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  hint: string;
}

export interface TriviaTrackMeta {
  id: TriviaCardCategory;
  name: string;
  accentClass: string;
  summary: string;
  description: string;
}

function shuffleInPlace<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatWithGrouping(value: number, decimals: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function generateNumericVariant(original: string, variantIndex: number): string {
  const match = original.match(/(-?\d[\d,.]*(?:\.\d+)?)/);
  if (!match || match.index === undefined) {
    const suffix = variantIndex === 0 ? "?" : "±";
    return `${original} ${suffix}`.trim();
  }

  const numericSegment = match[0];
  const prefix = original.slice(0, match.index);
  const suffix = original.slice(match.index + numericSegment.length);
  const normalized = Number.parseFloat(numericSegment.replace(/,/g, ""));

  if (!Number.isFinite(normalized)) {
    return `${original}*`;
  }

  const multipliers = [0.6, 0.75, 0.85, 1.35, 1.55, 1.75];
  const multiplier = multipliers[(variantIndex + Math.floor(Math.random() * multipliers.length)) % multipliers.length];
  const decimals = numericSegment.includes(".") ? Math.min(numericSegment.split(".")[1]?.length ?? 0, 2) : 0;
  const adjusted = Math.max(1, normalized * multiplier);
  const formatted = formatWithGrouping(adjusted, decimals);

  return `${prefix}${formatted}${suffix}`;
}

function buildChoices(correctValue: string, distractorPool: string[]): { choices: string[]; correctIndex: number } {
  const pool = shuffleInPlace(
    Array.from(
      new Set(
        distractorPool
          .map((value) => value.trim())
          .filter((value) => value && value.toLowerCase() !== correctValue.trim().toLowerCase()),
      ),
    ),
  );

  const wrongChoices: string[] = [];
  for (const candidate of pool) {
    if (wrongChoices.length >= 2) break;
    if (!wrongChoices.includes(candidate)) {
      wrongChoices.push(candidate);
    }
  }

  while (wrongChoices.length < 2) {
    wrongChoices.push(generateNumericVariant(correctValue, wrongChoices.length));
  }

  const choices = shuffleInPlace([correctValue, ...wrongChoices]);
  const correctIndex = choices.findIndex((choice) => choice === correctValue);

  return { choices, correctIndex: correctIndex === -1 ? 0 : correctIndex };
}

export type CategorisedData3Stat = Data3Stat & { category: TriviaCardCategory };

export function buildTriviaDeck(
  stats: CategorisedData3Stat[] | undefined,
  trackId: TriviaCardCategory | null,
): TriviaQuestion[] {
  if (!stats || !trackId) {
    return [];
  }

  const relevantStats = stats.filter((stat) => stat.category === trackId);
  if (!relevantStats.length) {
    return [];
  }

  const shuffled = shuffleInPlace(relevantStats);
  return shuffled.map((stat) => {
    const { choices, correctIndex } = buildChoices(
      stat.value,
      stats.filter((candidate) => candidate.id !== stat.id).map((candidate) => candidate.value),
    );

    const prompt = `According to Data#3, what is ${stat.title.toLowerCase().startsWith("the") ? stat.title : `the ${stat.title}`}?`;
    const hint = stat.description?.trim() || `Focus on ${stat.title}.`;

    return {
      id: stat.id,
      prompt,
      choices,
      correctIndex,
      hint,
    } satisfies TriviaQuestion;
  });
}

