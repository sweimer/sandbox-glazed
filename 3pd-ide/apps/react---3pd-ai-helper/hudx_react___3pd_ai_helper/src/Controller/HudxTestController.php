<?php

namespace Drupal\hudx_react___3pd_ai_helper\Controller;

use Drupal\Core\Controller\ControllerBase;

class HudxTestController extends ControllerBase {
  public function page() {
    return [
      '#theme' => 'hudx_react___3pd_ai_helper_block',
      '#attached' => ['library' => ['hudx_react___3pd_ai_helper/hudx_react___3pd_ai_helper']],
    ];
  }
}
