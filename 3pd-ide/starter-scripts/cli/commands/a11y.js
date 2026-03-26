// commands/a11y.js
import { run } from '../shared/exec.js';
import { assertReactApp } from '../shared/paths.js';
import { log } from '../shared/log.js';
import { detectVitePort } from '../shared/vite.js';

export default async function a11y() {
  log.header('3PD Accessibility Audit');

  // Ensure we're inside a React app
  assertReactApp();

  // Auto-detect the running Vite dev server port
  const port = detectVitePort();
  const url = `http://localhost:${port}`;

  try {
    log.info(`Running Pa11y against ${url}...`);
    run(`npx pa11y ${url}`);
    log.success('Accessibility audit completed.');
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
