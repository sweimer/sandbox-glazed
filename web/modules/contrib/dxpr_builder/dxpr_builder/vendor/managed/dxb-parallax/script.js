/**
 * Parallax (vanilla JS port of Ian Lunn's jQuery Parallax v1.1.3)
 * Author (port): DXPR
 * Licence: MIT (same as original) - see original header for GPL alternative
 *
 * Usage ------------------------------------------------------------------
 * import { Parallax, parallax } from './parallax.js';
 *
 * // one element
 * new Parallax(document.querySelector('.hero'), { speedFactor: 0.2 });
 *
 * // many elements in one go (helper):
 * parallax('.parallax', { xpos: '50%', outerHeight: true });
 */

class Parallax {
  static #instances = new Set();
  static #windowHeight = window.innerHeight;
  static #ticking = false;
  static #initDone = false;

  /** @param {Element} el  */
  constructor(
    el,
    {
      xpos = '50%', // same defaults as original
      speedFactor = 0.1,
      outerHeight = true,
    } = {}
  ) {
    if (!(el instanceof Element)) {
      throw new TypeError('Parallax expects a DOM Element');
    }

    this.el = el;
    this.xpos = xpos;
    this.speedFactor = speedFactor;
    this.getHeight = outerHeight
      ? (elem) => elem.offsetHeight // includes margin
      : (elem) => elem.clientHeight;

    // Top of element relative to the document at instantiation
    const { top } = this.el.getBoundingClientRect();
    this.firstTop = top + window.scrollY;

    Parallax.#instances.add(this);
    Parallax.#ensureInit();
    // First paint
    this.#update();
  }

  // ----------------------------------------------------------------------
  // Static helpers
  // ----------------------------------------------------------------------
  static #ensureInit() {
    if (Parallax.#initDone) return;
    Parallax.#initDone = true;

    // Keep viewport height in sync
    window.addEventListener(
      'resize',
      () => {
        Parallax.#windowHeight = window.innerHeight;
        Parallax.#requestTick();
      },
      { passive: true }
    );

    // Scroll handler (throttled via rAF)
    window.addEventListener('scroll', Parallax.#requestTick, { passive: true });
  }

  static #requestTick() {
    if (!Parallax.#ticking) {
      Parallax.#ticking = true;
      requestAnimationFrame(Parallax.#updateAll);
    }
  }

  static #updateAll() {
    Parallax.#instances.forEach((instance) => instance.#update());
    Parallax.#ticking = false;
  }

  // ----------------------------------------------------------------------
  // Instance logic
  // ----------------------------------------------------------------------
  #update() {
    const scrollPos = window.scrollY;
    const elemTop = this.el.getBoundingClientRect().top + window.scrollY;
    const elemHeight = this.getHeight(this.el);

    // Skip if completely above or below viewport
    if (
      elemTop + elemHeight < scrollPos ||
      elemTop > scrollPos + Parallax.#windowHeight
    ) {
      return;
    }

    const yOffset = Math.round((this.firstTop - scrollPos) * this.speedFactor);
    this.el.style.backgroundPosition = `${this.xpos} ${yOffset}px`;
  }

  // Optional: expose destroy for cleanup
  destroy() {
    Parallax.#instances.delete(this);
    if (!Parallax.#instances.size) {
      window.removeEventListener('scroll', Parallax.#requestTick);
      window.removeEventListener('resize', Parallax.#requestTick);
      Parallax.#initDone = false;
    }
  }
}

/**
 * Helper function mirroring the original jQuery-chainable API.
 * Accepts: DOM Element | NodeList | HTMLCollection | selector string
 * Returns:  Array of Parallax instances (same order as input)
 */

// eslint-disable-next-line no-unused-vars
function parallax(targets, options) {
  const elements =
    typeof targets === 'string'
      ? document.querySelectorAll(targets)
      : targets instanceof Element
        ? [targets]
        : Array.from(targets);

  return elements.map((el) => new Parallax(el, options));
}
