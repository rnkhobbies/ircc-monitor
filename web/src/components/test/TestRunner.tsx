import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PersistedState,
  QuestionBank,
  RenderedQuestion,
  TestRecord,
} from "../../lib/citizenship_test";
import {
  TEST_QUESTION_COUNT,
  fmtClock,
  getTestQuestions,
  loadState,
  renderQuestionStable,
  saveState,
  scoreAttempt,
  totalTests,
} from "../../lib/citizenship_test";
import QuestionCard from "./QuestionCard";
import Results from "./Results";

interface Props {
  bank: QuestionBank;
  testId: number;
}

export default function TestRunner({ bank, testId }: Props) {
  const total = totalTests(bank);
  const validId = testId >= 1 && testId <= total;

  const rendered = useMemo<RenderedQuestion[]>(
    () => (validId ? getTestQuestions(bank, testId).map(renderQuestionStable) : []),
    [bank, testId, validId],
  );

  const [state, setState] = useState<PersistedState | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [cursor, setCursor] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"loading" | "in_progress" | "review">("loading");
  const tickRef = useRef<number | null>(null);

  // Boot: load persisted state for this test (resume or fresh).
  useEffect(() => {
    if (!validId) return;
    const s = loadState(bank.version);
    setState(s);
    const existing = s.tests[String(testId)];
    if (existing && existing.status === "completed") {
      setAnswers(existing.answers);
      setElapsed(existing.elapsedSeconds);
      setCursor(0);
      setPhase("review");
    } else if (existing && existing.status === "in_progress") {
      // Resume at the first unanswered question; if everything's answered
      // already, sit on the last so the user can submit.
      const firstUnanswered = existing.answers.findIndex((a) => a == null);
      const target =
        firstUnanswered === -1 ? existing.answers.length - 1 : firstUnanswered;
      setAnswers(existing.answers);
      setElapsed(existing.elapsedSeconds);
      setCursor(target);
      setPhase("in_progress");
    } else {
      setAnswers(new Array(TEST_QUESTION_COUNT).fill(null));
      setElapsed(0);
      setCursor(0);
      setPhase("in_progress");
    }
  }, [bank.version, testId, validId]);

  // Timer (counts up).
  useEffect(() => {
    if (phase !== "in_progress") return;
    tickRef.current = window.setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (tickRef.current != null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [phase]);

  // Persist in-progress state whenever answers / cursor / elapsed change.
  useEffect(() => {
    if (phase !== "in_progress" || !state) return;
    const next: PersistedState = {
      ...state,
      tests: {
        ...state.tests,
        [String(testId)]: {
          status: "in_progress",
          answers,
          elapsedSeconds: elapsed,
          currentIdx: cursor,
        },
      },
    };
    saveState(next);
  }, [phase, state, testId, answers, elapsed, cursor]);

  // Lock-on-click: once a question has an answer, it can't be changed.
  const onSelect = useCallback((optIdx: number) => {
    setAnswers((prev) => {
      if (prev[cursor] != null) return prev;   // already locked
      const next = prev.slice();
      next[cursor] = optIdx;
      return next;
    });
  }, [cursor]);

  const goNext = () => setCursor((c) => Math.min(rendered.length - 1, c + 1));

  const submit = useCallback(() => {
    if (!state) return;
    const summary = scoreAttempt(rendered, answers);
    const completed: TestRecord = {
      status: "completed",
      answers,
      elapsedSeconds: elapsed,
      currentIdx: cursor,
      score: summary.correct,
      passed: summary.passed,
      completedAt: new Date().toISOString(),
    };
    const next: PersistedState = {
      ...state,
      tests: { ...state.tests, [String(testId)]: completed },
    };
    saveState(next);
    setState(next);
    setPhase("review");
  }, [state, rendered, answers, elapsed, cursor, testId]);

  const retake = useCallback(() => {
    if (!state) return;
    const fresh: TestRecord = {
      status: "in_progress",
      answers: new Array(TEST_QUESTION_COUNT).fill(null),
      elapsedSeconds: 0,
      currentIdx: 0,
    };
    const next: PersistedState = {
      ...state,
      tests: { ...state.tests, [String(testId)]: fresh },
    };
    saveState(next);
    setState(next);
    setAnswers(fresh.answers);
    setElapsed(0);
    setCursor(0);
    setPhase("in_progress");
  }, [state, testId]);

  if (!validId) {
    return (
      <div className="test-error">
        Test {testId} doesn't exist — there are {total} practice tests.{" "}
        <a href="/test/">Back to test list</a>.
      </div>
    );
  }
  if (phase === "loading" || !rendered.length) {
    return <div className="test-loading">Loading test {testId}…</div>;
  }

  if (phase === "review") {
    const summary = scoreAttempt(rendered, answers);
    return (
      <div className="test-runner">
        <RunnerHeader testId={testId} total={total} mode="review" />
        <Results
          rendered={rendered}
          answers={answers}
          summary={summary}
          onRestart={retake}
        />
      </div>
    );
  }

  // in_progress
  const current = rendered[cursor];
  const userChoice = answers[cursor];
  const locked = userChoice != null;
  const correctIdx = current.shuffledOptions.findIndex((o) => o.is_correct);
  const answeredCount = answers.filter((a) => a != null).length;
  const progressPct = (answeredCount / rendered.length) * 100;
  const isLast = cursor === rendered.length - 1;

  return (
    <div className="test-runner">
      <RunnerHeader testId={testId} total={total} mode="in_progress" />

      <div className="test-runner-top">
        <div className="test-timer up">
          <span aria-hidden="true">⏱</span> {fmtClock(elapsed)}
        </div>
        <div className="test-counter">
          Question <strong>{cursor + 1}</strong> of {rendered.length}
        </div>
      </div>

      <div className="test-progress-bar">
        <div className="test-progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <QuestionCard
        rendered={current}
        selected={userChoice}
        correctIdx={correctIdx}
        locked={locked}
        onSelect={onSelect}
      />

      {locked && (
        <button
          type="button"
          className="test-advance-button"
          onClick={isLast ? submit : goNext}
        >
          {isLast ? "See your results →" : "Next question →"}
        </button>
      )}
    </div>
  );
}

function RunnerHeader({
  testId,
  total,
  mode,
}: {
  testId: number;
  total: number;
  mode: "in_progress" | "review";
}) {
  return (
    <div className="test-runner-header">
      <a href="/test/" className="test-runner-back">← All tests</a>
      <div className="test-runner-title">
        Practice test <strong>{testId}</strong>
        <span className="test-runner-of"> of {total}</span>
      </div>
      <div className="test-runner-mode">{mode === "review" ? "Review" : "In progress"}</div>
    </div>
  );
}
