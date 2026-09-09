// Where Turkeys Are Raised — U.S. state map of turkey production (USDA NASS,
// Turkeys Raised). Each producing state gets a turkey glyph scaled to the birds
// raised there. Static data in data/turkeys.json; geometry from us-atlas
// TopoJSON.

const STATES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const DATA_URL = "data/turkeys.json";
const W = 960, H = 600;
const TOP_PAD = 46;          // headroom so the tallest turkey doesn't clip

// Glyph size encodes production. Area is what the eye reads, so the LINEAR
// scale factor goes as sqrt(value) — doubling the birds doubles the ink, not
// the height. Anchored at zero so the comparison stays honest.
const MAX_SCALE = 1.925;     // scale factor for the largest state
const MIN_SCALE = 0.495;     // floor so a small state never disappears

// A turkey is ~35 units wide and ~31 tall in glyph-local units: the fan spans
// FAN.r1 either side of its centre, and the beak sets the right edge.
const GLYPH_W = 35, GLYPH_H = 31;
const HIT_MIN = 26;          // minimum hover target (px) — bigger than the mark
// Desktop hover lift. The hit target is sized against the GROWN bird, so the
// pointer can reach the enlarged edges without falling out and flickering.
const HOVER_GROW = 1.14;

const LEGEND_VALUES = [5000, 15000, 32000];   // thousand head

const svg = d3.select("#map")
  .attr("viewBox", `0 ${-TOP_PAD} ${W} ${H + TOP_PAD}`)
  .attr("preserveAspectRatio", "xMidYMid meet");
const tooltip = document.getElementById("tooltip");
const mapWrap = document.querySelector(".map-wrap");

const rad = (deg) => (deg * Math.PI) / 180;
// Values are thousand head; the page talks in millions of birds.
const millions = (v) => (v / 1000).toFixed(1) + "M";
const birds = (v) => (v * 1000).toLocaleString("en-US");
const fips2 = (id) => String(id).padStart(2, "0");

// ── The turkey ─────────────────────────────────────────────────────────────
// Drawn in local units with the feet at y=0, so the glyph stands on the state
// centroid the way the Christmas-tree spikes stand on county centroids. The
// group is uniformly scaled, so every stroke scales with it.
const FAN = { cx: -1.5, cy: -14.5, r0: 6, r1: 16.5, a0: -108, a1: 74, n: 11 };
const TIP_BAND = 3.4;        // pale band across the feather tips
const PLUME_MID = "#c2600d", PLUME_DARK = "#8c3f00", PLUME_TIP = "#f0c98a";
const BODY = "#5f2f0e", WING = "#8a4718", WING_EDGE = "#a8632c";
const WATTLE = "#b8332a", BEAK = "#f0a028", LEG = "#e08a2a";
// White ring on every shape: separates the feathers from each other and, where
// neighbouring states overlap, one bird from the next.
const RING = { stroke: "#fff", "stroke-width": 0.5 };

function attrs(sel, o) { for (const k in o) sel.attr(k, o[k]); return sel; }

