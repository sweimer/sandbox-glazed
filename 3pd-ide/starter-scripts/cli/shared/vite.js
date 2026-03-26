// shared/vite.js
import { execSync } from 'child_process';

export function detectVitePort() {
  try {
    const output = execSync(
      'lsof -iTCP -sTCP:LISTEN -P | grep vite',
      { encoding: 'utf8' }
    );

    const match = output.match(/:(\d+)\s+\(LISTEN\)/);

    if (match) {
      return Number(match[1]);
    }
  } catch {
    // No vite process found
  }

  return 5173; // default Vite port
}
