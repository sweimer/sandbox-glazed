<?php

namespace Drupal\dxpr_builder\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Service for handling DXPR Builder API keys.
 */
class DxprBuilderKeyService {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * The key repository.
   *
   * @var object|null
   */
  protected $keyRepository;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new DxprBuilderKeyService.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param object|null $key_repository
   *   The key repository service, if available.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    ModuleHandlerInterface $module_handler,
    EntityTypeManagerInterface $entity_type_manager,
    ?object $key_repository = NULL,
  ) {
    $this->configFactory = $config_factory;
    $this->moduleHandler = $module_handler;
    $this->entityTypeManager = $entity_type_manager;
    $this->keyRepository = $key_repository;
  }

  /**
   * Gets the API key from the configured storage method.
   *
   * @return string|null
   *   The API key if found, NULL otherwise.
   */
  public function getApiKey(): ?string {
    $config = $this->configFactory->get('dxpr_builder.settings');
    $storage_type = $config->get('api_key_storage');

    // Always respect the storage type setting.
    if ($storage_type === 'key' &&
        $this->moduleHandler->moduleExists('key') &&
        $this->keyRepository) {
      $key_id = $config->get('key_provider');

      if (!$key_id) {
        return NULL;
      }

      // Use method_exists to safely check for getKey method.
      if (method_exists($this->keyRepository, 'getKey')) {
        $key = $this->keyRepository->getKey($key_id);
        return $key && method_exists($key, 'getKeyValue') ? $key->getKeyValue() : NULL;
      }
    }

    // Default to config storage.
    return $config->get('json_web_token');
  }

  /**
   * Sets the API key using the specified storage method.
   *
   * @param string $key_value
   *   The API key value to store.
   * @param string $storage_type
   *   The storage type to use ('config' or 'key').
   * @param string|null $selected_key_id
   *   The key ID to use when storing in the Key module.
   */
  public function setApiKey(string $key_value, string $storage_type = 'config', ?string $selected_key_id = NULL): void {
    $config = $this->configFactory->getEditable('dxpr_builder.settings');

    if ($storage_type === 'key' &&
        $this->moduleHandler->moduleExists('key') &&
        $this->keyRepository &&
        method_exists($this->keyRepository, 'getKey')) {
      $key_id = $selected_key_id ?? 'dxpr_builder_api_key';
      $key = $this->keyRepository->getKey($key_id);

      if (!$key && $key_id === 'dxpr_builder_api_key') {
        // Create a new key entity.
        $values = [
          'id' => $key_id,
          'label' => 'DXPR Builder API Key',
          'key_type' => 'authentication',
          'key_provider' => 'config',
          'key_provider_settings' => [
            'key_value' => $key_value,
          ],
          'key_input' => 'text_field',
        ];
        $storage = $this->entityTypeManager->getStorage('key');
        $key = $storage->create($values);
        $key->save();
      }
      elseif ($key && !empty($key_value) && method_exists($key, 'setKeyValue')) {
        // Update existing key.
        $key->setKeyValue($key_value);
        if (method_exists($key, 'save')) {
          $key->save();
        }
      }

      $config->set('key_provider', $key_id);
      $config->set('json_web_token', NULL);
    }
    else {
      $config->set('json_web_token', $key_value);
      $config->set('key_provider', NULL);
    }

    $config->set('api_key_storage', $storage_type);
    $config->save();
  }

}
