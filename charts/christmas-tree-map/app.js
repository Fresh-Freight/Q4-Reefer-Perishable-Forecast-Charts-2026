// Where Christmas Trees Grow — U.S. county choropleth of 2022 Christmas tree
// production (USDA Census of Agriculture). Static data baked into
// data/christmas_trees.json; county geometry from the us-atlas TopoJSON.

const COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const DATA_URL = "data/christmas_trees.json";
const W = 960, H = 600;

// Sequential evergreen ramp; thresholds are trees cut in 2022.
const BREAKS = [1000, 10000, 50000, 250000, 1000000];
const GREENS = ["#e8f5e0", "#c2e6a8", "#8fcd68", "#5aa83a", "#357a20", "#1a4d10"];
const color = d3.scaleThreshold().domain(BREAKS).range(GREENS);
const LEGEND = [
  { c: GREENS[0], t: "< 1K" },
  { c: GREENS[1], t: "1K – 10K" },
  { c: GREENS[2], t: "10K – 50K" },
  { c: GREENS[3], t: "50K – 250K" },
  { c: GREENS[4], t: "250K – 1M" },
  { c: GREENS[5], t: "1M +" },
];

const svg = d3.select("#map").attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
const tooltip = document.getElementById("tooltip");
const mapWrap = document.querySelector(".map-wrap");

const fmt = (n) => n.toLocaleString("en-US");
const fips5 = (id) => String(id).padStart(5, "0");

Promise.all([d3.json(COUNTIES_URL), d3.json(DATA_URL)])
  .then(([us, data]) => {
    const counts = data.counties;    // { fips: trees }
    const names = data.names;         // { fips: "County, ST" }

    renderStats(data.metadata);

    const counties = topojson.feature(us, us.objects.counties);
    const projection = d3.geoAlbersUsa().fitSize([W, H], topojson.feature(us, us.objects.nation));
    const path = d3.geoPath(projection);

    // Counties
    svg.append("g")
      .selectAll("path.county")
      .data(counties.features)
      .join("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", (d) => {
          const v = counts[fips5(d.id)];
          return v == null ? "var(--no-data)" : color(v);
        })
        .on("pointerenter", (event, d) => showTip(event, d))
        .on("pointermove", (event, d) => showTip(event, d))
        .on("pointerleave", () => { tooltip.hidden = true; });

    // State borders + nation outline for reference
    svg.append("path").attr("class", "state-line")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
    svg.append("path").attr("class", "nation-line")
      .attr("d", path(topojson.feature(us, us.objects.nation)));

    drawLegend();

    function showTip(event, d) {
      const fips = fips5(d.id);
      const v = counts[fips];
      const name = names[fips];
      if (v != null) {
        tooltip.innerHTML =
          `<div class="tt-name">${name}</div>
           <div class="tt-val">${fmt(v)}</div>
           <div class="tt-sub">Christmas trees cut · 2022</div>`;
      } else {
        tooltip.innerHTML =
          `<div class="tt-name">${name || "This county"}</div>
           <div class="tt-sub">No disclosed Christmas-tree production</div>`;
      }
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

function drawLegend() {
  const el = document.getElementById("legend");
  el.innerHTML =
    `<span class="lg-title">Trees cut</span>` +
    LEGEND.map((l) => `<span class="lg-item"><span class="sw" style="background:${l.c}"></span>${l.t}</span>`).join("") +
    `<span class="lg-item"><span class="sw" style="background:var(--no-data)"></span>No data / withheld</span>`;
}
