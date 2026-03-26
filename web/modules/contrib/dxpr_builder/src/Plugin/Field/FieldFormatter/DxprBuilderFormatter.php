<?php

namespace Drupal\dxpr_builder\Plugin\Field\FieldFormatter;

use Drupal\dxpr_builder\Constants\AiModelConstants;

use Drupal\Component\Utility\Html;
use Drupal\Core\Access\CsrfTokenGenerator;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ExtensionPathResolver;
use Drupal\Core\Extension\InfoParser;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Extension\ThemeHandlerInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Link;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\Core\Path\CurrentPathStack;
use Drupal\Core\Render\Markup;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\State\StateInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Theme\ThemeManagerInterface;
use Drupal\Core\Url;
use Drupal\dxpr_builder\Entity\DxprBuilderProfile;
use Drupal\dxpr_builder\Service\DxprBuilderJWTDecoder;
use Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface;
use Drupal\dxpr_builder\Service\DxprBuilderServiceInterface;
use Drupal\dxpr_builder\Service\Handler\ProfileHandler;
use Drupal\dxpr_builder\Service\DxprBuilderKeyService;
use Drupal\key\KeyRepositoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;

/**
 * Plugin implementation of the 'dxpr_builder_text' formatter.
 *
 * @FieldFormatter(
 *    id = "dxpr_builder_text",
 *    label = @Translation("DXPR Builder"),
 *    field_types = {
 *       "text",
 *       "text_long",
 *       "text_with_summary"
 *    }
 * )
 */
class DxprBuilderFormatter extends FormatterBase {

  use StringTranslationTrait;

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The configuration factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The current path stack.
   *
   * @var \Drupal\Core\Path\CurrentPathStack
   */
  protected $currentPathStack;

  /**
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * The language manager service.
   *
   * @var \Drupal\Core\Language\LanguageManagerInterface
   */
  protected $languageManager;

  /**
   * The CSRF token generator service.
   *
   * @var \Drupal\Core\Access\CsrfTokenGenerator
   */
  protected $csrfToken;

  /**
   * The extension path resolver service.
   *
   * @var \Drupal\Core\Extension\ExtensionPathResolver
   */
  protected $extensionPathResolver;

  /**
   * The module handler service.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * The renderer service.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * The dxpr builder service.
   *
   * @var \Drupal\dxpr_builder\Service\DxprBuilderServiceInterface
   */
  protected $dxprBuilderService;

  /**
   * The dxpr builder license service.
   *
   * @var \Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface
   */
  private $dxprBuilderLicenseService;

  /**
   * The profile handler service.
   *
   * @var \Drupal\dxpr_builder\Service\Handler\ProfileHandler
   */
  private $profileHandler;

  /**
   * Parsing yaml file.
   *
   * @var \Drupal\Core\Extension\InfoParser
   */
  private $infoParser;

  /**
   * JWT service to manipulate the DXPR JSON token.
   *
   * @var \Drupal\dxpr_builder\Service\DxprBuilderJWTDecoder
   */
  protected $jwtDecoder;

  /**
   * The theme handler.
   *
   * @var \Drupal\Core\Extension\ThemeHandlerInterface
   */
  protected $themeHandler;

  /**
   * The theme manager.
   *
   * @var \Drupal\Core\Theme\ThemeManagerInterface
   */
  protected $themeManager;

  /**
   * The messenger.
   *
   * @var \Drupal\Core\Messenger\MessengerInterface
   */
  protected $messenger;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The DXPR Builder key service.
   *
   * @var \Drupal\dxpr_builder\Service\DxprBuilderKeyService
   */
  protected $dxprBuilderKeyService;

  /**
   * The key repository.
   *
   * @var \Drupal\key\KeyRepositoryInterface|null
   * @phpstan-ignore-next-line
   */
  protected $keyRepository;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * The entity bundle info service.
   *
   * @var \Drupal\Core\Entity\EntityTypeBundleInfoInterface
   */
  protected $entityBundleInfo;

  /**
   * The state service.
   *
   * @var \Drupal\Core\State\StateInterface
   */
  protected $state;

