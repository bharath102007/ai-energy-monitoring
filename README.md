# Astra Grid — AI Energy Intelligence & Smart Facility Platform

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-d6fa70?style=for-the-badge&logo=github&logoColor=20251f)](https://bharath102007.github.io/ai-energy-monitoring/)
[![Technology](https://img.shields.io/badge/Stack-Vanilla%20HTML5%20%7C%20CSS3%20%7C%20ES6%2B-ff693c?style=for-the-badge)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-20251f?style=for-the-badge)](LICENSE)

> **Astra Grid** is an AI-powered energy management operating system engineered for commercial campuses and industrial facilities. It continuously aggregates smart meter data, predicts peak pricing surges, analyzes equipment telemetry for mechanical anomalies, and executes autonomous load-shifting schedules to minimize utility costs and carbon emissions.

---

## ✦ System Architecture & Design Philosophy

Astra Grid combines clean, editorial aesthetic design (`#20251f` deep ink, `#d6fa70` electric lime, `#ff693c` warning orange, and `#f6f6f1` warm cream) with institutional telemetry tools:

```
                  ┌──────────────────────────────────────────────┐
                  │              ASTRA GRID PLATFORM             │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼───────────────────────────────┐
        ▼                                ▼                               ▼
┌──────────────────┐           ┌──────────────────┐            ┌──────────────────┐
│   PUBLIC PORTAL  │           │  FACILITY ENGINE │            │ TELEMETRY SENSORS│
│  (Landing Page)  │           │   (Dashboard)    │            │  (HVAC, PV, UPS) │
└──────────────────┘           └────────┬─────────┘            └──────────────────┘
                                        │
           ┌──────────────┬─────────────┼──────────────┬──────────────┐
           ▼              ▼             ▼              ▼              ▼
     [ Overview ]  [ Consumption ] [ Insights ]  [ Equipment ]  [ Reports & Settings ]
```

---

## ▦ Dashboard Tabs & Capabilities

### 1. ⌂ Overview Tab (`#overview`)
* **Real-time Live Demand**: Live fluctuating power counter (e.g. `42.8 kW`) accompanied by dynamic 12-hour load activity bars.
* **Cost vs. Budget**: Real-time spending tracker against daily campus budgets (`₹286.40` spent vs. `₹320.00` cap).
* **Grid Carbon Intensity**: Live tracking of grid emissions factor (`218 gCO₂/kWh`, ↓12% cleaner than baseline).
* **Three Ways to Save Today**: Priority AI recommendation card with instant review dialog trigger and quick-action shortcuts.
* **24-Hour Consumption Trend**: SVG visualization comparing actual consumption vs. AI forecast curves.

### 2. ⌁ Consumption & Load Profiling Tab (`#consumption`)
* **Granular Demand Curves**: High-resolution 24-hour load profile highlighting the **Peak Pricing Tariff Window (2:00 PM – 6:00 PM @ ₹9.80/kWh)**.
* **Solar Generation Overlay**: Visual representation of solar generation curve (`+34.2 kW` peak) offsetting grid demand.
* **Interval Filters**: Instant time-slicing across `24 Hours`, `7 Days`, `30 Days`, and `YTD`.
* **Energy Source Distribution**: Multi-source breakdown across Main Grid (68%), Rooftop Solar PV (24%), and Battery Energy Storage (8%).
* **Subsystem Breakdown**: Power distribution by Chilled Water / HVAC (44%), Machinery & R&D (26%), Server Infrastructure (16%), and Lighting (14%).

### 3. ✦ AI Insights & Autonomous Actions Tab (`#insights`)
* **Predictive Peak Avoidance**: Identifies upcoming price spikes and schedules pre-cooling routines (cooling thermal mass before 2:00 PM saves `₹84.20` daily without impacting tenant comfort).
* **Equipment Anomaly Detection**: Identifies vibration and current draw anomalies in AHU-04 (Floor 3 North), alerting operators before mechanical failure.
* **Renewable Synergy**: Automatically coordinates campus EV fleet charging during peak solar generation (11:30 AM – 2:30 PM).
* **Base Load Optimization**: Spots ghost loads (`6.4 kW` continuous overnight draw in Building B) and deploys smart sleep policies.
* **Interactive Approval Dialog**: In-depth setpoint simulation dialog allowing facilities engineers to review, simulate, and approve autonomous execution.

### 4. ▦ Connected Equipment & Telemetry Tab (`#equipment`)
* **Asset Health Monitoring**: Tracks 18 campus devices with live operational health tags (`Optimal`, `Anomaly`, `Generating`, `Standby`).
* **Interactive Search & Categorization**: Real-time filtering by equipment name, ID, or subsystem category (`HVAC`, `Power & Inverters`, `Lighting`).
* **Telemetry Diagnostics Modal**: Live simulated telemetry stream modal displaying current draw, fan RPM, accelerometer RMS vibration, and AI diagnostic conclusions.
* **Automated Ticket Dispatch**: One-click maintenance work order generation with interactive toast confirmation.

### 5. ▤ Reports & Compliance Export Center (`#reports`)
* **Executive Summary Statements**: Audit-ready statements for April 2026 showing net kWh, solar generation, gross billing (`₹1,24,500`), and AI cost reduction (`₹14,250`).
* **Genuine CSV Export**: Instant client-side download of `AstraGrid_Energy_Report_April_2026.csv` with 30-day historical energy and carbon log.
* **Print-to-PDF Formatting**: Built-in `@media print` stylesheet that cleanly formats the executive statement while hiding sidebars and UI controls.
* **ESG & Scope 2 Compliance**: Greenhouse Gas Protocol compliant documentation tracking tons of CO₂ avoided.

### 6. ⚙ Facility Settings & Tariffs Tab (`#settings`)
* **Facility Configuration**: Customization of campus name, gross floor area (45,000 sq ft), facility classification, and operating hours.
* **Tariff Structure Customization**: Configurable off-peak rates (`₹6.50/kWh`), peak window rates (`₹9.80/kWh`), and monthly budget ceilings.
* **Autonomous AI Boundaries**: Toggles for AI pre-cooling authorization, solar fleet dispatch, and maximum allowed thermostat variation (`±1.5°C`).
* **Persistent Web Storage**: All settings are safely saved to browser `localStorage` and persist across sessions.

---

## ⚡ Global Interactive Features

* **Multi-Site Switcher**: Instant switching between `Northstar Campus`, `South Bay Hub`, and `West River Facility` with dynamic metric baseline adjustments.
* **Notification Popover**: Notification bell with unread counter (`3`), severity badges, and a "Mark Read" feature.
* **Hash-Based Router**: Seamless URL navigation (`dashboard.html#overview`, `#consumption`, `#insights`, `#equipment`, `#reports`, `#settings`) supporting full browser back/forward history.
* **Toast Notification Engine**: Non-intrusive feedback toast notifications for all user actions (applying recommendations, saving settings, creating tickets, exporting data).
* **Responsive Architecture**: Fully optimized for ultra-wide displays, laptops, tablets (collapsible sidebar), and mobile smartphones.

---

## 📂 Project Structure

```
ai-energy-monitoring/
├── index.html        # Public marketing landing page & product vision
├── style.css         # Global design tokens, typography, and landing styles
├── script.js         # Landing page interactive solar simulation
├── dashboard.html    # Full multi-tab enterprise dashboard application
├── dashboard.css     # Dashboard styling, layout grid, print styles, and components
├── dashboard.js      # Dashboard state engine, tab router, telemetry, and CSV export
└── README.md         # Technical documentation and project guide
```

---

## 🚀 Getting Started

### 1. View Live Online
Open the live GitHub Pages deployment in your web browser:
👉 **[https://bharath102007.github.io/ai-energy-monitoring/dashboard.html](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html)**

Direct tab links:
* [Overview](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html#overview)
* [Consumption Analytics](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html#consumption)
* [AI Insights](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html#insights)
* [Connected Equipment](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html#equipment)
* [Reports & Exports](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html#reports)
* [Settings](https://bharath102007.github.io/ai-energy-monitoring/dashboard.html#settings)

### 2. Run Locally

No build tools, bundlers, or `npm install` required! Simply clone and open:

```bash
# Clone the repository
git clone https://github.com/bharath102007/ai-energy-monitoring.git

# Navigate into directory
cd ai-energy-monitoring

# Open in browser (Windows)
start dashboard.html

# Or run with any lightweight local server (Python)
python -m http.server 8000
```
Then visit `http://localhost:8000/dashboard.html` in your browser.

---

## 🛠 Tech Stack

* **Markup**: Semantic HTML5 (`<aside>`, `<main>`, `<dialog>`, `<section>`, `<article>`)
* **Styling**: Vanilla CSS3 (CSS Grid, Flexbox, Custom Properties, `@media print`, Keyframes)
* **Fonts**: `Manrope` (Typography & UI), `DM Mono` (Telemetry & Data), `Georgia` (Editorial accents)
* **Scripting**: Pure JavaScript (ES6+, Web Storage API, SVG manipulation, Blob CSV generation)
* **Dependencies**: Zero external JS libraries or frameworks. Fast, lightweight, and offline-capable.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Built with ✦ by **Bharath** for sustainable, data-driven energy clarity.
