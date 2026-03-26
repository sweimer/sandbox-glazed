<?php

namespace Drupal\dxpr_builder;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;
use Drupal\dxpr_builder\Service\MediaLibraryDxprBuilderOpener;
use Symfony\Component\DependencyInjection\Reference;

/**
 * Provide overrides for core services.
 */
class DxprBuilderServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function alter(ContainerBuilder $container): void {
    $definition = $container->getDefinition('menu.active_trail');
    $definition->setClass('Drupal\dxpr_builder\Menu\MenuActiveTrailOverride');
    $definition->setArguments(
      [
        new Reference('plugin.manager.menu.link'),
        new Reference('current_route_match'),
        new Reference('cache.menu'),
        new Reference('lock'),
        new Reference('request_stack'),
        new Reference('router'),
      ]
    );
  }

  /**
   * {@inheritdoc}
   */
  public function register(ContainerBuilder $container): void {
    $modules = $container->getParameter('container.modules');

    // Define "media_library.opener.dxpr_builder" only in case
    // when "media_library" module is enabled.
    if (isset($modules['media_library'])) {
      $definition = $container->register('media_library.opener.dxpr_builder', MediaLibraryDxprBuilderOpener::class);
      $definition->setArguments([
        new Reference('entity_type.manager'),
        new Reference('extension.list.module'),
        new Reference('renderer'),
      ]);
      $definition->addTag('media_library.opener');
    }
  }

}
