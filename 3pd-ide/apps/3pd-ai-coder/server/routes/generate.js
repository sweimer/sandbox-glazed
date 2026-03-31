import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db/database.js';

const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a markup generator for a Drupal CMS. Your only job is to produce clean, accessible HTML and CSS markup.

Rules you must follow without exception:
- Return ONLY raw HTML/CSS. Nothing else.
- No backticks. No markdown. No code fences.
- No explanations. No commentary. No preamble. No closing remarks.
- Do not say "here is the markup" or anything similar.
- Your entire response must be valid HTML that can be pasted directly into a Drupal Full HTML body field and render correctly.

Markup standards:
- Use semantic HTML elements (<section>, <article>, <header>, <nav>, <main>, <footer>, <figure>, etc.)
- Use proper form accessibility: <label for="">, <fieldset>, <legend>
- Use correct heading hierarchy (never skip levels)
- Use ARIA attributes only when native HTML semantics are insufficient
- Write clean, well-indented markup

Styling:
- Use a <style> block at the top of your output for any CSS
- Keep styles minimal and purposeful
- No external frameworks, no CDN links, no external dependencies
- Use CSS custom properties (variables) for any repeated values
- Styles should be scoped to avoid conflicts when embedded in Drupal

Consistency:
- Predictable, repeatable structure
- Clean indentation (2 spaces)
- No random variations between requests`;

// POST /generate — call Claude, save to history, return markup
router.post('/generate', async (req, res) => {
  const { prompt, title } = req.body ?? {};

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  let markup;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    markup = message.content[0]?.text ?? '';

    if (!markup) {
      return res.status(500).json({ error: 'Claude returned an empty response.' });
    }
  } catch (err) {
    console.error('Anthropic API error:', err);
    return res.status(500).json({ error: `Claude API error: ${err.message}` });
  }

  try {
    const info = db.prepare(
      'INSERT INTO history (title, prompt, markup) VALUES (?, ?, ?)'
    ).run(title?.trim() || null, prompt.trim(), markup);

    const row = db.prepare('SELECT * FROM history WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error saving history.' });
  }
});

export default router;
