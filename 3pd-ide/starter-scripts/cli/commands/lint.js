// commands/lint.js
import { run } from '../shared/exec.js';
import { assertReactApp } from '../shared/paths.js';
import { log } from '../shared/log.js';
import { execSync } from 'child_process';

function assertLintToolsInstalled() {
  try {
    execSync('eslint --version', { stdio: 'ignore' });
  } catch {
    log.error('ESLint is not installed in this project.');
    log.info('Install it with: npm install --save-dev eslint');
    process.exit(1);
  }

  try {
    execSync('prettier --version', { stdio: 'ignore' });
  } catch {
    log.error('Prettier is not installed in this project.');
    log.info('Install it with: npm install --save-dev prettier');
    process.exit(1);
  }
}

export default async function lint() {
  log.header('3PD Lint');

  assertReactApp();
  assertLintToolsInstalled();

  try {
    log.info('Running ESLint...');
    run('eslint . --ext .js,.jsx,.ts,.tsx');

    log.info('Running Prettier check...');
    run('prettier --check .');

    log.success('Linting completed successfully.');
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
