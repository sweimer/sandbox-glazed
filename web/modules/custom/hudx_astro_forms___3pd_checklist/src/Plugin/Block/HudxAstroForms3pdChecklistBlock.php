<?php

namespace Drupal\hudx_astro_forms___3pd_checklist\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "hudx_astro_forms___3pd_checklist_block",
 *   admin_label = @Translation("3PD IDE - 3PD Module Checklist")
 * )
 */
class HudxAstroForms3pdChecklistBlock extends BlockBase {
  public function build() {
    return [
      '#theme'    => 'hudx_astro_forms___3pd_checklist_block',
      '#attached' => ['library' => ['hudx_astro_forms___3pd_checklist/hudx_astro_forms___3pd_checklist']],
    ];
  }
}
