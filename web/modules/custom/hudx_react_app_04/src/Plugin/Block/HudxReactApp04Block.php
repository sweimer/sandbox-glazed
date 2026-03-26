<?php

namespace Drupal\hudx_react_app_04\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React App 04' block.
 *
 * @Block(
 *   id = "hudx_react_app_04_block",
 *   admin_label = @Translation("3PD IDE - React App 04")
 * )
 */
class HudxReactApp04Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_app_04_block',
      '#attached' => [
        'library' => [
          'hudx_react_app_04/hudx_react_app_04',
        ],
      ],
    ];
  }

}