function drawTurkey(g) {
  // Ground shadow — lifts the bird off the pale land fill so the silhouette
  // still reads where a glyph sits over a state boundary.
  g.append("ellipse").attr("cx", 3).attr("cy", -0.6).attr("rx", 7).attr("ry", 1.5)
    .attr("fill", "#243027").attr("fill-opacity", 0.16);

  // Tail fan, drawn first so the body sits in front of it. Each feather is a
  // dark wedge finished with a pale tip band — the banding is what makes a
  // spread tail read as a turkey rather than a generic fan.
  const fan = g.append("g").attr("transform", `translate(${FAN.cx},${FAN.cy})`);
  const quill = d3.arc().innerRadius(FAN.r0).outerRadius(FAN.r1).cornerRadius(2.4).padAngle(0.032);
  const tip = d3.arc().innerRadius(FAN.r1 - TIP_BAND).outerRadius(FAN.r1).cornerRadius(2.4).padAngle(0.032);
  const step = (FAN.a1 - FAN.a0) / FAN.n;
  for (let i = 0; i < FAN.n; i++) {
    const a = { startAngle: rad(FAN.a0 + i * step), endAngle: rad(FAN.a0 + (i + 1) * step) };
    attrs(fan.append("path").attr("d", quill(a))
      .attr("fill", i % 2 ? PLUME_DARK : PLUME_MID), RING);
    fan.append("path").attr("d", tip(a)).attr("fill", PLUME_TIP);
  }

  // Legs, behind the body so the body covers where they join. Three toes each —
  // sub-pixel on the smallest states, but it reads at legend size.
  for (const [x0, x1] of [[1.2, 0.4], [5, 6.4]]) {
    g.append("path").attr("d", `M${x0},-5 L${x1},-0.6`).attr("stroke", LEG)
      .attr("stroke-width", 1.4).attr("stroke-linecap", "round").attr("fill", "none");
    g.append("path")
      .attr("d", `M${x1 - 1.5},0.4 L${x1},-0.6 L${x1 + 1.5},0.4 M${x1},-0.6 L${x1},0.6`)
      .attr("stroke", LEG).attr("stroke-width", 0.9).attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round").attr("fill", "none");
  }

  // Body: an egg tilted forward, heavier at the breast than a plain ellipse.
  attrs(g.append("path").attr("d",
    "M10.6,-13.6 C11.4,-8.8 8.2,-4 3.6,-4 C-0.9,-4 -3.8,-7.8 -3.3,-12 " +
    "C-2.8,-16.2 1.2,-19 5.2,-18.5 C8.4,-18.1 10.3,-16.2 10.6,-13.6 Z")
    .attr("fill", BODY), RING);

  // Wing, with two feather separations rather than a flat blob.
  g.append("path").attr("d",
    "M-1.6,-12.8 C1.6,-15.4 6.2,-14.6 7.6,-11.4 C6.2,-8.4 1.4,-7.6 -1.4,-9.8 Z")
    .attr("fill", WING);
  g.append("path").attr("d", "M0.2,-13.2 C2.6,-12.4 4.8,-11.4 6.4,-9.8 M-0.8,-11 C1.4,-10.4 3.4,-9.6 4.8,-8.4")
    .attr("stroke", WING_EDGE).attr("stroke-width", 0.55).attr("fill", "none")
    .attr("stroke-linecap", "round");

  // Neck curving up out of the breast, head in front of it.
  g.append("path").attr("d", "M8.4,-16 C10.8,-18.8 10.1,-21.6 9.9,-23.6")
    .attr("stroke", BODY).attr("stroke-width", 3.4).attr("stroke-linecap", "round")
    .attr("fill", "none");
  attrs(g.append("circle").attr("cx", 10.2).attr("cy", -25.6).attr("r", 3.1)
    .attr("fill", BODY), RING);

  g.append("ellipse").attr("cx", 11.5).attr("cy", -21.9).attr("rx", 1.5).attr("ry", 2.1)
    .attr("fill", WATTLE);                                    // wattle
  g.append("path").attr("d", "M12.9,-25.7 L16.6,-24.7 L12.9,-23.7 Z").attr("fill", BEAK);
  g.append("path").attr("d", "M12.7,-26.7 C13.9,-26.3 14.3,-24.9 14,-23.5")
    .attr("stroke", WATTLE).attr("stroke-width", 1.3).attr("stroke-linecap", "round")
    .attr("fill", "none");                                    // snood
  g.append("circle").attr("cx", 10.9).attr("cy", -26.4).attr("r", 0.78).attr("fill", "#241206");
  g.append("circle").attr("cx", 11.15).attr("cy", -26.6).attr("r", 0.26).attr("fill", "#fff");
}

