<?php
/**
 * Pantheon Quicksilver post-deploy script.
 * Runs automatically after every code sync on the dev environment.
 *
 * - drush updb: applies any pending DB schema updates (new modules, core updates)
 * - router rebuild: prevents "No route found" after cache clears
 * - drush cr: clears all caches
 */

$drush = '/code/vendor/bin/drush';
$root  = '/code/web';
$uri   = 'https://dev-3-pd-ide.pantheonsite.io';

echo "=== Post-deploy: running DB updates ===\n";
passthru("$drush --root=$root --uri=$uri updb -y 2>&1");

echo "=== Post-deploy: rebuilding router ===\n";
passthru("$drush --root=$root --uri=$uri php:eval \"\Drupal::service('router.builder')->rebuild(); echo 'Router rebuilt.\n';\" 2>&1");

echo "=== Post-deploy: clearing caches ===\n";
passthru("$drush --root=$root --uri=$uri cr 2>&1");

echo "=== Post-deploy: re-seeding hudx module data ===\n";
$custom_modules = '/code/web/modules/custom';
if (is_dir($custom_modules)) {
  foreach (scandir($custom_modules) as $mod) {
    $seed_file = "$custom_modules/$mod/data/seed.json";
    if (file_exists($seed_file)) {
      echo "  Seeding $mod...\n";
      passthru("$drush --root=$root --uri=$uri php:eval \"\\Drupal::moduleHandler()->loadInclude('$mod', 'install'); _${mod}_import_seed();\" 2>&1");
    }
  }
}

echo "=== Post-deploy complete ===\n";
