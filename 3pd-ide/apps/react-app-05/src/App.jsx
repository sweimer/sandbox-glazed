
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import StyleGuide from './pages/StyleGuide.jsx';
import ApiReference from './pages/ApiReference.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '1rem', background: '#eee' }}>
        <Link to="/">Home</Link> | <Link to="/styleguide">Style Guide</Link> | <Link to="/api">API Reference</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/styleguide" element={<StyleGuide />} />
        <Route path="/api" element={<ApiReference />} />
      </Routes>
    </BrowserRouter>
  );
}
