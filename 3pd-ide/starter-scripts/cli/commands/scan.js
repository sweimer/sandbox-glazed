// commands/scan.js
import { run } from '../shared/exec.js';
import { assertReactApp } from '../shared/paths.js';
import { log } from '../shared/log.js';
import { detectVitePort } from '../shared/vite.js';
import { execSync } from 'child_process';

function assertTrivyInstalled() {
  try {
    execSync('trivy --version', { stdio: 'ignore' });
  } catch {
    log.error('Trivy is not installed on this system.');
    log.info('Install it with: brew install aquasecurity/trivy/trivy');
    process.exit(1);
  }
}

export default async function scan() {
  log.header('3PD Security Scan');

  assertReactApp();
  assertTrivyInstalled();

  const port = detectVitePort();
  log.info(`Detected Vite dev server on port ${port}`);

  try {
    log.info('Running Trivy filesystem scan...');
    run('trivy fs .');
    log.success('Security scan completed.');
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
