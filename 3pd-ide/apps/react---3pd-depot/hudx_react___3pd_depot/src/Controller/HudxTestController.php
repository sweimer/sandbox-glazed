<?php

namespace Drupal\hudx_react___3pd_depot\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page controller for 3PD IDE - React   3pd Depot.
 *
 * Renders the block at /hudx-test/react---3pd-depot for development testing.
 * NOTE: Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {

  public function page() {
    return [
      '#theme' => 'hudx_react___3pd_depot_block',
      '#attached' => [
        'library' => [
          'hudx_react___3pd_depot/hudx_react___3pd_depot',
        ],
      ],
    ];
  }

}
