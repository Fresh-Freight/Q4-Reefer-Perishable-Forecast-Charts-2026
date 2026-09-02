# Where Christmas Trees Grow — U.S. Production Map

Interactive county choropleth of U.S. Christmas tree production — the number of
trees **cut (grown & sold)** per county — from the **2022 USDA Census of
Agriculture**. Hover any county for its name and tree count. Built as the
"origin" view for Q4 Christmas tree freight (top producers = top shipping lanes).

Part of the **Q4-Reefer-Perishable-Forecast-Charts-2026** monorepo; the repo
workflow copies it into `docs/christmas-tree-map/`, so it publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/christmas-tree-map/`

## Data

- **Source:** USDA NASS **2022 Census of Agriculture** — *Cut Christmas Trees,
  area harvested measured in trees*, at county level.
- **687 counties** report a disclosed count (total **13.8M** trees); another
  ~583 counties are **withheld by USDA for confidentiality** ("(D)") and render
  unshaded. Top states: **OR, NC, MI, WA, PA, VA**.
- **Why 2022 and not "newer":** Christmas trees are only measured in the
  Census, which runs **every 5 years**. 2022 (released 2024) is the current
  authoritative data until the 2027 Census — there is no annual survey to pull.

The county counts live in `data/christmas_trees.json` (baked in — the data is
static between Census years, so there's no build-time fetch). County geometry
comes from the `us-atlas` TopoJSON (loaded from a CDN).

### Refreshing (when the 2027 Census lands)

No API key required — pull the rows from NASS's bulk Census file and rebuild:

```bash
curl -s https://www.nass.usda.gov/datasets/qs.census2027.txt.gz \
  | gunzip | awk 'NR==1 || /CHRISTMAS/' > christmas_rows.tsv
node scripts/build-data.cjs christmas_rows.tsv data/christmas_trees.json
```

(Or query the NASS Quick Stats API with a free key — `commodity_desc=CHRISTMAS
TREES`, `agg_level_desc=COUNTY` — same fields.)

## File layout

| File | What it is |
| --- | --- |
| `index.html` | Page skeleton — header, stat strip, SVG, legend, tooltip |
| `styles.css` | Brand colors, layout, legend, tooltip |
| `app.js` | D3 county choropleth (Albers USA), threshold color scale, hover |
| `data/christmas_trees.json` | County tree counts + metadata (2022 Census) |
| `scripts/build-data.cjs` | Rebuilds the JSON from NASS Census rows |

## Possible next layer

The maps.com inspiration also plotted **National Forests offering Christmas
tree cutting permits**. That data comes from **Recreation.gov's RIDB API**
(free key) or the Forest Service's published list — a red-dot overlay we can
add as a second layer.

## Local preview

```bash
npx serve .
```

## Attribution

Source: USDA National Agricultural Statistics Service, 2022 Census of Agriculture.
