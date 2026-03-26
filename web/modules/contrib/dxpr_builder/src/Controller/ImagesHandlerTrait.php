<?php

namespace Drupal\dxpr_builder\Controller;

use Drupal\acquia_dam\Entity\ComputedEmbedCodesField;
use Drupal\acquia_dam\Entity\ImageAltTextField;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\file\FileInterface;
use Drupal\image\ImageStyleInterface;
use Drupal\media\Entity\MediaType;
use Drupal\media\MediaInterface;

/**
 * Provides image handling functionality for controllers.
 *
 * This trait provides methods for handling image-related operations, including
 * - Generating image URLs for both Media and File entities
 * - Applying image styles to images
 * - Retrieving image metadata (alt text, title) from Media entities
 * - Supporting both local media and Acquia DAM assets
 * - Handling image field discovery and access.
 */
trait ImagesHandlerTrait {

  /**
   * Retrieves the file URL generator service.
   *
   * This method provides access to the file URL generator, which is used to
   * create file URLs for file entities.
   *
   * @return \Drupal\Core\File\FileUrlGeneratorInterface
   *   The file URL generator service.
   */
  protected function fileUrlGenerator(): FileUrlGeneratorInterface {
    // @phpstan-ignore isset.property
    if (!isset($this->fileUrlGenerator)) {
      $this->fileUrlGenerator = \Drupal::service('file_url_generator');
    }

    return $this->fileUrlGenerator;
  }

