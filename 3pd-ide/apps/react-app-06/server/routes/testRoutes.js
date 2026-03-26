import { Router } from 'express';
import pool from '../db/database.js';

const router = Router();

// POST /api/test/add — insert a new text entry
router.post('/add', async (req, res) => {
  console.log('🔥 POST /api/test/add hit:', req.body);
  const { text_value } = req.body;

  if (!text_value || text_value.trim() === '') {
    return res.status(400).json({ error: 'text_value is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO test_entries (text_value) VALUES ($1) RETURNING *',
      [text_value.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /add error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/test/all — return all rows
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM test_entries ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /all error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

