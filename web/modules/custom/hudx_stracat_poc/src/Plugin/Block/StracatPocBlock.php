<?php

namespace Drupal\hudx_stracat_poc\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "hudx_stracat_poc_block",
 *   admin_label = @Translation("HUDX STraCAT POC Block"),
 *   dxpr_builder_hidden = TRUE
 * )
 */
class StracatPocBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_stracat_poc_block',
      '#attached' => [
        'library' => [
          'hudx_stracat_poc/stracat_poc',
        ],
      ],
    ];
  }
}
