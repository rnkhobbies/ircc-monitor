import type { RenderedQuestion } from "../../lib/citizenship_test";

interface Props {
  rendered: RenderedQuestion;
  selected: number | null;
  correctIdx: number;
  locked: boolean;
  onSelect: (optIdx: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function QuestionCard({ rendered, selected, correctIdx, locked, onSelect }: Props) {
  const { question, shuffledOptions } = rendered;
  return (
    <div className="test-question-card">
      <div className="test-question-meta">
        <span className={`test-topic-badge topic-${question.topic}`}>
          {topicLabel(question.topic)}
        </span>
        <span className={`test-diff-badge diff-${question.difficulty}`}>
          {question.difficulty}
        </span>
      </div>
      <h2 className="test-question-text">{question.question_text}</h2>
      <div className="test-options" role="radiogroup" aria-label="Answer options">
        {shuffledOptions.map((_, i) => {
          // Visual state per option:
          //   - not locked: "selected" (pre-commit highlight, currently unused since we lock on click) else neutral
          //   - locked:
          //       - i === correctIdx  → "locked correct"
          //       - i === selected and i !== correctIdx → "locked wrong"
          //       - everything else → "locked dim"
          let state = "";
          if (!locked) {
            state = selected === i ? "selected" : "";
          } else if (i === correctIdx) {
            state = "locked correct";
          } else if (i === selected) {
            state = "locked wrong";
          } else {
            state = "locked dim";
          }
          const showCheckmark = locked && i === correctIdx;
          const showCross = locked && i === selected && i !== correctIdx;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected === i}
              aria-disabled={locked}
              className={`test-option ${state}`.trim()}
              onClick={() => !locked && onSelect(i)}
              disabled={locked}
            >
              <span className="test-option-letter">
                {showCheckmark ? "✓" : showCross ? "✗" : LETTERS[i]}
              </span>
              <span className="test-option-text">{shuffledOptions[i].text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function topicLabel(t: string): string {
  switch (t) {
    case "rights": return "Rights & Responsibilities";
    case "who_we_are": return "Who We Are";
    case "history": return "Canada's History";
    case "government": return "Government";
    case "justice": return "Justice";
    case "symbols": return "Symbols";
    case "economy": return "Economy";
    case "regions": return "Regions";
    case "province": return "Your Province";
    default: return t;
  }
}
