import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PersistedState,
  QuestionBank,
  RenderedQuestion,
  TestRecord,
} from "../../lib/citizenship_test";
import {
  TEST_PASS_THRESHOLD,
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
      // User finished this test before. Show its review.
      setAnswers(existing.answers);
      setElapsed(existing.elapsedSeconds);
      setCursor(0);
      setPhase("review");
    } else if (existing && existing.status === "in_progress") {
      setAnswers(existing.answers);
      setElapsed(existing.elapsedSeconds);
      setCursor(Math.min(existing.currentIdx, TEST_QUESTION_COUNT - 1));
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

  // Persist in-progress state whenever answers/cursor/elapsed change.
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

  const onSelect = useCallback((optIdx: number) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[cursor] = optIdx;
      return next;
    });
  }, [cursor]);

  const goPrev = () => setCursor((c) => Math.max(0, c - 1));
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
  const answeredCount = answers.filter((a) => a != null).length;
  const progressPct = (answeredCount / rendered.length) * 100;
  const isLast = cursor === rendered.length - 1;
  const allAnswered = answers.every((a) => a != null);

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
        correctIdx={-1}
        locked={false}
        onSelect={onSelect}
      />

      <div className="test-nav-row">
        <button
          type="button"
          className="test-nav-button secondary"
          onClick={goPrev}
          disabled={cursor === 0}
        >
          ← Previous
        </button>

        <QuestionDots
          answers={answers}
          cursor={cursor}
          onJump={(i) => setCursor(i)}
        />

        {isLast ? (
          <button
            type="button"
            className="test-nav-button primary"
            onClick={submit}
            disabled={!allAnswered && !confirmSubmitEnabled(answers)}
            title={
              !allAnswered
                ? `${TEST_QUESTION_COUNT - answeredCount} unanswered — submit anyway?`
                : undefined
            }
          >
            Submit test
          </button>
        ) : (
          <button type="button" className="test-nav-button primary" onClick={goNext}>
            Next →
          </button>
        )}
      </div>

      {isLast && !allAnswered && (
        <p className="test-runner-submit-hint">
          {TEST_QUESTION_COUNT - answeredCount} unanswered. You can still submit
          — unanswered questions count as wrong.
        </p>
      )}
    </div>
  );
}

// Submit is always enabled on the last question, but we surface the unanswered-
// count hint. Kept as a separate function in case we want to add a confirm
// step later.
function confirmSubmitEnabled(_answers: (number | null)[]): boolean {
  return true;
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

function QuestionDots({
  answers,
  cursor,
  onJump,
}: {
  answers: (number | null)[];
  cursor: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="test-dots" role="navigation" aria-label="Jump to question">
      {answers.map((a, i) => {
        const cls = [
          "test-dot",
          a != null ? "answered" : "",
          i === cursor ? "current" : "",
        ].filter(Boolean).join(" ");
        return (
          <button
            key={i}
            type="button"
            className={cls}
            onClick={() => onJump(i)}
            aria-label={`Go to question ${i + 1}${a != null ? " (answered)" : ""}`}
            aria-current={i === cursor ? "true" : undefined}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
