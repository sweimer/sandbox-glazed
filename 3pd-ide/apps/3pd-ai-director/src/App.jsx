import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Requests from './pages/Requests.jsx';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname;

  const tab = (label, path) =>
  <button
    type="button"
    onClick={() => navigate(path)}
    style={{
      ...s.tab,
      ...(active === path ? s.tabActive : {})
    }}>
    
      {label}
    </button>;


  return (
    <nav style={s.nav}>
      {tab('Director', '/')}
      {tab('Requests', '/requests')}
    </nav>);


}

export default function App() {
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/requests" element={<Requests />} />
      </Routes>
    </MemoryRouter>);

}

const s = {
  nav: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.75rem 1.5rem 0',
    borderBottom: '2px solid #e5e7eb',
    background: '#fff'
  },
  tab: {
    padding: '0.45rem 1.1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    background: 'transparent',
    color: '#6b7280',
    marginBottom: '-2px',
    borderBottom: '2px solid transparent'
  },
  tabActive: {
    color: '#2563eb',
    borderBottom: '2px solid #2563eb',
    background: 'transparent'
  }
};