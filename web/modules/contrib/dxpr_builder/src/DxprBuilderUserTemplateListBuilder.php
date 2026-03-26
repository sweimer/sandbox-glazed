<?php

namespace Drupal\dxpr_builder;

use Drupal\Core\Config\Entity\ConfigEntityListBuilder;
use Drupal\Core\Entity\EntityInterface;

/**
 * Provides a listing of DxprBuilderUserTemplateListBuilder.
 */
class DxprBuilderUserTemplateListBuilder extends ConfigEntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'dxpr_builder_user_template';
  }

  /**
   * {@inheritdoc}
   *
   * @return array
   *   ListBuilder header.
   *
   * @phpstan-return array<string, mixed>
   */
  public function buildHeader(): array {
    $header['label'] = $this->t('Label');
    $header['id'] = $this->t('Machine name');
    $header['thumbnail'] = $this->t('Thumbnail');
    $header['uid'] = $this->t('User ID');
    $header['global'] = $this->t('Global');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   *
   * @return array
   *   ListBuilder entity row.
   *
   * @phpstan-return array<string, mixed>
   */
  public function buildRow(EntityInterface $entity): array {
    /** @var \Drupal\dxpr_builder\Entity\DxprBuilderUserTemplate $entity */
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
    $row['uid'] = $entity->get('uid');
    $row['global'] = $entity->get('global') == 1 ? $this->t('True') : $this->t('False');

    return $row + parent::buildRow($entity);
  }

}
