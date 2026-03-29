# 3PD Astro Static App

A read-only Astro micro-frontend, deployed as a Drupal block module.

- **Frontend:** Astro SSG — fetches and displays content from Drupal JSON:API
- **No backend.** No database. No Express server.
- **Data source:** Drupal JSON:API (same-origin when embedded in Drupal, cross-origin during local dev)

Use this starter when your app only needs to **display** CMS content. If you need forms or data persistence, use the `astro-forms` starter instead.

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

Copy `.env.example` to `.env` (already done if your app was scaffolded with `3pd astro app`):

```bash
cp .env.example .env
```

Set `PUBLIC_DRUPAL_BASE_URL` in `.env` to the shared Drupal environment URL:

```
PUBLIC_DRUPAL_BASE_URL=https://dev-3-pd-ide.pantheonsite.io
```

---

## Dev workflow

```bash
npm run dev
```

Starts the Astro dev server at `http://localhost:4321`. The app fetches content from `PUBLIC_DRUPAL_BASE_URL` at runtime — no local Drupal needed.

Edit files in `src/` freely — hot reload is active.

---

## Content type setup

The default `index.astro` fetches from a placeholder content type. Update the fetch URL to match your Drupal site:

```js
// In src/pages/index.astro — replace YOUR_CONTENT_TYPE:
const res = await fetch(`${DRUPAL_BASE}/jsonapi/node/YOUR_CONTENT_TYPE`);
```

> **Important:** Do not add square bracket parameters to the fetch URL (e.g. `?fields[node--page]=title`). Lando's proxy strips bracket notation from query strings, returning empty results with no error. Use the plain base URL.

---

## Packaging the Drupal module

When your feature is ready:

```bash
3pd astro module
```

This builds the Astro app and packages it as a Drupal module folder inside your app directory. Commit that folder and push your feature branch. The HUDX team handles installation into Drupal.

> **Note:** Do not run `3pd astro module --install` — that flag is for HUDX internal use only and requires access to the Drupal codebase.

---

## Project structure

```
your-app/
├── src/
│   ├── layouts/
│   │   └── Layout.astro    ← HTML shell
│   └── pages/
│       └── index.astro     ← your app UI + JSON:API fetch
├── .env                    ← local config (gitignored)
├── .env.example            ← template
└── package.json
```
