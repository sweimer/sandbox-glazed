# 3PD Astro Forms App

An Astro micro-frontend with a data layer, deployed as a Drupal block module.

- **Frontend:** Astro SSG — fetches content from Drupal JSON:API
- **Local backend:** Express + SQLite — handles form submissions during development
- **Deployed:** Form submissions route to Drupal's own database via a generated REST controller. No separate server needed in production.

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

Copy `.env.example` to `.env` (already done if your app was scaffolded with `3pd astro-forms app`):

```bash
cp .env.example .env
```

The `.env` file should already have `PUBLIC_DRUPAL_BASE_URL` and `APP_SLUG` set. Do not edit `APP_SLUG` manually.

---

## Before you start — pull current data

Always pull the latest data from the shared Drupal environment before starting work. This syncs your local SQLite with whatever is currently in the deployed app.

```bash
3pd astro-forms db pull
```

Then start the dev server:

```bash
npm run dev
```

If the dev server was already running when you ran `db pull`, restart it:

```bash
# Kill the Express process on port 3001, then restart
lsof -ti:3001 | xargs kill -9
npm run dev
```

---

## Dev workflow

```bash
npm run dev
```

Starts two servers concurrently:
- **Astro** at `http://localhost:4321` — your app UI
- **Express** at `http://localhost:3001` — local API for form submissions

Edit files in `src/` freely — hot reload is active.

Individual servers (for debugging):
```bash
npm run dev:astro    # Astro only
npm run dev:server   # Express only
```

---

## Packaging the Drupal module

When your feature is ready:

```bash
3pd astro-forms module
```

This builds the Astro app and packages it as a Drupal module folder inside your app directory. Commit that folder and push your feature branch. The HUDX team handles installation into Drupal.

> **Note:** Do not run `3pd astro-forms module --install` — that flag is for HUDX internal use only and requires access to the Drupal codebase.

---

## How data works

| Environment | API handled by | Data stored in |
|---|---|---|
| Local dev (`npm run dev`) | Express server | `server/db/app.sqlite` |
| Deployed in Drupal | Generated PHP controller | Drupal's MySQL DB |

The SQLite file is gitignored. Data flows **from Pantheon → your local SQLite** via `3pd astro-forms db pull`. It flows **from local SQLite → Pantheon** via `3pd astro-forms module --install` (HUDX internal only, baked into `data/seed.json`).

---

## Project structure

```
your-app/
├── src/
│   └── pages/
│       └── index.astro     ← your app UI
├── server/
│   ├── server.js           ← Express API (local dev only)
│   └── db/
│       ├── schema.sql      ← table definition
│       └── app.sqlite      ← local data (gitignored)
├── .env                    ← local config (gitignored)
├── .env.example            ← template
└── package.json
```
