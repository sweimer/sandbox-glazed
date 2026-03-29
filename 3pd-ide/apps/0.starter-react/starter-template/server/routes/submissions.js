import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/{APP_SLUG}/submissions — return all rows newest first
router.get('/submissions', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM submissions ORDER BY id DESC').all();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/{APP_SLUG}/submissions — insert a new submission
router.post('/submissions', (req, res) => {
  const { message } = req.body ?? {};

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const info = db.prepare('INSERT INTO submissions (message) VALUES (?)').run(message.trim());
    const row  = db.prepare('SELECT * FROM submissions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
