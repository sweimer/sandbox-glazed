<?php

namespace Drupal\dxpr_builder\Service;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Access\AccessResultInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\media_library\MediaLibraryOpenerInterface;
use Drupal\media_library\MediaLibraryState;

/**
 * The media library opener for DXPR Builder.
 */
class MediaLibraryDxprBuilderOpener implements MediaLibraryOpenerInterface {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The module extensions list.
   *
   * @var \Drupal\Core\Extension\ModuleExtensionList
   */
  protected ModuleExtensionList $moduleExtensionList;

  /**
   * The renderer.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected RendererInterface $renderer;

  /**
   * MediaLibraryDxprBuilderOpener constructor.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Extension\ModuleExtensionList $module_extension_list
   *   The module extension list.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, ModuleExtensionList $module_extension_list, RendererInterface $renderer) {
    $this->entityTypeManager = $entity_type_manager;
    $this->moduleExtensionList = $module_extension_list;
    $this->renderer = $renderer;
  }

  /**
   * {@inheritdoc}
   */
  public function checkAccess(MediaLibraryState $state, AccountInterface $account): AccessResultInterface {
    return AccessResult::allowedIfHasPermission($account, 'view media');
  }

  /**
   * {@inheritdoc}
   */
  public function getSelectionResponse(MediaLibraryState $state, array $selected_ids): AjaxResponse {
    $response = new AjaxResponse();

    // If nothing was selected, we should just return the response without
    // actions.
    if (empty($selected_ids)) {
      return $response;
    }

    $opener_parameters = $state->getOpenerParameters();

    // Set "drupalSettings" data. We should put "uuid" as it requires for
    // detecting the field where media entities should be added and
    // "entities" - this parameter related to the default data returned by
    // "Media Browser" module.
    $drupal_settings['entity_browser']['mediaLibrary']['uuid'] = $opener_parameters['uuid'] ?? NULL;
    $drupal_settings['entity_browser']['mediaLibrary']['entities'] = [];

    /** @var \Drupal\media\MediaInterface[] $selected_media */
    $selected_media = $this->entityTypeManager->getStorage('media')->loadMultiple($selected_ids);
    foreach ($selected_media as $media) {
      $drupal_settings['entity_browser']['mediaLibrary']['entities'][] = [
        $media->id(),
        $media->get('uuid')->getString(),
        $media->getEntityTypeId(),
      ];
    }

    // This approach is not effective as it injects the script everytime
    // when a user opens the "Media Library" modal window.
    // Rather than injecting the whole script, we should return the
    // `new InvokeCommand()` with js behaviour execution, like
    // Drupal.behaviours.myBehaviour.attach(document, drupalSettings).
    // To achieve this, the `dxpr_builder/entity_browser_selection` assets
    // library should be refactored.
    // @todo Replace injecting <script> tag with invoking js execution.
    // @todo Refactor `dxpr_builder/entity_browser_selection` library.
    $script_path = base_path() . $this->moduleExtensionList->getPath('dxpr_builder')
      . '/js/entity_browser.media_selection.js';

    // Inject js script for the closing iframe modal window.
    $close_iframe = <<<JS
      (function () {
        window.parent.document.querySelector('#az-media-modal .close')?.click();
      })();
    JS;

    // Inject js script for adding media entities data to the "drupalSettings"
    // object.
    $encoded_drupal_settings = json_encode($drupal_settings['entity_browser']['mediaLibrary']);
    $insert_drupal_settings = <<<JS
      (function () {
        window.parent.drupalSettings.entity_browser.mediaLibrary = $encoded_drupal_settings;
      })();
    JS;

    // Inject js script required for adding selected images to the image
    // field.
    $execute_images_insert = <<<JS
      (function () {
        let js = window.parent.document.createElement('script');
        js.setAttribute( 'src', '$script_path' );
        js.setAttribute( 'type', 'text/javascript' );
        window.parent.document.body.appendChild(js);
      })();
    JS;

    return $response
      // All these <script> tags will be injected in the iframe, not in the main
      // document.
      // But "body" of the scripts will be executed for the main document.
      ->addCommand(new HtmlCommand('body', '<script>' . $close_iframe . '</script>'))
      ->addCommand(new HtmlCommand('body', '<script>' . $insert_drupal_settings . '</script>'))
      ->addCommand(new HtmlCommand('body', '<script>' . $execute_images_insert . '</script>'));
  }

}
