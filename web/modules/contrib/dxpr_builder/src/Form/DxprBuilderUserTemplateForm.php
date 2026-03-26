<?php

namespace Drupal\dxpr_builder\Form;

use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityForm;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\dxpr_builder\Service\DxprBuilderServiceInterface;

/**
 * DXPR Builder User Template form.
 *
 * @property \Drupal\Core\Config\Entity\ConfigEntityInterface $entity
 */
class DxprBuilderUserTemplateForm extends EntityForm {

  use TemplateImageFormTrait;

  /**
   * Constructs a DxprBuilderUserTemplateForm object.
   *
   * @param \Drupal\Core\Entity\EntityStorageInterface $file_storage
   *   The file storage.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderServiceInterface $dxpr_builder_service
   *   The DXPR Builder service.
   */
  public function __construct(EntityStorageInterface $file_storage, DxprBuilderServiceInterface $dxpr_builder_service) {
    $this->fileStorage = $file_storage;
    $this->dxprBuilderService = $dxpr_builder_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new self(
      $container->get('entity_type.manager')->getStorage('file'),
      $container->get('dxpr_builder.service')
    );
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   * @phpstan-return array<string, mixed>
   */
  public function form(array $form, FormStateInterface $form_state): array {

    $form = parent::form($form, $form_state);

    $form['label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Label'),
      '#maxlength' => 255,
      '#default_value' => $this->entity->label(),
      '#description' => $this->t('Label for the dxpr builder user template.'),
      '#required' => TRUE,
    ];

    $form['id'] = [
      '#type' => 'machine_name',
      '#default_value' => $this->entity->id(),
      '#machine_name' => [
        'exists' => '\Drupal\dxpr_builder\Entity\DxprBuilderUserTemplate::load',
      ],
      '#disabled' => !$this->entity->isNew(),
    ];

    $form['uid'] = [
      '#type' => 'textfield',
      '#title' => $this->t('UID'),
      '#maxlength' => 255,
      '#default_value' => $this->entity->get('uid'),
      '#description' => $this->t('User id for the dxpr builder user template.'),
      '#required' => TRUE,
    ];

    $this->buildImageFormElements($form, $form_state);

    $form['template'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Template'),
      '#default_value' => $this->entity->get('template'),
      '#description' => $this->t('The dxpr builder user template body.'),
      '#required' => TRUE,
    ];

    $form['global'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Global'),
      '#default_value' => $this->entity->get('global'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-param array<string, mixed> $form
   */
  public function save(array $form, FormStateInterface $form_state): int {
    $this->processTemplateImage($form_state);
    $result = parent::save($form, $form_state);
    $message_args = ['%label' => $this->entity->label()];
    $message = $result == SAVED_NEW
      ? $this->t('Created new dxpr builder user template %label.', $message_args)
      : $this->t('Updated dxpr builder user template %label.', $message_args);
    $this->messenger()->addStatus($message);
    $this->invalidateCacheAndRedirect($form_state);
    return $result;
  }

}
