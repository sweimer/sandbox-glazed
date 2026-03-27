<?php

namespace Drupal\hudx_astro___poc_02\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - Astro   Poc 02' block.
 *
 * @Block(
 *   id = "hudx_astro___poc_02_block",
 *   admin_label = @Translation("3PD IDE - Astro   Poc 02")
 * )
 */
class HudxAstroPoc02Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_astro___poc_02_block',
      '#attached' => [
        'library' => [
          'hudx_astro___poc_02/hudx_astro___poc_02',
        ],
      ],
    ];
  }

}
