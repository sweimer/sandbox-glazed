<?php

namespace Drupal\dxpr_builder;

use Drupal\Core\Config\Entity\ConfigEntityListBuilder;
use Drupal\Core\Entity\EntityInterface;

/**
 * Provides a listing of DxprBuilderPageTemplateListBuilder.
 */
class DxprBuilderPageTemplateListBuilder extends ConfigEntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'dxpr_builder_page_template';
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-return array<string, mixed>
   */
  public function buildHeader(): array {
    $header['label'] = $this->t('Label');
    $header['id'] = $this->t('Machine name');
    $header['thumbnail'] = $this->t('Thumbnail');
    $header['category'] = $this->t('Category');
    $header['weight'] = $this->t('Weight');
    $header['status'] = $this->t('Status');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-return array<string, mixed>
   */
  public function buildRow(EntityInterface $entity): array {
    /** @var \Drupal\dxpr_builder\Entity\DxprBuilderPageTemplate $entity */
    $row['label'] = $entity->label();
    $row['id'] = $entity->id();
    $image_data = $entity->getImageData();
    if ($image_data) {
      $row['thumbnail']['data'] = [
        '#theme' => 'image',
        '#uri' => $image_data,
        '#width' => 100,
        '#height' => 100,
        '#attributes' => ['style' => 'max-width: 100px; max-height: 100px; object-fit: contain;'],
      ];
    }
    else {
      $row['thumbnail'] = $this->t('No image');
    }
    $row['category'] = $entity->get('category');
    $row['weight'] = $entity->get('weight');
    $row['status'] = $entity->status() ? $this->t('Enabled') : $this->t('Disabled');

    return $row + parent::buildRow($entity);
  }

}
