import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const APP_SLUG = import.meta.env.VITE_APP_SLUG     || '';

const EMPTY_FORM = {
  submitter_name:      '',
  submitter_email:     '',
  submitter_dept:      '',
  type:                'embed',
  title:               '',
  description:         '',
  justification:       '',
  url:                 '',
  code_snippet:        '',
  requested_placement: '',
  data_sensitivity:    'public',
  collects_user_data:  false,
  requires_auth:       false,
  go_live_date:        '',
};

export default function EmbedRequestForm() {
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        collects_user_data: form.collects_user_data ? 1 : 0,
        requires_auth:      form.requires_auth      ? 1 : 0,
      };
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const s = styles;
  const isEmbed = form.type === 'embed';

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.successBox}>
          <div style={s.successIcon}>✔</div>
          <h2 style={s.successTitle}>Request Submitted</h2>
          <p style={s.successText}>
            Your {isEmbed ? 'Smart Embed' : 'Stand-Alone Link'} request has been received and will be reviewed by the HUDX team.
          </p>
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setSubmitted(false)}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.headerTitle}>3PD Embed &amp; Link Request</h1>
        <p style={s.headerSub}>
          Submit a Smart Embed (code snippet) or Stand-Alone Link for governed integration into HUDX.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>

        {/* Submitter */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Your Information</legend>
          <div style={s.row}>
            <div style={s.col}>
              <label htmlFor="submitter_name" style={s.label}>Full name <span style={s.req}>*</span></label>
              <input id="submitter_name" type="text" style={s.input} required
                value={form.submitter_name} onChange={e => set('submitter_name', e.target.value)} />
            </div>
            <div style={s.col}>
              <label htmlFor="submitter_email" style={s.label}>Email <span style={s.req}>*</span></label>
              <input id="submitter_email" type="email" style={s.input} required
                value={form.submitter_email} onChange={e => set('submitter_email', e.target.value)} />
            </div>
          </div>
          <label htmlFor="submitter_dept" style={s.label}>Department / Organization</label>
          <input id="submitter_dept" type="text" style={s.input}
            value={form.submitter_dept} onChange={e => set('submitter_dept', e.target.value)} />
        </fieldset>

        {/* Type */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Request Type <span style={s.req}>*</span></legend>
          <div style={s.radioGroup}>
            <label style={s.radioLabel}>
              <input type="radio" name="type" value="embed" checked={form.type === 'embed'}
                onChange={() => set('type', 'embed')} style={s.radio} />
              <div>
                <strong>Smart Embed</strong>
                <p style={s.radioHint}>A code snippet (iFrame, JS, Tableau, Salesforce, etc.) rendered directly on a HUDX page.</p>
              </div>
            </label>
            <label style={s.radioLabel}>
              <input type="radio" name="type" value="link" checked={form.type === 'link'}
                onChange={() => set('type', 'link')} style={s.radio} />
              <div>
                <strong>Stand-Alone Link</strong>
                <p style={s.radioHint}>An external site or application linked from HUDX (opens in a new tab).</p>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Submission details */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Submission Details</legend>

          <label htmlFor="title" style={s.label}>Title <span style={s.req}>*</span></label>
          <input id="title" type="text" style={s.input} required
            placeholder="e.g. Tableau Housing Dashboard"
            value={form.title} onChange={e => set('title', e.target.value)} />

          <label htmlFor="description" style={{ ...s.label, marginTop: '1rem' }}>Description</label>
          <textarea id="description" style={s.textarea} rows={3}
            placeholder="What does this embed or link do?"
            value={form.description} onChange={e => set('description', e.target.value)} />

          <label htmlFor="justification" style={{ ...s.label, marginTop: '1rem' }}>Business justification</label>
          <textarea id="justification" style={s.textarea} rows={3}
            placeholder="Why should this be included in HUDX?"
            value={form.justification} onChange={e => set('justification', e.target.value)} />

          <label htmlFor="url" style={{ ...s.label, marginTop: '1rem' }}>
            URL {!isEmbed && <span style={s.req}>*</span>}
          </label>
          <input id="url" type="url" style={s.input}
            placeholder="https://"
            value={form.url} onChange={e => set('url', e.target.value)} />

          {isEmbed && (
            <>
              <label htmlFor="code_snippet" style={{ ...s.label, marginTop: '1rem' }}>Code snippet</label>
              <textarea id="code_snippet" style={{ ...s.textarea, fontFamily: 'monospace', fontSize: '0.85rem' }} rows={6}
                placeholder="Paste your embed code here"
                value={form.code_snippet} onChange={e => set('code_snippet', e.target.value)} />
            </>
          )}

          <label htmlFor="requested_placement" style={{ ...s.label, marginTop: '1rem' }}>Requested placement / page URL</label>
          <input id="requested_placement" type="text" style={s.input}
            placeholder="e.g. /housing/data or Home page"
            value={form.requested_placement} onChange={e => set('requested_placement', e.target.value)} />
        </fieldset>

        {/* Governance */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>Governance</legend>

          <label htmlFor="data_sensitivity" style={s.label}>Data sensitivity</label>
          <select id="data_sensitivity" style={s.select}
            value={form.data_sensitivity} onChange={e => set('data_sensitivity', e.target.value)}>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="restricted">Restricted</option>
          </select>

          <div style={{ ...s.checkRow, marginTop: '1rem' }}>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={form.collects_user_data}
                onChange={e => set('collects_user_data', e.target.checked)} style={s.checkbox} />
              Collects user data
            </label>
            {isEmbed && (
              <label style={s.checkLabel}>
                <input type="checkbox" checked={form.requires_auth}
                  onChange={e => set('requires_auth', e.target.checked)} style={s.checkbox} />
                Requires authentication
              </label>
            )}
          </div>

          <label htmlFor="go_live_date" style={{ ...s.label, marginTop: '1rem' }}>Requested go-live date</label>
          <input id="go_live_date" type="date" style={{ ...s.input, maxWidth: '220px' }}
            value={form.go_live_date} onChange={e => set('go_live_date', e.target.value)} />
        </fieldset>

        {error && <p style={s.error} role="alert">{error}</p>}

        <div style={s.actions}>
          <button type="submit"
            style={{ ...s.btn, ...s.btnPrimary, ...(submitting ? s.btnDisabled : {}) }}
            disabled={submitting}>
            {submitting ? '⏳ Submitting…' : 'Submit Request'}
          </button>
        </div>

      </form>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '780px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #e5e7eb',
  },
  headerTitle: { fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem' },
  headerSub:   { fontSize: '0.95rem', color: '#6b7280', margin: 0, lineHeight: 1.5 },
  fieldset: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
  },
  legend:   { fontWeight: 700, fontSize: '0.95rem', padding: '0 0.5rem', color: '#111827' },
  label:    { display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.35rem' },
  req:      { color: '#dc2626' },
  input: {
    display: 'block',
    width: '100%',
    padding: '0.55rem 0.75rem',
    fontSize: '0.93rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    display: 'block',
    width: '100%',
    padding: '0.55rem 0.75rem',
    fontSize: '0.93rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    lineHeight: 1.5,
  },
  select: {
    display: 'block',
    padding: '0.55rem 0.75rem',
    fontSize: '0.93rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    background: '#fff',
    minWidth: '200px',
  },
  row:      { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  col:      { flex: 1, minWidth: '200px' },
  radioGroup:  { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  radioLabel:  {
    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    padding: '0.75rem 1rem', border: '1px solid #e5e7eb',
    borderRadius: '6px', cursor: 'pointer',
  },
  radio:    { marginTop: '0.2rem', flexShrink: 0 },
  radioHint: { margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280' },
  checkRow:  { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' },
  checkbox:  { width: '16px', height: '16px' },
  actions:   { marginTop: '1.5rem' },
  btn: {
    padding: '0.6rem 1.75rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnPrimary:  { background: '#2563eb', color: '#fff' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  error: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#b91c1c',
    fontSize: '0.9rem',
  },
  successBox: {
    textAlign: 'center',
    padding: '3rem 2rem',
    border: '1px solid #86efac',
    borderRadius: '12px',
    background: '#f0fdf4',
    marginTop: '2rem',
  },
  successIcon:  { fontSize: '3rem', color: '#16a34a', marginBottom: '1rem' },
  successTitle: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem' },
  successText:  { color: '#374151', marginBottom: '1.5rem', lineHeight: 1.6 },
};
