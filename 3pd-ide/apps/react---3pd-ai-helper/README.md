# 3PD React App

A React micro-frontend with a data layer, deployed as a Drupal block module.

- **Frontend:** React + Vite — full SPA with client-side routing
- **Local backend:** Express + SQLite — handles API requests during development
- **Deployed:** API routes handled by a generated PHP controller in Drupal. No separate server needed in production.

---

## Prerequisites

- Node.js v20+
- npm

You do **not** need Drupal, Lando, or Docker locally.

---

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` (already done if your app was scaffolded with `3pd react app`):

```bash
cp .env.example .env
```

The `.env` file should already have `APP_SLUG` and `VITE_APP_SLUG` set. Do not edit these manually.

---

## Before you start — pull current data

Always pull the latest data from the shared Drupal environment before starting work. This syncs your local SQLite with whatever is currently in the deployed app.

```bash
3pd react db pull
```

Then start the dev server:

```bash
npm run dev
```

If the dev server was already running when you ran `db pull`, restart it:

```bash
# Kill the Express process on port 4000, then restart
lsof -ti:4000 | xargs kill -9
npm run dev
```

---

## Dev workflow

```bash
npm run dev
```

Starts two servers concurrently:
- **React (Vite)** at `http://localhost:5173` — your app UI
- **Express** at `http://127.0.0.1:4000` — local API for data

Edit files in `src/` freely — hot reload is active.

Individual servers (for debugging):
```bash
npm run dev:client   # Vite only
npm run dev:server   # Express only
```

---

## Packaging the Drupal module

When your feature is ready:

```bash
3pd react module
```

This builds the React app and packages it as a Drupal module folder inside your app directory. Commit that folder and push your feature branch. The HUDX team handles installation into Drupal.

> **Note:** Do not run `3pd react module --install` — that flag is for HUDX internal use only and requires access to the Drupal codebase.

---

## How data works

| Environment | API handled by | Data stored in |
|---|---|---|
| Local dev (`npm run dev`) | Express server | `server/db/app.sqlite` |
| Deployed in Drupal | Generated PHP controller | Drupal's MySQL DB |

The SQLite file is gitignored. Data flows **from Pantheon → your local SQLite** via `3pd react db pull`. It flows **from local SQLite → Pantheon** via `3pd react module --install` (HUDX internal only, baked into `data/seed.json`).

---

## Project structure

```
your-app/
├── src/
│   ├── main.jsx            ← React entry point
│   ├── App.jsx             ← Root component (MemoryRouter)
│   └── pages/
│       └── Home.jsx        ← your app UI
├── server/
│   ├── server.js           ← Express API (local dev only)
│   └── db/
│       ├── schema.sql      ← table definition
│       └── app.sqlite      ← local data (gitignored)
├── .env                    ← local config (gitignored)
├── .env.example            ← template
└── package.json
```

---

## Notes

- React uses `VITE_` prefix for client-exposed env vars (not `PUBLIC_` which is Astro's prefix).
- `BrowserRouter` breaks inside Drupal blocks. The module generator automatically replaces it with `MemoryRouter` — do not use `BrowserRouter` in `App.jsx`.
- The Express server binds to `127.0.0.1` only (not `0.0.0.0`). It is not a public service.
