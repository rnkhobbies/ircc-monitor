# IRCC Monitor

Community-sourced wait times for the Canadian citizenship process, plus a 500-question practice test cited to the official *Discover Canada* study guide.

**Live site:** [irccmonitor.ca](https://irccmonitor.ca)

---

## What it is

Two tools for people going through the Canadian citizenship process, in one place:

1. **Wait-time dashboard** — interactive view of self-reported processing times, filterable by city, year, application type, visa office, applicant count, and certificate format. Headline number, milestone-by-milestone timeline, and a Canada-wide heatmap.
2. **Practice test** — 500 multiple-choice questions, drawn from the publicly available *Discover Canada* study guide. Each option (right *and* wrong) is annotated with what it actually means and the page in the guide where the fact lives, so a wrong answer teaches you the distinction it tested.

Independent project. **Not affiliated with the Government of Canada or IRCC.** For official information visit [canada.ca](https://www.canada.ca/).

## Data source

Wait-time numbers come from a public Persian-language Telegram supergroup where applicants share structured updates under a fixed hashtag. Neither the raw exports nor the derived `analytics.json` are committed to this repo — the code that produces them is open, the dataset itself is not. The live site at [irccmonitor.ca](https://irccmonitor.ca) serves the current aggregate; to regenerate locally, drop a Telegram export under `data/citizenship/ChatExport_<DATE>/` and run the notebook.

Practice-test content is drawn from the publicly available *Discover Canada — The Rights and Responsibilities of Citizenship* PDF published by IRCC. The full 500-question bank is **not** committed to this repo either — the extraction pipeline and schema are, but the curated bank itself stays private. The live test at [irccmonitor.ca/test](https://irccmonitor.ca/test) is the canonical copy.

## Architecture

| Piece | Where it lives | What it does |
|---|---|---|
| Data pipeline | `notebooks/local_analysis.ipynb` | Validates Telegram messages against a regex gatekeeper, sends candidates through `gpt-4o-mini` for structured extraction, then through `gpt-4o` for a quality-review pass, aggregates the result, and emits `web/public/analytics.json`. |
| Question bank | `data/citizenship_test/question_bank.json` *(gitignored)* | 500 questions with per-option annotations grounded in PDF page numbers. Generated locally; not committed. |
| Frontend | `web/` | Astro + React islands. Static-site, hosted on Cloudflare Pages. MapLibre-free SVG map via d3-geo. Bundle is ~140 KB gzipped. |
| Visit counter | `web/functions/api/visits.js` + Cloudflare KV | Tiny Pages Function — POST increments, GET reads. Bot UAs filtered out. |

## Run locally

```bash
# Dashboard frontend
cd web
npm install
npm run dev
```

For the notebook side you'll need a Python env with the deps in `requirements.txt`:

```bash
pip install -r requirements.txt
```

Drop a Telegram desktop export under `data/citizenship/ChatExport_<DATE>/` and run the notebook. It'll emit a fresh `analytics.json` into `web/public/` (gitignored — your local copy only). The question bank under `data/citizenship_test/question_bank.json` is also gitignored; the live site ships its own copy.

## Deploy

```bash
cd web
npm run deploy
```

Builds + pushes to Cloudflare Pages (`ircc-monitor` project). First-time setup requires `npx wrangler login`.

## Roadmap

- Lift the validator/extractor/aggregator out of the notebook into importable `src/ircc_tracker/` modules so a future CLI and the live site share one code path.
- Replace the manual Telegram export with API-based MTProto fetching.
- Office-vs-city map toggle, Farsi locale + RTL layout, distribution band visualisation.
- Test simulator: persistent test history, weak-topic adaptive selection, additional province packs beyond Ontario.

## License

MIT. See [LICENSE](LICENSE).
