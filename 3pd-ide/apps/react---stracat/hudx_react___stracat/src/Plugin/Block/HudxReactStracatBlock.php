<?php

namespace Drupal\hudx_react___stracat\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React   Stracat' block.
 *
 * @Block(
 *   id = "hudx_react___stracat_block",
 *   admin_label = @Translation("3PD IDE - React   Stracat")
 * )
 */
class HudxReactStracatBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react___stracat_block',
      '#attached' => [
        'library' => [
          'hudx_react___stracat/hudx_react___stracat',
        ],
      ],
    ];
  }

}
