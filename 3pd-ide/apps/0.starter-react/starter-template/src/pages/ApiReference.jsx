/**
 * ApiReference.jsx — DEV ONLY
 *
 * Live API reference for this starter kit. Two sections:
 *   1. App API  — your own Express/PHP endpoints (submissions CRUD)
 *   2. Drupal JSON:API — read CMS content from Drupal at runtime
 *
 * Both live demos fire real requests so you can see actual responses.
 */

import { useState } from 'react';

const API_BASE    = import.meta.env.VITE_API_BASE_URL    || '';
const APP_SLUG    = import.meta.env.VITE_APP_SLUG        || '';
const DRUPAL_BASE = import.meta.env.VITE_DRUPAL_BASE_URL || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="position-relative">
      <pre
        className="bg-dark text-light rounded p-3 small mb-0"
        style={{ overflowX: 'auto', fontSize: '0.8rem', lineHeight: '1.6' }}
      >
        <code>{code}</code>
      </pre>
      <button
        className="btn btn-sm btn-outline-light position-absolute top-0 end-0 m-2"
        style={{ fontSize: '0.7rem' }}
        onClick={copy}
        aria-label="Copy code"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

function ResponsePanel({ loading, error, data }) {
  if (loading) return <p className="text-muted small mt-2">Loading…</p>;
  if (error)   return <div className="alert alert-danger small mt-2 py-2" role="alert">{error}</div>;
  if (!data)   return null;
  return (
    <pre
      className="bg-dark text-success rounded p-3 small mt-2"
      style={{ overflowX: 'auto', maxHeight: '280px', fontSize: '0.78rem' }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Section({ id, title, badge, badgeColor = 'primary', children }) {
  return (
    <section id={id} className="mb-5 pt-2">
      <div className="d-flex align-items-center gap-2 border-bottom pb-2 mb-4">
        <h2 className="h5 fw-semibold mb-0 text-primary">{title}</h2>
        {badge && <span className={`badge bg-${badgeColor}`}>{badge}</span>}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ApiReference
// ---------------------------------------------------------------------------
export default function ApiReference() {

  // App API — GET
  const [getLoading, setGetLoading] = useState(false);
  const [getError,   setGetError]   = useState('');
  const [getData,    setGetData]    = useState(null);

  // App API — POST
  const [postMessage, setPostMessage] = useState('Test entry from API Reference');
  const [postLoading, setPostLoading] = useState(false);
  const [postError,   setPostError]   = useState('');
  const [postData,    setPostData]    = useState(null);

  // Drupal JSON:API
  const [drupalType,    setDrupalType]    = useState('node/page');
  const [drupalLoading, setDrupalLoading] = useState(false);
  const [drupalError,   setDrupalError]   = useState('');
  const [drupalData,    setDrupalData]    = useState(null);

  async function tryGet() {
    setGetLoading(true); setGetError(''); setGetData(null);
    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setGetData(await res.json());
    } catch (err) {
      setGetError(`Request failed: ${err.message}`);
    } finally { setGetLoading(false); }
  }

  async function tryPost(e) {
    e.preventDefault();
    setPostLoading(true); setPostError(''); setPostData(null);
    try {
      const res = await fetch(`${API_BASE}/api/${APP_SLUG}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: postMessage }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPostData(await res.json());
    } catch (err) {
      setPostError(`Request failed: ${err.message}`);
    } finally { setPostLoading(false); }
  }

  async function tryDrupal() {
    setDrupalLoading(true); setDrupalError(''); setDrupalData(null);
    try {
      const url = `${DRUPAL_BASE}/jsonapi/${drupalType}?page[limit]=3&fields[${drupalType}]=title,body,created`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDrupalData(await res.json());
    } catch (err) {
      setDrupalError(`Request failed: ${err.message}`);
    } finally { setDrupalLoading(false); }
  }

  return (
    <div className="container my-4">

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <header className="mb-5">
        <span className="badge bg-warning text-dark mb-2">DEV REFERENCE</span>
        <h1 className="h3 mb-1">API Reference</h1>
        <p className="text-muted mb-3">
          Two API families are available in this starter kit. The live demos below
          fire real requests — responses shown are actual data.
        </p>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card border-primary h-100">
              <div className="card-body">
                <h2 className="h6 fw-semibold text-primary mb-1">
                  <i className="bi bi-server me-2" aria-hidden="true"></i>App API
                </h2>
                <p className="small text-muted mb-0">
                  Your app's own endpoints. Handled by <strong>Express</strong> locally,
                  by a generated <strong>PHP controller</strong> when deployed to Drupal.
                  Same URL pattern in both environments.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-info h-100">
              <div className="card-body">
                <h2 className="h6 fw-semibold text-info mb-1">
                  <i className="bi bi-cloud me-2" aria-hidden="true"></i>Drupal JSON:API
                </h2>
                <p className="small text-muted mb-0">
                  Read CMS-managed content from Drupal at runtime. No redeployment
                  needed when content changes. Requires <code>VITE_DRUPAL_BASE_URL</code> in <code>.env</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* ENV VARS                                                            */}
      {/* ------------------------------------------------------------------ */}
      <Section id="env" title="Environment Variables" badge="Setup">
        <p className="small text-muted mb-3">
          These values are set in your <code>.env</code> file and injected at build time by Vite.
          Use <code>import.meta.env.VITE_*</code> to access them in React components.
        </p>
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle small">
            <thead className="table-light">
              <tr>
                <th>Variable</th>
                <th>Current value</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>VITE_API_BASE_URL</code></td>
                <td><code className="text-success">{API_BASE || '(not set)'}</code></td>
                <td>Base URL for your app's Express/PHP API</td>
              </tr>
              <tr>
                <td><code>VITE_APP_SLUG</code></td>
                <td><code className="text-success">{APP_SLUG || '(not set)'}</code></td>
                <td>Namespaces API routes so multiple apps coexist in one Drupal install</td>
              </tr>
              <tr>
                <td><code>VITE_DRUPAL_BASE_URL</code></td>
                <td>
                  <code className={DRUPAL_BASE ? 'text-success' : 'text-danger'}>
                    {DRUPAL_BASE || '(not set — add to .env)'}
                  </code>
                </td>
                <td>Drupal instance URL for JSON:API content fetching</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ================================================================== */}
      {/* SECTION 1 — APP API                                                */}
      {/* ================================================================== */}
      <Section id="app-api" title="App API" badge="Express → PHP" badgeColor="primary">

        <p className="small text-muted mb-4">
          Your app ships with GET and POST endpoints for the <code>submissions</code> table.
          These are served by <strong>Express</strong> during local development and by a
          generated <strong>PHP controller</strong> inside Drupal — the fetch URL is identical
          in both environments.
        </p>

        {/* Endpoint table */}
        <h3 className="h6 fw-semibold mb-2">Endpoints</h3>
        <div className="table-responsive mb-4">
          <table className="table table-sm table-bordered align-middle small">
            <thead className="table-dark">
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge bg-success">GET</span></td>
                <td><code>/api/{APP_SLUG || '{APP_SLUG}'}/submissions</code></td>
                <td>Return all submissions, newest first</td>
                <td><code>{"[ { id, message, created_at }, … ]"}</code></td>
              </tr>
              <tr>
                <td><span className="badge bg-primary">POST</span></td>
                <td><code>/api/{APP_SLUG || '{APP_SLUG}'}/submissions</code></td>
                <td>Save a new submission</td>
                <td><code>{"{ id, message, created_at }"}</code> · 201</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* GET example */}
        <h3 className="h6 fw-semibold mb-2">GET — Retrieve data</h3>
        <CodeBlock code={`const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const APP_SLUG = import.meta.env.VITE_APP_SLUG     || '';

const res  = await fetch(\`\${API_BASE}/api/\${APP_SLUG}/submissions\`);
const data = await res.json();
// data → [ { id: 1, message: "Hello", created_at: "2026-04-01 12:00:00" }, … ]`} />

        <div className="mt-3 p-3 bg-light rounded border">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="small fw-semibold">
              <span className="badge bg-success me-2">GET</span>
              <code>{API_BASE}/api/{APP_SLUG}/submissions</code>
            </span>
            <button className="btn btn-success btn-sm" onClick={tryGet} disabled={getLoading}>
              {getLoading ? 'Loading…' : 'Try it →'}
            </button>
          </div>
          <ResponsePanel loading={getLoading} error={getError} data={getData} />
        </div>

        <hr className="my-4" />

        {/* POST example */}
        <h3 className="h6 fw-semibold mb-2">POST — Save data</h3>
        <CodeBlock code={`const res = await fetch(\`\${API_BASE}/api/\${APP_SLUG}/submissions\`, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({ message: 'Hello world' }),
});
const saved = await res.json();
// saved → { id: 4, message: "Hello world", created_at: "2026-04-01 12:01:00" }`} />

        <div className="mt-3 p-3 bg-light rounded border">
          <form onSubmit={tryPost} className="d-flex align-items-center gap-2 mb-2" aria-label="POST demo">
            <span className="badge bg-primary flex-shrink-0">POST</span>
            <label htmlFor="api-post-msg" className="visually-hidden">Message</label>
            <input
              id="api-post-msg"
              type="text"
              className="form-control form-control-sm"
              value={postMessage}
              onChange={e => setPostMessage(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm flex-shrink-0" disabled={postLoading}>
              {postLoading ? 'Saving…' : 'Try it →'}
            </button>
          </form>
          <p className="small text-muted mb-0">
            <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
            This writes a real entry to your SQLite database. Check the Home page to see it appear.
          </p>
          <ResponsePanel loading={postLoading} error={postError} data={postData} />
        </div>

        <hr className="my-4" />

        {/* How it works in Drupal */}
        <h3 className="h6 fw-semibold mb-2">How it works in Drupal</h3>
        <div className="alert alert-secondary small" role="note">
          <p className="mb-2">
            When you run <code>3pd react module</code>, the CLI generates a PHP controller
            (<code>SubmissionsController.php</code>) that mirrors these exact routes. The fetch URL
            in your React code stays identical — <code>/api/{'{APP_SLUG}'}/submissions</code> —
            because Drupal's routing maps the same path to the PHP handler.
          </p>
          <p className="mb-0">
            Data stored locally in <code>server/db/app.sqlite</code> is bundled into
            <code> data/seed.json</code> and imported into Drupal's MySQL database on module install.
          </p>
        </div>
      </Section>

      {/* ================================================================== */}
      {/* SECTION 2 — DRUPAL JSON:API                                        */}
      {/* ================================================================== */}
      <Section id="drupal-api" title="Drupal JSON:API" badge="CMS Content" badgeColor="info">

        <p className="small text-muted mb-4">
          Drupal exposes all content via JSON:API at <code>/jsonapi/</code>. Use this to pull
          CMS-managed content into your app at runtime — no redeployment needed when editors
          update content in Drupal.
        </p>

        {!DRUPAL_BASE && (
          <div className="alert alert-warning small mb-4" role="alert">
            <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
            <code>VITE_DRUPAL_BASE_URL</code> is not set. Add it to <code>.env</code> to enable
            the live demo. Example: <code>VITE_DRUPAL_BASE_URL=https://your-site.lndo.site</code>
          </div>
        )}

        {/* Common endpoints */}
        <h3 className="h6 fw-semibold mb-2">Common endpoints</h3>
        <div className="table-responsive mb-4">
          <table className="table table-sm table-bordered align-middle small">
            <thead className="table-dark">
              <tr>
                <th>Content type</th>
                <th>JSON:API path</th>
                <th>Common fields</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Basic page',   'node/page',              'title, body, created'],
                ['Article',      'node/article',           'title, body, field_image, created'],
                ['Tags',         'taxonomy_term/tags',     'name, description'],
                ['Media image',  'media/image',            'name, field_media_image'],
              ].map(([type, path, fields]) => (
                <tr key={path}>
                  <td>{type}</td>
                  <td><code>/jsonapi/{path}</code></td>
                  <td><code className="text-muted">{fields}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GET example */}
        <h3 className="h6 fw-semibold mb-2">GET — Fetch CMS content</h3>
        <CodeBlock code={`const DRUPAL_BASE = import.meta.env.VITE_DRUPAL_BASE_URL || '';

// Fetch the 3 most recent pages — return only title + body fields
const res  = await fetch(
  \`\${DRUPAL_BASE}/jsonapi/node/page?page[limit]=3&fields[node--page]=title,body\`
);
const json = await res.json();
const pages = json.data; // array of node objects
// pages[0].attributes.title  → "Page title"
// pages[0].attributes.body.value → "<p>Body HTML</p>"`} />

        <div className="mt-3 p-3 bg-light rounded border">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success">GET</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={drupalType}
                onChange={e => setDrupalType(e.target.value)}
                aria-label="Select content type"
              >
                <option value="node/page">node/page</option>
                <option value="node/article">node/article</option>
                <option value="taxonomy_term/tags">taxonomy_term/tags</option>
              </select>
            </div>
            <button
              className="btn btn-info btn-sm text-white"
              onClick={tryDrupal}
              disabled={!DRUPAL_BASE || drupalLoading}
            >
              {drupalLoading ? 'Loading…' : 'Try it →'}
            </button>
          </div>
          {DRUPAL_BASE && (
            <p className="small text-muted mb-0">
              <code>{DRUPAL_BASE}/jsonapi/{drupalType}?page[limit]=3</code>
            </p>
          )}
          <ResponsePanel loading={drupalLoading} error={drupalError} data={drupalData} />
        </div>

        <hr className="my-4" />

        {/* Query params */}
        <h3 className="h6 fw-semibold mb-2">Useful query parameters</h3>
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle small">
            <thead className="table-light">
              <tr>
                <th>Parameter</th>
                <th>Example</th>
                <th>Effect</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['page[limit]',           'page[limit]=5',                              'Return 5 items'],
                ['page[offset]',          'page[offset]=10',                            'Skip first 10 (pagination)'],
                ['fields[node--page]',    'fields[node--page]=title,body',              'Return only these fields'],
                ['filter[status]',        'filter[status]=1',                           'Only published content'],
                ['sort',                  'sort=-created',                              'Newest first (prefix - = descending)'],
                ['include',               'include=field_image',                        'Eager-load a relationship'],
              ].map(([param, example, effect]) => (
                <tr key={param}>
                  <td><code>{param}</code></td>
                  <td><code className="text-muted small">{example}</code></td>
                  <td>{effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="alert alert-secondary small mt-3" role="note">
          <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
          <strong>No square brackets in URLs through HAProxy.</strong> If your app is deployed
          behind HAProxy (Pantheon, Acquia), use the encoded forms:{' '}
          <code>page%5Blimit%5D=5</code> instead of <code>page[limit]=5</code>.
          The Express dev server handles both — only matters in production.
        </div>

      </Section>

    </div>
  );
}
