// commands/validate.js
import lint from './lint.js';
import scan from './scan.js';
import a11y from './a11y.js';
import test from './test.js';
import { log } from '../shared/log.js';

export default async function validate() {
  log.header('3PD Full Validation');

  try {
    await lint();
    await scan();
    await a11y();
    await test();

    log.success('All validations passed.');
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
