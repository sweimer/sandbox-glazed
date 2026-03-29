import { useState, useEffect, useRef } from 'react';

const API_BASE    = import.meta.env.VITE_API_BASE_URL    || '';
const APP_SLUG    = import.meta.env.VITE_APP_SLUG        || '';
const DRUPAL_BASE = import.meta.env.VITE_DRUPAL_BASE_URL || '';

export default function MarkupBuilder() {
  const [title, setTitle]         = useState('');
  const [prompt, setPrompt]       = useState('');
  const [markup, setMarkup]       = useState('');
  const [historyId, setHistoryId] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [creating, setCreating]   = useState(false);
  const [nodeUrl, setNodeUrl]     = useState('');
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);
  const [preview, setPreview]     = useState(false);
  const pageTopRef                = useRef(null);

  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/history`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistory(await res.json());
    } catch (err) {
      console.error('Could not load history:', err.message);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setCopied(false);
    setNodeUrl('');
    setHistoryId(null);
    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, title }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const row = await res.json();
      setMarkup(row.markup);
      setHistoryId(row.id);
      setPreview(false);
      loadHistory();
    } catch (err) {
      setError(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePage() {
    if (!markup || !title.trim()) return;
    setCreating(true);
    setError('');
    try {
      // 1. Get CSRF token from Drupal
      const tokenRes = await fetch(`${DRUPAL_BASE}/session/token`, { credentials: 'include' });
      if (!tokenRes.ok) throw new Error('Could not get CSRF token — are you logged in to Drupal?');
      const csrfToken = await tokenRes.text();

      // 2. Create node via JSON:API
      const nodeRes = await fetch(`${DRUPAL_BASE}/jsonapi/node/basic_page_layout_builder`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          data: {
            type: 'node--basic_page_layout_builder',
            attributes: {
              title: title.trim(),
              body: {
                value: markup,
                format: 'full_html',
              },
            },
          },
        }),
      });

      if (!nodeRes.ok) {
        const body = await nodeRes.json().catch(() => ({}));
        const detail = body?.errors?.[0]?.detail || `HTTP ${nodeRes.status}`;
        throw new Error(`Drupal API error: ${detail}`);
      }

      const nodeData = await nodeRes.json();
      const nid = nodeData.data?.attributes?.drupal_internal__nid;
      const url = `${DRUPAL_BASE}/node/${nid}`;
      setNodeUrl(url);

      // 3. Save node URL back to history
      if (historyId) {
        await fetch(`${API_BASE}/api/${APP_SLUG}/history/${historyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_url: url }),
        });
        loadHistory();
      }
    } catch (err) {
      setError(`Page creation failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`${API_BASE}/api/${APP_SLUG}/history/${id}`, { method: 'DELETE' });
      setHistory(h => h.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete failed:', err.message);
    }
  }

  function handleCopy() {
    if (!markup) return;
    navigator.clipboard.writeText(markup).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function loadFromHistory(item) {
    setTitle(item.title || '');
    setPrompt(item.prompt);
    setMarkup(item.markup);
    setNodeUrl(item.node_url || '');
    setHistoryId(item.id);
    setPreview(false);
    setCopied(false);
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleClear() {
    setTitle('');
    setPrompt('');
    setMarkup('');
    setNodeUrl('');
    setHistoryId(null);
    setPreview(false);
    setError('');
    setCopied(false);
  }

  useEffect(() => { loadHistory(); }, []);

  const s = styles;

  return (
    <div style={s.page} ref={pageTopRef}>

      {/* HEADER */}
      <header style={s.header}>
        <h1 style={s.headerTitle}>✦ Claude Markup Builder</h1>
        <p style={s.headerSub}>
          Describe any UI component and Claude will generate accessible HTML/CSS markup
          ready to paste into a Drupal Full HTML body field.
        </p>
      </header>

      {/* PROMPT FORM */}
      <section style={s.section}>
        <form onSubmit={handleGenerate}>
          <label htmlFor="mb-title" style={s.label}>Page title</label>
          <input
            id="mb-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Contact Us"
            style={s.titleInput}
            disabled={loading}
          />
          <label htmlFor="mb-prompt" style={{ ...s.label, marginTop: '1rem' }}>Your prompt</label>
          <textarea
            id="mb-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. A contact form with name, email, subject and message fields. Include a submit button and a reset link."
            style={s.promptInput}
            rows={4}
            disabled={loading}
          />
          <div style={s.formActions}>
            <button
              type="submit"
              style={{ ...s.btn, ...s.btnPrimary, ...(loading || !prompt.trim() ? s.btnDisabled : {}) }}
              disabled={loading || !prompt.trim()}
            >
              {loading ? '⏳ Generating…' : '✦ Generate Markup'}
            </button>
            {(markup || prompt || title) && (
              <button type="button" style={{ ...s.btn, ...s.btnSecondary }} onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </form>
        {error && <p style={s.error} role="alert">{error}</p>}
      </section>

      {/* OUTPUT */}
      {markup && (
        <section style={s.section}>
          <div style={s.outputHeader}>
            <h2 style={s.sectionTitle}>Generated Markup</h2>
            <div style={s.outputActions}>
              <button
                type="button"
                style={{ ...s.btn, ...(preview ? s.btnSecondary : s.btnGhost) }}
                onClick={() => setPreview(p => !p)}
              >
                {preview ? '✎ Edit' : '👁 Preview'}
              </button>
              <button
                type="button"
                style={{ ...s.btn, ...(copied ? s.btnSuccess : s.btnPrimary) }}
                onClick={handleCopy}
              >
                {copied ? '✔ Copied!' : '⎘ Copy'}
              </button>
            </div>
          </div>

          {preview ? (
            <div style={s.previewPane} dangerouslySetInnerHTML={{ __html: markup }} />
          ) : (
            <textarea
              value={markup}
              onChange={e => setMarkup(e.target.value)}
              style={s.markupOutput}
              rows={20}
              spellCheck={false}
              aria-label="Generated markup — editable"
            />
          )}

          <p style={s.hint}>
            {preview
              ? 'This is how your markup will render inside Drupal.'
              : 'You can edit the markup directly before copying. Switch to Preview to check the result.'}
          </p>

          {/* CREATE PAGE */}
          {nodeUrl ? (
            <div style={s.successBox}>
              <span style={s.successIcon}>✔</span>
              <div>
                <strong>Page created!</strong>{' '}
                <a href={nodeUrl} target="_blank" rel="noreferrer" style={s.successLink}>
                  {title || 'View page'}
                </a>
                <p style={s.successHint}>Generate new markup above to refine and create another version.</p>
              </div>
            </div>
          ) : (
            <div style={s.createRow}>
              <button
                type="button"
                style={{ ...s.btn, ...s.btnCreate, ...(creating || !title.trim() ? s.btnDisabled : {}) }}
                disabled={creating || !title.trim()}
                onClick={handleCreatePage}
              >
                {creating ? '⏳ Creating page…' : '⊕ Create Page in Drupal'}
              </button>
              {!title.trim() && (
                <span style={s.hint}>Add a page title above to enable this.</span>
              )}
            </div>
          )}
        </section>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>History</h2>
          <p style={s.hint}>Click any item to reload it for further tweaking.</p>
          <ul style={s.historyList} role="list">
            {history.map(item => (
              <li key={item.id} style={s.historyItem}>
                <button
                  type="button"
                  style={s.historyBtn}
                  onClick={() => loadFromHistory(item)}
                >
                  <span style={s.historyPrompt}>{item.title ? `${item.title} — ` : ''}{item.prompt}</span>
                  <div style={s.historyMeta}>
                    <span style={s.historyDate}>{item.created_at}</span>
                    {item.node_url && (
                      <a href={item.node_url} target="_blank" rel="noreferrer" style={s.historyNodeLink} onClick={e => e.stopPropagation()}>
                        View page →
                      </a>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  style={s.deleteBtn}
                  onClick={() => handleDelete(item.id)}
                  aria-label={`Delete: ${item.prompt}`}
                  title="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}

const styles = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '860px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #e5e7eb',
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
  },
  headerSub: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: '2.5rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 0.75rem',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  promptInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  formActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '0.55rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnPrimary: {
    background: '#2563eb',
    color: '#fff',
  },
  btnSecondary: {
    background: '#e5e7eb',
    color: '#374151',
  },
  btnGhost: {
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
  },
  btnSuccess: {
    background: '#16a34a',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    marginTop: '0.75rem',
    padding: '0.75rem 1rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#b91c1c',
    fontSize: '0.9rem',
    margin: '0.75rem 0 0',
  },
  outputHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  outputActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  markupOutput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.82rem',
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#f9fafb',
    resize: 'vertical',
    boxSizing: 'border-box',
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  previewPane: {
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '1.5rem',
    background: '#fff',
    minHeight: '200px',
  },
  hint: {
    marginTop: '0.5rem',
    fontSize: '0.82rem',
    color: '#9ca3af',
    margin: '0.5rem 0 0',
  },
  historyList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#fff',
  },
  historyBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0.65rem 0.9rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    gap: '0.2rem',
    minWidth: 0,
  },
  historyPrompt: {
    fontSize: '0.88rem',
    color: '#1a1a1a',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  historyDate: {
    fontSize: '0.76rem',
    color: '#9ca3af',
  },
  deleteBtn: {
    padding: '0 0.9rem',
    background: 'none',
    border: 'none',
    borderLeft: '1px solid #e5e7eb',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  hintAction: {
    marginTop: '0.75rem',
    fontSize: '0.88rem',
    color: '#374151',
  },
  hintLink: {
    color: '#2563eb',
    fontWeight: 600,
  },
  titleInput: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  createRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  btnCreate: {
    background: '#16a34a',
    color: '#fff',
    fontSize: '0.95rem',
    padding: '0.65rem 1.5rem',
  },
  successBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '1rem 1.25rem',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
  },
  successIcon: {
    fontSize: '1.25rem',
    color: '#16a34a',
    flexShrink: 0,
    marginTop: '0.1rem',
  },
  successLink: {
    color: '#16a34a',
    fontWeight: 700,
    textDecoration: 'underline',
  },
  successHint: {
    margin: '0.35rem 0 0',
    fontSize: '0.82rem',
    color: '#6b7280',
  },
  historyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  historyNodeLink: {
    fontSize: '0.76rem',
    color: '#16a34a',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
