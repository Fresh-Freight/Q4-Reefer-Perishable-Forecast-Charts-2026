# Reefer Load-to-Truck Ratio — DAT

National refrigerated **loads posted per truck posted**, monthly, with the current
year set against the two prior years on a shared 12-month axis.

This chart is one subfolder of the **Q4-Reefer-Perishable-Forecast-Charts-2026**
monorepo. It's a static page (no build step) — the repo workflow copies it into
`docs/reefer-load-to-truck-ratio/`, so it publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/reefer-load-to-truck-ratio/`

---

## Data source

**DAT Trendlines, national reefer load-to-truck ratio.** DAT is subscription-only
with no public API, so these figures are **transcribed by hand** each quarter.
Current series pulled 2026-09-02.

All three series live in one marked block near the top of the `<script>` in
`index.html`, and the page guards itself at runtime rather than trusting the paste.

---

## Refreshing from DAT

Edit **only** the marked block:

```js
const data2024 = [ ... 12 values ... ];
const data2025 = [ ... 12 values ... ];
const data2026 = [ ..., null, null, null, null];   // unclosed months
const Y_MIN = 0, Y_MAX = 22;
```

1. Append the newly closed month(s) to the current-year series.
2. **Pad unclosed months with `null`** rather than shortening the array — every
   series must stay 12 long or the months misalign against the shared axis. The
   chart enforces this and logs a console error on a short array.
3. Check the new high against `Y_MAX`.

When the calendar year rolls over, shift the series down (2025→2024, 2026→2025)
and start a fresh current-year array padded with `null`.

---

## Known caveat

**The last point will be revised.** The current series ends at Aug 2026. Re-pull
before publication and update the tail.

Note also that the Q3 report predicted a mid-July peak that never arrived —
July came in at 19.21 and August at 20.02. Jan–Aug 2026 averages 18.23 against
9.72 for the same span in 2025. That's surrounding report copy, not a code change.

---

## Local preview

No build step and no dependencies to install:

```bash
npx serve .
```

---

## Attribution

Source: **DAT Freight & Analytics** — Trendlines national reefer load-to-truck
ratio (loads posted per truck posted).
