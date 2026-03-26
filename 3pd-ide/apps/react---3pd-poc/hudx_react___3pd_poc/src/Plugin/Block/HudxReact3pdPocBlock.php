<?php

namespace Drupal\hudx_react___3pd_poc\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React   3pd Poc' block.
 *
 * @Block(
 *   id = "hudx_react___3pd_poc_block",
 *   admin_label = @Translation("3PD IDE - React   3pd Poc")
 * )
 */
class HudxReact3pdPocBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react___3pd_poc_block',
      '#attached' => [
        'library' => [
          'hudx_react___3pd_poc/hudx_react___3pd_poc',
        ],
      ],
    ];
  }

}
