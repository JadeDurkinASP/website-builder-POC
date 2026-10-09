import { useEffect, useMemo, useState } from 'react';
import { Render } from '@puckeditor/core';
import { AssetProvider } from '../assets/AssetResolver';
import {
  getHomePage,
  getPageBySlug,
  getPages,
  pageHref,
  parsePageHash,
} from '../pages/pageModel';
import { PageLinkProvider } from '../pages/PageLinkContext';
import { puckConfig } from '../puck/config';
import { needsContent } from '../puck/placeholder.jsx';

const PLACEHOLDER_BUTTON_LABELS = new Set([
  'add button label',
  'primary action',
  'secondary action',
]);

function hasFinishedButton(props = {}) {
  const candidates = [];
  if (props.buttonLabel?.trim()) {
    candidates.push({ label: props.buttonLabel, url: props.buttonUrl });
  }
  if (props.ctaLabel?.trim()) {
    candidates.push({ label: props.ctaLabel, url: props.ctaUrl });
  }
  (props.buttons || []).forEach((button) => {
    if (button?.label?.trim()) {
      candidates.push({ label: button.label, url: button.url });
    }
  });

  return candidates.some((button) => {
    const label = button.label.trim().toLowerCase();
    const url = (button.url || '').trim();
    return !PLACEHOLDER_BUTTON_LABELS.has(label) && url && url !== '#';
  });
}

function getCompleteness(project, puckData) {
  const content = puckData?.content || [];
  const buttonBlocks = content.filter((block) =>
    ['Header', 'Hero', 'CallToAction'].includes(block.type),
  );
  const hasPrimaryAction = buttonBlocks.some((block) => hasFinishedButton(block.props || {}));

  return [
    {
      key: 'name',
      label: 'Event name',
      ok: Boolean(project.event?.name?.trim()),
    },
    {
      key: 'date',
      label: 'Date',
      ok: Boolean(project.event?.date?.trim()),
    },
    {
      key: 'location',
      label: 'Location or online format',
      ok: Boolean(project.event?.location?.trim()),
    },
    {
      key: 'cta',
      label: 'Primary action button (label and link in editor)',
      ok: hasPrimaryAction,
    },
  ];
}

function findIncompleteSections(puckData) {
  const content = puckData?.content || [];
  return content
    .filter((block) => needsContent(block.props || {}))
    .map((block) => block.props?.heading || block.type);
}

export function PreviewScreen({ project, onBackToEditor }) {
  const [viewport, setViewport] = useState('desktop');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [slug, setSlug] = useState(() => parsePageHash(window.location.hash));

  useEffect(() => {
    function onHashChange() {
      setSlug(parsePageHash(window.location.hash));
    }
    // Default to home when entering preview without a page hash
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '/';
    }
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const pages = getPages(project);
  const previewPage =
    getPageBySlug(project, slug) || getHomePage(project) || { puckData: project.puckData };
  const puckData = previewPage?.puckData || project.puckData;
  const checks = getCompleteness(project, puckData);
  const incomplete = useMemo(() => findIncompleteSections(puckData), [puckData]);

  return (
    <AssetProvider assetMetas={project.contentSetup?.assets || []}>
      <PageLinkProvider project={project} mode="preview">
        <div className="cr-preview-screen">
          <header className="cr-preview-toolbar">
            <div className="cr-builder-brand">
              <strong>Composer Rapid</strong>
              <span>
                Preview — {project.event?.name || 'Untitled event'}
                {previewPage?.title ? ` / ${previewPage.title}` : ''}
              </span>
            </div>
            <div className="cr-preview-toolbar__group">
              <button
                type="button"
                className={`cr-btn cr-btn--ghost ${viewport === 'desktop' ? 'cr-btn--brand' : ''}`}
                onClick={() => setViewport('desktop')}
                aria-pressed={viewport === 'desktop'}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`cr-btn cr-btn--ghost ${viewport === 'mobile' ? 'cr-btn--brand' : ''}`}
                onClick={() => setViewport('mobile')}
                aria-pressed={viewport === 'mobile'}
              >
                Mobile
              </button>
              <button type="button" className="cr-btn cr-btn--ghost" onClick={onBackToEditor}>
                Back to editor
              </button>
              <button
                type="button"
                className="cr-btn cr-btn--brand"
                onClick={() => setShowPublishModal(true)}
              >
                Simulate publishing
              </button>
            </div>
          </header>

          {pages.length > 1 ? (
            <div className="cr-page-strip cr-page-strip--preview" role="navigation" aria-label="Preview pages">
              <div className="cr-page-strip__list">
                {pages.map((page) => {
                  const pageSlug = page.role === 'home' || page.slug === 'home' ? 'home' : page.slug;
                  const active = pageSlug === slug;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      className={`cr-page-strip__tab ${active ? 'cr-page-strip__item--active' : ''}`}
                      onClick={() => {
                        window.location.hash = pageHref(page.slug);
                      }}
                      aria-current={active ? 'page' : undefined}
                    >
                      {page.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="cr-setup" style={{ paddingTop: '1rem', paddingBottom: 0, maxWidth: 920 }}>
            {incomplete.length > 0 ? (
              <section className="cr-panel cr-banner--warn" aria-labelledby="incomplete-heading">
                <h2 id="incomplete-heading">Demo notice — incomplete content</h2>
                <p className="cr-field-hint">
                  Some sections still use guidance placeholders. This preview is for the demo only and
                  does not mean the page is ready for a live audience.
                </p>
                <ul className="cr-checklist">
                  {incomplete.map((label) => (
                    <li key={label} className="cr-checklist__missing">
                      <span aria-hidden="true">!</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="cr-panel" aria-labelledby="completeness-heading">
              <h2 id="completeness-heading">Demo completeness check</h2>
              <p className="cr-field-hint">
                This checklist only looks for missing event name, date, location and primary action. It
                does not certify accessibility or production readiness.
              </p>
              <ul className="cr-checklist" style={{ marginTop: '0.85rem' }}>
                {checks.map((check) => (
                  <li
                    key={check.key}
                    className={check.ok ? 'cr-checklist__ok' : 'cr-checklist__missing'}
                  >
                    <span aria-hidden="true">{check.ok ? '✓' : '!'}</span>
                    <span>
                      {check.label}
                      {check.ok ? ' provided' : ' missing'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="cr-preview-stage">
            <div
              className={`cr-preview-frame cr-preview-frame--${viewport}`}
              data-viewport={viewport}
            >
              {puckData ? <Render config={puckConfig} data={puckData} /> : null}
            </div>
          </div>

          {showPublishModal ? (
            <div className="cr-modal-backdrop" role="presentation">
              <div
                className="cr-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="publish-modal-title"
              >
                <h2 id="publish-modal-title">Simulated publishing</h2>
                <p>
                  Demo complete — your website would now be ready to publish. No website has been
                  deployed.
                </p>
                <div className="cr-modal__actions">
                  <button
                    type="button"
                    className="cr-btn cr-btn--brand"
                    onClick={() => setShowPublishModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </PageLinkProvider>
    </AssetProvider>
  );
}
