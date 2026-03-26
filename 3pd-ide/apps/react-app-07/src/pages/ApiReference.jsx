import { useState } from 'react';

export default function ApiReference() {
  const [endpoint, setEndpoint] = useState('/node/article');
  const [response, setResponse] = useState(null);

  const apiBase = import.meta.env.VITE_DRUPAL_API;

  const testRequest = async () => {
    const res = await fetch(`${apiBase}${endpoint}`);
    const json = await res.json();
    setResponse(json);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>HUDX API Reference (POC)</h1>

      <p>Base URL: <code>{apiBase}</code></p>

      <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
        <option value="/node/article">Articles</option>
        <option value="/node/page">Pages</option>
        <option value="/taxonomy_term/tags">Tags</option>
      </select>

      <button onClick={testRequest} style={{ marginLeft: '1rem' }}>
        Test Request
      </button>

      <pre style={{ background: '#eee', padding: '1rem', marginTop: '1rem' }}>
        {response ? JSON.stringify(response, null, 2) : 'No response yet'}
      </pre>
    </div>
  );
}
