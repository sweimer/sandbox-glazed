<?php

namespace Drupal\hudx_astro_forms___poc_05\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - Astro Forms   Poc 05' block.
 *
 * @Block(
 *   id = "hudx_astro_forms___poc_05_block",
 *   admin_label = @Translation("3PD IDE - Astro Forms   Poc 05")
 * )
 */
class HudxAstroFormsPoc05Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_astro_forms___poc_05_block',
      '#attached' => [
        'library' => [
          'hudx_astro_forms___poc_05/hudx_astro_forms___poc_05',
        ],
      ],
    ];
  }

}
