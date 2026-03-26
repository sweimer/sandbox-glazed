import { useState, useEffect } from 'react';

export default function Home() {
  const [value, setValue] = useState('');
  const [entries, setEntries] = useState([]);

  async function loadEntries() {
    const res = await fetch('http://localhost:4000/api/test/all');
    const data = await res.json();
    setEntries(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch('http://localhost:4000/api/test/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text_value: value }),
    });

    setValue('');
    loadEntries();
  }

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div>
      <h1>Welcome to your Fuse App</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Enter something"
        />
        <button type="submit">Save</button>
      </form>

      <h2>Saved Entries</h2>
      <ul>
        {entries.map(entry => (
          <li key={entry.id}>{entry.text_value}</li>
        ))}
      </ul>
    </div>
  );
}
