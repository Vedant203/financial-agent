# Technical Architecture: Financial Agent Terminal (V2)

This repository contains a high-density, professional-grade financial terminal built for real-time market monitoring. It is optimized for the Japanese market (Nikkei 225) with a global macro overlay.

## 🚀 The Stack
- **Framework**: [React 18](https://reactjs.org/) (bootstrapped with **Vite** for sub-second hot-reloading).
- **Styling**: **Vanilla CSS3** using Custom Properties (Variables) for the OLED charcoal theme.
- **Visuals**: **Recharts** for the primary step-chart and inline SVG sparklines.
- **Typography**: 
    - `Inter`: For all UI labels and news text.
    - `Fira Code`: Monospaced font for all financial data to ensure perfect vertical decimal alignment.

## 📡 Data Engine (`src/hooks/useMarketData.js`)
The terminal uses a custom React hook that manages the entire lifecycle of the application's data:

1. **Proxy Ingestion**: To bypass CORS restrictions, requests are routed through the Vite dev server proxy (`vite.config.js`) to `query1.finance.yahoo.com`.
2. **Batch Polling**: Every 5 minutes, the system executes a full sweep of the 40+ tickers in the watchlist.
3. **Multi-Query News**: The news engine fires 3 simultaneous search queries (`business`, `finance`, `japan`) to guarantee a dense 30+ article feed, which is then deduplicated by UUID.
4. **On-Demand Charts**: While sparklines are globally synced, the high-resolution center chart fetches on-demand whenever the user changes the active ticker or the time range (1D, 5D, 1M, 6M, 1Y, YTD).

## 🧠 Smart UI Logic (`src/components/DiscoveryDashboard.jsx`)
- **Glassmorphism**: Panels utilize `backdrop-filter: blur(12px)` and translucent backgrounds to create a layered HUD feel.
- **Sentiment Engine**: A regex-based heuristic parses news headlines in real-time to inject `[BULLISH]`, `[BEARISH]`, or `[MACRO]` sentiment tags based on keywords.
- **Color Semantics**: 
    - 🟢 `#22c55e` (Green): Positive delta / Growth.
    - 🔴 `#ef4444` (Red): Negative delta / Staleness / Risk.
    - 🔵 `#3b82f6` (Blue): System Info / Selection / Macro events.
- **Grid Layout**: Explicit CSS Grid Areas (`left`, `chart`, `bottom`, `right`) ensure 100% viewport coverage with zero wasted space.

## 🛠️ Developer Operations
- **Node.js**: Required for running the dev server.
- **Authentication**: Git is configured to use the Windows Credential Manager to handle GitHub PAT tokens securely without hardcoding them in the repo.
- **Workflow**: Auto-push logic is registered in `.agents/workflows` to sync every code change to the remote repository.

---
*Built for the Vedant203 professional trading environment.*
