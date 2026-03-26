/* jslint white:true, multivar, this, browser:true */

/**
 * @file Handles file upload elements and buttons for DXPR Builder Drupal integration.
 */

(function ($, Drupal, drupalSettings, window) {
  "use strict";

  // Dependencies from other files (ensure they are loaded before this script)
  const getUrlsFromInput =
    window.dxprBuilder && window.dxprBuilder.getUrlsFromInput;
  const getImageStyleUrl =
    window.dxprBuilder && window.dxprBuilder.getImageStyleUrl;
  const dxpr_builder_get_images =
    window.dxprBuilder && window.dxprBuilder.dxpr_builder_get_images;

  /**
   * Create the file upload button users will click to upload an image or video
   *
   * @var {HTMLElement} input The input used as a reference for inserting the button into the DOM
   * @var {string} type Type of upload ('image' or 'video').
   */
  function createFileUploadButton(input, type) {
    switch (type) {
      case "image":
        // Insert the button into the DOM, and set the button to programmatically click
        // the file upload element when the button is created, thereby initiating the
        // browser's file selection dialog.

        input.parentElement.parentElement.prepend(
          (() => {
            const button = document.createElement("button");
            button.classList.add("ac-select-image", "btn", "btn-default");
            button.textContent = Drupal.t("Select image");

            button.addEventListener("click", function (e) {
              e.preventDefault();

              const firstSibling = Array.from(this.parentElement.children).find(
                (child) =>
                  child !== this &&
                  child.matches(".ac-select-image__content-container"),
              );
              firstSibling.querySelector(".image_upload").click();
            });

            return button;
          })(),
        );
        break;

      case "video":
        input.parentElement.parentElement.prepend(
          (function () {
            const button = document.createElement("button");
            button.classList.add("ac-select-video", "btn", "btn-default");
            button.textContent = Drupal.t("Select video");

            button.addEventListener("click", function (e) {
              e.preventDefault();

              const firstSibling = Array.from(this.parentElement.children).find(
                (child) => child !== this && child.matches(".ac-select-video"),
              );
              firstSibling.querySelector(".video_upload").click();
            });

            return button;
          })(),
        );
        break;
      default:
    }
  }

  /**
   * Create the file upload element used to upload an image or video. When a file
   * has been uploaded, the URL of the file is inserted into the given input.
   * If multiple files have been uploaded, the URLs are separated by the given
   * delimiter
   *
   * @param {HTMLElement} input The input used as a reference for inserting the element into the DOM
   * @param {string} delimiter The delimiter used between filenames stored in the input
   * @param {string} type The type of upload ('image' or 'video').
   */
  function createFileUploadElement(input, delimiter, type) {
    if (!getUrlsFromInput || !getImageStyleUrl || !dxpr_builder_get_images) {
      console.error("DXPR Builder: Missing dependencies for file upload.");
      return;
    }

    if (type === "image") {
      const uploadElement = document.createElement("input");
      uploadElement.type = "file";
      uploadElement.className = "image_upload";
      uploadElement.accept = ".gif,.jpg,.jpeg,.png,.svg";
      uploadElement.hidden = "hidden";

      input.parentElement.prepend(uploadElement);

      uploadElement.addEventListener("change", (event) => {
        const formData = new FormData();
        const { files } = event.target;

        Array.from(files).forEach((file) => {
          formData.append("upload[]", file);
        });

        fetch(drupalSettings.dxprBuilder.fileUploadUrl, {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            // Handle exceptions and error message.
            if (!response.ok) {
              // Server returned an error status code (like 500).
              return response.json().then((errorData) => {
                errorData.status = response.status;
                // Throw the error which can be handled in ::catch() method.
                throw errorData;
              });
            }

            return response.json();
          })
          .then((data) => {
            const imageStyle = Array.from(input.parentElement.children).find(
              (child) => child !== input && child.matches("select"),
            ).value;
            // Loop through the returned files and insert them into the field that the front end will
            // use to insert them into the page
            data.forEach((file) => {
              // Build URL with appropriate entity type and ID parameters.
              // Support both Media entities (mid) and File entities (File ID).
              let urlParams = `fid=${file.fid}`;
              if (file.entity_type === "media") {
                urlParams += `&mid=${file.id}`;
              }

              // Set the URL to be added, based on the image style selected.
              let url = `${file.url}?${urlParams}`;

              url =
                imageStyle === "original"
                  ? url
                  : getImageStyleUrl(url, imageStyle);

              // Insert filename into input
              if (delimiter) {
                const currentImages = getUrlsFromInput(input.value, delimiter);

                currentImages.push(url);
                input.value = currentImages.join(delimiter);
              } else {
                input.value = url;
              }

              // Create a thumbnail for the uploaded image
              dxpr_builder_get_images(true, "thumbnail", url, input, delimiter);

              // Handle image metadata population when the image is inserted
              if (
                window.dxprBuilder &&
                window.dxprBuilder.insertImageMetadata
              ) {
                window.dxprBuilder.insertImageMetadata(input);
              }
            });
          })
          .catch((error) => {
            dxpr_builder_alert(error.message, { type: "danger" });
          });
      });
    }

    if (type === "video") {
      // Convert to a native DOM element.
      const inputNative = input instanceof jQuery ? input.get(0) : input;

      const uploadElement = document.createElement("input");
      uploadElement.type = "file";
      uploadElement.className = "video_upload";
      uploadElement.accept = ".webm,.ogv,.ogg,.mp4";
      uploadElement.hidden = "hidden";

      inputNative.parentElement.prepend(uploadElement);

      // Set up the input which is used to handle the image uploads.
      // This is hidden from the user but used for transferring the image in the background.
      // When clicked, it will handle the upload using AJAX.
      uploadElement.addEventListener("change", (event) => {
        const formData = new FormData();
        const { files } = event.target;

        Array.from(files).forEach((file) => {
          formData.append("upload[]", file);
        });

        fetch(drupalSettings.dxprBuilder.fileUploadUrl, {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            // Handle exceptions and error message.
            if (!response.ok) {
              // Server returned an error status code (like 500).
              return response.json().then((errorData) => {
                errorData.status = response.status;
                // Throw the error which can be handled in ::catch() method.
                throw errorData;
              });
            }

            return response.json();
          })
          .then((data) => {
            const nextSibling = Array.from(input.parentElement.children).find(
              (child) => child !== input && child.matches(".alert-danger"),
            );
            if (nextSibling) {
              nextSibling.remove();
            }

            // Loop through the returned files and insert them into the field that the front end will
            // use to insert them into the page
            data.forEach((file) => {
              // Build URL with appropriate entity type and ID parameters.
              // Support both Media entities (mid) and File entities (File ID).
              let urlParams = `fid=${file.fid}`;
              if (file.entity_type === "media") {
                urlParams += `&mid=${file.id}`;
              }

              const url = `${file.url}?${urlParams}`;

              // Insert filename into input
              if (delimiter) {
                const currentVideos = getUrlsFromInput(input.value, delimiter);

                currentVideos.push(url);
                input.value = currentVideos.join(delimiter);
              } else {
                input.value = url;
              }
            });

            if (window.liveEditingManager) {
              liveEditingManager.update();
            }
          })
          .catch((error) => {
            if (error.status === 413) {
              dxpr_builder_alert(
                `The uploaded video is too large. Max size is ${FILE_UPLOAD_MAX_SIZE}MB`,
                {
                  type: "danger",
                },
              );
            } else {
              dxpr_builder_alert(error.message, { type: "danger" });
            }
          });
      });
    }
  }

  // Expose functions
  window.dxprBuilder = window.dxprBuilder || {};
  window.dxprBuilder.createFileUploadButton = createFileUploadButton;
  window.dxprBuilder.createFileUploadElement = createFileUploadElement;
})(jQuery, Drupal, drupalSettings, window);
