<?php

namespace Drupal\hudx_react_poc_11\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Decoupled - React Poc 11' block.
 *
 * @Block(
 *   id = "hudx_react_poc_11_block",
 *   admin_label = @Translation("Decoupled - React Poc 11")
 * )
 */
class HudxReactPoc11Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_poc_11_block',
      '#attached' => [
        'library' => [
          'hudx_react_poc_11/hudx_react_poc_11',
        ],
      ],
    ];
  }

}
