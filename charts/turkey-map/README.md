# Where Turkeys Are Raised — USDA NASS

U.S. turkey production by state, 2025. Each producing state gets a turkey glyph
scaled to the birds raised there — the origin map behind Q4 holiday poultry
freight.

This chart is one subfolder of the **Q4-Reefer-Perishable-Forecast-Charts-2026**
monorepo. It's a static page (no build step at deploy time) — the repo workflow
copies it into `docs/turkey-map/`, so it publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/turkey-map/`

---

## Data source

**USDA NASS — Turkeys Raised**, the annual release (Cornell Mann Library, e.g.
`tuky0925.pdf`). NASS publishes a state table in **thousand head**; the page
converts to millions for display, and `data/turkeys_raised_by_state.csv` keeps
the published unit.

The release breaks out only the leading turkey states — 13 for 2025. Everything
else is pooled into **Other States**, which at 22.3M birds is larger than every
state except Minnesota and North Carolina. It has no single location, so it is
**not drawn on the map**; it appears in the table instead, alongside the national
total. Without that row the map would look like it accounts for all U.S.
production when it covers 88.5% of it.

---

## Refreshing for a new year

1. Transcribe the new state table into `data/turkeys_raised_by_state.csv`.
   Keep the header's year in step: the value column is
   `turkeys_raised_<year>_thousand_head`, and the build reads the year from it
   rather than from a constant.
2. Rebuild the dataset:

   ```bash
   node scripts/build-data.cjs data/turkeys_raised_by_state.csv data/turkeys.json
   ```

3. Commit both the CSV and the regenerated `data/turkeys.json`. The workflow
   copies the JSON as-is; it does not run this script.

### Guards

The transcription is done by hand, so the build checks it rather than trusting it:

- **The total must reconcile.** Mapped states plus Other States must equal the
  United States row. A dropped or duplicated row would leave every share on the
  page quietly wrong, so a mismatch **fails the build** instead of shipping.
- **Every mapped row needs a FIPS code.** A row that is neither a known aggregate
  nor a locatable state is reported and skipped rather than silently vanishing.
- **At runtime**, the page checks that every state in the data actually found a
  match in the us-atlas topology, and logs an error naming the shortfall if not.

---

## How the glyph encodes the number

Size is **area-proportional**: the linear scale factor goes as `sqrt(value)`,
anchored at zero, so doubling the birds doubles the ink rather than the height.
`MIN_SCALE` is a floor that keeps a small state visible; at 2025's spread the
smallest state (South Dakota) scales to 0.53 against a floor of 0.495, so the
floor never binds and the comparison stays honest end to end. If a future year
has a wider spread, check that it still clears the floor — once the floor binds,
that state is drawn larger than its number.

The glyph is drawn in `drawTurkey()` in glyph-local units with the feet at
`y = 0`, so a bird stands on its state's centroid the way the Christmas-tree
spikes stand on county centroids. The whole group is uniformly scaled, so
strokes scale with it. **Position marks the state, not a farm.**

Off-the-shelf turkey icons (Noto, emoji sets) were tried and rejected: they are
side-profile birds that collapse into an indistinct blob below ~25px, which is
exactly the size the smaller states need. The spread-fan silhouette with a pale
tip band stays readable small, and matches the Fresh Freight palette.

---

## The two views

**Show chart** swaps the map for a ranked bar chart in the same slot. It is not
decoration — it does two jobs the map can't:

- **It reads every value without hovering.** Each bar carries its own figure and
  share of the U.S. total, so nothing is gated behind a pointer. On the map side,
  hover targets are at least 26px and the birds are keyboard-focusable, showing
  the same card on focus as on hover.

  On a pointer device at 621px and up, the hovered bird also grows by
  `HOVER_GROW` and is raised in front of its neighbours. It scales from the feet,
  so it never appears to move off its state. `HOVER_GROW` is published to CSS as
  `--grow` and also sizes the hit targets, so the pointer can reach the enlarged
  edges without falling out and flickering — change it in one place. The lift is
  a stylesheet rule inside `@media (hover: hover)`, so it is inert on touch, and
  the transition is dropped under `prefers-reduced-motion`.
- **It can show "Other States."** The pooled row has no location, so the map has
  to omit it; the chart ranks it in its true position (third, above Arkansas) in
  a neutral grey rather than the series orange, so it is legible as a pool rather
  than a place.

The bar chart is plain HTML, not SVG, deliberately: an SVG chart scales its text
with its viewBox, which would leave the labels a few pixels tall on a phone.

## Entrances

Both views animate in, and each entrance fires on **two** triggers: switching to
that view, and the chart scrolling into the viewport. The scroll trigger is an
`IntersectionObserver` on `#view-stack` at a 0.3 ratio that re-arms only once the
chart has left the viewport completely — so it plays on arrival in an embedded
report, but cannot stutter while the reader hovers around the trigger point. A
small scroll while the chart is already on screen does nothing.

