/*!
 * CountEverest - Vanilla JS Plugin
 * @version   3.1.0
 * @author    Patrick Baber (original jQuery plugin)
 * @author    Jurriaan Roelofs
 * @see       http://counteverest.anacoda.de
 */

// eslint-disable-next-line no-unused-vars
class CountEverest {
  static DEFAULT_SETTINGS;
  static _instances = new Map();

  constructor(element, options, callback) {
    CountEverest.DEFAULT_SETTINGS = {
      day: 1,
      month: 1,
      year: 2050,
      hour: 0,
      minute: 0,
      second: 0,
      countUp: false,
      singularLabels: true,
      leftHandZeros: true,
      yearsLabel: 'Years',
      yearLabel: 'Year',
      monthsLabel: 'Months',
      monthLabel: 'Month',
      daysLabel: 'Days',
      dayLabel: 'Day',
      hoursLabel: 'Hours',
      hourLabel: 'Hour',
      minutesLabel: 'Minutes',
      minuteLabel: 'Minute',
      secondsLabel: 'Seconds',
      secondLabel: 'Second',
      accentColor: '#284ED8',
      units: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
      onInit: null,
      afterCalculation: null,
      onChange: null,
    };
    this.#callback = callback;
    this.#element = element;
    this.#settings = { ...CountEverest.DEFAULT_SETTINGS, ...options };

    // Apply theme-specific options if not already applied
    if (!options._themeApplied) {
      CountEverest.applyThemeOptions(element, this.#settings);
    }

    // Store settings on element for theme functions to access
    element._ceSettings = this.#settings;

    // Register instance by element ID if available
    if (element.id) {
      CountEverest._instances.set(element.id, this);
    }

    this.#intervalId = null;
    this.init();
  }
  #callback;
  #element;
  #settings;
  #intervalId;
  #targetDate;

  init() {
    this.createDOM();

    // For Theme 9, canvases must be created after the DOM is ready.
    if (this.#element.classList.contains('ce-countdown--theme-9')) {
      CountEverest.createCanvasesIfNeeded(this.#element);
    }

    // Apply accent color for Theme 6 now that the DOM is ready.
    if (this.#element.classList.contains('ce-countdown--theme-6')) {
      const accentColor = this.#settings.accentColor;
      const flipBlocks = this.#element.querySelectorAll(
        '.ce-flip-wrap .ce-flip-front, .ce-flip-wrap .ce-flip-back'
      );
      flipBlocks.forEach((block) => {
        block.style.backgroundColor = accentColor;
      });
    }

    this.setTargetDate(
      new Date(
        this.#settings.year,
        this.#settings.month - 1,
        this.#settings.day,
        this.#settings.hour,
        this.#settings.minute,
        this.#settings.second
      )
    );
    this.calculate();
    this.#intervalId = setInterval(() => this.calculate(), 1000);
    this.#settings.onInit?.call(this);
  }

  calculate() {
    const currentDate = new Date();
    const targetDate = this.#targetDate;
    let timeDiff = targetDate - currentDate;
    const originalDiff = Math.abs(timeDiff); // keep full difference for total-days calc

    if (this.#settings.countUp) {
      timeDiff = currentDate - targetDate;
    } else {
      timeDiff = Math.max(0, timeDiff);
    }

    // Hard-coded time constants (removed from settings)
    const YEAR_MS = 31536000000;
    const MONTH_MS = 2629800000; // Average month (30.44 days)
    const DAY_MS = 86400000;
    const HOUR_MS = 3600000;
    const MINUTE_MS = 60000;
    const SECOND_MS = 1000;

    const values = {};
    let remainingTime = timeDiff;

    // Define all possible units in order from largest to smallest
    const allUnits = [
      { name: 'years', ms: YEAR_MS },
      { name: 'months', ms: MONTH_MS },
      { name: 'days', ms: DAY_MS },
      { name: 'hours', ms: HOUR_MS },
      { name: 'minutes', ms: MINUTE_MS },
      { name: 'seconds', ms: SECOND_MS },
    ];

    // Calculate each unit in order, but only if it's requested
    allUnits.forEach((unit) => {
      if (this.#settings.units.includes(unit.name)) {
        values[unit.name] = Math.floor(remainingTime / unit.ms);
        remainingTime %= unit.ms;
      }
    });

    // Special handling for days when years/months are not included:
    // Show total days instead of days within the current month/year
    if (
      this.#settings.units.includes('days') &&
      !this.#settings.units.includes('years') &&
      !this.#settings.units.includes('months')
    ) {
      values.days = Math.floor(Math.abs(timeDiff) / DAY_MS);
    }

    Object.assign(this, values);

    if (typeof this.#settings.afterCalculation === 'function') {
      this.#settings.afterCalculation.call(this);
    }

    this.output();

    if (timeDiff <= 0 && !this.#settings.countUp) {
      clearInterval(this.#intervalId);
      this.#callback.call(this);
    }

    if (typeof this.#settings.onChange === 'function') {
      this.#settings.onChange.call(this, values);
    }
  }

  output() {
    // Always show all configured units regardless of their values
    const visibleUnits = this.#settings.units;

    visibleUnits.forEach((unit) => {
      const value = this[unit] || 0;
      let valueElement;

      // Theme-specific selectors
      if (this.#element.classList.contains('ce-countdown--theme-6')) {
        valueElement = this.#element.querySelector(`.ce-${unit} .ce-flip-back`);
      } else if (this.#element.classList.contains('ce-countdown--theme-10')) {
        valueElement = this.#element.querySelector(`.${unit}`);
      } else {
        valueElement = this.#element.querySelector(`.ce-${unit}`);
      }

      const labelElement = this.#element.querySelector(`.ce-${unit}-label`);

      if (valueElement) {
        // For theme 10, the whole value is passed to a special handler.
        // For others, we wrap individual digits.
        if (this.#element.classList.contains('ce-countdown--theme-10')) {
          // Do nothing, handled by the theme-specific afterCalculation callback
        } else if (this.#element.classList.contains('ce-countdown--theme-9')) {
          // Do nothing here; this is handled by the theme-specific onChange handler.
        } else {
          valueElement.innerHTML = this.wrapDigits(value);
        }
      }

      if (labelElement) {
        labelElement.textContent = this.getLabel(unit, value);
      }
    });

    // Ensure all units are visible
    this.#settings.units.forEach((unit) => {
      const unitElement = this.#element.querySelector(`.ce-${unit}`);
      const colElement = this.#element.querySelector(`.ce-col:has(.ce-${unit})`);

      if (unitElement && unitElement.parentElement) {
        unitElement.parentElement.style.display = '';
      }
      if (colElement) {
        colElement.style.display = '';
      }
    });
  }

