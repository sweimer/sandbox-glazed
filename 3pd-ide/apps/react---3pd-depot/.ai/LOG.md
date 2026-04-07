# Project LOG — react---3pd-depot

Framework: React + Vite + Express + **PostgreSQL (pg)** — note: uses pg, NOT better-sqlite3
Created: 2026-04-01

---

## Current Status

The app is a **HUDx 3PD Depot** — a landing page hub for the HUDX web development ecosystem. The main UI (Home.jsx) is complete and deployed as a Drupal module.

**Layout (as of 2026-04-07):**
- Hero banner with the 3PD Director CTA as the **primary action inside the hero** ("Ready to build? Start with the 3PD Director →")
- "Browse by Path" section header (renamed from "Choose Your Build Path") — signals this is reference material for returning users
- Six feature cards in three groups: For Static Features (Content Editors, Page Builders), For Dynamic Features (IDE Starters, Smart Embeds), Tools & Management (Design System, Module Manager)

The Director is now the primary entry point. The card grid is a secondary reference for returning 3PDs who already know their path.

**Accessibility pass complete** (`Home.jsx`, `App.jsx`): all decorative icons have `aria-hidden="true"`, all `target="_blank"` links have `rel="noopener noreferrer"` + `aria-label`, the "View Starter Kits" toggle has `aria-expanded`, `href="#" target="_blank"` dead links had `target="_blank"` removed, TestPanel input now has a `<label>`, and the status message uses `aria-live="polite"`. Four moderate issues remain open (see Backlog).

**ESLint fully operational**: `eslint-plugin-react-hooks` installed, `eslint.config.js` updated with `react-hooks` plugin + `react: { version: "detect" }` setting, `fetch` added to globals, unused `Link` import removed from `App.jsx`, `"type": "module"` added to `package.json`. `npx eslint src/` runs clean (0 errors, 0 warnings). The two `href="#"` placeholder links (Angular, VanillaJS) are suppressed with `eslint-disable-next-line` comments.

Three pages exist:
- `Home.jsx` — main landing page (complete, a11y pass done)
- `StyleGuide.jsx` — POC stub, imports a `@hudx/hudx.css` package
- `ApiReference.jsx` — POC stub, fetches Drupal JSON:API via `VITE_DRUPAL_API` env var

Backend uses **PostgreSQL** via the `pg` package (connection pool in `server/db/database.js`). Schema has a `test_entries` table (PostgreSQL syntax: `SERIAL`, `TIMESTAMP DEFAULT NOW()`). Test routes exist at `/api/test/add` and `/api/test/all`. A `TestPanel` component in App.jsx exercises these routes.

**Key departure from starter kit**: this app uses `pg` (PostgreSQL), not `better-sqlite3` (SQLite). The schema.sql uses PostgreSQL syntax. This will need to be accounted for in any module packaging.

---

## Roadmap

1. [x] Define the app's purpose — it is the 3PD Depot hub/landing page
2. [x] Build out the main UI (Home.jsx) — largely done
3. [x] ESLint fully operational — 0 errors, 0 warnings
4. [ ] Clarify the role of the `test_entries` table + TestPanel — is this scaffolding to remove, or a real feature?
4. [ ] Clarify the StyleGuide and ApiReference pages — POC stubs or intended features?
5. [ ] Decide: keep PostgreSQL or migrate to SQLite per starter kit convention?
6. [ ] Run `3pd react module` to package for Drupal (may need custom `create-module.js` for pg)

---

## Open Questions

- Is the `TestPanel` / `test_entries` table a leftover scaffold or a real feature?
- Is StyleGuide (/styleguide) and ApiReference (/api) intended to be user-facing routes in the Drupal module, or internal dev tools to remove before packaging?
- The app uses `pg` (PostgreSQL) — is there a specific Postgres DB to connect to, or should this be migrated back to SQLite per the starter kit convention?
- What does `server/db/database.js` look like — is the pg pool configured with env vars?

---

## Backlog

- `StyleGuide.jsx` imports `@hudx/hudx.css` — this package may not exist in npm; verify or stub
- Hero image is hotlinked from an external domain (oakwoodhomesco.com) — should be replaced with a local or CDN asset
- `Home.jsx` — Angular Starter Kit link is `href="#"` (dead end, intentionally left as-is until Angular starter ships)
- `/styleguide`, `/api`, `/test` routes exist in App.jsx but have no nav links from the UI — unreachable unless URL is typed directly; consider removing post-demo
- After demos: evaluate removing showcase card grid entirely — target audience is 3PDs, not clients; Director is sufficient entry point
- **A11y moderate (open)**: `<br/>` inside headings — replace with CSS line breaks
- **A11y moderate (open)**: Two adjacent `btn-primary` links in Module Manager card — replace `<br/>` spacer with margin utility
- **A11y moderate (open)**: `text-muted` color contrast — verify small text passes WCAG AA against actual backgrounds

