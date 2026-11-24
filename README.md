# EnergyIQ — Home Energy Monitor

**Live demo:** https://bharath102007.github.io/ai-energy-monitoring/
**Repository:** https://github.com/bharath102007/ai-energy-monitoring

A self-contained web prototype for tracking home appliance energy usage and cost in real time.

## Run it

ES modules need an HTTP server (opening `index.html` directly with `file://` will not work):

```bash
cd Documents/EnergyIQ
python3 -m http.server 4173
```

Then open **http://localhost:4173** in your browser. No npm install or build step is needed.

## What is included

| Tab | What it does |
|---|---|
| **Live Dashboard** | Live power draw (W), energy used today, cost so far, 7-day average, appliance ON/OFF switches and a daily bar chart |
| **Appliances** | Every device is tagged "Added by you". Pick a day (last 30) to see each appliance's run hours, kWh and cost alongside its watts; add / edit / delete / toggle |
| **Usage** | Daily / weekly / monthly stored reports with totals, cost, top appliance and trend charts |
| **Reports** | Pick any of the last 12 months → full daily table, anomaly status, and download as daily CSV, appliance-wise CSV, JSON, or print to PDF |
| **AI Insights** | Efficiency score, appliance share donut, personalised suggestions and an Anomaly Alerts table for unusually high days |
| **Green Credits** | ₹1 saved against your 30-day average = 1 credit. Balance, tier (Bronze → Platinum), saving streak and recent credits |
| **Chatbot** | Ask about top consumer, today's cost, unusual spikes, credit balance, weekly/monthly usage, savings tips and sensor connectivity |

Settings (gear icon): electricity tariff (₹/unit), simulation speed, reset demo data and clear chat.

### Motion and ambience

Opening the app plays a **5-second** staged branded intro (sensor wake-up → appliance scan → insights → ready). Then the whole page background recolours to the active tab's theme and reveals a matching illustrated backdrop from `assets/*.svg`: energy pulses on Dashboard, appliances on Appliances, rising charts on Usage, report sheets on Reports, AI nodes on Insights, an eco vine with leaves on Green Credits, and chat bubbles on Chatbot. Cards are lightly translucent so the themed art shows through, and animate in when you switch tabs. All motion is disabled automatically when the OS requests reduced motion, and the backdrop is hidden when printing a report.

## How the data works

- `js/store.js` owns all appliance and usage state. It seeds 30 days of sample readings, then a 1-second tick adds consumption for devices that are ON.
- Readings are stored as **watt-minutes per appliance per day** (`state.usage['YYYY-MM-DD'][applianceId]`). Energy in kWh = watt-minutes ÷ 60,000. Cost = kWh × tariff.
- Everything persists in `localStorage` under `energyiq.state.v1` and keeps 90 days of history.
- Run hours for a day = watt-minutes ÷ appliance watts ÷ 60. Anomaly alerts flag days above 18% of the 30-day average (and outside the normal variation band). Multiple tabs are de-duplicated with a per-tick guard and a `storage` sync listener.

### Connecting real Wi-Fi sensors later

Only the write path changes. Replace the body of `tick()` in `js/store.js` with your sensor payload handler, writing watt-minutes into the same bucket:

```js
state.usage[dateKey][applianceId] += watts * elapsedMinutes;
save();
```

All screens, reports, insights and chatbot answers read from that store, so no UI code needs to change.

## Files

- `index.html` — shell / tab layout
- `styles.css` — styling and responsive layout
- `js/applianceArt.js` — appliance catalog and inline SVG pictures
- `js/store.js` — state, simulation and aggregations
- `js/charts.js` — dependency-free SVG charts
- `js/insights.js` — insight rules and chatbot reply engine
- `js/app.js` — screens and event handling
