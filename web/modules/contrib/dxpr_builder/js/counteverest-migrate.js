/**
 * CountEverest Migration Utility
 * Migrates legacy countdown timers to CountEverest 3.1.0 format
 * @todo 3.0.0 - Remove this file
 */

(function () {
  "use strict";

  /**
   * Helper function to format date string from the custom format to ISO
   */
  function formatDateToISO(dateStr, includeTime = false) {
    if (!dateStr) return "";

    const dateParts = dateStr.split(" ");
    const datePartsSub = dateParts[0].split(".");
    const [day, month, year] = datePartsSub;
    const hours = includeTime && dateParts[1] ? dateParts[1] : "00";

    // Convert to ISO format YYYY-MM-DD HH:MM:SS
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    const paddedHours = hours.padStart(2, "0");

    return `${year}-${paddedMonth}-${paddedDay} ${paddedHours}:00:00`;
  }

  /**
   * Calculate target date time based on counter scope and settings
   */
  function calculateTargetDateTime(element) {
    const counterScope =
      element.getAttribute("data-azat-counter_scope") || "date";
    let targetDateTime = "";
    let onCompleteUrl = "";

    switch (counterScope) {
      case "date": {
        const date = element.getAttribute("data-azat-date");
        if (date) {
          targetDateTime = formatDateToISO(date);
        }
        break;
      }

      case "date_time": {
        const dateTime = element.getAttribute("data-azat-date_time");
        if (dateTime) {
          targetDateTime = formatDateToISO(dateTime, true);
        }
        break;
      }

      case "repeating": {
        const time = element.getAttribute("data-azat-time");
        if (time) {
          const d = new Date();
          d.setHours(parseInt(time, 10) || 0, 0, 0, 0);
          // If the time has already passed today, set it for tomorrow
          if (d <= new Date()) {
            d.setDate(d.getDate() + 1);
          }
          targetDateTime = d.toISOString().slice(0, 19).replace("T", " ");
          onCompleteUrl = element.getAttribute("data-azat-referrer") || "";
        }
        break;
      }

      case "resetting": {
        const saved = element.getAttribute("data-azat-saved");
        if (saved) {
          const creationDate = new Date(saved);
          const countdownInterval =
            (parseInt(element.getAttribute("data-azat-reset_hours") || 0, 10) *
              60 *
              60 +
              parseInt(
                element.getAttribute("data-azat-reset_minutes") || 0,
                10,
              ) *
                60 +
              parseInt(
                element.getAttribute("data-azat-reset_seconds") || 0,
                10,
              )) *
            1000;

          let endDateTime = new Date(
            creationDate.getTime() + countdownInterval,
          );

          // Handle restart logic
          if (element.getAttribute("data-azat-restart") === "yes") {
            const current = new Date();
            const elapsedTime = current.getTime() - creationDate.getTime();
            const completedCountdowns = Math.floor(
              elapsedTime / countdownInterval,
            );
            const lastCountdownElapsed =
              elapsedTime - completedCountdowns * countdownInterval;
            const timeToComplete = countdownInterval - lastCountdownElapsed;
            endDateTime = new Date(current.getTime() + timeToComplete);
          }

          targetDateTime = endDateTime
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
          onCompleteUrl = element.getAttribute("data-azat-referrer") || "";
        }
        break;
      }

      default: {
        // Handle unknown counter scope
        break;
      }
    }

    // If no valid targetDateTime was set, provide a default (1 year from now)
    if (!targetDateTime) {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      targetDateTime = defaultDate.toISOString().slice(0, 19).replace("T", " ");
    }

    return { targetDateTime, onCompleteUrl };
  }

  /**
   * Get theme class from countdown style
   */
  function getThemeClass(countdownStyle) {
    if (!countdownStyle || countdownStyle === "plain") return "";
    return `ce-countdown--theme-${countdownStyle.replace("style", "")}`;
  }

  /**
   * Get display units from display attribute
   */
  function getDisplayUnits(display) {
    return display
      ? display.split(",")
      : ["days", "hours", "minutes", "seconds"];
  }

  /**
   * Check if element needs migration
   */
  function needsMigration(element) {
    const countdownDiv = element.querySelector(".ce-countdown");
    if (!countdownDiv) return false;

    // Check if it already has CountEverest 3.1.0 data attributes
    const hasNewAttributes =
      countdownDiv.hasAttribute("data-ce-datetime") ||
      countdownDiv.hasAttribute("data-dxpr-builder-libraries");

    // Check if it has old DXPR Builder attributes
    const hasOldAttributes =
      element.hasAttribute("data-azat-counter_scope") ||
      element.hasAttribute("data-azat-date") ||
      element.hasAttribute("data-azat-countdown_style");

    return !hasNewAttributes && hasOldAttributes;
  }

  /**
   * Migrate a single countdown element
   */
  function migrateCountdownElement(element) {
    try {
      const countdownDiv = element.querySelector(".ce-countdown");
      if (!countdownDiv) return false;

      // Get element ID for creating child ID
      const elementId = element.id || element.getAttribute("data-azat-pid");
      if (!elementId) {
        return false;
      }

      // Calculate target date time
      const { targetDateTime, onCompleteUrl } =
        calculateTargetDateTime(element);

      // Get display units
      const displayAttribute = element.getAttribute("data-azat-display");
      const displayUnits = getDisplayUnits(displayAttribute);

      // Get theme class
      const countdownStyle = element.getAttribute("data-azat-countdown_style");
      const themeClass = getThemeClass(countdownStyle);

      // Set up the child countdown div with proper ID and attributes
      countdownDiv.id = `${elementId}-ce`;
      if (themeClass) {
        countdownDiv.className = `ce-countdown ${themeClass}`;
      } else {
        countdownDiv.className = "ce-countdown";
      }

      // Set CountEverest 3.1.0 data attributes
      countdownDiv.setAttribute("data-dxpr-builder-libraries", "counteverest");
      countdownDiv.setAttribute("data-ce-datetime", targetDateTime);
      countdownDiv.setAttribute("data-ce-units", displayUnits.join(","));
      countdownDiv.setAttribute("data-ce-count-up", "false");

      // Set labels (use English as default, could be enhanced with proper i18n)
      countdownDiv.setAttribute("data-ce-years-label", "Years");
      countdownDiv.setAttribute("data-ce-year-label", "Year");
      countdownDiv.setAttribute("data-ce-days-label", "Days");
      countdownDiv.setAttribute("data-ce-day-label", "Day");
      countdownDiv.setAttribute("data-ce-hours-label", "Hours");
      countdownDiv.setAttribute("data-ce-hour-label", "Hour");
      countdownDiv.setAttribute("data-ce-minutes-label", "Minutes");
      countdownDiv.setAttribute("data-ce-minute-label", "Minute");
      countdownDiv.setAttribute("data-ce-seconds-label", "Seconds");
      countdownDiv.setAttribute("data-ce-second-label", "Second");

      // Set optional attributes
      if (onCompleteUrl) {
        countdownDiv.setAttribute("data-ce-on-complete-url", onCompleteUrl);
      }

      if (element.getAttribute("data-azat-restart") === "yes") {
        countdownDiv.setAttribute("data-ce-restart", "true");
      }

      // Clear old content
      countdownDiv.innerHTML = "";

      // Remove old initialization marker if present
      delete countdownDiv.dataset.ceInitialized;

      // Initialize CountEverest if library is available
      if (typeof CountEverest !== "undefined") {
        // Destroy any existing instance first
        CountEverest.destroyInstance(countdownDiv.id);
        // Initialize new instance
        CountEverest.initElement(countdownDiv);
        return true;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find and migrate all countdown elements that need migration
   */
  function migrateAllCountdowns() {
    const countdownElements = document.querySelectorAll(
      '.az-countdown[data-azb="az_countdown"]',
    );
    let migrated = 0;
    let total = 0;

    countdownElements.forEach((element) => {
      if (needsMigration(element)) {
        total++;
        if (migrateCountdownElement(element)) {
          migrated++;
        }
      }
    });

    // Migration completed silently

    return { migrated, total };
  }

  /**
   * Initialize migration when DOM is ready and CountEverest is available
   */
  function initMigration() {
    // Wait for CountEverest library to be available
    function waitForCountEverest(attempts = 0) {
      if (typeof CountEverest !== "undefined") {
        migrateAllCountdowns();
      } else if (attempts < 50) {
        // Wait up to 5 seconds
        setTimeout(() => waitForCountEverest(attempts + 1), 100);
      } else {
        // Still attempt migration to prepare elements
        migrateAllCountdowns();
      }
    }

    waitForCountEverest();
  }

  // Export for manual usage
  window.CountEverestMigration = {
    migrateAllCountdowns,
    migrateCountdownElement,
    needsMigration,
  };

  // Auto-run migration when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMigration);
  } else {
    initMigration();
  }
})();
