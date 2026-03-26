import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Details from "./pages/Details";

// ------------------------------------------------------------
// Robust height calculation for Smart Embed
// ------------------------------------------------------------
function getTrueHeight() {
  const root = document.getElementById("root");
  return root ? root.scrollHeight : document.documentElement.scrollHeight;
}

function App() {
  // ------------------------------------------------------------
  // Smart Embed child-side auto-height with embedId isolation
  // ------------------------------------------------------------
  useEffect(() => {
    let heightTimeout;

    function sendHeight() {
      clearTimeout(heightTimeout);
      heightTimeout = setTimeout(() => {
        const height = getTrueHeight();   // MUST be first

        console.log("Child sending height:", height, "embedId:", window.name);

        window.parent.postMessage(
          {
            hudxAppHeight: height,
            hudxEmbedId: window.name, // unique instance ID
          },
          "*"
        );
      }, 50);
    }

    // Initial height
    sendHeight();

    // Watch for DOM changes
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Watch for window resizes
    window.addEventListener("resize", sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sendHeight);
    };
  }, []);

  // ------------------------------------------------------------
  // App Layout + Router
  // ------------------------------------------------------------
  return (
    <Router>
      <nav
        style={{
          display: "flex",
          gap: "1rem",
          padding: "1rem",
          background: "#eee",
          borderBottom: "1px solid #ccc",
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/details">Details</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/details" element={<Details />} />
      </Routes>
    </Router>
  );
}

export default App;
