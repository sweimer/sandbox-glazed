// shared/exec.js
import { execSync } from 'child_process';
import chalk from 'chalk';

export function run(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
  } catch (err) {
    console.error(chalk.red(`Command failed: ${cmd}`));
    throw err;
  }
}
