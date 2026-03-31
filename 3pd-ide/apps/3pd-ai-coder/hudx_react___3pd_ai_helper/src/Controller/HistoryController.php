<?php

namespace Drupal\hudx_react___3pd_ai_helper\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * History API for the 3PD AI Helper.
 *
 * GET    /api/react---3pd-ai-helper/history         — all rows newest first
 * PATCH  /api/react---3pd-ai-helper/history/{id}    — update node_url
 * DELETE /api/react---3pd-ai-helper/history/{id}    — delete a row
 */
class HistoryController extends ControllerBase {

  public function list(): JsonResponse {
    $rows = \Drupal::database()
      ->select('hudx_react___3pd_ai_helper_history', 'h')
      ->fields('h')
      ->orderBy('h.id', 'DESC')
      ->execute()
      ->fetchAll(\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  public function update(Request $request, $id): JsonResponse {
    $data     = json_decode($request->getContent(), TRUE);
    $node_url = trim($data['node_url'] ?? '');

    if (empty($node_url)) {
      return new JsonResponse(['error' => 'node_url is required.'], 400);
    }

    \Drupal::database()
      ->update('hudx_react___3pd_ai_helper_history')
      ->fields(['node_url' => $node_url])
      ->condition('id', $id)
      ->execute();

    $row = \Drupal::database()
      ->select('hudx_react___3pd_ai_helper_history', 'h')
      ->fields('h')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row ?: ['error' => 'Not found.'], $row ? 200 : 404);
  }

  public function delete($id): Response {
    \Drupal::database()
      ->delete('hudx_react___3pd_ai_helper_history')
      ->condition('id', $id)
      ->execute();

    return new Response('', 204);
  }

}
