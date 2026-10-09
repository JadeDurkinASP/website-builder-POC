import { useMemo, useState } from 'react';
import { createUsePuck, useGetPuck } from '@puckeditor/core';
import { ELEMENT_LABELS, ELEMENT_TYPES } from '../../puck/canvas/constants';
import { IconLayers } from './icons';

const usePuck = createUsePuck();

function labelFor(item) {
  const display = item.props?.displayName?.trim();
  if (display) return display;
  if (item.type === 'CanvasSection') return 'Canvas Section';
  if (ELEMENT_LABELS[item.type]) return ELEMENT_LABELS[item.type];
  if (item.props?.text) return String(item.props.text).slice(0, 36);
  if (item.props?.label) return String(item.props.label).slice(0, 36);
  if (item.props?.heading) return String(item.props.heading).slice(0, 36);
  if (item.props?.title) return String(item.props.title).slice(0, 36);
  return item.type || 'Block';
}

function typeIcon(type) {
  if (type === 'CanvasSection') return '▦';
  if (type === 'ElementHeading') return 'H';
  if (type === 'ElementRichText') return 'T';
  if (type === 'ElementImage') return '▣';
  if (type === 'ElementButton') return '▢';
  if (type === 'ElementVideo') return '▶';
  if (type === 'ElementContainer') return '☐';
  if (type === 'ElementDivider') return '—';
  if (type === 'ElementShape') return '◌';
  return '•';
}

function collectChildren(item) {
  const children = [];
  if (Array.isArray(item.props?.elements)) children.push(...item.props.elements);
  // Nested arrays used by some section components
  for (const key of ['items', 'buttons', 'speakers', 'sponsors', 'photos', 'links', 'navLinks']) {
    if (Array.isArray(item.props?.[key])) {
      // skip primitive arrays / object arrays that aren't Puck components
    }
  }
  return children.filter((child) => child && typeof child === 'object' && child.type && child.props);
}

function isLocked(item) {
  return item.props?.locked === true || item.props?.locked === 'yes' || item.props?.locked === 'true';
}

function LayerRow({ item, depth, selectedId, expanded, onToggle, onSelect, onRename, onToggleLock }) {
  const children = collectChildren(item);
  const hasChildren = children.length > 0;
  const isOpen = expanded[item.props.id] !== false;
  const selected = selectedId === item.props.id;
  const canLock = ELEMENT_TYPES.includes(item.type) || item.type === 'CanvasSection';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.props?.displayName || '');

  return (
    <li className="cr-layers-tree__node">
      <div
        className={`cr-layers-tree__row ${selected ? 'cr-layers-tree__row--selected' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="cr-layers-tree__twist"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            aria-expanded={isOpen}
            onClick={() => onToggle(item.props.id)}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className="cr-layers-tree__twist cr-layers-tree__twist--spacer" />
        )}

        <span className="cr-layers-tree__icon" aria-hidden>
          {typeIcon(item.type)}
        </span>

        {editing ? (
          <input
            className="cr-layers-tree__rename"
            value={draft}
            autoFocus
            aria-label="Display name"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onRename(item, draft.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(item, draft.trim());
                setEditing(false);
              }
              if (e.key === 'Escape') {
                setDraft(item.props?.displayName || '');
                setEditing(false);
              }
            }}
          />
        ) : (
          <button type="button" className="cr-layers-tree__label" onClick={() => onSelect(item)}>
            {labelFor(item)}
          </button>
        )}

        <div className="cr-layers-tree__actions">
          <button
            type="button"
            className="cr-layers-tree__action"
            title="Rename display name"
            aria-label="Rename display name"
            onClick={() => {
              setDraft(item.props?.displayName || '');
              setEditing(true);
            }}
          >
            ✎
          </button>
          {canLock ? (
            <button
              type="button"
              className={`cr-layers-tree__action ${isLocked(item) ? 'cr-layers-tree__action--on' : ''}`}
              title={isLocked(item) ? 'Unlock' : 'Lock'}
              aria-label={isLocked(item) ? 'Unlock' : 'Lock'}
              aria-pressed={isLocked(item)}
              onClick={() => onToggleLock(item)}
            >
              {isLocked(item) ? 'Locked' : 'Lock'}
            </button>
          ) : null}
        </div>
      </div>

      {hasChildren && isOpen ? (
        <ul className="cr-layers-tree__list">
          {children.map((child) => (
            <LayerRow
              key={child.props.id}
              item={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onRename={onRename}
              onToggleLock={onToggleLock}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function LayersPanel() {
  const content = usePuck((s) => s.appState?.data?.content) || [];
  const selectedItem = usePuck((s) => s.selectedItem);
  const getPuck = useGetPuck();
  const [expanded, setExpanded] = useState({});

  const selectedId = selectedItem?.props?.id || null;

  function onToggle(id) {
    setExpanded((prev) => {
      const isOpen = prev[id] !== false;
      return { ...prev, [id]: !isOpen };
    });
  }

  function onSelect(item) {
    const api = getPuck();
    const selector = api.getSelectorForId(item.props.id);
    if (!selector) return;
    api.dispatch({
      type: 'setUi',
      ui: { itemSelector: { zone: selector.zone, index: selector.index } },
    });
  }

  function patchItem(item, patch) {
    const api = getPuck();
    const selector = api.getSelectorForId(item.props.id);
    if (!selector) return;
    api.dispatch({
      type: 'replace',
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: {
        type: item.type,
        props: { ...item.props, ...patch },
      },
      recordHistory: true,
    });
  }

  function onRename(item, displayName) {
    patchItem(item, { displayName });
  }

  function onToggleLock(item) {
    patchItem(item, { locked: isLocked(item) ? 'no' : 'yes' });
  }

  const roots = useMemo(() => content.filter(Boolean), [content]);

  return (
    <div className="cr-drawer-panel" aria-label="Layers">
      <div className="cr-drawer-panel__header">
        <p className="cr-drawer-panel__heading">Layers</p>
        <p className="cr-drawer-panel__lede">
          Select layers on the page. Rename for clearer labels; lock free-positioned elements.
        </p>
      </div>
      <div className="cr-drawer-panel__body">
        {roots.length === 0 ? (
          <p className="cr-field-hint">This page has no sections yet.</p>
        ) : (
          <ul className="cr-layers-tree__list cr-layers-tree">
            {roots.map((item) => (
              <LayerRow
                key={item.props.id}
                item={item}
                depth={0}
                selectedId={selectedId}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                onRename={onRename}
                onToggleLock={onToggleLock}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function createLayersPlugin() {
  return {
    name: 'outline',
    label: 'Layers',
    icon: <IconLayers />,
    render: () => <LayersPanel />,
  };
}
