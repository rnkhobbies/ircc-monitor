// Centralized strings. Adding fa.json later is a matter of a second dictionary
// and a runtime locale switch — no code changes needed elsewhere.
//
// Copy guidelines: write for someone who has never heard the words "median"
// or "percentile" and is just trying to figure out what to expect for their
// own application.

export interface MilestoneI18n {
  /** Single-line display name (used in legends, selectors, hovers) */
  name: string;
  /** Multi-line label rendered under the timeline icon, one element per line */
  lines: string[];
}

export const en = {
  site_title: "IRCC Monitor",
  hero_kicker: "Canadian citizenship",
  hero_question: "How long does it really take?",
  hero_lede:
    "Real wait times shared by people going through the process — from sending in your application to holding your certificate.",

  filters_heading: "View filtered results",
  filters_reset: "Reset all",
  filter_city_label: "Where do you live?",
  filter_year_label: "When did you apply?",
  filter_app_type_label: "How did you apply?",
  filter_applicant_count_label: "Who is applying?",
  filter_visa_office_label: "Which office is processing it?",
  filter_certificate_type_label: "Certificate format?",
  filter_all: "Any",
  filter_all_cities: "Anywhere in Canada",
  filter_all_years: "Any year",

  // Display strings for categorical option values
  app_type_online: "Online",
  app_type_paper: "Paper",
  applicant_count_solo: "Just me",
  applicant_count_family_any: "A family",
  certificate_type_electronic: "Electronic",
  certificate_type_paper: "Paper",

  // Stat card
  cohort_intro: "For people",
  typical_wait: "the typical wait is",
  days_unit: "days",
  day_unit_singular: "day",
  range_intro: "Most people land between",
  range_to: "and",
  based_on_singular: "Based on what 1 person shared.",
  based_on_plural: "Based on what {n} people shared.",
  small_sample:
    "Just a few stories so far — treat this as a rough hint, not a forecast.",
  no_data:
    "No reports yet for this combination. Try a different selection above.",

  // Timeline
  timeline_title: "How the wait breaks down",
  timeline_lede:
    "Each circle is a step in the process. Numbers between them show how long, on average, people wait at each stage.",
  timeline_no_data: "Not enough reports to break this down.",

  // Map
  map_title: "Where people are",
  map_hint:
    "Pick two milestones below — the map colors each city by the wait between them. Scroll/pinch to zoom; click a city to add it to your filters.",
  hover_fastest: "Fastest:",
  hover_slowest: "Slowest:",
  hover_typical: "Typical:",
  hover_based_on_pair_singular: "based on 1 person",
  hover_based_on_pair_plural: "based on {n} people",
  hover_no_data: "No reports for this step yet.",
  map_selector_from: "From",
  map_selector_to: "to",
  map_legend_wait: "Wait between selected steps:",
  map_legend_size: "bigger circle = more people shared",
  map_no_data_for_pair: "Most cities haven't reported this combination yet.",
  zoom_in: "Zoom in",
  zoom_out: "Zoom out",
  zoom_reset: "Reset view",

  // 7 milestones, in chronological order. Index N here MUST match index N
  // in analytics.json `milestone_keys`. Line breaks are chosen so labels
  // sit cleanly under a 60px icon at typical screen widths.
  milestones: [
    { name: "Submit",                  lines: ["Submit"] },
    { name: "Application acknowledged", lines: ["Application", "acknowledged"] },
    { name: "Background check cleared", lines: ["Background", "check cleared"] },
    { name: "Invited to test",         lines: ["Invited", "to test"] },
    { name: "Took the test",           lines: ["Took the", "test"] },
    { name: "Ceremony",                lines: ["Ceremony"] },
    { name: "Certificate received",    lines: ["Certificate", "received"] },
  ] as MilestoneI18n[],

  // Footer
  data_caveat:
    "These numbers come from people who chose to share in a community group. They are NOT official processing times — those live at canada.ca.",
  as_of_prefix: "Updated",

  switch_lang: "فارسی",

  // ---- Wait-time assistant chatbot ----
  chatbot: {
    // Launcher / header
    launcher_label: "Chat",
    title: "Chat",
    subtitle: "Community data · no personal info needed",
    close: "Close",
    open: "Open chat",

    // Mode switcher
    mode_estimate: "Estimate my wait",
    mode_ask: "Ask a question",

    // Greeting
    greeting:
      "Hi! I can estimate a typical wait time for your situation, or answer questions about the community data. Pick a mode below.",
    based_on_data:
      "All answers come from {n} self-reported cases (updated {as_of}). These are community figures, not official IRCC times.",

    // Guided estimator
    estimate_intro: "Let's narrow it down. You can skip any step.",
    step_city: "Where do you live?",
    step_visa_office: "Which office is processing it? (optional)",
    step_app_type: "How did you apply?",
    step_year: "When did you apply?",
    skip: "Skip / any",
    back: "Back",
    start_over: "Start over",
    estimate_result_lead: "For {descriptor}, the typical total wait is",
    estimate_days: "{days} days",
    estimate_about_months: "(about {months} months)",
    estimate_based_on_singular: "Based on 1 shared case.",
    estimate_based_on_plural: "Based on {n} shared cases.",
    estimate_small_sample:
      "Only {n} matching case(s) — too few to give a reliable number. Try removing a filter (e.g. the year or office).",
    estimate_no_data:
      "No matching cases yet for that combination. Try removing a filter.",
    descriptor_anywhere: "applicants across Canada",

    // Free-text Q&A
    ask_intro: "Ask me about the community data. For example:",
    ask_placeholder: "Type your question…",
    ask_send: "Ask",
    example_q_year: "How many cases were submitted in 2024?",
    example_q_pair: "How long does it take from AOR to ceremony?",
    example_q_family_steps:
      "Do families wait longer than single applicants at each step?",
    example_q_family: "How many single vs family applications?",
    example_q_total: "How many cases are there in total?",

    // Q&A answer templates
    ans_year_count:
      "{n} of the {total} cases were submitted in {year}.",
    ans_year_unknown:
      "I don't have any cases recorded for {year}. The years I have data for are: {years}.",
    ans_all_years:
      "Cases by submission year: {breakdown}. ({total} total)",
    ans_pair:
      "From “{from}” to “{to}”, the typical (median) gap is {days} days (about {months} months), based on {n} cases.",
    ans_pair_small:
      "I only have {n} case(s) spanning “{from}” to “{to}” — too few to report a reliable figure.",
    ans_total_duration:
      "The typical total wait — from applying to receiving the certificate — is {days} days (about {months} months), based on {n} cases.",
    ans_total_count:
      "There are {total} self-reported cases in the dataset (updated {as_of}).",
    ans_family:
      "Of {total} cases: {single} were single applicants and {family} were families ({unknown} didn't say).",
    ans_family_steps_lead:
      "Single vs family — typical (median) time at each step:",
    ans_family_steps_total: "Whole process (start → certificate)",
    ans_family_steps_row: "{label}: single {single}, family {family}",
    ans_family_steps_value: "{days}d",
    ans_family_steps_thin: "too few",
    ans_family_steps_note:
      "Family figures cover {familyN} family cases and {singleN} single cases; “too few” means under {minN} for that step. Differences this small are within community-data noise.",
    ans_city_count:
      "{n} cases are from {city}.",
    ans_city_unknown:
      "I don't have cases tagged for “{city}”. Cities with data include: {cities}.",
    ans_app_type:
      "By how people applied: {breakdown}.",
    ans_date_range:
      "The data spans applications and milestones from {min} to {max}.",

    // Fallback
    fallback:
      "I don't have that stat yet. I can answer things like: case counts by year or city, single-vs-family counts, the total number of cases, the typical total wait, and how long it takes between two milestones (e.g. AOR to ceremony).",
    milestone_list_intro: "The milestones I track are:",
  },
};

export type Strings = typeof en;
