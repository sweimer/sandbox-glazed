# DXPR Builder

**DXPR Builder** provides a visual, drag-and-drop page-building experience for Drupal websites.  
It replaces complex back-end forms with a front-end editor, built on top of Drupal’s Entity API (revisions, translations, permissions).

DXPR Builder is compatible with any Drupal theme and uses the Bootstrap grid system.

---

## Requirements

- Drupal 10 or 11
- PHP 8.1 or higher
- No core patches required

Recommended modules:

- https://www.drupal.org/project/dxpr_theme — for optimized styling presets  
- https://www.drupal.org/project/key — for secure AI credential storage

---

## Installation

Install the module using Composer:

```bash
composer require drupal/dxpr_builder
```

Alternatively, download the release package from the project page:  
https://www.drupal.org/project/dxpr_builder/releases

Enable the module:

```bash
drush en dxpr_builder
```

(Or enable it through the Drupal administrative UI.)

If you plan to use the built-in page content type, also enable the optional `DXPR Builder Page` sub-module.

---

## Configuration

1. **Grant permissions**  
   Go to: `/admin/people/permissions`  
   Assign the `"Edit with DXPR Builder"` permission to the appropriate user roles.

2. **Enter a product key**  
   Go to: `/admin/config/dxpr_builder/settings`  
   Get a free product key instantly at: https://dxpr.com/content/dxpr-builder-free-registration  
   Personal and nonprofit sites can use DXPR Builder for free.

3. **Set up text formats**  
   Go to: `/admin/config/content/formats`  
   Edit or create a text format and enable the DXPR Builder editor.  
   Assign it to the appropriate fields on your content types.

4. **(Optional) Customize DXPR Builder per role**  
   Go to: `/admin/dxpr_studio/dxpr_builder/profile`  
   Add a DXPR Builder Profile to define which content elements are available for specific roles.  
   You can also choose whether the DXPR Editor is always enabled or manually triggered.

---

## Features

- **Visual no-code page building**
  - Drag-and-drop rows, columns, and 30+ content elements.
  - Built-in responsive design for mobile, tablet, and desktop.

- **DXAI Writing (Beta)**
  - Slash commands (e.g., `/write a blog post about Drupal 12`) inside CKEditor 5.
  - Long-form text generation with optional web research and citations.
  - AI token costs are covered during the beta period.

- **Deep Drupal integration**
  - Native integration with Entity API (revisions, translations, permissions).
  - Seamless Media Library and enterprise DAM access.
  - Compatible with Layout Builder, Views, Webform, and other core modules.

- **Governance and brand control**
  - Role-based Builder Profiles and design element locking.
  - Revisioning of every edit for easy review and rollback.

- **Performance and accessibility**
  - Optimized CSS output and smart image loading.
  - Keyboard navigation, screen reader compatibility, and reduced-motion support.

---

## Typical Use Cases

- Marketing teams publishing landing pages without developer involvement.
- Editors using safe, pre-approved component libraries.
- Content teams drafting and translating content faster with AI assistance.

---

## Support and Contribution

DXPR Builder is maintained by the DXPR team and community contributors.

- Issue queue: https://www.drupal.org/project/issues/dxpr_builder  
- Community channel: `#dxpr` on https://drupal.slack.com/messages/dxpr

---

## License

This project is licensed under the GNU General Public License, version 2 or later:  
https://www.gnu.org/licenses/old-licenses/gpl-2.0.html

---

## Related Projects

- https://www.drupal.org/project/ckeditor_ai_agent  
- https://www.drupal.org/project/dxpr_theme  
- https://www.drupal.org/project/dxpr_marketing_cms
