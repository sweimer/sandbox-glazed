<?php

namespace Drupal\hudx_react_app_03\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React App 03' block.
 *
 * @Block(
 *   id = "hudx_react_app_03_block",
 *   admin_label = @Translation("3PD IDE - React App 03")
 * )
 */
class HudxReactApp03Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_app_03_block',
      '#attached' => [
        'library' => [
          'hudx_react_app_03/hudx_react_app_03',
        ],
      ],
    ];
  }

}
