#!/bin/bash

set -euxo pipefail

# DXPR access token
if [ -z "$DXPR_ACCESS_TOKEN" ]
then
      echo "DXPR_ACCESS_TOKEN is empty"
      exit 1;
fi

# Configure the dxpr access token
composer config -g bearer.packages.dxpr.com $DXPR_ACCESS_TOKEN

# Creating a new project directly from dxpr_cms (includes recipe path repos
# needed for Drupal recipes like dxpr_cms_basic_analytics)
composer create-project dxpr/dxpr_cms:1.x-dev .

# Add the DXPR packages repository for enterprise packages
composer config repositories.dxpr_packages composer https://packages.dxpr.com/8

# Install the enterprise package
composer require 'dxpr/dxpr_builder_e:0.0.2'

# Create the settings.php file
chmod 755 web/sites/default/
cp web/sites/default/default.settings.php web/sites/default/settings.php && chmod 777 web/sites/default/settings.php
mkdir -p web/sites/default/files && chmod -R 777 web/sites/default/files

echo "Removing the dxpr builder module..."
rm -rf web/modules/contrib/dxpr_builder

echo "Linking to the dxpr builder module..."
ln -s $DXPR_BUILDER_CONTAINER web/modules/contrib/dxpr_builder

# Note: Do NOT symlink dxpr_theme — the dxpr_cms project installs its own
# Drupal 11-compatible version (drupal/dxpr_theme ^8). The external
# dxpr/dxpr_theme:1.x image is for the BS3 qa-demo stack and requires
# bootstrap + color modules that don't exist in Drupal 11.

if [ -z ${NPM_INSTALL_STAMP+x} ]
then
      NPM_INSTALL_STAMP=".npm.installed"
fi
NPM_INSTALL_STAMP="$DXPR_BUILDER_CONTAINER/$NPM_INSTALL_STAMP"
echo "removing npm modules at $NPM_INSTALL_STAMP"
rm -rf "$NPM_INSTALL_STAMP" || true

# Installing DXPR CMS website using the dxpr_cms_installer profile
drush site-install dxpr_cms_installer dxpr_cms_installer_keys.dxpr_key=$DXPR_ACCESS_TOKEN --db-url=mysql://$DB_USER:$DB_PASSWORD@${DB_HOST}:3306/$DB_NAME --account-pass=$DXPR_ADMIN_PASSWORD -y -v

# Allow accessing website assets
chmod -R 777 web/sites/default/files

drush -y config-set --input-format=yaml dxpr_builder.settings json_web_token eyJhbGciOiJQUzI1NiIsImtpZCI6IjR6RGRXS1pGNGRfbXprcVVMc2tYb3ItcE96bGRITFN0WGI1Q1pUX3d4UnMifQ.eyJpc3MiOiJodHRwczpcL1wvZHhwci5jb20iLCJzdWIiOiIyMDAyNiIsImF1ZCI6Imh0dHBzOlwvXC9wYWNrYWdlcy5keHByLmNvbSIsInNjb3BlIjoiZHhwclwvZHhwcl9idWlsZGVyIiwiZHhwcl90aWVyIjoiYnVzaW5lc3MiLCJqdGkiOiIyZWU5NTAxZTMxMzc3NDIzOTAyNzMxMTdmZTFmZWIxMTUzOTA5NjEzMDJmZmQxY2U5YjIwMjBjZWM5YjUzNTIwIn0.BXnpSvUCeJl-yBIEpNkncAmTRgm-I9GD0bq0Tu_bH1cXGSNScmLLKEPxA5sndY4VKjQiKg9IN_sUuXZ1Xn3N3NC4ABofYkhOWCYzObh9MOleSGa-AuqYuig4ZAZNJSg-98Q1ULX98hVUSl1EcJx266EDF7cf49cC_AOmq7j9nKLDdaWvXydtTh6p6pYiXaeazw5rqYVnX7IKw9g2IJQ2PI79NjFPLgjtR-sUgEfDP72oaMbOPjBhrwPsmjFWWX2Gh8denebcDJuDGDC3LlGwHDVJ5yY0QCxShBHp_CS0LTkBZPNeubRlaoFhSQ0_R-NS_GDKQN1EYgKCc5tjfabzSb5IRd2vq0FwzyEaacIzpsPrV86KvOPWWm3YNHUGmtC241y5SSyl88DmUL4AppbFV9lL871DGsEBkdmJuN-VxTw3y0aM4-9h-_iBtsZXK9mxshGm3lIgi6BXfsG4nsQJmDt9lQ6jOwYQ87Vm_m73JIhtG3oypnXGw50DTKHCf6meXzcto4pympnV_M9kT-EfSZCAUHNttAI-jlf0KOkkoGZuVOCEDlXhZvPp19LsmDwN6jvKKcMX7MKMggdphbwIaJAGYhPPOaDy4uRQ7wKMg67Z4MSmW_7PnTOAMZ3OcrQGywaHhr7l8BYR8Z6dilBBZlk08EG4C4UK53vxuan9nh4

