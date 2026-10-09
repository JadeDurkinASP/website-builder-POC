/**
 * Multi-page project helpers. Each page owns a full Puck document.
 */

import {
  buildBlankCanvasTemplate,
  buildHeroTemplate,
} from '../generation/sectionTemplates';

function randomId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function block(type, props, suffix) {
  return {
    type,
    props: {
      id: `${type}-${suffix}-${Math.random().toString(36).slice(2, 8)}`,
      ...props,
    },
  };
}

export function slugify(title) {
  const base = String(title || 'page')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'page';
}

export function uniqueSlug(desired, pages = [], excludeId = null) {
  const existing = new Set(
    (pages || [])
      .filter((page) => page.id !== excludeId)
      .map((page) => page.slug),
  );
  let slug = slugify(desired);
  if (!existing.has(slug)) return slug;
  let index = 2;
  while (existing.has(`${slug}-${index}`)) index += 1;
  return `${slug}-${index}`;
}

export function pageHref(slug) {
  if (!slug || slug === 'home') return '#/';
  return `#/${slug}`;
}

export function parsePageHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '').trim();
  if (!raw || raw === 'home') return 'home';
  return raw.split(/[/?#]/)[0] || 'home';
}

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

export function createBlankPagePuckData({
  event = {},
  branding = {},
  title = 'Page',
  slug = 'page',
} = {}) {
  const eventName = event.name || 'Event name';
  const logoUrl = branding.logoDataUrl || '';

  return {
    content: [
      block(
        'Header',
        {
          eventName,
          logoUrl,
          logoAlt: eventName ? `${eventName} logo` : 'Event logo',
          navLinks: [
            { label: 'Home', url: toPageLink('home') },
            { label: title, url: toPageLink(slug) },
          ],
          buttonLabel: 'Add button label',
          buttonUrl: '#',
          buttonStyle: 'primary',
          styleVariant: 'solid',
        },
        'header',
      ),
      buildHeroTemplate(
        { name: title, description: 'Add a short introduction for this page.' },
        { suffix: 'hero' },
      ),
      buildBlankCanvasTemplate({
        suffix: 'page',
        title: title || 'Page content',
      }),
      block(
        'Footer',
        {
          eventName,
          metaLine: [event.date, event.location].filter(Boolean).join(' · '),
          links: [
            { label: 'Home', url: toPageLink('home') },
            { label: 'Contact', url: '#' },
          ],
          legalNote: 'Demo page created with Composer Rapid. Not a live website.',
          styleVariant: 'solid',
        },
        'footer',
      ),
    ],
    root: {
      props: {
        primaryColour: branding.primaryColour || '#2a3c4c',
        secondaryColour: branding.secondaryColour || '#00a986',
        backgroundColour: branding.backgroundColour || '#ffffff',
        font: branding.font || 'DM Sans',
        designDirection: branding.designDirection || 'bold',
      },
    },
  };
}

export function createHomePageRecord(puckData) {
  return {
    id: randomId('page'),
    slug: 'home',
    title: 'Home',
    role: 'home',
    puckData: puckData || null,
  };
}

/** Minimal valid Puck doc — empty canvas, not a generated demo site. */
export function createBlankHomepage({ branding = {} } = {}) {
  return {
    content: [],
    root: {
      props: {
        primaryColour: branding.primaryColour || '#2a3c4c',
        secondaryColour: branding.secondaryColour || '#00a986',
        backgroundColour: branding.backgroundColour || '#ffffff',
        font: branding.font || 'DM Sans',
        designDirection: branding.designDirection || 'bold',
      },
    },
  };
}

export function isBlankHomepageData(puckData) {
  return Boolean(puckData) && Array.isArray(puckData.content) && puckData.content.length === 0;
}

export function projectHasBlankHomepage(project) {
  const home = getHomePage(project);
  return isBlankHomepageData(home?.puckData || project?.puckData);
}

/** Ensure the project has a blank home page when none exists yet. */
export function ensureBlankHomepage(project) {
  if (projectHasPages(project)) return project;
  return projectFromHomepagePuckData(project, createBlankHomepage({ branding: project?.branding }));
}

/** Merge setup fields without touching pages / puckData. */
export function withSetupDraft(project, draft = {}) {
  return {
    ...project,
    event: draft.event ?? project.event,
    branding: draft.branding ?? project.branding,
    contentAvailability: draft.contentAvailability ?? project.contentAvailability,
    contentSetup: draft.contentSetup ?? project.contentSetup,
    sectionOverrides: draft.sectionOverrides ?? project.sectionOverrides,
    optionalSections: draft.optionalSections ?? project.optionalSections,
  };
}

export function createBlankPage({ title, slug, event, branding, pages = [] } = {}) {
  const safeTitle = (title || 'New page').trim() || 'New page';
  const safeSlug = uniqueSlug(slug || safeTitle, pages);
  return {
    id: randomId('page'),
    slug: safeSlug,
    title: safeTitle,
    role: 'page',
    puckData: createBlankPagePuckData({
      event,
      branding,
      title: safeTitle,
      slug: safeSlug,
    }),
  };
}

export function getPages(project) {
  return Array.isArray(project?.pages) ? project.pages : [];
}

export function getHomePage(project) {
  const pages = getPages(project);
  return pages.find((page) => page.role === 'home') || pages.find((page) => page.slug === 'home') || pages[0] || null;
}

export function getPageById(project, pageId) {
  return getPages(project).find((page) => page.id === pageId) || null;
}

export function getPageBySlug(project, slug) {
  const target = !slug || slug === 'home' ? 'home' : slug;
  const pages = getPages(project);
  if (target === 'home') return getHomePage(project);
  return pages.find((page) => page.slug === target) || null;
}

export function getActivePage(project) {
  const pages = getPages(project);
  if (!pages.length) return null;
  const active = getPageById(project, project.activePageId);
  if (active?.puckData) return active;
  return getHomePage(project);
}

export function projectHasPages(project) {
  return getPages(project).some((page) => page?.puckData);
}

/** Prefer pages; fall back to legacy top-level puckData. */
export function getProjectPuckData(project) {
  const active = getActivePage(project);
  if (active?.puckData) return active.puckData;
  return project?.puckData || null;
}

export function withUpdatedActivePage(project, puckData) {
  const pages = getPages(project);
  if (!pages.length) {
    return {
      ...project,
      puckData,
      pages: puckData ? [createHomePageRecord(puckData)] : [],
      activePageId: project.activePageId || null,
    };
  }

  const activeId = getActivePage(project)?.id;
  const nextPages = pages.map((page) =>
    page.id === activeId ? { ...page, puckData } : page,
  );
  const home = nextPages.find((page) => page.role === 'home') || nextPages[0];

  return {
    ...project,
    pages: nextPages,
    activePageId: activeId || home?.id || null,
    // Keep legacy mirror of home for older tooling / quick checks
    puckData: home?.puckData || null,
  };
}

export function setActivePageId(project, pageId) {
  const page = getPageById(project, pageId);
  if (!page) return project;
  return { ...project, activePageId: page.id };
}

function appendNavLink(puckData, link) {
  if (!puckData?.content) return puckData;
  const content = puckData.content.map((blockItem) => {
    if (blockItem.type !== 'Header') return blockItem;
    const navLinks = [...(blockItem.props?.navLinks || [])];
    if (navLinks.some((item) => item.url === link.url || item.label === link.label)) {
      return blockItem;
    }
    return {
      ...blockItem,
      props: {
        ...blockItem.props,
        navLinks: [...navLinks, link],
      },
    };
  });
  return { ...puckData, content };
}

export function addPageToProject(project, { title } = {}) {
  const page = createBlankPage({
    title,
    event: project.event,
    branding: project.branding,
    pages: getPages(project),
  });

  let pages = [...getPages(project)];
  if (!pages.length && project.puckData) {
    pages = [createHomePageRecord(project.puckData)];
  }

  const link = { label: page.title, url: toPageLink(page.slug) };
  pages = pages.map((existing) => {
    if (existing.role !== 'home' && existing.slug !== 'home') return existing;
    return {
      ...existing,
      puckData: appendNavLink(existing.puckData, link),
    };
  });

  pages = [...pages, page];
  const home = pages.find((item) => item.role === 'home') || pages[0];

  return {
    ...project,
    pages,
    activePageId: page.id,
    puckData: home?.puckData || project.puckData,
  };
}

export function renamePageInProject(project, pageId, title) {
  const safeTitle = (title || '').trim();
  if (!safeTitle) return project;

  const pages = getPages(project).map((page) => {
    if (page.id !== pageId) return page;
    if (page.role === 'home') {
      return { ...page, title: safeTitle };
    }
    const slug = uniqueSlug(safeTitle, getPages(project), pageId);
    return { ...page, title: safeTitle, slug };
  });

  const home = pages.find((page) => page.role === 'home') || pages[0];
  return {
    ...project,
    pages,
    puckData: home?.puckData || project.puckData,
  };
}

export function removePageFromProject(project, pageId) {
  const target = getPageById(project, pageId);
  if (!target || target.role === 'home' || target.slug === 'home') {
    return { ok: false, error: 'The home page cannot be deleted.', project };
  }

  const pages = getPages(project).filter((page) => page.id !== pageId);
  const home = pages.find((page) => page.role === 'home') || pages[0];
  const activeStillExists = pages.some((page) => page.id === project.activePageId);

  return {
    ok: true,
    project: {
      ...project,
      pages,
      activePageId: activeStillExists ? project.activePageId : home?.id || null,
      puckData: home?.puckData || null,
    },
  };
}

export function projectFromHomepagePuckData(project, puckData) {
  const home = createHomePageRecord(puckData);
  return {
    ...project,
    pages: [home],
    activePageId: home.id,
    puckData,
  };
}
