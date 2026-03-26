# HUDX Decoupled App Development Environment (`/apps`)

The `/apps` directory is the HUDX-approved development environment for building
decoupled applications using React (and soon Angular, Svelte, and other
frameworks). This environment is designed for both internal HUDX developers and
third-party developers (3PDs) who do not have direct access to Drupal.

This directory provides:

- Shared HUDX CSS and JS assets
- Starter scripts for scaffolding new apps
- A consistent development workflow
- A safe, isolated environment for 3PDs
- Automatic wiring to the HUDX Drupal API
- A module generator for producing Drupal modules

---

## 📁 Directory Structure

```
/apps
  /css
    hudx.css              ← Shared HUDX POC CSS
  /js
    index.js               ← Shared HUDX POC JS
  /starter-scripts
    react-app.js    ← React app scaffolding script
    /react
      fuse-module.js    ← Template for generating Drupal modules
  /<your-app-name>        ← Generated apps appear here
```

---

## 🎨 Shared HUDX Assets

The `/css` and `/js` directories contain shared HUDX assets that every app can
import. These are POC placeholders and will later be replaced by the compiled
HUDX theme during the Lando build process.

Apps automatically import:

```
/apps/css/hudx.css
/apps/js/index.js
```

---

## ⚛️ React Starter Script

To scaffold a new React app:

```
cd apps/starter-scripts
node react-app.js
```

You will be prompted for an app name. The script will generate:

- A new React app under `/apps/<app-name>/`
- A `/styleguide` page
- An `/api` reference page
- A `.env` file with the Drupal API base URL
- Routing and navigation
- A HUDX README
- A copy of `fuse-module.js`

See:
`/apps/starter-scripts/reactappstarterREADME.md`

---

## 🧱 Drupal Module Generator

Every generated app includes:

```
fuse-module.js
```

Running this script:

```
node fuse-module.js
```

Produces a fully structured Drupal module containing:

- `.info.yml`
- `.libraries.yml`
- Block plugin
- Twig template
- React build output (`/dist`)

Internal HUDX developers can test modules locally.
3PD developers can commit the generated module and push their branch.
CI/CD will install and validate the module automatically.

---

## 🔒 3PD Isolation Model

3PD developers:

- Only work inside `/apps/<their-app>/`
- Do not access Drupal
- Do not modify `/web`
- Do not modify other apps
- Rely on CI/CD for module installation and preview environments

This ensures security, governance, and consistency across all vendors.

---

## 🚀 Roadmap

- Angular starter script
- Svelte starter script
- Vue starter script
- Real HUDX theme asset exposure
- OAuth-secured API access
- CI/CD preview environments
- Workspace isolation for vendors

---

HUDX is evolving into a multi-framework, multi-vendor decoupled platform.
This `/apps` environment is the foundation.
