import type { RenderedQuestion, AnnotationRelevance } from "../../lib/citizenship_test";

interface Props {
  rendered: RenderedQuestion;
  chosenIdx: number;
  correctIdx: number;
}

export default function Feedback({ rendered, chosenIdx, correctIdx }: Props) {
  const chosen = rendered.shuffledOptions[chosenIdx];
  const correct = rendered.shuffledOptions[correctIdx];
  const isCorrect = chosenIdx === correctIdx;
  const sourceChapter = rendered.question.source_chapter;
  const isTrueFalse = rendered.question.question_type === "true_false";

  return (
    <div className={`test-feedback ${isCorrect ? "correct" : "incorrect"}`}>
      <div className="test-feedback-verdict">
        <span className="test-feedback-icon" aria-hidden="true">
          {isCorrect ? "✓" : "✗"}
        </span>
        <span className="test-feedback-headline">
          {isCorrect
            ? "Correct"
            : isTrueFalse
              ? `Not quite — the statement is ${correct.text}`
              : "Not quite"}
        </span>
      </div>

      {/* For multiple_choice, the wrong pick has its own grounded distractor
          annotation worth surfacing. For true_false, the single grounded
          explanation lives on the correct option, so we skip the duplicate
          "chosen" section and just show the explanation below. */}
      {!isCorrect && !isTrueFalse && (
        <div className="test-feedback-section">
          <span className={`test-rel-badge rel-${chosen.annotation.relevance.toLowerCase()}`}>
            {relevanceLabel(chosen.annotation.relevance)}
          </span>
          <p className="test-feedback-explanation">
            {chosen.annotation.explanation}
          </p>
          {chosen.annotation.source_page != null && (
            <div className="test-feedback-source">
              {chosen.annotation.source_section ?? sourceChapter}
              {" · p. "}{chosen.annotation.source_page}
            </div>
          )}
        </div>
      )}

      <div className="test-feedback-section">
        {!isCorrect && (
          <span className="test-rel-badge rel-correct_answer">
            {isTrueFalse ? `Answer: ${correct.text}` : "Correct answer"}
          </span>
        )}
        <p className="test-feedback-explanation">
          {correct.annotation.explanation}
        </p>
        {correct.annotation.source_page != null && (
          <div className="test-feedback-source">
            {correct.annotation.source_section ?? sourceChapter}
            {" · p. "}{correct.annotation.source_page}
          </div>
        )}
      </div>

      {rendered.question.test_tip && (
        <div className="test-feedback-tip">
          <strong>Study tip:</strong> {rendered.question.test_tip}
        </div>
      )}
    </div>
  );
}

function relevanceLabel(r: AnnotationRelevance): string {
  switch (r) {
    case "CORRECT_ANSWER": return "Correct";
    case "RELATED_FACT": return "Real fact, wrong question";
    case "PARTIALLY_CORRECT": return "Partly right";
    case "PLAUSIBLE_DISTRACTOR": return "Plausible but wrong";
    case "COMMON_MISCONCEPTION": return "Common misconception";
    case "ANACHRONISM": return "Outdated";
    case "WRONG_CATEGORY": return "Wrong category";
  }
}
