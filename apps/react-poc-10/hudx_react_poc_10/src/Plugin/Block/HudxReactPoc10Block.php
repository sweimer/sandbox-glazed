<?php

namespace Drupal\hudx_react_poc_10\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Decoupled - React Poc 10' block.
 *
 * @Block(
 *   id = "hudx_react_poc_10_block",
 *   admin_label = @Translation("Decoupled - React Poc 10")
 * )
 */
class HudxReactPoc10Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react_poc_10_block',
      '#attached' => [
        'library' => [
          'hudx_react_poc_10/hudx_react_poc_10',
        ],
      ],
    ];
  }

}
