# HUDX React Starter Script

The HUDX React starter script scaffolds a fully configured, Vite‑powered decoupled HUDX app inside the `/apps` directory. It is designed for both internal HUDX developers and third‑party developers (3PDs) contributing to the HUDX platform.

This script uses a **manual Vite scaffold** to ensure:

- zero prompts
- zero auto‑install
- zero auto‑run
- zero race conditions
- 100% reproducibility

It is the foundation of the HUDX multi‑framework decoupled ecosystem.

---

# 🧭 HUDX React Command Glossary (Quick Reference)

# 1. Scaffold a new HUDX React app
cd apps/starter-scripts
node react-app.js

# 2. Enter your newly created app
cd ../<app-name> (ie react-poc-08)

# 3. Run the dev server
cd into newly create app
npm run dev

# 4. Build the React app (optional — module generator runs this automatically)
npm run build

# 5. Generate the Drupal module
node fuse-module.js

Are you a 3rd Party App developer? (y/n): y (unless you are part of internal hudx team)

# 6. (Internal HUDX only) Enable the module in Drupal
lando ssh -c "cd /app/drupal && drush en hudx_<app_name> -y"

# 7. (Internal HUDX only) Clear Drupal caches
lando ssh -c "cd /app/drupal && drush cr"

# 8. Place the block in Drupal
# Navigate in the UI:
# Structure → Block Layout → Place Block

## 🚀 Usage

From inside:

```
/apps/starter-scripts
```

Run:

```
node react-app.js
```

react-poc-08

npm run dev

You will be prompted for an app name (e.g., `Acme Calculator`).

The script generates:

```
/apps/<app-name>/
```

---

## 📦 What the Script Creates

### ✔ A Vite‑powered React app
Created using a **manual scaffold** (not CRA, not `npm create vite`).
This ensures predictable, stable output across all environments.

### ✔ Shared HUDX assets wired automatically
Every new app imports the shared HUDX theme:

```
@hudx/hudx.css
@hudxjs/index.js
```

These are resolved via Vite aliases:

```
@hudx   → /apps/css
@hudxjs → /apps/js
```

### ✔ `/pages` directory with HUDX starter pages
The script generates:

- `Home.jsx`
- `StyleGuide.jsx`
- `ApiReference.jsx`

These pages demonstrate HUDX styling, routing, and API usage.

### ✔ HUDX routing + navigation
`App.jsx` is replaced with a HUDX router:

- Home
- Style Guide
- API Reference

### ✔ `.env` file
Contains:

```
VITE_DRUPAL_API=http://sandbox.lndo.site/jsonapi
```

Used by the API Reference page to demonstrate JSON:API calls.

### ✔ Vite config with HUDX aliases
`vite.config.js` is generated with HUDX‑specific aliasing and plugin configuration.

### ✔ HUDX‑ready project structure
The script creates:

```
src/
  pages/
  components/
  hooks/
  utils/
```

This gives 3PD developers a clean, opinionated structure aligned with HUDX governance.

---

## 🧱 Generating the Drupal Module

Inside your new app:

```
node fuse-module.js
```

This produces a Drupal module containing:

- `.info.yml`
- `.libraries.yml`
- Block plugin
- Twig template
- React build output (`/dist`)

### Internal HUDX developers
Can test locally using Lando.

### Third‑party developers
Commit the generated module to their branch.
HUDX CI/CD will:

- install the module
- validate it
- run governance checks
- attach it to the HUDX build

---

## 🧪 POC Notes

This starter script currently uses placeholder HUDX CSS/JS.
These will be replaced by real HUDX design system assets during the Lando build process.

---

## 🛣️ Roadmap

- HUDX design tokens
- HUDX component library
- Authenticated API examples
- Angular starter script
- Svelte starter script
- Vue starter script
- HUDX CLI (`create-hudx-app`)
- Governance validator
- Module linter
- Workspace isolation for 3PD vendors

---

This script is the backbone of the HUDX multi‑framework decoupled platform — a predictable, governed, scalable foundation for internal and external app development.
