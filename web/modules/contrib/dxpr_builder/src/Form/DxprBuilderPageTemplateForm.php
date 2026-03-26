<?php

namespace Drupal\dxpr_builder\Form;

use Drupal\Core\Entity\EntityForm;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\dxpr_builder\Service\DxprBuilderServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * DXPR Builder Page Template form.
 *
 * @property \Drupal\Core\Config\Entity\ConfigEntityInterface $entity
 */
class DxprBuilderPageTemplateForm extends EntityForm {

  use TemplateImageFormTrait;

  /**
   * DxprBuilderPageTemplateForm constructor.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager service.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderServiceInterface $dxpr_builder_service
   *   The DXPR Builder service.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  final public function __construct(EntityTypeManagerInterface $entity_type_manager, DxprBuilderServiceInterface $dxpr_builder_service) {
    $this->fileStorage = $entity_type_manager->getStorage('file');
    $this->dxprBuilderService = $dxpr_builder_service;
  }

  /**
   * {@inheritdoc}
   *
   * @phpstan-return mixed
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
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
    /** @var \Drupal\dxpr_builder\Entity\DxprBuilderPageTemplate $entity */
    $entity = $this->entity;
    $form['label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Label'),
      '#maxlength' => 255,
      '#default_value' => $entity->label(),
      '#description' => $this->t('Label for the dxpr builder page template.'),
      '#required' => TRUE,
    ];

    $form['id'] = [
      '#type' => 'machine_name',
      '#default_value' => $entity->id(),
      '#machine_name' => [
        'exists' => '\Drupal\dxpr_builder\Entity\DxprBuilderPageTemplate::load',
      ],
      '#disabled' => !$entity->isNew(),
    ];

    $form['status'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#default_value' => $entity->status(),
    ];

    $form['category'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Category'),
      '#maxlength' => 255,
      '#default_value' => $entity->get('category'),
      '#description' => $this->t('Category for the dxpr builder page template.'),
      '#required' => TRUE,
    ];

    $this->buildImageFormElements($form, $form_state);

    $form['template'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Template'),
      '#default_value' => $entity->get('template'),
      '#description' => $this->t('The dxpr builder page template body. The easiest way to generate template code is saving any DXPR Builder element as user template and copying the user template code here.'),
      '#required' => TRUE,
    ];

    $form['weight'] = [
      '#type' => 'number',
      '#title' => $this->t('Weight'),
      '#default_value' => $entity->get('weight'),
      '#step' => 1,
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
      ? $this->t('Created new dxpr builder page template %label.', $message_args)
      : $this->t('Updated dxpr builder page template %label.', $message_args);
    $this->messenger()->addStatus($message);
    $this->invalidateCacheAndRedirect($form_state);
    return $result;
  }

}
