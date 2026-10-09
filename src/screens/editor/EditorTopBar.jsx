import { useEffect, useId, useRef, useState } from 'react';
import { createUsePuck } from '@puckeditor/core';
import { useEditorChrome } from './EditorChromeContext';
import { IconRedo, IconUndo } from './icons';

const usePuck = createUsePuck();

export function EditorTopBar() {
  const chrome = useEditorChrome();
  const hasPast = usePuck((s) => s.history.hasPast);
  const hasFuture = usePuck((s) => s.history.hasFuture);
  const back = usePuck((s) => s.history.back);
  const forward = usePuck((s) => s.history.forward);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const moreMenuId = useId();

  useEffect(() => {
    if (!moreOpen) return undefined;
    function onPointerDown(event) {
      if (!moreRef.current?.contains(event.target)) setMoreOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMoreOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  const dirtyLabel =
    chrome.saveError ||
    (chrome.dirty ? 'Unsaved changes' : 'Saved locally');

  return (
    <header className="cr-editor-topbar">
      <div className="cr-editor-topbar__brand">
        <strong className="cr-editor-topbar__product">Composer Rapid</strong>
        <span className="cr-editor-topbar__project">{chrome.projectName}</span>
      </div>

      <label className="cr-editor-topbar__page">
        <span className="cr-editor-topbar__page-label">Page</span>
        <select
          value={chrome.activePageId || ''}
          onChange={(e) => chrome.onSelectPage(e.target.value)}
          aria-label="Current page"
        >
          {chrome.pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title}
              {page.role === 'home' ? ' (Home)' : ''}
            </option>
          ))}
        </select>
      </label>

      <span
        className={`cr-editor-topbar__status ${
          chrome.saveError
            ? 'cr-editor-topbar__status--error'
            : chrome.dirty
              ? 'cr-editor-topbar__status--dirty'
              : 'cr-editor-topbar__status--saved'
        }`}
        role="status"
      >
        {dirtyLabel}
      </span>

      {chrome.readyMessage ? (
        <span className="cr-editor-topbar__ready" role="status">
          {chrome.readyMessage}
        </span>
      ) : chrome.statusMessage ? (
        <span className="cr-editor-topbar__ready" role="status">
          {chrome.statusMessage}
        </span>
      ) : null}

      <div className="cr-editor-topbar__history">
        <button
          type="button"
          className="cr-icon-btn"
          onClick={() => back()}
          disabled={!hasPast}
          aria-label="Undo"
          title="Undo"
        >
          <IconUndo />
        </button>
        <button
          type="button"
          className="cr-icon-btn"
          onClick={() => forward()}
          disabled={!hasFuture}
          aria-label="Redo"
          title="Redo"
        >
          <IconRedo />
        </button>
      </div>

      <div className="cr-editor-topbar__actions">
        <button type="button" className="cr-btn cr-btn--ghost cr-btn--small" onClick={chrome.onPreview}>
          Preview
        </button>
        <button type="button" className="cr-btn cr-btn--brand cr-btn--small" onClick={chrome.onSave}>
          Save
        </button>
        <button type="button" className="cr-btn cr-btn--ghost cr-btn--small" onClick={chrome.onReset}>
          Reset project
        </button>

        <div className="cr-editor-topbar__more" ref={moreRef}>
          <button
            type="button"
            className="cr-btn cr-btn--ghost cr-btn--small"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-controls={moreMenuId}
            onClick={() => setMoreOpen((open) => !open)}
          >
            More
          </button>
          {moreOpen ? (
            <div className="cr-editor-topbar__menu" id={moreMenuId} role="menu">
              <button
                type="button"
                role="menuitem"
                ref={chrome.setupButtonRef}
                onClick={() => {
                  setMoreOpen(false);
                  chrome.onEditSetup();
                }}
              >
                Website setup
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  chrome.onOpenSource();
                }}
              >
                Source content
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  chrome.onExportBundle();
                }}
              >
                Export project with attachments
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  chrome.onImportProject();
                }}
              >
                Import project
              </button>
              <details className="cr-editor-topbar__advanced">
                <summary>Advanced export</summary>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMoreOpen(false);
                    chrome.onExportJson();
                  }}
                >
                  Export JSON only
                </button>
                <p className="cr-editor-topbar__menu-hint">
                  JSON alone does not transfer uploaded files. Prefer a project bundle.
                </p>
              </details>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  chrome.onLoadSample();
                }}
              >
                Load sample
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Replaces Puck’s default header with the Composer Rapid top bar. */
export function editorHeaderOverride() {
  return <EditorTopBar />;
}
