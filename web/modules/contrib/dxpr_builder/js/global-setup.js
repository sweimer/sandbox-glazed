/* jslint white:true, multivar, this, browser:true */

/**
 * @file Handles global setup and initial configuration for DXPR Builder Drupal integration,
 * and loads GSAP + MorphSVGPlugin for custom animations.
 */

(function ($, Drupal, drupalSettings, window) {
  "use strict";

  // ---------------------------------------------------------------------------
  // DXPR Builder bootstrap dependency check (original DXPR code)
  // ---------------------------------------------------------------------------
  window.onload = function () {
    let bootstrapVersion = false;

    const bs3bs4 = window.jQuery?.fn?.popover?.Constructor?.VERSION;
    const bs5 = window.bootstrap?.Popover?.VERSION;

    if (bs3bs4) {
      bootstrapVersion = bs3bs4.charAt(0);
    } else if (bs5) {
      bootstrapVersion = bs5.charAt(0);
    }

    if (!bootstrapVersion) {
      const messages = new Drupal.Message();
      const message = Drupal.t(
        "The DXPR Builder depends on Bootstrap framework to work. " +
        "Please enable Bootstrap in " +
        "the <a href='@dxpr_builder_settings'>DXPR Builder settings form</a>.",
        {
          "@dxpr_builder_settings": Drupal.url(
            "admin/dxpr_studio/dxpr_builder/settings"
          ),
        }
      );
      messages.add(message, { type: "error" });
    }
  };

  // ---------------------------------------------------------------------------
  // DXPR Builder global element definitions (original DXPR code)
  // ---------------------------------------------------------------------------
  window.dxprBuilder = window.dxprBuilder || {};
  window.dxprBuilder.dxpr_editable = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "img:not(.not-editable)",
    "a:not(.not-editable)",
    "i:not(.not-editable)",
  ];
  window.dxprBuilder.dxpr_styleable = [];
  window.dxprBuilder.dxpr_textareas = [];
  window.dxprBuilder.dxpr_formats = [];

  // ---------------------------------------------------------------------------
  // GSAP + MorphSVGPlugin loader and SVG morph animation (your custom code)
  // ---------------------------------------------------------------------------

  // Load external scripts in order
  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  // Run animation only after DOM is ready
  document.addEventListener("dxprBuilderRendered", function () {
    // GSAP and MorphSVGPlugin are already loaded by the theme.
    if (typeof gsap === "undefined" || typeof MorphSVGPlugin === "undefined") {
      console.warn("GSAP or MorphSVGPlugin not available.");
      return;
    }

    gsap.registerPlugin(MorphSVGPlugin);

    const shape1 = document.querySelector("#alex-morph-svg #shape-1");
    const shape2 = document.querySelector("#alex-morph-svg #shape-2");
    const wrapper = document.querySelector(".alex-morph-demo");

    if (!shape1 || !shape2 || !wrapper) {
      return;
    }

    const tl = gsap.timeline({
      paused: true,
      defaults: { duration: 1.2, ease: "power2.inOut" }
    });

    tl.to(shape1, {
      morphSVG: shape2,
      fill: "#6C2DC7"
    });

    wrapper.addEventListener("mouseenter", () => tl.play());
    wrapper.addEventListener("mouseleave", () => tl.reverse());
  });

})(jQuery, Drupal, drupalSettings, window);