  /**
   * Gets the image URL for a given entity.
   *
   * This method handles both Media and File entities, delegating to
   * the appropriate handler method based on the entity type.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity containing the image (Media or File).
   * @param string $image_style
   *   The image style to apply, defaults to 'original'.
   *
   * @return string
   *   The URL of the image.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  private function getImageUrl(ContentEntityInterface $entity, string $image_style = 'original'): string {
    if ($entity instanceof MediaInterface) {
      return $this->getMediaImageUrl($entity, $image_style);
    }

    if ($entity instanceof FileInterface) {
      return $this->getFileImageUrl($entity, $image_style);
    }

    return '';
  }

  /**
   * Gets the image URL for a Media entity.
   *
   * This method handles both Acquia DAM assets and local media entities,
   * delegating to the appropriate handler method based on the media bundle.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   * @param string $image_style
   *   The image style to apply, defaults to 'original'.
   *
   * @return string
   *   The URL of the media image.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  private function getMediaImageUrl(MediaInterface $media, string $image_style = 'original'): string {
    return $media->bundle() === 'acquia_dam_image_asset'
      ? $this->getAcquiaAssetImageUrl($media, $image_style)
      : $this->getLocalMediaImageUrl($media, $image_style);
  }

  /**
   * Gets the image URL for an Acquia DAM asset.
   *
   * This method handles Acquia DAM image assets, retrieving the URL from the
   * computed embed codes field.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The Acquia DAM media entity.
   * @param string $image_style
   *   The image style to apply, defaults to 'original'.
   *
   * @return string
   *   The URL of the Acquia DAM image.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  private function getAcquiaAssetImageUrl(MediaInterface $media, string $image_style = 'original'): string {
    if (!class_exists(ComputedEmbedCodesField::class)) {
      // "Acquia DAM" module is disabled.
      return '';
    }

    if (
      !$media->hasField(ComputedEmbedCodesField::FIELD_NAME) ||
      $media->get(ComputedEmbedCodesField::FIELD_NAME)->isEmpty()
    ) {
      return '';
    }

    $urls_mapping = $media->get(ComputedEmbedCodesField::FIELD_NAME)
      ->first()
      ->getValue();

    if (!isset($urls_mapping[$image_style]['href'])) {
      return '';
    }

    $url = $urls_mapping[$image_style]['href'];

    // The url should contain "mid" parameter with media ID and
    // "acquiaDamAsset" tells js app that the url is a part of Acquia
    // Assets library.
    return $this->joinQueryParameters($url, [
      'mid' => $media->id(),
      'acquiaDamAsset' => TRUE,
      'imageStyle' => $image_style,
    ]);
  }

  /**
   * Gets the image URL for a local media entity.
   *
   * This method handles local media entities by retrieving the associated file
   * and generating its URL.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The local media entity.
   * @param string $image_style
   *   The image style to apply, defaults to 'original'.
   *
   * @return string
   *   The URL of the local media image.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  protected function getLocalMediaImageUrl(MediaInterface $media, string $image_style = 'original'): string {
    if (!$image_field_name = $this->getMediaImageFieldName($media)) {
      return '';
    }

    /** @var \Drupal\file\FileInterface $file */
    $file = $media->get($image_field_name)->entity;
    return $this->getFileImageUrl($file, $image_style);
  }

  /**
   * Gets the image URL for a File entity.
   *
   * This method handles file entities, applying the specified image style if
   * applicable and generating the appropriate URL.
   *
   * @param \Drupal\file\FileInterface $image
   *   The file entity.
   * @param string $image_style
   *   The image style to apply, defaults to 'original'.
   *
   * @return string
   *   The URL of the file image.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  private function getFileImageUrl(FileInterface $image, string $image_style = 'original'): string {
    $file_uri = $image->getFileUri();
    // For svg images we can't have image styles.
    $isSvg = str_ends_with($file_uri, '.svg');

    // Generate image URL.
    if ($image_style && $image_style !== 'original' && !$isSvg) {
      $image_style = $this->entityTypeManager()
        ->getStorage('image_style')
        ->load($image_style);

      $url = $image_style instanceof ImageStyleInterface
        ? $image_style->buildUrl($image->getFileUri())
        // When image style isn't available, use the original url as fallback.
        : $this->fileUrlGenerator()
          ->generateAbsoluteString($image->getFileUri());
    }
    else {
      $url = $this->fileUrlGenerator()
        ->generateAbsoluteString($image->getFileUri());
    }

    $relative_url = $this->fileUrlGenerator()
      ->transformRelative($url);

    // Include file ID to the url.
    return $this->joinQueryParameters($relative_url, ['fid' => $image->id()]);
  }

  /**
   * Gets metadata for an image entity.
   *
   * This method retrieves metadata (alt text, title) for either a File
   * or Media entity containing an image.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity containing the image (File or Media).
   *
   * @return array
   *   An array containing metadata like alt text and title.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  private function getImageMetadata(ContentEntityInterface $entity): array {
    if ($entity instanceof FileInterface) {
      return $this->getFileImageMetadata($entity);
    }

    if ($entity instanceof MediaInterface) {
      return $this->getMediaImageMetadata($entity);
    }

    return [];
  }

  /**
   * Gets metadata for a File entity.
   *
   * This method retrieves metadata for a file entity by finding associated
   * media entities and getting their metadata.
   *
   * @param \Drupal\file\FileInterface $image
   *   The file entity.
   *
   * @return array
   *   An array containing metadata like alt text and title.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  private function getFileImageMetadata(FileInterface $image): array {
    // Find media entities that reference this file in the field_media_image.
    $medias = $this->entityTypeManager()
      ->getStorage('media')
      ->loadByProperties([
        'field_media_image.target_id' => $image->id(),
      ]);

    if (empty($medias)) {
      return [];
    }

    // Get metadata from the first media entity found.
    /** @var \Drupal\media\MediaInterface $media */
    $media = $medias[array_key_first($medias)];
    return $this->getMediaImageMetadata($media);
  }

  /**
   * Gets metadata for a Media entity.
   *
   * This method handles both Acquia DAM assets and local media entities,
   * delegating to the appropriate handler method based on the media bundle.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   * @param string $image_style
   *   The image style to apply, defaults to 'original'.
   *
   * @return array
   *   An array containing metadata like alt text and title.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  private function getMediaImageMetadata(MediaInterface $media, string $image_style = 'original'): array {
    return $media->bundle() === 'acquia_dam_image_asset'
      ? $this->getAcquiaAssetImageMetadata($media)
      : $this->getLocalMediaImageMetadata($media);
  }

  /**
   * Gets metadata for an Acquia DAM asset.
   *
   * This method retrieves metadata (alt text, title) for
   * an Acquia DAM image asset.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The Acquia DAM media entity.
   *
   * @return array
   *   An array containing metadata like alt text and title.
   */
  private function getAcquiaAssetImageMetadata(MediaInterface $media): array {
    if (!class_exists(ImageAltTextField::class)) {
      // "Acquia DAM" module is disabled.
      return [];
    }

    // Make sure the "altText" property is allowed in Acquia DAM metadata sync
    // settings.
    if (!$this->config('acquia_dam.settings')->get('allowed_metadata.altText')) {
      return [];
    }

    if (
      $media->hasField(ImageAltTextField::IMAGE_ALT_TEXT_FIELD_NAME) &&
      !$media->get(ImageAltTextField::IMAGE_ALT_TEXT_FIELD_NAME)->isEmpty()
    ) {
      $alt_text = $media->get(ImageAltTextField::IMAGE_ALT_TEXT_FIELD_NAME)->getString();
    }
    else {
      // Get the "altText" property value from the remote source.
      $source = $media->getSource();
      // If an alt text does not exist, then we just pull the description.
      $alt_text = $source->getMetadata($media, 'altText');
      $alt_text = $alt_text ?: $source->getMetadata($media, 'description');
    }

    return [
      // Use media name as fallback for alt if still empty.
      'alt' => $alt_text ?: '',
      // Acquia DAM doesn't return the title metadata.
      'title' => '',
    ];
  }

  /**
   * Gets metadata for a local media entity.
   *
   * This method retrieves metadata (alt text, title) for a local media entity
   * containing an image.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The local media entity.
   *
   * @return array
   *   An array containing metadata like alt text and title.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  protected function getLocalMediaImageMetadata(MediaInterface $media): array {
    $image_field_name = $this->getMediaImageFieldName($media);

    $values = $media->get($image_field_name)
      ->first()
      ->getValue();

    return [
      // Try to get alt text from media name as a fallback.
      'alt' => $values['alt'] ?: '',
      'title' => $values['title'] ?: '',
    ];
  }

  /**
   * Joins query parameters to a given URL.
   *
   * This method takes a URL and an associative array of query parameters,
   * appends or merges them with any existing query parameters in the URL,
   * and returns the resulting URL string.
   *
   * @param string $url
   *   The base URL to which query parameters should be added.
   * @param array $query_params
   *   An associative array of query parameters to append to the URL.
   *
   * @return string
   *   The updated URL with the query parameters joined.
   */
  private function joinQueryParameters(string $url, array $query_params): string {
    $path_parts = UrlHelper::parse($url);

    return $path_parts['path'] . '?' .
      UrlHelper::buildQuery($path_parts['query'] + $query_params);
  }

  /**
   * Gets the image field name for a media entity.
   *
   * This method determines the correct field name for accessing the image
   * in a media entity, handling both standard and custom media types.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   *
   * @return string
   *   The name of the field containing the image,
   *   or an empty string if not found.
   */
  protected function getMediaImageFieldName(MediaInterface $media): string {
    if ($media->bundle() !== 'image') {
      return '';
    }

    // Set default image field value.
    $image_field_name = 'field_media_image';

    // If media don't have the field, try to find the source field
    // from the configuration.
    if (!$media->hasField($image_field_name)) {
      $media_bundle_type = $media->get('bundle')->entity;
      // Check media type configs.
      if (
        $media_bundle_type instanceof MediaType &&
        $plugins = $media_bundle_type->getPluginCollections()
      ) {
        $source = $plugins['source_configuration'];
        $configs = $source->getConfiguration();
        // Use a field name from Media type configuration.
        $image_field_name = $configs['source_field'];
      }
    }

    // Not possible to retrieve the image file.
    if (!$media->hasField($image_field_name)) {
      return '';
    }

    return $image_field_name;
  }

}
