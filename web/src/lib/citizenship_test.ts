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

export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  source_chapter: string;
  source_section: string;
  source_page: number;
  question_text: string;
  question_type: "multiple_choice";
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

/** Seeded PRNG (mulberry32) — used so test sets are deterministic across visits. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(xs: readonly T[], seed: number): T[] {
  const out = xs.slice();
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Hash a string to a non-negative 32-bit int. Used to seed option shuffles. */
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Fisher-Yates shuffle with Math.random. Kept for non-deterministic callers. */
export function shuffle<T>(xs: readonly T[]): T[] {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Number of named practice tests, derived from the bank size. */
export function totalTests(bank: QuestionBank): number {
  return Math.floor(bank.questions.length / TEST_QUESTION_COUNT);
}

/**
 * Deterministic question list for practice test #N (1-indexed).
 * The bank is sorted by question.id (stable) then shuffled with a fixed seed,
 * then split into chunks of TEST_QUESTION_COUNT. So test N always contains the
 * same 20 questions across visits, devices, and reloads.
 */
export function getTestQuestions(bank: QuestionBank, testId: number): Question[] {
  const sorted = [...bank.questions].sort((a, b) => a.id.localeCompare(b.id));
  const shuffled = seededShuffle(sorted, 0x1ccafe);
  const start = (testId - 1) * TEST_QUESTION_COUNT;
  return shuffled.slice(start, start + TEST_QUESTION_COUNT);
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
  return { question: q, shuffledOptions: shuffle(q.options) };
}

/**
 * Like renderQuestion, but the option order is deterministic per question id,
 * so revisits during the same test (Previous/Next nav) keep options stable.
 */
export function renderQuestionStable(q: Question): RenderedQuestion {
  return { question: q, shuffledOptions: seededShuffle(q.options, hashStr(q.id)) };
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

/* ============================================================================
   Persistent per-test progress (localStorage).
   Stored under `ircc_test_state_v1`. If the bank version changes, state is
   discarded (the question contents underneath might have shifted).
   ========================================================================== */

export interface TestRecord {
  status: "in_progress" | "completed";
  answers: (number | null)[];   // length 20; null = not answered
  elapsedSeconds: number;        // total time spent on this test so far
  currentIdx: number;            // 0..19, for resume
  score?: number;                // only when completed
  passed?: boolean;
  completedAt?: string;          // ISO timestamp
}

export interface PersistedState {
  version: 1;
  bankVersion: string;
  tests: Record<string, TestRecord>;   // key: "1".."N"
}

const STORAGE_KEY = "ircc_test_state_v1";

function emptyState(bankVersion: string): PersistedState {
  return { version: 1, bankVersion, tests: {} };
}

export function loadState(bankVersion: string): PersistedState {
  if (typeof window === "undefined") return emptyState(bankVersion);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState(bankVersion);
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== 1 || parsed.bankVersion !== bankVersion) {
      return emptyState(bankVersion);
    }
    return parsed;
  } catch {
    return emptyState(bankVersion);
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — silently no-op */
  }
}

export interface OverallStats {
  totalTests: number;
  completed: number;
  inProgress: number;
  avgScorePct: number | null;   // null when no tests completed
  passedCount: number;
}

export function computeOverallStats(state: PersistedState, totalTestsCount: number): OverallStats {
  let completed = 0;
  let inProgress = 0;
  let passed = 0;
  let scoreSum = 0;
  for (const rec of Object.values(state.tests)) {
    if (rec.status === "completed") {
      completed += 1;
      scoreSum += (rec.score ?? 0);
      if (rec.passed) passed += 1;
    } else {
      inProgress += 1;
    }
  }
  return {
    totalTests: totalTestsCount,
    completed,
    inProgress,
    passedCount: passed,
    avgScorePct: completed > 0 ? (scoreSum / (completed * TEST_QUESTION_COUNT)) * 100 : null,
  };
}
