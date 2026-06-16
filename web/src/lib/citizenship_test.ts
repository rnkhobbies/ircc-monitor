// Types for /public/citizenship_test.json — emitted from
// data/citizenship_test/question_bank.json. The page fetches this at runtime
// (not bundled into JS) so the main /index.html stays lean.

export type AnnotationRelevance =
  | "CORRECT_ANSWER"
  | "RELATED_FACT"
  | "PARTIALLY_CORRECT"
  | "PLAUSIBLE_DISTRACTOR"
  | "COMMON_MISCONCEPTION"
  | "ANACHRONISM"
  | "WRONG_CATEGORY";

export interface Annotation {
  relevance: AnnotationRelevance;
  source_section: string | null;
  source_page: number | null;
  explanation: string;
}

export interface OptionItem {
  text: string;
  is_correct: boolean;
  annotation: Annotation;
}

export type QuestionType = "multiple_choice" | "true_false";

export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  source_chapter: string;
  source_section: string;
  source_page: number;
  question_text: string;
  /**
   * "multiple_choice" → exactly 4 options.
   * "true_false"      → exactly 2 options, {text:"True"} and {text:"False"},
   *                     with exactly one is_correct:true. The question_text is a
   *                     declarative statement the user judges True or False.
   */
  question_type: QuestionType;
  options: OptionItem[];
  tags?: string[];
  cross_references?: string[];
  test_tip?: string;
}

export interface QuestionBank {
  version: string;
  as_of: string;
  source: string;
  schema_notes: string;
  questions: Question[];
}

/** Real-test constants. */
export const TEST_QUESTION_COUNT = 20;
export const TEST_PASS_THRESHOLD = 15;     // 75%, the real-test pass mark
export const TEST_TIME_LIMIT_SECONDS = 45 * 60; // 45 minutes

/** Fisher-Yates shuffle. Returns a new array. */
export function shuffle<T>(xs: readonly T[]): T[] {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pick {count} questions from the bank, attempting to roughly match the real
 * test's topic distribution. For an MVP we just shuffle the bank and take the
 * first {count}; if the user wants stricter distribution control later we can
 * do stratified sampling.
 */
export function pickQuestions(bank: QuestionBank, count: number): Question[] {
  return shuffle(bank.questions).slice(0, count);
}

/**
 * Each rendered question keeps a stable shuffle of its options (so the correct
 * answer isn't always position D), with the index of the originally-correct
 * option preserved so we can score it.
 */
export interface RenderedQuestion {
  question: Question;
  shuffledOptions: OptionItem[];
}

export function renderQuestion(q: Question): RenderedQuestion {
  // For true_false, keep a stable True-then-False order (shuffling would just
  // flip the two buttons around with no anti-positional-bias benefit, since the
  // labels themselves carry the meaning). For multiple_choice, shuffle so the
  // correct answer isn't always in the same slot.
  if (q.question_type === "true_false") {
    const ordered = [...q.options].sort((a, b) =>
      a.text === b.text ? 0 : a.text === "True" ? -1 : 1,
    );
    return { question: q, shuffledOptions: ordered };
  }
  return { question: q, shuffledOptions: shuffle(q.options) };
}

/** Score a completed attempt. */
export interface ScoreSummary {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  passed: boolean;
  byTopic: Record<string, { correct: number; total: number }>;
  byDifficulty: Record<string, { correct: number; total: number }>;
}

/**
 * answers maps the rendered-question index → the option-index *within the
 * shuffled options* that the user picked, or null if unanswered.
 */
export function scoreAttempt(
  rendered: RenderedQuestion[],
  answers: (number | null)[],
): ScoreSummary {
  const byTopic: ScoreSummary["byTopic"] = {};
  const byDifficulty: ScoreSummary["byDifficulty"] = {};
  let correct = 0;
  let unanswered = 0;

  rendered.forEach((rq, i) => {
    const chosen = answers[i];
    const t = rq.question.topic;
    const d = rq.question.difficulty;
    byTopic[t] ??= { correct: 0, total: 0 };
    byDifficulty[d] ??= { correct: 0, total: 0 };
    byTopic[t].total += 1;
    byDifficulty[d].total += 1;
    if (chosen == null) {
      unanswered += 1;
      return;
    }
    if (rq.shuffledOptions[chosen]?.is_correct) {
      correct += 1;
      byTopic[t].correct += 1;
      byDifficulty[d].correct += 1;
    }
  });

  const total = rendered.length;
  return {
    total,
    correct,
    incorrect: total - correct - unanswered,
    unanswered,
    passed: correct >= TEST_PASS_THRESHOLD,
    byTopic,
    byDifficulty,
  };
}

/** Format a remaining-seconds count as MM:SS. */
export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
