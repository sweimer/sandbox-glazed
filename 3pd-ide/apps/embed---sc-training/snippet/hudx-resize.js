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
 * ============================================================
 */
(function () {
  'use strict';

  function sendHeight() {
    // Skip if not inside an iframe
    if (window.self === window.top) return;

    var height = Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.documentElement ? document.documentElement.scrollHeight : 0
    );

    if (height > 0) {
      window.parent.postMessage({ type: 'hudx-resize', height: height }, '*');
    }
  }

  // Fire on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendHeight);
  } else {
    sendHeight();
  }

  // Fire on window resize (responsive layouts)
  window.addEventListener('resize', sendHeight);

  // Fire on SPA hash navigation
  window.addEventListener('hashchange', sendHeight);

  // Fire on SPA pushState navigation
  window.addEventListener('popstate', sendHeight);

  // Expose for manual calls from any framework
  window.hudxSendHeight = sendHeight;
})();
