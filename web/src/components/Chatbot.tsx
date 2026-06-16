import { useMemo, useRef, useState } from "react";
import type {
  Analytics,
  ChatbotStats,
  DurationStat,
  Filters,
  Record_,
} from "../lib/analytics";
import { applyFilters, totalStats } from "../lib/analytics";
import type { Strings } from "../lib/i18n";
import styles from "./Chatbot.module.css";

interface Props {
  analytics: Analytics;
  stats: ChatbotStats;
  strings: Strings;
}

type Mode = "estimate" | "ask";

interface ChatMsg {
  who: "bot" | "user";
  text: string;
  /** Optional headline number rendered large (e.g. "168 days"). */
  strong?: string;
  /** Optional muted footnote (e.g. sample size). */
  muted?: string;
}

// Guided-estimator steps, in order.
type Step = "city" | "visa_office" | "app_type" | "year" | "done";
const STEP_ORDER: Step[] = ["city", "visa_office", "app_type", "year", "done"];

const fmt = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

const months = (days: number) => Math.round(days / 30.44);

export default function Chatbot({ analytics, stats, strings }: Props) {
  const t = strings.chatbot;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("estimate");

  return (
    <>
      {!open && (
        <button
          type="button"
          className={styles.launcher}
          aria-label={t.open}
          onClick={() => setOpen(true)}
        >
          <span className={styles.launcherIcon} aria-hidden="true">
            💬
          </span>
          {t.launcher_label}
        </button>
      )}
      {open && (
        <div className={styles.panel} role="dialog" aria-label={t.title}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <span className={styles.headerTitle}>{t.title}</span>
              <span className={styles.headerSub}>{t.subtitle}</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label={t.close}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={styles.modeRow}>
            <button
              type="button"
              className={`${styles.modeBtn} ${
                mode === "estimate" ? styles.modeBtnActive : ""
              }`}
              onClick={() => setMode("estimate")}
            >
              {t.mode_estimate}
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${
                mode === "ask" ? styles.modeBtnActive : ""
              }`}
              onClick={() => setMode("ask")}
            >
              {t.mode_ask}
            </button>
          </div>

          {mode === "estimate" ? (
            <Estimator analytics={analytics} strings={strings} />
          ) : (
            <AskMode stats={stats} strings={strings} />
          )}
        </div>
      )}
    </>
  );
}

/* ----------------------------- Guided estimator ----------------------------- */

function Estimator({
  analytics,
  strings,
}: {
  analytics: Analytics;
  strings: Strings;
}) {
  const t = strings.chatbot;
  const [step, setStep] = useState<Step>("city");
  const [picks, setPicks] = useState<Filters>({
    city: null,
    year: null,
    app_type: null,
    applicant_count: null,
    visa_office: null,
    certificate_type: null,
  });

  const stepIdx = STEP_ORDER.indexOf(step);
  const advance = () => setStep(STEP_ORDER[stepIdx + 1] ?? "done");

  const reset = () => {
    setStep("city");
    setPicks({
      city: null,
      year: null,
      app_type: null,
      applicant_count: null,
      visa_office: null,
      certificate_type: null,
    });
  };
  const back = () => {
    if (stepIdx > 0) setStep(STEP_ORDER[stepIdx - 1]);
  };

  const pick = (patch: Partial<Filters>) => {
    setPicks((p) => ({ ...p, ...patch }));
    advance();
  };

  const result = useMemo(() => {
    if (step !== "done") return null;
    const filtered = applyFilters(analytics.records, picks);
    return totalStats(filtered);
  }, [step, picks, analytics.records]);

  const descriptor = describePicks(picks, t.descriptor_anywhere);

  return (
    <>
      <div className={styles.body}>
        <div className={`${styles.msg} ${styles.msgBot}`}>{t.estimate_intro}</div>

        {step === "city" && (
          <StepChoices
            label={t.step_city}
            options={analytics.options.city}
            onPick={(v) => pick({ city: v })}
            onSkip={() => pick({ city: null })}
            skipLabel={t.skip}
          />
        )}
        {step === "visa_office" && (
          <StepChoices
            label={t.step_visa_office}
            options={analytics.options.visa_office}
            onPick={(v) => pick({ visa_office: v })}
            onSkip={() => pick({ visa_office: null })}
            skipLabel={t.skip}
          />
        )}
        {step === "app_type" && (
          <StepChoices
            label={t.step_app_type}
            options={analytics.options.app_type}
            onPick={(v) => pick({ app_type: v as "Online" | "Paper" })}
            onSkip={() => pick({ app_type: null })}
            skipLabel={t.skip}
          />
        )}
        {step === "year" && (
          <StepChoices
            label={t.step_year}
            options={analytics.options.year}
            onPick={(v) => pick({ year: v })}
            onSkip={() => pick({ year: null })}
            skipLabel={t.skip}
          />
        )}

        {step === "done" && result && (
          <ResultCard
            stats={result}
            descriptor={descriptor}
            minN={analytics.min_n_for_display}
            strings={strings}
          />
        )}
      </div>

      <div className={styles.inputRow}>
        {stepIdx > 0 && step !== "done" && (
          <button type="button" className={styles.navBtn} onClick={back}>
            {t.back}
          </button>
        )}
        <button type="button" className={styles.navBtn} onClick={reset}>
          {t.start_over}
        </button>
      </div>
    </>
  );
}

function StepChoices({
  label,
  options,
  onPick,
  onSkip,
  skipLabel,
}: {
  label: string;
  options: (string | number)[];
  onPick: (v: string) => void;
  onSkip: () => void;
  skipLabel: string;
}) {
  return (
    <div className={`${styles.msg} ${styles.msgBot}`}>
      {label}
      <div className={styles.choices}>
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            className={styles.chip}
            onClick={() => onPick(String(o))}
          >
            {String(o)}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.chip} ${styles.chipMuted}`}
          onClick={onSkip}
        >
          {skipLabel}
        </button>
      </div>
    </div>
  );
}

function ResultCard({
  stats,
  descriptor,
  minN,
  strings,
}: {
  stats: { n: number; median: number | null };
  descriptor: string;
  minN: number;
  strings: Strings;
}) {
  const t = strings.chatbot;
  if (stats.n === 0) {
    return <div className={`${styles.msg} ${styles.msgBot}`}>{t.estimate_no_data}</div>;
  }
  if (stats.n < minN) {
    return (
      <div className={`${styles.msg} ${styles.msgBot}`}>
        {fmt(t.estimate_small_sample, { n: stats.n })}
      </div>
    );
  }
  const days = Math.round(stats.median ?? 0);
  const based =
    stats.n === 1
      ? t.estimate_based_on_singular
      : fmt(t.estimate_based_on_plural, { n: stats.n });
  return (
    <div className={`${styles.msg} ${styles.msgBot}`}>
      {fmt(t.estimate_result_lead, { descriptor })}
      <span className={styles.msgStrong}>{fmt(t.estimate_days, { days })}</span>
      <span className={styles.msgMuted}>
        {fmt(t.estimate_about_months, { months: months(days) })}
      </span>
      <br />
      <span className={styles.msgMuted}>{based}</span>
    </div>
  );
}

function describePicks(f: Filters, anywhere: string): string {
  const parts: string[] = [];
  if (f.city) parts.push(`in ${f.city}`);
  if (f.visa_office) parts.push(`processed at ${f.visa_office}`);
  if (f.app_type) parts.push(f.app_type === "Online" ? "applying online" : "applying on paper");
  if (f.year) parts.push(`who applied in ${f.year}`);
  return parts.length === 0 ? anywhere : `applicants ${parts.join(", ")}`;
}

/* ------------------------------- Ask mode ---------------------------------- */

function AskMode({ stats, strings }: { stats: ChatbotStats; strings: Strings }) {
  const t = strings.chatbot;
  const [messages, setMessages] = useState<ChatMsg[]>([
    { who: "bot", text: t.ask_intro },
  ]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  };

  const submit = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const answer = answerQuestion(q, stats, strings);
    setMessages((m) => [...m, { who: "user", text: q }, answer]);
    setInput("");
    scrollDown();
  };

  const examples = [
    t.example_q_year,
    t.example_q_pair,
    t.example_q_family,
    t.example_q_total,
  ];

  return (
    <>
      <div className={styles.body} ref={bodyRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.msg} ${m.who === "bot" ? styles.msgBot : styles.msgUser}`}
          >
            {m.text}
            {m.strong && <span className={styles.msgStrong}>{m.strong}</span>}
            {m.muted && <span className={styles.msgMuted}>{m.muted}</span>}
          </div>
        ))}
        <div className={styles.exampleList}>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              className={styles.exampleBtn}
              onClick={() => submit(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <form
        className={styles.inputRow}
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.ask_placeholder}
          aria-label={t.ask_placeholder}
        />
        <button type="submit" className={styles.sendBtn} disabled={!input.trim()}>
          {t.ask_send}
        </button>
      </form>
    </>
  );
}

/* --------------------------- Intent matcher -------------------------------- */

// Human-readable milestone names for echoing back in pair answers.
const MILESTONE_LABEL: Record<string, string> = {
  submission_date: "submission",
  aor_date: "AOR (acknowledgement)",
  bg_verification_date: "background check",
  test_invite_date: "test invite",
  test_date: "test",
  ceremony_date: "ceremony",
  certificate_received_date: "certificate received",
};

// Keyword sets the matcher uses to recognize a milestone in free text.
const MILESTONE_SYNONYMS: { key: string; words: string[] }[] = [
  { key: "submission_date", words: ["submission", "submit", "apply", "application", "applied", "sending"] },
  { key: "aor_date", words: ["aor", "acknowledg", "received your application", "receipt"] },
  { key: "bg_verification_date", words: ["background", "bg check", "bg ", "verification", "security check"] },
  { key: "test_invite_date", words: ["test invite", "invited to test", "invitation to test", "test invitation"] },
  { key: "test_date", words: ["test", "exam"] },
  { key: "ceremony_date", words: ["ceremony", "oath"] },
  { key: "certificate_received_date", words: ["certificate", "cert "] },
];

function detectMilestones(q: string): string[] {
  const found: { key: string; idx: number }[] = [];
  for (const { key, words } of MILESTONE_SYNONYMS) {
    let best = -1;
    for (const w of words) {
      const i = q.indexOf(w);
      if (i >= 0 && (best < 0 || i < best)) best = i;
    }
    if (best >= 0) found.push({ key, idx: best });
  }
  // Order by position in the sentence so "from X to Y" keeps direction.
  found.sort((a, b) => a.idx - b.idx);
  // De-dupe keys, preserve order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of found) {
    if (!seen.has(f.key)) {
      seen.add(f.key);
      out.push(f.key);
    }
  }
  return out;
}

function pairStat(
  stats: ChatbotStats,
  a: string,
  b: string,
): DurationStat | null {
  const keys = stats.milestone_keys;
  const ai = keys.indexOf(a);
  const bi = keys.indexOf(b);
  if (ai < 0 || bi < 0 || ai === bi) return null;
  const lo = Math.min(ai, bi);
  const hi = Math.max(ai, bi);
  const key = `${keys[lo]}__${keys[hi]}`;
  return stats.durations.all_pairs[key] ?? null;
}

function answerQuestion(
  raw: string,
  stats: ChatbotStats,
  strings: Strings,
): ChatMsg {
  const t = strings.chatbot;
  const q = raw.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => q.includes(w));

  const yearMatch = q.match(/\b(20\d{2})\b/);

  // ---- 1. Duration between two milestones (check before plain counts) ----
  if (
    has("how long", "how many days", "duration", "gap", "take from", "between", "wait time", "wait is", "wait for") ||
    /from .* to /.test(q)
  ) {
    // total wait?
    if (has("total", "overall", "start to finish", "whole process", "beginning to end", "entire")) {
      const d = stats.durations.total;
      if (d.median != null) {
        return {
          who: "bot",
          text: fmt(t.ans_total_duration, {
            days: Math.round(d.median),
            months: months(d.median),
            n: d.n,
          }),
        };
      }
    }
    const ms = detectMilestones(q);
    if (ms.length >= 2) {
      const ds = pairStat(stats, ms[0], ms[1]);
      if (ds) {
        if (ds.median == null || ds.n < stats.min_n_for_display) {
          return {
            who: "bot",
            text: fmt(t.ans_pair_small, {
              n: ds.n,
              from: MILESTONE_LABEL[ms[0]],
              to: MILESTONE_LABEL[ms[1]],
            }),
          };
        }
        return {
          who: "bot",
          text: fmt(t.ans_pair, {
            from: MILESTONE_LABEL[ms[0]],
            to: MILESTONE_LABEL[ms[1]],
            days: Math.round(ds.median),
            months: months(ds.median),
            n: ds.n,
          }),
        };
      }
    }
    // "how long does the whole thing take" with no milestones → total
    const d = stats.durations.total;
    if (d.median != null && has("take", "long", "wait")) {
      return {
        who: "bot",
        text: fmt(t.ans_total_duration, {
          days: Math.round(d.median),
          months: months(d.median),
          n: d.n,
        }),
      };
    }
  }

  // ---- 2. Single vs family ----
  if (has("single", "family", "families", "solo", "alone", "individual", "applicant")) {
    if (has("single", "family", "families", "solo", "alone") || has("vs", "versus")) {
      const a = stats.counts.by_applicant;
      return {
        who: "bot",
        text: fmt(t.ans_family, {
          total: stats.n_total,
          single: a.single,
          family: a.family,
          unknown: a.unknown,
        }),
      };
    }
  }

  // ---- 3. Counts by year ----
  if (yearMatch && has("how many", "count", "number", "cases", "submitted", "applied", "applications")) {
    const year = yearMatch[1];
    const c = stats.counts.by_year[year];
    if (c != null) {
      return { who: "bot", text: fmt(t.ans_year_count, { n: c, year, total: stats.n_total }) };
    }
    return {
      who: "bot",
      text: fmt(t.ans_year_unknown, {
        year,
        years: Object.keys(stats.counts.by_year).join(", "),
      }),
    };
  }

  // ---- 4. Breakdown by year (no specific year named) ----
  if (has("by year", "each year", "per year", "every year") || (has("year") && has("breakdown", "distribution", "how many"))) {
    const breakdown = Object.entries(stats.counts.by_year)
      .map(([y, n]) => `${y}: ${n}`)
      .join(", ");
    return { who: "bot", text: fmt(t.ans_all_years, { breakdown, total: stats.n_total }) };
  }

  // ---- 5. Counts by city ----
  if (has("city", "cities", "from ", "in ") && has("how many", "count", "number", "cases")) {
    // try to find a known city name in the question
    for (const city of Object.keys(stats.counts.by_city)) {
      if (q.includes(city.toLowerCase())) {
        return { who: "bot", text: fmt(t.ans_city_count, { n: stats.counts.by_city[city], city }) };
      }
    }
    if (has("city", "cities")) {
      const top = Object.entries(stats.counts.by_city)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([c]) => c)
        .join(", ");
      return { who: "bot", text: fmt(t.ans_city_unknown, { city: "?", cities: top }) };
    }
  }

  // direct city name even without "how many" (e.g. "Toronto cases")
  for (const city of Object.keys(stats.counts.by_city)) {
    if (q.includes(city.toLowerCase()) && has("case", "how many", "number", "count")) {
      return { who: "bot", text: fmt(t.ans_city_count, { n: stats.counts.by_city[city], city }) };
    }
  }

  // ---- 6. App type breakdown ----
  if (has("online", "paper", "app type", "how did people apply", "method", "way people apply")) {
    const breakdown = Object.entries(stats.counts.by_app_type)
      .map(([k, n]) => `${k}: ${n}`)
      .join(", ");
    return { who: "bot", text: fmt(t.ans_app_type, { breakdown }) };
  }

  // ---- 7. Date range ----
  if (has("date range", "range of dates", "earliest", "latest", "oldest", "newest", "time span", "what period", "what dates")) {
    return {
      who: "bot",
      text: fmt(t.ans_date_range, {
        min: stats.date_range.min ?? "?",
        max: stats.date_range.max ?? "?",
      }),
    };
  }

  // ---- 8. Total case count ----
  if (has("how many", "total", "number of cases", "count") && has("case", "record", "data", "application", "people", "total")) {
    return { who: "bot", text: fmt(t.ans_total_count, { total: stats.n_total, as_of: stats.as_of }) };
  }

  // ---- Fallback ----
  return { who: "bot", text: t.fallback };
}
