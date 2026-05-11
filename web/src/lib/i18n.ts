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
  applicant_count_couple: "Couple",
  applicant_count_family: "Family of {n}",
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
};

export type Strings = typeof en;
