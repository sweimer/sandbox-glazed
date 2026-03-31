<?php

namespace Drupal\hudx_embed___pha_financial_management\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Test page — renders the smart embed block directly for development.
 */
class HudxTestController extends ControllerBase {

  /**
   * Renders the smart embed block on a standalone test page.
   */
  public function page(): array {
    $plugin = \Drupal::service('plugin.manager.block')
      ->createInstance('hudx_embed___pha_financial_management_block', []);
    return $plugin->build();
  }

}
