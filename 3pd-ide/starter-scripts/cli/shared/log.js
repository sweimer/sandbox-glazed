// /cli/shared/log.js

import chalk from 'chalk';

const prefix = {
  info:    chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warn:    chalk.yellow('⚠'),
  error:   chalk.red('✖'),
  debug:   chalk.magenta('🐞'),
  header:  chalk.cyan('◆'),
};

export const log = {
  // Standard log levels
  info:    (msg) => console.log(`${prefix.info} ${chalk.blue(msg)}`),
  success: (msg) => console.log(`${prefix.success} ${chalk.green(msg)}`),
  warn:    (msg) => console.log(`${prefix.warn} ${chalk.yellow(msg)}`),
  error:   (msg) => console.log(`${prefix.error} ${chalk.red(msg)}`),

  // Debug only when DEBUG=1
  debug: (msg) => {
    if (process.env.DEBUG === '1') {
      console.log(`${prefix.debug} ${chalk.magenta(msg)}`);
    }
  },

  // Section header (for CLI polish)
  header: (msg) => {
    console.log(`\n${prefix.header} ${chalk.bold.cyan(msg)}\n`);
  },

  // Dimmed helper (paths, hints, etc.)
  dim: (msg) => console.log(chalk.dim(msg)),

  // Blank line helpers for spacing
  nl: (count = 1) => console.log('\n'.repeat(count)),
};
