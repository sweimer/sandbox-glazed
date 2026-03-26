<?php

declare(strict_types=1);

namespace Drupal\dxpr_builder\Controller;

use Drupal\Component\Utility\Crypt;
use Drupal\Component\Utility\Environment;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\File\Exception\FileException;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Lock\LockAcquiringException;
use Drupal\Core\Lock\LockBackendInterface;
use Drupal\file\FileInterface;
use Drupal\file\Upload\FileUploadHandler;
use Drupal\file\Upload\FormUploadedFile;
use Drupal\media\MediaInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\MimeTypes;

/**
 * Controller for handling file uploads.
 */
final class UploadFileController extends ControllerBase {

  /**
   * Construct an UploadFileController object.
   *
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   * @param \Drupal\file\Upload\FileUploadHandler $fileUploadHandler
   *   The file upload handler.
   * @param \Drupal\Core\Lock\LockBackendInterface $lock
   *   The lock service.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager service.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $moduleHandler
   *   The module handler service.
   */
  public function __construct(
    protected FileSystemInterface $fileSystem,
    protected FileUploadHandler $fileUploadHandler,
    protected LockBackendInterface $lock,
    EntityTypeManagerInterface $entityTypeManager,
    ModuleHandlerInterface $moduleHandler,
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->moduleHandler = $moduleHandler;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('file_system'),
      $container->get('file.upload_handler'),
      $container->get('lock'),
      $container->get('entity_type.manager'),
      $container->get('module_handler'),
    );
  }

  /**
   * Callback to handle AJAX file uploads.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The http request object.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Returns JSON response.
   */
  public function fileUpload(Request $request): JsonResponse {
    // Getting the UploadedFile directly from the request.
    $uploads = $request->files->get('upload');
    if (empty($uploads)) {
      return new JsonResponse(['message' => 'No files were uploaded.'], Response::HTTP_BAD_REQUEST);
    }

    $default_scheme = $this->config('system.file')->get('default_scheme');

    /** @var \Symfony\Component\HttpFoundation\File\UploadedFile|null $upload */
    foreach ($uploads as $upload) {
      if ($upload === NULL || !$upload->isValid()) {
        return new JsonResponse(['message' => $upload?->getErrorMessage() ?: 'Invalid file upload'], Response::HTTP_INTERNAL_SERVER_ERROR);
      }

      $filename = $upload->getClientOriginalName();

      $type = explode('/', $upload->getClientMimeType());
      $type = $type[0] ?: 'file';

      $destination = match ($type) {
        'image' => $default_scheme . '://dxpr_builder_images',
        'video' => $default_scheme . '://dxpr_builder_videos',
        default => $default_scheme . '://dxpr_builder_files',
      };

      // Check the destination file path is writable.
      if (!$this->fileSystem->prepareDirectory($destination, FileSystemInterface::CREATE_DIRECTORY)) {
        return new JsonResponse(['message' => 'Destination file path is not writable'], Response::HTTP_INTERNAL_SERVER_ERROR);
      }

      $validators = $this->getUploadFileValidators($type);

      $file_uri = "{$destination}/{$filename}";
      // "FileSystemInterface::EXISTS_RENAME" is added for D9 compatibility.
      // @phpstan-ignore-next-line
      $file_uri = $this->fileSystem->getDestinationFilename($file_uri, class_exists(FileExists::class) ? FileExists::Rename : FileSystemInterface::EXISTS_RENAME);

      // Lock based on the prepared file URI.
      $lock_id = $this->generateLockIdFromFileUri($file_uri);

      if (!$this->lock->acquire($lock_id)) {
        return new JsonResponse(['message' => sprintf('File "%s" is already locked for writing.', $file_uri)], Response::HTTP_SERVICE_UNAVAILABLE);
      }

      try {
        $uploadedFile = new FormUploadedFile($upload);
        // "FileSystemInterface::EXISTS_RENAME" is added for D9 compatibility.
        // @phpstan-ignore-next-line
        $uploadResult = $this->fileUploadHandler->handleFileUpload($uploadedFile, $validators, $destination, class_exists(FileExists::class) ? FileExists::Rename : FileSystemInterface::EXISTS_RENAME, FALSE);
        // Method "FileUploadResult::hasViolations()" doesn't exist in D9.
        // @phpstan-ignore function.alreadyNarrowedType
        if (method_exists($uploadResult, 'hasViolations') && $uploadResult->hasViolations()) {
          $violations = (array) $uploadResult->getViolations();
          $messages = array_map(function ($violation) {
            if (is_object($violation) && method_exists($violation, 'getMessage')) {
              return $violation->getMessage();
            }
            return is_string($violation) ? $violation : (string) $violation;
          }, $violations);
          return new JsonResponse(['message' => implode('. ', $messages)], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
      }
      catch (FileException $e) {
        return new JsonResponse(['message' => 'File could not be saved'], Response::HTTP_INTERNAL_SERVER_ERROR);
      }
      catch (LockAcquiringException $e) {
        return new JsonResponse(['message' => sprintf('File "%s" is already locked for writing.', $upload->getClientOriginalName())], Response::HTTP_SERVICE_UNAVAILABLE);
      }

      $this->lock->release($lock_id);

      $file = $uploadResult->getFile();

      // Check if we should create a Media entity instead of returning the File.
      $entity = $this->shouldCreateMedia($type)
        ? $this->createMediaFromFile($file, $type, $filename)
        : $file;

      $files[] = [
        'url' => $file->createFileUrl(relative: FALSE),
        'uuid' => $entity->uuid(),
        'id' => $entity->id(),
        'fid' => $file->id(),
        'entity_type' => $entity->getEntityTypeId(),
      ];
    }

    return new JsonResponse($files ?? [], Response::HTTP_CREATED);
  }

  /**
   * Generates a lock ID based on the file URI.
   *
   * @param string $file_uri
   *   The file URI.
   *
   * @return string
   *   The generated lock ID.
   */
  protected static function generateLockIdFromFileUri(string $file_uri): string {
    return 'file:dxpr_builder:' . Crypt::hashBase64($file_uri);
  }

  /**
   * Retrieves file upload validators based on the specified type.
   *
   * @param string $type
   *   The type of file being uploaded.
   *
   * @return array
   *   An associative array of upload validators.
   *
   * @phpstan-return array<string, array<int|string, mixed>>
   */
  protected function getUploadFileValidators(string $type): array {
    $default_mimetypes = MimeTypes::getDefault();

    // @todo This should be global variable and shared with js app as well.
    $mimetypes = match ($type) {
      'image' => ['gif', 'jpg', 'jpeg', 'png', 'svg', 'webp', 'avif'],
      'video' => ['webm', 'ogv', 'ogg', 'mp4', 'quicktime'],
      default => [],
    };

    $allowed_extensions = [];
    foreach ($mimetypes as $mime_type) {
      $allowed_extensions = [
        ...$allowed_extensions,
        ...$default_mimetypes->getExtensions("$type/" . $mime_type),
      ];
    }

    $validators = [
      'FileExtension' => [
        'extensions' => implode(' ', $allowed_extensions),
      ],
      'FileSizeLimit' => [
        'fileLimit' => Environment::getUploadMaxSize(),
      ],
    ];

    // For D9, we need to provide additional validator with extensions.
    if (version_compare(\Drupal::VERSION, '10.0', '<')) {
      $validators['file_validate_extensions'][] = implode(' ', $allowed_extensions);
    }

    return $validators;
  }

  /**
   * Determines whether to create a Media entity for the uploaded file.
   *
   * @param string $type
   *   The type of file being uploaded ('image', 'video', etc.).
   *
   * @return bool
   *   TRUE if a Media entity should be created, FALSE otherwise.
   */
  protected function shouldCreateMedia(string $type): bool {
    // Check if the Media module is enabled.
    if (!$this->moduleHandler->moduleExists('media')) {
      return FALSE;
    }

    // Check if an appropriate media type exists for the file type.
    return $this->getMediaTypeForFile($type) !== NULL;
  }

  /**
   * Gets the appropriate media type for a file type.
   *
   * @param string $type
   *   The type of file being uploaded ('image', 'video', etc.).
   *
   * @return string|null
   *   The media type ID if found, NULL otherwise.
   */
  protected function getMediaTypeForFile(string $type): ?string {
    $mediaTypeStorage = $this->entityTypeManager->getStorage('media_type');

    // Map file types to common media type machine names.
    $commonTypes = [
      'image' => ['image', 'media_image'],
      'video' => ['video', 'media_video'],
    ];

    if (!isset($commonTypes[$type])) {
      return NULL;
    }

    // Look for the first existing media type.
    foreach ($commonTypes[$type] as $mediaTypeId) {
      if ($mediaTypeStorage->load($mediaTypeId)) {
        return $mediaTypeId;
      }
    }

    return NULL;
  }

  /**
   * Creates a Media entity from a File entity.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file entity to create media from.
   * @param string $type
   *   The type of file ('image', 'video', etc.).
   * @param string $filename
   *   The original filename.
   *
   * @return \Drupal\media\MediaInterface
   *   The created media entity.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  protected function createMediaFromFile(FileInterface $file, string $type, string $filename): MediaInterface {
    $mediaTypeId = $this->getMediaTypeForFile($type);

    if (!$mediaTypeId) {
      // This should not happen as shouldCreateMedia() checks this.
      throw new \RuntimeException('No suitable media type found for file type: ' . $type);
    }

    /** @var \Drupal\media\Entity\MediaType $mediaType */
    $mediaType = $this->entityTypeManager->getStorage('media_type')->load($mediaTypeId);
    $sourceField = $mediaType->getSource()->getConfiguration()['source_field'];

    // Create the media entity with compatible field structure.
    $mediaData = [
      'bundle' => $mediaTypeId,
      'name' => pathinfo($filename, PATHINFO_FILENAME),
    ];

    // Handle both image and file media types by setting field values.
    if ($type === 'image') {
      $mediaData[$sourceField] = [
        'target_id' => $file->id(),
        'alt' => '',
        'title' => '',
      ];
    }
    else {
      $mediaData[$sourceField] = [
        'target_id' => $file->id(),
      ];
    }

    /** @var \Drupal\media\MediaInterface $media */
    $media = $this->entityTypeManager->getStorage('media')->create($mediaData);

    // Set the owner to the current user if the media entity has an owner field.
    if ($media->hasField('uid')) {
      $media->set('uid', $this->currentUser()->id());
    }

    // Set the status to published if the media entity has a status field.
    if ($media->hasField('status')) {
      $media->set('status', TRUE);
    }

    $media->save();

    // Trigger metadata update if the method exists (Drupal 9.1+).
    if (method_exists($media, 'updateMetadata')) {
      $media->updateMetadata();
      $media->save();
    }

    return $media;
  }

}
