/**
 * HUDX Smart Embed — Resize Snippet
 * ============================================================
 * Drop this script into any child app to enable auto-resizing
 * when the app is embedded inside a Drupal Smart Embed block.
 *
 * Usage (static HTML):
 *   <script src="hudx-resize.js"></script>
 *
 * Usage (React/Astro — call after route changes or interactions):
 *   import './hudx-resize.js';
 *   // then manually: window.hudxSendHeight();
 *
 * Manual call (e.g., after an accordion opens or quiz submits):
 *   window.hudxSendHeight();
 *
 * No dependencies. Works in any framework or plain HTML.
 * Does nothing when the page is not inside an iframe.
 *
 * Adobe Muse note:
 *   Muse pages use a .verticalspacer element with height: calc(-Xpx + 100vh)
 *   and min-height set via JS to pin the footer to the viewport bottom.
 *   Inside an iframe, 100vh equals the iframe height, creating an infinite
 *   resize loop. This snippet forces the spacer to zero via JS setProperty
 *   (overrides Muse's inline style) and re-applies after every resize event.
 * ============================================================
 */
(function () {
  'use strict';

  // Skip entirely if not inside an iframe
  if (window.self === window.top) return;

  // --------------------------------------------------------
  // Muse fix: force .verticalspacer to zero height via JS.
  // Muse sets height/min-height as inline styles via JS, so
  // a CSS !important rule doesn't reliably win. Using
  // element.style.setProperty(..., 'important') always wins.
  // Called on load and on every resize to re-apply after
  // Muse's own resize handler runs.
  // --------------------------------------------------------
  function collapseMuseSpacer() {
    var spacers = document.querySelectorAll('.verticalspacer');
    spacers.forEach(function (el) {
      el.style.setProperty('height',     '0', 'important');
      el.style.setProperty('min-height', '0', 'important');
      el.style.setProperty('max-height', '0', 'important');
      el.style.setProperty('overflow',   'hidden', 'important');
    });
  }

  function sendHeight() {
    collapseMuseSpacer();
    // Use body.scrollHeight only — NOT Math.max(body, doc).
    // Muse sets an explicit fixed height on the <html> element that never
    // updates across page navigations, so documentElement.scrollHeight is
    // always pinned to the tallest page ever loaded in this iframe session.
    // body.scrollHeight correctly reflects each page's actual content height.
    var height = document.body ? document.body.scrollHeight : 0;

    if (height > 0) {
      window.parent.postMessage({ type: 'hudx-resize', height: height }, '*');
    }
  }

  // Single shared debounce timer used by all event sources.
  //
  // Why debounce resize:
  //   When the parent sets the iframe height in response to our postMessage,
  //   it fires a resize event inside the iframe. Muse's own resize handler
  //   also fires and re-sets the verticalspacer. The order is non-deterministic,
  //   so measuring immediately can capture an inflated scrollHeight. Debouncing
  //   ensures we measure only after the cascade has fully settled.
  //
  // Why debounce hashchange / popstate:
  //   Muse page transitions animate old and new pages simultaneously.
  //   Measuring mid-animation inflates scrollHeight by ~one page height.
  //
  // 600ms covers Muse slide transitions and the postMessage → resize cascade.
  var debounceTimer = null;
  function debouncedSendHeight() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sendHeight, 600);
  }

  // Fire on initial load (no debounce — no animation on first load)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendHeight);
  } else {
    sendHeight();
  }

  // All subsequent events debounced through shared timer
  window.addEventListener('resize',     debouncedSendHeight);
  window.addEventListener('hashchange', debouncedSendHeight);
  window.addEventListener('popstate',   debouncedSendHeight);

  // Watch for body size changes (accordion opens, dynamic content, etc.)
  // ResizeObserver fires when the body's rendered size changes, catching
  // interactions that don't trigger window events.
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(debouncedSendHeight);
    ro.observe(document.body);
  }

  // Expose for manual calls from any framework
  window.hudxSendHeight = sendHeight;
})();
