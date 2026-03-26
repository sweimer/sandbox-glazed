<?php

namespace Drupal\dxpr_builder\Constants;

/**
 * Defines constants for AI models used throughout DXPR Builder.
 *
 * This class centralizes AI model definitions to ensure consistency
 * across the codebase and simplify maintenance.
 */
final class AiModelConstants {

  /**
   * Complete AI model definitions with all related information.
   *
   * Each model entry contains:
   * - 'label': Human-readable name for display
   * - 'api_name': Backend API model name
   * - 'default': Whether this is the default model.
   *
   * @var array
   */
  public const MODELS = [
    'dxai_kavya_m1' => [
      'label' => 'DXAI Kavya M1',
      'api_name' => 'kavya-m1',
      'default' => TRUE,
    ],
    'dxai_kavya_m1_eu' => [
      'label' => 'DXAI Kavya M1 EU',
      'api_name' => 'kavya-m1-eu',
      'default' => FALSE,
    ],
    'dxai_kavya_m1_fast' => [
      'label' => 'DXAI Kavya M1 Fast',
      'api_name' => 'kavya-m1-fast',
      'default' => FALSE,
    ],
  ];

  /**
   * Gets available models with their labels (for form options).
   *
   * @return array
   *   Array of model_key => label pairs.
   */
  public static function getAvailableModels(): array {
    $models = [];
    foreach (self::MODELS as $key => $model) {
      $models[$key] = $model['label'];
    }
    return $models;
  }

  /**
   * Gets available models with translated labels for Drupal forms.
   *
   * This method uses string literals to satisfy Drupal coding standards
   * for t() function usage while maintaining single source of truth.
   *
   * @return array
   *   Array of model_key => translated_label pairs.
   */
  public static function getTranslatedModels(): array {
    return [
      'dxai_kavya_m1' => t('DXAI Kavya M1'),
      'dxai_kavya_m1_eu' => t('DXAI Kavya M1 EU'),
      'dxai_kavya_m1_fast' => t('DXAI Kavya M1 Fast'),
    ];
  }

  /**
   * Gets models dropdown array for drupalSettings with translated labels.
   *
   * @return array
   *   Array suitable for drupalSettings modelsDropdown.
   */
  public static function getModelsDropdown(): array {
    return [
      [
        'value' => 'dxai_kavya_m1',
        'label' => t('DXAI Kavya M1'),
      ],
      [
        'value' => 'dxai_kavya_m1_eu',
        'label' => t('DXAI Kavya M1 EU'),
      ],
      [
        'value' => 'dxai_kavya_m1_fast',
        'label' => t('DXAI Kavya M1 Fast'),
      ],
    ];
  }

  /**
   * Gets model mapping from frontend names to backend API names.
   *
   * @return array
   *   Array of frontend_name => api_name pairs.
   */
  public static function getModelMap(): array {
    $map = [];
    foreach (self::MODELS as $key => $model) {
      $map[$key] = $model['api_name'];
    }
    return $map;
  }

  /**
   * Gets reverse model mapping from backend API names to frontend names.
   *
   * @return array
   *   Array of api_name => frontend_name pairs.
   */
  public static function getReverseModelMap(): array {
    $map = [];
    foreach (self::MODELS as $key => $model) {
      $map[$model['api_name']] = $key;
    }
    return $map;
  }

  /**
   * Gets the default frontend model key.
   *
   * @return string
   *   The default model key.
   */
  public static function getDefaultModel(): string {
    foreach (self::MODELS as $key => $model) {
      if ($model['default']) {
        return $key;
      }
    }
    // Fallback to first model if no default is set.
    return array_key_first(self::MODELS);
  }

  /**
   * Gets the default backend API model name.
   *
   * @return string
   *   The default backend model name.
   */
  public static function getDefaultBackendModel(): string {
    foreach (self::MODELS as $model) {
      if ($model['default']) {
        return $model['api_name'];
      }
    }
    // Fallback to first model's API name if no default is set.
    return array_values(self::MODELS)[0]['api_name'];
  }

}
