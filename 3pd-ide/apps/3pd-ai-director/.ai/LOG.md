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
Table of all submitted intake requests (name, email, summary, route, date). Persisted to SQLite.

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
10. [ ] Requests tab — "What we recommended" column (route label, human-readable)
11. [ ] Requests tab — Status column with editable select (Needs Review, Needs Review 2, Needs Review 3, Declined, Approved) — requires DB column + PATCH endpoint
12. [ ] Deploy to Pantheon (requires ANTHROPIC_API_KEY in Pantheon Secrets — see PROMPT.txt §13)
13. [ ] Test with real 3PD users post-demo

---

## Open Questions

- Should the status column (roadmap #11) persist per-request in the SQLite DB, or is session-only state acceptable for the admin view?
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
