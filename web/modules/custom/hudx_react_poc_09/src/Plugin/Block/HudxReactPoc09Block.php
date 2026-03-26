<?php

namespace Drupal\hudx_react_poc_09\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Decoupled - React Poc 09' block.
 *
 * @Block(
 *   id = "hudx_react_poc_09_block",
 *   admin_label = @Translation("Decoupled - React Poc 09")
 * )
 */
class HudxReactPoc09Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_poc_09_block',
      '#attached' => [
        'library' => [
          'hudx_react_poc_09/hudx_react_poc_09',
        ],
      ],
    ];
  }

}
