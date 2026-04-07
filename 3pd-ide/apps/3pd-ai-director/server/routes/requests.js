import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /requests — all submitted intake requests, newest first
router.get('/requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY id DESC').all();
  res.json(rows);
});

// PATCH /requests/:id — update status
router.patch('/requests/:id', (req, res) => {
  const { status } = req.body ?? {};
  const { id } = req.params;

  const VALID_STATUSES = ['Needs Review', 'Needs Review 2', 'Needs Review 3', 'Declined', 'Approved'];
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const info = db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, id);
  if (info.changes === 0) return res.status(404).json({ error: 'Request not found.' });

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  res.json(row);
});

// POST /requests — save a completed intake request
router.post('/requests', (req, res) => {
  const { name, email, summary, route, conversation, starterPrompt } = req.body ?? {};

  const info = db.prepare(
    'INSERT INTO requests (name, email, summary, route, conversation, starter_prompt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    name          || '',
    email         || '',
    summary       || '',
    route         || '',
    conversation  || '',
    starterPrompt || '',
  );

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

export default router;
