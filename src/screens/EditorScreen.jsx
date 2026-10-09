import { useEffect, useMemo, useRef, useState } from 'react';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { AssetProvider } from '../assets/AssetResolver';
import { buildSampleProject } from '../data/sampleEvent';
import { countPageLinkReferences } from '../pages/pageLinks';
import {
  addPageToProject,
  getActivePage,
  getPages,
  removePageFromProject,
  renamePageInProject,
  setActivePageId,
  withUpdatedActivePage,
} from '../pages/pageModel';
import { PageLinkProvider } from '../pages/PageLinkContext';
import { puckConfig } from '../puck/config';
import { applyWebsiteBrandingToProject } from '../state/projectSnapshot';
import {
  exportProjectAsJson,
  exportProjectBundle,
  importProjectFromFile,
  saveProject,
} from '../storage/projectStorage';
import { ConfirmDialog, PromptDialog } from '../ui/AppDialog';
import { createBrandPlugin } from './editor/BrandPlugin';
import { EditorChromeProvider } from './editor/EditorChromeContext';
import { editorHeaderOverride } from './editor/EditorTopBar';
import { createElementsPlugin } from './editor/ElementsPlugin';
import { GettingStartedPanel } from './editor/GettingStartedPanel';
import { InspectorFields } from './editor/InspectorFields';
import { createLayersPlugin } from './editor/LayersPlugin';
import { createPagesPlugin } from './editor/PageStrip';
import { createSectionsPlugin } from './editor/SectionsPlugin';
import { SourceContentPanel } from './editor/SourceContentPanel';

const VIEWPORTS = [
  { width: 1280, height: 'auto', label: 'Desktop', icon: 'Monitor' },
  { width: 390, height: 'auto', label: 'Mobile', icon: 'Smartphone' },
];

function persistActiveData(project, data) {
  return withUpdatedActivePage(project, data);
}

