<?php

namespace Drupal\hudx_3pd_ai_director\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Intake requests API for the 3PD Director.
 *
 * GET  /api/3pd-ai-director/requests  — all requests, newest first
 * POST /api/3pd-ai-director/requests  — save a completed intake request
 */
class RequestsController extends ControllerBase {

  public function list(): JsonResponse {
    $rows = \Drupal::database()
      ->select('hudx_3pd_ai_director_requests', 'r')
      ->fields('r')
      ->orderBy('r.id', 'DESC')
      ->execute()
      ->fetchAll(\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  public function store(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    $db = \Drupal::database();
    $db->insert('hudx_3pd_ai_director_requests')
      ->fields([
        'name'          => $data['name']          ?? '',
        'email'         => $data['email']         ?? '',
        'summary'       => $data['summary']       ?? '',
        'route'         => $data['route']         ?? '',
        'conversation'  => $data['conversation']  ?? '',
        'starter_prompt' => $data['starterPrompt'] ?? '',
        'created_at'    => date('Y-m-d H:i:s'),
      ])
      ->execute();

    $id  = $db->query('SELECT MAX(id) FROM {hudx_3pd_ai_director_requests}')->fetchField();
    $row = $db->select('hudx_3pd_ai_director_requests', 'r')
      ->fields('r')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row, 201);
  }

}
