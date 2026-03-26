<?php

namespace Drupal\dxpr_builder\Form;

use Drupal\Core\Block\BlockManagerInterface;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Entity\EntityForm;
use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Views;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * DXPR Builder Profile form.
 *
 * @property \Drupal\dxpr_builder\DxprBuilderProfileInterface $entity
 */
class DxprBuilderProfileForm extends EntityForm {

  /**
   * The block manager.
   *
   * @var \Drupal\Core\Block\BlockManagerInterface
   */
  protected $blockManager;

  /**
   * Constructs a DxprBuilderProfileForm.
   *
   * @param \Drupal\Core\Block\BlockManagerInterface $block_manager
   *   The block manager.
   */
  final public function __construct(BlockManagerInterface $block_manager) {
    $this->blockManager = $block_manager;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-return mixed
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('plugin.manager.block')
    );
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   * @phpstan-return array<string, mixed>
   */
  public function form(array $form, FormStateInterface $form_state): array {

    $form = parent::form($form, $form_state);

    $form['label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Label'),
      '#maxlength' => 255,
      '#default_value' => $this->entity->label(),
      '#description' => $this->t('Label for the dxpr builder profile.'),
      '#required' => TRUE,
    ];

    $form['id'] = [
      '#type' => 'machine_name',
      '#default_value' => $this->entity->id(),
      '#machine_name' => [
        'exists' => '\Drupal\dxpr_builder\Entity\DxprBuilderProfile::load',
      ],
      '#disabled' => !$this->entity->isNew(),
    ];

    $form['status'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('User profile enabled'),
      '#default_value' => $this->entity->status(),
    ];

    $form['dxpr_editor'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Start editor when page loads'),
      '#default_value' => $this->entity->get('dxpr_editor'),
      '#description' => $this->t('When disabling this DXPR Builder controls will not show on content until after the user clicks the eye icon on the main container controls.'),
    ];

    $form['weight'] = [
      '#type' => 'weight',
      '#title' => $this->t('Weight'),
      '#delta' => 10,
      '#default_value' => $this->entity->get('weight'),
    ];

