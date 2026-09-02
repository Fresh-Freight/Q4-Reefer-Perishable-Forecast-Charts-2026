// Where Christmas Trees Grow — U.S. proportional-symbol map of 2022 Christmas
// tree production (USDA Census of Agriculture). Each producing county is a
// circle sized by trees cut, over a plain state basemap — cleaner than a
// choropleth where counties are small and densely packed (Northeast, Michigan).
// Static data in data/christmas_trees.json; geometry from us-atlas TopoJSON.

const COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const DATA_URL = "data/christmas_trees.json";
const W = 960, H = 600;

const CIRCLE_FILL = "#2f7a1f";
const CIRCLE_STROKE = "#173d0c";
const MAX_R = 30;            // radius (px) for the largest county
const MIN_R = 1.1;           // floor so tiny producers still show as a speck
const LEGEND_VALUES = [50000, 250000, 1000000, 2000000];

const svg = d3.select("#map").attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
const tooltip = document.getElementById("tooltip");
const mapWrap = document.querySelector(".map-wrap");

const fmt = (n) => n.toLocaleString("en-US");
const fips5 = (id) => String(id).padStart(5, "0");

Promise.all([d3.json(COUNTIES_URL), d3.json(DATA_URL)])
  .then(([us, data]) => {
    const counts = data.counties;
    const names = data.names;

    renderStats(data.metadata);

    const counties = topojson.feature(us, us.objects.counties);
    const projection = d3.geoAlbersUsa().fitSize([W, H], topojson.feature(us, us.objects.nation));
    const path = d3.geoPath(projection);
    const rScale = d3.scaleSqrt().domain([0, data.metadata.max_county]).range([0, MAX_R]);

    // Plain basemap: gray landmass + state outlines (no county clutter).
    svg.append("path").attr("class", "land")
      .attr("d", path(topojson.feature(us, us.objects.nation)));
    svg.append("path").attr("class", "state-line")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    // One circle per producing county, at its centroid, sized by trees cut.
    // Draw largest first so small dots sit on top and stay visible.
    const producers = counties.features
      .filter((d) => counts[fips5(d.id)] != null)
      .map((d) => ({ d, v: counts[fips5(d.id)], c: path.centroid(d) }))
      .filter((o) => o.c && !isNaN(o.c[0]) && !isNaN(o.c[1]))
      .sort((a, b) => b.v - a.v);

    svg.append("g")
      .selectAll("circle")
      .data(producers)
      .join("circle")
        .attr("class", "bubble")
        .attr("cx", (o) => o.c[0])
        .attr("cy", (o) => o.c[1])
        .attr("r", (o) => Math.max(MIN_R, rScale(o.v)))
        .attr("fill", CIRCLE_FILL)
        .attr("fill-opacity", 0.6)
        .attr("stroke", CIRCLE_STROKE)
        .attr("stroke-width", 0.4)
        .on("pointerenter", (event, o) => showTip(event, o))
        .on("pointermove", (event, o) => showTip(event, o))
        .on("pointerleave", () => { tooltip.hidden = true; });

    drawSizeLegend(rScale);

    function showTip(event, o) {
      tooltip.innerHTML =
        `<div class="tt-name">${names[fips5(o.d.id)]}</div>
         <div class="tt-val">${fmt(o.v)}</div>
         <div class="tt-sub">Christmas trees cut · 2022</div>`;
      const r = mapWrap.getBoundingClientRect();
      let x = event.clientX - r.left + 14;
      let y = event.clientY - r.top + 14;
      tooltip.hidden = false;
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      if (x + tw > r.width - 6) x = event.clientX - r.left - tw - 14;
      if (y + th > r.height - 6) y = event.clientY - r.top - th - 14;
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
    }
  })
  .catch((err) => {
    console.error("Failed to load map:", err);
    svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle")
      .attr("fill", "#888").style("font-family", "Open Sans, sans-serif")
      .text("Map data failed to load — check your connection and refresh.");
  });

function renderStats(m) {
  const el = document.getElementById("stats");
  const top = m.top_states && m.top_states[0];
  const items = [
    { num: (m.total_trees / 1e6).toFixed(1) + "M", lbl: "Trees cut (disclosed, 2022)" },
    { num: fmt(m.counties_reporting), lbl: "Counties reporting" },
    { num: top ? top.s : "—", lbl: "Top state" },
  ];
  el.innerHTML = items.map((i) => `<div class="stat"><div class="num">${i.num}</div><div class="lbl">${i.lbl}</div></div>`).join("");
}

// Nested-circle size legend (circle area ∝ trees cut).
function drawSizeLegend(rScale) {
  const el = document.getElementById("legend");
  const label = (v) => (v >= 1e6 ? v / 1e6 + "M" : v / 1e3 + "K");
  const maxR = rScale(LEGEND_VALUES[LEGEND_VALUES.length - 1]);
  const w = maxR * 2 + 60, h = maxR * 2 + 10;
  const cx = maxR + 1, baseY = h - 1;
  const rings = LEGEND_VALUES.map((v) => {
    const r = rScale(v);
    return `<circle cx="${cx}" cy="${baseY - r}" r="${r}" fill="none" stroke="#9aa0a6" stroke-width="0.8"/>
            <line x1="${cx}" y1="${baseY - 2 * r}" x2="${cx + maxR + 6}" y2="${baseY - 2 * r}" stroke="#c7ccd1" stroke-width="0.6"/>
            <text x="${cx + maxR + 9}" y="${baseY - 2 * r + 3}" font-size="10" fill="#5a5a5a" font-family="Open Sans, sans-serif">${label(v)}</text>`;
  }).join("");
  el.innerHTML =
    `<span class="lg-title">Trees cut (2022)</span>` +
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">${rings}</svg>`;
}
