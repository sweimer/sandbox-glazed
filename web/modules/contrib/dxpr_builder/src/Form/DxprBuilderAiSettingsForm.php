<?php

namespace Drupal\dxpr_builder\Form;

use Drupal\dxpr_builder\Constants\AiModelConstants;

use Drupal\Core\Url;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface;

/**
 * Provides a form for DXPR Builder AI Settings.
 */
class DxprBuilderAiSettingsForm extends FormBase {

  /**
   * Configuration Factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The module extension list.
   *
   * @var \Drupal\Core\Extension\ModuleExtensionList
   */
  protected $moduleList;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The DXPR license service.
   *
   * @var \Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface
   */
  protected $licenseService;

  /**
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * Class constructor.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The configuration factory.
   * @param \Drupal\Core\Extension\ModuleExtensionList $moduleList
   *   The module extension list.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface $licenseService
   *   The DXPR license service.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $moduleHandler
   *   The module handler.
   */
  final public function __construct(
    ConfigFactoryInterface $configFactory,
    ModuleExtensionList $moduleList,
    EntityTypeManagerInterface $entityTypeManager,
    DxprBuilderLicenseServiceInterface $licenseService,
    ModuleHandlerInterface $moduleHandler,
  ) {
    $this->configFactory = $configFactory;
    $this->moduleList = $moduleList;
    $this->entityTypeManager = $entityTypeManager;
    $this->licenseService = $licenseService;
    $this->moduleHandler = $moduleHandler;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-return mixed
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory'),
      $container->get('extension.list.module'),
      $container->get('entity_type.manager'),
      $container->get('dxpr_builder.license_service'),
      $container->get('module_handler')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'dxpr_builder_ai_settings';
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   * @phpstan-return array<string, mixed>
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->configFactory->getEditable('dxpr_builder.settings');
    // Default to TRUE when config key doesn't exist (NULL).
    $ai_enabled = $config->get('ai_enabled');
    $ai_enabled = $ai_enabled === NULL ? TRUE : (bool) $ai_enabled;
    $ai_page_enabled = $config->get('ai_page_enabled');
    $ai_page_enabled = $ai_page_enabled === NULL ? TRUE : (bool) $ai_page_enabled;
    $ai_image_enabled = $config->get('ai_image_enabled');
    $ai_image_enabled = $ai_image_enabled === NULL ? TRUE : (bool) $ai_image_enabled;
    $ai_user_model_selection = $config->get('ai_user_model_selection');
    $ai_user_model_selection = $ai_user_model_selection === NULL ? TRUE : (bool) $ai_user_model_selection;
    $ai_provider_selection_mode = $config->get('ai_provider_selection_mode') ?? 'automatic';
    $ai_model = $config->get('ai_model') ?: AiModelConstants::getDefaultModel();
    $providers_config = $config->get('ai_providers') ?? [];

    $form['#attached']['library'][] = 'core/drupal.tableheader';
    $form['#attached']['library'][] = 'core/drupal.tabledrag';
    $form['#attached']['library'][] = 'dxpr_builder/ai-providers';

    $form['#attributes'] = ['class' => ['dxpr-builder-ai-settings-form']];
    $form['#title'] = $this->t('AI Settings');

    // Usage stats fieldset.
    $form['usage_stats'] = [
      '#type' => 'details',
      '#title' => $this->t('Usage and Credits'),
      '#open' => TRUE,
      '#attributes' => ['class' => ['form-item--half-width']],
      '#weight' => -99,
    ];

    // Get real AI usage data.
    $usage_data = $this->licenseService->getAiUsageData();

    if ($usage_data) {
      // Word balance table.
      $form['usage_stats']['balance_table'] = [
        '#type' => 'table',
        '#header' => [],
        '#rows' => [
          [
            ['data' => $this->t('Credits remaining')],
            ['data' => number_format($usage_data['balance']['credit_balance'] ?? 0), 'class' => ['text-align-right']],
          ],
        ],
        '#attributes' => ['class' => ['table-condensed']],
        '#empty' => $this->t('No usage data available'),
      ];

      $form['usage_stats']['credits_info'] = [
        '#type' => 'html_tag',
        '#tag' => 'div',
        '#value' => $this->t('To top up your AI credits, visit <a href="https://dxpr.com/user/me/subscription/credits" target="_blank">your subscription page</a>.'),
        '#attributes' => ['class' => ['description']],
      ];

      $form['usage_stats']['last_updated'] = [
        '#type' => 'html_tag',
        '#tag' => 'div',
        '#value' => $this->t('1 generated word is 1 credit, 1 image is 1.000 credits.'),
        '#attributes' => ['class' => ['description']],
      ];
    }
    else {
      $form['usage_stats']['no_data'] = [
        '#type' => 'markup',
        '#markup' => $this->t('Unable to load usage data. Check your connection and refresh the page.'),
      ];
    }

    // Basic settings fieldset.
    $form['basic_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('AI Features'),
      '#open' => TRUE,
      '#attributes' => ['class' => ['form-item--half-width']],
      '#weight' => -98,
    ];

    $form['basic_settings']['ai_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable text editing assistant'),
      '#default_value' => $ai_enabled,
      '#description' => $this->t('AI writing assistant for text editing'),
    ];

