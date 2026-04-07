<?php

namespace Drupal\hudx_3pd_ai_director\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "hudx_3pd_ai_director_block",
 *   admin_label = @Translation("3PD IDE - AI Director")
 * )
 */
class Hudx3pdAiDirectorBlock extends BlockBase {
  public function build() {
    return [
      '#theme' => 'hudx_3pd_ai_director_block',
      '#attached' => ['library' => ['hudx_3pd_ai_director/hudx_3pd_ai_director']],
    ];
  }
}