  /**
   * Construct a DxprBuilderFormatter object.
   *
   * @param string $plugin_id
   *   The ID of the formatter.
   * @param string $plugin_definition
   *   The formatter definition.
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The definition of the field.
   * @param mixed[] $settings
   *   The settings of the formatter.
   * @param string $label
   *   The position of the lable when the field is rendered.
   * @param string $view_mode
   *   The current view mode.
   * @param mixed[] $third_party_settings
   *   Any third-party settings.
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   The current user.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The configuration factory.
   * @param \Drupal\Core\Path\CurrentPathStack $currentPathStack
   *   The current path stack.
   * @param \Symfony\Component\HttpFoundation\RequestStack $requestStack
   *   The request stack.
   * @param \Drupal\Core\Language\LanguageManagerInterface $languageManager
   *   The language manager service.
   * @param \Drupal\Core\Access\CsrfTokenGenerator $csrfToken
   *   The CSRF token generator service.
   * @param \Drupal\Core\Extension\ExtensionPathResolver $extensionPathResolver
   *   The extension path resolver service.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $moduleHandler
   *   The module handler service.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer service.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderServiceInterface $dxprBuilderService
   *   The dxpr builder service.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface $dxpr_builder_license_service
   *   The dxpr builder license service.
   * @param \Drupal\dxpr_builder\Service\Handler\ProfileHandler $profile_handler
   *   The profile handler service.
   * @param \Drupal\Core\Extension\InfoParser $infoParser
   *   Parsing yaml file service.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderJWTDecoder $jwtDecoder
   *   Parsing DXPR JWT token.
   * @param \Drupal\Core\Extension\ThemeHandlerInterface $theme_handler
   *   The theme handler.
   * @param \Drupal\Core\Theme\ThemeManagerInterface $theme_manager
   *   The theme manager.
   * @param \Drupal\Core\Messenger\MessengerInterface $messenger
   *   The messenger.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderKeyService $dxpr_builder_key_service
   *   The DXPR Builder key service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service.
   * @param \Drupal\key\KeyRepositoryInterface|null $key_repository
   *   The key repository service.
   * @param \Drupal\Core\Entity\EntityTypeBundleInfoInterface $entity_bundle_info
   *   The entity bundle info service.
   */
  final public function __construct(
    $plugin_id,
    $plugin_definition,
    FieldDefinitionInterface $field_definition,
    array $settings,
    $label,
    $view_mode,
    array $third_party_settings,
    AccountProxyInterface $currentUser,
    ConfigFactoryInterface $configFactory,
    CurrentPathStack $currentPathStack,
    RequestStack $requestStack,
    LanguageManagerInterface $languageManager,
    CsrfTokenGenerator $csrfToken,
    ExtensionPathResolver $extensionPathResolver,
    ModuleHandlerInterface $moduleHandler,
    RendererInterface $renderer,
    DxprBuilderServiceInterface $dxprBuilderService,
    DxprBuilderLicenseServiceInterface $dxpr_builder_license_service,
    ProfileHandler $profile_handler,
    InfoParser $infoParser,
    DxprBuilderJWTDecoder $jwtDecoder,
    ThemeHandlerInterface $theme_handler,
    ThemeManagerInterface $theme_manager,
    MessengerInterface $messenger,
    EntityTypeManagerInterface $entity_type_manager,
    DxprBuilderKeyService $dxpr_builder_key_service,
    LoggerChannelFactoryInterface $logger_factory,
    StateInterface $state,
    // @phpstan-ignore-next-line
    ?KeyRepositoryInterface $key_repository = NULL,
    ?EntityTypeBundleInfoInterface $entity_bundle_info = NULL,
  ) {
    parent::__construct(
      $plugin_id,
      $plugin_definition,
      $field_definition,
      $settings,
      $label,
      $view_mode,
      $third_party_settings
    );

    $this->currentUser = $currentUser;
    $this->configFactory = $configFactory;
    $this->currentPathStack = $currentPathStack;
    $this->requestStack = $requestStack;
    $this->languageManager = $languageManager;
    $this->csrfToken = $csrfToken;
    $this->extensionPathResolver = $extensionPathResolver;
    $this->moduleHandler = $moduleHandler;
    $this->renderer = $renderer;
    $this->dxprBuilderService = $dxprBuilderService;
    $this->dxprBuilderLicenseService = $dxpr_builder_license_service;
    $this->profileHandler = $profile_handler;
    $this->infoParser = $infoParser;
    $this->jwtDecoder = $jwtDecoder;
    $this->themeHandler = $theme_handler;
    $this->themeManager = $theme_manager;
    $this->messenger = $messenger;
    $this->entityTypeManager = $entity_type_manager;
    $this->dxprBuilderKeyService = $dxpr_builder_key_service;
    $this->loggerFactory = $logger_factory;
    $this->state = $state;
    $this->keyRepository = $key_repository;
    $this->entityBundleInfo = $entity_bundle_info;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<mixed> $configuration
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition,
  ) {
    return new static(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['label'],
      $configuration['view_mode'],
      $configuration['third_party_settings'],
      $container->get('current_user'),
      $container->get('config.factory'),
      $container->get('path.current'),
      $container->get('request_stack'),
      $container->get('language_manager'),
      $container->get('csrf_token'),
      $container->get('extension.path.resolver'),
      $container->get('module_handler'),
      $container->get('renderer'),
      $container->get('dxpr_builder.service'),
      $container->get('dxpr_builder.license_service'),
      $container->get('dxpr_builder.profile_handler'),
      $container->get('info_parser'),
      $container->get('dxpr_builder.jwt_decoder'),
      $container->get('theme_handler'),
      $container->get('theme.manager'),
      $container->get('messenger'),
      $container->get('entity_type.manager'),
      $container->get('dxpr_builder.key_service'),
      $container->get('logger.factory'),
      $container->get('state'),
      // @phpstan-ignore-next-line
      $container->has('key.repository') ? $container->get('key.repository') : NULL,
      $container->get('entity_type.bundle.info')
    );
  }

