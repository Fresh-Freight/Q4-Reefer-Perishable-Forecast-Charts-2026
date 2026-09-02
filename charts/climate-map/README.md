# Q4 2026 NOAA Climate Outlook Map

Single-page visualization of NOAA Climate Prediction Center's three-month
temperature and precipitation outlook for **October–November–December 2026**
(the OND / Lead-2 seasonal outlook), rendered as smooth probability contours
over the U.S. with a Temperature/Precipitation toggle.

This chart is one subfolder of the **Q4-Reefer-Perishable-Forecast-Charts-2026**
monorepo. It's a static site (no build step) — the repo workflow copies it into
`docs/climate-map/`, so it publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/climate-map/`

## Data source

The overlay is driven by `data/outlook-temp.geojson` and
`data/outlook-precip.geojson` — the **OND 2026** contours pulled live from
NOAA's NWS ArcGIS service and simplified for the web:

- Temp: `outlooks/cpc_sea_temp_outlk/MapServer/1` (Lead 2 = OND)
- Precip: `outlooks/cpc_sea_precip_outlk/MapServer/1`
- Issued **2026-08-20**.

Each polygon carries `Cat` (Above / Below / EC) and `Prob` (33 / 40 / 50 — the
lower bound of NOAA's probability band). `app.js:colorFor()` bins those to the
brand color ramp.

### Refreshing the outlook

To move to a later season (or re-pull OND after a newer issuance), query the
same ArcGIS layers, rename `cat`/`prob` → `Cat`/`Prob`, keep only those two
fields, and simplify:

```bash
Q='where=1=1&outFields=cat,prob&returnGeometry=true&outSR=4326&f=geojson'
base='https://mapservices.weather.noaa.gov/vector/rest/services/outlooks'
curl -s "$base/cpc_sea_temp_outlk/MapServer/1/query?$Q"   -o raw_temp.geojson
curl -s "$base/cpc_sea_precip_outlk/MapServer/1/query?$Q" -o raw_precip.geojson
# 1) simplify + rename fields
npx mapshaper raw_temp.geojson   -simplify 12% keep-shapes -each 'Cat=cat, Prob=prob' -filter-fields Cat,Prob -o precision=0.01 base_temp.geojson
npx mapshaper raw_precip.geojson -simplify 12% keep-shapes -each 'Cat=cat, Prob=prob' -filter-fields Cat,Prob -o precision=0.01 base_precip.geojson
# 2) fix winding LAST — see WINDING note below
node scripts/rewind-cw.cjs base_temp.geojson   data/outlook-temp.geojson
node scripts/rewind-cw.cjs base_precip.geojson data/outlook-precip.geojson
```

Pick the layer whose `valid_seas` is the season you want (Lead 1 = nearest
upcoming three months). Then update `data/outlook-meta.json`.

### ⚠️ WINDING — the critical step

`app.js` renders with `d3.geoPath`, whose spherical fill rule needs
**clockwise exterior rings** (and counter-clockwise holes). ArcGIS/mapshaper
output does **not** guarantee this, and getting it wrong is silent-but-fatal:
with the wrong winding d3 fills each polygon's *complement*, or fails to
subtract the "equal chances" holes — so the whole map floods green and the
gray EC zones vanish. `scripts/rewind-cw.cjs` classifies exterior vs. hole
rings by geometry (via `@mapbox/geojson-rewind`) and forces CW exteriors.
Always run it **last**, after any mapshaper step (mapshaper can re-wind on
output). Sanity-check: the south-central US should read gray on the Q4 temp
map, not green.

## File layout

| File | What it is |
| --- | --- |
| `index.html` | Page skeleton — title, toggle, SVG container, attribution |
| `styles.css` | Brand colors, layout, legend, responsive rules |
| `data.js` | Color ramp + legend definitions |
| `app.js` | D3 renderer: Albers USA projection, base map, contour overlay, toggle, legend |
| `data/outlook-*.geojson` | NOAA CPC OND 2026 probability contours |
| `data/outlook-meta.json` | Season label + issue date shown in the header |

## Local preview

No build step; serve over HTTP (D3 fetches state TopoJSON from a CDN):

```bash
npx serve .
```

## Attribution

Source: NOAA Climate Prediction Center (CPC) seasonal outlook.
