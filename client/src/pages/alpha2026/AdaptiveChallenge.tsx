import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Network,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  type AdaptiveQuestion,
  type FocusKey,
  difficultyLabel,
  focusDefinitions,
  questionsForFocus,
} from "./adaptive-question-bank";
import "./alpha-2026.css";
import "./adaptive-challenge.css";

type Phase = "launch" | "question" | "result";

type AnswerRecord = {
  question: AdaptiveQuestion;
  answerIndex: number;
  correct: boolean;
  ability: number;
};

const TOTAL_QUESTIONS = 5;
const challengeUrl = "https://data3-cisco-live.vercel.app/2026alpha";

const focusIcons: Record<FocusKey, typeof Network> = {
  networking: Network,
  security: ShieldCheck,
  collaboration: UsersRound,
  ai: BrainCircuit,
};

function chooseQuestion(focus: FocusKey, target: number, usedIds: string[]) {
  return questionsForFocus(focus)
    .filter((candidate) => !usedIds.includes(candidate.id))
    .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target) || a.rating - b.rating)[0];
}

function resultProfile(correct: number) {
  if (correct === 5) return { title: "Systems-level engineer", detail: "You kept speed, evidence, and control working together under pressure." };
  if (correct === 4) return { title: "Evidence-led operator", detail: "You protected the outcome without letting urgency erase the evidence." };
  if (correct >= 2) return { title: "Controlled responder", detail: "Your instincts are sound. The harder trade-offs exposed where guardrails matter most." };
  return { title: "Curious investigator", detail: "You found the pressure points. Now you know which signals change the response." };
}

