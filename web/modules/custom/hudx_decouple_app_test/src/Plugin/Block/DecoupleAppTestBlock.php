<?php

namespace Drupal\hudx_decouple_app_test\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "decouple_app_test_block",
 *   admin_label = @Translation("Decoupled - Decouple App Test Block")
 * )
 */
class DecoupleAppTestBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_decouple_app_test_block',
      '#attached' => [
        'library' => [
          'hudx_decouple_app_test/app',
        ],
      ],
    ];
  }

}
