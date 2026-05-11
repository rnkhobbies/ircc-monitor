import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuestionBank, RenderedQuestion } from "../../lib/citizenship_test";
import {
  TEST_QUESTION_COUNT,
  TEST_TIME_LIMIT_SECONDS,
  fmtClock,
  pickQuestions,
  renderQuestion,
  scoreAttempt,
} from "../../lib/citizenship_test";
import QuestionCard from "./QuestionCard";
import Feedback from "./Feedback";
import Results from "./Results";

type Phase = "loading" | "idle" | "in_progress" | "complete" | "error";

export default function TestApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rendered, setRendered] = useState<RenderedQuestion[]>([]);
  // answers[i] === null  → not answered yet
  // answers[i] === number → locked at that option-index (within shuffled options)
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [cursor, setCursor] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TEST_TIME_LIMIT_SECONDS);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/citizenship_test.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: QuestionBank) => {
        if (cancelled) return;
        if (!d.questions?.length) throw new Error("empty bank");
        setBank(d);
        setPhase("idle");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, []);

  const finish = useCallback(() => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setPhase("complete");
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "in_progress") return;
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current != null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [phase, finish]);

  const startTest = () => {
    if (!bank) return;
    const picked = pickQuestions(bank, TEST_QUESTION_COUNT).map(renderQuestion);
    setRendered(picked);
    setAnswers(new Array(picked.length).fill(null));
    setCursor(0);
    setSecondsLeft(TEST_TIME_LIMIT_SECONDS);
    setPhase("in_progress");
  };

  const onSelect = (optIdx: number) => {
    // Lock-on-click: ignore subsequent clicks on the same question.
    if (answers[cursor] != null) return;
    setAnswers((prev) => {
      const next = prev.slice();
      next[cursor] = optIdx;
      return next;
    });
  };

  const advance = () => {
    if (cursor < rendered.length - 1) {
      setCursor(cursor + 1);
    } else {
      finish();
    }
  };

  const score = useMemo(
    () => (phase === "complete" ? scoreAttempt(rendered, answers) : null),
    [phase, rendered, answers],
  );

  if (phase === "loading") return <div className="test-loading">Loading questions…</div>;
  if (phase === "error") return <div className="test-error">Couldn't load the question bank. {error ?? ""}</div>;
  if (phase === "idle") return <Intro bank={bank!} onStart={startTest} />;
  if (phase === "complete") {
    return <Results rendered={rendered} answers={answers} summary={score!} onRestart={startTest} />;
  }

  // in_progress
  const current = rendered[cursor];
  const userChoice = answers[cursor];
  const locked = userChoice != null;
  const correctIdx = current.shuffledOptions.findIndex((o) => o.is_correct);
  const lowTime = secondsLeft <= 5 * 60;
  const isLast = cursor === rendered.length - 1;
  // Progress fills based on completed steps. A question counts as completed
  // when it's been answered (i.e. when the user has seen feedback).
  const completedSteps = cursor + (locked ? 1 : 0);
  const progressPct = (completedSteps / rendered.length) * 100;

  return (
    <div className="test-runner">
      <div className="test-runner-top">
        <div className="test-progress">
          <span className="test-counter">
            Question <strong>{cursor + 1}</strong> of {rendered.length}
          </span>
        </div>
        <div className={`test-timer${lowTime ? " low" : ""}`}>
          ⏱ {fmtClock(secondsLeft)}
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
        <>
          <Feedback
            rendered={current}
            chosenIdx={userChoice}
            correctIdx={correctIdx}
          />
          <button type="button" className="test-advance-button" onClick={advance}>
            {isLast ? "See your results →" : "Next question →"}
          </button>
        </>
      )}
    </div>
  );
}

function Intro({ bank, onStart }: { bank: QuestionBank; onStart: () => void }) {
  return (
    <div className="test-intro">
      <h1 className="test-intro-title">Practice for the citizenship test</h1>
      <p className="test-intro-lede">
        Twenty questions, 45 minutes, exactly like the real test. Pulled from a
        bank of {bank.questions.length} questions covering rights, history,
        government, geography, symbols, and more — every answer cites the page
        in the official <em>Discover Canada</em> study guide.
      </p>
      <p className="test-intro-real-test">
        About the real test: 20 questions in 45 minutes, with a pass mark of
        15 out of 20. If you don't pass, you can take it up to two more times.
      </p>
      <button type="button" className="test-start-button" onClick={onStart}>
        Start practice test
      </button>
      <p className="test-intro-footer">
        Source: <em>Discover Canada — The Rights and Responsibilities of Citizenship</em>.
        Bank version {bank.version}, updated {bank.as_of}.
      </p>
    </div>
  );
}
