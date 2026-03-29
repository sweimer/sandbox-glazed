<?php

namespace Drupal\hudx_react___3pd_embed_request\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page controller for 3PD IDE - React   3pd Embed Request.
 *
 * Renders the block at /hudx-test/react---3pd-embed-request for development testing.
 * NOTE: Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {

  public function page() {
    return [
      '#theme' => 'hudx_react___3pd_embed_request_block',
      '#attached' => [
        'library' => [
          'hudx_react___3pd_embed_request/hudx_react___3pd_embed_request',
        ],
      ],
    ];
  }

}
