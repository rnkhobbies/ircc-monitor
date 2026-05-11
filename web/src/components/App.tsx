import { useMemo, useState } from "react";
import type { Analytics, Filters } from "../lib/analytics";
import {
  applyFilters,
  describeFilters,
  emptyFilters,
  totalStats,
} from "../lib/analytics";
import type { Strings } from "../lib/i18n";
import Sidebar from "./Sidebar";
import StatBox from "./StatBox";
import Timeline from "./Timeline";
import Map from "./Map";

interface Props {
  analytics: Analytics;
  strings: Strings;
}

export default function App({ analytics, strings }: Props) {
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  const filtered = useMemo(
    () => applyFilters(analytics.records, filters),
    [analytics.records, filters],
  );
  const cohortStats = useMemo(() => totalStats(filtered), [filtered]);
  const descriptor = useMemo(() => describeFilters(filters), [filters]);

  const setCity = (city: string | null) =>
    setFilters((prev) => ({ ...prev, city }));

  return (
    <div className="app-layout">
      <Sidebar
        analytics={analytics}
        filters={filters}
        onChange={setFilters}
        strings={strings}
      />
      <div className="app-content">
        <StatBox
          stats={cohortStats}
          descriptor={descriptor}
          minNForDisplay={analytics.min_n_for_display}
          strings={strings}
        />
        <Timeline
          records={filtered}
          milestoneCount={analytics.milestone_keys.length}
          strings={strings}
        />
        <Map
          analytics={analytics}
          records={filtered}
          selectedCity={filters.city}
          onCityClick={setCity}
          strings={strings}
        />
      </div>
    </div>
  );
}
