import type { TriviaCardCategory } from "@/data/triviaCards";

export interface TriviaQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  dropIndex?: number | null;
  explanation?: string | null;
}

export interface TriviaTrackMeta {
  id: TriviaCardCategory;
  name: string;
  accentClass: string;
  description: string;
}

export interface TriviaDeckCard {
  id: string;
  category: TriviaCardCategory;
  stem: string;
  choices: string[];
  correctIndex: number;
  dropIndex: number | null;
  hint9s: string;
  difficulty: number;
  tags?: string[] | null;
  explanation?: string | null;
}

export function triviaCardToQuestion(card: TriviaDeckCard): TriviaQuestion {
  const fallbackHint = card.explanation?.trim() || "Keep the scenario details in mind.";

  return {
    id: card.id,
    prompt: card.stem,
    choices: card.choices,
    correctIndex: card.correctIndex,
    hint: card.hint9s?.trim() || fallbackHint,
    dropIndex: card.dropIndex ?? null,
    explanation: card.explanation?.trim() ?? null,
  } satisfies TriviaQuestion;
}

