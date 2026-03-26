<?php

namespace Drupal\dxpr_builder\Service;

/**
 * Interface for template image validation service.
 */
interface TemplateImageValidatorInterface {

  /**
   * Validates that binary data is a valid image.
   *
   * @param string $binary_data
   *   The binary image data to validate.
   *
   * @return bool
   *   TRUE if valid image, FALSE otherwise.
   */
  public function isValidImageData(string $binary_data): bool;

}
