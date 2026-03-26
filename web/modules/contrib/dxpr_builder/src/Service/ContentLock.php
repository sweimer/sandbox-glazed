<?php

namespace Drupal\dxpr_builder\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;

/**
 * Class to load and save content locks.
 */
class ContentLock {

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The entity type manager service.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The logger channel.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected $logger;

  /**
   * Constructs a new ContentLock object.
   *
   * @param \Drupal\Core\Database\Connection $connection
   *   The database connection.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity manager service.
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   The current user.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger channel factory.
   */
  public function __construct(Connection $connection, EntityTypeManagerInterface $entityTypeManager, AccountProxyInterface $currentUser, LoggerChannelFactoryInterface $logger_factory) {
    $this->database = $connection;
    $this->entityTypeManager = $entityTypeManager;
    $this->currentUser = $currentUser;
    $this->logger = $logger_factory->get('dxpr_builder');
  }

  /**
   * Toggle content lock.
   *
   * @param string $entity_id
   *   The entity id.
   * @param string $revision_id
   *   The revision id.
   * @param string $entity_type
   *   The entity type.
   * @param string $langcode
   *   The language code of the language.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The JSON response.
   */
  public function contentLockStatus($entity_id, $revision_id, $entity_type, $langcode) {
    $locked_content_data = [];
    $locked_content_data['status'] = FALSE;
    $entity_lock_author_id = $this->getLockedContent($entity_id, $revision_id, $entity_type, $langcode);
    if ($entity_lock_author_id) {
      $locked_content_data['status'] = TRUE;
      $locked_content_data['entity_lock_author_id'] = $entity_lock_author_id;
      $user = $this->entityTypeManager->getStorage('user')->load($entity_lock_author_id);
      $locked_content_data['entity_lock_author_name'] = $user->getDisplayName();
    }
    $entity = $this->entityTypeManager->getStorage($entity_type)->load($entity_id);
    $locked_content_data['label'] = $entity->label();
    return new JsonResponse($locked_content_data);
  }

  /**
   * Toggle content lock.
   *
   * @param string $entity_id
   *   The entity id.
   * @param string $revision_id
   *   The revision id.
   * @param string $entity_type
   *   The entity type.
   * @param string $langcode
   *   The language code of the language.
   * @param string $toggle_action
   *   The action lock or unlock.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The JSON response.
   */
  public function toggleContentLock($entity_id, $revision_id, $entity_type, $langcode, $toggle_action) {
    $entity = $this->entityTypeManager->getStorage($entity_type)->load($entity_id);
    $content_lock = [];
    if ($entity && $entity->access('update', $this->currentUser)) {
      $content_lock['label'] = $entity->label();
      // Create record in database.
      if ($toggle_action == 'lock') {
        // Save the new lock record (merge handles insert/update).
        $this->saveLockedContent($entity_id, $revision_id, $entity_type, $langcode);
        $content_lock['status'] = TRUE;
      }
      else {
        // Delete the lock record.
        $this->deleteLockedContent($entity_id, $revision_id, $entity_type, $langcode);
        $content_lock['status'] = FALSE;
      }
    }

    return new JsonResponse($content_lock);
  }

  /**
   * Save the given locked content nid for the current user.
   *
   * Uses merge (UPSERT) to handle concurrent requests atomically,
   * preventing race conditions when multiple requests attempt to
   * lock the same entity simultaneously.
   *
   * @param string $entity_id
   *   The entity id.
   * @param string $revision_id
   *   The revision id.
   * @param string $entity_type
   *   The entity type.
   * @param string $langcode
   *   The language code of the language.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The json response
   */
  public function saveLockedContent($entity_id, $revision_id, $entity_type, $langcode) {
    // Use merge (UPSERT) to atomically handle insert or update.
    // This prevents race conditions from concurrent lock requests.
    try {
      $this->database->merge('dxpr_lock')
        ->keys([
          'entity_id' => $entity_id,
          'revision_id' => $revision_id,
          'entity_type' => $entity_type,
          'uid' => $this->currentUser->id(),
        ])
        ->fields([
          'langcode' => $langcode,
        ])
        ->execute();
    }
    catch (\Exception $e) {
      // Log critical errors only.
      $this->logger->critical('Failed to save lock record: @message', [
        '@message' => $e->getMessage(),
        'exception' => $e,
      ]);
    }

    return new JsonResponse('');
  }

  /**
   * Delete the given locked content.
   *
   * @param string $entity_id
   *   The entity id.
   * @param string $revision_id
   *   The revision id.
   * @param string $entity_type
   *   The entity type.
   * @param string $langcode
   *   The language code of the language.
   */
  public function deleteLockedContent($entity_id, $revision_id, $entity_type, $langcode): void {
    $this->database->delete('dxpr_lock')
      ->condition('entity_id', $entity_id)
      ->condition('revision_id', $revision_id)
      ->condition('entity_type', $entity_type)
      ->condition('langcode', $langcode)
      ->execute();
  }

  /**
   * Get the given locked content authors.
   *
   * @param string $entity_id
   *   The entity id.
   * @param string $revision_id
   *   The revision id.
   * @param string $entity_type
   *   The entity type.
   * @param string $langcode
   *   The language code of the language.
   *
   * @return string
   *   The user id of the locked content.
   *
   * @throws \Exception
   */
  public function getLockedContent($entity_id, $revision_id, $entity_type, $langcode): string {
    return (string) $this->database->select('dxpr_lock', 'g')
      ->fields('g', ['uid'])
      ->condition('g.entity_id', $entity_id)
      ->condition('g.revision_id', $revision_id)
      ->condition('g.entity_type', $entity_type)
      ->condition('g.langcode', $langcode)
      ->execute()
      ->fetchField();
  }

}
