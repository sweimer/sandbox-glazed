
import { useState } from 'react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import Home from './pages/Home.jsx';
import StyleGuide from './pages/StyleGuide.jsx';
import ApiReference from './pages/ApiReference.jsx';

const API_BASE = 'http://localhost:4000';

function TestPanel() {
  const [inputValue, setInputValue] = useState('');
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('');

  async function fetchAll() {
    try {
      const res = await fetch(`${API_BASE}/api/test/all`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setStatus('❌ Could not fetch entries: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    if (!inputValue.trim()) {
      setStatus('⚠️ Please enter some text.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/test/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_value: inputValue.trim() })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      setInputValue('');
      setStatus('✅ Entry added!');
      await fetchAll();
    } catch (err) {
      setStatus('❌ Error: ' + err.message);
    }
  }

  return <MemoryRouter>
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h2>API Test Panel</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <label htmlFor="test-input" className="visually-hidden">Enter text</label>
        <input
          id="test-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter text..."
          style={{ flex: 1, padding: '0.5rem' }} />
        
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Submit
        </button>
        <button type="button" onClick={fetchAll} style={{ padding: '0.5rem 1rem' }}>
          Refresh
        </button>
      </form>

      <p aria-live="polite">{status}</p>

      <h3>Entries</h3>
      {entries.length === 0 ?
      <p style={{ color: '#999' }}>No entries yet. Submit one above or click Refresh.</p> :

      <ul>
          {entries.map((entry) =>
        <li key={entry.id}>
              <strong>#{entry.id}</strong> — {entry.text_value}{' '}
              <small style={{ color: '#999' }}>
                ({new Date(entry.created_at).toLocaleString()})
              </small>
            </li>
        )}
        </ul>
      }
    </div></MemoryRouter>;

}

export default function App() {
  return <MemoryRouter>
    


      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/styleguide" element={<StyleGuide />} />
        <Route path="/api" element={<ApiReference />} />
        <Route path="/test" element={<TestPanel />} />
      </Routes>
    </MemoryRouter>;

}