<?php

namespace Drupal\hudx_stracat\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - Stracat' block.
 *
 * @Block(
 *   id = "hudx_stracat_block",
 *   admin_label = @Translation("3PD IDE - Stracat")
 * )
 */
class HudxStracatBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_stracat_block',
      '#attached' => [
        'library' => [
          'hudx_stracat/hudx_stracat',
        ],
      ],
    ];
  }

}
