<?php

namespace Drupal\dxpr_builder\Form;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a confirmation form before remove a stale user entry.
 */
class DeleteStaleUserConfirmForm extends ConfirmFormBase {

  /**
   * DeleteStaleUserConfirmForm constructor.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager service.
   * @param \Drupal\dxpr_builder\Service\DxprBuilderLicenseServiceInterface $licenseService
   *   The license service.
   */
  final public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly DxprBuilderLicenseServiceInterface $licenseService,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('dxpr_builder.license_service'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'dxpr_builder_delete_stale_user_confirm';
  }

  /**
   * {@inheritdoc}
   */
  public function getQuestion() {
    return $this->t('Are you sure you want to delete this user?');
  }

  /**
   * {@inheritdoc}
   */
  public function getDescription() {
    return $this->t('The user will be removed from all the domains.');
  }

  /**
   * {@inheritdoc}
   */
  public function getCancelUrl() {
    return new Url('dxpr_builder.user_licenses');
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $form_state->setRedirectUrl(new Url('dxpr_builder.user_licenses'));

    $email = $this->getRequest()->query->get('email');
    $userLicenses = $this->licenseService->getLicenseUsers();

    if (!array_key_exists($email, $userLicenses)) {
      $this->messenger()->addError($this->t('The license entry does not exist.'));
      return;
    }

    $uid = $this->entityTypeManager->getStorage('user')
      ->getQuery()
      ->condition('mail', $email)
      ->accessCheck(FALSE)
      ->execute();

    if (!empty($uid)) {
      $this->messenger()->addError($this->t('The user with the provided email exists in the system.'));
      return;
    }

    $this->licenseService->removeMailFromCentralStorage($email);
    $this->licenseService->processSyncQueue();
    $this->messenger()->addStatus($this->t('The user has been removed.'));
  }

}
