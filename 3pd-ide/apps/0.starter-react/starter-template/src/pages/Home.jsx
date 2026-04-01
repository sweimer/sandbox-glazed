import { useState, useEffect } from 'react';

const API_BASE    = import.meta.env.VITE_API_BASE_URL    || '';
const APP_SLUG    = import.meta.env.VITE_APP_SLUG        || '';

// In dev, route Drupal fetches through the Vite proxy (/drupal-proxy) to avoid CORS.
// In production the app runs inside Drupal (same origin) so the absolute URL works directly.
const DRUPAL_BASE = import.meta.env.VITE_DRUPAL_BASE_URL
  ? (import.meta.env.DEV ? '/drupal-proxy' : import.meta.env.VITE_DRUPAL_BASE_URL)
  : '';

// ---------------------------------------------------------------------------
// Card 3 helpers — SQLite (dev) / Drupal DB (production)
// ---------------------------------------------------------------------------
async function fetchSubmissions() {
  const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postSubmission(message) {
  const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
export default function Home() {

  // Card 2 — Drupal content
  const [drupalItem, setDrupalItem]   = useState(null);
  const [drupalError, setDrupalError] = useState('');

  // Card 3 — App data
  const [message, setMessage]         = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [dataError, setDataError]     = useState('');

  // Fetch Drupal content on mount (Card 2)
  useEffect(() => {
    if (!DRUPAL_BASE) return;
    fetch(`${DRUPAL_BASE}/jsonapi/node/page?page[limit]=1&fields[node--page]=title,body`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(data => setDrupalItem(data.data?.[0] ?? null))
      .catch(err  => setDrupalError(String(err)));
  }, []);

  // Fetch submissions on mount (Card 3)
  useEffect(() => {
    fetchSubmissions()
      .then(setSubmissions)
      .catch(err => setDataError(`Could not load data: ${err.message}`));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setDataError('');
    try {
      await postSubmission(message);
      setMessage('');
      setSubmissions(await fetchSubmissions());
    } catch (err) {
      setDataError(`Save failed: ${err.message}`);
    }
  }

  return (
    <div className="container my-4">

      <header className="mb-4">
        <h1 className="h3 mb-1">Your App Title</h1>
        <p className="text-muted mb-0">
          Replace this page with your app. The three cards below demonstrate the
          data patterns available in this starter kit — use any one or all of them.
        </p>
      </header>

      {/* DEV-ONLY: orientation guide for new developers */}
      {import.meta.env.DEV && (
        <div className="alert alert-info border-0 shadow-sm mb-4" role="note">
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-lightbulb-fill text-info flex-shrink-0 mt-1" style={{ fontSize: '1.25rem' }} aria-hidden="true"></i>
            <div className="w-100">
              <p className="fw-semibold mb-2">Welcome to your 3PD React Starter Kit</p>
              <div className="row g-3 small">
                <div className="col-md-6">
                  <p className="fw-semibold mb-1">Getting started:</p>
                  <ol className="mb-0 ps-3">
                    <li>Explore the three cards below — they show what this kit can do</li>
                    <li>Edit <code>src/pages/Home.jsx</code> to build your app</li>
                    <li>Edit <code>server/db/schema.sql</code> to define your data model</li>
                    <li>Run <code>3pd react module</code> when ready to ship to Drupal</li>
                  </ol>
                </div>
                <div className="col-md-6">
                  <p className="fw-semibold mb-1">Key commands:</p>
                  <ul className="list-unstyled mb-0">
                    <li><code>3pd run ai</code> — open AI dev assistant</li>
                    <li><code>3pd react module</code> — package app as Drupal block</li>
                    <li><code>3pd react module --install</code> — build + install to Drupal</li>
                    <li><code>3pd react db pull</code> — sync data from Drupal</li>
                    <li><code>3pd lint</code> / <code>3pd a11y</code> / <code>3pd validate</code> — quality checks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">

        {/* ---------------------------------------------------------------- */}
        {/* CARD 1 — Static content                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-primary text-white d-flex align-items-center gap-2">
              <i className="bi bi-file-text" aria-hidden="true"></i>
              <strong>Static Content</strong>
            </div>
            <div className="card-body d-flex flex-column">
              <p className="card-text text-muted small mb-3">
                Content lives in source code. Any change — even copy edits — requires
                a new <code>3pd react module</code> build and redeployment.
              </p>
              <div className="bg-light rounded p-3 mt-auto">
                <p className="fw-semibold mb-1">Hello from your React app!</p>
                <p className="small text-muted mb-0">
                  Edit <code>src/pages/Home.jsx</code> to replace this with your content.
                </p>
              </div>
            </div>
            <div className="card-footer text-muted small">
              Use for: text, labels, UI structure, layout
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CARD 2 — Content from Drupal                                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-info text-white d-flex align-items-center gap-2">
              <i className="bi bi-cloud-download" aria-hidden="true"></i>
              <strong>Content from Drupal</strong>
            </div>
            <div className="card-body d-flex flex-column">
              <p className="card-text text-muted small mb-3">
                Fetched from Drupal's JSON:API at runtime. Content editors can update
                it in Drupal without a redeployment.
              </p>
              <div className="mt-auto">
                {!DRUPAL_BASE && (
                  <div className="alert alert-secondary small mb-0" role="status">
                    <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                    Add <code>VITE_DRUPAL_BASE_URL</code> to <code>.env</code> to
                    connect to a Drupal instance and see a live example here.
                  </div>
                )}
                {DRUPAL_BASE && !drupalItem && !drupalError && (
                  <p className="small text-muted mb-0">Loading from Drupal…</p>
                )}
                {DRUPAL_BASE && drupalError && (
                  <div className="alert alert-warning small mb-0" role="alert">
                    Could not reach Drupal: {drupalError}
                  </div>
                )}
                {DRUPAL_BASE && drupalItem && (
                  <div className="bg-light rounded p-3">
                    <p className="fw-semibold small mb-1">{drupalItem.attributes?.title}</p>
                    <p className="small text-muted mb-0">Fetched live from Drupal JSON:API</p>
                  </div>
                )}
              </div>
            </div>
            <div className="card-footer text-muted small">
              Use for: CMS-managed copy, news, announcements
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CARD 3 — App data (SQLite → Drupal DB)                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-success text-white d-flex align-items-center gap-2">
              <i className="bi bi-database" aria-hidden="true"></i>
              <strong>App Data</strong>
            </div>
            <div className="card-body d-flex flex-column">
              <p className="card-text text-muted small mb-3">
                Data saved by users at runtime. Stored in SQLite locally — in
                Drupal's database when deployed as a module.
              </p>

              <form onSubmit={handleSubmit} className="d-flex gap-2 mb-2" aria-label="Add entry">
                <label htmlFor="entry-input" className="visually-hidden">Message</label>
                <input
                  id="entry-input"
                  type="text"
                  className="form-control form-control-sm"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Enter a message…"
                  required
                />
                <button type="submit" className="btn btn-success btn-sm">Save</button>
              </form>

              {dataError && (
                <div className="alert alert-danger small py-1 mb-2" role="alert">{dataError}</div>
              )}

              <ul className="list-group list-group-flush small mt-auto" aria-live="polite">
                {submissions.length === 0 && (
                  <li className="list-group-item text-muted">No entries yet — save one above.</li>
                )}
                {submissions.map(s => (
                  <li key={s.id} className="list-group-item d-flex justify-content-between align-items-start gap-2">
                    <span>{s.message}</span>
                    <small className="text-muted text-nowrap">{s.created_at}</small>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer text-muted small">
              Use for: form submissions, user data, tracked activity
            </div>
          </div>
        </div>

      </div>

      {/* DEV-ONLY: next steps after exploring the starter */}
      {import.meta.env.DEV && (
        <div className="mt-5 pt-4 border-top">
          <p className="small fw-semibold text-muted text-uppercase mb-3">When you're ready to build</p>
          <div className="row g-3 small">
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-2">
                <span className="badge bg-primary rounded-pill">1</span>
                <div>
                  <p className="fw-semibold mb-0">Customize your data model</p>
                  <p className="text-muted mb-0">Edit <code>server/db/schema.sql</code> — a working default is already set up</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-2">
                <span className="badge bg-primary rounded-pill">2</span>
                <div>
                  <p className="fw-semibold mb-0">Build your UI</p>
                  <p className="text-muted mb-0">Edit <code>src/pages/Home.jsx</code></p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-2">
                <span className="badge bg-primary rounded-pill">3</span>
                <div>
                  <p className="fw-semibold mb-0">Run quality checks</p>
                  <p className="text-muted mb-0"><code>3pd validate</code></p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-2">
                <span className="badge bg-success rounded-pill">4</span>
                <div>
                  <p className="fw-semibold mb-0">Ship to Drupal</p>
                  <p className="text-muted mb-0"><code>3pd react module</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
