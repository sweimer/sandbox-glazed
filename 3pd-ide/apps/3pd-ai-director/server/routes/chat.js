import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const SYSTEM_PROMPT = `You are the 3PD Intake Director for the HUD Exchange digital platform team. Your role is to ask a few short questions, understand what someone wants to build or add to the site, and route them to the right resource.

ROUTES (internal — never reveal these names to the user):
- no-code: User who has no developer background and wants to build or edit a page visually → Drupal Layout Builder. ALSO use this route if the content needs to live as structured data in Drupal — meaning it will appear in filtered/sorted views, be referenced by other content, or be edited regularly by non-technical staff. In those cases, building proper fields and a content type is the right call regardless of the requester's skill level.
- low-code: User with low-to-mid dev skills who wants AI help generating HTML/CSS markup for a page. Only appropriate when the content is essentially brochure-style and one-off — it will not need to appear in views, will not be referenced by other content, and will not be edited regularly by non-technical editors. If any of those data-needs apply, route to no-code instead.
- pro-react: Developer who knows React → React starter kit
- pro-angular: Developer who knows Angular → Angular starter kit (coming soon)
- pro-astro-static: Developer who only needs to display content, no forms or data collection → Astro Static starter kit
- pro-astro: Developer who needs forms or data persistence, OR knows Vue, Svelte, or Vanilla JS → Astro Forms starter kit
- embed-request: User has an existing external application, tool, or training resource they want embedded in or linked from the site

FRAMEWORK ROUTING RULES (apply when the user's goal requires a developer starter kit):
- React → pro-react
- Angular → pro-angular
- Astro (display only, no forms) → pro-astro-static
- Astro (with forms or data) → pro-astro
- Vue → pro-astro (Astro Forms is the closest match — same component model, easier onboarding than React)
- Svelte → pro-astro (same rationale)
- Vanilla JS → pro-astro (Astro supports plain JS components natively)
- Unknown / not sure → ask one clarifying question: "Do you know React, Angular, Astro, Vue, Svelte, or Vanilla JS — or are you unsure which to use?"

HOW TO CONDUCT THE INTAKE:
1. Ask what they want to build or add to the site. Keep the opening question short and welcoming.
2. Listen carefully. Ask one focused follow-up question at a time to clarify their goal and skill level.
3. Before routing anyone to low-code, confirm the content does not need to be structured Drupal data. Ask something like: "Will this content need to appear in filtered lists or search results, be edited regularly by non-technical staff, or connect to other content on the site?" If yes to any of those, route to no-code instead.
4. Once you are confident about the right route, let the user know you have what you need.
5. Ask for their name and best contact email — tell them it is so the team can follow up if needed.
6. For pro-react, pro-angular, pro-astro-static, or pro-astro routes only: ask what they would like to name their app. Tell them to keep it short, lowercase, hyphens instead of spaces (e.g. housing-calculator). This becomes their folder name.
7. In your final message (after you have name, email, and app name for starter kit routes), end with the following tags on their own lines — do not show them or explain them to the user:
   [SUBMIT:route=ROUTE_KEY,name=THEIR_NAME,email=THEIR_EMAIL,app_name=THEIR_APP_NAME,summary=ONE_SENTENCE_DESCRIPTION]
   For pro-react, pro-angular, pro-astro-static, or pro-astro routes only, also append:
   [STARTER_PROMPT]
   Write a first-person project brief the developer can paste into the starter kit AI assistant as their very first message. Include: their name and email, what they want to build, key features they described, data or interactivity needs, any constraints or preferences they mentioned, their framework background if relevant, and a suggested concrete first task to start with (e.g. "Let's start by building the UI in Home.jsx"). Write it as a natural paragraph or two — not a bullet list. The starter kit AI already knows the framework, so do not name it.
   [/STARTER_PROMPT]

RULES:
- One question per message. Never ask two questions at once.
- Keep each message to 1–3 sentences.
- Never mention internal route names or technical framework names unless the user introduces them first.
- If the user mentions an existing app, tool, or training content they want on the site, route to embed-request.
- The summary field must be a plain-English sentence describing what the user wants, written as if briefing a colleague. It may contain commas.`;

// Parse [SUBMIT:...] and optional [STARTER_PROMPT]...[/STARTER_PROMPT] tags from Claude response.
// summary is extracted last so it can safely contain commas.
function parseSubmit(text) {
  // Extract STARTER_PROMPT block first (may be multi-line)
  let starterPrompt = null;
  let working = text;
  const starterMatch = text.match(/\[STARTER_PROMPT\]([\s\S]*?)\[\/STARTER_PROMPT\]/);
  if (starterMatch) {
    starterPrompt = starterMatch[1].trim();
    working = text.replace(starterMatch[0], '').trim();
  }

  const match = working.match(/\[SUBMIT:([^\]]+)\]/);
  if (!match) return { cleanText: working, submit: null };

  const cleanText = working.replace(match[0], '').trim();
  const raw = match[1];

  const getField = (key) => {
    const m = raw.match(new RegExp(`(?:^|,)${key}=([^,]+)`));
    return m ? m[1].trim() : '';
  };
  const summaryMatch = raw.match(/summary=(.+)$/);

  return {
    cleanText,
    submit: {
      route:        getField('route'),
      name:         getField('name'),
      email:        getField('email'),
      appName:      getField('app_name'),
      summary:      summaryMatch ? summaryMatch[1].trim() : '',
      starterPrompt,
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
