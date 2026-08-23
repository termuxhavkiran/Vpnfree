# Vpnfree

A minimal VPN management panel (backend + frontend) prepared for Railway deploy.

Overview
- Backend: Node.js + Express (server/)
- Frontend: React + Vite + Tailwind (web/)
- Single Dockerfile builds frontend and runs backend.

What I added
- A simple JSON-file based DB for quick deploy (data/db.json). For production on Railway you should add a PostgreSQL plugin and set DATABASE_URL in Railway environment variables.
- Xray adapter supports remote XRAY_API_URL or a local XRAY binary path (XRAY_LOCAL_BIN).
- API protected by X-API-KEY header.

Quick local run (recommended for dev):
- Install deps and run frontend locally:
  cd web && npm install
  npm run dev
- Run backend:
  cd server && npm install
  API_KEY=changeme node index.js

Build and run with Docker (recommended for Railway):
  docker build -t vpnfree .
  docker run -e API_KEY=changeme -p 3000:3000 vpnfree

Railway deploy (short):
1) In Railway create a new project and connect this GitHub repository and choose branch `railway-deploy`.
2) (Optional but recommended) Add the PostgreSQL plugin in Railway and copy the DATABASE_URL into Environment.
3) In Environment variables set API_KEY (strong value). Optionally set XRAY_API_URL or XRAY_LOCAL_BIN and XRAY_CONFIG_PATH.
4) Deploy. The server listens on $PORT (Railway sets it automatically).

Notes about running Xray on Railway
- Railway may restrict some networking capabilities. The recommended architecture is to run the VPN node (Xray) on a separate VPS and point XRAY_API_URL to it. The panel can manage users via that API.
- If you want to run Xray inside the same container, try setting XRAY_LOCAL_BIN and XRAY_CONFIG_PATH. This may or may not work depending on Railway's network restrictions.

Next steps I can do for you
- Wire up real Xray config generation for users (vmess/vless) if you provide the desired protocol.
- Switch DB to Postgres integration and auto-migrations.
- Add persistent volume config for SQLite/JSON if you prefer local DB on Railway.

