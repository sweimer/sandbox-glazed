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
- The summary field must be a plain-English sentence describing what the user wants, written as if briefing a colleague. It may contain commas.';

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
