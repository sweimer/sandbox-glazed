import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const APP_SLUG = import.meta.env.VITE_APP_SLUG     || '';

const ROUTE_LABELS = {
  'no-code':          'No-Code Builder',
  'low-code':         'AI Markup Builder',
  'pro-react':        'React Starter Kit',
  'pro-angular':      'Angular Starter Kit',
  'pro-astro-static': 'Astro Static Starter Kit',
  'pro-astro':        'Astro Forms Starter Kit',
  'embed-request':    'Embed / Link Request',
};

const STATUS_OPTIONS = ['Needs Review', 'Needs Review 2', 'Needs Review 3', 'Declined', 'Approved'];

function PromptCell({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return <span style={{ color: '#9ca3af' }}>—</span>;
  const preview = text.length > 80 ? text.slice(0, 80) + '…' : text;
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.4 }} title={text}>
        {preview}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          flexShrink: 0,
          padding: '0.15rem 0.5rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          background: copied ? '#15803d' : '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Requests() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/${APP_SLUG}/requests`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setRows(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = useCallback((id, status) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    fetch(`${API_BASE}/api/${APP_SLUG}/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {
      // revert on failure
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: r.status } : r));
    });
  }, []);

  const s = styles;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h2 style={s.title}>
          Submitted Requests
          {rows.length > 0 && <span style={s.badge}>{rows.length}</span>}
        </h2>
        <p style={s.subtitle}>All intake requests logged by the Director.</p>
      </header>

      {loading && <p style={s.muted}>Loading…</p>}
      {error   && <p style={s.error} role="alert">Could not load requests: {error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p style={s.muted}>No requests yet. Use the Director tab to submit the first one.</p>
      )}

      {!loading && rows.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['#', 'Name', 'Email', 'What they want', 'What we recommended', 'Prompt', 'Date', 'Status'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                  <td style={{ ...s.td, ...s.tdNum }}>{row.id}</td>
                  <td style={s.td}>{row.name || '—'}</td>
                  <td style={s.td}>
                    {row.email
                      ? <a href={`mailto:${row.email}`} style={s.link}>{row.email}</a>
                      : '—'}
                  </td>
                  <td style={{ ...s.td, ...s.tdSummary }}>{row.summary || '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.routePill, ...routePillColor(row.route) }}>
                      {ROUTE_LABELS[row.route] || row.route || '—'}
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.tdPrompt }}><PromptCell text={row.starter_prompt} /></td>
                  <td style={{ ...s.td, ...s.tdDate }}>{formatDate(row.created_at)}</td>
                  <td style={s.td}>
                    <select
                      value={row.status || 'Needs Review'}
                      onChange={e => handleStatusChange(row.id, e.target.value)}
                      style={{ ...s.statusSelect, ...statusSelectColor(row.status) }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusSelectColor(status) {
  const map = {
    'Needs Review':   { borderColor: '#fbbf24', background: '#fffbeb' },
    'Needs Review 2': { borderColor: '#f97316', background: '#fff7ed' },
    'Needs Review 3': { borderColor: '#ef4444', background: '#fef2f2' },
    'Declined':       { borderColor: '#6b7280', background: '#f3f4f6' },
    'Approved':       { borderColor: '#16a34a', background: '#f0fdf4' },
  };
  return map[status] || map['Needs Review'];
}

function routePillColor(route) {
  const map = {
    'no-code':          { background: '#fef9c3', color: '#854d0e' },
    'low-code':         { background: '#dbeafe', color: '#1e40af' },
    'pro-react':        { background: '#f3e8ff', color: '#6b21a8' },
    'pro-angular':      { background: '#fce7f3', color: '#9d174d' },
    'pro-astro-static': { background: '#e0f2fe', color: '#075985' },
    'pro-astro':        { background: '#ffedd5', color: '#9a3412' },
    'embed-request':    { background: '#d1fae5', color: '#065f46' },
  };
  return map[route] || { background: '#f3f4f6', color: '#374151' };
}

const styles = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '1.5rem',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: 700,
    margin: '0 0 0.3rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.1rem 0.55rem',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  },
  muted: {
    fontSize: '0.9rem',
    color: '#9ca3af',
  },
  error: {
    padding: '0.65rem 1rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#b91c1c',
    fontSize: '0.875rem',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.55rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '2px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '0.65rem 0.75rem',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  },
  tdNum: {
    color: '#9ca3af',
    fontSize: '0.8rem',
    width: '2.5rem',
  },
  tdSummary: {
    maxWidth: '260px',
    lineHeight: 1.45,
  },
  tdDate: {
    whiteSpace: 'nowrap',
    color: '#6b7280',
  },
  tdPrompt: {
    maxWidth: '220px',
  },
  trEven: { background: '#fff' },
  trOdd:  { background: '#fafafa' },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  statusSelect: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    border: '1px solid',
    borderRadius: '6px',
    cursor: 'pointer',
    appearance: 'auto',
    width: '100%',
  },
  routePill: {
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
};
