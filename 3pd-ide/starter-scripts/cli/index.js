#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { log } from './shared/log.js';

// ------------------------------------------------------------
// Resolve __dirname in ES modules
// ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ------------------------------------------------------------
// IDE ROOT: always /3pd-ide
// ------------------------------------------------------------
const ideRoot = path.resolve(__dirname, '..', '..');

// ------------------------------------------------------------
// Detect internal mode (HUDX vs 3PD)
// ------------------------------------------------------------
const isInternal = fs.existsSync(
  path.join(ideRoot, 'web', 'modules', 'custom')
);

// ------------------------------------------------------------
// CLI Metadata
// ------------------------------------------------------------
program
  .name('3pd')
  .description(chalk.cyan('3PD IDE command-line interface'))
  .version('1.0.0')
  .showHelpAfterError()
  .addHelpCommand(false);

// ------------------------------------------------------------
// ROOT HELP OVERRIDE
// ------------------------------------------------------------
program.helpInformation = function () {
  return `
${chalk.bold('3PD IDE CLI')}
${chalk.gray('---------------------------------------------------------------------')}
Build micro-frontend apps that embed as Drupal blocks via Layout Builder.
Each app is developed independently, then packaged as a Drupal module.

${chalk.bold('WORKFLOW')}
${chalk.gray('---------------------------------------------------------------------')}
${chalk.white('Step 1 — Create')}   3pd <framework> app <name>
                   Scaffolds a new app from the starter template.
                   Run from: 3pd-ide/ root

${chalk.white('Step 2 — Develop')}  cd apps/<name> && npm run dev
                   Start the dev server(s) and build your feature.
                   Edit src/ freely — hot reload is active.

${chalk.white('Step 3 — Package')}  3pd <framework> module
                   Builds the app and packages it as a Drupal module folder.
                   ${chalk.gray('3PD devs: push this folder in your feature branch.')}
                   ${chalk.gray('HUDX internal: use --install instead (see below).')}

${chalk.white('Step 4 — Install')}  3pd <framework> module --install   ${chalk.gray('(HUDX internal only)')}
                   Builds, packages, copies to /web/modules/custom/,
                   uninstalls + reinstalls module, seeds DB from SQLite,
                   clears cache, rebuilds router.
                   Test URL: /hudx-test/<app-name>
                   Requires access to the Drupal repo (/web directory).

${chalk.bold('STARTER KITS')}
${chalk.gray('---------------------------------------------------------------------')}
${chalk.cyan('astro')}        Read-only. Displays content from Drupal JSON:API.
             No backend. No database. Static HTML/CSS/JS module.
             Use when: the app only needs to show CMS content.

${chalk.cyan('astro-forms')} Adds a data layer. Drupal content + form submissions.
             Dev: Express + SQLite (local, app-owned). npm run dev starts both.
             Deployed: form submissions route to Drupal's DB via a generated
             REST controller. No separate server needed on Pantheon/prod.
             Use when: the app needs to collect or store data.

${chalk.yellow('react')}        Full SPA. React + Vite + Express + SQLite.
             Use when: the app needs client-side routing or complex state.

${chalk.magenta('embed')}        Smart iframe wrapper. No build step. No framework.
             Iframes any URL into a Drupal block. Auto-resizes via postMessage.
             Use when: embedding an external or legacy app you don't want to rebuild.

${chalk.yellow('angular')}      (coming soon)

${chalk.bold('COMMANDS')}
${chalk.gray('---------------------------------------------------------------------')}
${chalk.cyan('3pd astro app <name>')}                 Create read-only Astro app
${chalk.cyan('3pd astro module')}                     Package as Drupal module (3PD)
${chalk.cyan('3pd astro module --install')}           Package + install in Drupal (HUDX)

${chalk.cyan('3pd astro-forms app <name>')}           Create Astro + Express + SQLite app
${chalk.cyan('3pd astro-forms module')}               Package as Drupal module (3PD)
${chalk.cyan('3pd astro-forms module --install')}     Package + install in Drupal (HUDX)
${chalk.cyan('3pd astro-forms db pull')}              Pull live data from Drupal/Pantheon into local SQLite

${chalk.green('3pd react app <name>')}                 Create React + Express + SQLite app
${chalk.green('3pd react module')}                     Package as Drupal module (3PD)
${chalk.green('3pd react module --install')}           Package + install in Drupal (HUDX)
${chalk.green('3pd react db pull')}                    Pull live data from Drupal/Pantheon into local SQLite

${chalk.magenta('3pd embed create <name>')}               Create a new smart embed app (configure URL, get snippet)
${chalk.magenta('3pd embed create <name> --url <url>')}   Create and pre-fill the embed URL
${chalk.magenta('3pd embed module')}                      Generate the Drupal block module (3PD)
${chalk.magenta('3pd embed module --install')}            Generate + install in Drupal (HUDX)

${chalk.magenta('3pd styles sync')}                       Generate drupal-dev-styles.css in all apps (dev theme CSS)
${chalk.magenta('3pd styles refresh')}                    Refresh dev CSS/JS for the current app only (run from app dir)
${chalk.magenta('3pd db pull')}                          Pull full Pantheon DB into local Lando (HUDX internal)
${chalk.magenta('3pd list')}                             List apps + installed modules + test route URLs
${chalk.magenta('3pd remove <module>')}                  Uninstall module from Drupal + delete files
${chalk.magenta('3pd remove <module> --delete-app')}     Also delete the app source folder
${chalk.magenta('3pd doctor')}                           Check environment dependencies
${chalk.magenta('3pd validate')}                         Run lint + scan + a11y + tests
${chalk.magenta('3pd help')}                             Show this help message

${chalk.bold('AI ASSISTANT')}
${chalk.gray('---------------------------------------------------------------------')}
${chalk.green('3pd run ai')}                           Start the AI dev assistant for the current app
${chalk.green('3pd run ai --validate')}                Also run lint, security, a11y + tests at Close Session

  Run from inside your app directory. Opens a Claude Code session primed with the
  starter kit's rules and your project's history.

  ${chalk.white('First run')}   Claude scans your app to understand what's been built.
               Approve the file-read prompts — this is how it builds its initial picture.
               It populates .ai/LOG.md with observations, then either walks you through
               setup (new app) or summarizes where things stand (existing app).

  ${chalk.white('Returning')}   Claude reads .ai/LOG.md and opens with a recap of where you left off,
               the current roadmap, and a proposed starting point for today.

  ${chalk.white('Close Session')}   Type this at any time to wrap up. Claude will:
               • Check git status and note uncommitted files
               • Update .ai/LOG.md with today's progress
               • (--validate only) Run 3pd validate and log the results

  ${chalk.gray('.ai/LOG.md  — committed to git. Project memory that travels with the repo.')}
  ${chalk.gray('CLAUDE.md   — generated each session, gitignored. Never commit it.')}

${chalk.bold('3PD vs --install MODE')}
${chalk.gray('---------------------------------------------------------------------')}
${chalk.white('3PD mode')}   (default, no flag)
  For third-party developers who do not have the Drupal codebase.
  Packages the module folder inside the app directory.
  Push it as a feature branch — the HUDX team handles installation.

${chalk.white('--install')} (HUDX internal only)
  Requires /web/modules/custom/ to exist (full Drupal repo).
  Copies module to Drupal, enables it, and clears cache automatically.
  Run from inside an app folder: cd apps/<name> && 3pd <fw> module --install

${chalk.bold('SMART EMBED WORKFLOW — S3 + CLOUDFRONT APPS')}
${chalk.gray('---------------------------------------------------------------------')}
Use this when the child app is hosted on S3 + CloudFront and you need to
inject hudx-resize.js into its HTML files (no AWS CLI access required).

${chalk.white('Step 1 — Create + install the Drupal module')}
  3pd embed create <name> --url <cloudfront-url>
  cd apps/embed---<name>
  3pd embed module --install
  Test at: /hudx-test/embed---<name>  (loads at fallback height until snippet is injected)

${chalk.white('Step 2 — Set up a temp workspace')}
  mkdir -p 3pd-ide/smart-embeds/<name>
  Download all .html files from the S3 bucket folder into that directory.

${chalk.white('Step 3 — Inject hudx-resize.js into the HTML files')}
  cd 3pd-ide/scripts
  node inject-and-sync-s3.js ../smart-embeds/<name> s3://skip
  (The S3 sync will fail — that is expected. Only the local inject step is needed.)

${chalk.white('Step 4 — Upload to S3 via AWS console')}
  Upload all injected .html files + hudx-resize.js from the workspace
  to the correct folder in the S3 bucket.

${chalk.white('Step 5 — Invalidate CloudFront')}
  Console → CloudFront → Distributions → <ID> → Invalidations → Create → /*
  Wait ~30s, then hard refresh (Cmd+Shift+R) the Drupal test page.

${chalk.gray('POC distribution: E34CQM3GCYZN5R  (d1xzjd7z8lcp8a.cloudfront.net)')}
${chalk.gray('S3 bucket:        sites.hudexchange.info/trainings-poc/trainings/')}
`;
};