Promise.all([d3.json(STATES_URL), d3.json(DATA_URL)])
  .then(([us, data]) => {
    const values = data.states;
    const names = data.names;
    const meta = data.metadata;

    const states = topojson.feature(us, us.objects.states);
    const projection = d3.geoAlbersUsa().fitSize([W, H], topojson.feature(us, us.objects.nation));
    const path = d3.geoPath(projection);
    const sizeScale = d3.scaleSqrt().domain([0, meta.max_state]).range([0, MAX_SCALE]);
    const scaleFor = (v) => Math.max(MIN_SCALE, sizeScale(v));

    svg.append("path").attr("class", "land").attr("d", path(topojson.feature(us, us.objects.nation)));
    svg.append("path").attr("class", "state-line")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    // Producers, north first, so a southern bird overlaps its northern neighbour
    // rather than being hidden behind it.
    const producers = states.features
      .filter((d) => values[fips2(d.id)] != null)
      .map((d) => ({ id: fips2(d.id), v: values[fips2(d.id)], c: path.centroid(d) }))
      .filter((o) => o.c && !isNaN(o.c[0]) && !isNaN(o.c[1]))
      .sort((a, b) => a.c[1] - b.c[1]);

    if (producers.length !== Object.keys(values).length) {
      console.error(
        `Turkey map: ${Object.keys(values).length} states in the data but only ` +
        `${producers.length} placed on the map. A FIPS code probably has no match ` +
        `in the us-atlas topology.`
      );
    }

    // Draw order is north-first (above), but the entrance sweeps west to east,
    // so each bird also carries its longitude rank as --i.
    producers.slice().sort((a, b) => a.c[0] - b.c[0]).forEach((o, i) => { o.lonRank = i; });

    const flock = svg.append("g").attr("class", "flock").style("--grow", HOVER_GROW);
    producers.forEach((o) => {
      const s = scaleFor(o.v);
      const g = flock.append("g")
        .attr("class", "turkey")
        // The attribute is the base rendering. The same values are mirrored into
        // custom properties so the stylesheet can restate the transform with a
        // grown scale on hover — and skip it entirely on touch/narrow screens.
        .attr("transform", `translate(${o.c[0]},${o.c[1]}) scale(${s})`)
        .style("--x", o.c[0] + "px")
        .style("--y", o.c[1] + "px")
        .style("--s", s)
        .style("--i", o.lonRank);
      drawTurkey(g);
      o.g = g.node();
    });

    // Invisible hover targets on top, sized to the glyph but never smaller than
    // HIT_MIN, so the small states are still easy to hit.
    svg.append("g")
      .selectAll("rect.hit")
      .data(producers)
      .join("rect")
        .attr("class", "hit")
        .attr("x", (o) => o.c[0] - Math.max(HIT_MIN, GLYPH_W * scaleFor(o.v) * HOVER_GROW) / 2)
        .attr("y", (o) => o.c[1] - Math.max(HIT_MIN, GLYPH_H * scaleFor(o.v) * HOVER_GROW))
        .attr("width", (o) => Math.max(HIT_MIN, GLYPH_W * scaleFor(o.v) * HOVER_GROW))
        .attr("height", (o) => Math.max(HIT_MIN, GLYPH_H * scaleFor(o.v) * HOVER_GROW) + 4)
        .attr("fill", "transparent")
        .attr("tabindex", 0)
        .attr("role", "img")
        .attr("aria-label", (o) => `${names[o.id]}: ${birds(o.v)} turkeys raised in ${meta.year}`)
        .style("cursor", "pointer")
        .on("pointerenter", (event, o) => { lift(o, true); showTip(event, o); })
        .on("pointermove", (event, o) => showTip(event, o))
        .on("pointerleave", (event, o) => { lift(o, false); tooltip.hidden = true; })
        .on("focus", function (event, o) { lift(o, true); showTipAt(this, o); })
        .on("blur", (event, o) => { lift(o, false); tooltip.hidden = true; });

    drawSizeLegend(sizeScale);
    document.getElementById("us-total").textContent = millions(meta.us_total);
    buildBars(producers, names, meta);
    wireViewToggle(flock.node());

    // Grow the hovered bird and bring it in front of its neighbours. The size
    // change itself lives in the stylesheet, so it is inert on touch devices.
    // Raise first, then grow. Moving a node resets its CSS animations and
    // transitions, so re-parenting after adding the class would cancel the
    // transition and make the bird snap to full size. The rect read flushes
    // style for the moved node, so the transition starts from where it is.
    // The raise is skipped entirely while the entrance is playing: restarting
    // that animation would drop the bird back to scale 0 for its stagger delay.
    function lift(o, on) {
      if (on && !flock.node().classList.contains("is-entering")) {
        o.g.parentNode.appendChild(o.g);
        o.g.getBoundingClientRect();
      }
      o.g.classList.toggle("is-hover", on);
    }

    function tipHTML(o) {
      const share = ((o.v / meta.us_total) * 100).toFixed(1);
      return `<div class="tt-name">${names[o.id]}</div>
              <div class="tt-val">${millions(o.v)}</div>
              <div class="tt-sub">turkeys raised · ${meta.year}<br>${share}% of U.S. production</div>`;
    }

    function place(x, y) {
      const r = mapWrap.getBoundingClientRect();
      tooltip.hidden = false;
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      if (x + tw > r.width - 6) x = x - tw - 28;
      if (y + th > r.height - 6) y = y - th - 28;
      tooltip.style.left = Math.max(4, x) + "px";
      tooltip.style.top = Math.max(4, y) + "px";
    }

    function showTip(event, o) {
      tooltip.innerHTML = tipHTML(o);
      const r = mapWrap.getBoundingClientRect();
      place(event.clientX - r.left + 14, event.clientY - r.top + 14);
    }

    // Keyboard focus shows the same card as hover, anchored to the mark itself.
    function showTipAt(node, o) {
      tooltip.innerHTML = tipHTML(o);
      const r = mapWrap.getBoundingClientRect(), b = node.getBoundingClientRect();
      place(b.left - r.left + b.width + 8, b.top - r.top);
    }
  })
  .catch((err) => {
    console.error("Failed to load map:", err);
    svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle")
      .attr("fill", "#888").style("font-family", "Open Sans, sans-serif")
      .text("Map data failed to load — check your connection and refresh.");
  });

