<?php

namespace Drupal\hudx_embed___pha_financial_management\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Render\Markup;

/**
 * Provides a smart embed block for Pha Financial Management.
 *
 * @Block(
 *   id = "hudx_embed___pha_financial_management_block",
 *   admin_label = @Translation("Pha Financial Management — Smart Embed"),
 *   category = @Translation("HUDX")
 * )
 */
class EmbedPhaFinancialManagementBlock extends BlockBase {

  /**
   * The URL to embed. Set at module generation time.
   */
  const EMBED_URL = 'https://d1xzjd7z8lcp8a.cloudfront.net/trainings/pha-financial-management/index.html';

  /**
   * Human-readable title for the iframe (accessibility).
   */
  const EMBED_TITLE = 'Pha Financial Management';

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#markup' => Markup::create('<div class="hudx-smart-embed"><iframe class="hudx-smart-embed__iframe" src="' . self::EMBED_URL . '" frameborder="0" scrolling="no" title="' . self::EMBED_TITLE . '" allowfullscreen></iframe></div>'),
      '#attached' => [
        'library' => ['hudx_embed___pha_financial_management/smart-embed'],
      ],
    ];
  }

}
