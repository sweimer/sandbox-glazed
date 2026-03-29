<?php

namespace Drupal\hudx_react___3pd_ai_helper\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "hudx_react___3pd_ai_helper_block",
 *   admin_label = @Translation("3PD IDE - AI Helper")
 * )
 */
class HudxReact3pdAiHelperBlock extends BlockBase {
  public function build() {
    return [
      '#theme' => 'hudx_react___3pd_ai_helper_block',
      '#attached' => ['library' => ['hudx_react___3pd_ai_helper/hudx_react___3pd_ai_helper']],
    ];
  }
}
