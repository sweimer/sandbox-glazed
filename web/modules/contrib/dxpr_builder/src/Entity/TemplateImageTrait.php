<?php

namespace Drupal\dxpr_builder\Entity;

/**
 * Provides common image handling for template entities.
 */
trait TemplateImageTrait {

  /**
   * The base64-encoded image data.
   *
   * @var string
   */
  protected $image;

  /**
   * {@inheritdoc}
   */
  public function getImageData() {
    $image = $this->get('image');
    if ($image && is_string($image)) {
      $binary = base64_decode($image);
      $mime_type = $this->detectImageMimeType($binary);
      return 'data:' . $mime_type . ';base64,' . $image;
    }
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function setImageData(string $base64_data) {
    $this->set('image', $base64_data);
    return $this;
  }

  /**
   * Detects the MIME type of an image from its binary data.
   *
   * @param string $binary
   *   The binary image data.
   *
   * @return string
   *   The MIME type (e.g., 'image/png', 'image/jpeg').
   */
  protected function detectImageMimeType($binary) {
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mime_type = $finfo->buffer($binary);

    if ($mime_type && strpos($mime_type, 'image/') === 0) {
      return $mime_type;
    }

    return 'image/png';
  }

}
