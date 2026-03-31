<?php

namespace Drupal\hudx_3pd_ai_coder\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "hudx_3pd_ai_coder_block",
 *   admin_label = @Translation("3PD IDE - AI Helper")
 * )
 */
class Hudx3pdAiCoderBlock extends BlockBase {
  public function build() {
    return [
      '#theme' => 'hudx_3pd_ai_coder_block',
      '#attached' => ['library' => ['hudx_3pd_ai_coder/hudx_3pd_ai_coder']],
    ];
  }
}
