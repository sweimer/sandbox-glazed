<?php

namespace Drupal\hudx_react_app_01\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React App 01' block.
 *
 * @Block(
 *   id = "hudx_react_app_01_block",
 *   admin_label = @Translation("3PD IDE - React App 01")
 * )
 */
class HudxReactApp01Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_app_01_block',
      '#attached' => [
        'library' => [
          'hudx_react_app_01/hudx_react_app_01',
        ],
      ],
    ];
  }

}