    $form['roles_wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Roles'),
      '#description' => $this->t('Select one or more user roles that this profile will be active on.'),
    ];

    /** @var \Drupal\user\RoleInterface[] $roles */
    $roles = $this->entityTypeManager->getStorage('user_role')->loadMultiple();

    $options = [];
    foreach ($roles as $role_id => $role) {
      // Skip anonymous and authenticated roles.
      if ($role_id === 'anonymous' || $role_id === 'authenticated') {
        continue;
      }
      $options[$role_id] = $role->label();
    }

    $form['roles_wrapper']['roles'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Roles'),
      '#options' => $options,
      '#default_value' => $this->entity->isNew() ? [] : $this->entity->get('roles'),
    ];

    $form['elements_wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Elements'),
      '#description' => $this->t('Select elements that should be available to users on this profile.'),
    ];
    $options = self::getElements();
    $form['elements_wrapper']['elements'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Elements'),
      '#options' => $options,
      '#default_value' => $this->entity->isNew() ? array_keys($options) : $this->entity->get('elements'),
    ];

    $form['blocks_wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Blocks'),
      '#description' => $this->t('Select blocks that should be available to users on this profile. Newly created blocks are not enabled automatically for the profile.'),
    ];

    $blacklist = [
      // These two blocks can only be configured in display variant plugin.
      // @see \Drupal\block\Plugin\DisplayVariant\BlockPageVariant
      'page_title_block',
      'system_main_block',
      // Fallback plugin makes no sense here.
      'broken',
    ];
    $definitions = $this->blockManager->getDefinitions();
    $options = [];
    foreach ($definitions as $block_id => $definition) {
      $hidden = !empty($definition['_block_ui_hidden']);
      $blacklisted = in_array($block_id, $blacklist);
      $is_view = ($definition['provider'] == 'views');
      $is_ctools = ($definition['provider'] == 'ctools');
      if ($hidden || $blacklisted or $is_view or $is_ctools) {
        continue;
      }
      $options['az_block-' . $block_id] = ucfirst($definition['category']) . ': ' . $definition['admin_label'];
    }
    $form['blocks_wrapper']['blocks'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Blocks'),
      '#options' => $options,
      '#default_value' => $this->entity->isNew() ? array_keys($options) : $this->entity->get('blocks'),
    ];

    $form['views_wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Views'),
      '#description' => $this->t('Select views displays that should be available to users on this profile. Newly created views displays are not enabled automatically for the profile.'),
    ];

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
    $form['views_wrapper']['views'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Views'),
      '#options' => $views_elements,
      '#default_value' => $this->entity->isNew() ? array_keys($views_elements) : $this->entity->get('views'),
    ];

    $form['page_templates_wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Page templates'),
      '#description' => $this->t('Select page templates that should be available to users on this profile. Newly created page templates are not enabled automatically for the profile.'),
    ];

    $form['page_templates_wrapper']['page_templates'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Page templates'),
      '#options' => $this->getTemplateOptions('page'),
      '#default_value' => $this->getDefaultTemplates('page'),
    ];

    $form['user_templates_wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Global user templates'),
      '#description' => $this->t('Select global user templates that should be available to users on this profile. Newly created user templates are not enabled automatically for the profile.'),
    ];

    $form['user_templates_wrapper']['user_templates'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Global user templates'),
      '#options' => $this->getTemplateOptions('user'),
      '#default_value' => $this->getDefaultTemplates('user'),
    ];

    $form['inline_buttons'] = [
      '#type' => 'details',
      '#title' => $this->t('Text editor buttons (inline editing)'),
      '#tree' => TRUE,
      '#attributes' => ['class' => ['cke_ltr']],
    ];
    $buttons = $this->entity->isNew() ?
      self::getInlineButtons() : $this->entity->get('inline_buttons');
    foreach (self::getAllButtons() as $button => $config) {
      $icon = empty($config["icon"])
      ? ''
      : '<img src="' . $config["icon"] . '" align="center" width="17" alt="' . $config['display_text'] . '" />';
      $iconHTML = '<span class="cke-icon">' . $icon . '</span>';

      $form['inline_buttons'][$button] = [
        '#type' => 'checkbox',
        '#title' => $config['display_text'],
        '#default_value' => in_array($button, $buttons),
        // Add a button icon near to the checkbox.
        '#field_suffix' => $iconHTML,
      ];
    }

    $form['modal_buttons'] = [
      '#type' => 'details',
      '#title' => $this->t('Text editor buttons (modal editing)'),
      '#tree' => TRUE,
      '#attributes' => ['class' => ['cke_ltr']],
    ];
    $buttons = $this->entity->isNew() ?
      self::getModalButtons() : $this->entity->get('modal_buttons');
    foreach (self::getAllButtons() as $button => $config) {
      $icon = empty($config["icon"])
      ? ''
      : '<img src="' . $config["icon"] . '" align="center" width="17" alt="' . $config['display_text'] . '" />';
      $iconHTML = '<span class="cke-icon">' . $icon . '</span>';

      $form['modal_buttons'][$button] = [
        '#type' => 'checkbox',
        '#title' => $config['display_text'],
        '#default_value' => in_array($button, $buttons),
        // Add a button icon near to the checkbox.
        '#field_suffix' => $iconHTML,
      ];
    }

    $addCheckUncheckAll = function (string $wrapper, string $field) use (&$form) {
      $form[$wrapper]['check_uncheck_all_wrapper'] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['check-uncheck-all-wrapper']],
      ];

      $all_selected = $this->entity->isNew() ? FALSE : (bool) $this->entity->get('all_' . $field);

      $id = 'edit-all-' . str_replace('_', '-', $field);
      $form[$wrapper]['check_uncheck_all_wrapper']['all_' . $field] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Check/Uncheck all @items', [
          '@items' => $form[$wrapper]['#title'],
        ]),
        '#attributes' => [
          'class' => ['check-uncheck-all'],
          'id' => $id,
        ],
        '#id' => $id,
        '#default_value' => $all_selected,
        '#parents' => ['all_' . $field],
      ];

      $form[$wrapper]['check_uncheck_all_wrapper']['separator'] = [
        '#type' => 'html_tag',
        '#tag' => 'hr',
        '#attributes' => ['class' => ['check-uncheck-all-separator']],
      ];

      $form[$wrapper][$field]['#attributes']['class'][] = 'checkboxes-group';
    };

    $autoCheckAll = function (string $wrapper, string $field) use (&$form) {
      if (!$this->entity->isNew() && $this->entity->get('all_' . $field)) {
        $options = $form[$wrapper][$field]['#options'];
        $form[$wrapper][$field]['#default_value'] = array_keys($options);
      }
    };

    $autoCheckAll('elements_wrapper', 'elements');
    $autoCheckAll('blocks_wrapper', 'blocks');
    $autoCheckAll('views_wrapper', 'views');
    $autoCheckAll('page_templates_wrapper', 'page_templates');
    $autoCheckAll('user_templates_wrapper', 'user_templates');

    $addCheckUncheckAll('elements_wrapper', 'elements');
    $addCheckUncheckAll('blocks_wrapper', 'blocks');
    $addCheckUncheckAll('views_wrapper', 'views');
    $addCheckUncheckAll('page_templates_wrapper', 'page_templates');
    $addCheckUncheckAll('user_templates_wrapper', 'user_templates');

    $form['#attached']['library'][] = 'dxpr_builder/configuration.profileform';

    return $form;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $values = $form_state->getValues();
    // Make the roles export more readable.
    $values['roles'] = array_values(array_filter($values['roles']));
    $values['elements'] = array_values(array_filter($values['elements']));
    $values['blocks'] = array_values(array_filter($values['blocks']));
    $values['views'] = array_values(array_filter($values['views']));
    $values['page_templates'] = array_values(array_filter($values['page_templates']));
    $values['user_templates'] = array_values(array_filter($values['user_templates']));
    $values['inline_buttons'] = array_keys(array_filter($values['inline_buttons']));
    $values['modal_buttons'] = array_keys(array_filter($values['modal_buttons']));
    $values['all_elements'] = !empty($values['all_elements']);
    $values['all_blocks'] = !empty($values['all_blocks']);
    $values['all_views'] = !empty($values['all_views']);
    $values['all_page_templates'] = !empty($values['all_page_templates']);
    $values['all_user_templates'] = !empty($values['all_user_templates']);
    $form_state->setValues($values);
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   */
  public function save(array $form, FormStateInterface $form_state): int {

    $result = parent::save($form, $form_state);
    $message_args = ['%label' => $this->entity->label()];
    $message = $result == SAVED_NEW
      ? $this->t('Created new dxpr builder profile %label.', $message_args)
      : $this->t('Updated dxpr builder profile %label.', $message_args);
    $this->messenger()->addStatus($message);
    // Invalidate cache tags.
    $tags = Cache::mergeTags(['config:dxpr_builder.settings'], $this->entity->getCacheTags());
    Cache::invalidateTags($tags);
    $form_state->setRedirectUrl($this->entity->toUrl('collection'));
    return $result;
  }

  /**
   * Returns element options.
   *
   * @return array
   *   List of DXPR Builder elements.
   *
   * @phpstan-return array<string, mixed>
   */
  public function getElements(): array {
    return [
      'az_accordion' => $this->t('Accordion'),
      'az_alert' => $this->t('Alert'),
      'az_blockquote' => $this->t('Blockquote'),
      'az_button' => $this->t('Button'),
      'az_card' => $this->t('Card (Bootstrap 4/5)'),
      'az_circle_counter' => $this->t('Circle counter'),
      'az_countdown' => $this->t('Countdown'),
      'az_counter' => $this->t('Counter'),
      'az_html' => $this->t('HTML'),
      'az_icon' => $this->t('Icon'),
      'az_image' => $this->t('Image'),
      'az_images_carousel' => $this->t('Image carousel'),
      'az_jumbotron' => $this->t('Jumbotron'),
      'az_link' => $this->t('Link'),
      'az_map' => $this->t('Map'),
      'az_marquee' => $this->t('Marquee'),
      'az_panel' => $this->t('Panel (Bootstrap 3)'),
      'az_progress_bar' => $this->t('Progress bar'),
      'az_separator' => $this->t('Separator'),
      'az_text' => $this->t('Text'),
      'az_video' => $this->t('Video'),
      'az_video_local' => $this->t('Local video'),
      'az_well' => $this->t('Well (Bootstrap 3)'),
      'az_carousel' => $this->t('Carousel'),
      'az_container' => $this->t('Container'),
      'az_layers' => $this->t('Layers'),
      'az_row' => $this->t('Row'),
      'az_section' => $this->t('Section'),
      'st_social' => $this->t('Social links'),
      'az_tabs' => $this->t('Tabs'),
      'az_toggle' => $this->t('Toggle'),
    ];
  }

  /**
   * Returns all available CKEditor buttons.
   *
   * @return array
   *   List of DXPR Builder buttons.
   *
   * @phpstan-return array<string, mixed>
   */
  protected static function getAllButtons(): array {
    // Use Drupal's module path resolution and base path for maximum
    // compatibility.
    $modulePath = \Drupal::service('extension.list.module')
      ->getPath('dxpr_builder');
    $basePath = \Drupal::request()->getBasePath();
    $vendorPath = '/dxpr_builder/vendor/managed';
    $iconPath = $vendorPath . '/dxpr-cke5-superbuild/icons';
    $ckeIconsPath = $basePath . '/' . $modulePath . $iconPath;

    return [
      'aiAgentButton' => [
        'display_text' => 'AI Assistant',
        'icon' => "$ckeIconsPath/ai-agent.svg",
      ],
      'aiAgentToneButton' => [
        'display_text' => 'AI Tone of Voice',
        'icon' => "$ckeIconsPath/ai-agent-tone.svg",
      ],
      'bold' => [
        'display_text' => 'Bold',
        'icon' => "$ckeIconsPath/bold.svg",
      ],
      'italic' => [
        'display_text' => 'Italic',
        'icon' => "$ckeIconsPath/italic.svg",
      ],
      'underline' => [
        'display_text' => 'Underline',
        'icon' => "$ckeIconsPath/underline.svg",
      ],
      'strikethrough' => [
        'display_text' => 'Strike through',
        'icon' => "$ckeIconsPath/strikethrough.svg",
      ],
      'alignment:left' => [
        'display_text' => 'Align left',
        'icon' => "$ckeIconsPath/align-left.svg",
      ],
      'alignment:center' => [
        'display_text' => 'Center',
        'icon' => "$ckeIconsPath/align-center.svg",
      ],
      'alignment:right' => [
        'display_text' => 'Align right',
        'icon' => "$ckeIconsPath/align-right.svg",
      ],
      'alignment:justify' => [
        'display_text' => 'Justify',
        'icon' => "$ckeIconsPath/align-justify.svg",
      ],
      'bulletedList' => [
        'display_text' => 'Insert/Remove Bullet list',
        'icon' => "$ckeIconsPath/bulletedlist.svg",
      ],
      'numberedList' => [
        'display_text' => 'Insert/Remove Numbered list',
        'icon' => "$ckeIconsPath/numberedlist.svg",
      ],
      'outdent' => [
        'display_text' => 'Outdent',
        'icon' => "$ckeIconsPath/outdent.svg",
      ],
      'indent' => [
        'display_text' => 'Indent',
        'icon' => "$ckeIconsPath/indent.svg",
      ],
      'undo' => [
        'display_text' => 'Undo',
        'icon' => "$ckeIconsPath/undo.svg",
      ],
      'redo' => [
        'display_text' => 'Redo',
        'icon' => "$ckeIconsPath/redo.svg",
      ],
      'link' => [
        'display_text' => 'Link',
        'icon' => "$ckeIconsPath/link.svg",
      ],
      'insertImage' => [
        'display_text' => 'Image',
        'icon' => "$ckeIconsPath/image.svg",
      ],
      'fontColor' => [
        'display_text' => 'Text color',
        'icon' => "$ckeIconsPath/font-color.svg",
      ],
      'fontBackgroundColor' => [
        'display_text' => 'Background color',
        'icon' => "$ckeIconsPath/font-background.svg",
      ],
      'fontSize' => [
        'display_text' => 'Font size',
        'icon' => "$ckeIconsPath/font-size.svg",
      ],
      'superscript' => [
        'display_text' => 'Superscript',
        'icon' => "$ckeIconsPath/superscript.svg",
      ],
      'subscript' => [
        'display_text' => 'Subscript',
        'icon' => "$ckeIconsPath/subscript.svg",
      ],
      'blockQuote' => [
        'display_text' => 'Block quote',
        'icon' => "$ckeIconsPath/blockquote.svg",
      ],
      'sourceEditing' => [
        'display_text' => 'Source code',
        'icon' => "$ckeIconsPath/source-editing.svg",
      ],
      'horizontalLine' => [
        'display_text' => 'Horizontal rule',
        'icon' => "$ckeIconsPath/horizontalline.svg",
      ],
      'showBlocks' => [
        'display_text' => 'Show blocks',
        'icon' => "$ckeIconsPath/show-blocks.svg",
      ],
      'removeFormat' => [
        'display_text' => 'Remove format',
        'icon' => "$ckeIconsPath/remove-format.svg",
      ],
      'specialCharacters' => [
        'display_text' => 'Character map',
        'icon' => "$ckeIconsPath/special-characters.svg",
      ],
      'heading' => [
        'display_text' => 'HTML block format',
        'icon' => "$ckeIconsPath/heading1.svg",
      ],
      'style' => [
        'display_text' => 'Font style',
        'icon' => "",
      ],
      'insertTable' => [
        'display_text' => 'Table',
        'icon' => "$ckeIconsPath/table.svg",
      ],
      'selectAll' => [
        'display_text' => 'Select all',
        'icon' => "$ckeIconsPath/select-all.svg",
      ],
      'findAndReplace' => [
        'display_text' => 'Replace',
        'icon' => "$ckeIconsPath/find-replace.svg",
      ],
      'mediaEmbed' => [
        'display_text' => 'Media Embed',
        'icon' => "$ckeIconsPath/media.svg",
      ],
    ];
  }

  /**
   * Returns default buttons for inline mode.
   *
   * @return array
   *   List of DXPR Builder inline buttons.
   *
   * @phpstan-return array<int, string>
   */
  protected static function getInlineButtons(): array {
    return [
      'aiAgentButton',
      'aiAgentToneButton',
      'bold',
      'italic',
      'removeFormat',
      'fontColor',
      'heading',
      'style',
      'fontSize',
      'alignment:left',
      'alignment:center',
      'alignment:right',
      'alignment:justify',
      'bulletedList',
      'link',
      'insertImage',
      'insertTable',
      'undo',
      'redo',
    ];
  }

  /**
   * Returns default buttons form modal mode.
   *
   * @return array
   *   List of DXPR Builder modal buttons.
   *
   * @phpstan-return array<int, string>
   */
  protected static function getModalButtons(): array {
    return [
      'aiAgentButton',
      'aiAgentToneButton',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'superscript',
      'subscript',
      'removeFormat',
      'alignment:left',
      'alignment:center',
      'alignment:right',
      'alignment:justify',
      'bulletedList',
      'numberedList',
      'outdent',
      'indent',
      'blockQuote',
      'undo',
      'redo',
      'link',
      'insertImage',
      'horizontalLine',
      'specialCharacters',
      'insertTable',
      'fontColor',
      'sourceEditing',
      'showBlocks',
      'heading',
      'style',
      'fontSize',
    ];
  }

  /**
   * Returns page or user templates.
   *
   * @param string $type
   *   Accepts 'page' for page templates, or 'user' for global user templates.
   *
   * @return array<string, string>
   *   Array for templates keyed by id's.
   */
  private function getTemplateOptions(string $type): array {
    if (!in_array($type, ['page', 'user'])) {
      return [];
    }

    $properties = ['status' => 1];

    if ($type === 'user') {
      $properties['global'] = 1;
    }

    $templates = $this->entityTypeManager
      ->getStorage('dxpr_builder_' . $type . '_template')
      ->loadByProperties($properties);

    $templates_enabled = [];
    foreach ($templates as $template) {
      $templates_enabled[$template->uuid()] = $template->label();
    }

    return $templates_enabled;
  }

  /**
   * Returns form default value for page or user templates form element.
   *
   * @param string $type
   *   Accepts 'user' for global user_templates or 'page' for page_templates.
   *
   * @return array<string, string>
   *   An array of template id's.
   */
  private function getDefaultTemplates(string $type): array {
    return $this->entity->isNew()
      ? array_keys($this->getTemplateOptions($type))
      : ($this->entity->get($type . '_templates') ?: []);
  }

}
