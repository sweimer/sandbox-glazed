import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const APP_SLUG = import.meta.env.VITE_APP_SLUG     || '';

export default function Home() {
  const [message, setMessage]     = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [error, setError]         = useState('');

  async function loadSubmissions() {
    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmissions(await res.json());
    } catch (err) {
      setError(`Could not load submissions: ${err.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage('');
      loadSubmissions();
    } catch (err) {
      setError(`Submit failed: ${err.message}`);
    }
  }

  useEffect(() => { loadSubmissions(); }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '640px' }}>
      <h1>Welcome to your HUDX React App</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Enter a message"
          required
          style={{ padding: '0.4rem', marginRight: '0.5rem' }}
        />
        <button type="submit">Save</button>
      </form>

      {error && <p style={{ color: '#c00' }}>{error}</p>}

      <h2>Submissions</h2>
      <ul>
        {submissions.map(s => (
          <li key={s.id}>
            {s.message} <small style={{ color: '#999' }}>{s.created_at}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
