<?php

namespace Drupal\hudx_embed___sc_training\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Render\Markup;

/**
 * Provides a smart embed block for SC Training — Service Coordinators in Multifamily Housing.
 *
 * @Block(
 *   id = "hudx_embed___sc_training_block",
 *   admin_label = @Translation("SC Training — Service Coordinators in Multifamily Housing — Smart Embed"),
 *   category = @Translation("HUDX")
 * )
 */
class EmbedScTrainingBlock extends BlockBase {

  /**
   * The URL to embed. Set at module generation time.
   */
  const EMBED_URL = 'https://d1xzjd7z8lcp8a.cloudfront.net/trainings/service-coordinators-in-multifamily-housing-online-learning-tool/index.html';

  /**
   * Human-readable title for the iframe (accessibility).
   */
  const EMBED_TITLE = 'SC Training — Service Coordinators in Multifamily Housing';

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#markup' => Markup::create('<div class="hudx-smart-embed"><iframe class="hudx-smart-embed__iframe" src="' . self::EMBED_URL . '" frameborder="0" scrolling="no" title="' . self::EMBED_TITLE . '" allowfullscreen></iframe></div>'),
      '#attached' => [
        'library' => ['hudx_embed___sc_training/smart-embed'],
      ],
    ];
  }

}
