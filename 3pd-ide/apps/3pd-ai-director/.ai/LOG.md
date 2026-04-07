# Project LOG — 3pd-ai-director

Framework: React + Vite + Express + SQLite
Created: 2026-04-02

---

## Current Status

**3PD Intake Director** — a conversational AI intake tool that qualifies 3PD developers through a series of questions and routes them to the right HUDX build path. Built on Claude Haiku via the Anthropic SDK.

The app is substantially complete and deployed as a Drupal module:

**Intake flow:**
- Qualifies users on goal, skill level, and data needs before routing
- Asks for name, email, and (for starter kit routes) app name
- Probes data structure needs before committing to low-code — prevents misrouting brochure content vs. structured Drupal data

**Routes:**
- `no-code` → Layout Builder (no dev background, OR content needs to be structured Drupal data)
- `low-code` → AI Markup Builder (low-mid dev, brochure-style content only)
- `pro-react` → React Starter Kit
- `pro-angular` → Angular Starter Kit (coming soon, no link)
- `pro-astro-static` → Astro Static Starter Kit (display only, no forms)
- `pro-astro` → Astro Forms Starter Kit (forms/data, or Vue/Svelte/Vanilla JS devs)
- `embed-request` → Embed Request form

**Result card (starter kit routes):**
4 numbered copyable blocks: clone repo → scaffold app (with app name baked in) → launch AI assistant → paste kickoff prompt. The kickoff prompt is AI-generated from the intake conversation and includes name, email, goal, features, constraints, and a suggested first task.

**Requests tab:**
Table of all submitted intake requests: #, name, email, what they want (summary), what we recommended (route pill), starter prompt (truncated with Copy button), date, status. Status is editable inline (color-coded select: Needs Review / Needs Review 2 / Needs Review 3 / Declined / Approved), persisted via PATCH endpoint. All data persisted to SQLite.

**Server:** Express + SQLite, Anthropic API (claude-haiku-4-5-20251001), ANTHROPIC_API_KEY via env var.

---

## Roadmap

1. [x] Core intake flow with qualifying questions
2. [x] Route definitions — no-code, low-code, pro-react, pro-angular, pro-astro-static, pro-astro, embed-request
3. [x] Framework routing — React/Angular/Astro/Vue/Svelte/Vanilla JS
4. [x] Data needs probing before low-code routing
5. [x] App name collection for starter kit routes
6. [x] SUBMIT tag with route, name, email, app_name, summary fields
7. [x] STARTER_PROMPT block — AI-generated project brief for starter kit handoff
8. [x] Result card — 4 copyable blocks (clone, scaffold, launch AI, kickoff prompt)
9. [x] Requests tab with SQLite persistence
10. [x] Requests tab — "What we recommended" column (route label, color-coded pill)
11. [x] Requests tab — Status column with editable inline select, PATCH endpoint, DB column
12. [x] Requests tab — Prompt column with truncated display + Copy button
13. [x] Director routing — lettered options (A/B/C/D) for all decision-point questions
14. [x] Default routing — unknown/unsure defaults to pro-astro (Astro Forms), not a clarifying loop
15. [x] PHP ChatController — max_tokens 2048, STARTER_PROMPT parsing, app_name extraction
16. [x] create-module.js system prompt synced with chat.js (was significantly out of date)
17. [ ] Deploy to Pantheon (requires ANTHROPIC_API_KEY in Pantheon Secrets — see PROMPT.txt §13)
18. [ ] Test with real 3PD users post-demo

---

## Open Questions

- Does the Pantheon Express server need a keep-alive / health check for the Anthropic API connection?
- Should `pro-angular` show any interim resource (docs, contact form) while the starter kit is coming soon?

---

## Backlog

- Consider streaming Claude response for faster perceived intake speed
- Consider upgrading model from Haiku to Sonnet for higher-quality starter prompts
- Add conversation replay to the Requests tab (expand row to show full chat transcript)
- Add CSV export for the Requests table

---

## Session History

### 2026-04-02 — Session 1 (Initial build)
App built from scratch. Core intake flow, SUBMIT tag parsing, result card, Requests tab, SQLite persistence. Deployed as Drupal module.

### 2026-04-07 — Session 3 (Requests tab, routing fixes, PHP controller sync)
- Added Requests tab columns: route pill (What we recommended), starter prompt with Copy button (Prompt), inline status select with PATCH endpoint and DB column
- Director routing: all decision-point questions now use lettered A/B/C/D options
- Unknown/unsure framework now defaults to pro-astro instead of open-ended clarifying loop; framework question lists Astro/Vue/Svelte/Vanilla as option A
- Strengthened system prompt: app_name and STARTER_PROMPT block marked required with explicit RULES entries
- Fixed PHP ChatController in create-module.js: max_tokens 1024→2048, added STARTER_PROMPT block parsing, app_name extraction from SUBMIT tag
- Fixed RequestsController::store() to save starter_prompt column
- Synced create-module.js SYSTEM_PROMPT with chat.js (was still the old simplified 5-route version)
- All changes deployed via --install, committed, pushed.

### 2026-04-07 — Session 2 (Director overhaul)
- Added app name as intake question for starter kit routes
- Extended SUBMIT tag with `app_name` field
- Added `pro-angular`, `pro-astro-static` routes; framework question expanded to React/Angular/Astro/Vue/Svelte/Vanilla JS
- Vue/Svelte/Vanilla JS routed to Astro Forms
- `no-code` route: added structured data trigger (not just skill level)
- `low-code` route: scoped to brochure-style, one-off content only
- Added intake step 3: data needs probing question before committing to low-code
- Result card: replaced static setup steps + single prompt box with 4 dynamic copyable blocks (clone, scaffold, launch AI, kickoff prompt), all pre-filled with actual app name
- STARTER_PROMPT instruction expanded: now includes name, email, goal, features, constraints, framework background, and a concrete first task
- Requests tab Status/Recommended columns requested but not built — halted for demo
- Committed to main.