// ------------------------------------------------------------
// HELP COMMAND
// ------------------------------------------------------------
program
  .command('help')
  .description('Show 3PD IDE CLI help')
  .action(() => console.log(program.helpInformation()));

// ------------------------------------------------------------
// REACT NAMESPACE
// ------------------------------------------------------------
const react = program
  .command('react')
  .description('React commands');

// Custom help for `3pd react help`
react.helpInformation = function () {
  return `
${chalk.bold('React Commands')}
${chalk.gray('--------------')}

${chalk.bold('Usage:')}
  3pd react <command> [options]

${chalk.bold('Commands:')}
  ${chalk.green('app <name>')}                 Create a new 3PD IDE React application
  ${chalk.green('module')}                     Generate a Drupal module (3PD mode)
  ${chalk.green('module --install')}           Generate AND install the module (internal HUDX mode)
  ${chalk.green('db pull')}                    Pull live data from Drupal/Pantheon into local SQLite

${chalk.bold('Examples:')}
  3pd react app my-app
  cd apps/my-app
  3pd react db pull
  3pd react module
  3pd react module --install
`;
};

react
  .command('app <name...>')
  .description('Create a new 3PD IDE React application')
  .action(async (name) => {
    const cmd = await import('./commands/react-app.js');
    const folderName = Array.isArray(name) ? name.join(' ') : name;
    cmd.default(folderName, { ideRoot, internal: isInternal });
  });