export function EditorScreen({
  project,
  dirty,
  saveError: saveErrorFromApp = '',
  onProjectChange,
  onSaveProject,
  onPreview,
  onRequestReset,
  onEditSetup,
  onImported,
  setupTriggerRef,
  readyMessage = '',
  onClearReadyMessage,
  setupOpen = false,
}) {
  const [localError, setLocalError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [puckKey, setPuckKey] = useState(0);
  const [guideStatus, setGuideStatus] = useState('');
  const importInputRef = useRef(null);
  const localSetupTriggerRef = useRef(null);
  const setupButtonRef = setupTriggerRef || localSetupTriggerRef;
  const activePage = getActivePage(project);
  const latestDataRef = useRef(activePage?.puckData || project.puckData);

  const [pagePrompt, setPagePrompt] = useState(null);
  const [pageConfirm, setPageConfirm] = useState(null);
  const [replaceConfirm, setReplaceConfirm] = useState(null);
  const [jsonImportConfirm, setJsonImportConfirm] = useState(null);

  const saveError = saveErrorFromApp || localError;
  const showGettingStarted =
    Boolean(readyMessage) && !project.editorHints?.gettingStartedDismissed;

  useEffect(() => {
    if (!readyMessage) return undefined;
    const timer = window.setTimeout(() => onClearReadyMessage?.(), 8000);
    return () => window.clearTimeout(timer);
  }, [readyMessage, onClearReadyMessage]);

  useEffect(() => {
    latestDataRef.current = activePage?.puckData || project.puckData;
  }, [activePage?.id, activePage?.puckData, project.puckData]);

  useEffect(() => {
    function onAssetAdded(event) {
      const meta = event.detail?.meta;
      if (!meta) return;
      onProjectChange((current) => {
        const assets = current.contentSetup?.assets || [];
        if (assets.some((asset) => asset.id === meta.id)) return current;
        return {
          ...current,
          contentSetup: {
            ...current.contentSetup,
            assets: [...assets, meta],
          },
        };
      });
    }
    window.addEventListener('composer-rapid:asset-added', onAssetAdded);
    return () => window.removeEventListener('composer-rapid:asset-added', onAssetAdded);
  }, [onProjectChange]);

  function commitData(baseProject, data) {
    return persistActiveData(baseProject, data);
  }

  function handleChange(data) {
    latestDataRef.current = data;
    onProjectChange(commitData(project, data));
  }

  function handleSave(data) {
    const next = commitData(project, data || latestDataRef.current);
    const result = onSaveProject(next);
    if (!result?.ok) {
      setLocalError(result?.error || 'Could not save.');
    } else {
      setLocalError('');
      setStatusMessage('Saved locally.');
    }
  }

  function flushThen(mutator) {
    const flushed = commitData(project, latestDataRef.current);
    const next = mutator(flushed);
    onProjectChange(next);
    setPuckKey((value) => value + 1);
    return next;
  }

  function handleSelectPage(pageId) {
    if (pageId === activePage?.id) return;
    flushThen((current) => setActivePageId(current, pageId));
  }

  function handleAddPage() {
    setPagePrompt({
      mode: 'add',
      title: 'Add page',
      label: 'Page title',
      defaultValue: 'New page',
      confirmLabel: 'Add page',
    });
  }

  function handleRenamePage(pageId) {
    const page = getPages(project).find((item) => item.id === pageId);
    if (!page) return;
    setPagePrompt({
      mode: 'rename',
      pageId,
      title: 'Rename page',
      label: 'Page title',
      defaultValue: page.title,
      confirmLabel: 'Rename',
    });
  }

  function handleDeletePage(pageId) {
    const page = getPages(project).find((item) => item.id === pageId);
    if (!page || page.role === 'home' || page.slug === 'home') {
      setLocalError('The home page cannot be deleted.');
      return;
    }
    const flushed = commitData(project, latestDataRef.current);
    const linkCount = countPageLinkReferences(flushed, page.slug);

    const message =
      linkCount > 0
        ? `Delete page “${page.title}”? ${linkCount} internal link(s) to this page will be removed from navigation and cleared on buttons/text links. Page content elsewhere is kept. This cannot be undone.`
        : `Delete page “${page.title}”? This cannot be undone.`;

    setPageConfirm({
      pageId,
      title: 'Delete page',
      message,
      confirmLabel: 'Delete page',
    });
  }

  function confirmPagePrompt(title) {
    const prompt = pagePrompt;
    setPagePrompt(null);
    if (!prompt) return;
    if (prompt.mode === 'add') {
      flushThen((current) => addPageToProject(current, { title }));
      setLocalError('');
      setStatusMessage(`Page “${title}” added.`);
      return;
    }
    if (prompt.mode === 'rename') {
      flushThen((current) => renamePageInProject(current, prompt.pageId, title));
      setStatusMessage('Page renamed. Internal links keep working (slug unchanged).');
    }
  }

  function confirmPageDelete() {
    const pending = pageConfirm;
    setPageConfirm(null);
    if (!pending) return;
    flushThen((current) => {
      const result = removePageFromProject(current, pending.pageId);
      if (!result.ok) {
        setLocalError(result.error);
        return current;
      }
      setLocalError('');
      const linkNote =
        result.clearedLinkCount > 0
          ? ` Cleared ${result.clearedLinkCount} internal link(s).`
          : '';
      setStatusMessage(`Deleted “${result.deletedTitle}”.${linkNote}`);
      return result.project;
    });
  }

  function handleWebsiteBranding(patch) {
    const flushed = commitData(project, latestDataRef.current);
    const next = applyWebsiteBrandingToProject(flushed, patch);
    onProjectChange(next);
    setPuckKey((value) => value + 1);
  }

  function handleExportJson() {
    const result = exportProjectAsJson(commitData(project, latestDataRef.current));
    setStatusMessage(result.warning || 'Exported JSON (without attachments).');
  }

  async function handleExportBundle() {
    try {
      const result = await exportProjectBundle(commitData(project, latestDataRef.current));
      setLocalError('');
      if (result.warning) {
        setStatusMessage(result.warning);
      } else {
        setStatusMessage(
          `Exported project with ${result.assetCount ?? 0} attachment(s).`,
        );
      }
    } catch (error) {
      setLocalError(error.message || 'Bundle export failed.');
    }
  }

  async function runImport(file, options = {}) {
    if (!file) return;
    try {
      const imported = await importProjectFromFile(file, options);
      const nextProject = imported.project || imported;
      const result = saveProject(nextProject);
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }
      onImported(result.project);
      setLocalError('');
      setStatusMessage(
        imported.warning ||
          (imported.kind === 'bundle'
            ? 'Imported project with attachments.'
            : 'Imported project.'),
      );
    } catch (error) {
      if (error.code === 'JSON_WITHOUT_ATTACHMENTS' && error.project) {
        setJsonImportConfirm({ file, project: error.project, message: error.message });
        return;
      }
      setLocalError(error.message || 'Import failed.');
    }
  }

  function requestReplaceAction(action) {
    if (!dirty) {
      action();
      return;
    }
    setReplaceConfirm({ action });
  }

  function handleLoadSample() {
    requestReplaceAction(() => {
      const sample = buildSampleProject({ withHomepage: true });
      const result = saveProject(sample);
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }
      onImported(result.project);
      setLocalError('');
      setStatusMessage('Sample event loaded.');
    });
  }

  function goPreview() {
    onProjectChange(commitData(project, latestDataRef.current));
    onPreview();
  }

  function dismissGettingStarted() {
    onProjectChange({
      ...commitData(project, latestDataRef.current),
      editorHints: {
        ...(project.editorHints || {}),
        gettingStartedDismissed: true,
      },
    });
    onClearReadyMessage?.();
  }

  const pages = getPages(project);
  const puckData = activePage?.puckData || project.puckData;

  const puckPlugins = useMemo(() => {
    const pagesPlugin = createPagesPlugin({
      pages,
      activePageId: activePage?.id,
      onSelect: handleSelectPage,
      onAdd: handleAddPage,
      onRename: handleRenamePage,
      onDelete: handleDeletePage,
    });
    return [
      pagesPlugin,
      createElementsPlugin(),
      createSectionsPlugin(),
      createLayersPlugin(),
      createBrandPlugin({
        branding: project.branding,
        onBrandingChange: handleWebsiteBranding,
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, activePage?.id, project.branding, project]);

  const chromeValue = useMemo(
    () => ({
      projectName: project.event?.name?.trim() || 'Untitled site',
      pages,
      activePageId: activePage?.id,
      dirty,
      saveError,
      statusMessage,
      readyMessage,
      setupButtonRef,
      onSelectPage: handleSelectPage,
      onPreview: goPreview,
      onSave: () => handleSave(),
      onEditSetup,
      onOpenSource: () => setSourceOpen(true),
      onExportJson: handleExportJson,
      onExportBundle: handleExportBundle,
      onImportProject: () => importInputRef.current?.click(),
      onLoadSample: handleLoadSample,
      onReset: onRequestReset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      project.event?.name,
      pages,
      activePage?.id,
      dirty,
      saveError,
      statusMessage,
      readyMessage,
      setupButtonRef,
    ],
  );

  if (!puckData) {
    return (
      <div className="cr-editor-screen" {...(setupOpen ? { inert: true } : {})}>
        <p className="cr-banner cr-banner--error">No page content found. Open website setup.</p>
        <button
          ref={setupButtonRef}
          type="button"
          className="cr-btn cr-btn--brand"
          onClick={onEditSetup}
        >
          Website setup
        </button>
      </div>
    );
  }

  return (
    <AssetProvider assetMetas={project.contentSetup?.assets || []}>
      <PageLinkProvider project={project} mode="editor">
        <EditorChromeProvider value={chromeValue}>
          <div
            className={`cr-editor-screen ${setupOpen ? 'cr-editor-screen--behind-setup' : ''}`}
            {...(setupOpen ? { inert: true, 'aria-hidden': true } : {})}
          >
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                requestReplaceAction(() => runImport(file));
                e.target.value = '';
              }}
            />

            <div className="cr-editor-layout">
              <div className="cr-editor-frame">
                <Puck
                  key={`${activePage?.id || 'page'}-${puckKey}`}
                  config={puckConfig}
                  data={puckData}
                  headerTitle={activePage?.title || project.event?.name || 'Composer Rapid'}
                  viewports={VIEWPORTS}
                  plugins={puckPlugins}
                  onChange={handleChange}
                  onPublish={handleSave}
                  dictionary={{
                    'header-publish': 'Save',
                  }}
                  overrides={{
                    header: editorHeaderOverride,
                    fields: InspectorFields,
                  }}
                  iframe={{
                    syncHostStyles: true,
                  }}
                />
                {showGettingStarted ? (
                  <GettingStartedPanel
                    onDismiss={dismissGettingStarted}
                    onStatus={setGuideStatus}
                  />
                ) : null}
                {guideStatus ? (
                  <p className="cr-getting-started__status" role="status">
                    {guideStatus}
                  </p>
                ) : null}
              </div>
              <SourceContentPanel
                contentSetup={project.contentSetup}
                open={sourceOpen}
                onClose={() => setSourceOpen(false)}
              />
            </div>
          </div>

          <PromptDialog
            open={Boolean(pagePrompt)}
            title={pagePrompt?.title || ''}
            label={pagePrompt?.label || 'Title'}
            defaultValue={pagePrompt?.defaultValue || ''}
            confirmLabel={pagePrompt?.confirmLabel || 'Save'}
            validate={(value) => (!value ? 'Enter a page title.' : '')}
            onCancel={() => setPagePrompt(null)}
            onConfirm={confirmPagePrompt}
          />

          <ConfirmDialog
            open={Boolean(pageConfirm)}
            title={pageConfirm?.title || 'Confirm'}
            message={pageConfirm?.message || ''}
            confirmLabel={pageConfirm?.confirmLabel || 'Confirm'}
            danger
            onCancel={() => setPageConfirm(null)}
            onConfirm={confirmPageDelete}
          />

          <ConfirmDialog
            open={Boolean(replaceConfirm)}
            title="Replace unsaved work?"
            message="You have unsaved changes. Continuing will replace the current project. Cancel to keep editing."
            confirmLabel="Continue"
            danger
            onCancel={() => setReplaceConfirm(null)}
            onConfirm={() => {
              const action = replaceConfirm?.action;
              setReplaceConfirm(null);
              action?.();
            }}
          />

          <ConfirmDialog
            open={Boolean(jsonImportConfirm)}
            title="Import JSON without attachments?"
            message={
              jsonImportConfirm?.message ||
              'This JSON file does not include uploaded files. Import the layout only?'
            }
            confirmLabel="Import layout only"
            onCancel={() => setJsonImportConfirm(null)}
            onConfirm={() => {
              const pending = jsonImportConfirm;
              setJsonImportConfirm(null);
              if (!pending?.file) return;
              runImport(pending.file, { allowJsonWithoutAttachments: true });
            }}
          />
        </EditorChromeProvider>
      </PageLinkProvider>
    </AssetProvider>
  );
}
