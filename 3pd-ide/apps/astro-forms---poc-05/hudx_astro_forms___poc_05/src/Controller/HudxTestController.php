<?php

namespace Drupal\hudx_astro_forms___poc_05\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page controller for 3PD IDE - Astro Forms   Poc 05.
 *
 * Renders the block at /hudx-test/astro-forms---poc-05 for development testing.
 * NOTE: Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {

  public function page() {
    return [
      '#theme' => 'hudx_astro_forms___poc_05_block',
      '#attached' => [
        'library' => [
          'hudx_astro_forms___poc_05/hudx_astro_forms___poc_05',
        ],
      ],
    ];
  }

}