  /**
   * {@inheritdoc}
   *
   * @return array<string, mixed>
   *   An array of default settings for this formatter.
   */
  public static function defaultSettings() {
    return [
      'profile' => '',
    ] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   *
   * @param array<string, mixed> $form
   *   The form where the settings form is being included in.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   *
   * @return array<string, mixed>
   *   The form elements for the formatter settings.
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $element = parent::settingsForm($form, $form_state);

    $profiles = DxprBuilderProfile::loadMultiple();
    $options = [
      '' => $this->t('Default (Role-based Profile)'),
    ];
    $options += array_map(function ($profile) {
      return $profile->label();
    }, $profiles);

    $element['profile'] = [
      '#type' => 'select',
      '#title' => $this->t('Editing Profile'),
      '#description' => $this->t('Select a profile to determine available features and UI elements in DXPR Builder for this field.'),
      '#options' => $options,
      '#default_value' => $this->getSetting('profile'),
      '#attributes' => [
        'aria-label' => $this->t('DXPR Builder Editing Profile'),
      ],
    ];

    if (empty($profiles)) {
      $element['no_profiles_message'] = [
        '#type' => 'markup',
        '#markup' => $this->t('<p><em>No custom profiles available. Using the default role-based profile.</em></p>'),
      ];
    }
    else {
      $element['profile_info'] = [
        '#type' => 'details',
        '#title' => $this->t('Profile Summaries'),
        '#description' => $this->t('Quick overview of available profiles:'),
      ];

      foreach ($profiles as $id => $profile) {
        $element['profile_info'][$id] = [
          '#type' => 'item',
          '#title' => $profile->label(),
          '#description' => $this->getProfileSummary($profile),
        ];
      }
    }

    $create_profile_url = Url::fromRoute('entity.dxpr_builder_profile.add_form');
    $create_profile_link = Link::fromTextAndUrl($this->t('Create New Profile'), $create_profile_url)->toRenderable();
    $create_profile_link['#attributes']['class'][] = 'button';
    $create_profile_link['#attributes']['class'][] = 'button--small';

    $element['create_profile'] = [
      '#type' => 'markup',
      '#markup' => $this->renderer->render($create_profile_link),
      '#prefix' => '<div class="dxpr-profile-actions">',
      '#suffix' => '</div>',
    ];

    $element['#attached']['library'][] = 'dxpr_builder/profile_selector';

    return $element;
  }

  /**
   * Generate a summary of the profile settings.
   *
   * @param \Drupal\dxpr_builder\Entity\DxprBuilderProfile $profile
   *   The DXPR Builder profile.
   *
   * @return string
   *   A summary of the profile settings.
   */
  protected function getProfileSummary(DxprBuilderProfile $profile): string {
    $summary = [];
    $summary[] = $this->t('Elements: @count', ['@count' => count($profile->get('elements'))]);
    $summary[] = $this->t('Blocks: @count', ['@count' => count($profile->get('blocks'))]);
    $summary[] = $this->t('Views: @count', ['@count' => count($profile->get('views'))]);
    $summary[] = $this->t('Templates: @count', ['@count' => count($profile->get('page_templates')) + count($profile->get('user_templates'))]);

    return implode(', ', $summary);
  }

  /**
   * Builds a renderable array for a field value.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $items
   *   The field values to be rendered.
   * @param mixed $langcode
   *   The language that should be used to render the field.
   *
   * @return array
   *   A renderable array for $items, as an array of child elements keyed by
   *   consecutive numeric indexes starting from 0.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function viewElements(FieldItemListInterface $items, $langcode): array {
    $element = [];

    $config = $this->configFactory->get('dxpr_builder.settings');

    $entity_type = $this->fieldDefinition->getTargetEntityTypeId();
    $bundle = $this->fieldDefinition->getTargetBundle();
    /** @var \Drupal\Core\Entity\ContentEntityInterface $entity */
    $entity = $items->getEntity();
    $id = $entity->id();
    $vid = $entity->getRevisionId();
    $field_name = $this->fieldDefinition->getName();
    $container_name = $id . '|' . $vid . '|' . $field_name;
    $entity_label = $entity->label();
    $loadAsBlock = FALSE;
    if ($this->requestStack->getCurrentRequest()->getPathInfo() == '/dxpr_builder/ajax') {
      $loadAsBlock = TRUE;
    }
    $enable_editor = FALSE;
    $current_path = $this->currentPathStack->getPath();
    $is_revision_path = strpos($current_path, '/revisions') !== FALSE;
    $has_permission = $this->dxprBuilderLicenseService->isBillableUser()
      && $entity->access('update', $this->currentUser)
      && !$loadAsBlock
      && !$this->dxprBuilderLicenseService->isBlacklisted()
      && !$is_revision_path;
    $warning = NULL;
    $messages_active = [
      'free_items_limit' => FALSE,
      'free_users_limit' => FALSE,
      'insufficient_users' => FALSE,
      'missing_email' => FALSE,
    ];
    if ($has_permission) {
      // Enforce licensing requirement: valid email address required.
      $user_email = $this->currentUser->getEmail();
      $has_valid_email = !empty($user_email) && strpos($user_email, '@') !== FALSE;

      if (!$has_valid_email) {
        // Log for audit trail.
        $this->loggerFactory->get('dxpr_builder')->warning(
          'DXPR Builder access blocked: User ID @uid lacks valid email address required by licensing agreement.',
          ['@uid' => $this->currentUser->id()]
        );

        // Block editor.
        $enable_editor = FALSE;
        $warning = $this->t(
          'Oops, the no-code editor is not loading here because your user account does not have a valid email address. Per DXPR Builder licensing requirements, all users must have a valid email address. Please <a href="@edit_account">update your account</a> or contact your site administrator to resolve this.',
          [
            '@edit_account' => Url::fromRoute('entity.user.edit_form', ['user' => $this->currentUser->id()])->toString(),
          ]
        );
        $this->messenger->addMessage($warning, 'warning');
        $messages_active['missing_email'] = TRUE;
      }

      $within_users_limit = $has_valid_email ? $this->dxprBuilderLicenseService->withinUsersLimit($this->currentUser) : FALSE;

      // Allow user with UID 1 always to have access.
      if ((int) $this->currentUser->id() === 1) {
        $within_users_limit = TRUE;
      }
      $within_entities_limit = $has_valid_email ? $this->dxprBuilderLicenseService->withinEntitiesLimit($entity) : FALSE;
      $enable_editor = $has_valid_email && $within_users_limit && $within_entities_limit;
      if (!$within_users_limit) {
        $license_info = $this->dxprBuilderLicenseService->getLicenseInfo();
        if ($license_info['tier'] == 'free') {
          $username = $this->entityTypeManager->getStorage('user')->load(1)->name->value;
          $warning = $this->t('Oops, the no-code editor is not loading here. Only one account can use DXPR Builder on the DXPR Free tier. This permission is automatically assigned to the user account with username "%username". Please <a href="@add_subscription" target="_blank">add a paid subscription at DXPR.com</a> to use DXPR Builder with more than one user.', [
            '%username' => $username,
            '@add_subscription' => 'https://dxpr.com/user/me/subscription',
          ]);
          $messages_active['free_users_limit'] = TRUE;
        }
        else {
          $add_users_url = 'https://dxpr.com/user/me/subscription/add-ons';
          $manage_people_url = Url::fromRoute('entity.user.collection')->toString();
          $dxpr_builder_user_licenses_url = Url::fromRoute('dxpr_builder.user_licenses')->toString();

          $warning = $this->t('Oops, the no-code editor is not loading here because there are insufficient User licenses included in your DXPR.com subscription. There currently are <a href=":dxpr_builder_user_licenses_url">@users accounts</a> connected to your product key to use DXPR Builder but there are only @users_limit Users available to your account. Please <a href=":add_users_url" target="_blank">add more Users to your subscription</a> or <a href=":manage_people_url">remove DXPR Builder editing privileges</a> from user accounts to resolve this.', [
            '@users' => $license_info['users_count'],
            '@users_limit' => $license_info['users_limit'],
            ':add_users_url' => $add_users_url,
            ':manage_people_url' => $manage_people_url,
            ':dxpr_builder_user_licenses_url' => $dxpr_builder_user_licenses_url,
          ]);
          $messages_active['insufficient_users'] = TRUE;
        }
      }
      if (!$within_entities_limit) {
        $license_info = $this->dxprBuilderLicenseService->getLicenseInfo();
        $tier = !empty($license_info['tier']) ? ucfirst($license_info['tier']) : $this->t('Free');
        $dxpr_builder_content_licenses_url = Url::fromRoute('dxpr_builder.licensed_content')->toString();
        $warning = $this->t('Sorry, you cannot author more than <a href=":dxpr_builder_content_licenses_url">@entities_limit content items</a> with DXPR Builder on the DXPR @tier tier. Please <a href="@add_subscription" target="_blank">upgrade your account at DXPR.com</a> to create more content with DXPR Builder.', [
          '@add_subscription' => 'https://dxpr.com/user/me/subscription/change',
          '@entities_limit' => $license_info['entities_limit'],
          '@tier' => $tier,
          ':dxpr_builder_content_licenses_url' => $dxpr_builder_content_licenses_url,
        ]);
        $messages_active['free_items_limit'] = TRUE;
      }
      if ($warning) {
        $this->messenger->addMessage($warning, 'warning');
      }
    }

