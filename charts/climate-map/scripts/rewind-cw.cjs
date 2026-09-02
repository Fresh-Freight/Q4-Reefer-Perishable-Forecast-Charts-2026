#!/usr/bin/env node
/*
 * rewind-cw.cjs — normalize NOAA outlook GeoJSON winding for d3.geoPath.
 *
 * Usage:  node scripts/rewind-cw.cjs <in.geojson> <out.geojson>
 * Needs:  npm i @mapbox/geojson-rewind   (dev-only; not needed to serve the site)
 *
 * Why: app.js draws the contour polygons with d3.geoPath, whose spherical fill
 * rule needs CLOCKWISE exterior rings (and CCW holes). ArcGIS/mapshaper output
 * does not guarantee that. With the wrong winding d3 fills each polygon's
 * complement or fails to subtract the "equal chances" holes, so the map floods
 * green and the gray EC zones disappear.
 *
 * geojson-rewind classifies exterior vs hole rings by geometry (not ring order),
 * producing correct RFC 7946 (CCW-exterior) output; we then reverse every ring
 * to get the CW exteriors d3 wants here. Run this LAST — after any mapshaper
 * step, since mapshaper can re-wind on output.
 */
const fs = require("fs");
const rewind = require("@mapbox/geojson-rewind");

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node rewind-cw.cjs <in.geojson> <out.geojson>");
  process.exit(1);
}

const geo = rewind(JSON.parse(fs.readFileSync(inPath, "utf8")), false); // RFC7946 / CCW
const reverseRings = (poly) => poly.map((ring) => ring.slice().reverse());
for (const f of geo.features) {
  const g = f.geometry;
  if (g.type === "Polygon") g.coordinates = reverseRings(g.coordinates);
  else if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map(reverseRings);
}

fs.writeFileSync(outPath, JSON.stringify(geo));
console.log(`wrote ${outPath} (CW exteriors) — ${geo.features.length} features`);
