import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleSqrt } from "d3-scale";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import type { FeatureCollection } from "geojson";
import type { Analytics, Record_ } from "../lib/analytics";
import { pairStatsByCity, nByCity } from "../lib/analytics";
import type { Strings } from "../lib/i18n";

interface Props {
  analytics: Analytics;
  records: Record_[];
  selectedCity: string | null;
  onCityClick: (city: string | null) => void;
  strings: Strings;
}

const WIDTH = 900;
const HEIGHT = 540;
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const R_MIN = 5;
const R_MAX = 13;
const ALWAYS_LABELED_TOP_N = 4;

// Perceptually-uniform diverging palette: green → yellow → red.
// interpolateRdYlGn runs red→yellow→green, so we pass 1-t to make
// 0=green (fast) and 1=red (slow), matching the intuitive mental model.
function makeColorScale(min: number, max: number) {
  const span = Math.max(1, max - min);
  return (days: number | null) => {
    if (days == null) return "#cfcfcf";
    const t = Math.max(0, Math.min(1, (days - min) / span));
    return interpolateRdYlGn(1 - t);
  };
}

export default function Map({
  analytics,
  records,
  selectedCity,
  onCityClick,
  strings,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [provinces, setProvinces] = useState<FeatureCollection | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  // The milestone-pair selector controls only this map's color encoding,
  // so its state lives local to the component (not in the global filters).
  // Default to the full journey: Submit (idx 0) → Certificate received (last).
  // This makes the initial heatmap reflect TOTAL wait time variation by city,
  // which is the most useful "at a glance" reading on landing.
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(analytics.milestone_keys.length - 1);

  useEffect(() => {
    let cancelled = false;
    fetch("/canada.geojson")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProvinces(d as FeatureCollection);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const cityStats = useMemo(
    () => pairStatsByCity(records, fromIdx, toIdx),
    [records, fromIdx, toIdx],
  );
  const cityN = useMemo(() => nByCity(records), [records]);

  const cityRows = useMemo(() => {
    return Object.entries(analytics.city_geo).map(([city, geo]) => {
      const stats = cityStats.get(city);
      return {
        city,
        geo,
        stats: stats ?? null,
        nTotal: cityN.get(city) ?? 0,
      };
    });
  }, [analytics, cityStats, cityN]);

  const { colorMin, colorMax, colorScale } = useMemo(() => {
    const days: number[] = [];
    for (const r of cityRows) {
      if (r.stats?.median != null) days.push(r.stats.median);
    }
    if (days.length === 0) return { colorMin: 0, colorMax: 1, colorScale: makeColorScale(0, 1) };
    const lo = Math.min(...days);
    const hi = Math.max(...days);
    return { colorMin: lo, colorMax: hi, colorScale: makeColorScale(lo, hi) };
  }, [cityRows]);

  const maxNTotal = Math.max(...cityRows.map((r) => r.nTotal), 1);
  const rScale = scaleSqrt().domain([0, maxNTotal]).range([R_MIN, R_MAX]);

  const alwaysLabeled = useMemo(() => {
    return new Set(
      [...cityRows]
        .sort((a, b) => b.nTotal - a.nTotal)
        .slice(0, ALWAYS_LABELED_TOP_N)
        .filter((r) => r.nTotal > 0)
        .map((r) => r.city),
    );
  }, [cityRows]);

  const { projection, path } = useMemo(() => {
    const proj = geoMercator();
    if (provinces) {
      proj.fitExtent(
        [
          [16, 16],
          [WIDTH - 16, HEIGHT - 16],
        ],
        provinces,
      );
    } else {
      proj.center([-95, 49]).scale(680).translate([WIDTH / 2, HEIGHT / 2]);
    }
    return { projection: proj, path: geoPath(proj) };
  }, [provinces]);

  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const sel = select<SVGSVGElement, unknown>(node);
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .on("zoom", (event) => setTransform(event.transform));
    sel.call(zoomBehavior);
    (node as unknown as { __zoomBehavior: typeof zoomBehavior }).__zoomBehavior =
      zoomBehavior;
    return () => {
      sel.on(".zoom", null);
    };
  }, []);

  const programmaticZoom = (factor: number | "reset") => {
    const node = svgRef.current;
    if (!node) return;
    const zoomBehavior = (
      node as unknown as { __zoomBehavior?: ReturnType<typeof d3zoom> }
    ).__zoomBehavior;
    if (!zoomBehavior) return;
    const sel = select<SVGSVGElement, unknown>(node);
    if (factor === "reset") {
      sel.transition().duration(250).call(zoomBehavior.transform, zoomIdentity);
    } else {
      sel.transition().duration(180).call(zoomBehavior.scaleBy, factor);
    }
  };

  const k = transform.k;
  const fontCity = 12 / k;
  const strokeProvince = 0.7 / k;

  const milestoneOpts = analytics.milestone_keys.map((_, i) => ({
    idx: i,
    name: strings.milestones[i]?.name ?? `step ${i + 1}`,
  }));
  const fromOpts = milestoneOpts.slice(0, milestoneOpts.length - 1);
  const toOpts = milestoneOpts.slice(fromIdx + 1);

  const onFromChange = (v: number) => {
    setFromIdx(v);
    if (toIdx <= v) setToIdx(v + 1);
  };

  const hoveredRow = hover ? cityRows.find((r) => r.city === hover) ?? null : null;
  const haveAnyDays = cityRows.some((r) => r.stats?.median != null);

  return (
    <div className="map-card">
      <div className="map-header">
        <div className="section-title">{strings.map_title}</div>
        <p className="section-lede">{strings.map_hint}</p>
        <div className="map-step-selector">
          <span className="map-step-label">{strings.map_selector_from}</span>
          <select
            className="map-step-select"
            value={fromIdx}
            onChange={(e) => onFromChange(parseInt(e.target.value, 10))}
            aria-label="From milestone"
          >
            {fromOpts.map((o) => (
              <option key={o.idx} value={o.idx}>{o.name}</option>
            ))}
          </select>
          <span className="map-step-label">{strings.map_selector_to}</span>
          <select
            className="map-step-select"
            value={toIdx}
            onChange={(e) => setToIdx(parseInt(e.target.value, 10))}
            aria-label="To milestone"
          >
            {toOpts.map((o) => (
              <option key={o.idx} value={o.idx}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="map-svg-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Wait time between selected milestones by city"
        >
          <g transform={transform.toString()}>
            {provinces &&
              provinces.features.map((f, i) => (
                <path
                  key={i}
                  d={path(f) ?? undefined}
                  fill="var(--map-province-fill)"
                  stroke="var(--map-province-stroke)"
                  strokeWidth={strokeProvince}
                />
              ))}

            {cityRows.map((row) => {
              const { city, geo, stats, nTotal } = row;
              const xy = projection([geo.lng, geo.lat]);
              if (!xy) return null;
              const [x, y] = xy;
              const isSelected = city === selectedCity;
              const isHover = city === hover;
              const isAlwaysLabeled = alwaysLabeled.has(city);
              const radius = rScale(Math.max(1, nTotal));
              const days = stats?.median ?? null;
              const noData = days == null;
              return (
                <g
                  key={city}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => onCityClick(isSelected ? null : city)}
                  onMouseEnter={() => setHover(city)}
                  onMouseLeave={() => setHover(null)}
                >
                  <circle
                    r={radius}
                    fill={noData ? "white" : colorScale(days)}
                    fillOpacity={noData ? 1 : isHover || isSelected ? 0.95 : 0.85}
                    stroke={isSelected ? "var(--ink)" : noData ? "#bbb" : "white"}
                    strokeWidth={isSelected ? 3 / k : noData ? 1.2 / k : 1.5 / k}
                  />
                  {(isAlwaysLabeled || isSelected || isHover) && (
                    <text
                      y={-radius - 5 / k}
                      textAnchor="middle"
                      fontSize={fontCity}
                      fontWeight={700}
                      fill="var(--ink)"
                      style={{
                        paintOrder: "stroke",
                        stroke: "white",
                        strokeWidth: 3 / k,
                      }}
                    >
                      {city}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="zoom-controls" role="group" aria-label="Zoom controls">
          <button type="button" onClick={() => programmaticZoom(1.4)} aria-label={strings.zoom_in}>+</button>
          <button type="button" onClick={() => programmaticZoom(1 / 1.4)} aria-label={strings.zoom_out}>−</button>
          <button type="button" onClick={() => programmaticZoom("reset")} aria-label={strings.zoom_reset}>⟲</button>
        </div>

        {hoveredRow && <HoverCard row={hoveredRow} strings={strings} />}
      </div>

      <Legend
        haveAnyDays={haveAnyDays}
        colorMin={colorMin}
        colorMax={colorMax}
        colorScale={colorScale}
        strings={strings}
      />
    </div>
  );
}

function HoverCard({
  row,
  strings,
}: {
  row: {
    city: string;
    nTotal: number;
    stats: { n: number; median: number | null; min: number | null; max: number | null } | null;
  };
  strings: Strings;
}) {
  const fmt = (d: number | null) => {
    if (d == null) return "—";
    const r = Math.round(d);
    return `${r} ${r === 1 ? strings.day_unit_singular : strings.days_unit}`;
  };
  const haveStats = row.stats != null && row.stats.n > 0;
  return (
    <div className="map-hover-card" role="status" aria-live="polite">
      <div className="hover-city">{row.city}</div>
      {haveStats ? (
        <>
          <div className="hover-row">
            <span className="hover-label">{strings.hover_typical}</span>
            <span className="hover-value">{fmt(row.stats!.median)}</span>
          </div>
          <div className="hover-row">
            <span className="hover-label">{strings.hover_fastest}</span>
            <span className="hover-value">{fmt(row.stats!.min)}</span>
          </div>
          <div className="hover-row">
            <span className="hover-label">{strings.hover_slowest}</span>
            <span className="hover-value">{fmt(row.stats!.max)}</span>
          </div>
          <div className="hover-meta">
            {row.stats!.n === 1
              ? strings.hover_based_on_pair_singular
              : strings.hover_based_on_pair_plural.replace("{n}", String(row.stats!.n))}
          </div>
        </>
      ) : (
        <div className="hover-meta">{strings.hover_no_data}</div>
      )}
    </div>
  );
}

function Legend({
  haveAnyDays,
  colorMin,
  colorMax,
  colorScale,
  strings,
}: {
  haveAnyDays: boolean;
  colorMin: number;
  colorMax: number;
  colorScale: (d: number | null) => string;
  strings: Strings;
}) {
  if (!haveAnyDays) {
    return <div className="map-legend"><span>{strings.map_no_data_for_pair}</span></div>;
  }
  const lo = Math.round(colorMin);
  const hi = Math.round(colorMax);
  const stripStops = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const day = colorMin + t * (colorMax - colorMin);
    return colorScale(day);
  });
  const gradient = `linear-gradient(to right, ${stripStops.join(", ")})`;
  return (
    <div className="map-legend">
      <span className="legend-label">{strings.map_legend_wait}</span>
      <span className="legend-strip-wrap">
        <span className="legend-strip-tick">{lo} {lo === 1 ? strings.day_unit_singular : strings.days_unit}</span>
        <span className="legend-strip" style={{ background: gradient }} />
        <span className="legend-strip-tick">{hi} {strings.days_unit}</span>
      </span>
      <span className="legend-aside">· {strings.map_legend_size}</span>
    </div>
  );
}
