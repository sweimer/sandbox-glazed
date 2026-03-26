<?php

namespace Drupal\hudx_react_app_09\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React App 09' block.
 *
 * @Block(
 *   id = "hudx_react_app_09_block",
 *   admin_label = @Translation("3PD IDE - React App 09")
 * )
 */
class HudxReactApp09Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_app_09_block',
      '#attached' => [
        'library' => [
          'hudx_react_app_09/hudx_react_app_09',
        ],
      ],
    ];
  }

}
