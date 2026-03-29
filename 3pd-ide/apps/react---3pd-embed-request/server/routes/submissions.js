import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

const ALLOWED_FIELDS = [
  'submitter_name', 'submitter_email', 'submitter_dept',
  'type', 'title', 'description', 'justification',
  'url', 'code_snippet', 'requested_placement',
  'data_sensitivity', 'collects_user_data', 'requires_auth', 'go_live_date',
];

// GET /submissions — all rows newest first
router.get('/submissions', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM submissions ORDER BY id DESC').all();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /submissions — new submission
router.post('/submissions', (req, res) => {
  const body = req.body ?? {};

  if (!body.submitter_name?.trim()) return res.status(400).json({ error: 'submitter_name is required' });
  if (!body.submitter_email?.trim()) return res.status(400).json({ error: 'submitter_email is required' });
  if (!body.title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!['embed', 'link'].includes(body.type)) return res.status(400).json({ error: 'type must be embed or link' });

  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    fields[key] = body[key] ?? null;
  }

  try {
    const cols = Object.keys(fields).join(', ');
    const placeholders = Object.keys(fields).map(() => '?').join(', ');
    const info = db.prepare(`INSERT INTO submissions (${cols}) VALUES (${placeholders})`).run(...Object.values(fields));
    const row  = db.prepare('SELECT * FROM submissions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /submissions/:id — admin update (status, admin_notes)
router.patch('/submissions/:id', (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body ?? {};

  const allowed = ['pending', 'approved', 'rejected', 'needs_info'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    db.prepare('UPDATE submissions SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes) WHERE id = ?')
      .run(status ?? null, admin_notes ?? null, id);
    const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
    res.json(row ?? { error: 'Not found' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