const reactModuleCmd = react
  .command('module')
  .description('Generate a Drupal module from the current React app')
  .option('--install', 'Install the generated module into Drupal (internal HUDX use only)')
  .option('--internal', 'Alias for --install')
  .action(async (options) => {
    const cmd = await import('./commands/react-module.js');
    const internal = options.install || options.internal || isInternal;
    cmd.default({ ideRoot, internal });
  });

// Custom help for `3pd react module --help`
reactModuleCmd.helpInformation = function () {
  return `
${chalk.bold('Generate a Drupal module from the current React app.')}

${chalk.bold('Usage:')}
  3pd react module [options]

${chalk.bold('Options:')}
  --install       Install the generated module into Drupal (internal HUDX use only)
  --internal      Alias for --install
  -h, --help      Show help

${chalk.bold('Examples:')}
  3pd react module
  3pd react module --install
`;
};

const reactDb = react
  .command('db')
  .description('Database utilities for React apps');

reactDb
  .command('pull')
  .description('Pull live data from Drupal/Pantheon into local SQLite')
  .action(async () => {
    const cmd = await import('./commands/react-db-pull.js');
    cmd.default({ ideRoot });
  });

// ------------------------------------------------------------
// ASTRO NAMESPACE
// ------------------------------------------------------------
const astro = program
  .command('astro')
  .description('Astro commands');

