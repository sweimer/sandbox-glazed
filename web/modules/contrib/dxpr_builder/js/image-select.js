/* jslint white:true, multivar, this, browser:true */

/**
 * @file Handles the image selection UI component for DXPR Builder Drupal integration.
 */

(function ($, Drupal, drupalSettings, window) {
  "use strict";

  // Dependencies from other files (ensure they are loaded before this script)
  const getUrlsFromInput =
    window.dxprBuilder && window.dxprBuilder.getUrlsFromInput;
  const dxpr_builder_get_images =
    window.dxprBuilder && window.dxprBuilder.dxpr_builder_get_images;
  const hideImageStyleControls =
    window.dxprBuilder && window.dxprBuilder.hideImageStyleControls;
  const createThumbailFromDefault =
    window.dxprBuilder && window.dxprBuilder.createThumbailFromDefault;
  const createEntityBrowserButton =
    window.dxprBuilder && window.dxprBuilder.createEntityBrowserButton;
  const createFileUploadElement =
    window.dxprBuilder && window.dxprBuilder.createFileUploadElement;
  const createFileUploadButton =
    window.dxprBuilder && window.dxprBuilder.createFileUploadButton;

  /**
   * Change handler for the image style select element
   *
   * @param {jQuery} selectElement The select element for image styles
   * @param {string} delimiter The delimiter used between URLs in the input
   */
  function imageStyleChangeHandler(selectElement, delimiter) {
    if (!getUrlsFromInput || !dxpr_builder_get_images) {
      console.error(
        "DXPR Builder: Missing dependencies for image style change.",
      );
      return;
    }
    // Find the selected option and act on it
    const imageStyle = selectElement.value;

    // Get the image input containing the URL of the image
    const imageInput = Array.from(selectElement.parentElement.children).find(
      (child) => child !== selectElement && child.matches(".form-control"),
    );
    // If a delimiter has been provided, it means multiple images are allowed,
    // so each image needs the image style applied
    if (delimiter) {
      // Create an array of the currently entered images
      const currentImages = getUrlsFromInput(imageInput.value, delimiter);

      // Create an array to hold the images with the new image style URLs
      const newImages = [];
      // Loop through each of the current images, creating an array with the new image URLs
      currentImages.forEach((fileUrl) => {
        dxpr_builder_get_images(
          false,
          imageStyle,
          fileUrl,
          imageInput,
          delimiter,
          newImages,
        );
      });
    } else {
      const fileUrl = imageInput.value;
      dxpr_builder_get_images(false, imageStyle, fileUrl, imageInput);
    }
  }

  /**
   * Create the select element users will use to select an image style
   *
   * @param {HTMLElement} input The input used as a reference for inserting the select element into the DOM
   * @param {string} delimiter The delimiter used between URLs in the input
   */
  function createImageStyleInput(input, delimiter) {
    if (!hideImageStyleControls) {
      console.error(
        "DXPR Builder: Missing dependencies for image style input creation.",
      );
      return;
    }

    const inputValue = input.value;
    let selectedStyle = null;
    if (inputValue) {
      let matches = inputValue.match(/styles\/([^/]+)\/(public|private)/);
      if (matches && matches[1]) {
        [, selectedStyle] = matches;
      }
      if (!selectedStyle) {
        matches = inputValue.match(/imageStyle=([^&,]*)/);
        if (matches && matches[1]) {
          [, selectedStyle] = matches;
        }
      }
    }

    // Create the select element using the template
    const imageStyleSelectElement = renderTemplate(
      "partials/forms/image-style-select",
      {
        image_styles: drupalSettings.dxprBuilder.imageStyles,
        selected_key: selectedStyle, // Pass the determined selected style to the template
      },
    );

    // Append the newly created elements to the page
    input.parentNode.insertBefore(imageStyleSelectElement, input);

    // Add change event handler for native select when Chosen is not available
    imageStyleSelectElement.addEventListener("change", () => {
      imageStyleChangeHandler(imageStyleSelectElement, delimiter);
    });

    hideImageStyleControls(input);
  }

  /**
   * This function is used to launch the code in this script, and is
   * called by external scripts.
   *
   * @param {HTMLElement} input The input into which URLs should be inserted. The URLs will then
   *   become images in the DOM when the dialog is saved
   * @param {string} delimiter The delimiter used between URLs in the input
   */
  function backend_images_select(input, delimiter) {
    if (
      !createThumbailFromDefault ||
      !createEntityBrowserButton ||
      !createFileUploadElement ||
      !createFileUploadButton
    ) {
      console.error(
        "DXPR Builder: Missing dependencies for backend_images_select.",
      );
      return;
    }

    input = input.length ? input[0] : input;

    input.style.display = "block";

    // Detach the input, wrap it, then re-attach the wrapped structure
    const originalParent = input.parentNode;
    const detachedInputElement = input.cloneNode(true);
    originalParent.removeChild(input);

    const wrappedContent = renderTemplate(
      "partials/wrappers/ac-select-image-wrappers",
      {
        content: detachedInputElement.outerHTML,
      },
    );
    originalParent.insertBefore(wrappedContent, originalParent.firstChild);

    input = wrappedContent.querySelector(
      (input.tagName ? input.tagName.toLowerCase() : "input") +
        (input.id ? `#${input.id}` : "") +
        (input.className
          ? `.${input.className.trim().replace(/\s+/g, ".")}`
          : ""),
    );

    if (
      drupalSettings.dxprBuilder.mediaBrowser &&
      drupalSettings.dxprBuilder.mediaBrowser.length > 0
    ) {
      createEntityBrowserButton(input);
    } else {
      createFileUploadElement(input, delimiter, "image");
      createFileUploadButton(input, "image");
    }
    createImageStyleInput(input, delimiter);
    createThumbailFromDefault(input, delimiter);

    input.addEventListener("change", (event) => {
      const imageInput = Array.from(input.parentElement.children).find(
        (child) => child !== input && child.matches(".preview"),
      );
      if (imageInput) {
        imageInput.innerHTML = "";
      }
      createThumbailFromDefault(input, delimiter);
    });
  }

  // Expose the public API function
  window.dxprBuilder = window.dxprBuilder || {};
  window.dxprBuilder.backend_images_select = backend_images_select;

  // Expose internal functions needed by other files (if any)
  // Example: window.dxprBuilder.imageStyleChangeHandler = imageStyleChangeHandler;
  // Example: window.dxprBuilder.createImageStyleInput = createImageStyleInput;
})(jQuery, Drupal, drupalSettings, window);