    $element['#attached']['drupalSettings']['dxprBuilder']['messagesActive'] = $messages_active;

    foreach ($items as $delta => $item) {
      // Ignore initializing the builder at excluded pages and empty entities.
      if ($item->getEntity()->id() == NULL) {
        continue;
      }

      $value = $item->value;
      $element[$delta] = [];
      if ($item->getLangcode()) {
        $langcode = $item->getLangcode();
      }
      else {
        $langcode = $this->languageManager->getCurrentLanguage()->getId();
      }
      // Get content type (bundle name) and description for AI context.
      $content_type = '';
      try {
        if ($entity_type === 'node') {
          // For node entities, get the label and description from node type.
          $node_type = $this->entityTypeManager->getStorage('node_type')->load($bundle);
          if ($node_type) {
            $content_type = $node_type->label();
            if ($node_type->getDescription()) {
              $content_type .= ' (' . $node_type->getDescription() . ')';
            }
          }
        }
        else {
          // For other entity types, try to get bundle label and description
          // from bundle info.
          $bundle_info = $this->entityBundleInfo->getBundleInfo($entity_type);
          if (isset($bundle_info[$bundle])) {
            $content_type = $bundle_info[$bundle]['label'] ?? $bundle;
            if (isset($bundle_info[$bundle]['description']) && $bundle_info[$bundle]['description']) {
              $content_type .= ' (' . $bundle_info[$bundle]['description'] . ')';
            }
          }
        }
      }
      catch (\Exception $e) {
        // Silently continue if content type cannot be retrieved.
        // Fallback to bundle machine name.
        $content_type = $bundle;
      }

      $human_readable = base64_encode(Html::escape($field_name . ' on ' . str_replace('node', 'page', $entity_type) . ' ' . $entity_label . ' '));
      $attrs = 'class="az-element az-container dxpr" data-az-type="' . $entity_type . '|' . $bundle . '" data-az-name="' . $container_name . '" data-az-human-readable="' . $human_readable . '" data-az-langcode="' . $langcode . '" data-az-title="' . Html::escape($entity_label) . '"';

      // Add content type if available.
      if ($content_type) {
        $attrs .= ' data-az-content-type="' . Html::escape($content_type) . '"';
      }
      preg_match('/^\s*\<[\s\S]*\>\s*$/', $value, $html_format);

      // non-breaking space if the forced default value in DXPR Builder.
      // This prevents the field from not rendering at all.
      $clean_empty_value = str_replace('&nbsp;', '', $value);
      if (!$clean_empty_value && $enable_editor) {
        $output = '<div ' . $attrs . ' style="display:none"></div>';
        $mode = 'static';
      }
      else {
        if (!$html_format) {
          $value = '<p>' . $value . '</p>';
        }
        $response = $this->dxprBuilderService->updateHtml($value, $enable_editor);
        $output = $response['output'];
        $mode = $response['mode'];
        $libraries = $response['library'];
        $settings = $response['settings'];

        foreach ($libraries as $library) {
          $element[$delta]['#attached']['library'][] = $library;
        }

        // Adds html_head scripts.
        if (isset($settings['dxpr_html_head'])) {
          $element[$delta]['#attached']['html_head'] = $settings['dxpr_html_head'];
          unset($settings['dxpr_html_head']);
        }

        foreach ($settings as $key => $setting) {
          $element[$delta]['#attached']['drupalSettings'][$key] = $setting;
        }
        $output = '<div ' . $attrs . ' data-az-mode="' . $mode . '">' . $output . '</div>';

        // DXPR Builder 1.1.0 Experimental feature: Process Text Format
        // Filters for non-editors ~Jur 15/06/16
        // Don't run text format filters when editor is loaded because
        // the editor would save all filter output into the db.
        if (!$this->dxprBuilderLicenseService->isBillableUser()
          && $config->get('format_filters')) {
          $build = [
            '#type' => 'processed_text',
            '#text' => $output,
            '#format' => $item->__get('format'),
            '#  ' => [],
            '#langcode' => $langcode,
          ];

          $output = $this->renderer->renderInIsolation($build);
        }
      }

      $element[$delta]['#markup'] = Markup::create($output);
      $element[$delta]['#id'] = $id . '|' . $field_name;
      // Attach DXPR Builder assets.
      $this->attachAssets($container_name, $element[$delta], $value, $html_format, $enable_editor, $mode, $this->languageManager->getCurrentLanguage()->getId());
    }

