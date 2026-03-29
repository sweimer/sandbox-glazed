import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /history — all rows newest first
router.get('/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM history ORDER BY id DESC').all();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /history/:id — update node_url after Drupal page creation
router.patch('/history/:id', (req, res) => {
  const { id } = req.params;
  const { node_url } = req.body ?? {};
  if (!node_url) return res.status(400).json({ error: 'node_url is required' });
  try {
    db.prepare('UPDATE history SET node_url = ? WHERE id = ?').run(node_url, id);
    const row = db.prepare('SELECT * FROM history WHERE id = ?').get(id);
    res.json(row);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /history/:id — remove a single history item
router.delete('/history/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM history WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
