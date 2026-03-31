import { useState, useRef, useEffect } from 'react';

const API_BASE    = import.meta.env.VITE_API_BASE_URL    || '';
const APP_SLUG    = import.meta.env.VITE_APP_SLUG        || '';
const DRUPAL_BASE = import.meta.env.VITE_DRUPAL_BASE_URL || '';

const ROUTE_DESTINATIONS = {
  'no-code':       { label: 'Open Layout Builder',       url: `${DRUPAL_BASE}/node/add/basic_page_layout_builder` },
  'low-code':      { label: 'Open AI Markup Builder',    url: `${DRUPAL_BASE}/hudx-test/3pd-ai-coder` },
  'pro-react':     { label: 'View React Starter Kit',    url: 'https://github.com/sweimer/3PD---React-Starter-Kit' },
  'pro-astro':     { label: 'View Astro Starter Kit',    url: 'https://github.com/sweimer/3PD---Astro-Forms-Starter-Kit' },
  'embed-request': { label: 'Submit an Embed Request',   url: `${DRUPAL_BASE}/hudx-test/react---3pd-embed-request` },
};

const ROUTE_LABELS = {
  'no-code':       'No-Code Builder',
  'low-code':      'AI Markup Builder',
  'pro-react':     'React Developer',
  'pro-astro':     'Astro Developer',
  'embed-request': 'Embed / Link Request',
};

export default function Director() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);   // {route, name, email, summary}
  const [error, setError]         = useState('');
  const threadRef                 = useRef(null);
  const inputRef                  = useRef(null);

  // Auto-scroll thread to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || result) return;

    const updated = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { text: assistantText, submit } = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);

      if (submit) {
        // Save to requests DB
        await fetch(`${API_BASE}/api/${APP_SLUG}/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:         submit.name,
            email:        submit.email,
            summary:      submit.summary,
            route:        submit.route,
            conversation: JSON.stringify([...updated, { role: 'assistant', content: assistantText }]),
          }),
        });
        setResult(submit);
      }
    } catch (err) {
      setError(`Something went wrong: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleReset() {
    setMessages([]);
    setInput('');
    setResult(null);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const destination = result ? ROUTE_DESTINATIONS[result.route] : null;
  const s = styles;

  return (
    <div style={s.page}>

      {/* HEADER */}
      <header style={s.header}>
        <h1 style={s.title}>3PD Intake Director</h1>
        <p style={s.subtitle}>
          Answer a few questions and we'll connect you with the right tool or resource.
        </p>
      </header>

      {/* CHAT THREAD */}
      <div style={s.thread} ref={threadRef}>

        {/* Welcome message — static, not sent to Claude */}
        <div style={s.assistantBubble}>
          <span style={s.label}>Director</span>
          <p style={s.bubbleText}>
            Hi! I'm here to help connect you with the right 3PD resource. What would you like to build or add to the site?
          </p>
        </div>

        {messages.map((msg, i) => (
          msg.role === 'user' ? (
            <div key={i} style={s.userRow}>
              <div style={s.userBubble}>
                <p style={s.userBubbleText}>{msg.content}</p>
              </div>
            </div>
          ) : (
            <div key={i} style={s.assistantBubble}>
              <span style={s.label}>Director</span>
              <p style={s.bubbleText}>{msg.content}</p>
            </div>
          )
        ))}

        {loading && (
          <div style={s.assistantBubble}>
            <span style={s.label}>Director</span>
            <p style={{ ...s.bubbleText, color: '#9ca3af', fontStyle: 'italic' }}>Thinking…</p>
          </div>
        )}
      </div>

      {error && <p style={s.error} role="alert">{error}</p>}

      {/* INPUT — hidden after result */}
      {!result && (
        <div style={s.inputArea}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            style={s.textarea}
            rows={3}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ ...s.btn, ...s.btnPrimary, ...(loading || !input.trim() ? s.btnDisabled : {}) }}
          >
            Send
          </button>
        </div>
      )}

      {/* RESULT CARD */}
      {result && destination && (
        <div style={s.resultCard}>
          <p style={s.resultHeading}>You're all set, {result.name}!</p>
          <p style={s.resultSummary}>{result.summary}</p>
          <p style={s.resultRoute}>Recommended path: <strong>{ROUTE_LABELS[result.route] || result.route}</strong></p>
          <a
            href={destination.url}
            target="_blank"
            rel="noreferrer"
            style={s.ctaBtn}
          >
            {destination.label} →
          </a>
          <p style={s.resultMeta}>Your request has been logged.</p>
          <button type="button" onClick={handleReset} style={s.resetBtn}>
            Start a new session
          </button>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '700px',
    margin: '0 auto',
    padding: '1.5rem',
    color: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
  },
  header: {
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: '0 0 0.3rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: 0,
  },
  thread: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '460px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.25rem 0 0.5rem',
    marginBottom: '1rem',
  },
  assistantBubble: {
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
  },
  bubbleText: {
    margin: 0,
    padding: '0.65rem 0.9rem',
    borderRadius: '0 10px 10px 10px',
    background: '#f3f4f6',
    fontSize: '0.92rem',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
  },
  userBubbleText: {
    margin: 0,
    padding: '0.65rem 0.9rem',
    borderRadius: '10px 10px 0 10px',
    background: '#2563eb',
    color: '#fff',
    fontSize: '0.92rem',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },
  error: {
    padding: '0.65rem 1rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#b91c1c',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  inputArea: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '0.65rem 0.85rem',
    fontSize: '0.92rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    boxSizing: 'border-box',
  },
  btn: {
    padding: '0.6rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnPrimary: {
    background: '#2563eb',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  resultCard: {
    marginTop: '0.5rem',
    padding: '1.5rem',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '10px',
  },
  resultHeading: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: '0 0 0.4rem',
    color: '#15803d',
  },
  resultSummary: {
    fontSize: '0.92rem',
    color: '#374151',
    margin: '0 0 0.5rem',
    lineHeight: 1.5,
  },
  resultRoute: {
    fontSize: '0.85rem',
    color: '#6b7280',
    margin: '0 0 1.1rem',
  },
  ctaBtn: {
    display: 'inline-block',
    padding: '0.65rem 1.5rem',
    background: '#16a34a',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  resultMeta: {
    marginTop: '0.9rem',
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  resetBtn: {
    marginTop: '0.3rem',
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
};

