/* eslint no-plusplus: 0 */

/**
 * @file entity_browser.modal_selection.js
 *
 * Propagates selected entities from modal display.
 */

(function (Drupal, drupalSettings, window) {
  "use strict";

  // @todo return false here if parent document does not contain active DXPR Builder editor
  let instance = false;
  let entities = {};

  /* eslint no-unused-expressions: 0 */
  Object.prototype.hasOwnProperty.call(
    drupalSettings.entity_browser,
    "modal",
  ) && ({ uuid: instance, entities } = drupalSettings.entity_browser.modal);

  /* eslint no-unused-expressions: 0 */
  Object.prototype.hasOwnProperty.call(
    drupalSettings.entity_browser,
    "iframe",
  ) && ({ uuid: instance, entities } = drupalSettings.entity_browser.iframe);

  Object.prototype.hasOwnProperty.call(
    drupalSettings.entity_browser,
    "mediaLibrary",
  ) &&
    ({ uuid: instance, entities } = drupalSettings.entity_browser.mediaLibrary);

  // Below selector only matches if target element is a dxpr builder image
  // input, this ensures we don't muck up an EB selection for some FAPI widget
  const { parent } = window;
  const input = parent.document.querySelector(
    `input.dxpr-builder-image-input[data-uuid*=${instance}]`,
  );

  if (input) {
    const stylesInput = input.parentElement.querySelector(
      ".dxpr-builder-image-styles",
    );
    let entityType;
    const entityIDs = [];
    for (let i = entities.length - 1; i >= 0; --i) {
      entityIDs.push(entities[i][0]);
    }
    if (entities.length && entities[0][2]) {
      [[, , entityType]] = entities;
    } else {
      entityType = "file";
    }

    parent.jQuery
      .ajax({
        type: "get",
        url: parent.drupalSettings.dxprBuilder.dxprCsrfUrl,
        dataType: "json",
        cache: false,
        context: this,
      })
      .done((data) => {
        parent.jQuery
          .ajax({
            type: "POST",
            url: data,
            data: {
              action: "dxpr_builder_get_image_urls",
              entityIDs,
              entityType,
              imageStyle: stylesInput.value,
            },
            cache: false,
          })
          .done((res) => {
            // We need to access parent window, find correct image field and close media modal
            if (input.classList.contains("dxpr-builder-multi-image-input")) {
              if (input.value) {
                input.value = `${input.value},${res}`;
              } else {
                input.value = res;
              }
            } else {
              input.value = res;
            }

            // Handle image metadata population when the image is inserted
            const inputElement = input instanceof jQuery ? input[0] : input;
            // Call handleImagePreviewChange to populate metadata
            if (parent.dxprBuilder && parent.dxprBuilder.insertImageMetadata) {
              parent.dxprBuilder.insertImageMetadata(inputElement);
            }
          })
          .fail((err) => {
            window.alert(
              Drupal.t(
                "Image selection failed, please make sure to select only image files",
              ),
            );
          })
          .always(() => {
            input.dispatchEvent(new Event("change"));
            input.removeAttribute("data-uuid");
            parent.jQuery(parent.document).find("#az-media-modal").remove();
            parent.jQuery(parent.document).find(".modal-backdrop").remove();
          });
      });
  }
})(Drupal, drupalSettings, window);
