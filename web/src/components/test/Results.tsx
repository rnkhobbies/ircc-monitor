import { useState } from "react";
import type {
  AnnotationRelevance,
  RenderedQuestion,
  ScoreSummary,
} from "../../lib/citizenship_test";
import { TEST_PASS_THRESHOLD } from "../../lib/citizenship_test";

interface Props {
  rendered: RenderedQuestion[];
  answers: (number | null)[];
  summary: ScoreSummary;
  onRestart: () => void;
}

export default function Results({ rendered, answers, summary, onRestart }: Props) {
  const passed = summary.passed;
  return (
    <div className="test-results">
      <ResultsHero summary={summary} />

      <div className="test-results-meta">
        <div className="test-results-meta-block">
          <h3>How you scored by topic</h3>
          <ul className="test-results-bars">
            {Object.entries(summary.byTopic).map(([topic, s]) => (
              <li key={topic} className="test-results-bar-row">
                <span className="bar-label">{topicLabel(topic)}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${(s.correct / Math.max(1, s.total)) * 100}%` }}
                  />
                </span>
                <span className="bar-meta">{s.correct}/{s.total}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="test-results-meta-block">
          <h3>By difficulty</h3>
          <ul className="test-results-bars">
            {Object.entries(summary.byDifficulty).map(([d, s]) => (
              <li key={d} className="test-results-bar-row">
                <span className="bar-label">{d}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${(s.correct / Math.max(1, s.total)) * 100}%` }}
                  />
                </span>
                <span className="bar-meta">{s.correct}/{s.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="test-review-title">Review every question</h3>
      <p className="test-review-lede">
        Each question expands to show what every option means and where it comes
        from in <em>Discover Canada</em>.
      </p>
      <ol className="test-review">
        {rendered.map((rq, i) => (
          <ReviewItem
            key={rq.question.id}
            rendered={rq}
            chosen={answers[i]}
            index={i}
          />
        ))}
      </ol>

      <div className="test-results-actions">
        <button type="button" className="test-start-button" onClick={onRestart}>
          Retake this test
        </button>
        <a className="test-results-link" href="/test/">
          ← All practice tests
        </a>
      </div>

      <p className={passed ? "test-results-encouragement pass" : "test-results-encouragement"}>
        {passed
          ? "Nicely done. You're tracking above the real-test pass mark — keep practicing the topics where you slipped and you'll be in great shape on test day."
          : "Don't sweat it — every wrong answer below has a full explanation pointing to the exact page in Discover Canada. Read those, then take another test."}
      </p>
    </div>
  );
}

function ResultsHero({ summary }: { summary: ScoreSummary }) {
  const passed = summary.passed;
  return (
    <div className={`test-results-hero ${passed ? "pass" : "fail"}`}>
      <div className="test-results-score">
        <span className="score-number">{summary.correct}</span>
        <span className="score-over">/{summary.total}</span>
      </div>
      <div className="test-results-verdict">
        {passed ? "Passed" : "Below pass mark"}
        <div className="test-results-sub">
          Real test pass mark: {TEST_PASS_THRESHOLD}/{summary.total}.
          {summary.unanswered > 0 ? ` ${summary.unanswered} left blank.` : ""}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({
  rendered,
  chosen,
  index,
}: {
  rendered: RenderedQuestion;
  chosen: number | null;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const correctIdx = rendered.shuffledOptions.findIndex((o) => o.is_correct);
  const isCorrect = chosen != null && rendered.shuffledOptions[chosen].is_correct;
  const isUnanswered = chosen == null;
  return (
    <li className={`test-review-item ${isCorrect ? "correct" : isUnanswered ? "skipped" : "incorrect"}`}>
      <button
        type="button"
        className="test-review-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="test-review-icon">
          {isCorrect ? "✓" : isUnanswered ? "—" : "✗"}
        </span>
        <span className="test-review-number">Q{index + 1}.</span>
        <span className="test-review-q">{rendered.question.question_text}</span>
        <span className="test-review-toggle">{open ? "Hide" : "Show"} review</span>
      </button>
      {open && (
        <div className="test-review-body">
          <div className="test-review-options">
            {rendered.shuffledOptions.map((opt, i) => {
              const flags: string[] = [];
              if (i === correctIdx) flags.push("correct");
              if (i === chosen) flags.push("chosen");
              return (
                <div
                  key={i}
                  className={`test-review-option ${flags.join(" ")}`}
                >
                  <div className="test-review-option-header">
                    <span className="test-review-option-letter">{["A","B","C","D"][i]}</span>
                    <span className="test-review-option-text">{opt.text}</span>
                    {i === correctIdx && <span className="test-review-tag correct">Correct answer</span>}
                    {i === chosen && i !== correctIdx && <span className="test-review-tag your">Your answer</span>}
                  </div>
                  <div className="test-review-option-meta">
                    <span className={`test-rel-badge rel-${opt.annotation.relevance.toLowerCase()}`}>
                      {relevanceLabel(opt.annotation.relevance)}
                    </span>
                    {opt.annotation.source_page != null && (
                      <span className="test-review-source">
                        {opt.annotation.source_section ?? rendered.question.source_chapter} · p. {opt.annotation.source_page}
                      </span>
                    )}
                  </div>
                  <p className="test-review-explanation">
                    {opt.annotation.explanation}
                  </p>
                </div>
              );
            })}
          </div>
          {rendered.question.test_tip && (
            <div className="test-review-tip">
              <strong>Study tip:</strong> {rendered.question.test_tip}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function relevanceLabel(r: AnnotationRelevance): string {
  switch (r) {
    case "CORRECT_ANSWER": return "Correct answer";
    case "RELATED_FACT": return "Real fact, wrong question";
    case "PARTIALLY_CORRECT": return "Partly right";
    case "PLAUSIBLE_DISTRACTOR": return "Plausible but wrong";
    case "COMMON_MISCONCEPTION": return "Common misconception";
    case "ANACHRONISM": return "Outdated";
    case "WRONG_CATEGORY": return "Wrong category";
  }
}

function topicLabel(t: string): string {
  switch (t) {
    case "rights": return "Rights & Responsibilities";
    case "who_we_are": return "Who We Are";
    case "history": return "History";
    case "government": return "Government";
    case "justice": return "Justice";
    case "symbols": return "Symbols";
    case "economy": return "Economy";
    case "regions": return "Regions";
    case "province": return "Your Province";
    default: return t;
  }
}