  wrapDigits(value) {
    const valueStr = value.toString();
    const paddedValue = this.#settings.leftHandZeros ? valueStr.padStart(2, '0') : valueStr;
    return paddedValue
      .split('')
      .map((digit) => `<span class="ce-digit">${digit}</span>`)
      .join('');
  }

  writeToDom(wrapper, value) {
    const element = this.#element.querySelector(wrapper);
    if (element) element.textContent = value;
  }

  writeLabelToDom(wrapper, value) {
    const element = this.#element.querySelector(wrapper);
    if (element) element.textContent = value;
  }

  getLabel(unit, value) {
    const singular = `${unit.slice(0, -1)}Label`;
    const plural = `${unit}Label`;
    return value === 1 && this.#settings.singularLabels
      ? this.#settings[singular]
      : this.#settings[plural];
  }

  setTargetDate(date) {
    this.#targetDate = date;
  }

  getTargetDate() {
    return this.#targetDate;
  }

  destroy() {
    clearInterval(this.#intervalId);

    // Remove from registry if element has ID
    if (this.#element.id) {
      CountEverest._instances.delete(this.#element.id);
    }
  }

  strPad(str, len, pad = '0') {
    return String(str).padStart(len, pad);
  }

  /**
   * Static method to enable automatic initialization of countdown timers
   * when they scroll into view. Elements with data-ce-datetime attribute
   * will be automatically initialized.
   */
  static autoInit(options = {}) {
    const defaultOptions = {
      selector: '[data-ce-datetime]',
      rootMargin: '0px',
      threshold: 0.1,
    };

    const settings = { ...defaultOptions, ...options };

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // IntersectionObserver not supported, fallback to immediate initialization
      CountEverest.initAllVisible(settings.selector);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.ceInitialized) {
            CountEverest.initElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: settings.rootMargin,
        threshold: settings.threshold,
      }
    );

    // Observe all auto-init elements
    const elements = document.querySelectorAll(settings.selector);
    elements.forEach((element) => {
      if (!element.dataset.ceInitialized) {
        observer.observe(element);
      }
    });
  }