// Size legend: the same glyph at three reference volumes.
function drawSizeLegend(sizeScale) {
  const el = document.getElementById("legend");
  const pad = 10, gap = 26, baseY = GLYPH_H * MAX_SCALE + 6;
  let x = pad, items = [];
  for (const v of LEGEND_VALUES) {
    const s = Math.max(MIN_SCALE, sizeScale(v));
    const w = GLYPH_W * s;
    items.push({ v, s, x: x + w / 2 });
    x += w + gap;
  }
  const svgEl = d3.select(el).append("svg")
    .attr("width", x).attr("height", baseY + 20)
    .attr("viewBox", `0 0 ${x} ${baseY + 20}`);
  for (const it of items) {
    drawTurkey(svgEl.append("g").attr("transform", `translate(${it.x},${baseY}) scale(${it.s})`));
    svgEl.append("text").attr("x", it.x).attr("y", baseY + 15).attr("text-anchor", "middle")
      .attr("font-size", 10.5).attr("fill", "#5a5a5a")
      .attr("font-family", "Open Sans, sans-serif")
      .text(millions(it.v));
  }
}

// Ranked bar view, shown in the map's place. Every value is labelled on its own
// row, so nothing here depends on hovering. This is also the only view that can
// show "Other States": it is a pool of states with no single location, so the
// map has to leave it out, and at 22.3M birds that is too big to drop silently.
function buildBars(producers, names, meta) {
  const rows = producers
    .map((o) => ({ name: names[o.id], v: o.v, agg: false }))
    .concat([{ name: "Other States", v: meta.other_states, agg: true }])
    .sort((a, b) => b.v - a.v);

  const max = rows[0].v;
  const pct = (v) => ((v / meta.us_total) * 100).toFixed(1) + "%";

  // --i is the row's index, used only to stagger the entrance animation.
  document.getElementById("bar-list").innerHTML = rows.map((r, i) => {
    const label = r.agg ? `${r.name} <span class="note">— pooled</span>` : r.name;
    return `<li class="bar-row${r.agg ? " agg" : ""}" style="--i:${i}">
      <span class="bar-name">${label}</span>
      <span><span class="bar-fill" style="width:${(r.v / max) * 100}%"></span></span>
      <span class="bar-val">${millions(r.v)}</span>
      <span class="bar-share">${pct(r.v)}</span>
    </li>`;
  }).join("");

  document.getElementById("bars-note").textContent =
    `United States total: ${millions(meta.us_total)} birds raised in ${meta.year}. ` +
    `NASS breaks out ${meta.states_reported} states individually; every other state is ` +
    `pooled into "Other States", which cannot be placed on the map.`;
}

