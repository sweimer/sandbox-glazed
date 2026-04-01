/**
 * StyleGuide.jsx — DEV ONLY
 *
 * Demonstrates the Bootstrap / DXPR theme tokens available in this starter kit.
 * This page is for reference during development and will not ship to Drupal
 * (it is only reachable via the DEV nav and does not appear in the Drupal module).
 *
 * Theme assumption: DXPR theme (Bootstrap-based).
 * If the Drupal theme changes, update drupal-dev-styles.css via `3pd styles sync`
 * and revisit the class patterns used here.
 */

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Section wrapper — consistent spacing + heading style throughout
// ---------------------------------------------------------------------------
function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="h5 fw-semibold border-bottom pb-2 mb-4 text-primary">{title}</h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// StyleGuide
// ---------------------------------------------------------------------------
export default function StyleGuide() {
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <div className="container my-4">

      <header className="mb-5">
        <span className="badge bg-warning text-dark mb-2">DEV REFERENCE</span>
        <h1 className="h3 mb-1">Style Guide</h1>
        <p className="text-muted mb-0">
          The styles on this page are rendered using the <strong>actual Drupal theme CSS</strong> loaded
          into your dev environment — not a mock. What you see here is exactly what your app
          will look like inside Drupal. Build with confidence using the classes below.
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* TYPOGRAPHY                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Typography">
        <h1>Heading 1 <small className="text-muted fs-6">h1</small></h1>
        <h2>Heading 2 <small className="text-muted fs-6">h2</small></h2>
        <h3>Heading 3 <small className="text-muted fs-6">h3</small></h3>
        <h4>Heading 4 <small className="text-muted fs-6">h4</small></h4>
        <h5>Heading 5 <small className="text-muted fs-6">h5</small></h5>
        <h6>Heading 6 <small className="text-muted fs-6">h6</small></h6>

        <hr />

        <p className="lead">Lead paragraph — use for introductory copy. Class: <code>lead</code></p>
        <p>Body text — default paragraph size. Comfortable for reading. No class needed.</p>
        <p className="small text-muted">Small muted text — use for captions, hints, metadata. Classes: <code>small text-muted</code></p>
        <p><strong>Bold</strong> · <em>Italic</em> · <u>Underline</u> · <s>Strikethrough</s> · <code>inline code</code></p>
        <blockquote className="blockquote border-start border-primary ps-3">
          <p className="mb-1">"A blockquote for callouts or pull quotes."</p>
          <footer className="blockquote-footer">Source or attribution</footer>
        </blockquote>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* COLOR PALETTE                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Color Palette">
        <div className="row g-2 mb-3">
          {[
            ['primary',   'Primary'],
            ['secondary', 'Secondary'],
            ['success',   'Success'],
            ['danger',    'Danger'],
            ['warning',   'Warning'],
            ['info',      'Info'],
            ['light',     'Light'],
            ['dark',      'Dark'],
          ].map(([color, label]) => (
            <div key={color} className="col-6 col-md-3 col-lg-2">
              <div className={`bg-${color} rounded p-3 mb-1`} style={{ minHeight: '60px' }} />
              <p className="small mb-0 fw-semibold">{label}</p>
              <p className="small text-muted mb-0"><code>bg-{color}</code></p>
            </div>
          ))}
        </div>
        <p className="small text-muted">
          Text variants: <span className="text-primary">text-primary</span> ·{' '}
          <span className="text-success">text-success</span> ·{' '}
          <span className="text-danger">text-danger</span> ·{' '}
          <span className="text-warning">text-warning</span> ·{' '}
          <span className="text-muted">text-muted</span>
        </p>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* BUTTONS                                                             */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Buttons">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-success">Success</button>
          <button className="btn btn-danger">Danger</button>
          <button className="btn btn-warning">Warning</button>
          <button className="btn btn-info">Info</button>
          <button className="btn btn-light">Light</button>
          <button className="btn btn-dark">Dark</button>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-outline-primary">Outline Primary</button>
          <button className="btn btn-outline-secondary">Outline Secondary</button>
          <button className="btn btn-outline-success">Outline Success</button>
          <button className="btn btn-outline-danger">Outline Danger</button>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button className="btn btn-primary btn-lg">Large</button>
          <button className="btn btn-primary">Default</button>
          <button className="btn btn-primary btn-sm">Small</button>
          <button className="btn btn-primary" disabled>Disabled</button>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* LINKS                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Links">
        <p>
          <a href="#" onClick={e => e.preventDefault()}>Default link</a> ·{' '}
          <a href="#" className="link-primary" onClick={e => e.preventDefault()}>link-primary</a> ·{' '}
          <a href="#" className="link-success" onClick={e => e.preventDefault()}>link-success</a> ·{' '}
          <a href="#" className="link-danger" onClick={e => e.preventDefault()}>link-danger</a> ·{' '}
          <a href="#" className="link-secondary" onClick={e => e.preventDefault()}>link-secondary</a> ·{' '}
          <a href="#" className="link-dark" onClick={e => e.preventDefault()}>link-dark</a>
        </p>
        <p>
          <a href="#" className="text-decoration-none" onClick={e => e.preventDefault()}>No underline</a> ·{' '}
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            External link <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.75em' }} aria-hidden="true"></i>
          </a>
        </p>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* ALERTS                                                              */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Alerts">
        {['primary', 'success', 'warning', 'danger', 'info', 'secondary'].map(color => (
          <div key={color} className={`alert alert-${color} d-flex align-items-center gap-2`} role="alert">
            <i className="bi bi-info-circle-fill flex-shrink-0" aria-hidden="true"></i>
            <span>
              <strong className="text-capitalize">{color}:</strong>{' '}
              Use <code>alert alert-{color}</code> for this style.
            </span>
          </div>
        ))}
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* BADGES                                                              */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Badges">
        <div className="d-flex flex-wrap gap-2 mb-3">
          {['primary','secondary','success','danger','warning','info','light','dark'].map(c => (
            <span key={c} className={`badge bg-${c} ${c === 'light' ? 'text-dark' : ''}`}>
              {c}
            </span>
          ))}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {['primary','success','danger','warning'].map(c => (
            <span key={c} className={`badge rounded-pill bg-${c}`}>
              Pill · {c}
            </span>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* CARDS                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Cards">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Basic Card</h5>
                <p className="card-text text-muted small">Body copy goes here. Cards support a flexible content area.</p>
                <a href="#" className="btn btn-primary btn-sm" onClick={e => e.preventDefault()}>Action</a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-primary shadow-sm">
              <div className="card-header bg-primary text-white">Colored header</div>
              <div className="card-body">
                <p className="card-text small">Card with a colored header. Use <code>border-{'{color}'}</code> and <code>card-header bg-{'{color}'}</code>.</p>
              </div>
              <div className="card-footer text-muted small">Footer text</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Full-height card</h5>
                <p className="card-text text-muted small flex-grow-1">Use <code>h-100</code> + <code>d-flex flex-column</code> to push the button to the bottom regardless of content length.</p>
                <a href="#" className="btn btn-outline-primary btn-sm mt-auto" onClick={e => e.preventDefault()}>Pinned action</a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* FORM ELEMENTS                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Form Elements">
        <div className="row g-3" style={{ maxWidth: '560px' }}>
          <div className="col-12">
            <label htmlFor="sg-text" className="form-label">Text input</label>
            <input id="sg-text" type="text" className="form-control" placeholder="Placeholder text" />
          </div>
          <div className="col-12">
            <label htmlFor="sg-select" className="form-label">Select</label>
            <select id="sg-select" className="form-select" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Choose an option…</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
              <option value="c">Option C</option>
            </select>
          </div>
          <div className="col-12">
            <label htmlFor="sg-textarea" className="form-label">Textarea</label>
            <textarea id="sg-textarea" className="form-control" rows={3} placeholder="Multi-line input" />
          </div>
          <div className="col-12">
            <div className="form-check">
              <input
                id="sg-check"
                type="checkbox"
                className="form-check-input"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
              />
              <label htmlFor="sg-check" className="form-check-label">Checkbox label</label>
            </div>
          </div>
          <div className="col-12">
            <label htmlFor="sg-range" className="form-label">Range input</label>
            <input id="sg-range" type="range" className="form-range" />
          </div>
          <div className="col-12 d-flex gap-2">
            <button className="btn btn-primary">Submit</button>
            <button className="btn btn-outline-secondary" type="reset">Reset</button>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* TABLE                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Table">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 1, name: 'First entry',  status: 'Active',  date: '2026-04-01' },
                { id: 2, name: 'Second entry', status: 'Pending', date: '2026-04-02' },
                { id: 3, name: 'Third entry',  status: 'Closed',  date: '2026-04-03' },
              ].map(row => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>
                    <span className={`badge bg-${row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : 'secondary'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="text-muted small">{row.date}</td>
                  <td><a href="#" className="btn btn-outline-primary btn-sm" onClick={e => e.preventDefault()}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* ACCORDION                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Accordion">
        <div className="accordion" id="sg-accordion">
          {[
            { id: 'one',   title: 'Accordion item one',   body: 'Content for the first panel. Click the header to collapse.' },
            { id: 'two',   title: 'Accordion item two',   body: 'Content for the second panel.' },
            { id: 'three', title: 'Accordion item three', body: 'Content for the third panel.' },
          ].map(({ id, title, body }) => (
            <div key={id} className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${open === id ? '' : 'collapsed'}`}
                  type="button"
                  onClick={() => setOpen(open === id ? null : id)}
                  aria-expanded={open === id}
                >
                  {title}
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${open === id ? 'show' : ''}`}>
                <div className="accordion-body small">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* LIST GROUP                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Section title="List Group">
        <div className="row g-3">
          <div className="col-md-4">
            <ul className="list-group">
              <li className="list-group-item active" aria-current="true">Active item</li>
              <li className="list-group-item">Default item</li>
              <li className="list-group-item">Another item</li>
              <li className="list-group-item text-muted">Muted item</li>
              <li className="list-group-item disabled" aria-disabled="true">Disabled item</li>
            </ul>
          </div>
          <div className="col-md-4">
            <ul className="list-group">
              {['primary','success','warning','danger','info'].map(c => (
                <li key={c} className={`list-group-item list-group-item-${c}`}>
                  list-group-item-{c}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-4">
            <ul className="list-group">
              {['First item','Second item','Third item'].map((item, i) => (
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  {item}
                  <span className="badge bg-primary rounded-pill">{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

    </div>
  );
}
