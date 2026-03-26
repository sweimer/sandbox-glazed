import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function mountHudxReactApp(context = document) {
  const el = context.getElementById
    ? context.getElementById("hudx-react-app-02-root")
    : document.getElementById("hudx-react-app-02-root");

  if (!el) return;

  if (!el.__hudxReactRoot) {
    el.__hudxReactRoot = ReactDOM.createRoot(el);
  }

  el.__hudxReactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function waitForMount() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountHudxReactApp());
  } else {
    mountHudxReactApp();
  }
}

waitForMount();

if (typeof window !== "undefined" && window.Drupal && window.Drupal.behaviors) {
  (function (Drupal) {
    Drupal.behaviors.HudxReactApp02Behavior = {
      attach(context) {
        mountHudxReactApp(context);
      },
    };
  })(window.Drupal);
}
