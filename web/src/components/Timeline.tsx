import type { Record_, Stats } from "../lib/analytics";
import { pairStats } from "../lib/analytics";
import type { Strings } from "../lib/i18n";
import MilestoneIcon from "./MilestoneIcon";
import { useMemo } from "react";

interface Props {
  records: Record_[];
  milestoneCount: number;
  strings: Strings;
}

const W = 960;
const H = 220;
const MARGIN = 60;
const ICON_BOX = 56;
const ICON_INNER = 28;

export default function Timeline({ records, milestoneCount, strings }: Props) {
  const indices = useMemo(
    () => Array.from({ length: milestoneCount }, (_, i) => i),
    [milestoneCount],
  );

  const adjacent: Stats[] = useMemo(
    () =>
      indices.slice(0, -1).map((i) => pairStats(records, i, i + 1)),
    [records, indices],
  );

  const usableW = W - MARGIN * 2;
  const xs = indices.map((_, i) =>
    indices.length === 1 ? MARGIN : MARGIN + (i / (indices.length - 1)) * usableW,
  );
  const cy = 70;
  const labelTop = cy + ICON_BOX / 2 + 12;
  const anyDuration = adjacent.some((s) => s.median != null);

  return (
    <div className="timeline-card">
      <div className="section-title">{strings.timeline_title}</div>
      <p className="section-lede">{strings.timeline_lede}</p>
      {anyDuration ? (
        <div className="timeline-svg-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={strings.timeline_title}>
            <defs>
              <marker
                id="timeline-arrow"
                viewBox="0 -5 10 10"
                refX={9}
                refY={0}
                markerWidth={6}
                markerHeight={6}
                orient="auto"
              >
                <path d="M0,-5L10,0L0,5" fill="var(--ink-soft)" />
              </marker>
            </defs>

            {indices.slice(0, -1).map((i) => {
              const x1 = xs[i] + ICON_BOX / 2;
              const x2 = xs[i + 1] - ICON_BOX / 2 - 2;
              const days = adjacent[i]?.median ?? null;
              const rounded = days != null ? Math.round(days) : null;
              const label =
                rounded != null
                  ? `${rounded} ${rounded === 1 ? strings.day_unit_singular : strings.days_unit}`
                  : "—";
              return (
                <g key={`c${i}`}>
                  <line
                    x1={x1}
                    y1={cy}
                    x2={x2}
                    y2={cy}
                    stroke="var(--ink-soft)"
                    strokeWidth={2}
                    markerEnd="url(#timeline-arrow)"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={cy - 14}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={700}
                    fill="var(--ink)"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {indices.map((i) => {
              const m = strings.milestones[i];
              const lines = m?.lines ?? [m?.name ?? ""];
              return (
                <g key={`m${i}`} transform={`translate(${xs[i]},${cy})`}>
                  <circle
                    r={ICON_BOX / 2}
                    fill="white"
                    stroke="var(--accent)"
                    strokeWidth={2}
                  />
                  <g
                    transform={`translate(${-ICON_INNER / 2}, ${-ICON_INNER / 2})`}
                    style={{ color: "var(--accent)" }}
                  >
                    <MilestoneIcon index={i} size={ICON_INNER} />
                  </g>
                  <text
                    x={0}
                    y={labelTop - cy}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--ink)"
                  >
                    {lines.map((line, li) => (
                      <tspan key={li} x={0} dy={li === 0 ? 0 : 14}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="empty-note">{strings.timeline_no_data}</div>
      )}
    </div>
  );
}
