# Q4 Reefer Volume Heat Map — USDA AMS

Automated US heat map of Q4 (October–December) refrigerated truck fruit & vegetable volumes by USDA shipping region. Data is pulled live from the USDA AMS Specialty Crops Movement Reports (Socrata dataset `rfpn-7etz`). The dashboard publishes to GitHub Pages — perfect for embedding in your Q4 customer report.

This chart is one subfolder of the **Q4-Reefer-Perishable-Forecast-Charts-2026** monorepo. The repo-level workflow builds every chart into `docs/<chart>/`, so this one publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/usda-commodity-heatmap/`

---

## What it does

1. Pulls every Q4 (Oct/Nov/Dec) row from the **AMS Refrigerated Truck Volumes** dataset for the last 4 complete calendar years.
2. Aggregates by **commodity × USDA shipping region** (Arizona, California, Colorado, Florida, Great Lakes, Mid-Atlantic, New York, PNW, Southeast, Texas, plus Mexico-AZ / -CA / -NM / -TX crossings).
3. Renders a **choropleth US map** (Census Bureau state boundaries via TopoJSON, Albers projection) with a light-cream → dark-burnt-orange ramp.
4. **Two filters:** commodity (top featured + "All Commodities" rollup) and Q4 month (Full Q4 / Oct / Nov / Dec). Map recolors on each change.
5. **Hover** any state for `{state} · {region} · {volume}`. Hover Mexico boxes for cross-border volumes.

The dashboard auto-detects the dataset's column names on first request, so it stays working if AMS renames a field.

---

## Chart layout

```
charts/usda-commodity-heatmap/
  scripts/fetch_data.py         AMS Socrata API client; writes data/q4_volumes.json
  scripts/build_dashboard.py    Jinja2 render → docs/index.html (copied to /docs/usda-commodity-heatmap/ by CI)
  templates/template.html.j2    Map + controls (D3 + TopoJSON, no other UI)
  data/q4_volumes.json          Latest cached fetch (auto-committed by CI)
  requirements.txt              requests + jinja2
```

The build/deploy workflow lives at the repo root (`.github/workflows/build.yml`) and orchestrates all charts.

---

## Local development

```bash
pip install -r requirements.txt
python scripts/fetch_data.py      # pulls fresh data → data/q4_volumes.json
python scripts/build_dashboard.py # renders docs/index.html
# Open docs/index.html
```

---

## Customization

- **Change region → state mapping:** edit `STATE_TO_REGION` near the top of the `<script>` in `templates/template.html.j2`.
- **Restyle:** all colors are CSS variables at the top of the template (`--heat-0` … `--heat-7`).
- **Top-N commodities:** the script keeps the top 100 by volume; change the `[:100]` slice in `fetch_data.py`.
- **Different time window:** change `N_YEARS` or `Q4_MONTHS` in `fetch_data.py`.

---

## Data source

- **Dataset:** USDA AMS Specialty Crops Program — Refrigerated Truck Volumes
- **URL:** https://agtransport.usda.gov/Truck/Refrigerated-Truck-Volumes/rfpn-7etz
- **Owner:** USDA AMS Transportation Services Division
- **Updated:** weekly
- **API:** Socrata SODA v2 — `https://agtransport.usda.gov/resource/rfpn-7etz.json`
- **Units:** AMS publishes volumes in 10,000-lb units; the script scales to pounds and displays millions of pounds.