export default function AdaptiveChallenge() {
  const [phase, setPhase] = useState<Phase>("launch");
  const [focus, setFocus] = useState<FocusKey | null>(null);
  const [ability, setAbility] = useState(1);
  const [question, setQuestion] = useState<AdaptiveQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [nextAbility, setNextAbility] = useState(1);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const screenHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = "Adaptive incident challenge | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Choose your focus and take five adaptive engineering challenges in a Data#3 Cisco Live 2026 prototype.",
    );
  }, []);

  useEffect(() => {
    if (phase !== "launch") {
      window.scrollTo({ top: 0, behavior: "auto" });
      window.requestAnimationFrame(() => screenHeadingRef.current?.focus());
    }
  }, [phase, questionNumber]);

  const beginChallenge = () => {
    if (!focus) return;
    const openingQuestion = chooseQuestion(focus, 1, []);
    setAbility(1);
    setNextAbility(1);
    setQuestion(openingQuestion);
    setQuestionNumber(1);
    setSelectedAnswer(null);
    setAnswers([]);
    setPhase("question");
  };

  const answerQuestion = (answerIndex: number) => {
    if (!question || selectedAnswer !== null) return;
    const correct = answerIndex === question.correctIndex;
    const responseAbility = Math.max(0, Math.min(4, ability + (correct ? 2 : -1)));
    const calibratedAbility = questionNumber === TOTAL_QUESTIONS - 1
      ? 6
      : questionNumber === TOTAL_QUESTIONS
        ? ability
        : responseAbility;
    setSelectedAnswer(answerIndex);
    setNextAbility(calibratedAbility);
    setAnswers((current) => [...current, { question, answerIndex, correct, ability }]);
  };

  const continueChallenge = () => {
    if (!focus || selectedAnswer === null) return;
    if (answers.length >= TOTAL_QUESTIONS) {
      setPhase("result");
      return;
    }
    const nextQuestion = chooseQuestion(focus, nextAbility, answers.map((answer) => answer.question.id));
    setAbility(nextAbility);
    setQuestion(nextQuestion);
    setQuestionNumber((current) => current + 1);
    setSelectedAnswer(null);
  };

  const resetChallenge = () => {
    setPhase("launch");
    setFocus(null);
    setAbility(1);
    setQuestion(null);
    setQuestionNumber(1);
    setSelectedAnswer(null);
    setAnswers([]);
  };

  const focusDefinition = focusDefinitions.find((option) => option.key === focus);

  return (
    <div className="adaptive-page">
      <div className="adaptive-grid" aria-hidden="true" />
      <header className="adaptive-header">
        <a href="/2026alpha" className="adaptive-brand" aria-label="Data#3 adaptive incident challenge">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        <div className="adaptive-status"><span />Interactive alpha <b aria-hidden="true">·</b> No data saved</div>
      </header>

      {phase === "launch" && (
        <main className="adaptive-launch">
          <section className="adaptive-launch__promise" aria-labelledby="adaptive-title">
            <p className="adaptive-kicker">Cisco Live 2026 <span aria-hidden="true">·</span> Adaptive incident challenge</p>
            <h1 id="adaptive-title">Can you contain an AI incident?</h1>
            <p className="adaptive-lead">
              Choose a focus. Make five engineering decisions. The better you do, the harder it gets.
            </p>

            <div className="adaptive-facts" aria-label="Challenge details">
              <span><Sparkles aria-hidden="true" /> Five decisions</span>
              <span><Clock3 aria-hidden="true" /> About 90 seconds</span>
              <span><Gauge aria-hidden="true" /> Adaptive difficulty</span>
            </div>

            <section className="adaptive-learning" aria-labelledby="learning-title">
              <h2 id="learning-title">Play to practise</h2>
              <p>Spot the signal, set useful guardrails, and recover without losing the evidence.</p>
            </section>
          </section>

          <aside className="adaptive-launch__action" aria-labelledby="focus-title">
            <div className="adaptive-focus-heading">
              <p className="adaptive-kicker">Choose your path</p>
              <h2 id="focus-title">Choose where it starts.</h2>
            </div>

            <div className="adaptive-focus-grid" role="radiogroup" aria-label="Technology focus">
              {focusDefinitions.map(({ key, label, detail }) => {
                const Icon = focusIcons[key];
                return (
                  <button
                    className={`adaptive-focus ${focus === key ? "is-selected" : ""}`}
                    type="button"
                    role="radio"
                    aria-checked={focus === key}
                    key={key}
                    onClick={() => setFocus(key)}
                  >
                    <Icon aria-hidden="true" />
                    <span><strong>{label}</strong><small>{detail}</small></span>
                  </button>
                );
              })}
            </div>

            <button className="adaptive-primary" type="button" disabled={!focus} onClick={beginChallenge}>
              Start the challenge <ArrowRight aria-hidden="true" />
            </button>

            <div className="adaptive-reward">
              <Trophy aria-hidden="true" />
              <p><strong>At Cisco Live:</strong> complete the challenge to unlock an entry in the draw. This alpha does not submit an entry.</p>
            </div>

            <a className="adaptive-qr" href={challengeUrl} aria-label="Open this challenge on your mobile">
              <span aria-hidden="true"><QRCodeSVG value={challengeUrl} size={84} level="H" bgColor="#ffffff" fgColor="#000025" /></span>
              <span><strong>Move to mobile</strong><small>Scan the live challenge</small></span>
            </a>
          </aside>
        </main>
      )}

      {phase === "question" && question && focusDefinition && (
        <main className="adaptive-game">
          <div className="adaptive-game__topline">
            <span>Question {questionNumber} of {TOTAL_QUESTIONS}</span>
            <span>{focusDefinition.label}</span>
            <strong className={`adaptive-level adaptive-level--${difficultyLabel(ability).toLowerCase()}`}>
              {difficultyLabel(ability)}
            </strong>
          </div>
          <div className="adaptive-progress" aria-label={`${questionNumber} of ${TOTAL_QUESTIONS} questions`}>
            <span style={{ width: `${(questionNumber / TOTAL_QUESTIONS) * 100}%` }} />
          </div>

          <section className="adaptive-question" aria-labelledby="question-title">
            <p className="adaptive-kicker">{question.stage}</p>
            <p className="adaptive-context">{question.context}</p>
            <h1 id="question-title" ref={screenHeadingRef} tabIndex={-1}>{question.prompt}</h1>

            <div className="adaptive-options" aria-label="Choose one answer">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = selectedAnswer !== null && index === question.correctIndex;
                const isWrong = isSelected && !isCorrect;
                return (
                  <button
                    className={`adaptive-option ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
                    type="button"
                    key={option}
                    onClick={() => answerQuestion(index)}
                    disabled={selectedAnswer !== null}
                    aria-pressed={isSelected}
                  >
                    <span className="adaptive-option__letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                    {isCorrect && <CheckCircle2 aria-label="Correct answer" />}
                    {isWrong && <XCircle aria-label="Your answer" />}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div className={`adaptive-feedback ${selectedAnswer === question.correctIndex ? "is-correct" : "is-pressure"}`}>
                <div role="status">
                  <div className="adaptive-feedback__heading">
                    {selectedAnswer === question.correctIndex ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
                    <div>
                      <p>{selectedAnswer === question.correctIndex ? "Good call" : "Pressure increased"}</p>
                      <h2>{question.principle}</h2>
                    </div>
                  </div>
                  <p>{question.explanation}</p>
                  <div className="adaptive-calibration">
                    <span>Challenge recalibrated</span>
                    <strong>{difficultyLabel(nextAbility)}</strong>
                  </div>
                </div>
                <button className="adaptive-primary adaptive-primary--compact" type="button" onClick={continueChallenge}>
                  {answers.length >= TOTAL_QUESTIONS ? "See my result" : "Next decision"} <ChevronRight aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        </main>
      )}

      {phase === "result" && focusDefinition && (() => {
        const correct = answers.filter((answer) => answer.correct).length;
        const profile = resultProfile(correct);
        const peakRating = Math.max(...answers.map((answer) => answer.ability));
        return (
          <main className="adaptive-result">
            <section className="adaptive-result__hero" aria-labelledby="result-title">
              <p className="adaptive-kicker">Challenge complete <span aria-hidden="true">·</span> {focusDefinition.label}</p>
              <h1 id="result-title" ref={screenHeadingRef} tabIndex={-1}>{profile.title}</h1>
              <p>{profile.detail}</p>
              <div className="adaptive-result__score" aria-label={`${correct} correct answers out of ${TOTAL_QUESTIONS}`}>
                <strong>{correct}<small>/{TOTAL_QUESTIONS}</small></strong>
                <span>decisions held up under pressure</span>
              </div>
            </section>

            <section className="adaptive-result__panel" aria-labelledby="path-title">
              <p className="adaptive-kicker">Your adaptive path</p>
              <h2 id="path-title">You reached {difficultyLabel(peakRating)}.</h2>
              <div className="adaptive-path" aria-label="Your five results">
                {answers.map((answer, index) => (
                  <span className={answer.correct ? "is-correct" : "is-wrong"} key={answer.question.id} title={answer.question.principle}>
                    {index + 1}
                  </span>
                ))}
              </div>
              <blockquote>{focusDefinition.resultTakeaway}</blockquote>
              <p className="adaptive-conversation">Compare your path with a Data<sup>#</sup>3 engineer: which decision would they challenge?</p>
              <button className="adaptive-primary" type="button" onClick={resetChallenge}>
                Try another focus <RotateCcw aria-hidden="true" />
              </button>
              <p className="adaptive-alpha-note"><Trophy aria-hidden="true" /> Prototype result only. No draw entry or personal data has been submitted.</p>
            </section>
          </main>
        );
      })()}

      <footer className="adaptive-footer">
        <p>Data<sup>#</sup>3 <span aria-hidden="true">·</span> Delivering the Digital Future</p>
        <a href="/2026alpha/archive">Earlier concept archive</a>
      </footer>
    </div>
  );
}
