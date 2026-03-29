<?php

namespace Drupal\hudx_astro_forms___app_12\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - Astro Forms   App 12' block.
 *
 * @Block(
 *   id = "hudx_astro_forms___app_12_block",
 *   admin_label = @Translation("3PD IDE - Astro Forms   App 12")
 * )
 */
class HudxAstroFormsApp12Block extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_astro_forms___app_12_block',
      '#attached' => [
        'library' => [
          'hudx_astro_forms___app_12/hudx_astro_forms___app_12',
        ],
      ],
    ];
  }

}
