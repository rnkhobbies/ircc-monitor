import { useEffect, useState } from "react";
import type { OverallStats, PersistedState, QuestionBank } from "../../lib/citizenship_test";
import {
  TEST_PASS_THRESHOLD,
  TEST_QUESTION_COUNT,
  computeOverallStats,
  loadState,
  totalTests,
} from "../../lib/citizenship_test";

interface Props {
  bank: QuestionBank;
}

export default function TestHub({ bank }: Props) {
  const [state, setState] = useState<PersistedState | null>(null);
  const total = totalTests(bank);

  useEffect(() => {
    setState(loadState(bank.version));
  }, [bank.version]);

  const stats: OverallStats | null = state ? computeOverallStats(state, total) : null;

  return (
    <div className="test-hub">
      <div className="test-hub-headline">
        <h1>Practice the citizenship test</h1>
        <p>
          {total} practice tests, 20 questions each. Every answer cites the
          chapter and page in <em>Discover Canada</em>. Pass mark is{" "}
          {TEST_PASS_THRESHOLD}/{TEST_QUESTION_COUNT} on the real test.
        </p>
      </div>

      {stats && <HubStatsRow stats={stats} />}

      <div className="test-hub-grid">
        {Array.from({ length: total }, (_, i) => i + 1).map((id) => (
          <TestCard
            key={id}
            id={id}
            record={state?.tests[String(id)]}
          />
        ))}
      </div>
    </div>
  );
}

function HubStatsRow({ stats }: { stats: OverallStats }) {
  const { completed, totalTests, avgScorePct, passedCount } = stats;
  return (
    <div className="test-hub-stats">
      <div className="test-hub-stat">
        <div className="test-hub-stat-value">{completed}<span className="test-hub-stat-of">/{totalTests}</span></div>
        <div className="test-hub-stat-label">tests completed</div>
      </div>
      <div className="test-hub-stat">
        <div className="test-hub-stat-value">
          {avgScorePct == null ? "—" : `${Math.round(avgScorePct)}%`}
        </div>
        <div className="test-hub-stat-label">average score</div>
      </div>
      <div className="test-hub-stat">
        <div className="test-hub-stat-value">{passedCount}</div>
        <div className="test-hub-stat-label">passed (≥{TEST_PASS_THRESHOLD}/{TEST_QUESTION_COUNT})</div>
      </div>
    </div>
  );
}

function TestCard({
  id,
  record,
}: {
  id: number;
  record: import("../../lib/citizenship_test").TestRecord | undefined;
}) {
  const status =
    record == null ? "not_started"
    : record.status;

  const isDone = status === "completed";
  const isInProgress = status === "in_progress";
  const score = record?.score ?? null;
  const passed = record?.passed ?? false;

  const statusLabel =
    status === "not_started" ? "Not started"
    : status === "in_progress" ? `Resume — ${countAnswered(record!)}/${TEST_QUESTION_COUNT} answered`
    : passed ? `Passed · ${score}/${TEST_QUESTION_COUNT}`
    : `${score}/${TEST_QUESTION_COUNT}`;

  const classes = [
    "test-card",
    isDone ? (passed ? "done-pass" : "done-fail") : "",
    isInProgress ? "in-progress" : "",
  ].filter(Boolean).join(" ");

  return (
    <a href={`/test/?n=${id}`} className={classes} aria-label={`Practice test ${id} — ${statusLabel}`}>
      <div className="test-card-leaf" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="100%" height="100%" focusable="false">
          <path
            d="M16.02 1L13.36 5.96 12.7 6.06 10.47 5.01 11.84 12.88 11.01 12.96 7.91 9.56 6.9 11.64 2.7 10.85 3.92 15.57 2.19 16.67 8.96 22.22 9.11 23 8.49 24.96 15.46 24.23 15.34 31 16.66 30.98 16.61 24.15 23.48 24.96 22.87 22.91 23.09 22.15 29.81 16.7 28.05 15.52 29.25 10.83 25.14 11.64 24.07 9.56 20.91 13 20.18 12.93 21.5 5.01 19.45 6.01 18.67 5.99Z"
          />
        </svg>
      </div>
      <div className="test-card-number">Test {id}</div>
      <div className="test-card-status">{statusLabel}</div>
    </a>
  );
}

function countAnswered(rec: import("../../lib/citizenship_test").TestRecord): number {
  return rec.answers.filter((a) => a != null).length;
}
