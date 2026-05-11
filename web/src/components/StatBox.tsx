import type { Stats } from "../lib/analytics";
import type { Strings } from "../lib/i18n";

interface Props {
  stats: Stats;
  descriptor: string;
  minNForDisplay: number;
  strings: Strings;
}

export default function StatBox({ stats, descriptor, minNForDisplay, strings }: Props) {
  const { n, median, p25, p75 } = stats;

  if (n === 0) {
    return (
      <div className="stat-card">
        <div className="stat-cohort">{strings.cohort_intro} {descriptor}</div>
        <div className="stat-empty">{strings.no_data}</div>
      </div>
    );
  }

  const based =
    n === 1
      ? strings.based_on_singular
      : strings.based_on_plural.replace("{n}", String(n));

  return (
    <div className="stat-card">
      <div className="stat-cohort">
        {strings.cohort_intro} {descriptor}, {strings.typical_wait}
      </div>
      <div className="stat-headline">
        <span className="stat-number">{Math.round(median ?? 0)}</span>
        <span className="stat-unit">{strings.days_unit}</span>
      </div>
      {p25 != null && p75 != null && (
        <div className="stat-range">
          {strings.range_intro} <strong>{Math.round(p25)}</strong> {strings.range_to}{" "}
          <strong>{Math.round(p75)}</strong> {strings.days_unit}.
        </div>
      )}
      <div className="stat-meta">{based}</div>
      {n < minNForDisplay && <div className="warn">{strings.small_sample}</div>}
    </div>
  );
}
