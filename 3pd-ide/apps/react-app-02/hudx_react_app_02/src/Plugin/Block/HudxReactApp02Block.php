<?php

namespace Drupal\hudx_react_app_02\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React App 02' block.
 *
 * @Block(
 *   id = "hudx_react_app_02_block",
 *   admin_label = @Translation("3PD IDE - React App 02")
 * )
 */
class HudxReactApp02Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_app_02_block',
      '#attached' => [
        'library' => [
          'hudx_react_app_02/hudx_react_app_02',
        ],
      ],
    ];
  }

}
