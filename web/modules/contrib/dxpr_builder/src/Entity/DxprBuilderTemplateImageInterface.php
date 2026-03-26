<?php

namespace Drupal\dxpr_builder\Entity;

use Drupal\Core\Config\Entity\ConfigEntityInterface;

/**
 * Interface for entities that support template images.
 */
interface DxprBuilderTemplateImageInterface extends ConfigEntityInterface {

  /**
   * Returns the image data as a data URI.
   *
   * @return string|false
   *   The data URI or FALSE if no image.
   */
  public function getImageData();

  /**
   * Sets the base64-encoded image data.
   *
   * @param string $base64_data
   *   The base64-encoded image data.
   *
   * @return $this
   */
  public function setImageData(string $base64_data);

}