// Drop and re-add the entrance class, with a forced reflow between, so the
// animation replays on every switch rather than only the first. Uses
// getBoundingClientRect rather than offsetWidth, which SVG elements do not have.
// The class must not outlive the animation. Moving an element in the DOM
// restarts its CSS animations, and the hover raise re-parents the bird — so a
// lingering is-entering would snap the hovered bird back to scale 0 and hold it
// there through its stagger delay.
function replay(el) {
  el.classList.remove("is-entering");
  el.getBoundingClientRect();
  el.classList.add("is-entering");

  const running = el.getAnimations({ subtree: true });
  if (!running.length) { el.classList.remove("is-entering"); return; }
  Promise.all(running.map((a) => a.finished))
    .then(() => el.classList.remove("is-entering"))
    // A later replay cancels these, rejecting the promise. That call owns the
    // class from then on, so there is nothing to clean up here.
    .catch(() => {});
}

// Map ⇄ chart, sharing one slot on the page.
function wireViewToggle(flockEl) {
  const btn = document.getElementById("view-btn");
  const mapEl = document.getElementById("map");
  const legendEl = document.getElementById("legend");
  const barsEl = document.getElementById("bars");
  const hint = document.getElementById("view-hint");
  const HINTS = {
    map: "Turkey size = birds raised, 2025 · hover or tab to a bird for state detail",
    // Kept short so the button stays on the same line as the hint in both views.
    bars: "Bar length = birds raised, 2025 · ranked",
  };
  let chart = false;

  btn.addEventListener("click", () => {
    chart = !chart;
    // The SVG map is hidden with a class rather than the hidden attribute, which
    // browsers do not reliably honour on SVG elements.
    mapEl.classList.toggle("is-hidden", chart);
    legendEl.classList.toggle("is-hidden", chart);
    barsEl.hidden = !chart;
    replay(chart ? barsEl : flockEl);
    btn.textContent = chart ? "Show map" : "Show chart";
    btn.setAttribute("aria-pressed", String(chart));
    hint.textContent = chart ? HINTS.bars : HINTS.map;
    tooltip.hidden = true;
  });

  // Play the same entrance when the chart scrolls into view — the usual case for
  // an embed, where the reader arrives by scrolling rather than by toggling.
  // It re-arms only after the chart has left the viewport completely, so it
  // cannot stutter while the reader hovers around the trigger point.
  if ("IntersectionObserver" in window) {
    let armed = true;
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.intersectionRatio >= 0.3 && armed) {
          armed = false;
          replay(chart ? barsEl : flockEl);
        } else if (e.intersectionRatio === 0) {
          armed = true;
        }
      }
    }, { threshold: [0, 0.3] }).observe(document.getElementById("view-stack"));
  }
}
