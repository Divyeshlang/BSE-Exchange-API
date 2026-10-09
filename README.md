# BSE Trade Data Real-Time Dashboard

A compact full-stack assessment app that simulates a delayed BSE trade feed, saves unique trades to SQLite, and streams pull progress to an open dashboard. Starting a pull returns HTTP 202 immediately; the backend continues the work in a non-blocking Express background worker.

## Stack

React, javaScript, Vite · Node.js, Express, WebSocket (`ws`), `better-sqlite3` · native WebSocket

## Project Structure

```text
bse-trade-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # SQLite connection & schema initialization (trades & pull_jobs tables)
│   │   ├── controllers/
│   │   │   └── tradeController.js   # REST API endpoint handlers (/getTrades, /api/trades, /api/pulls)
│   │   ├── routes/
│   │   │   └── apiRoutes.js         # Express router mapping routes to controllers
│   │   ├── services/
│   │   │   ├── mockBseService.js    # Simulated BSE exchange data feed (3,000 trades)
│   │   │   └── pullJobWorker.js     # Non-blocking async background job worker & batch SQLite inserter
│   │   ├── websocket/
│   │   │   └── wsManager.js         # WebSocket server initialization & real-time client broadcaster
│   │   ├── app.js                   # Express application setup & middleware (CORS, JSON parsing)
│   │   └── server.js                # Server entry point (HTTP & WebSocket listener)
│   └── test/
│       └── server.test.js           # Integration test suite (5/5 passed)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Header.tsx           # Brand header, live connection indicator, & ticking IST clock
        │   ├── SummaryCards.tsx     # Quantitative metric cards (Total, Job Status, Last Updated IST)
        │   ├── PullStatusBanner.tsx # Active background pull job progress banner
        │   └── TradeTable.tsx       # Live trade data table with search filter & IST formatting
        ├── hooks/
        │   └── useTradeDashboard.ts # Custom React hook encapsulating WebSocket, REST API, & IST clock
        ├── types/
        │   └── trade.ts             # Domain interfaces (Trade, PullJob, WebSocketEvent)
        ├── App.tsx                  # Main layout container orchestrating components
        ├── main.tsx                 # React DOM root entry point
        └── style.css                # Premium modern UI styling
```

## Run locally

Prerequisites: Node.js 20+.

### Backend (JavaScript - Node.js)

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm start
```

The backend listens on `http://localhost:8000`.

### Frontend (second terminal)

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. The dashboard loads persisted trades immediately, then keeps a native WebSocket open for new trades and pull status. It does not poll.

## Configuration

Copy `.env.example` to `.env` and adjust values before starting the backend. The backend loads that file at startup; process environment values take precedence.

| Variable                |                 Default | Purpose                                                         |
| ----------------------- | ----------------------: | --------------------------------------------------------------- |
| `BSE_API_DELAY_SECONDS` |                     `1` | Simulated BSE response delay. Set to `900` to model 15 minutes. |
| `TRADE_BATCH_SIZE`      |                   `250` | Number of new rows per WebSocket trade event.                   |
| `CORS_ORIGINS`          | `http://localhost:5173` | Comma-separated allowed browser origins.                        |

Frontend `.env.example` contains `VITE_API_URL` and `VITE_WS_URL` for the backend REST and WebSocket addresses.

## API

- `GET /getTrades` — mock BSE data (3,000 seeded trades; applies configured delay).
- `POST /api/pulls` — starts a pull and returns `202` with a job ID.
- `GET /api/pulls`, `GET /api/pulls/{jobId}` — recent pull status.
- `GET /api/trades?limit=100&offset=0` — persisted trades and total count.
- `WS /ws/trades` — `PULL_STARTED`, `PULL_STATUS`, `TRADES_ADDED`, `PULL_COMPLETED`, or `PULL_FAILED` events.

## Tests and production build

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm run build
```

## Why the pull is asynchronous

The simulated source can take 15 minutes while an HTTP connection may last only 30 seconds. `POST /api/pulls` creates a job and returns immediately (`202 Accepted`); a server-side background worker waits for the configured delay, persists unique records in SQLite batches, and broadcasts results. WebSockets deliver changes to connected browsers without repeated requests. SQLite keeps the assessment easy to run locally.