    $element['#cache']['max-age'] = $warning ? 0 : DxprBuilderLicenseServiceInterface::LICENSE_NOT_AUTHORIZED_INTERVAL;
    $element['#cache']['contexts'] = ['url'];
    $element['#cache']['tags'] = $config->getCacheTags();
    $profile_id = $this->getSetting('profile');
    if (empty($profile_id) || $profile_id === '_default') {
      $profile = DxprBuilderProfile::loadByRoles($this->currentUser->getRoles());
    }
    else {
      $profile = DxprBuilderProfile::load($profile_id);
    }

    if ($profile) {
      $profile_settings = $this->profileHandler->buildSettings($profile);
      $element['#attached']['drupalSettings']['dxprBuilder']['profile'] = $profile_settings;
      $element['#cache']['tags'] = Cache::mergeTags($element['#cache']['tags'], $profile->getCacheTags());
    }

    // Add cache tags so render cache invalidates when blocks/views
    // change. This keeps the CMS elements list in the editor fresh.
    $cms_element_tags = [
      'block_content_list',
      'config:view_list',
    ];
    $element['#cache']['tags'] = Cache::mergeTags($element['#cache']['tags'], $cms_element_tags);

    $this->moduleHandler->invokeAll('dxpr_builder_view_elements', [&$element]);