    $form['basic_settings']['ai_page_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable page creation assistant'),
      '#default_value' => $ai_page_enabled,
      '#description' => $this->t('AI-powered page and layout creation'),
    ];

    $form['basic_settings']['ai_image_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable image generation'),
      '#default_value' => $ai_image_enabled,
      '#description' => $this->t('AI-powered image generation'),
    ];

    // Check if ai_provider_dxpr module is enabled.
    $ai_provider_dxpr_enabled = $this->moduleHandler->moduleExists('ai_provider_dxpr');

    $vocabulary_options = [];
    $vocabularies = $this->entityTypeManager
      ->getStorage('taxonomy_vocabulary')
      ->loadMultiple();
    foreach ($vocabularies as $vocabulary) {
      $vocabulary_options[$vocabulary->id()] = $vocabulary->label();
    }

    if (empty($vocabulary_options)) {
      $vocabulary_options[''] = $this->t('No vocabularies available');
    }

    $saved_tone_vocab = $config->get('tone_of_voice_vocabulary');
    $tone_default_value = '';
    if ($saved_tone_vocab && isset($vocabulary_options[$saved_tone_vocab])) {
      $tone_default_value = $saved_tone_vocab;
    }

    // Build the description with a manage link placeholder.
    $tones_description = $this->t('Choose which vocabulary contains your tone of voice options.');
    $manage_tones_url = Url::fromRoute('entity.taxonomy_vocabulary.overview_form', [
    // Placeholder.
      'taxonomy_vocabulary' => $tone_default_value ?: '_',
    ]);
    $tones_description .= ' ' . $this->t('<a href="@url" target="_blank" class="manage-tones-description-link" data-vocab-target="tone_of_voice_vocabulary">Manage tones</a>', [
      '@url' => $manage_tones_url->toString(),
    ]);
    $tones_description .= ' ' . $this->t('or <a href=":tone_tool" target="_blank">generate tone templates</a> from your marketing assets.', [
      ':tone_tool' => 'https://dxpr.com/tools/tone-of-voice',
    ]);

    $form['ai_vocabularies'] = [
      '#type' => 'details',
      '#title' => $this->t('Tone and Commands'),
      '#open' => TRUE,
      '#weight' => -97,
    ];

    $form['ai_vocabularies']['tone_of_voice_vocabulary'] = [
      '#type' => 'select',
      '#title' => $this->t('Tone of voice vocabulary'),
      '#description' => $tones_description,
      '#options' => $vocabulary_options,
      '#default_value' => $tone_default_value,
      '#required' => TRUE,
      '#empty_option' => $this->t('Select a vocabulary'),
      '#empty_value' => '',
      // Add an ID for easier JS targeting of the description wrapper.
      '#id' => 'edit-tone-of-voice-vocabulary',
    ];

    $saved_commands_vocab = $config->get('commands_vocabulary');
    $commands_default_value = '';
    if ($saved_commands_vocab && isset($vocabulary_options[$saved_commands_vocab])) {
      $commands_default_value = $saved_commands_vocab;
    }

    // Build the description with a manage link placeholder.
    $commands_description = $this->t('Choose which vocabulary contains your AI text editing commands.');
    $manage_commands_url = Url::fromRoute('entity.taxonomy_vocabulary.overview_form', [
    // Placeholder.
      'taxonomy_vocabulary' => $commands_default_value ?: '_',
    ]);
    $commands_description .= ' ' . $this->t('<a href="@url" target="_blank" class="manage-commands-description-link" data-vocab-target="commands_vocabulary">Manage commands</a>', [
      '@url' => $manage_commands_url->toString(),
    ]);

    $form['ai_vocabularies']['commands_vocabulary'] = [
      '#type' => 'select',
      '#title' => $this->t('Commands vocabulary'),
      '#description' => $commands_description,
      '#options' => $vocabulary_options,
      '#default_value' => $commands_default_value,
      '#required' => TRUE,
      '#empty_option' => $this->t('Select a vocabulary'),
      '#empty_value' => '',
      // Add an ID for easier JS targeting of the description wrapper.
      '#id' => 'edit-commands-vocabulary',
    ];

    $form['ai_output_security'] = [
      '#type' => 'details',
      '#title' => $this->t('AI Output Security'),
      '#description' => $this->t('Protect against EchoLeak-style prompt injection attacks that exfiltrate data via malicious URLs (CVE-2025-32711). All external URLs in AI output are filtered unless whitelisted.'),
      '#open' => TRUE,
      '#weight' => -96,
    ];

    // Get stored domain list - '*' means allow all (filter disabled).
    $stored_domains = $config->get('ai_output_allowed_domains') ?? "unsplash.com\nimages.unsplash.com\npexels.com\nimages.pexels.com\npixabay.com\npromptahuman.com";
    $filter_enabled = trim($stored_domains) !== '*';
    $display_domains = $filter_enabled ? $stored_domains : '';

    $form['ai_output_security']['ai_output_filter_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Filter external URLs'),
      '#description' => $this->t('Filter all external URLs in AI-generated content. Uncheck to allow all external URLs.'),
      '#default_value' => $filter_enabled,
    ];

    $form['ai_output_security']['ai_output_allowed_domains'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Allowed domains'),
      '#description' => $this->t('Whitelist domains for AI-generated content. One domain per line. Use wildcards for subdomains (e.g., *.wikipedia.org). Leave empty to block all external URLs. Note: promptahuman.com is used for placeholder images.'),
      '#default_value' => $display_domains,
      '#rows' => 6,
      '#states' => [
        'visible' => [
          ':input[name="ai_output_filter_enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Add model selection if ai_provider_dxpr is not enabled.
    if (!$ai_provider_dxpr_enabled) {
      $model_description = $this->t(
        'M1: Best performance (OpenAI, Google Gemini, Anthropic). M1 EU: Privacy-focused (MistralAI). M1 Fast: Fastest responses, lower quality.'
      );
      $form['ai_model'] = [
        '#type' => 'select',
        '#title' => $this->t('Default AI model'),
        '#default_value' => $ai_model,
        '#options' => AiModelConstants::getTranslatedModels(),
        '#description' => $model_description,
        '#weight' => -100,
      ];

      $form['ai_user_model_selection'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Allow users to choose model'),
        '#default_value' => $ai_user_model_selection,
        '#description' => $this->t('When disabled, all users will use the default AI model configured by the administrator.'),
        '#weight' => -100,
      ];
    }

    if ($ai_provider_dxpr_enabled) {
      // If ai_provider_dxpr is enabled, show a standard description with link.
      $form['ai_provider_redirect'] = [
        '#type' => 'item',
        '#title' => $this->t('Service providers'),
        '#description' => $this->t('<a href="@url">Configure AI service providers</a>', [
          '@url' => Url::fromRoute('ai_provider_dxpr.settings_form')->toString(),
        ]),
        '#weight' => -100,
      ];
    }
    else {
      $providers_description_text = $this->t('Drag providers to set priority order. Top provider is used first. Requests automatically fall back to the next enabled provider based on availability and response times.');

      $form['ai_provider_selection_mode'] = [
        '#type' => 'radios',
        '#title' => $this->t('Service providers'),
        '#default_value' => $ai_provider_selection_mode,
        '#options' => [
          'automatic' => $this->t('Automatic'),
          'manual' => $this->t('Manual priority'),
        ],
        '#description' => $this->t('Automatic: Uses best provider based on real-time performance. Manual: Lets you set provider priority order.'),
        '#weight' => -100,
        '#states' => [
          'visible' => [
            ':input[name="ai_model"]' => ['value' => 'dxai_kavya_m1'],
          ],
        ],
      ];
      $form['ai_providers_wrapper'] = [
        '#type' => 'container',
        '#weight' => -100,
        '#states' => [
          'visible' => [
            ':input[name="ai_provider_selection_mode"]' => ['value' => 'manual'],
            ':input[name="ai_model"]' => ['value' => 'dxai_kavya_m1'],
          ],
        ],
      ];

      // Add AI Providers Description.
      $form['ai_providers_wrapper']['ai_providers_description'] = [
        '#type' => 'markup',
        '#markup' => '<p>' . $providers_description_text . '</p>',
      ];

      $module_path = $this->moduleList->getPath('dxpr_builder');
      $logo_base_path = 'base:/' . $module_path . '/images/ai/';
      $provider_info = [
        'anthropic' => [
          'label' => $this->t('Anthropic'),
          'logo' => $logo_base_path . 'anthropic-logo.svg',
          'country' => $this->t('United States'),
          'country_code' => 'US',
        ],
        'gemini' => [
          'label' => $this->t('Google Gemini'),
          'logo' => $logo_base_path . 'gemini-logo.svg',
          'country' => $this->t('United States'),
          'country_code' => 'US',
        ],
        'mistral' => [
          'label' => $this->t('MistralAI'),
          'logo' => $logo_base_path . 'mistralai-logo.svg',
          'country' => $this->t('France'),
          'country_code' => 'FR',
        ],
        'openai' => [
          'label' => $this->t('OpenAI'),
          'logo' => $logo_base_path . 'openai-logo.svg',
          'country' => $this->t('United States'),
          'country_code' => 'US',
        ],
        'xai' => [
          'label' => $this->t('XAI'),
          'logo' => $logo_base_path . 'xai-logo.svg',
          'country' => $this->t('United States'),
          'country_code' => 'US',
        ],
      ];

      // Define the providers table directly in the form, applying the state.
      $form['ai_providers_wrapper']['ai_providers_table'] = [
        '#type' => 'table',
        '#header' => [
          $this->t('Provider'),
          $this->t('Logo'),
          $this->t('Country'),
          ['data' => $this->t('Weight'), 'class' => ['tabledrag-hide']],
          ['data' => '', 'class' => ['tabledrag-hide']],
        ],
        '#empty' => $this->t('No providers available'),
        '#tabledrag' => [
          [
            'action' => 'order',
            'relationship' => 'sibling',
            'group' => 'field-weight',
          ],
          [
            'action' => 'match',
            'relationship' => 'parent',
            'group' => 'provider-region-name',
            'hidden' => TRUE,
            'source' => 'region-name',
          ],
        ],
        '#attributes' => [
          'id' => 'field-display-overview',
          'class' => [
            'field-ui-overview',
            'responsive-enabled',
            'draggable-table',
          ],
        ],
      ];

      $regions = [
        'enabled' => [
          'title' => $this->t('Enabled'),
          'message' => $this->t('No providers enabled'),
        ],
        'disabled' => [
          'title' => $this->t('Disabled'),
          'message' => $this->t('No providers disabled'),
        ],
      ];

      foreach ($regions as $region => $region_info) {
        // Update the target array key for region rows.
        $form['ai_providers_wrapper']['ai_providers_table']['region-' . $region] = [
          '#attributes' => [
            'class' => ['region-title', 'region-' . $region . '-title'],
          ],
          'title' => [
            '#markup' => $region_info['title'],
            '#wrapper_attributes' => [
              'colspan' => 5,
              'class' => ['tabledrag-has-colspan'],
            ],
          ],
        ];
        // Update the target array key for region messages.
        $form['ai_providers_wrapper']['ai_providers_table']['region-' . $region . '-message'] = [
          '#attributes' => [
            'class' => [
              'region-message',
              'region-' . $region . '-message',
              'region-empty',
            ],
          ],
          'message' => [
            '#markup' => $region_info['message'],
            '#wrapper_attributes' => [
              'colspan' => 5,
              'class' => ['tabledrag-has-colspan'],
            ],
          ],
        ];
      }

      $sorted_providers = [];
      $default_weights = [
        'openai' => 0,
        'mistral' => 1,
        'anthropic' => 2,
        'gemini' => 3,
        'xai' => 4,
      ];

      foreach ($provider_info as $provider_id => $provider) {
        $provider_config = $providers_config[$provider_id] ?? [
          'enabled' => TRUE,
          'weight' => $default_weights[$provider_id],
          'region' => 'enabled',
        ];
        if (!isset($providers_config[$provider_id])) {
          $provider_config['region'] = 'enabled';
        }
        $sorted_providers[$provider_id] = [
          'label' => $provider['label'],
          'logo' => Url::fromUri($provider['logo'])->toString(),
          'country' => $provider['country'],
          'country_code' => $provider['country_code'],
          'weight' => $provider_config['weight'],
          'region' => $provider_config['region'],
        ];
      }

      uasort($sorted_providers, fn($a, $b) => $b['weight'] <=> $a['weight']);

      foreach ($sorted_providers as $provider_id => $provider) {
        // Update the target array key for provider rows.
        $form['ai_providers_wrapper']['ai_providers_table'][$provider_id] = $this->buildProviderRow(
          $provider_id,
          $provider,
          $provider['region'],
          $provider['weight']
        );
      }

      // Update the target array key for attached libraries.
      $form['ai_providers_wrapper']['ai_providers_table']['#attached']['library'][] = 'core/drupal.tabledrag';
      $form['ai_providers_wrapper']['ai_providers_table']['#attached']['library'][] = 'core/drupal.tableheader';
      $form['ai_providers_wrapper']['ai_providers_table']['#attached']['library'][] = 'core/drupal.form';
    }

    $form['actions'] = [
      '#type' => 'actions',
      '#weight' => 99,
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save settings'),
      '#button_type' => 'primary',
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $values = $form_state->getValues();

    $config = $this->configFactory->getEditable('dxpr_builder.settings');

    $config
      ->set('ai_enabled', (bool) $values['ai_enabled'])
      ->set('ai_page_enabled', (bool) $values['ai_page_enabled'])
      ->set('ai_image_enabled', (bool) $values['ai_image_enabled']);

    if (!$this->moduleHandler->moduleExists('ai_provider_dxpr')) {
      $config
        ->set('ai_provider_selection_mode', $values['ai_provider_selection_mode'])
        ->set('ai_model', $values['ai_model'])
        ->set('ai_user_model_selection', (bool) $values['ai_user_model_selection']);
    }

    if (!empty($values['tone_of_voice_vocabulary'])) {
      $config->set('tone_of_voice_vocabulary', $values['tone_of_voice_vocabulary']);
      $config->set('enable_taxonomy_tones', TRUE);
    }

    if (!empty($values['commands_vocabulary'])) {
      $config->set('commands_vocabulary', $values['commands_vocabulary']);
      $config->set('enable_taxonomy_commands', TRUE);
    }

    // Save output security settings.
    // Unchecked = save '*' (allow all), checked = save textarea content.
    $filter_enabled = !empty($values['ai_output_filter_enabled']);
    $allowed_domains = $filter_enabled
      ? ($values['ai_output_allowed_domains'] ?? '')
      : '*';
    $config->set('ai_output_allowed_domains', $allowed_domains);

    // Only save providers configuration if ai_provider_dxpr is not enabled.
    if (!$this->moduleHandler->moduleExists('ai_provider_dxpr')) {
      $providers = [];
      if (isset($values['providers'])) {
        foreach ($values['providers'] as $provider_id => $provider_data) {
          if (!isset($provider_data['region-name'])) {
            continue;
          }
          $region = $provider_data['region-name'] ?: 'enabled';
          $providers[$provider_id] = [
            'enabled' => $region === 'enabled',
            'weight' => (int) $provider_data['weight'],
            'region' => $region,
          ];
        }
        $config->set('ai_providers', $providers);
      }
    }

    $config->save();

    // Invalidate the cache tags.
    Cache::invalidateTags(['config:dxpr_builder.settings']);

    $this->messenger()->addStatus($this->t('Settings saved successfully'));
  }

  /**
   * Returns the region to which a provider row is assigned.
   *
   * @param array<string, mixed> $row
   *   The provider row element.
   *
   * @return string
   *   The region name.
   */
  public function getProviderRegion(array $row): string {
    return $row['region-name']['#default_value'];
  }

  /**
   * {@inheritdoc}
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    parent::validateForm($form, $form_state);

    $values = $form_state->getValues();
    if (isset($values['providers'])) {
      foreach ($values['providers'] as $provider_id => $provider_data) {
        if (!isset($provider_data['region-name'])) {
          continue;
        }
        if (empty($provider_data['region-name'])) {
          $form_state->setValue(['providers', $provider_id, 'region-name'], 'enabled');
        }
      }
    }
  }

  /**
   * Builds a provider row for the form table.
   *
   * @param string $provider_id
   *   The provider ID.
   * @param array<string, mixed> $provider
   *   The provider configuration.
   * @param string $region
   *   The region for this provider.
   * @param int $weight
   *   The weight for this provider.
   *
   * @return array<string, mixed>
   *   The form row structure.
   */
  protected function buildProviderRow(string $provider_id, array $provider, string $region, int $weight): array {
    $name_markup = '<div class="provider-name-wrapper">' . $provider['label'] .
      '<sup class="primary-provider-badge">' . $this->t('Primary') . '</sup></div>';

    $logo_markup = '<img src="' . $provider['logo'] . '" alt="' . $provider['label'] . '" class="provider-logo-img">';

    $flags = [
      'US' => "\xF0\x9F\x87\xBA\xF0\x9F\x87\xB8",
      'FR' => "\xF0\x9F\x87\xAB\xF0\x9F\x87\xB7",
      'EU' => "\xF0\x9F\x87\xAA\xF0\x9F\x87\xBA",
    ];
    $flag = $flags[$provider['country_code']] ?? '';
    $eu_suffix = $provider['country_code'] === 'FR' ? ' (' . $flags['EU'] . ' EU)' : '';
    $country_markup = '<span class="provider-country">' . $flag . ' ' . $provider['country'] . $eu_suffix . '</span>';

    $row = [
      '#attributes' => [
        'class' => ['draggable', 'tabledrag-leaf'],
        'data-provider-id' => $provider_id,
        'id' => $provider_id,
      ],
      'name' => [
        '#markup' => $name_markup,
        '#wrapper_attributes' => ['class' => ['provider-name-cell']],
      ],
      'label' => [
        '#type' => 'markup',
        '#markup' => $logo_markup,
        '#wrapper_attributes' => ['class' => ['tabledrag-cell']],
      ],
      'country' => [
        '#type' => 'markup',
        '#markup' => $country_markup,
        '#wrapper_attributes' => ['class' => ['provider-country-cell']],
      ],
      'weight' => [
        '#type' => 'textfield',
        '#title' => $this->t('Weight for @provider', ['@provider' => $provider['label']]),
        '#title_display' => 'invisible',
        '#default_value' => $weight,
        '#size' => 3,
        '#attributes' => ['class' => ['field-weight']],
        '#parents' => ['providers', $provider_id, 'weight'],
        '#wrapper_attributes' => ['class' => ['tabledrag-hide']],
      ],
      'region-name-cell' => [
        '#wrapper_attributes' => [
          'class' => ['region-select-cell', 'tabledrag-hide'],
        ],
        'region-name' => [
          '#type' => 'hidden',
          '#default_value' => $region,
          '#attributes' => [
            'class' => ['provider-region-name'],
            'data-drupal-field-parents' => 'providers[' . $provider_id . '][region-name]',
          ],
          '#parents' => ['providers', $provider_id, 'region-name'],
        ],
      ],
    ];

    return $row;
  }

  /**
   * Submit handler for updating tone vocabulary.
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function updateToneVocabulary(array &$form, FormStateInterface $form_state): void {
    $selected = $form_state->getValue(['tone_of_voice', 'tone_of_voice_vocabulary']);
    if ($selected) {
      try {
        $storage = $this->entityTypeManager->getStorage('taxonomy_vocabulary');
        $vocabulary = $storage->load($selected);
        $name = $vocabulary ? $vocabulary->label() : $selected;
        $this->messenger()->addStatus($this->t('Tone vocabulary updated to: @vocabulary', [
          '@vocabulary' => $name,
        ]));
      }
      catch (\Exception $e) {
        $this->messenger()->addStatus($this->t('Tone vocabulary updated to: @vocabulary', [
          '@vocabulary' => $selected,
        ]));
      }
    }
    $form_state->setRebuild();
  }

  /**
   * Submit handler for updating commands vocabulary.
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function updateCommandsVocabulary(array &$form, FormStateInterface $form_state): void {
    $selected = $form_state->getValue(['commands', 'commands_vocabulary']);
    if ($selected) {
      try {
        $storage = $this->entityTypeManager->getStorage('taxonomy_vocabulary');
        $vocabulary = $storage->load($selected);
        $name = $vocabulary ? $vocabulary->label() : $selected;
        $this->messenger()->addStatus($this->t('Commands vocabulary updated to: @vocabulary', [
          '@vocabulary' => $name,
        ]));
      }
      catch (\Exception $e) {
        $this->messenger()->addStatus($this->t('Commands vocabulary updated to: @vocabulary', [
          '@vocabulary' => $selected,
        ]));
      }
    }
    $form_state->setRebuild();
  }

}
