# ⛽ Diesel Price Outlook: automated freight-fuel reporting

> A self-updating chart of weekly U.S. retail diesel prices (EIA actuals) with a Short-Term Energy Outlook forecast overlay and a regional PADD breakdown, rebuilt and republished automatically every week so a freight team always has a current view of its single biggest variable cost.

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

**▶️ Live chart:** https://mounikasampangi.github.io/eia_diesel_price_outlook/ &nbsp;·&nbsp; updates weekly, no manual refresh

<!-- 📸 To add a preview image: open the live page above, screenshot it, save as reports/figures/preview.png, and uncomment the next line -->
<!-- ![Diesel price outlook](reports/figures/preview.png) -->

## 📊 The business question
Diesel is the largest controllable cost in trucking, and fuel surcharges are priced off it. Teams need two things at a glance: *where are retail diesel prices now, and where does the near-term forecast say they're heading?* This dashboard keeps both current automatically.

## 🧠 Approach & trade-offs
The page calls two EIA v2 endpoints in the browser, weekly retail diesel actuals and the monthly Short-Term Energy Outlook (STEO) forecast, and overlays them, with a regional PADD breakdown underneath. The API key is stored as a **GitHub Actions secret** and injected at deploy time (the committed HTML carries only a `__EIA_API_KEY__` placeholder), so the key is never exposed in the repo. A GitHub Action redeploys on push and on a **weekly cron**, and because the chart fetches at page-load, fresh EIA data flows in with no code change. A small fallback dataset is embedded so the page still renders if the API is unreachable.

## 🔑 What it shows
- Weekly retail diesel **actuals** trended against the **STEO forecast**: an at-a-glance read on direction and momentum.
- A **regional (PADD) breakdown** of the most recent week, surfacing where fuel cost is running hot vs. cool across the country.

## ✅ Decision this supports
Set and defend fuel surcharges, and build lane cost forecasts, off a live, trusted price signal instead of a stale monthly spreadsheet.

## 🛠️ Stack
Python (key injection) · Chart.js · EIA v2 API · GitHub Actions · GitHub Pages

## ▶️ Run / preview locally
The placeholder build won't hit the live API. To preview, temporarily paste your EIA key in place of `__EIA_API_KEY__` in `docs/index.html` (**don't commit it**); the embedded fallback dataset also renders without a call.

## 📂 Data & license
Source: **U.S. Energy Information Administration (EIA)**: weekly retail diesel (`petroleum/pri/gnd`) and Short-Term Energy Outlook (`steo`), both public. Code released under the [MIT License](LICENSE).
