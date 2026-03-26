// commands/test.js
import { run } from '../utils/exec.js';
import { assertReactApp } from '../utils/paths.js';
import { logHeader, logStep, logSuccess, logError } from '../utils/log.js';
import fs from 'fs';

export default async function test() {
  logHeader('3PD Unit Tests');

  assertReactApp();

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  try {
    if (deps.vitest) {
      logStep('Running Vitest...');
      run('npx vitest run');
    } else if (deps.jest) {
      logStep('Running Jest...');
      run('npx jest');
    } else {
      logError('No test runner found (Vitest or Jest).');
      process.exit(1);
    }

    logSuccess('Tests completed.');
  } catch (err) {
    logError(err.message);
    process.exit(1);
  }
}
