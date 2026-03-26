/**
 * @file
 * Handles image metadata population and management for DXPR Builder.
 *
 * This module provides functionality to:
 * - Extract and validate image URLs
 * - Fetch metadata for images from Drupal entities
 * - Insert image metadata into the DXPR Builder interface
 * - Handle image preview changes and updates
 *
 * The main entry point is the insertImageMetadata() function which is called
 * when images are inserted or updated in the builder.
 *
 * @see web/modules/dxpr_builder/js/image-utils.js
 * For related image handling functionality
 */

(function (Drupal, drupalSettings) {
  "use strict";

  /**
   * Checks if a URL appears to be a valid image URL.
   *
   * @param {string} url - The URL to validate
   *
   * @returns {boolean} True if it appears to be an image URL
   */
  function isValidImageUrl(url) {
    // Check for common image extensions or Drupal file paths
    const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
    const drupalFilePattern = /\/(files|system\/files)\//;

    return imagePattern.test(url) || drupalFilePattern.test(url);
  }

  /**
   * Extracts entity information from an image URL.
   *
   * @param {string} url - The image URL
   *
   * @returns {Object} Object with id and type properties
   */
  function extractEntityInfoFromUrl(url) {
    // Handle multiple comma-separated URLs.
    // For the "Image Carousel" element we return "alt" and "title" for
    // the first image entry.
    if (url.includes(",")) {
      const urls = url.split(",");
      // Return info from the first URL that has valid entity info
      const validInfo = urls
        .map((singleUrl) => extractEntityInfoFromUrl(singleUrl.trim()))
        .find((info) => info.id && info.type);

      if (validInfo) {
        return validInfo;
      }
    }

    // Check for file ID parameter
    const fidMatch = url.match(/[?&]fid=(\d+)/);
    if (fidMatch) {
      return { id: fidMatch[1], type: "file" };
    }

    // Check for media ID parameter (Acquia DAM assets)
    const midMatch = url.match(/[?&]mid=(\d+)/);
    if (midMatch) {
      return { id: midMatch[1], type: "media" };
    }

    // Try to extract file ID from path patterns
    const pathMatch = url.match(/\/files\/.*\/([0-9]+)\//);
    if (pathMatch) {
      return { id: pathMatch[1], type: "file" };
    }

    return { id: null, type: null };
  }

  /**
   * Populates image alt and title metadata fields in a form.
   *
   * @param {HTMLElement} imageInput - The image input element that triggered the metadata population
   * @param {Object|Array} metadata - Image metadata containing alt and/or title. Can be single object or array
   * @param {string} [metadata.alt] - Alt text for the image
   * @param {string} [metadata.title] - Title text for the image
   */
  function populateImageMetadata(imageInput, metadata) {
    if (!metadata || metadata.length === 0) {
      return;
    }

    // Handle both single object and array cases
    metadata = Array.isArray(metadata) ? metadata[0] : metadata;
    if (!metadata.alt && !metadata.title) {
      return;
    }

    // Find the closest form or parent container that might contain alt/title fields
    const container = imageInput.closest(".modal-content");
    if (!container) {
      return;
    }

    // Find alt and title input fields in the same container or nearby elements
    // Look for inputs with common naming patterns
    if (metadata.alt) {
      const altField = container.querySelector('input[name*="alt"]');

      if (altField) {
        altField.value = metadata.alt;
        // Trigger change event to notify any listeners
        altField.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    if (metadata.title) {
      const titleField = container.querySelector('input[name*="title"]');

      if (titleField) {
        titleField.value = metadata.title;
        // Trigger change event to notify any listeners
        titleField.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  /**
   * Fetches image metadata from the backend.
   *
   * @param {string} entityId - The entity ID
   * @param {string} entityType - The entity type ('file' or 'media')
   * @param {HTMLElement} imageInput - The image input element
   */
  function fetchImageMetadata(entityId, entityType, imageInput) {
    // First, get the CSRF token
    fetch(drupalSettings.dxprBuilder.dxprCsrfUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((csrfUrl) => {
        // Make the metadata request
        const requestBody = new URLSearchParams({
          action: "dxpr_builder_get_image_metadata",
          entityId: entityId,
          entityType: entityType,
        });

        return fetch(csrfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: requestBody,
        });
      })
      .then((response) => response.json())
      .then((responseData) => {
        // Extract metadata from response
        const metadata = responseData.data || responseData;

        if (metadata && (metadata.alt || metadata.title)) {
          populateImageMetadata(imageInput, metadata);
        }
      })
      .catch((error) => {
        dxpr_builder_alert("Failed to fetch image metadata", {
          type: "danger",
        });
      });
  }

  /**
   * Inserts image metadata for a given input element.
   *
   * This function handles inserting metadata for an image when it is added or updated
   * in the DXPR Builder interface. It:
   * 1. Validates the image URL
   * 2. Extracts entity information (file ID or media ID)
   * 3. Fetches and populates the metadata if valid entity info exists
   *
   * @param {HTMLElement} inputElement - The input element containing the image URL
   * @param {string} [inputElement.value] - The input value
   */
  function insertImageMetadata(inputElement) {
    const imageUrl = inputElement.value.trim();

    // Only proceed if we have a valid image URL
    if (!imageUrl || !isValidImageUrl(imageUrl)) {
      return;
    }

    // Extract file or media ID from the URL if present
    const entityInfo = extractEntityInfoFromUrl(imageUrl);
    if (entityInfo.id && entityInfo.type) {
      fetchImageMetadata(entityInfo.id, entityInfo.type, inputElement);
    }
  }

  // Expose functions to global namespace.
  window.dxprBuilder = window.dxprBuilder || {};
  window.dxprBuilder.insertImageMetadata = insertImageMetadata;
})(Drupal, drupalSettings);
