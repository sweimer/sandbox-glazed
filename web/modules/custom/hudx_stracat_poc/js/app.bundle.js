(function waitForReactAndDOM() {
  // React must be loaded globally
  if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
    return setTimeout(waitForReactAndDOM, 50);
  }

  // DOM must be ready AND the mount point must exist
  if (document.readyState === "loading") {
    return document.addEventListener("DOMContentLoaded", waitForReactAndDOM);
  }

  const mount = document.getElementById("stracat-poc-root");
  if (!mount) {
    return setTimeout(waitForReactAndDOM, 50);
  }

  // Now safe to run the app
  const { useState } = React;
  const { createRoot } = ReactDOM;

  function StracatPOC() {
    const [value1, setValue1] = useState("");
    const [value2, setValue2] = useState("");

    const sum = (Number(value1) || 0) + (Number(value2) || 0);

    const handlePrint = () => window.print();

    return React.createElement(
      "div",
      { className: "stracat-poc" },
      React.createElement("h2", null, "Section 1"),
      React.createElement("input", {
        type: "number",
        value: value1,
        onChange: (e) => setValue1(e.target.value),
      }),

      React.createElement("h2", null, "Section 2"),
      React.createElement("input", {
        type: "number",
        value: value2,
        onChange: (e) => setValue2(e.target.value),
      }),

      React.createElement("h2", null, "Section 3"),
      React.createElement(
        "table",
        { className: "results-table" },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("th", null, "Field 1"),
            React.createElement("th", null, "Field 2"),
            React.createElement("th", null, "Sum")
          )
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("td", null, value1),
            React.createElement("td", null, value2),
            React.createElement("td", null, sum)
          )
        )
      ),

      React.createElement(
        "button",
        { onClick: handlePrint },
        "Print Results"
      )
    );
  }

  const root = createRoot(mount);
  root.render(React.createElement(StracatPOC));
})();
