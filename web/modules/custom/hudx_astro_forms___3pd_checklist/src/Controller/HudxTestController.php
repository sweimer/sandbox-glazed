<?php

namespace Drupal\hudx_astro_forms___3pd_checklist\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page controller — renders the block at /hudx-test/astro-forms---3pd-checklist.
 * Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {
  public function page() {
    return [
      '#theme'    => 'hudx_astro_forms___3pd_checklist_block',
      '#attached' => ['library' => ['hudx_astro_forms___3pd_checklist/hudx_astro_forms___3pd_checklist']],
    ];
  }
}
