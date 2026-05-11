import type { Analytics, Filters } from "../lib/analytics";
import { emptyFilters } from "../lib/analytics";
import type { Strings } from "../lib/i18n";

interface Props {
  analytics: Analytics;
  filters: Filters;
  onChange: (next: Filters) => void;
  strings: Strings;
}

export default function Sidebar({ analytics, filters, onChange, strings }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const opts = analytics.options;

  const formatApplicantCount = (n: number): string => {
    if (n === 1) return strings.applicant_count_solo;
    if (n === 2) return strings.applicant_count_couple;
    return strings.applicant_count_family.replace("{n}", String(n));
  };

  const anySet = Object.values(filters).some((v) => v != null);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2 className="sidebar-title">{strings.filters_heading}</h2>
        {anySet && (
          <button
            type="button"
            className="sidebar-reset"
            onClick={() => onChange(emptyFilters())}
          >
            {strings.filters_reset}
          </button>
        )}
      </div>

      <Field id="f-city" label={strings.filter_city_label}>
        <Select
          id="f-city"
          value={filters.city ?? ""}
          onChange={(v) => set("city", v === "" ? null : v)}
          allLabel={strings.filter_all_cities}
        >
          {opts.city.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </Field>

      <Field id="f-year" label={strings.filter_year_label}>
        <Select
          id="f-year"
          value={filters.year ?? ""}
          onChange={(v) => set("year", v === "" ? null : v)}
          allLabel={strings.filter_all_years}
        >
          {opts.year.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </Field>

      <Field id="f-apptype" label={strings.filter_app_type_label}>
        <Select
          id="f-apptype"
          value={filters.app_type ?? ""}
          onChange={(v) => set("app_type", v === "" ? null : (v as "Online" | "Paper"))}
          allLabel={strings.filter_all}
        >
          {opts.app_type.map((a) => (
            <option key={a} value={a}>
              {a === "Online" ? strings.app_type_online : strings.app_type_paper}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="f-applicants" label={strings.filter_applicant_count_label}>
        <Select
          id="f-applicants"
          value={filters.applicant_count == null ? "" : String(filters.applicant_count)}
          onChange={(v) => set("applicant_count", v === "" ? null : parseInt(v, 10))}
          allLabel={strings.filter_all}
        >
          {opts.applicant_count.map((n) => (
            <option key={n} value={n}>{formatApplicantCount(n)}</option>
          ))}
        </Select>
      </Field>

      <Field id="f-office" label={strings.filter_visa_office_label}>
        <Select
          id="f-office"
          value={filters.visa_office ?? ""}
          onChange={(v) => set("visa_office", v === "" ? null : v)}
          allLabel={strings.filter_all}
        >
          {opts.visa_office.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      </Field>

      <Field id="f-cert" label={strings.filter_certificate_type_label}>
        <Select
          id="f-cert"
          value={filters.certificate_type ?? ""}
          onChange={(v) =>
            set("certificate_type", v === "" ? null : (v as "Electronic" | "Paper"))
          }
          allLabel={strings.filter_all}
        >
          {opts.certificate_type.map((c) => (
            <option key={c} value={c}>
              {c === "Electronic" ? strings.certificate_type_electronic : strings.certificate_type_paper}
            </option>
          ))}
        </Select>
      </Field>
    </aside>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sidebar-field">
      <label className="sidebar-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  allLabel,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      className="sidebar-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{allLabel}</option>
      {children}
    </select>
  );
}
