#!/usr/bin/env node
/*
 * build-data.cjs — turn the USDA NASS "Turkeys Raised" state table into the
 * map's dataset.
 *
 * Usage:  node scripts/build-data.cjs data/turkeys_raised_by_state.csv data/turkeys.json
 *
 * Input is the state table transcribed from the annual NASS Turkeys Raised
 * release (Cornell Mann Library, e.g. tuky0925.pdf). Columns:
 *
 *   state,postal,fips,turkeys_raised_<year>_thousand_head
 *
 * Two rows are aggregates rather than places and are handled separately:
 * "Other States" (every state NASS does not break out individually) and
 * "United States" (the national total). Neither gets a FIPS, so neither can be
 * mapped — they are carried in metadata and shown in the table instead, so the
 * map never silently drops a third of U.S. production.
 *
 * Values are THOUSAND HEAD, as published. The page converts to millions for
 * display; the raw published unit is what gets stored.
 */
const fs = require("fs");

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node scripts/build-data.cjs <in.csv> <out.json>");
  process.exit(1);
}

const lines = fs.readFileSync(inPath, "utf8").split("\n").filter((l) => l.trim());
const H = lines[0].split(",");
const ix = (n) => H.indexOf(n);

// The value column carries its year in the name (…_2025_thousand_head), so the
// year is read from the header rather than hard-coded here.
const valueCol = H.find((h) => /^turkeys_raised_\d{4}_thousand_head$/.test(h));
if (!valueCol) {
  console.error(`no turkeys_raised_<year>_thousand_head column in ${inPath}; got: ${H.join(", ")}`);
  process.exit(1);
}
const year = +valueCol.match(/(\d{4})/)[1];
const vi = H.indexOf(valueCol);

const states = {};
const names = {};
const postal = {};
let usTotal = null, otherStates = null, mapped = 0, max = 0;

for (const line of lines.slice(1)) {
  const r = line.split(",");
  const label = (r[ix("state")] || "").trim();
  const raw = (r[vi] || "").trim();
  if (!/^\d+$/.test(raw)) continue;
  const v = +raw;

  if (label === "United States") { usTotal = v; continue; }
  if (label === "Other States") { otherStates = v; continue; }

  const fips = (r[ix("fips")] || "").trim().padStart(2, "0");
  if (fips === "00") {
    console.error(`row "${label}" has no FIPS and is not a known aggregate — skipped`);
    continue;
  }
  states[fips] = v;
  names[fips] = label;
  postal[fips] = (r[ix("postal")] || "").trim();
  mapped += v;
  if (v > max) max = v;
}

if (usTotal == null) {
  console.error("no United States row found — the share-of-total figures would be wrong");
  process.exit(1);
}

// The published total must equal the mapped states plus Other States. If it
// doesn't, the transcription lost or duplicated a row and every share on the
// page would be quietly wrong, so fail rather than ship it.
const sum = mapped + (otherStates || 0);
if (sum !== usTotal) {
  console.error(
    `rows sum to ${sum.toLocaleString()} thousand head but the United States row ` +
    `says ${usTotal.toLocaleString()}. Check the transcription against the release.`
  );
  process.exit(1);
}

const out = {
  metadata: {
    source: `USDA NASS — Turkeys Raised, ${year}`,
    year,
    unit: "thousand head",
    metric: `Turkeys raised, ${year}`,
    states_reported: Object.keys(states).length,
    us_total: usTotal,
    other_states: otherStates,
    mapped_total: mapped,
    max_state: max,
    note:
      "NASS breaks out only the leading turkey states. Every remaining state is " +
      "pooled into 'Other States', which has no single location and is therefore " +
      "not drawn on the map.",
  },
  states,
  names,
  postal,
};
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(
  `wrote ${outPath}: ${Object.keys(states).length} states, ` +
  `${mapped.toLocaleString()} of ${usTotal.toLocaleString()} thousand head mapped ` +
  `(${((mapped / usTotal) * 100).toFixed(1)}%)`
);
