// commands/validate.js
import lint from './lint.js';
import scan from './scan.js';
import a11y from './a11y.js';
import test from './test.js';
import { logHeader, logSuccess, logError } from '../utils/log.js';

export default async function validate() {
  logHeader('3PD Full Validation');

  try {
    await lint();
    await scan();
    await a11y();
    await test();

    logSuccess('All validations passed.');
  } catch (err) {
    logError(err.message);
    process.exit(1);
  }
}
