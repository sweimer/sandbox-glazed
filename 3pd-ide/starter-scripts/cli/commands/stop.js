/**
 * 3pd stop
 *
 * Stops the dev server(s) for the current app.
 * Reads PORT (Express) and DEV_PORT (Vite/Astro) from .env and kills any
 * process listening on those ports.
 *
 * Works for React and Astro Forms apps.
 * Run from inside an app directory: cd apps/react---my-app && 3pd stop
 *
 * Safe to run when nothing is running — reports cleanly and exits.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { log } from '../shared/log.js';

function readPorts(cwd) {
  const envPath = path.join(cwd, '.env');
  if (!fs.existsSync(envPath)) return null;
  const env     = fs.readFileSync(envPath, 'utf8');
  const port    = env.match(/^PORT=(\d+)/m);
  const devPort = env.match(/^DEV_PORT=(\d+)/m);
  return {
    expressPort: port    ? parseInt(port[1])    : null,
    vitePort:    devPort ? parseInt(devPort[1]) : null,
  };
}

/**
 * Kill all processes listening on a given port.
 * Returns true if anything was killed, false if the port was already free.
 */
function killPort(port) {
  try {
    const raw = execSync(`lsof -ti:${port}`, { stdio: 'pipe' }).toString().trim();
    if (!raw) return false;

    const pids = raw.split('\n').map(Number).filter(Boolean);
    let killed = false;

    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGTERM');
        killed = true;
      } catch {
        // PID already gone — fine
      }
    }

    return killed;
  } catch {
    // lsof exits non-zero when no process is found — that is not an error
    return false;
  }
}

export default function stop() {
  const cwd     = process.cwd();
  const appName = path.basename(cwd);

  const ports = readPorts(cwd);
  if (!ports) {
    log.error('No .env found. Run this command from inside an app directory.');
    process.exit(1);
  }

  const { expressPort, vitePort } = ports;

  if (!expressPort && !vitePort) {
    log.warn('No PORT or DEV_PORT found in .env — nothing to stop.');
    process.exit(0);
  }

  log.header(`Stopping ${appName}`);

  let stopped = 0;

  if (expressPort) {
    const killed = killPort(expressPort);
    if (killed) {
      log.success(`Stopped Express  →  :${expressPort}`);
      stopped++;
    } else {
      log.dim(`Nothing on :${expressPort} (Express)`);
    }
  }

  if (vitePort) {
    const killed = killPort(vitePort);
    if (killed) {
      log.success(`Stopped Vite     →  :${vitePort}`);
      stopped++;
    } else {
      log.dim(`Nothing on :${vitePort} (Vite/Astro)`);
    }
  }

  console.log('');
  if (stopped === 0) {
    log.info('No servers were running.');
  } else {
    log.success(`Done — ${stopped} server${stopped > 1 ? 's' : ''} stopped.`);
  }
}
