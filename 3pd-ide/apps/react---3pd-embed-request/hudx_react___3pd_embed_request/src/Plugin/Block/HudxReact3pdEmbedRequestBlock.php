<?php

namespace Drupal\hudx_react___3pd_embed_request\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a '3PD IDE - React   3pd Embed Request' block.
 *
 * @Block(
 *   id = "hudx_react___3pd_embed_request_block",
 *   admin_label = @Translation("3PD IDE - React   3pd Embed Request")
 * )
 */
class HudxReact3pdEmbedRequestBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'hudx_react___3pd_embed_request_block',
      '#attached' => [
        'library' => [
          'hudx_react___3pd_embed_request/hudx_react___3pd_embed_request',
        ],
      ],
    ];
  }

}