---

## Session History

### 2026-04-01 — Session 1
First scan. App has real custom code. Populated LOG with findings.
Home.jsx is a full landing page hub for the 3PD ecosystem.
Backend uses PostgreSQL (pg), not SQLite — key deviation from starter kit.
Three pages: Home (done), StyleGuide (stub), ApiReference (stub).

### 2026-04-01 — Session 2
Link audit on Home.jsx. Found two intentional dead ends (`href="#"` for Angular and VanillaJS starter kits — left as-is per developer). Flagged misleading COMING SOON button pointing to wrong Drupal path. Noted that /styleguide, /api, and /test routes are unreachable from the UI (no nav links). No code changes made.

### 2026-04-01 — Session 3
Static a11y audit of `Home.jsx` and `App.jsx`. Found and fixed 9 issues across Critical/Serious categories: `aria-hidden="true"` on all 10 decorative icons, `aria-expanded` on the "View Starter Kits" toggle, `rel="noopener noreferrer"` + `aria-label` on all `target="_blank"` links, removed `target="_blank"` from dead `href="#"` links (Angular, VanillaJS), added `<label>` to TestPanel input, converted status message to `aria-live="polite"`. Four moderate issues added to Backlog (heading `<br/>`, COMING SOON button state, duplicate btn-primary spacer, contrast check). Left with 2 modified files (`src/App.jsx`, `src/pages/Home.jsx`) — uncommitted.

### 2026-04-01 — Session 4
`3pd a11y` (Pa11y) — passed clean, 0 issues. `3pd lint` (ESLint) — fixed broken config: installed `eslint-plugin-react-hooks`, wired into `eslint.config.js`, added `react: { version: "detect" }` setting and `fetch` global, removed unused `Link` import from `App.jsx`, added `"type": "module"` to `package.json`, suppressed two intentional `href="#"` placeholder links (Angular, VanillaJS) with `eslint-disable-next-line`. ESLint now runs clean. Left with 6 modified files (`eslint.config.js`, `package.json`, `package-lock.json`, `src/App.jsx`, `src/pages/Home.jsx`, `.ai/LOG.md`) — uncommitted.

### 2026-04-01 — Session 5
Minor copy update to the 3PD Design System card in `Home.jsx`: added a sentence noting the design system is shared across all 3PD starter kits and shipped to 3PDs automatically. Left with 7 modified files (`eslint.config.js`, `package.json`, `package-lock.json`, `src/App.jsx`, `src/pages/Home.jsx`, `.ai/LOG.md`, `CLAUDE.md`) — uncommitted.

### 2026-04-02 — Session 6
Card border color styling pass on `Home.jsx`: cards 1–2 → rust (`#b7410e`), cards 3–4 → forest green (`#228B22`), cards 5–6 → golden yellow (`#FFD700`). All 6 cards set to `borderWidth: '2px'`. Bootstrap utility border classes (`border-primary`, `border-info`, etc.) replaced with inline `style` props. Attempted `3pd react module --install` — blocked because the global `3pd` CLI is linked from `alex-renew-d8/3pd-ide` (missing `0.starter-react` starter kit). Resolution: re-link `3pd` from `SANDBOX-glazed/3pd-ide/starter-scripts/cli` via `npm install && npm link`. Left with `src/pages/Home.jsx` modified — uncommitted.

### 2026-04-07 — Session 7
Demo prep: extracted cards 1–2 border color into a top-of-file constant `CARD_12_BORDER_COLOR` (line 3 of `Home.jsx`) to enable a single-line AI demo change. Cards 1–2 are currently set to rust (`#b7410e`). For the demo, ask AI to switch to red (`#ff0000`) — one edit, instant hot-reload. Left with `src/pages/Home.jsx` modified — uncommitted.

### 2026-04-07 — Session 8
Director-first restructure + cleanup:
- Director CTA moved into the hero as the primary action ("Ready to build? Start with the 3PD Director →") — replaces orphaned yellow button below the hero
- "Choose Your Build Path" renamed to "Browse by Path" — positions cards as secondary reference for returning users
- Removed "3PD AI App Helper (COMING SOON)" button and `<br/>` from the 3PD IDE Starters card
- Removed VanillaJS Starter Kit placeholder link from the Starter Kits list
- Module rebuilt and reinstalled via `3pd react module --install`
- Committed to main.