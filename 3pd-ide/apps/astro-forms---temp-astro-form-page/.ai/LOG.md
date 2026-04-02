# Project LOG — astro-forms---temp-astro-form-page

Framework: Astro + Express + SQLite
Created: 2026-04-02

---

## Current Status

Two-page AlexRenew homepage design demo, live on Drupal as a full-page module. Nav is fully dynamic (driven by Drupal's main menu with dropdown support). Footer Contact and About columns are driven by Drupal custom blocks. Auth-gated edit buttons throughout allow content editors to edit Drupal content in an iframe modal without leaving the page. Demoed live to the team — well received.

- **Option 1** (`/astro-forms---temp-astro-form-page`): Matches `homepage1.pdf` — cinematic hero, System at Work section, community splits, news/events grid with tabs, stats + contact form side-by-side, 4-column footer. Contact form is live (Express + SQLite locally, Drupal MySQL on prod).
- **Option 2** (`/astro-forms---temp-astro-form-page/page2`): Matches `homepage2.pdf` — kinetic RE/NEW hero, accordion System at Work, community splits on white bg, full-width purple stats band, large carousel news cards, simple CTA contact section (no form).
- Nav cross-links: Option 1 has "Option 2" link (yellow) → page2; Option 2 has "Option 01" (blue) → home.

---

## Roadmap

1. [x] Define app purpose — AlexRenew homepage design demo
2. [x] Build Option 1 UI (homepage1.pdf)
3. [x] Build Option 2 UI (homepage2.pdf)
4. [x] Install as Drupal page module with multi-page support
5. [x] Dynamic nav from Drupal main menu (JSON API → MenuController)
6. [x] Dropdown nav support (1 level deep, hover with delay)
7. [x] Auth-gated edit buttons + Drupal admin modal
8. [x] Footer contact section driven by Drupal custom block
9. [x] Footer about section driven by Drupal custom block
10. [ ] Wire footer Customer Center column to Drupal block
11. [ ] Client review and revision pass
12. [ ] Gate or remove dev-only routes before production

---

## Open Questions

- Will a third design option be needed?
- Should the contact form on Option 1 be wired to a real notification email in prod?
- Are the gradient image placeholders acceptable long-term or will real photography be provided?
- Should the Drupal menu items use anchor fragment URLs (e.g. `/astro-forms---temp-astro-form-page#about`) so nav links scroll to page sections?

---

## Backlog

- Add real facility photography once assets are available
- Consider cache-busting for CSS (`?v=timestamp`) in `create-page.js` page.html output
- Evaluate whether `api-reference` and `styleguide` pages should be excluded from the Astro build entirely for prod (currently skipped by generator but still built)
- Wire Customer Center footer column to Drupal block (same pattern as Contact + About)

---

## Architecture Notes

### Dynamic Nav
- Express endpoint: `GET /api/${APP_SLUG}/menu/:menuName` → reads `server/menu.json`
- Drupal endpoint: `GET /api/${appName}/menu/{menu_name}` → `MenuController::items`
- `MenuController.php` uses `menu.link_tree` service, depth 2, returns `[{title, url, weight, children[]}]`
- `server/menu.json` mirrors structure for local dev (keep in sync with Drupal menu manually)
- Nav JS replaces static `<ul>` content on page load; falls back to static HTML if fetch fails
- Dropdown: `visibility/opacity` transition, `transition-delay: .2s` on hide, `top: 24px` for overlap

### Auth-Gated Edit Buttons
- `PageController.php` injects `data-drupal-auth="1"` on `<body>` for authenticated users
- Local dev: `Layout.astro` injects `document.body.setAttribute('data-drupal-auth','1')` via `{isDev && <script>}` 
- CSS: `body[data-drupal-auth] .ar-edit-btn { display: inline-flex; }` — single rule controls all buttons
- JS factory: `makeEditBtn(adminUrl, title)` creates a button that opens the modal
- `openModal(url, title)` sets iframe src + updates modal title text dynamically
- Modal is a singleton `<div id="menu-modal">` with an `<iframe>` — close via ×, backdrop click, or Escape
- Block edit URL pattern: `/admin/content/block/{drupal_internal__id}` (not `/block/{id}/edit`)
- Menu edit URL: `/admin/structure/menu/manage/main`

### Drupal Block Content (Footer Contact)
- Block created via drush, type `basic`, admin label: "Home Page - Footer - Contact"
- Block ID: 1 (on sandbox-glazed.lndo.site lando — content, not config, will need manual recreation on new envs)
- Fetch: `GET /jsonapi/block_content/basic?filter[info]=Home%20Page%20-%20Footer%20-%20Contact&fields[block_content--basic]=body,drupal_internal__id`
- JS replaces `address.innerHTML` with `body.processed`, then appends `makeEditBtn('/admin/content/block/${id}', 'Edit Block')`
- Text format: `full_html` (preserves classes like `ar-footer__emergency`)

### Bootstrap CSS Cascade
- Bootstrap CDN is injected at the START of `<head>` by `create-page.js` `rewritePageHtml`
- Our module CSS loads after Bootstrap → wins on equal-specificity rules
- **Exception — FOUC race**: Bootstrap CDN loads async; if it arrives after an initial render with local CSS, it briefly overrides equal-specificity `body` rules. Fix: `!important` on critical `body` properties in `Layout.astro`.
- **Scoping rule**: Astro scoped `<style>` rules won't match JS-created or Drupal-fetched elements (no `data-astro-cid-*`). Any style that needs to reach dynamic content goes in `<style is:global>` in `index.astro`.

### Reusable Patterns (`.ar-editable` + `.ar-edit-btn`)
- `.ar-editable` — `position: relative` container; edit button positions to top-right corner
- `.ar-edit-btn` — generic edit button, hidden by default, shown via `body[data-drupal-auth]`
- All styles for these are in `<style is:global>` in `index.astro`
- To wire a new section: add `class="ar-editable"` + `id`, fetch content from JSON:API, call `makeEditBtn(url, label)`

---

## Session History

### 2026-04-01 — Session 1

**Accomplished:**

- Scaffolded and started the app for the first time
- Dev server started on http://localhost:4322 (port 4321 was taken)
- Built full AlexRenew moodboard demo page matching `homepage1.pdf`
- Added `page2.astro` based on `homepage2.pdf`
- Added "Option 2" / "Option 01" cross-nav links between pages
- Installed as Drupal page module via `3pd astro-forms page --install`

**Bugs fixed in starter kit (`0.starter-astro-forms/create-page.js`):**
1. CSS-only asset copy bug — fixed `jsFiles.length > 0` guard to include `cssFiles`
2. Multi-page support — generator now scans `dist/*/index.html` and generates routes per sub-page
3. Routing backslash escaping — sub-page routes used `\\Drupal\\` instead of `\Drupal\`

### 2026-04-02 — Session 2

**Accomplished:**

**Dynamic Nav**
- Added `GET /api/${APP_SLUG}/menu/:menuName` Express endpoint reading `server/menu.json`
- Added `MenuController.php` to `create-page.js` generator (depth 2, returns children array)
- Added `/api/${appName}/menu/{menu_name}` route to generated `routing.yml`
- Updated `index.astro` nav to fetch from menu API on page load, fall back to static
- Added 1-level dropdown support: hover reveals children, 200ms hide delay, `top: 24px` overlap
- Fixed Astro scoping issue for dropdowns and nav links by moving styles to `<style is:global>`
- Added `server/menu.json` with 6 nav items + sample child under "About Us" for local dev testing

**Auth-Gated Edit Buttons**
- Added `PageController.php` auth injection: `str_replace('<body', '<body data-drupal-auth="1"'` for authenticated users — applied to all page and sub-page methods in generator
- Added `{isDev && <script>}` in `Layout.astro` to simulate auth locally
- Built reusable `makeEditBtn(url, title)` JS factory and `openModal(url, title)` function
- Nav pencil icon opens menu admin in modal with title "Edit Navigation Menu"
- Modal: singleton iframe overlay, close via ×, backdrop, or Escape; title updates per caller

**Footer Contact Block**
- Created Drupal `block_content` (basic type, ID 1) "Home Page - Footer - Contact" via drush
- Footer contact column fetches from JSON:API, renders block body into `<address>`, appends edit button
- Block edit URL confirmed as `/admin/content/block/{id}` (not `/block/{id}/edit`)
- Fixed scoped CSS issue for JS-injected footer content by adding rules to `<style is:global>`

**Bootstrap Cascade Fix**
- Moved Bootstrap CDN injection from `</head>` to `<head>` opening tag in `create-page.js`
- Added `!important` to critical `body` typography in `Layout.astro` to prevent FOUC race with Bootstrap CDN async loading

**Left with modified files (uncommitted):**
- `src/pages/index.astro`
- `src/pages/page2.astro`
- `src/layouts/Layout.astro`
- `server/server.js`
- `server/menu.json` (new)
- `server/db/schema.sql`
- `.ai/LOG.md`
- `.env`
- `CLAUDE.md` (port corrected to 4322)

Also modified in monorepo:
- `0.starter-astro-forms/create-page.js` — MenuController, auth injection, Bootstrap cascade fix, sub-page routing fixes

Run `git status` to review before committing.