astro
  .command('app <name...>')
  .description('Create a new Astro application')
  .action(async (name) => {
    const cmd = await import('./commands/astro-app.js');
    const folderName = Array.isArray(name) ? name.join(' ') : name;
    cmd.default(folderName, { ideRoot, internal: isInternal });
  });

astro
  .command('module')
  .description('Generate a Drupal module from the current Astro app')
  .option('--install', 'Install the generated module into Drupal (internal HUDX use only)')
  .option('--internal', 'Alias for --install')
  .action(async (options) => {
    const cmd = await import('./commands/astro-module.js');
    const internal = options.install || options.internal || isInternal;
    cmd.default({ ideRoot, internal });
  });

// ------------------------------------------------------------
// ASTRO-FORMS NAMESPACE
// ------------------------------------------------------------
const astroForms = program
  .command('astro-forms')
  .description('Astro + Express + SQLite commands (apps with forms/data)');

astroForms
  .command('app <name...>')
  .description('Create a new Astro Forms application')
  .action(async (name) => {
    const cmd = await import('./commands/astro-forms-app.js');
    const folderName = Array.isArray(name) ? name.join(' ') : name;
    cmd.default(folderName, { ideRoot, internal: isInternal });
  });

astroForms
  .command('module')
  .description('Generate a Drupal module from the current Astro Forms app')
  .option('--install', 'Install the generated module into Drupal (internal HUDX use only)')
  .option('--internal', 'Alias for --install')
  .action(async (options) => {
    const cmd = await import('./commands/astro-forms-module.js');
    const internal = options.install || options.internal || isInternal;
    cmd.default({ ideRoot, internal });
  });

const astroFormsDb = astroForms
  .command('db')
  .description('Database utilities for Astro Forms apps');

astroFormsDb
  .command('pull')
  .description('Pull live data from Drupal/Pantheon into local SQLite')
  .action(async () => {
    const cmd = await import('./commands/astro-forms-db-pull.js');
    cmd.default({ ideRoot });
  });

// ------------------------------------------------------------
// DB NAMESPACE (internal utilities)
// ------------------------------------------------------------
const db = program
  .command('db')
  .description('Database utilities');

db
  .command('pull')
  .description('Pull full Pantheon DB into local Lando (HUDX internal only)')
  .action(async () => {
    const cmd = await import('./commands/db-pull.js');
    cmd.default({ ideRoot });
  });

// ------------------------------------------------------------
// EMBED NAMESPACE
// ------------------------------------------------------------
const embed = program
  .command('embed')
  .description('Smart embed commands — iframe any URL as a resizable Drupal block');

embed.helpInformation = function () {
  return `
${chalk.bold('Smart Embed Commands')}
${chalk.gray('--------------------')}

${chalk.bold('Usage:')}
  3pd embed <command> [options]

${chalk.bold('Commands:')}
  ${chalk.magenta('create <name>')}              Create a new smart embed app folder
  ${chalk.magenta('create <name> --url <url>')}  Create and pre-fill the embed URL
  ${chalk.magenta('module')}                     Generate a Drupal block module (3PD mode)
  ${chalk.magenta('module --install')}           Generate AND install the module (HUDX internal)

${chalk.bold('How it works:')}
  1. create           → makes embed---<name>/ with embed.config.json + snippet/hudx-resize.js
  2. cd apps/embed---<name>
  3. Edit embed.config.json to confirm URL and fallbackHeight (or pass --url at create time)
  4. module --install → generates the Drupal block module and installs it
  5. Test at: /hudx-test/embed---<name>

  For S3 + CloudFront apps (inject hudx-resize.js, upload, invalidate):
  See: ${chalk.bold('3pd help')}

${chalk.bold('Example:')}
  3pd embed create sc-training --url https://example.cloudfront.net/trainings/sc-tool/
  cd apps/embed---sc-training
  3pd embed module --install
`;
};

embed
  .command('create <name...>')
  .description('Create a new smart embed app')
  .option('--url <url>', 'URL to embed (can also be set in embed.config.json later)')
  .action(async (name, options) => {
    const cmd = await import('./commands/embed-create.js');
    const folderName = Array.isArray(name) ? name.join(' ') : name;
    cmd.default(folderName, { ideRoot, url: options.url });
  });

