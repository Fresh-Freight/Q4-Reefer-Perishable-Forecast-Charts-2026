# Reefer Spot vs. Contract Rates — DAT

National average refrigerated **spot and contract rates per mile, including fuel
surcharge**, over a rolling 13-month window. Mirrors the window DAT's own
Trendlines chart uses.

This chart is one subfolder of the **Q4-Reefer-Perishable-Forecast-Charts-2026**
monorepo. It's a static page (no build step) — the repo workflow copies it into
`docs/reefer-rates/`, so it publishes at:

**Live URL:** `https://fresh-freight.github.io/Q4-Reefer-Perishable-Forecast-Charts-2026/reefer-rates/`

---

## Data source

**DAT RateView / Trendlines, National Reefer Rates.** DAT is subscription-only
with no public API, so these figures are **transcribed by hand** each quarter.
Current series pulled 2026-09-02.

Because the numbers are hand-entered, everything the chart needs lives in one
marked block near the top of the `<script>` in `index.html`, and the page guards
itself at runtime rather than trusting the paste.

---

## Refreshing from DAT

Edit **only** the marked block. It is a rolling window: it must end at DAT's most
recent *closed* month at publication, not at a fixed month.

```js
const FIRST_MONTH = { year: 2025, month: 9 };   // month is 1-12; 9 = September
const spotData     = [ ... ];
const contractData = [ ... ];
const Y_MIN = 2.00, Y_MAX = 4.00;
```

1. Set `FIRST_MONTH` to the new starting month.
2. Paste both series. Axis labels and tooltip labels are **both derived from
   `FIRST_MONTH`**, so there is nothing else to keep in sync.
3. Check the new high against `Y_MAX` (see below).

### Guards

- **Series length.** If `spotData` and `contractData` differ in length the chart
  would silently misalign months, so a mismatch logs a console error instead.
- **Axis range.** `Y_MIN`/`Y_MAX` are fixed, and a value outside them would be
  clipped off the plot with no error raised. The chart warns when the data
  exceeds the axis. The ceiling was raised 3.50 → 4.00 for this refresh because
  the 3.61 contract peak would otherwise have been cut off.

---

## Known caveat

**The last point is an open month and will be revised.** The current series ends
on Sep 2026, read two days into that month. When the Q3 report pulled this series
in June, its last two months later shifted by a cent each. **Re-pull before
publication** and update the tail.

Also note the Q3 report's claim that spot was running above contract no longer
holds — that reversed in August (contract 3.42 vs. spot 3.38). That's surrounding
report copy, not a code change.

---

## Local preview

No build step and no dependencies to install:

```bash
npx serve .
```

---

## Attribution

Source: **DAT Freight & Analytics** — RateView / Trendlines national reefer rates,
$/mile including fuel surcharge.
