import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home         from './pages/Home.jsx';
import StyleGuide   from './pages/StyleGuide.jsx';
import ApiReference from './pages/ApiReference.jsx';

// DEV-ONLY nav — rendered only during `npm run dev`, stripped from Drupal module builds.
// Links to starter kit reference pages (Style Guide, API Reference).
// Replace or remove this nav when building your actual app.
function DevNav() {
  if (!import.meta.env.DEV) return null;
  return (
    <nav
      className="navbar navbar-expand navbar-light bg-warning-subtle border-bottom px-3 py-2"
      aria-label="Developer navigation"
    >
      <span className="badge bg-warning text-dark me-3 small">DEV</span>
      <div className="navbar-nav gap-3 small">
        <Link className="nav-link py-0" to="/">Home</Link>
        <Link className="nav-link py-0" to="/styleguide">Style Guide</Link>
        <Link className="nav-link py-0" to="/api">API Reference</Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DevNav />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/styleguide" element={<StyleGuide />} />
        <Route path="/api"        element={<ApiReference />} />
      </Routes>
    </BrowserRouter>
  );
}
