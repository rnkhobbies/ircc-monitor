// Records-mode analytics. The backend emits one row per IRCC application;
// the frontend filters and aggregates client-side. With 265 records this is
// trivial work and avoids the combinatorial explosion of pre-aggregating
// every filter combination on the server side.

export interface Record_ {
  city: string | null;
  year: number | null;
  app_type: "Online" | "Paper" | null;
  applicant_count: number | null;
  visa_office: string | null;
  certificate_type: "Electronic" | "Paper" | null;
  // Dates in milestone-index order (length 7). null where the user did not share.
  dates: (string | null)[];
}

export interface CityGeo {
  lat: number;
  lng: number;
  province: string;
}

export interface Analytics {
  as_of: string;
  n_total: number;
  min_n_for_display: number;
  milestone_keys: string[];     // length 7
  city_geo: Record<string, CityGeo>;
  options: {
    city: string[];
    year: string[];
    app_type: string[];
    applicant_count: number[];
    visa_office: string[];
    certificate_type: string[];
  };
  records: Record_[];
}

// ---- Chatbot stats pack (web/public/chatbot_stats.json) ----
// Precomputed aggregates emitted by scripts/build_chatbot_stats.py. The served
// chatbot reads only this file (plus analytics.json for the guided estimator),
// never an external API.

export interface DurationStat {
  median: number | null;
  n: number;
}

export interface ChatbotStats {
  as_of: string;
  n_total: number;
  min_n_for_display: number;
  milestone_keys: string[];
  date_range: { min: string | null; max: string | null };
  counts: {
    by_year: Record<string, number>;
    by_city: Record<string, number>;
    by_visa_office: Record<string, number>;
    by_app_type: Record<string, number>;
    by_certificate_type: Record<string, number>;
    by_applicant: { single: number; family: number; unknown: number };
  };
  durations: DurationBlock & {
    /** Same duration aggregates split by single vs family applications. */
    by_applicant: { single: DurationBlock; family: DurationBlock };
  };
}

export interface DurationBlock {
  total: DurationStat;
  /** Keyed "<fromMilestoneKey>__<toMilestoneKey>" for adjacent milestones. */
  consecutive_pairs: Record<string, DurationStat>;
  /** Keyed "<fromMilestoneKey>__<toMilestoneKey>" for every ordered pair (i<j). */
  all_pairs: Record<string, DurationStat>;
}

export interface Filters {
  city: string | null;
  year: string | null;
  app_type: string | null;
  // Single-vs-family category. "single" -> applicant_count === 1;
  // "family" -> applicant_count >= 2 (exact family size is not reliably known).
  applicant_count: "single" | "family" | null;
  visa_office: string | null;
  certificate_type: string | null;
}

export const emptyFilters = (): Filters => ({
  city: null,
  year: null,
  app_type: null,
  applicant_count: null,
  visa_office: null,
  certificate_type: null,
});

export function applyFilters(records: Record_[], f: Filters): Record_[] {
  return records.filter((r) => {
    if (f.city != null && r.city !== f.city) return false;
    if (f.year != null && (r.year == null || String(r.year) !== f.year)) return false;
    if (f.app_type != null && r.app_type !== f.app_type) return false;
    if (f.applicant_count === "single" && r.applicant_count !== 1) return false;
    if (f.applicant_count === "family" && !(r.applicant_count != null && r.applicant_count >= 2)) return false;
    if (f.visa_office != null && r.visa_office !== f.visa_office) return false;
    if (f.certificate_type != null && r.certificate_type !== f.certificate_type) return false;
    return true;
  });
}

export interface Stats {
  n: number;
  median: number | null;
  mean: number | null;
  p25: number | null;
  p75: number | null;
  min: number | null;
  max: number | null;
}

const empty = (): Stats => ({
  n: 0,
  median: null,
  mean: null,
  p25: null,
  p75: null,
  min: null,
  max: null,
});

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function statsOf(values: number[]): Stats {
  const xs = values.filter((v) => Number.isFinite(v));
  if (xs.length === 0) return empty();
  const sorted = [...xs].sort((a, b) => a - b);
  const sum = xs.reduce((s, v) => s + v, 0);
  return {
    n: xs.length,
    median: quantile(sorted, 0.5),
    mean: sum / xs.length,
    p25: quantile(sorted, 0.25),
    p75: quantile(sorted, 0.75),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/** Days between two date strings (inclusive of nulls returning null). */
export function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const ad = Date.parse(a);
  const bd = Date.parse(b);
  if (!Number.isFinite(ad) || !Number.isFinite(bd)) return null;
  const d = (bd - ad) / 86400000;
  if (d < 0) return null; // negative gaps = bad data; ignore
  return d;
}

/** Total wait time for a single record (earliest available start → latest available end). */
export function totalDays(r: Record_): number | null {
  // Start: submission_date (idx 0) ?? aor_date (idx 1)
  const start = r.dates[0] ?? r.dates[1] ?? null;
  // End: certificate_received_date (idx 6) ?? ceremony_date (idx 5)
  const end = r.dates[6] ?? r.dates[5] ?? null;
  return daysBetween(start, end);
}

/** Stats of total wait time across a filtered cohort. */
export function totalStats(records: Record_[]): Stats {
  const xs: number[] = [];
  for (const r of records) {
    const d = totalDays(r);
    if (d != null) xs.push(d);
  }
  return statsOf(xs);
}

/** Stats of duration between two milestone indices, across records. */
export function pairStats(
  records: Record_[],
  fromIdx: number,
  toIdx: number,
): Stats {
  const xs: number[] = [];
  for (const r of records) {
    const d = daysBetween(r.dates[fromIdx], r.dates[toIdx]);
    if (d != null) xs.push(d);
  }
  return statsOf(xs);
}

/** Pair stats grouped by city. Returned as { city: stats }. */
export function pairStatsByCity(
  records: Record_[],
  fromIdx: number,
  toIdx: number,
): Map<string, Stats> {
  const buckets = new Map<string, number[]>();
  for (const r of records) {
    if (!r.city) continue;
    const d = daysBetween(r.dates[fromIdx], r.dates[toIdx]);
    if (d == null) continue;
    let arr = buckets.get(r.city);
    if (!arr) {
      arr = [];
      buckets.set(r.city, arr);
    }
    arr.push(d);
  }
  const out = new Map<string, Stats>();
  for (const [city, vals] of buckets) out.set(city, statsOf(vals));
  return out;
}

/** Sample count per city across the filtered records (independent of pair). */
export function nByCity(records: Record_[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of records) {
    if (!r.city) continue;
    m.set(r.city, (m.get(r.city) ?? 0) + 1);
  }
  return m;
}

/** Human-readable descriptor for the current filter combination. */
export function describeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.city) parts.push(`in ${f.city}`);
  if (f.year) parts.push(`who applied in ${f.year}`);
  if (f.app_type) parts.push(f.app_type === "Online" ? "applying online" : "applying on paper");
  if (f.applicant_count === "single") parts.push("applying solo");
  else if (f.applicant_count === "family") parts.push("applying as a family");
  if (f.visa_office) parts.push(`processed at ${f.visa_office}`);
  if (f.certificate_type) {
    parts.push(`receiving a ${f.certificate_type.toLowerCase()} certificate`);
  }
  return parts.length === 0 ? "across Canada" : parts.join(", ");
}
