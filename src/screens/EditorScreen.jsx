import { useEffect, useMemo, useRef, useState } from 'react';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { AssetProvider } from '../assets/AssetResolver';
import { buildSampleProject } from '../data/sampleEvent';
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
import {
  clearProject,
  exportProjectAsJson,
  exportProjectBundle,
  importProjectFromFile,
  saveProject,
} from '../storage/projectStorage';
import { createBrandPlugin } from './editor/BrandPlugin';
import { EditorChromeProvider } from './editor/EditorChromeContext';
import { editorHeaderOverride } from './editor/EditorTopBar';
import { createElementsPlugin } from './editor/ElementsPlugin';
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

function snapshotKey(project) {
  try {
    return JSON.stringify(project);
  } catch {
    return '';
  }
}

export function EditorScreen({
  project,
  onProjectChange,
  onPreview,
  onResetToSetup,
  onEditSetup,
  onImported,
  setupTriggerRef,
  readyMessage = '',
  onClearReadyMessage,
  setupOpen = false,
}) {
  const [saveError, setSaveError] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotKey(project));
  const [sourceOpen, setSourceOpen] = useState(false);
  const [puckKey, setPuckKey] = useState(0);
  const importInputRef = useRef(null);
  const bundleInputRef = useRef(null);
  const localSetupTriggerRef = useRef(null);
  const setupButtonRef = setupTriggerRef || localSetupTriggerRef;
  const activePage = getActivePage(project);
  const latestDataRef = useRef(activePage?.puckData || project.puckData);

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

  function commitData(data, baseProject = project) {
    const next = persistActiveData(baseProject, data);
    const rootProps = data?.root?.props || {};
    return {
      ...next,
      branding: {
        ...next.branding,
        primaryColour: rootProps.primaryColour ?? next.branding.primaryColour,
        secondaryColour: rootProps.secondaryColour ?? next.branding.secondaryColour,
        backgroundColour: rootProps.backgroundColour ?? next.branding.backgroundColour,
        font: rootProps.font ?? next.branding.font,
        designDirection: rootProps.designDirection ?? next.branding.designDirection,
      },
    };
  }

  function handleChange(data) {
    latestDataRef.current = data;
    onProjectChange(commitData(data));
  }

  function handleSave(data) {
    const next = commitData(data || latestDataRef.current);
    const result = saveProject(next);
    if (result.ok) {
      onProjectChange(result.project);
      setSavedSnapshot(snapshotKey(result.project));
      setSaveError('');
    } else {
      setSaveError(result.error || 'Could not save.');
    }
  }

  function flushThen(mutator) {
    const flushed = commitData(latestDataRef.current);
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
    const title = window.prompt('Page title', 'New page');
    if (title == null) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setSaveError('Enter a page title.');
      return;
    }
    flushThen((current) => addPageToProject(current, { title: trimmed }));
    setSaveError('');
  }

  function handleRenamePage(pageId) {
    const page = getPages(project).find((item) => item.id === pageId);
    if (!page) return;
    const title = window.prompt('Rename page', page.title);
    if (title == null) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    flushThen((current) => renamePageInProject(current, pageId, trimmed));
  }

  function handleDeletePage(pageId) {
    const page = getPages(project).find((item) => item.id === pageId);
    if (!page || page.role === 'home') return;
    const confirmed = window.confirm(`Delete page “${page.title}”? This cannot be undone.`);
    if (!confirmed) return;
    flushThen((current) => {
      const result = removePageFromProject(current, pageId);
      if (!result.ok) {
        setSaveError(result.error);
        return current;
      }
      setSaveError('');
      return result.project;
    });
  }

  function handleExportJson() {
    exportProjectAsJson(commitData(latestDataRef.current));
  }

  async function handleExportBundle() {
    try {
      await exportProjectBundle(commitData(latestDataRef.current));
      setSaveError('');
    } catch (error) {
      setSaveError(error.message || 'Bundle export failed.');
    }
  }

  async function handleImport(file) {
    if (!file) return;
    try {
      const imported = await importProjectFromFile(file);
      const result = saveProject(imported);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      onImported(result.project);
      setSavedSnapshot(snapshotKey(result.project));
      setSaveError('');
    } catch (error) {
      setSaveError(error.message || 'Import failed.');
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      'Reset this project? Your saved Composer Rapid data and attachments in this browser will be cleared.',
    );
    if (!confirmed) return;
    await clearProject();
    onResetToSetup();
  }

  function handleLoadSample() {
    const confirmed = window.confirm(
      'Load the sample event and rebuild the demo homepage? Your current page edits will be replaced.',
    );
    if (!confirmed) return;
    const sample = buildSampleProject({ withHomepage: true });
    const result = saveProject(sample);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    onImported(result.project);
    setSavedSnapshot(snapshotKey(result.project));
    setSaveError('');
  }

  function goPreview() {
    onProjectChange(commitData(latestDataRef.current));
    onPreview();
  }

  const pages = getPages(project);
  const puckData = activePage?.puckData || project.puckData;
  const dirty = snapshotKey(project) !== savedSnapshot;

  const puckPlugins = useMemo(() => {
    const pagesPlugin = createPagesPlugin({
      pages,
      activePageId: activePage?.id,
      onSelect: handleSelectPage,
      onAdd: handleAddPage,
      onRename: handleRenamePage,
      onDelete: handleDeletePage,
    });
    // Pages → Elements → Sections (blocks) → Layers (outline) → Brand
    return [
      pagesPlugin,
      createElementsPlugin(),
      createSectionsPlugin(),
      createLayersPlugin(),
      createBrandPlugin(),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, activePage?.id, project]);

  const chromeValue = useMemo(
    () => ({
      projectName: project.event?.name?.trim() || 'Untitled site',
      pages,
      activePageId: activePage?.id,
      dirty,
      saveError,
      readyMessage,
      setupButtonRef,
      onSelectPage: handleSelectPage,
      onPreview: goPreview,
      onSave: () => handleSave(),
      onEditSetup,
      onOpenSource: () => setSourceOpen(true),
      onExportJson: handleExportJson,
      onExportBundle: handleExportBundle,
      onImportJson: () => importInputRef.current?.click(),
      onImportBundle: () => bundleInputRef.current?.click(),
      onLoadSample: handleLoadSample,
      onReset: handleReset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      project.event?.name,
      pages,
      activePage?.id,
      dirty,
      saveError,
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
                handleImport(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={bundleInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                handleImport(e.target.files?.[0]);
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
              </div>
              <SourceContentPanel
                contentSetup={project.contentSetup}
                open={sourceOpen}
                onClose={() => setSourceOpen(false)}
              />
            </div>
          </div>
        </EditorChromeProvider>
      </PageLinkProvider>
    </AssetProvider>
  );
}
