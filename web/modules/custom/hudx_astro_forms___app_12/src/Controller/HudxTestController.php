<?php

namespace Drupal\hudx_astro_forms___app_12\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page controller for 3PD IDE - Astro Forms   App 12.
 *
 * Renders the block at /hudx-test/astro-forms---app-12 for development testing.
 * NOTE: Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {

  public function page() {
    return [
      '#theme' => 'hudx_astro_forms___app_12_block',
      '#attached' => [
        'library' => [
          'hudx_astro_forms___app_12/hudx_astro_forms___app_12',
        ],
      ],
    ];
  }

}
