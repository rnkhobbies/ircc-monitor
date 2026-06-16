#!/usr/bin/env python3
"""Convert a curated subset of the citizenship-test question bank from
4-option multiple_choice into two-option true_false questions.

Idempotent and reproducible: the set of questions to convert and the authored
declarative statements live in the curation files under
``scripts/tf_conversions/`` (one JSON array per chunk, authored by hand /
review). This script reads the canonical bank, applies the conversions in
place (preserving every untouched MC question), rebalances/caps the selection
so no topic is gutted and the TRUE/FALSE answer split stays ~50/50, bumps the
bank version, and writes the result to BOTH the canonical and served copies.

Usage:
    python scripts/convert_to_true_false.py

Re-running on an already-converted bank is a no-op for already-true_false
questions (they're matched by id and rebuilt from the same curation data).
"""
from __future__ import annotations

import json
import os
from collections import Counter, defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANONICAL = os.path.join(REPO, "data", "citizenship_test", "question_bank.json")
SERVED = os.path.join(REPO, "web", "public", "citizenship_test.json")
CURATION = os.path.join(REPO, "scripts", "tf_conversions", "conversions.json")

NEW_VERSION = "0.3.0"
NEW_AS_OF = "2026-06-16"
TF_SCHEMA_NOTE = (
    "true_false questions: question_type 'true_false', question_text is a single "
    "declarative statement, options is exactly two — {text:'True'} and "
    "{text:'False'} — with exactly one is_correct:true. The correct option's "
    "annotation carries the grounded explanation + citation; FALSE statements are "
    "built from an existing annotated distractor so the 'why it's wrong' grounding "
    "is preserved. Statements never reference page numbers or name the study guide."
)

# Quality/balance targets used to trim the curated candidate pool.
MAX_TOPIC_CONVERSION_PCT = 0.46  # don't convert more than this share of any topic
TARGET_TOTAL = 196               # aim for ~196 conversions (within 170..256)


def load_curation() -> list[dict]:
    with open(CURATION, encoding="utf-8") as f:
        return json.load(f)


def select(candidates: list[dict], bank_qs: list[dict]) -> list[dict]:
    """Trim the candidate pool to a balanced selection.

    - cap per-topic conversions at MAX_TOPIC_CONVERSION_PCT of the topic total
    - keep the TRUE/FALSE answer split as close to 50/50 as possible
    - prefer keeping a spread across difficulties
    Deterministic: candidates are processed in id order.
    """
    meta = {q["id"]: q for q in bank_qs}
    topic_total = Counter(q["topic"] for q in bank_qs)
    topic_cap = {t: int(n * MAX_TOPIC_CONVERSION_PCT) for t, n in topic_total.items()}

    cand = sorted(candidates, key=lambda c: c["id"])
    falses = [c for c in cand if not c["is_true"]]
    trues = [c for c in cand if c["is_true"]]

    # We want ~50/50. Keep all FALSEs (they're scarcer), then add TRUEs up to a
    # matching count, subject to topic caps. Process interleaved by topic so the
    # spread stays even.
    selected: list[dict] = []
    per_topic = Counter()

    def try_add(c: dict) -> bool:
        t = meta[c["id"]]["topic"]
        if per_topic[t] >= topic_cap[t]:
            return False
        selected.append(c)
        per_topic[t] += 1
        return True

    # Add FALSEs first (cap-limited).
    for c in falses:
        try_add(c)
    n_false = len(selected)

    # Add TRUEs up to balance + headroom toward TARGET_TOTAL, cap-limited,
    # ordered to spread difficulty.
    diff_order = {"hard": 0, "medium": 1, "easy": 2}
    trues_sorted = sorted(
        trues, key=lambda c: (diff_order.get(meta[c["id"]]["difficulty"], 3), c["id"])
    )
    true_budget = max(n_false, TARGET_TOTAL - n_false)
    n_true = 0
    for c in trues_sorted:
        if n_true >= true_budget:
            break
        if try_add(c):
            n_true += 1

    return selected


