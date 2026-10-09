/**
 * Structural validation for Composer Rapid projects (import / migrate).
 */

import { ELEMENT_TYPES } from '../puck/canvas/constants';
import { walkPuckData } from '../pages/pageLinks';
import { PROJECT_VERSION } from '../constants';

export const SUPPORTED_COMPONENT_TYPES = new Set([
  'Header',
  'Hero',
  'Introduction',
  'Stats',
  'Testimonials',
  'Speakers',
  'Sponsors',
  'Faqs',
  'Highlights',
  'Information',
  'CustomSection',
  'CallToAction',
  'Footer',
  'CanvasSection',
  ...ELEMENT_TYPES,
]);

export function isValidPuckDataShape(value) {
  if (value == null) return true;
  if (typeof value !== 'object') return false;
  if (!Array.isArray(value.content)) return false;
  if (!value.root || typeof value.root !== 'object') return false;
  return true;
}

function validateNestedStructure(data, errors, label) {
  if (!data) return;
  const seenIds = new Set();

  walkPuckData(data, (node, path) => {
    if (!SUPPORTED_COMPONENT_TYPES.has(node.type)) {
      errors.push(
        `${label}: unsupported component type “${node.type}” at ${path}. Legacy sections must use a registered type.`,
      );
    }
    const id = node.props?.id;
    if (typeof id !== 'string' || !id.trim()) {
      errors.push(`${label}: component “${node.type}” at ${path} is missing a valid id.`);
      return;
    }
    if (seenIds.has(id)) {
      errors.push(`${label}: duplicate component id “${id}”.`);
    }
    seenIds.add(id);

    // Nested slot arrays (elements, dropCatch, etc.)
    Object.entries(node.props || {}).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;
      value.forEach((child, index) => {
        if (!child || typeof child !== 'object') return;
        if (typeof child.type === 'string' && child.props) {
          // Walked via walkPuckData already when nested under props
          return;
        }
        if (child.type && !child.props) {
          errors.push(
            `${label}: nested item in “${key}[${index}]” under ${path} is missing props.`,
          );
        }
      });
    });
  });
}

/**
 * Validate a project object before import. Returns { ok, errors, warnings }.
 */
export function validateProjectForImport(raw) {
  const errors = [];
  const warnings = [];

  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['File does not contain a project object.'], warnings };
  }

  const version = Number(raw.version);
  if (![1, 2, 3, 4].includes(version) && version !== PROJECT_VERSION) {
    if (!Number.isFinite(version) || version < 1) {
      errors.push('Project version is missing or invalid.');
    } else if (version > PROJECT_VERSION) {
      errors.push(
        `This project is version ${version}, which is newer than this demo supports (v${PROJECT_VERSION}).`,
      );
    }
  }

  if (!raw.event || typeof raw.event !== 'object') {
    errors.push('Project is missing an event object.');
  }
  if (!raw.branding || typeof raw.branding !== 'object') {
    errors.push('Project is missing a branding object.');
  }

  if (raw.puckData != null && !isValidPuckDataShape(raw.puckData)) {
    errors.push('Top-level puckData is not a valid Puck document.');
  }

  const pages = raw.pages;
  if (pages != null) {
    if (!Array.isArray(pages)) {
      errors.push('pages must be an array when present.');
    } else {
      const ids = new Set();
      const slugs = new Set();
      pages.forEach((page, index) => {
        if (!page || typeof page !== 'object') {
          errors.push(`Page at index ${index} is invalid.`);
          return;
        }
        if (typeof page.id !== 'string' || !page.id.trim()) {
          errors.push(`Page at index ${index} needs a string id.`);
        } else if (ids.has(page.id)) {
          errors.push(`Duplicate page id “${page.id}”.`);
        } else {
          ids.add(page.id);
        }
        if (typeof page.slug !== 'string' || !page.slug.trim()) {
          errors.push(`Page “${page.id || index}” needs a slug.`);
        } else if (slugs.has(page.slug)) {
          errors.push(`Duplicate page slug “${page.slug}”.`);
        } else {
          slugs.add(page.slug);
        }
        if (page.puckData != null && !isValidPuckDataShape(page.puckData)) {
          errors.push(`Page “${page.slug || page.id}” has invalid puckData.`);
        } else if (page.puckData) {
          validateNestedStructure(page.puckData, errors, `Page “${page.slug || page.id}”`);
        }
      });

      if (raw.activePageId != null && pages.length > 0) {
        if (!ids.has(raw.activePageId)) {
          errors.push('activePageId does not match any page id.');
        }
      }
    }
  } else if (raw.puckData) {
    validateNestedStructure(raw.puckData, errors, 'Homepage');
  }

  if (raw.contentSetup != null && typeof raw.contentSetup !== 'object') {
    errors.push('contentSetup must be an object when present.');
  }
  if (raw.contentSetup?.assets != null && !Array.isArray(raw.contentSetup.assets)) {
    errors.push('contentSetup.assets must be an array.');
  }

  return { ok: errors.length === 0, errors, warnings };
}