    return $element;
  }

  /**
   * Attaches CSS and JS assets to field render array.
   *
   * @param string $container_name
   *   Unique container identifier.
   * @param mixed[] $element
   *   A renderable array for the $items, as an array of child
   *   elements keyed by numeric indexes starting from 0.
   * @param string $content
   *   Raw field value.
   * @param mixed[] $html_format
   *   Valid HTML field value.
   * @param bool $enable_editor
   *   When FALSE only frontend rendering assets will be attached. When TRUE
   *   the full drag and drop editor will be attached.
   * @param string $mode
   *   The mode.
   * @param string $dxpr_lang
   *   Two letter language code.
   *
   * @phpstan-return array<string, mixed>
   *
   * @see https://api.drupal.org/api/drupal/modules!field!field.api.php/function/hook_field_formatter_view/7.x
   */
  public function attachAssets($container_name, array &$element, $content, $html_format, $enable_editor, $mode, $dxpr_lang): array {
    $config = $this->configFactory->get('dxpr_builder.settings');

    $settings = [];
    $settings['disallowContainers'] = [];
    $settings['currentPath'] = $this->currentPathStack->getPath();

    $settings['offsetSelector'] = $config->get('offset_selector') ?: '.dxpr-theme-header--sticky, .dxpr-theme-header--fixed';

    if ($enable_editor) {
      $settings['dxprEditor'] = TRUE;
    }

    if ($this->moduleHandler->moduleExists('dxpr_builder_e')) {
      $settings['enterprise'] = TRUE;
    }

    $url = Url::fromRoute('dxpr_builder.ajax_callback');
    $token = $this->csrfToken->get($url->getInternalPath());
    $dxprBuilderPath = $this->getPath('module', 'dxpr_builder');
    $url->setOptions(['query' => ['token' => $token]]);
    $settings['dxprAjaxUrl'] = $url->toString();

    $csrf_url = Url::fromRoute('dxpr_builder.csrf_refresh');
    $settings['dxprCsrfUrl'] = $csrf_url->toString();

    $settings['dxprLanguage'] = $dxpr_lang;

    $infoFile = $this->infoParser->parse($dxprBuilderPath . '/dxpr_builder.info.yml');
    if (!empty($infoFile['version'])) {
      $settings['dxprBuilderVersion'] = $infoFile['version'];
    }
    else {
      $settings['dxprBuilderVersion'] = 'dev';
    }

    $settings['dxprBaseUrl'] = base_path() . $dxprBuilderPath . '/dxpr_builder/';
    $settings['dxprBasePath'] = base_path();

    // Use the key service to get the API key.
    if ($api_key = $this->dxprBuilderKeyService->getApiKey()) {
      $jwtPayloadData = $this->jwtDecoder->decodeJwt($api_key);
      if ($jwtPayloadData['sub'] != NULL || $jwtPayloadData['scope'] != NULL) {
        $settings['dxprTokenInfo'] = $jwtPayloadData;
      }
    }

    $settings['dxprSubscriptionInfo'] = $this->dxprBuilderLicenseService->getLicenseInfo();
    $settings['dxprDrmLastContact'] = $this->state->get('dxpr_builder.drm_last_contact');
    $settings['serverTime'] = time();

    if ($this->currentUser->id() != 0) {
      // Check if DXPR User id exists in JWT.
      $dxpr_user_exists = isset($jwtPayloadData) ? array_key_exists('sub', $jwtPayloadData) : FALSE;
      // Get enabled modules.
      $module_list = $this->moduleHandler->getModuleList();

      $settings['dxprUserInfo'] = [
        'local_email' => $this->currentUser->getEmail(),
        'local_email_hashed' => $this->hashEmail($this->currentUser->getEmail(), 14),
        'local_uid' => $this->currentUser->id(),
        'local_username' => $this->currentUser->getDisplayName(),
        'default_theme' => $this->themeHandler->getDefault(),
        'active_theme' => $this->themeManager->getActiveTheme()->getName(),
        'drupal_version' => \Drupal::VERSION,
        'installed_modules' => array_keys($module_list),
        'dxpr_user_id' => $dxpr_user_exists ? $jwtPayloadData['sub'] : NULL,
      ];

      $settings['dxprSiteInfo'] = [
        'dxpr_builder_editors' => $this->dxprBuilderLicenseService->getUsersCount(),
        'dxpr_builder_items' => $this->dxprBuilderLicenseService->getValuesCount(NULL, NULL),
      ];
    }

    $element['#attached']['library'][] = 'dxpr_builder/core';
    if (!$enable_editor) {
      if ($mode == 'dynamic') {
        if ($config->get('editor_assets_source') == 2) {
          $element['#attached']['library'][] = 'dxpr_builder/editor.frontend_dev';
        }
        else {
          $element['#attached']['library'][] = 'dxpr_builder/editor.frontend';
        }
      }
    }

    if ($config->get('editor_assets_source') == 2) {
      $element['#attached']['library'][] = 'dxpr_builder/editor.dev';
      $settings['dxprDevelopment'] = TRUE;
    }

    if ($config->get('bootstrap') == 1) {
      $element['#attached']['library'][] = 'dxpr_builder/bootstrap_3';
    }
    elseif ($config->get('bootstrap') === 'bs4') {
      $element['#attached']['library'][] = 'dxpr_builder/bootstrap_4';
    }
    elseif ($config->get('bootstrap') === 'bs5') {
      $element['#attached']['library'][] = 'dxpr_builder/bootstrap_5';
    }

    if ($enable_editor) {
      $this->dxprBuilderService->editorAttach($element, $settings);
    }
    else {
      $settings['disallowContainers'][] = $container_name;
    }

    $settings['mediaBrowser'] = $config->get('media_browser') ?: '';
    // We don't have specific functionality for "media_library_acquia_dam"
    // option on js app, so we should tell it that we are using a media library.
    // This option needs to understand what exactly a media source load in
    // "AjaxController::openImageMediaLibrary()".
    if ($settings['mediaBrowser'] === 'media_library_acquia_dam') {
      $settings['mediaBrowser'] = 'media_library';
    }

    if ($settings['mediaBrowser'] != '') {
      $mediaBrowserSettings = [
        'dxprBuilderSingle' => [
          'cardinality' => 1,
          'selection_mode' => 'selection_append',
          'selector' => FALSE,
        ],
        'dxprBuilderMulti' => [
          'cardinality' => -1,
          'selection_mode' => 'selection_append',
          'selector' => FALSE,
        ],
      ];

      if ($settings['mediaBrowser'] === 'media_library') {
        $mediaBrowserSettings['libraryPath'] = Url::fromRoute('dxpr_builder.media_library')
          ->toString();
      }
      elseif (
        $this->moduleHandler->moduleExists('entity_browser') ||
        $this->moduleHandler->moduleExists('lightning_media')
      ) {
        $mediaBrowserSettings['libraryPath'] = '/entity-browser/modal/' . $settings['mediaBrowser'];
        $element['#attached']['library'][] = 'entity_browser/common';
      }

      // Attach Entity Browser Configurations and libraries.
      $element['#attached']['drupalSettings']['entity_browser'] = $mediaBrowserSettings;
    }

    if ($palette = $this->colorGetPalette()) {
      $settings['palette'] = array_slice(array_unique($palette), 0, 10);
    }

    // Add AI settings from DXPR Builder configuration.
    $dxprConfig = $this->configFactory->get('dxpr_builder.settings');
    $is_billable = $this->dxprBuilderLicenseService->isBillableUser();
    // Default to TRUE when config key doesn't exist (NULL).
    $ai_enabled = $dxprConfig->get('ai_enabled');
    $ai_enabled = $ai_enabled === NULL ? TRUE : (bool) $ai_enabled;
    $ai_model = $dxprConfig->get('ai_model');
    $ai_page_enabled = $dxprConfig->get('ai_page_enabled');
    $ai_page_enabled = $ai_page_enabled === NULL ? TRUE : (bool) $ai_page_enabled;
    $ai_image_enabled = $dxprConfig->get('ai_image_enabled');
    $ai_image_enabled = $ai_image_enabled === NULL ? TRUE : (bool) $ai_image_enabled;
    $ai_user_model_selection = $dxprConfig->get('ai_user_model_selection');
    $ai_user_model_selection = $ai_user_model_selection === NULL ? TRUE : (bool) $ai_user_model_selection;
    $aiProviders = [];
    if ($this->moduleHandler->moduleExists('ai_provider_dxpr')) {
      $aiProviderDxprConfig = $this->configFactory->get('ai_provider_dxpr.settings');
      // Override model setting from ai_provider_dxpr if available.
      $ai_model_override = $aiProviderDxprConfig->get('ai_model');
      if ($ai_model_override) {
        // Map the ai_provider_dxpr model values to dxpr_builder model values.
        $ai_model = AiModelConstants::getReverseModelMap()[$ai_model_override] ?? $ai_model;
      }
      $ai_provider_selection_mode = $aiProviderDxprConfig->get('ai_provider_selection_mode') ?? 'automatic';
      if ($ai_provider_selection_mode === 'manual') {
        $aiProviders = $aiProviderDxprConfig->get('ai_providers') ?: [];
      }
    }
    else {
      $ai_provider_selection_mode = $dxprConfig->get('ai_provider_selection_mode') ?? 'automatic';
      if ($ai_provider_selection_mode === 'manual') {
        $aiProviders = $dxprConfig->get('ai_providers') ?: [];
      }
    }

    $settings['ai_enabled'] = $is_billable && $ai_enabled;
    $settings['ai_model'] = $ai_model;
    $settings['ai_page_enabled'] = $ai_page_enabled;
    $settings['ai_image_enabled'] = $ai_image_enabled;
    $settings['ai_providers'] = $aiProviders;
    $settings['ai_settings_path'] = Url::fromRoute('dxpr_builder.ai_settings')->toString();

    // Base AI settings - always include these.
    $modelMap = AiModelConstants::getModelMap();

    $mapped_ai_model = $modelMap[$ai_model] ?? AiModelConstants::getDefaultBackendModel();

    $settings['aiAgent'] = [
      'enabled' => (bool) $ai_enabled,
      'pageEnabled' => (bool) $ai_page_enabled,
      'imageEnabled' => (bool) $ai_image_enabled,
      'userModelSelection' => $ai_user_model_selection,
      'model' => $mapped_ai_model,
      'engine' => 'dxai',
    ];

    // Only include providers parameter when the model is kavya-m1.
    if ($mapped_ai_model === AiModelConstants::getDefaultBackendModel() && !empty($aiProviders)) {
      $settings['aiAgent']['providers'] = $aiProviders;
    }

    // Only add API key and additional settings if AI is enabled.
    if ($ai_enabled) {
      // Use the already obtained API key from the key service.
      if ($api_key) {
        $settings['aiAgent']['apiKey'] = $api_key;

        // AI output security settings (CVE-2025-32711 / EchoLeak mitigation).
        // Domain list: '*' = allow all, empty = block all, list = whitelist.
        $domains_text = $dxprConfig->get('ai_output_allowed_domains') ?? "unsplash.com\nimages.unsplash.com\npexels.com\nimages.pexels.com\npixabay.com\npromptahuman.com";
        $allowed_domains = array_filter(array_map('trim', explode("\n", $domains_text)));

        $settings['aiOutputSecurity'] = [
          'allowedDomains' => $allowed_domains,
        ];

        // Pass security settings to CKEditor 5 AI Agent plugin.
        $settings['aiAgent']['aiOutputSecurity'] = [
          'allowedDomains' => $allowed_domains,
        ];

        // Add settings URL for blocked URL notifications.
        $settings['aiSecuritySettingsUrl'] = Url::fromRoute('dxpr_builder.ai_settings')->toString();

        // Add taxonomy-based tones of voice if configured.
        $tone_vocabulary = $dxprConfig->get('tone_of_voice_vocabulary');
        if (!empty($tone_vocabulary)) {
          try {
            $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');
            // Use loadTree() to get validated terms with correct hierarchy.
            $tree_terms = $term_storage->loadTree($tone_vocabulary);
            $terms = [];
            if (!empty($tree_terms)) {
              $tids = array_column($tree_terms, 'tid');
              $terms = $term_storage->loadMultiple($tids);
              $tones_dropdown = [];

              foreach ($terms as $term) {
                $description = $term->getDescription();
                if (!empty($description)) {
                  $tones_dropdown[] = [
                    'label' => $term->label(),
                    'tone' => $description,
                  ];
                }
              }

              if (!empty($tones_dropdown)) {
                // Add to existing settings array.
                $settings['aiAgent']['tonesDropdown'] = $tones_dropdown;
                // Remove defaultTone as requested.
              }
            }
          }
          catch (\Exception $e) {
            $this->getLogger('dxpr_builder')->error('Error loading tone of voice taxonomy terms: @error', [
              '@error' => $e->getMessage(),
            ]);
          }
        }

        // Add available models dropdown.
        $models_dropdown = AiModelConstants::getModelsDropdown();
        $settings['aiAgent']['modelsDropdown'] = $models_dropdown;

        // Add model mapping for frontend use.
        $settings['aiAgent']['modelMap'] = $modelMap;

        // Add taxonomy-based commands if configured.
        $commands_vocabulary = $dxprConfig->get('commands_vocabulary');
        if (!empty($commands_vocabulary)) {
          try {
            $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');

            // Use loadTree() to get validated terms with correct hierarchy.
            $tree_terms = $term_storage->loadTree($commands_vocabulary);
            $commands_dropdown = [];
            $categories = [];

            if (!empty($tree_terms)) {
              // Organize terms by hierarchy (categories and child commands)
              foreach ($tree_terms as $tree_term) {
                if ($tree_term->parents[0] == 0) {
                  // This is a parent category.
                  $categories[$tree_term->tid] = [
                    'term' => $tree_term,
                    'children' => [],
                  ];
                }
                else {
                  // This is a child command.
                  $parent_id = $tree_term->parents[0];
                  if (isset($categories[$parent_id])) {
                    $categories[$parent_id]['children'][] = $tree_term;
                  }
                }
              }

              // Build the dropdown structure.
              foreach ($categories as $category_data) {
                $command_group = [
                  'title' => $category_data['term']->name,
                  'items' => [],
                ];

                // Add child commands to this category.
                foreach ($category_data['children'] as $command_tree_term) {
                  // Load the full term to get description.
                  $command_term = $term_storage->load($command_tree_term->tid);
                  $description = $command_term->getDescription();

                  // Only add terms that have a description (command)
                  if (!empty($description)) {
                    $command_item = [
                      'title' => $command_term->label(),
                      'command' => $description,
                    ];

                    $command_group['items'][] = $command_item;
                  }
                }

                // Only add the category if it has commands.
                if (!empty($command_group['items'])) {
                  $commands_dropdown[] = $command_group;
                }
              }

              if (!empty($commands_dropdown)) {
                // Add to existing settings array.
                $settings['aiAgent']['commandsDropdown'] = $commands_dropdown;
              }
            }
          }
          catch (\Exception $e) {
            $this->getLogger('dxpr_builder')->error('Error loading command taxonomy terms: @error', [
              '@error' => $e->getMessage(),
            ]);
          }
        }
      }
    }

    // Related to DXPR analytics service.
    $settings['recordAnalytics'] = FALSE;
    $recordAnalytics = ($config->get('record_analytics') === NULL) ? TRUE : $config->get('record_analytics');
    if ($recordAnalytics) {
      $settings['recordAnalytics'] = TRUE;
    }

    // Related to AI page creation feature.
    $settings['aiPageEnabled'] = (bool) $ai_page_enabled;

    // Related to DXPR hiding reminders after 5 clicks.
    $settings['hideReminders'] = ($config->get('hide_reminders') === NULL)
        ? TRUE
        : $config->get('hide_reminders');

    // Related to DXPR notifications.
    $notifications = ($config->get('notifications') === NULL) ? TRUE : $config->get('notifications');
    if ($notifications) {
      $settings['notifications'] = $notifications;
    }

    $element['#attached']['drupalSettings']['dxprBuilder'] = $settings;

    return [];
  }

  /**
   * Wrapper for drupal_get_path()
   *
   * @param string $type
   *   The type of path to return, module or theme.
   * @param string $name
   *   The name of the theme/module to look up.
   *
   * @return string
   *   The path to the given module/theme
   *
   * @see drupal_get_path()
   */
  private function getPath($type, $name) {
    $paths = &drupal_static(__CLASS__ . '::' . __FUNCTION__, []);
    $key = $type . '::' . $name;
    if (!isset($paths[$key])) {
      $paths[$key] = $this->extensionPathResolver->getPath($type, $name);
    }

    return $paths[$key];
  }

  /**
   * Get the theme color palette for the current theme.
   *
   * @return array<string>|null
   *   Return color palette if possible.
   */
  private function colorGetPalette(): ?array {
    $default_theme = $this->configFactory->get('system.theme')->get('default');

    // Get palette from color module.
    if ($this->moduleHandler->moduleExists('color')) {
      // @phpstan-ignore-next-line
      $info = color_get_info($default_theme);

      if ($info && array_key_exists('colors', $info['schemes']['default'])) {
        // @phpstan-ignore-next-line
        return array_values(color_get_palette($default_theme));
      }
    }
    // Get palette from theme.
    else {
      $theme_config = $this->configFactory->getEditable($default_theme . '.settings');

      if ($palette = $theme_config->get('color_palette')) {
        return array_values(unserialize($palette, ['allowed_classes' => FALSE]));
      }
    }

    return NULL;
  }

  /**
   * Partly hash an email address with sha256.
   *
   * @param string $email
   *   The email address.
   * @param int $length
   *   (optional) The length of the returned string.
   *
   * @return string
   *   The hashed email address.
   */
  private function hashEmail($email, $length = 0) {
    // Defensive check - should never reach here with invalid email
    // but protect against edge cases.
    if (empty($email) || strpos($email, '@') === FALSE) {
      $this->loggerFactory->get('dxpr_builder')->error(
        'hashEmail called with invalid email: @email',
        ['@email' => var_export($email, TRUE)]
      );
      return 'invalid@local.invalid';
    }

    $parts = explode('@', $email);
    $hashed = hash('sha256', $parts[0] . "48dfhj2k9");
    $hashed = ($length > 0) ? substr($hashed, 0, $length) : $hashed;
    return $hashed . '@' . $parts[1];
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = parent::settingsSummary();

    $profile_id = $this->getSetting('profile');
    if ($profile_id === '_default' || empty($profile_id)) {
      $summary[] = $this->t('Using default role-based profile');
    }
    elseif ($profile = DxprBuilderProfile::load($profile_id)) {
      $summary[] = $this->t('Profile: @name', ['@name' => $profile->label()]);
      $summary[] = $this->getProfileSummary($profile);
    }
    else {
      $summary[] = $this->t('Invalid profile selected: @id', ['@id' => $profile_id]);
    }

    return $summary;
  }

  /**
   * Gets a logger instance for a specific channel.
   *
   * @param string $channel
   *   The name of the channel.
   *
   * @return \Psr\Log\LoggerInterface
   *   The logger for the given channel.
   */
  protected function getLogger($channel) {
    return $this->loggerFactory->get($channel);
  }

}
