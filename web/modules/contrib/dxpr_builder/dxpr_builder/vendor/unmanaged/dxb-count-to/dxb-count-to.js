/**
 * DXB CountTo - A vanilla JavaScript counter plugin
 * Replacement for jquery.countTo with IntersectionObserver integration
 */
(function(global) {
  'use strict';

  class DXBCountTo {
    static DEFAULTS = {
      from: 0,               // the number the element should start at
      to: 100,                 // the number the element should end at
      speed: 2000,           // how long it should take to count between the target numbers
      refreshInterval: 16,  // how often the element should be updated
      decimals: 0,           // the number of decimal places to show
      formatter: null,       // handler for formatting the value before rendering
      seperator: '',         // thousands separator
      onUpdate: null,        // callback method for every time the element is updated
      onComplete: null,      // callback method for when the element finishes updating
      prefix: '',            // prefix to add before the number
      postfix: ''            // suffix to add after the number
    };

    constructor(element, options = {}) {
      if (!(element instanceof HTMLElement)) {
        throw new Error('DXBCountTo requires an HTMLElement for the counter display');
      }

      this.wrapperElement = element; // This is the outer .az-counter element with data-azat-* attributes
      
      // First try to find the new structure with az-counter-inner
      this.element = element.querySelector('.az-counter-inner');
      
      // If not found, look for legacy structure with gb* id
      if (!this.element) {
        this.element = element.querySelector('div[id^="gb"]');
      }
      
      if (!this.element) {
        throw new Error('DXBCountTo requires either an inner element with class az-counter-inner or a div with a gb* id for the counter display');
      }

      // Ensure the inner element has the required attributes
      this.element.setAttribute('data-dxpr-builder-libraries', 'countto');
      
      if (this.wrapperElement.hasAttribute('data-dxb-countto-initialized')) {
        return; // Skip if already initialized
      }
      this.wrapperElement.setAttribute('data-dxb-countto-initialized', 'true');
      
      this.options = { ...DXBCountTo.DEFAULTS, ...this._dataOptions(), ...options };
      this.observer = null;
      this.interval = null;
      this.isRunning = false;

      if (!this.options.formatter) {
        this.options.formatter = this._defaultFormatter.bind(this);
      }

      this._init();
      this._setupObserver();
    }

    _init() {
      this.value = this.options.from;
      this.loops = Math.ceil(this.options.speed / this.options.refreshInterval);
      this.loopCount = 0;
      this.increment = (this.options.to - this.options.from) / this.loops;
    }

    _dataOptions() {
      const options = {
        from: this._getDataAttribute('start', 'number'),
        to: this._getDataAttribute('end', 'number'),
        speed: this._getDataAttribute('speed', 'number'),
        refreshInterval: this._getDataAttribute('refreshInterval', 'number'),
        decimals: this._getDataAttribute('decimals', 'number'),
        seperator: this._getDataAttribute('seperator', 'string'),
        prefix: this._getDataAttribute('prefix', 'string'),
        postfix: this._getDataAttribute('postfix', 'string')
      };

      // Remove undefined options
      Object.keys(options).forEach(key => {
        if (options[key] === undefined) {
          delete options[key];
        }
      });

      return options;
    }

    _getDataAttribute(name, type) {
      // Get the azat-prefixed attribute from the wrapper element
      const attrName = `azat${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      const value = this.wrapperElement.dataset[attrName];
      if (value === undefined) return undefined;
      
      if (type === 'number') {
        return parseFloat(value);
      }
      return value;
    }

    _defaultFormatter(value) {
      let formattedValue = value.toFixed(this.options.decimals);
      
      if (this.options.seperator) {
        formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, this.options.seperator);
      }
      
      return this.options.prefix + formattedValue + this.options.postfix;
    }

    _update() {
      this.value += this.increment;
      this.loopCount++;

      this._render();

      if (typeof this.options.onUpdate === 'function') {
        this.options.onUpdate.call(this.element, this.value);
      }

      if (this.loopCount >= this.loops) {
        clearInterval(this.interval);
        this.isRunning = false;
        this.value = this.options.to;

        this._render();

        if (typeof this.options.onComplete === 'function') {
          this.options.onComplete.call(this.element, this.value);
        }
      }
    }

    _render() {
      const formattedValue = this.options.formatter.call(this, this.value, this.options);
      this.element.textContent = formattedValue;
    }

    _setupObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isRunning) {
            this.start();
          }
        });
      }, {
        root: null,
        threshold: 0.1  // Start when just 10% of the element is visible for better responsiveness
      });
      
      this.observer.observe(this.element);
      
      // Force a check immediately after setup for elements already in view
      if (this._isElementInViewport(this.element) && !this.isRunning) {
        this.start();
      }
    }
    
    _isElementInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
      );
    }

    restart() {
      this.stop();
      this._init();
      this.start();
    }

    start() {
      if (this.isRunning) return;
      
      this.stop();
      this._render();
      this.isRunning = true;
      this.interval = setInterval(() => this._update(), this.options.refreshInterval);
    }

    stop() {
      if (this.interval) {
        clearInterval(this.interval);
        this.isRunning = false;
      }
    }

    toggle() {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
    }

    // Clean up resources
    destroy() {
      this.stop();
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      // Remove initialized attribute from the wrapper
      if (this.wrapperElement) {
        this.wrapperElement.removeAttribute('data-dxb-countto-initialized');
      }
    }

    // Static method to initialize all counters on the page
    static initAll() {
      const counters = [];
      const wrapperElements = document.querySelectorAll('.dxb-countto:not([data-dxb-countto-initialized]), .az-counter:not([data-dxb-countto-initialized])');
      
      wrapperElements.forEach(wrapper => {
        // We now pass the wrapper directly since the constructor expects it
        counters.push(new DXBCountTo(wrapper));
      });
      
      return counters;
    }
    
    // Efficient method to check if an element is or contains a counter element
    static hasCounterElement(element) {
      // Only process div elements
      if (element.tagName !== 'DIV') return false;
      
      // Check if the element is a wrapper for a counter
      return element.classList.contains('dxb-countto') || 
             element.classList.contains('az-counter');
    }
  }

  // Create a factory function to maintain similar API
  function createDXBCountTo(elements, options) {
    if (typeof elements === 'string') {
      elements = document.querySelectorAll(elements);
    } else if (elements instanceof HTMLElement) {
      elements = [elements];
    } else if (!Array.isArray(elements) && !(elements instanceof NodeList)) {
      throw new Error('Invalid element selection');
    }

    return Array.from(elements).map(element => new DXBCountTo(element, options));
  }

  // Export to global namespace
  global.DXBCountTo = DXBCountTo;
  global.createDXBCountTo = createDXBCountTo;

  // Add to dxprBuilder namespace if it exists
  if (global.dxprBuilder) {
    global.dxprBuilder.DXBCountTo = DXBCountTo;
    global.dxprBuilder.createDXBCountTo = createDXBCountTo;
  }

  // Set up an optimized MutationObserver that only processes DIV elements
  function setupMutationObserver() {
    if (!window.MutationObserver) return;
    
    // Throttle function to prevent too frequent refreshes
    let throttleTimer = null;
    const throttle = (callback, time) => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        callback();
        throttleTimer = null;
      }, time);
    };
    
    const observer = new MutationObserver((mutations) => {
      let shouldInit = false;
      
      // Quick check for any relevant mutations to avoid unnecessary processing
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        
        // Only process childList mutations with added nodes
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            
            // Only process element nodes that are divs
            if (node.nodeType === 1 && node.tagName === 'DIV') {
              // Check if the added node is a wrapper for a counter
              if (DXBCountTo.hasCounterElement(node)) {
                shouldInit = true;
                break;
              }
            }
          }
          
          if (shouldInit) break;
        }
      }
      
      if (shouldInit) {
        // Throttle the initialization to improve performance
        throttle(() => {
          DXBCountTo.initAll();
        }, 500);
      }
    });
    
    // Observe only additions of child elements in the body, not attribute changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    // Store observer in window for potential cleanup
    window.dxbCountToObserver = observer;
  }

  // Auto-initialize counters when the script is loaded
  const autoInitialize = () => {
    // Wait for the DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        DXBCountTo.initAll();
        setupMutationObserver();
      });
    } else {
      DXBCountTo.initAll();
      setupMutationObserver();
    }
  };

  // Auto-initialize but allow manual initialization
  autoInitialize();

})(typeof window !== 'undefined' ? window : this); 