<?php

namespace Drupal\hudx_3pd_ai_director\Controller;

use Drupal\Core\Controller\ControllerBase;

class HudxTestController extends ControllerBase {
  public function page() {
    return [
      '#theme' => 'hudx_3pd_ai_director_block',
      '#attached' => ['library' => ['hudx_3pd_ai_director/hudx_3pd_ai_director']],
    ];
  }
}