**Map** — the flock pops in west to east. Each bird's longitude rank is written
to `--i` (draw order stays north-first, so the two orderings are independent),
and the easing overshoots slightly so the birds land rather than just appear.

The map's animation uses `animation-fill-mode: backwards`, never `both`. A
forwards fill would pin `transform` after the animation ended, and the hover
lift — which sets the same property — could no longer override it. `backwards`
still holds the from-state through the stagger delay, so nothing flashes at full
size before its turn, but releases the property once it finishes.

**Chart** — rows settle in while the bars wipe out from the baseline, 26ms apart
down the ranking. The bars animate `transform: scaleX()` rather than `width`, so
the browser composites them instead of re-laying out fourteen rows a frame. Here
`both` is fine: nothing else competes for `transform` on a bar.

Both entrances go through `replay()`, which drops and re-adds the `is-entering`
class with a forced reflow between — otherwise the animation would only ever run
once. It reads `getBoundingClientRect()` rather than `offsetWidth` to force that
reflow, because the flock is an SVG element and SVG has no `offsetWidth`.

### Moving a node restarts its animations — mind the order

`replay()` also **removes** `is-entering` once the animations report finished.
That is not tidiness. The hover raise re-parents the bird with `appendChild`, and
moving a node restarts any CSS animation on it — so a class left behind would
send the hovered bird back to `scale(0)` and hold it there through its stagger
delay. The bird visibly vanished on hover before this was fixed.

The same rule governs `lift()`, which **raises first and grows second**:

1. `appendChild` to raise (skipped while the entrance is still playing — the
   guard is why hovering mid-entrance doesn't drop the bird),
2. a `getBoundingClientRect()` read to flush style for the moved node,
3. then the `is-hover` class.

Re-parenting cancels *transitions* as well as animations, so growing first and
raising second made the bird snap to full size instead of easing. With this
order it eases: measured 1.05 → 1.10 → 1.14 across the transition.

Every animation on the page — both entrances and the hover lift — is disabled
under `prefers-reduced-motion`.

---

The legend sits in the flow beneath the map, and is hidden under 620px — at that
size the reference glyphs are too small to compare against, and the chart view
carries the exact figures anyway. It is deliberately **not** overlaid on the
projection: its glyphs and labels are fixed pixel sizes while the map is fluid,
so an overlay fits at some widths and rides up onto land at others.

---

## Local preview

No build step and no dependencies to install:

```bash
npx http-server . -p 8101 -c-1
```

(The repo's `.claude/launch.json` has this as the `turkey-map` configuration.)

The page fetches `data/turkeys.json`, so it needs to be served over HTTP —
opening `index.html` from the filesystem will fail on CORS.

---

## Attribution

Source: **USDA National Agricultural Statistics Service** — Turkeys Raised, 2025.
Geometry from [us-atlas](https://github.com/topojson/us-atlas) (TopoJSON, public domain).
