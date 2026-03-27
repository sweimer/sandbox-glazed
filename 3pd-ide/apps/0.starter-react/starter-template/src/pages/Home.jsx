import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function Home() {
  const [value, setValue]   = useState('');
  const [entries, setEntries] = useState([]);
  const [error, setError]   = useState('');

  async function loadEntries() {
    try {
      const res = await fetch(`${API_BASE}/api/test/all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEntries(await res.json());
    } catch (err) {
      setError(`Could not load entries: ${err.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/test/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_value: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setValue('');
      loadEntries();
    } catch (err) {
      setError(`Submit failed: ${err.message}`);
    }
  }

  useEffect(() => { loadEntries(); }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <h1>Welcome to your HUDX React App</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Enter something"
          required
          style={{ padding: '0.4rem', marginRight: '0.5rem' }}
        />
        <button type="submit">Save</button>
      </form>

      {error && <p style={{ color: '#c00' }}>{error}</p>}

      <h2>Saved Entries</h2>
      <ul>
        {entries.map(entry => (
          <li key={entry.id}>{entry.text_value} <small style={{ color: '#999' }}>{entry.created_at}</small></li>
        ))}
      </ul>
    </div>
  );
}
