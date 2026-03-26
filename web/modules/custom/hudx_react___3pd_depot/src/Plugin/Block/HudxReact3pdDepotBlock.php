<?php

namespace Drupal\hudx_react___3pd_depot\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React   3pd Depot' block.
 *
 * @Block(
 *   id = "hudx_react___3pd_depot_block",
 *   admin_label = @Translation("3PD IDE - React   3pd Depot")
 * )
 */
class HudxReact3pdDepotBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react___3pd_depot_block',
      '#attached' => [
        'library' => [
          'hudx_react___3pd_depot/hudx_react___3pd_depot',
        ],
      ],
    ];
  }

}
