// HUDX Smart Embed v1.2
// Parent-side API for embedding HUDX custom apps into Drupal

(function () {
  if (window.HUDXSmartEmbed) return; // Prevent double-loading

  function createIframe(options) {
    const iframe = document.createElement("iframe");
    iframe.src = options.src;
    iframe.title = options.title || "HUDX Embedded Application";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.height = options.height || "1200px";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    return iframe;
  }

  function mount(selector, options) {
    const container = document.querySelector(selector);
    if (!container) return;

    const iframe = createIframe(options);
    const embedId = options.id || selector;

    iframe.dataset.hudxEmbedId = embedId;
    iframe.name = embedId;   // ⭐ CRITICAL LINE

    container.innerHTML = "";
    container.appendChild(iframe);

    window.addEventListener("message", (event) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.hudxEmbedId !== embedId) return;

      if (event.data.hudxAppHeight) {
        iframe.style.height = event.data.hudxAppHeight + "px";
      }
    });
  }

  window.HUDXSmartEmbed = { mount };
})();
