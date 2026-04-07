# Project LOG — 3pd-ai-coder

Framework: React + Vite + Express + SQLite
Created: 2026-04-07

---

## Current Status

**Claude Markup Builder** — a developer/editor tool for generating accessible Drupal-ready HTML/CSS markup via Claude AI.

The app is substantially complete and functional:
- Prompt form (title + prompt) → calls Claude Haiku via Express → returns markup
- Inline editable markup output with live preview toggle
- Copy-to-clipboard button
- "Create Page in Drupal" button — uses JSON:API + CSRF token to create a `node--page`, saves URL back to history
- History sidebar with load/delete per item, node_url links for created pages
- SQLite `history` table: `id, title, prompt, markup, node_url, created_at`
- Express routes: `POST /generate`, `GET /history`, `PATCH /history/:id`, `DELETE /history/:id`
- `@anthropic-ai/sdk` integrated, model: `claude-haiku-4-5-20251001`

---

## Roadmap

1. [x] Define the app's purpose and data model
2. [x] Build out the UI in src/pages/Home.jsx
3. [x] Customize Express routes (generate.js, history.js — no submissions.js needed)
4. [ ] Write a custom `create-module.js` for Drupal packaging (history table, GenerateController, HistoryController)
5. [ ] Run `3pd react module` to package for Drupal

---

## Open Questions

- Does `ANTHROPIC_API_KEY` need to be stored as a Pantheon secret for production? (See PROMPT.txt §13 — yes, Pantheon Secrets dashboard)
- Does `VITE_DRUPAL_BASE_URL` need a Vite proxy for local dev to avoid CORS? (See PROMPT.txt §14)
- Should the "Create Page in Drupal" feature work in Drupal-embedded mode (production), or is it dev-only?

---

## Backlog

- Consider streaming Claude response instead of waiting for full completion
- Consider upgrading model from Haiku to Sonnet for higher-quality output
- Add a "regenerate" button that re-runs the same prompt
- Add title-based search/filter on history list

---

## Session History

### 2026-04-07 — Session 1 (First Run Scan + Director Routing Update)

First-run scan performed. App found to be substantially complete (not a clean scaffold).
LOG populated with observed current state, roadmap updated to reflect real progress.

Discussed the AI Director's no-code vs. low-code routing logic. Current system prompt only
routed `no-code` based on skill level, missing the structured-data dimension entirely.
Updated `apps/3pd-ai-director/server/routes/chat.js`:
- `no-code` now triggers on *either* no dev background *or* content that needs to be
  structured Drupal data (views, references, recurring editor updates)
- `low-code` explicitly scoped to brochure/one-off content that won't need to be queried
- Intake flow now requires a data-needs probe question before committing to `low-code`

Left with the following uncommitted files in-flight — run `git status` to review:
- `apps/3pd-ai-director/server/routes/chat.js` (routing logic update — key change this session)
- `apps/3pd-ai-coder/.ai/LOG.md` (this LOG — new, untracked)
- Various pre-existing modified files in 3pd-ai-director dist/, react---3pd-depot, etc.

---