/* jslint white:true, multivar, this, browser:true */

/**
 * @file Handles Entity Browser integration for DXPR Builder.
 */

(function ($, Drupal, drupalSettings, window) {
  "use strict";

  /**
   * Create the file upload button users will click to upload an image
   *
   * @var {HTMLElement} input The input used as a reference for inserting the button into the DOM
   */
  function createEntityBrowserButton(input) {
    // Insert the button into the DOM, and set the button to programmatically click
    // the file upload element when the button is created, thereby initiating the
    // browser's file selection dialog.

    const ACSelectImage = input.closest(".ac-select-image");
    const ACSelectImageButton = document.createElement("button");

    ACSelectImageButton.classList.add(
      ...["ac-select-image", "btn", "btn-default"],
    );
    ACSelectImageButton.innerText = Drupal.t("Select image");
    ACSelectImage.insertAdjacentElement("afterbegin", ACSelectImageButton);

    ACSelectImageButton.addEventListener("click", (e) => {
      e.preventDefault();

      // Trigger Entity Browser Selection
      const { mediaBrowser } = drupalSettings.dxprBuilder;

      let eb = "dxprBuilderSingle";
      if (input.classList.contains("dxpr-builder-multi-image-input")) {
        eb = "dxprBuilderMulti";
      }

      input.setAttribute("data-uuid", eb);

      // Get the path to the media browser page. It could be either "Entity
      // Browser" or "Media Library" page.
      let url = drupalSettings.entity_browser.libraryPath;

      // Url to "Medial Library" page.
      if (mediaBrowser === "media_library") {
        const cardinality = input.classList.contains(
          "dxpr-builder-multi-image-input",
        )
          ? -1
          : 1;
        url = `${url}?remaining_slots=${cardinality}&uuid=${eb}`;
      } else {
        // Url to "Entity Browser" page.
        url = `${url}?uuid=${eb}`;
      }

      // Farther lines are related to "Media Browser" only.
      // Remove old modal
      let mediaBrowserHTML = document.getElementById("az-media-modal");
      if (mediaBrowserHTML) mediaBrowserHTML.remove();

      // Create new modal
      mediaBrowserHTML = `
      <div id="az-media-modal" class="modal dxpr-builder-ui" style="display:none">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <span class="close" ${getModalDismissValue()} aria-hidden="true">&times;</span>
                <h4 class="modal-title">${Drupal.t("Media browser")}</h4>
              </div>
              <div class="modal-body">
              <iframe 
                data-uuid="${eb}"
                src="${url}"
                frameborder="0">
              </iframe>
              </div>
            </div>
        </div>
      </div>
      `;

      // Display the modal
      $(mediaBrowserHTML).modal("show");
    });
  }

  // Expose the function if needed, or ensure it's called correctly from image-select.js
  window.dxprBuilder = window.dxprBuilder || {};
  window.dxprBuilder.createEntityBrowserButton = createEntityBrowserButton;
})(jQuery, Drupal, drupalSettings, window);
