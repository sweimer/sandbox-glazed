/* jslint white:true, multivar, this, browser:true */

/**
 * @file Handles the video selection UI component for DXPR Builder Drupal integration.
 */

(function ($, Drupal, drupalSettings, window) {
  "use strict";

  // Dependencies from other files (ensure they are loaded before this script)
  const createFileUploadElement =
    window.dxprBuilder && window.dxprBuilder.createFileUploadElement;
  const createFileUploadButton =
    window.dxprBuilder && window.dxprBuilder.createFileUploadButton;

  /**
   * This function is used to launch the code in this script, and is
   * called by external scripts.
   *
   * @param {HTMLElement} input The input into which URLs should be inserted. The URLs will then
   *   become videos in the DOM when the dialog is saved
   * @param {string} delimiter The delimiter used between URLs in the input
   */
  function backend_videos_select(input, delimiter) {
    if (!createFileUploadElement || !createFileUploadButton) {
      console.error(
        "DXPR Builder: Missing dependencies for backend_videos_select.",
      );
      return;
    }
    const inputElement = input;
    inputElement.style.display = "block";

    // Create wrapper using template
    const wrapperElement = renderTemplate(
      "partials/wrappers/video-select-wrapper",
    );
    inputElement.parentNode.insertBefore(wrapperElement, inputElement);
    wrapperElement.appendChild(inputElement);

    createFileUploadElement(inputElement, delimiter, "video");
    createFileUploadButton(inputElement, "video");
  }

  // Expose the public API function
  window.dxprBuilder = window.dxprBuilder || {};
  window.dxprBuilder.backend_videos_select = backend_videos_select;
})(jQuery, Drupal, drupalSettings, window);
