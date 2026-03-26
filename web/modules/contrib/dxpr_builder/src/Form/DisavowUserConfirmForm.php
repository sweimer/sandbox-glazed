<?php

namespace Drupal\dxpr_builder\Form;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a confirmation form before disavowing a user.
 */
class DisavowUserConfirmForm extends ConfirmFormBase {

  /**
   * DisavowUserConfirmForm constructor.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager service.
   */
  final public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'dxpr_builder_disavow_user_confirm';
  }

  /**
   * {@inheritdoc}
   */
  public function getQuestion() {
    return $this->t('Are you sure you want to exclude the user from DXPR editing?');
  }

  /**
   * {@inheritdoc}
   */
  public function getDescription() {
    return $this->t('The user will lose DXPR Builder editor access. Uncheck the "Exclude from DXPR builder editing" checkbox on the user\'s profile to restore editing permission.');
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
    $uid = $this->getRequest()->query->get('uid');
    $user = $this->entityTypeManager->getStorage('user')->load($uid);
    if ($user instanceof UserInterface) {
      $user->set('dxpr_user_is_disavowed', 1);
      $user->save();
    }

    $form_state->setRedirectUrl(new Url('dxpr_builder.user_licenses'));
  }

}
