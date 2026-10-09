import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getPageBySlug,
  isPageLink,
  pageHref,
  pageLinkSlug,
  parsePageHash,
} from './pageModel';

function defaultResolveHref(url) {
  if (!isPageLink(url)) return url || '#';
  return pageHref(pageLinkSlug(url));
}

const PageLinkContext = createContext({
  mode: 'editor',
  currentSlug: 'home',
  navigateToPage: () => {},
  resolveHref: defaultResolveHref,
});

export function PageLinkProvider({ project, mode = 'preview', children }) {
  const [currentSlug, setCurrentSlug] = useState(() => parsePageHash(window.location.hash));

  useEffect(() => {
    if (mode !== 'preview') return undefined;

    function onHashChange() {
      setCurrentSlug(parsePageHash(window.location.hash));
    }

    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [mode]);

  const navigateToPage = useCallback(
    (slug) => {
      if (mode !== 'preview') return;
      const next = pageHref(slug);
      if (window.location.hash !== next) {
        window.location.hash = next;
      } else {
        setCurrentSlug(parsePageHash(next));
      }
    },
    [mode],
  );

  const resolveHref = useCallback((url) => {
    if (!isPageLink(url)) return url || '#';
    const slug = pageLinkSlug(url);
    return pageHref(slug);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      currentSlug: mode === 'preview' ? currentSlug : 'home',
      navigateToPage,
      resolveHref,
      project,
      previewPage: getPageBySlug(project, currentSlug) || getPageBySlug(project, 'home'),
    }),
    [mode, currentSlug, navigateToPage, resolveHref, project],
  );

  return <PageLinkContext.Provider value={value}>{children}</PageLinkContext.Provider>;
}

export function usePageLinks() {
  return useContext(PageLinkContext);
}

export function PageAnchor({ href, className, children, onClick, style, ...rest }) {
  const { mode, navigateToPage, resolveHref } = usePageLinks();
  const resolved = resolveHref(href);
  const isEditor = mode !== 'preview';

  function handleClick(event) {
    onClick?.(event);

    // Block real navigation in the editor iframe (avoids nesting the app in the canvas).
    if (isEditor) {
      event.preventDefault();
      event.stopPropagation();
      if (isPageLink(href)) {
        window.alert('Switch page using the page strip above the editor.');
      }
      return;
    }

    if (!isPageLink(href)) return;
    event.preventDefault();
    navigateToPage(pageLinkSlug(href));
  }

  return (
    <a
      className={className}
      style={style}
      {...rest}
      href={isEditor ? '#' : resolved}
      onClick={handleClick}
      draggable={isEditor ? false : rest.draggable}
    >
      {children}
    </a>
  );
}
