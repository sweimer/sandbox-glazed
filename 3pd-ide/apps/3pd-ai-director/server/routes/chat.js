import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const SYSTEM_PROMPT = `You are the 3PD Intake Director for the HUD Exchange digital platform team. Your role is to ask a few short questions, understand what someone wants to build or add to the site, and route them to the right resource.

ROUTES (internal — never reveal these names to the user):
- no-code: Non-technical user who wants to build or edit a page visually → Drupal Layout Builder
- low-code: User who wants AI help generating HTML/CSS content for a page → AI Markup Builder
- pro-react: Developer building a new interactive app using React as a Drupal block
- pro-astro: Developer building an Astro app as a Drupal block (static display or with forms)
- embed-request: User has an existing external application, tool, or training resource they want embedded in or linked from the site

HOW TO CONDUCT THE INTAKE:
1. Ask what they want to build or add to the site. Keep the opening question short and welcoming.
2. Listen carefully. Ask one focused follow-up question at a time to clarify their goal and skill level.
3. Once you are confident about the right route, let the user know you have what you need.
4. Ask for their name and best contact email — tell them it is so the team can follow up if needed.
5. In your final message (after you have both name and email), end with this exact tag on its own line — do not show it or explain it to the user:
   [SUBMIT:route=ROUTE_KEY,name=THEIR_NAME,email=THEIR_EMAIL,summary=ONE_SENTENCE_DESCRIPTION]

RULES:
- One question per message. Never ask two questions at once.
- Keep each message to 1–3 sentences.
- Never mention internal route names or technical framework names unless the user introduces them first.
- If the user mentions an existing app, tool, or training content they want on the site, route to embed-request.
- The summary field must be a plain-English sentence describing what the user wants, written as if briefing a colleague. It may contain commas.`;

// Parse [SUBMIT:...] tag from Claude response text.
// summary is extracted last so it can safely contain commas.
function parseSubmit(text) {
  const match = text.match(/\[SUBMIT:([^\]]+)\]/);
  if (!match) return { cleanText: text, submit: null };

  const cleanText = text.replace(match[0], '').trim();
  const raw = match[1];

  const getField = (key) => {
    const m = raw.match(new RegExp(`(?:^|,)${key}=([^,]+)`));
    return m ? m[1].trim() : '';
  };
  const summaryMatch = raw.match(/summary=(.+)$/);

  return {
    cleanText,
    submit: {
      route:   getField('route'),
      name:    getField('name'),
      email:   getField('email'),
      summary: summaryMatch ? summaryMatch[1].trim() : '',
    },
  };
}

// POST /chat
// Body: { messages: [{role, content}] }
// Returns: { text, submit? }
router.post('/chat', async (req, res) => {
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on this server.' });
  }

  const client = new Anthropic({ apiKey });

  let rawText;
  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages,
    });
    rawText = response.content[0]?.text ?? '';
    if (!rawText) return res.status(500).json({ error: 'Claude returned an empty response.' });
  } catch (err) {
    console.error('Anthropic API error:', err);
    return res.status(500).json({ error: `Claude API error: ${err.message}` });
  }

  const { cleanText, submit } = parseSubmit(rawText);
  res.json({ text: cleanText, submit });
});

export default router;
