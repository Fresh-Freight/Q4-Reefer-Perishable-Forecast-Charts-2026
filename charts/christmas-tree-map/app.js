// Where Christmas Trees Grow — U.S. spike map of 2022 Christmas tree production
// (USDA Census of Agriculture). Each producing county gets a green spike whose
// height is the number of trees cut — a web recreation of the maps.com "rising
// trees" look. No National Forest permit layer. Static data in
// data/christmas_trees.json; geometry from us-atlas TopoJSON.

const COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const DATA_URL = "data/christmas_trees.json";
const W = 960, H = 600;

const SPIKE_HALF = 2.8;      // half-width of a spike base (px)
const MAX_HEIGHT = 120;      // tallest spike (px), for the biggest county
const MIN_HEIGHT = 2.5;      // floor so tiny producers still show
const LEGEND_VALUES = [25000, 250000, 1000000, 2000000];

// Notable counties to call out with a label (mirrors the maps.com callouts).
const CALLOUTS = [
  { fips: "41005", dx: 0,  anchor: "middle" }, // Clackamas, OR
  { fips: "37009", dx: 6,  anchor: "start" },  // Ashe, NC
  { fips: "26113", dx: 0,  anchor: "middle" }, // Missaukee, MI
  { fips: "55053", dx: -6, anchor: "end" },    // Jackson, WI
  { fips: "37099", dx: 8,  anchor: "start" },  // Jackson, NC
  { fips: "06073", dx: -6, anchor: "end" },    // San Diego, CA
  { fips: "12003", dx: 8,  anchor: "start" },  // Baker, FL
  { fips: "15001", dx: 0,  anchor: "middle" }, // Hawaii, HI
];

const svg = d3.select("#map").attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
const tooltip = document.getElementById("tooltip");
const mapWrap = document.querySelector(".map-wrap");

const fmt = (n) => n.toLocaleString("en-US");
const fips5 = (id) => String(id).padStart(5, "0");
const spikePath = (h) => `M${-SPIKE_HALF},0 L0,${-h} L${SPIKE_HALF},0 Z`;

Promise.all([d3.json(COUNTIES_URL), d3.json(DATA_URL)])
  .then(([us, data]) => {
    const counts = data.counties;
    const names = data.names;

    const counties = topojson.feature(us, us.objects.counties);
    const projection = d3.geoAlbersUsa().fitSize([W, H], topojson.feature(us, us.objects.nation));
    const path = d3.geoPath(projection);
    const hScale = d3.scalePow().exponent(0.5).domain([0, data.metadata.max_county]).range([0, MAX_HEIGHT]);

    // Gradient down each spike: light tip -> dark base (the 3-D "tree" cue).
    const grad = svg.append("defs").append("linearGradient")
      .attr("id", "spikeGrad").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1);
    grad.append("stop").attr("offset", 0).attr("stop-color", "#8ed06a");
    grad.append("stop").attr("offset", 1).attr("stop-color", "#14521a");

    // Pale basemap.
    svg.append("path").attr("class", "land").attr("d", path(topojson.feature(us, us.objects.nation)));
    svg.append("path").attr("class", "state-line").attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    // Spikes, drawn back-to-front (north first) so nearer spikes overlap.
    const producers = counties.features
      .filter((d) => counts[fips5(d.id)] != null)
      .map((d) => ({ d, v: counts[fips5(d.id)], c: path.centroid(d) }))
      .filter((o) => o.c && !isNaN(o.c[0]) && !isNaN(o.c[1]))
      .sort((a, b) => a.c[1] - b.c[1]);

    svg.append("g")
      .selectAll("path.spike")
      .data(producers)
      .join("path")
        .attr("class", "spike")
        .attr("transform", (o) => `translate(${o.c[0]},${o.c[1]})`)
        .attr("d", (o) => spikePath(Math.max(MIN_HEIGHT, hScale(o.v))))
        .attr("fill", "url(#spikeGrad)")
        .attr("fill-opacity", 0.82)
        .attr("stroke", "#0f3d13")
        .attr("stroke-width", 0.3)
        .on("pointerenter", (event, o) => showTip(event, o))
        .on("pointermove", (event, o) => showTip(event, o))
        .on("pointerleave", () => { tooltip.hidden = true; });

    drawCallouts(producers, hScale);
    drawSizeLegend(hScale);

    function showTip(event, o) {
      tooltip.innerHTML =
        `<div class="tt-name">${names[fips5(o.d.id)]}</div>
         <div class="tt-val">${fmt(o.v)}</div>
         <div class="tt-sub">Christmas trees cut · 2022</div>`;
      const r = mapWrap.getBoundingClientRect();
      let x = event.clientX - r.left + 14, y = event.clientY - r.top + 14;
      tooltip.hidden = false;
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      if (x + tw > r.width - 6) x = event.clientX - r.left - tw - 14;
      if (y + th > r.height - 6) y = event.clientY - r.top - th - 14;
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
    }

    function drawCallouts(prods, hs) {
      const byFips = new Map(prods.map((o) => [fips5(o.d.id), o]));
      const g = svg.append("g").attr("class", "callouts");
      for (const co of CALLOUTS) {
        const o = byFips.get(co.fips);
        if (!o) continue;
        const h = Math.max(MIN_HEIGHT, hs(o.v));
        const x = o.c[0] + co.dx, y = o.c[1] - h - 6; // just above the tip
        const t = g.append("text").attr("class", "callout").attr("text-anchor", co.anchor)
          .attr("x", x).attr("y", y);
        t.append("tspan").attr("class", "co-name").attr("x", x).text(names[co.fips]);
        t.append("tspan").attr("class", "co-val").attr("x", x).attr("dy", "1.15em")
          .text(fmt(o.v) + " trees");
      }
    }
  })
  .catch((err) => {
    console.error("Failed to load map:", err);
    svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle")
      .attr("fill", "#888").style("font-family", "Open Sans, sans-serif")
      .text("Map data failed to load — check your connection and refresh.");
  });

// Spike-height size legend.
function drawSizeLegend(hScale) {
  const el = document.getElementById("legend");
  const label = (v) => (v >= 1e6 ? v / 1e6 + "M" : v / 1e3 + "K");
  const maxH = hScale(LEGEND_VALUES[LEGEND_VALUES.length - 1]);
  const gap = 58, padL = 6, baseY = maxH + 4, w = padL + LEGEND_VALUES.length * gap, h = maxH + 24;
  const items = LEGEND_VALUES.map((v, i) => {
    const hh = hScale(v), x = padL + i * gap + 12;
    return `<path transform="translate(${x},${baseY})" d="M-2.4,0 L0,${-hh} L2.4,0 Z" fill="url(#spikeGradLg)" fill-opacity="0.82" stroke="#0f3d13" stroke-width="0.3"/>
            <text x="${x}" y="${baseY + 14}" text-anchor="middle" font-size="10" fill="#5a5a5a" font-family="Open Sans, sans-serif">${label(v)}</text>`;
  }).join("");
  el.innerHTML =
    `<span class="lg-title">Trees cut (2022)</span>` +
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">
       <defs><linearGradient id="spikeGradLg" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#8ed06a"/><stop offset="1" stop-color="#14521a"/>
       </linearGradient></defs>${items}</svg>`;
}
