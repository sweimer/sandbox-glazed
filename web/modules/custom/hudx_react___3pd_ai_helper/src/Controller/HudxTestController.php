<?php

namespace Drupal\hudx_react___3pd_ai_helper\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page controller for 3PD IDE - React   3pd Ai Helper.
 *
 * Renders the block at /hudx-test/react---3pd-ai-helper for development testing.
 * NOTE: Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {

  public function page() {
    return [
      '#theme' => 'hudx_react___3pd_ai_helper_block',
      '#attached' => [
        'library' => [
          'hudx_react___3pd_ai_helper/hudx_react___3pd_ai_helper',
        ],
      ],
    ];
  }

}
