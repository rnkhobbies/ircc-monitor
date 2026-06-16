#!/usr/bin/env python3
"""Build the precomputed stats pack for the wait-time assistant chatbot.

Reads the curated, served analytics file (web/public/analytics.json) — the same
source of truth the rest of the public site uses — and emits a flat, lookup-keyed
JSON of aggregates so the client-side chatbot never computes anything heavy and
never calls an external API.

Why analytics.json and not the raw processed_data.csv: analytics.json is the
already-curated set of 279 displayable records (core-date filtered, deduped).
Keying the chatbot off the same file guarantees the free-text Q&A numbers and the
guided-estimator numbers agree to the unit.

Output: web/public/chatbot_stats.json
Run:    python scripts/build_chatbot_stats.py

Reproducible + idempotent: same input -> byte-identical output (keys sorted,
deterministic ordering).
"""

from __future__ import annotations

import json
import statistics
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ANALYTICS_PATH = REPO_ROOT / "web" / "public" / "analytics.json"
OUT_PATH = REPO_ROOT / "web" / "public" / "chatbot_stats.json"


def days_between(a: str | None, b: str | None) -> float | None:
    """Whole days from a to b. None if either missing/unparseable, or if negative
    (negative gaps = bad data; mirror the frontend's daysBetween)."""
    if not a or not b:
        return None
    try:
        ad = date.fromisoformat(a[:10])
        bd = date.fromisoformat(b[:10])
    except ValueError:
        return None
    d = (bd - ad).days
    if d < 0:
        return None
    return float(d)


def median_n(values: list[float]) -> dict:
    xs = [v for v in values if v is not None]
    if not xs:
        return {"median": None, "n": 0}
    return {"median": round(statistics.median(xs), 1), "n": len(xs)}


def total_days(dates: list[str | None]) -> float | None:
    """Earliest available start (submission ?? aor) -> latest available end
    (certificate_received ?? ceremony). Matches lib/analytics.ts totalDays()."""
    start = dates[0] or dates[1]
    end = dates[6] or dates[5]
    return days_between(start, end)


def counts(records: list[dict], key: str) -> dict:
    out: dict[str, int] = {}
    for r in records:
        v = r.get(key)
        if v is None:
            continue
        out[str(v)] = out.get(str(v), 0) + 1
    return dict(sorted(out.items()))


def main() -> None:
    analytics = json.loads(ANALYTICS_PATH.read_text())
    records: list[dict] = analytics["records"]
    milestone_keys: list[str] = analytics["milestone_keys"]
    n_total = len(records)

    # --- counts by category ---
    by_year = counts(records, "year")
    by_city = counts(records, "city")
    by_visa_office = counts(records, "visa_office")
    by_app_type = counts(records, "app_type")
    by_certificate_type = counts(records, "certificate_type")

    # single vs family (applicant_count == 1 vs >= 2)
    single = sum(1 for r in records if r.get("applicant_count") == 1)
    family = sum(
        1
        for r in records
        if r.get("applicant_count") is not None and r["applicant_count"] >= 2
    )
    applicant = {
        "single": single,
        "family": family,
        "unknown": n_total - single - family,
    }

    # --- pairwise milestone durations ---
    # consecutive pairs
    consecutive_pairs = {}
    for i in range(len(milestone_keys) - 1):
        a_key = milestone_keys[i]
        b_key = milestone_keys[i + 1]
        vals = [days_between(r["dates"][i], r["dates"][i + 1]) for r in records]
        consecutive_pairs[f"{a_key}__{b_key}"] = median_n(vals)

    # ALL ordered pairs (so "AOR to ceremony" etc. resolve directly)
    all_pairs = {}
    for i in range(len(milestone_keys)):
        for j in range(len(milestone_keys)):
            if i >= j:
                continue
            vals = [days_between(r["dates"][i], r["dates"][j]) for r in records]
            all_pairs[f"{milestone_keys[i]}__{milestone_keys[j]}"] = median_n(vals)

    # headline start -> end total
    total = median_n([total_days(r["dates"]) for r in records])

    # --- available date range across all milestone dates ---
    all_dates = [
        d[:10] for r in records for d in r["dates"] if d
    ]
    date_range = {
        "min": min(all_dates) if all_dates else None,
        "max": max(all_dates) if all_dates else None,
    }

    pack = {
        "as_of": analytics["as_of"],
        "n_total": n_total,
        "min_n_for_display": analytics["min_n_for_display"],
        "milestone_keys": milestone_keys,
        "date_range": date_range,
        "counts": {
            "by_year": by_year,
            "by_city": by_city,
            "by_visa_office": by_visa_office,
            "by_app_type": by_app_type,
            "by_certificate_type": by_certificate_type,
            "by_applicant": applicant,
        },
        "durations": {
            "total": total,
            "consecutive_pairs": consecutive_pairs,
            "all_pairs": all_pairs,
        },
    }

    OUT_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False, sort_keys=False) + "\n")

    # --- summary ---
    print(f"Wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    print(f"  as_of: {pack['as_of']}  n_total: {n_total}")
    print(f"  date range: {date_range['min']} .. {date_range['max']}")
    print(f"  by_year (sum={sum(by_year.values())}): {by_year}")
    print(f"  by_city ({len(by_city)} cities, sum={sum(by_city.values())})")
    print(f"  by_app_type: {by_app_type}")
    print(f"  applicant: {applicant}  (sum={sum(applicant.values())})")
    print(f"  total duration: median {total['median']}d (n={total['n']})")
    aor_cer = all_pairs.get("aor_date__ceremony_date")
    print(f"  AOR->ceremony: median {aor_cer['median']}d (n={aor_cer['n']})")
    print(f"  consecutive pairs: {len(consecutive_pairs)}  all ordered pairs: {len(all_pairs)}")


if __name__ == "__main__":
    main()