drush -y config-set --input-format=yaml dxpr_builder.settings media_browser image_browser

### Enable the DXPR analytics
if [ "$DXPR_RECORD_ANALYTICS" = true ] ; then
  echo "Enabling DXPR analytics..."
  drush -y config-set --input-format=yaml dxpr_builder.settings record_analytics true
else
  echo "Disabling DXPR analytics..."
  drush -y config-set --input-format=yaml dxpr_builder.settings record_analytics false
fi

### Enable the DXPR analytics
if [ "$DXPR_HIDE_REMINDERS" = true ] ; then
  echo "Enabling DXPR Hide Reminders..."
  drush -y config-set --input-format=yaml dxpr_builder.settings hide_reminders true
else
  echo "Disabling DXPR Hide Reminders..."
  drush -y config-set --input-format=yaml dxpr_builder.settings hide_reminders false
fi

### Disable the DXPR notifications
if [ "$DXPR_NOTIFICATIONS" = true ] ; then
  echo "Enabling DXPR notifications..."
  drush -y config-set --input-format=yaml dxpr_builder.settings notifications true
else
  echo "Disabling DXPR notifications..."
  drush -y config-set --input-format=yaml dxpr_builder.settings notifications false
fi

### Enable system messages so we fail visual tests on warnings.errors
drush config-set system.logging error_level verbose

# Load editor assets from local (minified) files.
drush -y config-set --input-format=yaml dxpr_builder.settings editor_assets_source 2
drush cr

### Apply optional DXPR CMS recipes
echo "Applying Case Study recipe..."
drush recipe /var/www/html/recipes/dxpr_cms_case_study -y
echo "Applying Events recipe..."
drush recipe /var/www/html/recipes/dxpr_cms_events -y
echo "Applying Forms recipe..."
drush recipe /var/www/html/recipes/dxpr_cms_forms -y
echo "Applying News recipe..."
drush recipe /var/www/html/recipes/dxpr_cms_news -y
echo "Applying SEO Tools recipe..."
drush recipe /var/www/html/recipes/dxpr_cms_seo_tools -y
echo "Applying Multilingual recipe..."
drush recipe /var/www/html/recipes/dxpr_cms_multilingual -y || echo "WARNING: Multilingual recipe failed (known config conflict, skipping)"

# Rebuild theme CSS after recipe changes
drush eval "require_once \Drupal::service('extension.list.theme')->getPath('dxpr_theme') . '/dxpr_theme_callbacks.inc'; dxpr_theme_css_cache_build('dxpr_theme');"
drush cr

# Remove the DXPR access token from the container composer config for security
composer config -g --unset bearer.packages.dxpr.com

# Force set media browser to image_browser
drush -y config-set --input-format=yaml dxpr_builder.settings media_browser image_browser

# Enable AI mode
echo "Enabling DXPR AI mode..."
drush -y config-set --input-format=yaml dxpr_builder.settings ai_enabled 1
drush -y config-set --input-format=yaml dxpr_builder.settings ai_page_enabled 1
drush -y config-set --input-format=yaml dxpr_builder.settings ai_model dxai_kavya_m1
drush -y config-set --input-format=yaml dxpr_builder.settings tone_of_voice_vocabulary dxpr_builder_tone_of_voice
drush -y config-set --input-format=yaml dxpr_builder.settings commands_vocabulary dxpr_builder_commands
