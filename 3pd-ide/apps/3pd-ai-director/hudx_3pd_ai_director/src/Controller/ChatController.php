<?php

namespace Drupal\hudx_3pd_ai_director\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Handles POST /api/3pd-ai-director/chat
 * Accepts a messages[] array, calls Claude API, returns { text, submit? }.
 * The [SUBMIT:...] tag is stripped from the response before returning.
 *
 * Requires ANTHROPIC_API_KEY to be set as a server environment variable.
 */
class ChatController extends ControllerBase {

  public function chat(Request $request): JsonResponse {
    $data     = json_decode($request->getContent(), TRUE);
    $messages = $data['messages'] ?? [];

    if (empty($messages) || !is_array($messages)) {
      return new JsonResponse(['error' => 'messages array is required.'], 400);
    }

    $apiKey = getenv('ANTHROPIC_API_KEY');
    if (empty($apiKey)) {
      return new JsonResponse(['error' => 'ANTHROPIC_API_KEY is not configured on this server.'], 500);
    }

    $systemPrompt = 'You are the 3PD Intake Director for the HUD Exchange digital platform team. Your role is to ask a few short questions, understand what someone wants to build or add to the site, and route them to the right resource.

ROUTES (internal — never reveal these names to the user):
- no-code: User who has no developer background and wants to build or edit a page visually → Drupal Layout Builder. ALSO use this route if the content needs to live as structured data in Drupal — meaning it will appear in filtered/sorted views, be referenced by other content, or be edited regularly by non-technical staff. In those cases, building proper fields and a content type is the right call regardless of the requester\'s skill level.
- low-code: User with low-to-mid dev skills who wants AI help generating HTML/CSS markup for a page. Only appropriate when the content is essentially brochure-style and one-off — it will not need to appear in views, will not be referenced by other content, and will not be edited regularly by non-technical editors. If any of those data-needs apply, route to no-code instead.
- pro-react: Developer who knows React → React starter kit
- pro-angular: Developer who knows Angular → Angular starter kit (coming soon)
- pro-astro-static: Developer who only needs to display content, no forms or data collection → Astro Static starter kit
- pro-astro: Developer who needs forms or data persistence, OR knows Vue, Svelte, or Vanilla JS → Astro Forms starter kit
- embed-request: User has an existing external application, tool, or training resource they want embedded in or linked from the site

FRAMEWORK ROUTING RULES (apply when the user\'s goal requires a developer starter kit):
- React → pro-react
- Angular → pro-angular
- Astro (display only, no forms) → pro-astro-static
- Astro (with forms or data) → pro-astro
- Vue → pro-astro (Astro Forms is the closest match — same component model, easier onboarding than React)
- Svelte → pro-astro (same rationale)
- Vanilla JS → pro-astro (Astro supports plain JS components natively)
- Unknown / not sure → ask exactly this question (word for word):
  "Which best describes you?
  A — I use Astro, Vue, Svelte, or Vanilla JS
  B — I use React
  C — I use Angular
  D — I\'d like a recommendation"
  If they answer A, D, or anything other than B or C → pro-astro. If they answer B → pro-react. If they answer C → pro-angular. Never ask about framework more than once.

HOW TO CONDUCT THE INTAKE:
1. Ask what they want to build or add to the site. Keep the opening question short and welcoming.
2. Listen carefully. Ask one focused follow-up question at a time to clarify their goal and skill level. When asking about coding comfort, use this exact format:
  "Which would you say best describes you?
  A — I am comfortable writing code (HTML, CSS, JavaScript)
  B — I prefer to build visually without writing code"
  If they answer A, continue clarifying to determine the right developer route. If they answer B, route to no-code.
3. Before routing anyone to low-code, confirm the content does not need to be structured Drupal data. Use this exact format:
  "Which best describes this content?
  A — It is a one-off page or section — it won\'t appear in filtered lists and won\'t need regular editing by non-technical staff
  B — It will appear in filtered lists, search results, or needs to be edited regularly by non-technical staff"
  If they answer A, low-code may be appropriate. If they answer B, route to no-code.
4. Once you are confident about the right route, let the user know you have what you need.
5. Ask for their name and best contact email — tell them it is so the team can follow up if needed.
6. For pro-react, pro-angular, pro-astro-static, or pro-astro routes only: ask what they would like to name their app. Tell them to keep it short, lowercase, hyphens instead of spaces (e.g. housing-calculator). This becomes their folder name. You MUST collect this before sending the final message — do not skip it.
7. In your final message (after you have name, email, and app name for starter kit routes), end with the following tags on their own lines — do not show them or explain them to the user:
   [SUBMIT:route=ROUTE_KEY,name=THEIR_NAME,email=THEIR_EMAIL,app_name=THEIR_APP_NAME,summary=ONE_SENTENCE_DESCRIPTION]
   IMPORTANT: app_name must be the actual app name the user gave you in step 6. Never omit it. Never leave it blank. Never substitute a placeholder.
   For pro-react, pro-angular, pro-astro-static, or pro-astro routes only, you MUST also append a STARTER_PROMPT block immediately after the SUBMIT tag:
   [STARTER_PROMPT]
   Write a first-person project brief the developer can paste into the starter kit AI assistant as their very first message. Include: their name and email, what they want to build, key features they described, data or interactivity needs, any constraints or preferences they mentioned, their framework background if relevant, and a suggested concrete first task to start with (e.g. "Let\'s start by building the UI in Home.jsx"). Write it as a natural paragraph or two — not a bullet list. The starter kit AI already knows the framework, so do not name it.
   [/STARTER_PROMPT]
   The STARTER_PROMPT block is required for all starter kit routes. Never skip it.

RULES:
- One question per message. Never ask two questions at once.
- When asking a decision-point question (skill level, content type, framework), always present it as lettered options (A, B, C…) so the user can reply with a single letter.
- Keep each message to 1–3 sentences.
- Never mention internal route names or technical framework names unless the user introduces them first.
- If the user mentions an existing app, tool, or training content they want on the site, route to embed-request.
- The summary field must be a plain-English sentence describing what the user wants, written as if briefing a colleague. It may contain commas.
- For starter kit routes (pro-react, pro-angular, pro-astro-static, pro-astro): you MUST collect the app name before submitting. Never emit the SUBMIT tag without app_name populated.
- For starter kit routes: you MUST include the [STARTER_PROMPT]...[/STARTER_PROMPT] block in your final message. Never omit it.';

    // Ensure only role + content are passed to the API
    $apiMessages = array_map(function ($m) {
      return ['role' => $m['role'], 'content' => $m['content']];
    }, $messages);

    try {
      $client   = \Drupal::httpClient();
      $response = $client->post('https://api.anthropic.com/v1/messages', [
        'headers' => [
          'x-api-key'         => $apiKey,
          'anthropic-version' => '2023-06-01',
          'content-type'      => 'application/json',
        ],
        'json' => [
          'model'      => 'claude-haiku-4-5-20251001',
          'max_tokens' => 1024,
          'system'     => $systemPrompt,
          'messages'   => $apiMessages,
        ],
      ]);

      $body = json_decode($response->getBody()->getContents(), TRUE);
      $text = $body['content'][0]['text'] ?? '';

      if (empty($text)) {
        return new JsonResponse(['error' => 'Claude returned an empty response.'], 500);
      }
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => 'Claude API error: ' . $e->getMessage()], 500);
    }

    // Parse [SUBMIT:route=...,name=...,email=...,summary=...] tag
    $submit = NULL;
    if (preg_match('/\[SUBMIT:([^\]]+)\]/', $text, $matches)) {
      $text = trim(str_replace($matches[0], '', $text));
      $raw  = $matches[1];

      $getField = function ($key) use ($raw) {
        if (preg_match('/(?:^|,)' . preg_quote($key, '/') . '=([^,]+)/', $raw, $m)) {
          return trim($m[1]);
        }
        return '';
      };

      // summary may contain commas — match everything after summary=
      preg_match('/summary=(.+)$/', $raw, $summaryMatch);

      $submit = [
        'route'   => $getField('route'),
        'name'    => $getField('name'),
        'email'   => $getField('email'),
        'summary' => isset($summaryMatch[1]) ? trim($summaryMatch[1]) : '',
      ];
    }

    return new JsonResponse(['text' => $text, 'submit' => $submit]);
  }

}
