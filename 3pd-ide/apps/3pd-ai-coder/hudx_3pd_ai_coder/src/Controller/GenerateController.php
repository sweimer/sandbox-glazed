<?php

namespace Drupal\hudx_3pd_ai_coder\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Handles POST /api/3pd-ai-coder/generate
 * Calls the Anthropic API and saves result to the history table.
 *
 * Requires ANTHROPIC_API_KEY to be set as a server environment variable.
 */
class GenerateController extends ControllerBase {

  public function generate(Request $request): JsonResponse {
    $data   = json_decode($request->getContent(), TRUE);
    $prompt = trim($data['prompt'] ?? '');
    $title  = trim($data['title']  ?? '');

    if (empty($prompt)) {
      return new JsonResponse(['error' => 'prompt is required.'], 400);
    }

    $apiKey = getenv('ANTHROPIC_API_KEY');
    if (empty($apiKey)) {
      return new JsonResponse(['error' => 'ANTHROPIC_API_KEY is not configured on this server.'], 500);
    }

    $systemPrompt = 'You are a markup generator for a Drupal CMS. Your only job is to produce clean, accessible HTML and CSS markup.

Rules you must follow without exception:
- Return ONLY raw HTML/CSS. Nothing else.
- No backticks. No markdown. No code fences.
- No explanations. No commentary. No preamble. No closing remarks.
- Do not say "here is the markup" or anything similar.
- Your entire response must be valid HTML that can be pasted directly into a Drupal Full HTML body field and render correctly.

Markup standards:
- Use semantic HTML elements
- Use proper form accessibility: <label for="">, <fieldset>, <legend>
- Use correct heading hierarchy (never skip levels)
- Use ARIA attributes only when native HTML semantics are insufficient
- Write clean, well-indented markup

Styling:
- Use a <style> block at the top of your output for any CSS
- Keep styles minimal and purposeful
- No external frameworks, no CDN links, no external dependencies
- Styles should be scoped to avoid conflicts when embedded in Drupal

Consistency:
- Predictable, repeatable structure
- Clean indentation (2 spaces)
- No random variations between requests';

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
          'max_tokens' => 4096,
          'system'     => $systemPrompt,
          'messages'   => [['role' => 'user', 'content' => $prompt]],
        ],
      ]);

      $body   = json_decode($response->getBody()->getContents(), TRUE);
      $markup = $body['content'][0]['text'] ?? '';

      if (empty($markup)) {
        return new JsonResponse(['error' => 'Claude returned an empty response.'], 500);
      }
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => 'Claude API error: ' . $e->getMessage()], 500);
    }

    $db = \Drupal::database();
    $db->insert('hudx_3pd_ai_coder_history')
      ->fields([
        'title'      => $title ?: NULL,
        'prompt'     => $prompt,
        'markup'     => $markup,
        'created_at' => date('Y-m-d H:i:s'),
      ])
      ->execute();

    $id  = $db->query('SELECT MAX(id) FROM {hudx_3pd_ai_coder_history}')->fetchField();
    $row = $db->select('hudx_3pd_ai_coder_history', 'h')
      ->fields('h')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row, 201);
  }

}
