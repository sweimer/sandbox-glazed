<?php

namespace Drupal\dxpr_builder\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Description.
 */
interface AjaxControllerInterface {

  /**
   * AJAX CSRF refresh: Refreshes csrf token on the fly.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Returns url of json format.
   */
  public function ajaxRefresh(): JsonResponse;

  /**
   * Handles various operations for frontend drag and drop builder.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   Returns json response.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function ajaxCallback(): Response;

}
