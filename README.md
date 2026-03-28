# SANDBOX-glazed

Drupal 11 local development environment for the 3PD (third-party developer) micro-frontend integration platform. Micro-frontend apps (React, Astro) are embedded as Drupal blocks via a custom CLI toolkit.

---

## Prerequisites

Install these before anything else:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be running before Lando
- [Lando](https://lando.dev/download/) — v3.x
- [Node.js](https://nodejs.org/) — v20+ (for 3pd CLI tools)
- [Composer](https://getcomposer.org/) — v2.x (optional locally; Lando provides it too)
- Git

---

## First-time setup

### 1. Clone the repo

```bash
git clone git@github.com:sweimer/sandbox-glazed.git
cd sandbox-glazed
```

### 2. Start Lando

```bash
lando start
```

This spins up two services: `appserver` (PHP 8.3 + Apache) and `database` (MariaDB 10.6).

### 3. Install Composer dependencies

```bash
lando composer install
```

### 4. Create settings.php

`settings.php` is gitignored (Drupal security default). Copy the default:

```bash
cp web/sites/default/default.settings.php web/sites/default/settings.php
```

Then append the Lando database block at the bottom of `settings.php`:

```php
if (isset($_ENV['LANDO_APP_NAME'])) {
  $databases['default']['default'] = [
    'database' => 'drupal',
    'username' => 'drupal',
    'password' => 'drupal',
    'host' => 'database',
    'port' => '3306',
    'driver' => 'mysql',
    'prefix' => '',
  ];
}
```

### 5. Import the database

A database dump is included in `db/3pddb5.sql.gz`:

```bash
lando db-import db/3pddb5.sql.gz
```

### 6. Run the cache reset

After a fresh DB import, always run `crx` — do NOT use `lando drush cr` (it hangs):

```bash
lando crx
```

### 7. Open the site

```
http://sandbox-glazed.lndo.site
```

---

## Daily workflow

```bash
# Start the environment
lando start

# Stop the environment
lando stop

# Full cache reset (use this instead of drush cr)
lando crx

# Run drush commands
lando drush <command>

# Run composer commands
lando composer <command>
```

---

## Important: cache clearing

**Always use `lando crx` — never `lando drush cr`.**

`lando drush cr` hangs on this site. Root cause: when the Drupal service container cache is empty, multiple Apache workers race to compile it simultaneously and deadlock.

`lando crx` fixes this by:
1. Wiping the PHP file cache (`files/php/`)
2. Truncating all cache tables in the DB directly
3. Stopping Apache
4. Pre-warming the container via `drush status` (single-threaded, no race)
5. Restarting Apache

Use `lando crx` after:
- `lando rebuild`
- Enabling or installing any Drupal module
- Any time the site hangs or returns errors on first load

---

## Troubleshooting

**URLs not resolving after `lando restart`:**

```bash
lando poweroff && lando start
```

If still broken:

```bash
lando rebuild -y && lando crx
```

**Site loads but shows errors / white screen:**

```bash
lando crx
```

Then hard-refresh the browser (Cmd+Shift+R).

**`lando start` fails — Docker not running:**

Open Docker Desktop and wait for it to fully start before running Lando commands.

---

## Project structure

```
SANDBOX-glazed/
  web/                      Drupal 11 docroot
  3pd-ide/                  Internal workspace — active apps + CLI toolkit
    apps/                   Live micro-frontend apps
    starter-scripts/cli/    3pd CLI source
  db/                       Database dumps
  composer.json
  composer.lock
  .lando.yml
```

### 3pd CLI

The `3pd` command is the toolkit for creating and deploying micro-frontend apps as Drupal blocks.

```bash
cd 3pd-ide
npm install
npm link   # makes `3pd` available globally
```

Key commands:

```bash
3pd astro app <name>              # Create new Astro app
3pd astro module --install        # Build + install as Drupal module/block
3pd astro-forms app <name>        # Create new Astro + Express + SQLite app
3pd astro-forms module --install  # Build + install
3pd react app <name>              # Create new React app
3pd react module --install        # Build + install
3pd help                          # Full command reference
```

---

## Content types on this site

| Machine name                  | Example nodes                              |
|-------------------------------|--------------------------------------------|
| `basic_page_layout_builder`   | nid 6, 10, 11 (Layout Builder, Depot, Stracat) |
| `drag_and_drop_page`          | nid 4 (DXPR)                              |

There is no `page` content type. When building apps that fetch Drupal content, use `basic_page_layout_builder`.

---

## Pantheon (shared dev environment)

A shared Drupal environment is deployed to Pantheon for 3PD developers who don't run Lando locally.

- **Dev URL:** https://dev-3-pd-ide.pantheonsite.io
- **Deploys:** automatically on every push to `main` via GitHub Actions

Do not push broken code to `main` — it deploys directly to the shared Pantheon dev environment.
