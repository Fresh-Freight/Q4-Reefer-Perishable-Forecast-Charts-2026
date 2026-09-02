#!/usr/bin/env node
/*
 * build-data.cjs — turn USDA NASS Census rows into the map's county dataset.
 *
 * Usage:  node scripts/build-data.cjs <christmas_rows.tsv> <out.json>
 *
 * Get the input rows (no API key needed) from the NASS bulk Census file:
 *   curl -s https://www.nass.usda.gov/datasets/qs.census2022.txt.gz \
 *     | gunzip | awk 'NR==1 || /CHRISTMAS/' > christmas_rows.tsv
 *
 * (Or query the NASS Quick Stats API with a free key — same fields.)
 *
 * We keep COUNTY-level "CUT CHRISTMAS TREES - AREA HARVESTED, MEASURED IN
 * TREES" — the number of trees cut (grown & sold). Values like "(D)" are
 * USDA confidentiality withholds and are skipped (those counties render
 * unshaded).
 */
const fs = require("fs");

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node scripts/build-data.cjs <rows.tsv> <out.json>");
  process.exit(1);
}

const METRIC = "CUT CHRISTMAS TREES - AREA HARVESTED, MEASURED IN TREES";
const lines = fs.readFileSync(inPath, "utf8").split("\n").filter(Boolean);
const H = lines[0].split("\t");
const ix = (n) => H.indexOf(n);

const counties = {};
const names = {};
let total = 0, max = 0;
const byState = {};

for (const line of lines.slice(1)) {
  const r = line.split("\t");
  if (r[ix("AGG_LEVEL_DESC")] !== "COUNTY" || r[ix("SHORT_DESC")] !== METRIC) continue;
  const raw = (r[ix("VALUE")] || "").trim();
  if (!/^[\d,]+$/.test(raw)) continue; // skip (D)/(Z)/blank
  const fips = (r[ix("STATE_FIPS_CODE")] || "").padStart(2, "0") + (r[ix("COUNTY_CODE")] || "").padStart(3, "0");
  const v = +raw.replace(/,/g, "");
  const st = r[ix("STATE_ALPHA")];
  counties[fips] = v;
  names[fips] = `${r[ix("COUNTY_NAME")]}, ${st}`;
  total += v; if (v > max) max = v;
  byState[st] = (byState[st] || 0) + v;
}

const top_states = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, v]) => ({ s, v }));
const out = {
  metadata: {
    source: "USDA NASS 2022 Census of Agriculture — Cut Christmas Trees, area harvested measured in trees",
    year: 2022,
    metric: "Christmas trees cut (grown & sold), 2022",
    counties_reporting: Object.keys(counties).length,
    total_trees: total,
    max_county: max,
    top_states,
    note: "Counties with too few operations are withheld by USDA for confidentiality and show no value.",
  },
  counties,
  names,
};
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`wrote ${outPath}: ${Object.keys(counties).length} counties, ${total.toLocaleString()} trees`);