embed
  .command('module')
  .description('Generate a Drupal block module from the current embed app')
  .option('--install', 'Install the generated module into Drupal (internal HUDX use only)')
  .option('--internal', 'Alias for --install')
  .action(async (options) => {
    const cmd = await import('./commands/embed-module.js');
    const internal = options.install || options.internal || isInternal;
    cmd.default({ ideRoot, internal });
  });

// ------------------------------------------------------------
// ANGULAR NAMESPACE
// ------------------------------------------------------------
const angular = program
  .command('angular')
  .description('Angular commands');

angular
  .command('app <name...>')
  .description('(placeholder) Create a new Angular application')
  .action(() => log.warn('Angular app generation not implemented yet.'));

angular
  .command('module')
  .description('(placeholder) Generate an Angular module')
  .action(() => log.warn('Angular module generation not implemented yet.'));

// ------------------------------------------------------------
// UTILITY COMMANDS
// ------------------------------------------------------------
program
  .command('list')
  .description('List apps, installed modules, and test route URLs')
  .action(async () => {
    const cmd = await import('./commands/list.js');
    cmd.default({ ideRoot });
  });

program
  .command('remove <module>')
  .description('Uninstall a Drupal module and remove its files')
  .option('--delete-app', 'Also delete the app source folder from apps/')
  .action(async (moduleName, options) => {
    const cmd = await import('./commands/remove.js');
    cmd.default(moduleName, { ideRoot, deleteApp: options.deleteApp });
  });

program
  .command('doctor')
  .description('Run environment diagnostics')
  .action(async () => {
    const cmd = await import('./commands/doctor.js');
    cmd.default({ ideRoot, internal: isInternal });
  });

// ------------------------------------------------------------
// NEW QUALITY COMMANDS
// ------------------------------------------------------------
program
  .command('lint')
  .description('Run ESLint + Prettier')
  .action(async () => {
    const cmd = await import('./commands/lint.js');
    cmd.default();
  });

program
  .command('scan')
  .description('Run Trivy security scan')
  .action(async () => {
    const cmd = await import('./commands/scan.js');
    cmd.default();
  });

program
  .command('a11y')
  .description('Run Pa11y accessibility audit')
  .action(async () => {
    const cmd = await import('./commands/a11y.js');
    cmd.default();
  });

program
  .command('test')
  .description('Run unit tests (Vitest/Jest)')
  .action(async () => {
    const cmd = await import('./commands/test.js');
    cmd.default();
  });

program
  .command('validate')
  .description('Run lint, scan, a11y, and test')
  .action(async () => {
    const cmd = await import('./commands/validate.js');
    cmd.default();
  });

// ------------------------------------------------------------
// STYLES NAMESPACE
// ------------------------------------------------------------
const styles = program
  .command('styles')
  .description('Theme style utilities');

styles
  .command('sync')
  .description('Generate public/drupal-dev-styles.css in all apps from local Drupal theme (or Pantheon URL)')
  .action(async () => {
    const cmd = await import('./commands/styles-sync.js');
    cmd.default({ ideRoot });
  });

styles
  .command('refresh')
  .description('Refresh drupal-dev-styles.css + drupal-dev-scripts.js for the current app only')
  .action(async () => {
    const cmd = await import('./commands/styles-refresh.js');
    cmd.default({ ideRoot });
  });

// ------------------------------------------------------------
// RUN NAMESPACE (AI assistant + future run commands)
// ------------------------------------------------------------
const run = program
  .command('run')
  .description('Run assistant and utility processes');

run
  .command('ai')
  .description('Start the AI dev assistant for the current app')
  .option('--validate', 'Run 3pd validate (lint, security, a11y, tests) at Close Session')
  .action(async (options) => {
    const cmd = await import('./commands/ai-run.js');
    cmd.default({ ideRoot, validate: !!options.validate });
  });

// ------------------------------------------------------------
// Parse CLI arguments
// ------------------------------------------------------------
program.parse();