  /**
   * Initialize all visible elements immediately (fallback for older browsers)
   */
  static initAllVisible(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (!element.dataset.ceInitialized) {
        CountEverest.initElement(element);
      }
    });
  }

  /**
   * Destroy instance by element ID
   */
  static destroyInstance(elementId) {
    const instance = CountEverest._instances.get(elementId);
    if (instance) {
      instance.destroy();
      return true;
    }
    return false;
  }

  /**
   * Initialize a single countdown element from data attributes
   */
  static initElement(element, callback) {
    const options = CountEverest.parseDataAttributes(element);

    // Apply theme-specific options
    CountEverest.applyThemeOptions(element, options);
    options._themeApplied = true;

    // Mark as initialized to prevent double initialization
    element.dataset.ceInitialized = 'true';

    // Create new CountEverest instance
    new CountEverest(element, options, callback);
  }

  /**
   * Apply theme-specific options and functionality
   */
  static applyThemeOptions(element, options) {
    // Theme 6: Colorful Blocks
    if (element.classList.contains('ce-countdown--theme-6')) {
      options.daysWrapper = '.ce-days .ce-flip-back';
      options.hoursWrapper = '.ce-hours .ce-flip-back';
      options.minutesWrapper = '.ce-minutes .ce-flip-back';
      options.secondsWrapper = '.ce-seconds .ce-flip-back';
      options.wrapDigits = false;

      options.onChange = function () {
        CountEverest.theme6Animate(element.querySelectorAll('.ce-col>div'));
      };
    }

    // Theme 9: Minimal Circles
    else if (element.classList.contains('ce-countdown--theme-9')) {
      options.onChange = function () {
        CountEverest.theme9DrawCircles(element, this, options.accentColor || '#284ED8');
      };
    }

    // Theme 10: Airport Flip Clock Style
    else if (element.classList.contains('ce-countdown--theme-10')) {
      // Theme 10 can handle any units, don't override unless explicitly limited in demo
      // No unit restrictions - let it use the default or user-specified units

      let firstCalculation = true;
      options.leftHandZeros = true;
      options.afterCalculation = function () {
        CountEverest.theme10FlipClock(element, this, firstCalculation);
        firstCalculation = false;
      };
    }

    // Theme 12: Video Background / Animated Gradient
    else if (element.classList.contains('ce-countdown--theme-12')) {
      if (options.accentColor) {
        element.style.color = options.accentColor;

        const originalOnChange = options.onChange;
        options.onChange = function (...args) {
          const digits = element.querySelectorAll('.ce-digit');
          digits.forEach((digit) => {
            digit.style.borderColor = options.accentColor;
          });

          if (originalOnChange) {
            originalOnChange.apply(this, args);
          }
        };
      }
    }
  }

  /**
   * Theme 6: Colorful Blocks animation handler
   */
  static theme6Animate(elements) {
    elements.forEach(function (el) {
      const flipFront = el.querySelector('.ce-flip-front');
      const flipBack = el.querySelector('.ce-flip-back');
      const field = flipBack.textContent;
      const fieldOld = el.getAttribute('data-old');
      if (typeof fieldOld === 'undefined') {
        el.setAttribute('data-old', field);
      }
      if (field != fieldOld) {
        el.classList.add('ce-animate');
        window.setTimeout(function () {
          flipFront.textContent = field;
          el.classList.remove('ce-animate');
          el.setAttribute('data-old', field);
        }, 800);
      }
    });
  }

  /**
   * Theme 9: Minimal Circles canvas drawing
   */
  static theme9DrawCircles(element, data, accentColor = '#284ED8') {
    // Helper function for degree calculation
    function deg(v) {
      return (Math.PI / 180) * v - Math.PI / 2;
    }

    // Helper function to draw individual circle
    function drawCircle(canvas, value, max, accent) {
      if (!canvas) return;
      const secondaryColor = '#282828';
      const circle = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - canvas.width * 0.05; // 5% margin
      const lineWidth = Math.max(3, canvas.width * 0.02); // 2% of canvas width

      circle.clearRect(0, 0, canvas.width, canvas.height);
      circle.lineWidth = lineWidth;

      // Draw secondary circle
      circle.beginPath();
      circle.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      circle.strokeStyle = secondaryColor;
      circle.stroke();

      // Draw primary circle
      circle.beginPath();
      circle.strokeStyle = accent;
      circle.arc(centerX, centerY, radius, deg(0), deg((360 / max) * value));
      circle.stroke();
    }

    // Get the settings from the element to know which units are configured
    const settings = element._ceSettings || {
      units: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
    };

    // Define unit configurations with their maximum values
    const unitConfigs = {
      years: { max: 100, value: data.years || 0 },
      months: { max: 12, value: data.months || 0 },
      days: { max: 365, value: data.days || 0 },
      hours: { max: 24, value: data.hours || 0 },
      minutes: { max: 60, value: data.minutes || 0 },
      seconds: { max: 60, value: data.seconds || 0 },
    };

    // Update text values for all units that exist in the DOM
    settings.units.forEach((unit) => {
      const config = unitConfigs[unit];
      if (config) {
        const valueEl = element.querySelector(`.ce-${unit}`);
        if (valueEl) {
          // Respect the leftHandZeros setting
          valueEl.textContent = settings.leftHandZeros
            ? data.strPad(config.value, 2)
            : config.value;
        }
      }
    });

    // Find all circle containers and match them to units
    const circleElements = element.querySelectorAll('.ce-circle');

    circleElements.forEach((circleEl, index) => {
      const canvas = circleEl.querySelector('canvas');

      // Find which unit this circle represents by checking for unit classes
      const unitForThisCircle = settings.units.find((unit) =>
        Array.from(circleEl.querySelectorAll('[class*="ce-"]')).some((el) =>
          el.classList.contains(`ce-${unit}`)
        )
      );

      if (canvas && unitForThisCircle && unitConfigs[unitForThisCircle]) {
        const config = unitConfigs[unitForThisCircle];
        drawCircle(canvas, config.value, config.max, accentColor);
      }
    });
  }

  /**
   * Theme 10: Airport Flip Clock animation handler
   */
  static theme10FlipClock(element, data, isFirstCalculation) {
    // Get the settings from the element to know which units are configured
    const settings = element._ceSettings || {
      units: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
    };

    // Build units object based on what's actually configured
    const units = {};
    settings.units.forEach((unit) => {
      units[unit] = data[unit] || 0;
    });

    if (isFirstCalculation) {
      Object.entries(units).forEach(([unit, value]) => {
        const unitElement = element.querySelector(`.${unit}`);
        if (!unitElement) return;

        // Determine digit count based on leftHandZeros setting
        let digitCount;
        if (settings.leftHandZeros) {
          // For leftHandZeros, ensure at least 2 digits for most units
          digitCount = Math.max(2, value.toString().length);
        } else {
          // Without leftHandZeros, use actual value length
          digitCount = Math.max(1, value.toString().length);
        }

        const dig = Array.from(
          { length: digitCount },
          () => `
            <div class="ce-digits">
              ${Array.from(
                { length: 10 },
                (_, i) => `
                <div class="ce-digits-inner">
                  <div class="ce-flip-wrap">
                    <div class="ce-up">
                      <div class="ce-shadow"></div>
                      <div class="ce-inn">${i}</div>
                    </div>
                    <div class="ce-down">
                      <div class="ce-shadow"></div>
                      <div class="ce-inn">${i}</div>
                    </div>
                  </div>
                </div>
              `
              ).join('')}
            </div>`
        ).join('');
        unitElement.innerHTML = dig;
      });
    }

    Object.entries(units).forEach(([unit, value]) => {
      const unitElement = element.querySelector(`.${unit}`);
      if (!unitElement) return;
      const digitCount = unitElement.querySelectorAll('.ce-digits').length;

      // Apply padding based on leftHandZeros setting
      let paddedValue;
      if (settings.leftHandZeros) {
        paddedValue = data.strPad(value.toString(), digitCount, '0');
      } else {
        paddedValue = value.toString().padStart(digitCount, '0');
      }

      for (let i = 0; i < paddedValue.length; i++) {
        const digitsWrap = unitElement.querySelector(`.ce-digits:nth-child(${i + 1})`);
        if (!digitsWrap) continue;
        const digit = parseInt(paddedValue[i]);
        const allDigitsInner = digitsWrap.querySelectorAll('.ce-digits-inner');

        allDigitsInner.forEach((el, index) => {
          el.classList.remove('active', 'before');
          if (index === digit) {
            el.classList.add('active');
          } else if (index === (digit + 1) % 10) {
            el.classList.add('before');
          }
        });

        if (digitsWrap.querySelector('.before')) {
          digitsWrap.classList.add('play');
        } else {
          digitsWrap.classList.remove('play');
        }
      }
    });
  }

  /**
   * Create canvas elements dynamically for Theme 9 if they don't exist
   */
  static createCanvasesIfNeeded(element) {
    const circles = element.querySelectorAll('.ce-circle');
    circles.forEach((circle) => {
      // If a canvas doesn't already exist in this circle, create one.
      if (!circle.querySelector('canvas')) {
        const canvas = document.createElement('canvas');
        canvas.width = 408; // Default size, can be styled with CSS
        canvas.height = 408;
        // Insert canvas as the first child of the circle container
        circle.insertBefore(canvas, circle.firstChild);
      }
    });
  }

  /**
   * Parse configuration from data attributes
   */
  static parseDataAttributes(element) {
    const options = {};

    // Parse datetime string (required for auto-initialization)
    const datetimeValue = element.dataset.ceDatetime;
    if (datetimeValue) {
      const parsedDateTime = CountEverest.parseDatetimeString(datetimeValue);
      Object.assign(options, parsedDateTime);
    }

    // Parse boolean attributes
    const boolAttrs = ['countUp', 'singularLabels', 'leftHandZeros'];
    boolAttrs.forEach((attr) => {
      const value = element.dataset[`ce${attr.charAt(0).toUpperCase() + attr.slice(1)}`];
      if (value !== undefined) {
        options[attr] = value === 'true' || value === '';
      }
    });

    // Parse string attributes
    const stringAttrs = [
      'yearsLabel',
      'yearLabel',
      'monthsLabel',
      'monthLabel',
      'daysLabel',
      'dayLabel',
      'hoursLabel',
      'hourLabel',
      'minutesLabel',
      'minuteLabel',
      'secondsLabel',
      'secondLabel',
      'accentColor',
    ];
    stringAttrs.forEach((attr) => {
      const value = element.dataset[`ce${attr.charAt(0).toUpperCase() + attr.slice(1)}`];
      if (value !== undefined) {
        options[attr] = value;
      }
    });

    // Parse units array
    const unitsValue = element.dataset.ceUnits;
    if (unitsValue) {
      options.units = unitsValue.split(',').map((u) => u.trim());
    }

    return options;
  }

  /**
   * Parse a datetime string into individual date/time components
   * Supports formats like:
   * - "2027" (year only)
   * - "2027-12" (year-month)
   * - "2027-12-31" (year-month-day)
   * - "2027-12-31 14:30" (year-month-day hour:minute)
   * - "2027-12-31 14:30:45" (year-month-day hour:minute:second)
   */
  static parseDatetimeString(datetimeStr) {
    const options = {};

    // Split date and time parts
    const [datePart, timePart] = datetimeStr.trim().split(' ');

    // Parse date part (required)
    if (datePart) {
      const dateParts = datePart.split('-');

      // Year is required
      if (dateParts[0]) {
        options.year = parseInt(dateParts[0], 10);
      }

      // Month is optional (defaults to 1)
      if (dateParts[1]) {
        options.month = parseInt(dateParts[1], 10);
      }

      // Day is optional (defaults to 1)
      if (dateParts[2]) {
        options.day = parseInt(dateParts[2], 10);
      }
    }

    // Parse time part (optional)
    if (timePart) {
      const timeParts = timePart.split(':');

      // Hour is optional (defaults to 0)
      if (timeParts[0]) {
        options.hour = parseInt(timeParts[0], 10);
      }

      // Minute is optional (defaults to 0)
      if (timeParts[1]) {
        options.minute = parseInt(timeParts[1], 10);
      }

      // Second is optional (defaults to 0)
      if (timeParts[2]) {
        options.second = parseInt(timeParts[2], 10);
      }
    }

    return options;
  }

  /**
   * Auto-initialize all countdown elements when DOM is ready
   */
  static initOnDOMReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => CountEverest.autoInit());
    } else {
      CountEverest.autoInit();
    }
  }

  createDOM() {
    // If the element is not empty, respect the user's HTML.
    if (this.#element.innerHTML.trim() !== '') {
      return;
    }

    const htmlParts = [];
    const units = this.#settings.units;

    if (this.#element.classList.contains('ce-countdown--theme-1')) {
      units.forEach((unit) => {
        htmlParts.push(
          `<div class="ce-col"><span class="ce-${unit}"></span> <span class="ce-${unit}-label"></span></div>`
        );
      });
    } else if (this.#element.classList.contains('ce-countdown--theme-6')) {
      units.forEach((unit) => {
        htmlParts.push(`<div class="ce-col">
          <div class="ce-${unit}">
            <div class="ce-flip-wrap"><div class="ce-flip-front"></div><div class="ce-flip-back"></div></div>
          </div>
          <span class="ce-${unit}-label"></span>
        </div>`);
      });
    } else if (this.#element.classList.contains('ce-countdown--theme-9')) {
      units.forEach((unit) => {
        htmlParts.push(`<div class="ce-circle">
          <div class="ce-circle__values">
            <span class="ce-digit ce-${unit}"></span><span class="ce-label ce-${unit}-label"></span>
          </div>
        </div>`);
      });
    } else if (this.#element.classList.contains('ce-countdown--theme-10')) {
      units.forEach((unit) => {
        htmlParts.push(`<div class="ce-unit-wrap">
          <div class="${unit}"></div><span class="ce-${unit}-label"></span>
        </div>`);
      });
    } else if (this.#element.classList.contains('ce-countdown--theme-12')) {
      units.forEach((unit) => {
        htmlParts.push(`<div class="ce-col">
          <div class="ce-digits ce-${unit}"></div>
          <span class="ce-${unit}-label"></span>
        </div>`);
      });
    } else {
      // Default structure
      units.forEach((unit) => {
        htmlParts.push(`<span class="ce-${unit}"></span> <span class="ce-${unit}-label"></span> `);
      });
    }

    this.#element.innerHTML = htmlParts.join('').trim();
  }
}

// Auto-initialize when DOM is ready
CountEverest.initOnDOMReady();

window.CountEverest = CountEverest;
