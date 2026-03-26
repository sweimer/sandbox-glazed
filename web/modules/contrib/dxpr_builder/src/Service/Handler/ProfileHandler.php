<?php

namespace Drupal\dxpr_builder\Service\Handler;

use Drupal\Core\Block\BlockManagerInterface;
use Drupal\Core\Plugin\Context\ContextRepositoryInterface;
use Drupal\dxpr_builder\DxprBuilderProfileInterface;
use Drupal\views\Views;

/**
 * Description.
 */
class ProfileHandler {

  /**
   * The context.repository service.
   *
   * @var \Drupal\Core\Plugin\Context\ContextRepositoryInterface
   */
  protected $contextRepository;

  /**
   * The plugin.manager.block service.
   *
   * @var \Drupal\Core\Block\BlockManagerInterface
   */
  protected $blockManager;

  /**
   * Constructs the profile handler.
   *
   * @param \Drupal\Core\Plugin\Context\ContextRepositoryInterface $context_repository
   *   The context.repository service.
   * @param \Drupal\Core\Block\BlockManagerInterface $block_manager
   *   Block plugin manager.
   */
  public function __construct(ContextRepositoryInterface $context_repository, BlockManagerInterface $block_manager) {
    $this->contextRepository = $context_repository;
    $this->blockManager = $block_manager;
  }

  /**
   * Method description.
   *
   * @return mixed[]
   *   The dxpr builder profiles array values.
   */
  public function buildSettings(DxprBuilderProfileInterface $profile) {
    $hide_main_elements = $profile->get('all_elements') ? [] : array_diff_key(self::getMainElements(), array_combine($profile->get('elements'), $profile->get('elements')));
    $hide_block_elements = $profile->get('all_blocks') ? [] : array_diff_key($this->getBlockElements(), array_combine($profile->get('blocks'), $profile->get('blocks')));
    $hide_view_elements = $profile->get('all_views') ? [] : array_diff_key($this->getViewElements(), array_combine($profile->get('views'), $profile->get('views')));

    $page_templates = $profile->get('all_page_templates') ? 'all' : (is_array($page_templates = $profile->get('page_templates')) ? array_combine($page_templates, $page_templates) : []);
    $user_templates = $profile->get('all_user_templates') ? 'all' : (is_array($user_templates = $profile->get('user_templates')) ? array_combine($user_templates, $user_templates) : []);
    $hide_elements = array_merge($hide_main_elements, $hide_block_elements, $hide_view_elements);
    $dxpr_editor = $profile->get('dxpr_editor');
    $cke_config = self::getCkeConfig($profile);
    return [
      'hide_els' => $hide_elements,
      'page_templates' => $page_templates,
      'global_templates' => $user_templates,
      'ck_config' => $cke_config,
      'dxpr_editor' => $dxpr_editor,
      'name' => $profile->get("label"),
    ];
  }

  /**
   * Returns main elements.
   *
   * @return mixed[]
   *   The html main elements values.
   */
  protected static function getMainElements() {
    return [
      'az_accordion' => t('Accordion'),
      'az_alert' => t('Alert'),
      'az_blockquote' => t('Blockquote'),
      'az_button' => t('Button'),
      'az_card' => t('Card (Bootstrap 4/5)'),
      'az_circle_counter' => t('Circle counter'),
      'az_countdown' => t('Countdown'),
      'az_counter' => t('Counter'),
      'az_html' => t('HTML'),
      'az_icon' => t('Icon'),
      'az_image' => t('Image'),
      'az_images_carousel' => t('Image carousel'),
      'az_jumbotron' => t('Jumbotron'),
      'az_link' => t('Link'),
      'az_map' => t('Map'),
      'az_panel' => t('Panel (Bootstrap 3)'),
      'az_progress_bar' => t('Progress bar'),
      'az_separator' => t('Separator'),
      'az_text' => t('Text'),
      'az_video' => t('Video'),
      'az_video_local' => t('Local video'),
      'az_well' => t('Well (Bootstrap 3)'),
      'az_carousel' => t('Carousel'),
      'az_container' => t('Container'),
      'az_layers' => t('Layers'),
      'az_row' => t('Row'),
      'az_section' => t('Section'),
      'st_social' => t('Social links'),
      'az_tabs' => t('Tabs'),
      'az_toggle' => t('Toggle'),
    ];
  }

  /**
   * Return block elements.
   *
   * @return mixed[]
   *   The block elements values.
   */
  protected function getBlockElements() {

    $blacklist = [
      // These two blocks can only be configured in display variant plugin.
      // @see \Drupal\block\Plugin\DisplayVariant\BlockPageVariant
      'page_title_block',
      'system_main_block',
      // Fallback plugin makes no sense here.
      'broken',
    ];
    $definitions = $this->blockManager->getDefinitions();
    $block_elements = [];
    foreach ($definitions as $block_id => $definition) {
      $hidden = !empty($definition['_block_ui_hidden']);
      $blacklisted = in_array($block_id, $blacklist);
      $is_view = ($definition['provider'] == 'views');
      $is_ctools = ($definition['provider'] == 'ctools');
      if ($hidden || $blacklisted or $is_view or $is_ctools) {
        continue;
      }
      $block_elements['az_block-' . $block_id] = ucfirst($definition['category']) . ': ' . $definition['admin_label'];
    }

    return $block_elements;
  }

  /**
   * Returns view elements.
   *
   * @return mixed[]
   *   The view elements values.
   */
  protected function getViewElements() {
    $views_elements = [];
    $views = Views::getAllViews();
    foreach ($views as $view) {
      if (!$view->status()) {
        continue;
      }
      $executable_view = Views::getView($view->id());
      $executable_view->initDisplay();
      foreach ($executable_view->displayHandlers as $id => $display) {
        $key = 'az_view-' . $executable_view->id() . '-' . $id;
        $views_elements[$key] = $view->label() . ': ' . $display->display['display_title'];
      }
    }
    return $views_elements;
  }

  /**
   * Return CKEditor.
   *
   * @return mixed[]
   *   The CKEditor config values.
   */
  protected static function getCkeConfig(DxprBuilderProfileInterface $profile) {
    $cke_config = [];

    // Build toolbar configuration directly from profile settings.
    foreach (['inline', 'modal'] as $build) {
      $profile_buttons = $profile->get($build . '_buttons') ?: [];

      // Skip empty configurations.
      if (empty($profile_buttons)) {
        continue;
      }

      // Use profile configuration as-is without filtering.
      $cke_config[$build] = array_values(array_filter($profile_buttons, function ($item) {
        return !empty($item);
      }));
    }

    return $cke_config;
  }

}
