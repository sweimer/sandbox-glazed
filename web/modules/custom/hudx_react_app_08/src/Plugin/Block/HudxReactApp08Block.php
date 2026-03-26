<?php

namespace Drupal\hudx_react_app_08\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React App 08' block.
 *
 * @Block(
 *   id = "hudx_react_app_08_block",
 *   admin_label = @Translation("3PD IDE - React App 08")
 * )
 */
class HudxReactApp08Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_app_08_block',
      '#attached' => [
        'library' => [
          'hudx_react_app_08/hudx_react_app_08',
        ],
      ],
    ];
  }

}
