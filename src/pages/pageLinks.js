/**
 * Traverse Puck page data and manage internal page:slug links.
 * Link helpers are defined here to avoid circular imports with pageModel.
 */

const LINK_PROP_KEYS = new Set(['url', 'buttonUrl', 'ctaUrl', 'href', 'link']);

export function isPageLink(url) {
  return typeof url === 'string' && /^page:/i.test(url.trim());
}

export function pageLinkSlug(url) {
  if (!isPageLink(url)) return null;
  return url.trim().replace(/^page:/i, '').replace(/^\/+/, '') || 'home';
}

export function toPageLink(slug) {
  return `page:${slug || 'home'}`;
}

function isComponentNode(node) {
  return Boolean(node && typeof node === 'object' && typeof node.type === 'string' && node.props);
}

/**
 * Walk every value in a Puck document (content, zones, nested props/slots).
 * visitor(node, path) for component nodes; also visits plain objects/arrays.
 */
export function walkPuckData(data, visitor) {
  if (!data || typeof data !== 'object') return;

  function walk(value, path) {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }

    if (isComponentNode(value)) {
      visitor(value, path);
      walk(value.props, `${path}.props`);
      return;
    }

    Object.entries(value).forEach(([key, child]) => {
      if (child && typeof child === 'object') {
        walk(child, path ? `${path}.${key}` : key);
      }
    });
  }

  if (Array.isArray(data.content)) {
    walk(data.content, 'content');
  }
  if (data.root) {
    walk(data.root, 'root');
  }
  if (data.zones && typeof data.zones === 'object') {
    walk(data.zones, 'zones');
  }
}

function collectLinkStrings(props, hits) {
  if (!props || typeof props !== 'object') return;

  Object.entries(props).forEach(([key, value]) => {
    if (typeof value === 'string' && (LINK_PROP_KEYS.has(key) || isPageLink(value))) {
      if (isPageLink(value)) hits.push({ kind: 'prop', key, value });
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        if (typeof item.url === 'string' && isPageLink(item.url)) {
          hits.push({ kind: 'array', key, index, value: item.url, item });
        }
        // Nested objects inside array rows (rare)
        Object.entries(item).forEach(([subKey, subVal]) => {
          if (typeof subVal === 'string' && LINK_PROP_KEYS.has(subKey) && isPageLink(subVal)) {
            hits.push({
              kind: 'arrayProp',
              key,
              index,
              subKey,
              value: subVal,
            });
          }
        });
      });
    }
  });
}

/** Find all page:slug references in one puck document. */
export function findPageLinksInData(data, slug) {
  const matches = [];
  if (!slug) return matches;

  walkPuckData(data, (node) => {
    const hits = [];
    collectLinkStrings(node.props, hits);
    hits.forEach((hit) => {
      if (pageLinkSlug(hit.value) === slug) {
        matches.push({ node, hit });
      }
    });
  });

  return matches;
}

/** Count references to a slug across every page in the project. */
export function countPageLinkReferences(project, slug) {
  let count = 0;
  const pages = project?.pages || [];
  pages.forEach((page) => {
    count += findPageLinksInData(page.puckData, slug).length;
  });
  if (project?.puckData && !pages.length) {
    count += findPageLinksInData(project.puckData, slug).length;
  }
  return count;
}

/**
 * Remove or clear links targeting deletedSlug.
 * - Nav-style array entries with label+url are removed.
 * - Scalar url props (buttons) are cleared to '#'.
 */
export function scrubPageLinksInData(data, deletedSlug) {
  if (!data || !deletedSlug) return data;

  const clone = structuredClone
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));

  walkPuckData(clone, (node) => {
    const props = node.props;
    if (!props) return;

    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string' && LINK_PROP_KEYS.has(key) && pageLinkSlug(value) === deletedSlug) {
        props[key] = '#';
      }

      if (Array.isArray(value)) {
        const next = [];
        value.forEach((item) => {
          if (!item || typeof item !== 'object') {
            next.push(item);
            return;
          }
          if (typeof item.url === 'string' && pageLinkSlug(item.url) === deletedSlug) {
            // Drop navigation-style entries; clear button-like rows that have label + url only as destinations
            const keys = Object.keys(item);
            const looksLikeNav = keys.includes('label') && keys.includes('url') && keys.length <= 4;
            if (looksLikeNav && !keys.includes('style') && !keys.includes('buttonStyle')) {
              return; // remove
            }
            next.push({ ...item, url: '#' });
            return;
          }
          const patched = { ...item };
          let changed = false;
          Object.entries(item).forEach(([subKey, subVal]) => {
            if (
              typeof subVal === 'string' &&
              LINK_PROP_KEYS.has(subKey) &&
              pageLinkSlug(subVal) === deletedSlug
            ) {
              patched[subKey] = '#';
              changed = true;
            }
          });
          next.push(changed ? patched : item);
        });
        props[key] = next;
      }
    });
  });

  return clone;
}

/** Apply scrub across all pages; sync legacy puckData mirror. */
export function scrubDeletedPageLinks(project, deletedSlug) {
  const pages = (project.pages || []).map((page) => ({
    ...page,
    puckData: scrubPageLinksInData(page.puckData, deletedSlug),
  }));
  const home = pages.find((page) => page.role === 'home') || pages[0];
  return {
    ...project,
    pages,
    puckData: home?.puckData || scrubPageLinksInData(project.puckData, deletedSlug),
  };
}

/** Rename keeps slug stable — only update nav labels that point at this page. */
export function updateNavLabelsForPage(project, slug, newTitle) {
  const target = toPageLink(slug);

  function patchData(data) {
    if (!data) return data;
    const clone = structuredClone
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data));

    walkPuckData(clone, (node) => {
      const props = node.props;
      if (!props) return;
      ['navLinks', 'links', 'buttons', 'items'].forEach((key) => {
        if (!Array.isArray(props[key])) return;
        props[key] = props[key].map((item) => {
          if (item && typeof item === 'object' && item.url === target) {
            return { ...item, label: newTitle };
          }
          return item;
        });
      });
    });
    return clone;
  }

  const pages = (project.pages || []).map((page) => ({
    ...page,
    puckData: patchData(page.puckData),
  }));
  const home = pages.find((page) => page.role === 'home') || pages[0];
  return {
    ...project,
    pages,
    puckData: home?.puckData || patchData(project.puckData),
  };
}
