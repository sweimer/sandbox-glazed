import { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE    = import.meta.env.VITE_API_BASE_URL    || '';
const APP_SLUG    = import.meta.env.VITE_APP_SLUG        || '';
const DRUPAL_BASE = import.meta.env.VITE_DRUPAL_BASE_URL || '';

const REPO_FOLDER = {
  'pro-react':        '3PD---React-Starter-Kit',
  'pro-astro':        '3PD---Astro-Forms-Starter-Kit',
  'pro-astro-static': '3PD---Astro-Static-Starter-Kit',
};

const SCAFFOLD_CMD = {
  'pro-react':        (n) => `3pd react app ${n}`,
  'pro-astro':        (n) => `3pd astro-forms app ${n}`,
  'pro-astro-static': (n) => `3pd astro app ${n}`,
};

const APP_FOLDER = {
  'pro-react':        (n) => `apps/react---${n}`,
  'pro-astro':        (n) => `apps/astro-forms---${n}`,
  'pro-astro-static': (n) => `apps/astro---${n}`,
};

function buildStarterBlocks(route, appName, repoUrl, starterPrompt) {
  const folder   = REPO_FOLDER[route]   || '';
  const scaffold = SCAFFOLD_CMD[route]  ? SCAFFOLD_CMD[route](appName)  : '';
  const appDir   = APP_FOLDER[route]    ? APP_FOLDER[route](appName)    : '';

  return [
    { label: 'Clone the starter kit',          cmd: `git clone ${repoUrl}` },
    { label: 'Scaffold your app',               cmd: `cd ${folder} && ${scaffold}` },
    { label: 'Launch your AI assistant',        cmd: `cd ${appDir} && 3pd run ai` },
    { label: 'When the AI greets you, paste this', cmd: starterPrompt || '', isPrompt: true },
  ];
}

const ROUTE_DESTINATIONS = {
  'no-code':          { label: 'Open Layout Builder',              url: `${DRUPAL_BASE}/node/add/basic_page_layout_builder` },
  'low-code':         { label: 'Open AI Markup Builder',           url: `${DRUPAL_BASE}/hudx-test/3pd-ai-coder` },
  'pro-react':        { label: 'View React Starter Kit',           url: 'https://github.com/sweimer/3PD---React-Starter-Kit' },
  'pro-angular':      { label: 'Angular Starter Kit (Coming Soon)', url: null },
  'pro-astro-static': { label: 'View Astro Static Starter Kit',    url: 'https://github.com/sweimer/3PD---Astro-Static-Starter-Kit' },
  'pro-astro':        { label: 'View Astro Forms Starter Kit',     url: 'https://github.com/sweimer/3PD---Astro-Forms-Starter-Kit' },
  'embed-request':    { label: 'Submit an Embed Request',          url: `${DRUPAL_BASE}/hudx-test/react---3pd-embed-request` },
};

const ROUTE_LABELS = {
  'no-code':          'No-Code Builder',
  'low-code':         'AI Markup Builder',
  'pro-react':        'React Starter Kit',
  'pro-angular':      'Angular Starter Kit (Coming Soon)',
  'pro-astro-static': 'Astro Static Starter Kit',
  'pro-astro':        'Astro Forms Starter Kit',
  'embed-request':    'Embed / Link Request',
};

export default function Director() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);   // {route, name, email, appName, summary, starterPrompt}
  const [error, setError]         = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
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

  const handleCopy = useCallback((text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }, []);

  function handleReset() {
    setMessages([]);
    setInput('');
    setResult(null);
    setError('');
    setCopiedIdx(null);
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
          {destination.url ? (
            <a
              href={destination.url}
              target="_blank"
              rel="noreferrer"
              style={s.ctaBtn}
            >
              {destination.label} →
            </a>
          ) : (
            <span style={{ ...s.ctaBtn, background: '#9ca3af', cursor: 'default' }}>
              {destination.label}
            </span>
          )}

          {/* ONBOARDING — only for starter kit routes */}
          {['pro-react', 'pro-angular', 'pro-astro-static', 'pro-astro'].includes(result.route) && result.route !== 'pro-angular' && destination.url && (
            <>
              <hr style={s.divider} />
              <p style={s.sectionHeading}>Your setup steps</p>
              {buildStarterBlocks(result.route, result.appName || 'your-app-name', destination.url, result.starterPrompt)
                .map((block, i) => (
                  <div key={i} style={s.stepBlock}>
                    <div style={s.stepBlockHeader}>
                      <span style={s.stepNum}>{i + 1}</span>
                      <span style={s.stepBlockLabel}>{block.label}</span>
                      {block.cmd && (
                        <button
                          type="button"
                          onClick={() => handleCopy(block.cmd, i)}
                          style={{ ...s.copyBtn, ...(copiedIdx === i ? s.copyBtnDone : {}) }}
                        >
                          {copiedIdx === i ? 'Copied!' : 'Copy'}
                        </button>
                      )}
                    </div>
                    {block.cmd && (
                      <pre style={block.isPrompt ? s.promptText : s.cmdText}>{block.cmd}</pre>
                    )}
                  </div>
                ))
              }
            </>
          )}

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
  divider: {
    margin: '1.25rem 0',
    border: 'none',
    borderTop: '1px solid #bbf7d0',
  },
  sectionHeading: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#15803d',
    margin: '0 0 0.75rem',
  },
  stepBlock: {
    marginBottom: '0.75rem',
    background: '#fff',
    border: '1px solid #d1fae5',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  stepBlockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.55rem 0.75rem',
    background: '#f0fdf4',
    borderBottom: '1px solid #d1fae5',
  },
  stepNum: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.35rem',
    height: '1.35rem',
    borderRadius: '50%',
    background: '#16a34a',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepBlockLabel: {
    flex: 1,
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#166534',
  },
  cmdText: {
    margin: 0,
    padding: '0.65rem 0.85rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.82rem',
    color: '#1a1a1a',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  promptText: {
    margin: 0,
    padding: '0.75rem 0.85rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '0.85rem',
    color: '#1a1a1a',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
  },
  copyBtn: {
    marginLeft: 'auto',
    padding: '0.25rem 0.65rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  copyBtnDone: {
    background: '#15803d',
  },
};

