// shared/paths.js
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function assertReactApp() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red('Not inside a React app.'));
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.dependencies?.react && !pkg.devDependencies?.react) {
    console.error(chalk.red('This folder does not appear to be a React app.'));
    process.exit(1);
  }
}
