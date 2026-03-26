<?php

namespace Drupal\dxpr_builder\Service;

/**
 * Validates template images.
 */
class TemplateImageValidator implements TemplateImageValidatorInterface {

  /**
   * {@inheritdoc}
   */
  public function isValidImageData(string $binary_data): bool {
    // Check if data is empty.
    if (empty($binary_data)) {
      return FALSE;
    }

    // Detect MIME type.
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mime_type = $finfo->buffer($binary_data);

    // Validate it's an image MIME type.
    if (!$mime_type || strpos($mime_type, 'image/') !== 0) {
      return FALSE;
    }

    // Additional check: Try to get image info to verify it's a valid image.
    $temp_file = tempnam(sys_get_temp_dir(), 'img_validate_');
    if ($temp_file === FALSE) {
      return FALSE;
    }

    try {
      file_put_contents($temp_file, $binary_data);
      $image_info = getimagesize($temp_file);
      unlink($temp_file);

      // If getimagesize returns FALSE, it's not a valid image.
      return $image_info !== FALSE;
    }
    catch (\Throwable $e) {
      if (file_exists($temp_file)) {
        unlink($temp_file);
      }
      return FALSE;
    }
  }

}
