import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// POST /api/test/add — insert a new text entry
router.post('/add', (req, res) => {
  const { text_value } = req.body;

  if (!text_value || text_value.trim() === '') {
    return res.status(400).json({ error: 'text_value is required' });
  }

  try {
    const info = db.prepare('INSERT INTO test_entries (text_value) VALUES (?)').run(text_value.trim());
    const row  = db.prepare('SELECT * FROM test_entries WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/test/all — return all rows
router.get('/all', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM test_entries ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
