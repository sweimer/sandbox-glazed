<?php

namespace Drupal\hudx_3pd_ai_coder\Controller;

use Drupal\Core\Controller\ControllerBase;

class HudxTestController extends ControllerBase {
  public function page() {
    return [
      '#theme' => 'hudx_3pd_ai_coder_block',
      '#attached' => ['library' => ['hudx_3pd_ai_coder/hudx_3pd_ai_coder']],
    ];
  }
}