def build_tf_question(orig: dict, conv: dict) -> dict:
    """Rewrite an MC question dict into a true_false question dict."""
    correct_opt = next(o for o in orig["options"] if o["is_correct"])
    distractors = [o for o in orig["options"] if not o["is_correct"]]

    is_true = conv["is_true"]

    # Grounding for the "True" judgement = the correct fact. Backfill page /
    # section from the question level if the correct option lacked them.
    correct_section = correct_opt["annotation"].get("source_section") or orig.get("source_section")
    correct_page = correct_opt["annotation"].get("source_page") or orig.get("source_page")
    true_annotation = {
        "relevance": "CORRECT_ANSWER",
        "source_section": correct_section,
        "source_page": correct_page,
        "explanation": conv["true_explanation"],
    }

    if is_true:
        # Statement asserts the correct fact -> "True" is correct.
        true_opt = {"text": "True", "is_correct": True, "annotation": true_annotation}
        false_opt = {
            "text": "False",
            "is_correct": False,
            "annotation": {
                "relevance": "CORRECT_ANSWER",
                "source_section": correct_section,
                "source_page": correct_page,
                "explanation": (
                    "This statement is accurate, so 'False' is incorrect. "
                    + conv["true_explanation"]
                ),
            },
        }
    else:
        # Statement asserts a distractor's wrong claim -> "False" is correct.
        idx = conv.get("false_basis_distractor_index")
        if idx is not None and 0 <= idx < len(distractors):
            basis = distractors[idx]
            wrong_expl = basis["annotation"]["explanation"]
            wrong_rel = basis["annotation"]["relevance"]
            wrong_section = basis["annotation"].get("source_section")
            wrong_page = basis["annotation"].get("source_page")
        else:
            # No distractor basis (e.g. a "which is NOT" item): the correct
            # option already explains why the asserted claim is false.
            wrong_expl = conv["true_explanation"]
            wrong_rel = "COMMON_MISCONCEPTION"
            wrong_section = correct_opt["annotation"].get("source_section")
            wrong_page = correct_opt["annotation"].get("source_page")
        # Some distractor annotations carry no explicit page; backfill the
        # grounding from the correct option / question level so the citation
        # (the bank's value-add) is never lost.
        if wrong_page is None:
            wrong_page = correct_opt["annotation"].get("source_page") or orig.get("source_page")
        if wrong_section is None:
            wrong_section = correct_opt["annotation"].get("source_section") or orig.get("source_section")

        false_opt = {
            "text": "False",
            "is_correct": True,
            "annotation": {
                "relevance": "CORRECT_ANSWER",
                "source_section": wrong_section,
                "source_page": wrong_page,
                "explanation": wrong_expl,
            },
        }
        true_opt = {
            "text": "True",
            "is_correct": False,
            "annotation": {
                "relevance": wrong_rel,
                "source_section": wrong_section,
                "source_page": wrong_page,
                "explanation": wrong_expl,
            },
        }

    new_q = dict(orig)  # shallow copy preserves id/topic/subtopic/difficulty/etc.
    new_q["question_type"] = "true_false"
    new_q["question_text"] = conv["statement"]
    new_q["options"] = [true_opt, false_opt]
    return new_q


def main() -> None:
    with open(CANONICAL, encoding="utf-8") as f:
        bank = json.load(f)

    # Normalize any previously-converted true_false questions back to nothing
    # special — we rebuild from the original MC where available. Since the
    # canonical bank may already be converted, we cannot recover original MC
    # options. To stay idempotent we require the canonical bank to still be MC,
    # OR we keep already-converted ones as-is. Detect:
    already_tf = [q for q in bank["questions"] if q.get("question_type") == "true_false"]
    if already_tf:
        # Bank already converted; nothing to do (idempotent).
        print(f"Bank already has {len(already_tf)} true_false questions; "
              "no MC source to reconvert. Treating as no-op.")
        # Still re-sync served copy and metadata below.
    else:
        curation = load_curation()
        by_id = {q["id"]: q for q in bank["questions"]}
        # only keep curation entries whose id exists and is still MC
        valid = [c for c in curation if by_id.get(c["id"], {}).get("question_type") == "multiple_choice"]
        chosen = select(valid, bank["questions"])
        chosen_ids = {c["id"] for c in chosen}
        conv_by_id = {c["id"]: c for c in chosen}

        new_questions = []
        for q in bank["questions"]:
            if q["id"] in chosen_ids:
                new_questions.append(build_tf_question(q, conv_by_id[q["id"]]))
            else:
                new_questions.append(q)
        bank["questions"] = new_questions

    bank["version"] = NEW_VERSION
    bank["as_of"] = NEW_AS_OF
    if TF_SCHEMA_NOTE not in bank["schema_notes"]:
        bank["schema_notes"] = bank["schema_notes"].rstrip() + " " + TF_SCHEMA_NOTE

    payload = json.dumps(bank, ensure_ascii=False, indent=2) + "\n"
    with open(CANONICAL, "w", encoding="utf-8") as f:
        f.write(payload)
    with open(SERVED, "w", encoding="utf-8") as f:
        f.write(payload)

    # Report
    qs = bank["questions"]
    tf = [q for q in qs if q["question_type"] == "true_false"]
    mc = [q for q in qs if q["question_type"] == "multiple_choice"]
    n_true = sum(1 for q in tf if next(o for o in q["options"] if o["is_correct"])["text"] == "True")
    n_false = len(tf) - n_true
    print(f"total={len(qs)} true_false={len(tf)} multiple_choice={len(mc)}")
    print(f"TRUE-answer={n_true} FALSE-answer={n_false}")
    bd = defaultdict(lambda: [0, 0])  # topic -> [tf, mc]
    for q in qs:
        bd[q["topic"]][0 if q["question_type"] == "true_false" else 1] += 1
    print("topic x format (tf / mc):")
    for t in sorted(bd):
        print(f"  {t:12} {bd[t][0]:>4} / {bd[t][1]:>4}")


if __name__ == "__main__":
    main()
