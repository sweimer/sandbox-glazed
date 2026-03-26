/**
 * @file
 * JavaScript for the AI providers configuration table.
 */

/* eslint-env browser */

(function (Drupal, drupalSettings) {
  "use strict";

  /**
   * Behavior to fix table drag issues with empty rows.
   *
   * Ensures all cells in the table have a colSpan property to prevent
   * "Cannot read properties of undefined (reading 'colSpan')" errors.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the AI providers table.
   */
  Drupal.behaviors.dxprAiProvidersFix = {
    attach(context, settings) {
      once(
        "dxpr-ai-providers-fix",
        "table#field-display-overview",
        context,
      ).forEach((table) => {
        // Ensure all cells in the table have a colSpan property
        table.querySelectorAll("tr").forEach((row) => {
          // Check if the row has any cells
          if (
            row.querySelectorAll("td").length === 0 &&
            row.querySelectorAll("th").length === 0
          ) {
            // Add an empty cell to prevent errors
            const cell = document.createElement("td");
            row.appendChild(cell);
          }

          // Ensure all cells have a colSpan attribute
          row.querySelectorAll("td, th").forEach((cell) => {
            if (typeof cell.colSpan === "undefined" || cell.colSpan === null) {
              cell.colSpan = 1;
            }
          });
        });
      });
    },
  };

  // Initialize the fieldUIOverview namespace if it doesn't exist
  Drupal.fieldUIOverview = Drupal.fieldUIOverview || {
    /**
     * Attaches the fieldUIOverview behavior.
     *
     * @param {HTMLTableElement} table
     *   The table element for the overview.
     * @param {object} rowsData
     *   The data of the rows in the table.
     * @param {object} rowHandlers
     *   Handlers to be added to the rows.
     */
    attach(table, rowsData, rowHandlers) {
      const tableDrag = Drupal.tableDrag[table.id];
      if (!tableDrag) {
        return;
      }

      // Add custom table drag callbacks.
      tableDrag.onDrop = this.onDrop;
      tableDrag.row.prototype.onSwap = this.onSwap;

      // Create row handlers.
      table.querySelectorAll("tr.draggable").forEach((row) => {
        // Extract server-side data for the row.
        if (row.id in rowsData) {
          const data = rowsData[row.id];
          data.tableDrag = tableDrag;

          // Create the row handler, make it accessible from the DOM row element.
          const rowHandler = new rowHandlers[data.rowHandler](row, data);

          // Store the handler in a WeakMap instead of using $.data
          if (!Drupal.fieldUIRowHandlers) {
            Drupal.fieldUIRowHandlers = new WeakMap();
          }
          Drupal.fieldUIRowHandlers.set(row, rowHandler);
        }
      });
    },

    /**
     * Lets row handlers react when a row is dropped into a new region.
     */
    onDrop() {
      const dragObject = this;
      const row = dragObject.rowObject.element;
      const rowHandler =
        Drupal.fieldUIRowHandlers && Drupal.fieldUIRowHandlers.get(row);

      if (typeof rowHandler !== "undefined") {
        // Find the region this row was dropped into
        let region = "";

        // First check if we're in the enabled region
        const enabledRegionTitles = Array.from(
          row.parentElement.querySelectorAll("tr.region-enabled-title"),
        );
        const disabledRegionTitles = Array.from(
          row.parentElement.querySelectorAll("tr.region-disabled-title"),
        );

        // Get the closest previous region title
        const closestEnabledTitle = enabledRegionTitles
          .filter(
            (title) =>
              Array.from(row.parentElement.children).indexOf(title) <
              Array.from(row.parentElement.children).indexOf(row),
          )
          .pop();

        const closestDisabledTitle = disabledRegionTitles
          .filter(
            (title) =>
              Array.from(row.parentElement.children).indexOf(title) <
              Array.from(row.parentElement.children).indexOf(row),
          )
          .pop();

        // If we're closer to the enabled region title than the disabled region title, we're in the enabled region
        if (
          closestEnabledTitle &&
          (!closestDisabledTitle ||
            Array.from(row.parentElement.children).indexOf(row) -
              Array.from(row.parentElement.children).indexOf(
                closestEnabledTitle,
              ) <
              Array.from(row.parentElement.children).indexOf(row) -
                Array.from(row.parentElement.children).indexOf(
                  closestDisabledTitle,
                ))
        ) {
          region = "enabled";
        } else {
          region = "disabled";
        }

        // Always update the region, regardless of whether it has changed
        // Let the row handler deal with the region change.
        rowHandler.regionChange(region);
        // Update the row region.
        rowHandler.region = region;

        // Update region messages if the function is available
        if (typeof this.updateRegionMessages === "function") {
          try {
            this.updateRegionMessages();
          } catch (e) {
            // Use Drupal's error logging if available, otherwise use a generic message
            if (Drupal.logError) {
              Drupal.logError("Error updating region messages");
            }
          }
        }
      } else {
        // No row handler found
      }
    },

    /**
     * Refreshes placeholder rows in empty regions while a row is being dragged.
     */
    onSwap(draggedRow) {
      const rowObject = this;
      const { table } = rowObject;

      table.querySelectorAll("tr.region-message").forEach((messageRow) => {
        // If the dragged row is in this region, but above the message row, swap
        // it down one space.
        if (
          messageRow.previousElementSibling ===
          rowObject.group[rowObject.group.length - 1]
        ) {
          // Prevent a recursion problem when using the keyboard to move rows up.
          if (
            rowObject.method !== "keyboard" ||
            rowObject.direction === "down"
          ) {
            rowObject.swap("after", messageRow);
          }
        }

        // This region has become empty.
        if (
          !messageRow.nextElementSibling ||
          !messageRow.nextElementSibling.matches(".draggable")
        ) {
          messageRow.classList.remove("region-populated");
          messageRow.classList.add("region-empty");
        }
        // This region has become populated.
        else if (messageRow.matches(".region-empty")) {
          messageRow.classList.remove("region-empty");
          messageRow.classList.add("region-populated");
        }
      });
    },

    /**
     * Updates the region message classes based on content.
     *
     * Checks each region message row and updates its class based on whether
     * there are any providers in that region.
     */
    updateRegionMessages() {
      const { table } = this;

      table.querySelectorAll("tr.region-message").forEach((messageRow) => {
        const region = messageRow.classList.contains("region-enabled-message")
          ? "enabled"
          : "disabled";

        // Count providers in this region
        const providersInRegion = Array.from(
          table.querySelectorAll("tr.draggable"),
        ).filter(
          (row) =>
            row.querySelector("input.provider-region-name").value === region,
        ).length;

        // Update region message class based on content
        if (providersInRegion > 0) {
          messageRow.classList.remove("region-empty");
          messageRow.classList.add("region-populated");
        } else {
          messageRow.classList.remove("region-populated");
          messageRow.classList.add("region-empty");
        }
      });
    },
  };

  // Initialize the fieldUIDisplayOverview namespace if it doesn't exist
  Drupal.fieldUIDisplayOverview = Drupal.fieldUIDisplayOverview || {};

  /**
   * Constructor for a 'provider' row handler.
   *
   * @constructor
   *
   * @param {HTMLTableRowElement} row
   *   The row DOM element.
   * @param {object} data
   *   Additional data to be populated in the constructed object.
   *
   * @return {Drupal.fieldUIDisplayOverview.provider}
   *   The provider row handler constructed.
   */
  Drupal.fieldUIDisplayOverview.provider = function (row, data) {
    this.row = row;
    this.name = data.name;
    this.region = data.region;
    this.tableDrag = data.tableDrag;
    this.$regionSelect = row.querySelector("input.provider-region-name");
    return this;
  };

  Drupal.fieldUIDisplayOverview.provider.prototype = {
    /**
     * Returns the region corresponding to the current form values of the row.
     *
     * @return {string}
     *   Either 'enabled' or 'disabled'.
     */
    getRegion() {
      return this.$regionSelect.value;
    },

    /**
     * Reacts to a row being changed regions.
     *
     * @param {string} region
     *   The name of the new region for the row.
     *
     * @return {object}
     *   A hash object indicating which rows should be Ajax-updated as a result
     *   of the change.
     */
    regionChange(region) {
      // Update the hidden region input.
      this.$regionSelect.value = region;

      // Ensure the value is set by triggering a change event
      const changeEvent = new Event("change");
      this.$regionSelect.dispatchEvent(changeEvent);

      // Get the current weight
      const weightInput = this.row.querySelector("input.field-weight");
      const weight = parseInt(weightInput.value, 10);

      // Move the row to the correct region visually
      const { row } = this;
      const { table } = this.tableDrag;

      if (region === "enabled") {
        // Find all rows in the enabled region
        const enabledRows = Array.from(
          table.querySelectorAll("tr.draggable"),
        ).filter(
          (r) =>
            r.querySelector("input.provider-region-name").value === "enabled" &&
            r.id !== row.id,
        );

        // Find the enabled region message row
        const enabledRegionMessage = table.querySelector(
          "tr.region-enabled-message",
        );

        // If there are no other rows in this region, insert after the message
        if (enabledRows.length === 0) {
          enabledRegionMessage.after(row);
        } else {
          // Find the right position based on weight
          let inserted = false;
          // Use forEach instead of for...of to avoid ESLint no-restricted-syntax error
          enabledRows.forEach((enabledRow) => {
            const rowWeight = parseInt(
              enabledRow.querySelector("input.field-weight").value,
              10,
            );
            if (weight < rowWeight && !inserted) {
              enabledRow.before(row);
              inserted = true;
            }
          });

          // If not inserted yet (heavier than all existing rows), append to the end
          if (!inserted) {
            const lastEnabledRow = enabledRows[enabledRows.length - 1];
            lastEnabledRow.after(row);
          }
        }
      } else if (region === "disabled") {
        // Find all rows in the disabled region
        const disabledRows = Array.from(
          table.querySelectorAll("tr.draggable"),
        ).filter(
          (r) =>
            r.querySelector("input.provider-region-name").value ===
              "disabled" && r.id !== row.id,
        );

        // Find the disabled region message row
        const disabledRegionMessage = table.querySelector(
          "tr.region-disabled-message",
        );

        // If there are no other rows in this region, insert after the message
        if (disabledRows.length === 0) {
          disabledRegionMessage.after(row);
        } else {
          // Find the right position based on weight
          let inserted = false;
          // Use forEach instead of for...of to avoid ESLint no-restricted-syntax error
          disabledRows.forEach((disabledRow) => {
            const rowWeight = parseInt(
              disabledRow.querySelector("input.field-weight").value,
              10,
            );
            if (weight < rowWeight && !inserted) {
              disabledRow.before(row);
              inserted = true;
            }
          });

          // If not inserted yet (heavier than all existing rows), append to the end
          if (!inserted) {
            const lastDisabledRow = disabledRows[disabledRows.length - 1];
            lastDisabledRow.after(row);
          }
        }
      }

      // Update default provider styling
      this.updateDefaultProvider();

      // Update region messages if the function is available
      if (typeof this.tableDrag.updateRegionMessages === "function") {
        try {
          this.tableDrag.updateRegionMessages();
        } catch (e) {
          // Use Drupal's error logging if available, otherwise use a generic message
          if (Drupal.logError) {
            Drupal.logError("Error updating region messages");
          }
        }
      }

      // No need to refresh anything.
      return {};
    },

    /**
     * Updates the default provider styling.
     */
    updateDefaultProvider() {
      // Remove styling from all rows
      this.tableDrag.table.querySelectorAll("tr.draggable").forEach((row) => {
        row.classList.remove("default-provider");
      });

      // Find all enabled providers
      const enabledProviders = Array.from(
        this.tableDrag.table.querySelectorAll("tr.draggable"),
      ).filter(
        (row) =>
          row.querySelector("input.provider-region-name").value === "enabled",
      );

      // Add styling to the first enabled provider
      if (enabledProviders.length > 0) {
        enabledProviders[0].classList.add("default-provider");
      }
    },
  };

  /**
   * Behavior for the AI providers table.
   *
   * Initializes the draggable table for AI providers configuration.
   * Handles region changes and updates the default provider styling.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the AI providers configuration table.
   */
  Drupal.behaviors.dxprAiProviders = {
    attach(context, settings) {
      // Initialize the table once
      once(
        "dxpr-ai-providers-init",
        "table#field-display-overview",
        context,
      ).forEach((table) => {
        // Extend the tableDrag object with our updateRegionMessages function
        if (Drupal.tableDrag && Drupal.tableDrag["field-display-overview"]) {
          Drupal.tableDrag["field-display-overview"].updateRegionMessages =
            Drupal.fieldUIOverview.updateRegionMessages;
        }

        // Create row data for our providers
        const rowsData = {};

        // First, ensure all providers are in the correct region visually
        table.querySelectorAll("tr.draggable").forEach((row) => {
          if (row.id) {
            const regionInput = row.querySelector("input.provider-region-name");
            const weightInput = row.querySelector("input.field-weight");
            const region = regionInput.value;
            const weight = weightInput.value;

            // Ensure the region is set to 'enabled' by default if empty
            if (!region) {
              regionInput.value = "enabled";
            }

            // Move the row to the correct region visually
            if (region === "enabled") {
              // Find the enabled region message row
              const enabledRegionMessage = table.querySelector(
                "tr.region-enabled-message",
              );
              // Move this row after the enabled region message
              enabledRegionMessage.after(row);
            } else if (region === "disabled") {
              // Find the disabled region message row
              const disabledRegionMessage = table.querySelector(
                "tr.region-disabled-message",
              );
              // Move this row after the disabled region message
              disabledRegionMessage.after(row);
            }

            rowsData[row.id] = {
              rowHandler: "provider",
              name: row.id,
              region: regionInput.value,
              weight,
            };
          }
        });

        // Update region message classes based on content
        table.querySelectorAll("tr.region-message").forEach((messageRow) => {
          const region = messageRow.classList.contains("region-enabled-message")
            ? "enabled"
            : "disabled";

          // Count providers in this region
          const providersInRegion = Array.from(
            table.querySelectorAll("tr.draggable"),
          ).filter(
            (row) =>
              row.querySelector("input.provider-region-name").value === region,
          ).length;

          // Update region message class based on content
          if (providersInRegion > 0) {
            messageRow.classList.remove("region-empty");
            messageRow.classList.add("region-populated");
          } else {
            messageRow.classList.remove("region-populated");
            messageRow.classList.add("region-empty");
          }
        });

        // Attach the fieldUIOverview behavior
        Drupal.fieldUIOverview.attach(
          table,
          rowsData,
          Drupal.fieldUIDisplayOverview,
        );

        // Find all enabled providers
        const enabledProviders = Array.from(
          table.querySelectorAll("tr.draggable"),
        ).filter(
          (row) =>
            row.querySelector("input.provider-region-name").value === "enabled",
        );

        // Add styling to the first enabled provider
        if (enabledProviders.length > 0) {
          enabledProviders[0].classList.add("default-provider");
        }

        // Add form submit handler to ensure region values are properly set
        const form = table.closest("form");
        if (form) {
          form.addEventListener("submit", () => {
            // Ensure all providers have a region set
            table.querySelectorAll("tr.draggable").forEach((row) => {
              const regionInput = row.querySelector(
                "input.provider-region-name",
              );
              // We don't need to use the weightInput or weight variables since they're not used
              const region = regionInput.value;

              // Ensure the region is set to 'enabled' by default if empty
              if (!region) {
                regionInput.value = "enabled";
              }
            });

            return true;
          });
        }
      });
    },
  };
})(Drupal, drupalSettings);
