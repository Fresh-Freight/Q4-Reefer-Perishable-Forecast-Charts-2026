# Q4 Reefer Truck Availability by Region — USDA AMS

Choropleth of **Q4 (October–December) refrigerated truck availability** by USDA
shipping region, averaged over a rolling four-year window, on the AMS 1–5 scale
(**1 = surplus → 5 = shortage**). A ranked-bar view of the same figures sits
behind a toggle.

This chart is one subfolder of the **Q4-Reefer-Perishable-Forecast-Charts-2026**
monorepo. It has a build step — the repo workflow runs it and copies the output
into `docs/usda-truck-availability/`, so it publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/usda-truck-availability/`

---

## What it does

1. Pulls every Q4 (Oct/Nov/Dec) availability reading from the **AMS Refrigerated
   Truck Rates and Availability** dataset (Socrata `acar-e3r8`) for the last four
   *complete* calendar years.
2. Buckets reporting origins into the canonical AMS shipping regions and averages
   by **region × year × month**, carrying the sample size `n` for each cell.
3. Injects that aggregate into `heatmap_template.html` as a single `const DATA`
   line and writes `docs/index.html`.
4. Renders a US choropleth with a **diverging** color ramp — the decision-relevant
   signal is direction away from "adequate (3)", and Q4 readings cluster tightly
   around it — plus filters for year and Q4 month.

The published page re-fetches Socrata itself on load, so the baked aggregate is a
**fallback** that keeps the map readable if that request fails (offline, corporate
network blocking the endpoint, or a Socrata outage).

---

## Chart layout

```
charts/usda-truck-availability/
  scripts/fetch_data.py     Socrata client + region bucketing; the ONLY file that touches the USDA API
  scripts/build_chart.py    Aggregates and injects into the template → docs/index.html
  heatmap_template.html     Map, ranked-bar view, filters, legend (D3 + TopoJSON)
  requirements.txt          pandas + requests
  .gitignore                Ignores this chart's docs/ — see note below
```

The build/deploy workflow lives at the repo root (`.github/workflows/build.yml`)
and orchestrates all charts.

---

## Local development

```bash
pip install -r requirements.txt
python scripts/build_chart.py     # fetches + renders → docs/index.html
```

`build_chart.py` calls `fetch_data.py` for you; there is no separate fetch step.

To work offline, download the dataset export and point the script at it:

```bash
DATA_SOURCE=csv CSV_FALLBACK_PATH=/path/to/export.csv python scripts/build_chart.py
```

The export is ~32 MB and is **deliberately not committed** — CI always uses the
API path.

To reproduce a previously published chart, pin the window:

```bash
YEAR_MIN=2021 YEAR_MAX=2024 python scripts/build_chart.py
```

---

## Notes that matter

- **The local `.gitignore` is required.** The root `.gitignore` uses `/docs/`,
  whose leading slash anchors it to the repo root, so it does **not** cover
  `charts/<slug>/docs/`. Without this file the generated output would be
  committed.
- **`CSV_FALLBACK_PATH` resolves against this chart's directory**, not the
  caller's working directory, because CI invokes scripts from the repo root.
- **`SOCRATA_APP_TOKEN` is optional.** The dataset is public; the token only
  raises the rate limit. Its absence is not an error.
- **The window ends at the last complete Q4.** Q4 of year Y only closes on
  31 Dec, so during year Y the newest complete Q4 is Y−1. This keeps a
  mid-quarter rebuild from averaging in a partial December.
- **Unrecognized origins are dropped, not guessed.** Canada, `OTHER` and blanks
  are discarded — a mis-bucketed origin would silently recolor a whole district.
  Indiana folds into Great Lakes to match the commodity heatmap's mapping.
- **Thin samples are flagged in the tooltip.** Several regions report only a
  handful of Q4 lanes; a 2-observation average should not read like a
  600-observation one. Mid-Atlantic currently rests on 12.

---

## Data source

- **Dataset:** USDA AMS Specialty Crops Program — Refrigerated Truck Rates and Availability
- **URL:** https://agtransport.usda.gov/Truck/Refrigerated-Truck-Rates-and-Availability/acar-e3r8/data
- **API:** Socrata SODA v2 — `https://agtransport.usda.gov/resource/acar-e3r8.json`
- **Scale:** 1 = surplus, 2 = slight surplus, 3 = adequate, 4 = slight shortage, 5 = shortage
