# Q4 2026 Reefer & Perishable Forecast Charts

Fresh Freight's Q4 (October–December) freight-market chart suite. Each chart lives in its own subfolder under `charts/`, auto-refreshes from its public data source, and is published to a single GitHub Pages site — one URL per chart — for embedding in customer reports.

**Live site:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/`

## Charts

| Folder | Chart | Data source | Status |
|--------|-------|-------------|--------|
| `charts/usda-commodity-heatmap` | Q4 reefer volume heat map by USDA region | USDA AMS (Socrata `rfpn-7etz`) | ✅ live |
| `charts/usda-truck-availability` | Reefer truck availability by USDA region | USDA AMS (Socrata) | ✅ live |
| `charts/reefer-rates` | Spot vs. contract reefer rates | DAT RateView (hand-entered) | ✅ live |
| `charts/reefer-load-to-truck-ratio` | Reefer load-to-truck ratio | DAT Trendlines (hand-entered) | ✅ live |
| `charts/diesel-price-outlook` | Diesel actuals vs. STEO forecast | EIA v2 API | ✅ live |
| `charts/climate-map` | NOAA CPC seasonal outlook (SON 2026) | NOAA CPC | ✅ live |
| `charts/christmas-tree-map` | Christmas tree production by county | USDA 2022 Census of Ag | ✅ live |
| `charts/turkey-map` | Turkey production by state | USDA NASS Turkeys Raised | ✅ live |

Charts fall into three shapes: **fetched at build time** (Python — commodity
heatmap, truck availability), **static with committed data** (JS + JSON —
climate map, Christmas tree map, turkey map), and **fully hand-entered**
(a single `index.html` — reefer rates, load-to-truck).

## How it publishes

`.github/workflows/build.yml` runs on manual trigger (**Actions → Build Q4 Forecast Charts → Run workflow**). For each chart it:

1. Installs that chart's dependencies,
2. Fetches fresh data and renders the chart HTML,
3. Stages the result into `docs/<chart>/`,

then assembles the landing page (`site/index.html` → `docs/index.html`) and deploys the whole `docs/` tree to GitHub Pages. Refreshed source data is committed back to the repo so each run is diffable.

Per-chart URLs look like `…/Q4-Reefer-Perishable-Forecast-Charts-2026/usda-commodity-heatmap/`.

## One-time setup

- **Settings → Pages → Source: GitHub Actions** (required before the first deploy can publish).
- *(Optional)* Add a `SOCRATA_APP_TOKEN` repo secret to raise the USDA rate limit — not required, the datasets are public.

## Repo layout

```
charts/<chart>/          Each chart: scripts, template, data, requirements
site/index.html          Landing page (linked to each chart)
.github/workflows/build.yml   Orchestrates build + deploy for all charts
docs/                    Generated Pages output (built by CI, git-ignored)
```

## Adding a chart

1. Drop the chart project under `charts/<name>/` (its own scripts/template/requirements).
2. Add its build steps to `.github/workflows/build.yml`, staging output into `docs/<name>/`.
3. Add a card to `site/index.html`.
