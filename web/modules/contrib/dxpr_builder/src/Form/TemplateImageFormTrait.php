<?php

namespace Drupal\dxpr_builder\Form;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Form\FormStateInterface;

/**
 * Provides common image form handling for template forms.
 */
trait TemplateImageFormTrait {

  /**
   * The file storage service.
   *
   * @var \Drupal\Core\Entity\EntityStorageInterface
   */
  protected $fileStorage;

  /**
   * The DXPR Builder service.
   *
   * @var \Drupal\dxpr_builder\Service\DxprBuilderServiceInterface
   */
  protected $dxprBuilderService;

  /**
   * Builds the image upload and preview form elements.
   *
   * @param array $form
   *   The form array to add elements to.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   *
   * @phpstan-assert \Drupal\dxpr_builder\Entity\DxprBuilderTemplateImageInterface $this->entity
   */
  protected function buildImageFormElements(array &$form, FormStateInterface $form_state): void {
    $form['image'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Image'),
      '#upload_location' => 'temporary://',
    ];

    /** @var \Drupal\dxpr_builder\Entity\DxprBuilderTemplateImageInterface $entity */
    $entity = $this->entity;
    $entity_image = $entity->get('image');
    if ($entity_image && is_string($entity_image)) {
      $form_state->set('image', $entity_image);
    }
    if ($image = $entity->getImageData()) {
      $form['image_preview'] = [
        '#type' => 'fieldset',
        '#title' => $this->t('Current image preview'),
      ];
      $form['image_preview']['image'] = [
        '#theme' => 'image',
        '#uri' => $image,
      ];
    }
  }

  /**
   * Processes the uploaded image and sets it on the entity.
   *
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  protected function processTemplateImage(FormStateInterface $form_state): void {
    if ($fid = $form_state->getValue('image')) {
      if ($file = $this->fileStorage->load($fid[0])) {
        /** @var \Drupal\file\FileInterface $file */
        $image = file_get_contents($file->getFileUri());
        $image_base64 = base64_encode($image);
        // Process image through optimize image style if available.
        $image_base64 = $this->dxprBuilderService->processUserTemplateImage($image_base64);
        $this->entity->set('image', $image_base64);
      }
    }
    else {
      $existing_image = $form_state->get('image');
      if ($existing_image && is_string($existing_image)) {
        $this->entity->set('image', $existing_image);
      }
    }
  }

  /**
   * Invalidates cache tags and redirects to collection.
   *
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  protected function invalidateCacheAndRedirect(FormStateInterface $form_state): void {
    // Invalidate cache tags.
    $tags = Cache::mergeTags(['config:dxpr_builder.settings'], $this->entity->getCacheTags());
    Cache::invalidateTags($tags);
    $form_state->setRedirectUrl($this->entity->toUrl('collection'));
  }

}
