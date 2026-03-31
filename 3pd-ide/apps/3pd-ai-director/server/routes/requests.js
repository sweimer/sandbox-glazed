import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /requests — all submitted intake requests, newest first
router.get('/requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY id DESC').all();
  res.json(rows);
});

// POST /requests — save a completed intake request
router.post('/requests', (req, res) => {
  const { name, email, summary, route, conversation } = req.body ?? {};

  const info = db.prepare(
    'INSERT INTO requests (name, email, summary, route, conversation) VALUES (?, ?, ?, ?, ?)'
  ).run(
    name         || '',
    email        || '',
    summary      || '',
    route        || '',
    conversation || '',
  );

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

export default router;
