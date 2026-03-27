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
${chalk.gray('------------')}

${chalk.bold('Usage:')}
  3pd <command> [options]

${chalk.bold('React Commands:')}
  ${chalk.green('3pd react app <name>')}            Create a new 3PD IDE React application
  ${chalk.green('3pd react module')}                Generate a Drupal module (3PD mode)
  ${chalk.green('3pd react module --install')}      Generate AND install the module (internal HUDX mode)

${chalk.bold('Astro Commands:')}
  ${chalk.cyan('3pd astro app <name>')}             Create a new Astro application (read-only, no backend)
  ${chalk.cyan('3pd astro module')}                 Generate a Drupal module (3PD mode)
  ${chalk.cyan('3pd astro module --install')}       Generate AND install the module (internal HUDX mode)

${chalk.bold('Astro Forms Commands:')}
  ${chalk.cyan('3pd astro-forms app <name>')}       Create a new Astro + Express + SQLite application
  ${chalk.cyan('3pd astro-forms module')}           Generate a Drupal module (3PD mode)
  ${chalk.cyan('3pd astro-forms module --install')} Generate AND install the module (internal HUDX mode)

${chalk.bold('Angular Commands:')}
  ${chalk.yellow('3pd angular app <name>')}          (placeholder)
  ${chalk.yellow('3pd angular module')}              (placeholder)

${chalk.bold('Utility Commands:')}
  ${chalk.magenta('3pd list')}                       List available apps and modules
  ${chalk.magenta('3pd doctor')}                     Run environment diagnostics
  ${chalk.magenta('3pd lint')}                       Run ESLint + Prettier
  ${chalk.magenta('3pd scan')}                       Run Trivy security scan
  ${chalk.magenta('3pd a11y')}                       Run Pa11y accessibility audit
  ${chalk.magenta('3pd test')}                       Run unit tests (Vitest/Jest)
  ${chalk.magenta('3pd validate')}                   Run lint, scan, a11y, and test
  ${chalk.magenta('3pd help')}                       Show this help message

${chalk.bold('Examples:')}
  3pd react app my-app
  cd apps/my-app
  3pd react module
  3pd react module --install
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

${chalk.bold('Examples:')}
  3pd react app my-app
  cd apps/my-app
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
  .description('List available apps and modules')
  .action(async () => {
    const cmd = await import('./commands/list.js');
    cmd.default({ ideRoot });
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
// Parse CLI arguments
// ------------------------------------------------------------
program.parse();
