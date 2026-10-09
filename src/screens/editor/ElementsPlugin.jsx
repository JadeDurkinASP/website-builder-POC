import { useMemo, useState } from 'react';
import { Drawer, createUsePuck, useGetPuck } from '@puckeditor/core';
import { ELEMENT_LABELS, ELEMENT_TYPES } from '../../puck/canvas/constants';
import { buildBlankCanvasTemplate } from '../../generation/sectionTemplates';
import { IconElements } from './icons';

const usePuck = createUsePuck();

/** Shorter UI labels for the Elements drawer (config labels stay unchanged). */
const TILE_LABELS = {
  ElementHeading: 'Heading',
  ElementRichText: 'Text',
  ElementImage: 'Image',
  ElementButton: 'Button',
  ElementVideo: 'Video',
  ElementContainer: 'Container',
  ElementDivider: 'Divider',
  ElementShape: 'Shape',
};

function findTargetSection(selectedItem, getParentById) {
  if (!selectedItem) return null;
  if (selectedItem.type === 'CanvasSection') return selectedItem;
  if (selectedItem.type === 'ElementContainer') return selectedItem;
  if (ELEMENT_TYPES.includes(selectedItem.type)) {
    let parent = getParentById(selectedItem.props.id);
    while (parent) {
      if (parent.type === 'CanvasSection' || parent.type === 'ElementContainer') return parent;
      parent = getParentById(parent.props.id);
    }
  }
  return null;
}

function pageHasCanvasSection(appState) {
  const content = appState?.data?.content || [];
  return content.some((item) => item?.type === 'CanvasSection');
}

function targetLabel(target) {
  if (!target) return '';
  const display = target.props?.displayName?.trim();
  if (display) return display;
  if (target.type === 'ElementContainer') return 'Content container';
  return 'Canvas Section';
}

function ElementDrawerItem({ name, disabled, onClickAdd }) {
  const label = TILE_LABELS[name] || ELEMENT_LABELS[name] || name;
  return (
    <Drawer.Item name={name} label={label}>
      {() => (
        <div
          className={`cr-elements-plugin__item ${disabled ? 'cr-elements-plugin__item--disabled' : ''}`}
          title={disabled ? `Select a Canvas Section to add ${label}` : `Drag ${label} onto the canvas`}
        >
          <div className="cr-elements-plugin__preview" data-element-preview={name}>
            <ElementPreview type={name} />
          </div>
          <span className="cr-elements-plugin__label">{label}</span>
          <button
            type="button"
            className="cr-elements-plugin__add"
            disabled={disabled}
            aria-label={`Add ${label}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!disabled) onClickAdd?.(name);
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            Add
          </button>
        </div>
      )}
    </Drawer.Item>
  );
}

function ElementsPanel() {
  const selectedItem = usePuck((s) => s.selectedItem);
  const hasCanvas = usePuck((s) => pageHasCanvasSection(s.appState));
  const getPuck = useGetPuck();
  const [query, setQuery] = useState('');
  const target = findTargetSection(selectedItem, getPuck().getParentById);
  const canInsert = Boolean(target);

  const filteredTypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ELEMENT_TYPES;
    return ELEMENT_TYPES.filter((name) => {
      const label = (TILE_LABELS[name] || ELEMENT_LABELS[name] || name).toLowerCase();
      return label.includes(q) || name.toLowerCase().includes(q);
    });
  }, [query]);

  function insertCanvasSection() {
    const api = getPuck();
    const data = api.appState?.data;
    if (!data) return;
    const content = [...(data.content || [])];
    const footerIndex = content.findIndex((item) => item?.type === 'Footer');
    const index = footerIndex >= 0 ? footerIndex : content.length;
    const seed = buildBlankCanvasTemplate({ suffix: 'added', title: 'Canvas Section' });
    content.splice(index, 0, seed);

    api.dispatch({
      type: 'setData',
      data: { ...data, content },
    });

    window.setTimeout(() => {
      const latest = getPuck();
      const selector = latest.getSelectorForId(seed.props.id);
      if (!selector) return;
      latest.dispatch({
        type: 'setUi',
        ui: { itemSelector: { zone: selector.zone, index: selector.index } },
      });
    }, 0);
  }

  function focusTargetInLayers() {
    if (!target) return;
    const api = getPuck();
    const selector = api.getSelectorForId(target.props.id);
    if (!selector) return;
    api.dispatch({
      type: 'setUi',
      ui: {
        itemSelector: { zone: selector.zone, index: selector.index },
        leftSideBarVisible: true,
        plugin: 'outline',
      },
    });
  }

  function clickToAdd(componentType) {
    const api = getPuck();
    const currentTarget = findTargetSection(api.selectedItem, api.getParentById);
    if (!currentTarget) return;
    const zone = `${currentTarget.props.id}:elements`;
    const siblings = Array.isArray(currentTarget.props?.elements)
      ? currentTarget.props.elements
      : [];
    api.dispatch({
      type: 'insert',
      componentType,
      destinationZone: zone,
      destinationIndex: siblings.length,
      recordHistory: true,
    });
  }

  return (
    <div className="cr-drawer-panel cr-elements-plugin" aria-label="Elements">
      <div className="cr-drawer-panel__header">
        <p className="cr-drawer-panel__heading">Elements</p>
        <p className="cr-drawer-panel__lede">
          Click or drag onto a Canvas Section. Double-click the section first to edit inside.
        </p>
      </div>

      <label className="cr-elements-plugin__search">
        <span className="visually-hidden">Search elements</span>
        <input
          type="search"
          placeholder="Search elements"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {!hasCanvas ? (
        <div className="cr-elements-plugin__banner cr-elements-plugin__banner--warn" role="status">
          <p>No Canvas Section on this page yet.</p>
          <button type="button" className="cr-btn cr-btn--brand cr-btn--small" onClick={insertCanvasSection}>
            Add Canvas Section
          </button>
        </div>
      ) : !canInsert ? (
        <div className="cr-elements-plugin__banner cr-elements-plugin__banner--warn" role="status">
          <p>Select a Canvas Section (or an element inside one) to choose where to add.</p>
        </div>
      ) : (
        <div className="cr-elements-plugin__banner cr-elements-plugin__banner--ok" role="status">
          <p>
            Adding to: <strong>{targetLabel(target)}</strong>
          </p>
          <button type="button" className="cr-btn cr-btn--ghost cr-btn--small" onClick={focusTargetInLayers}>
            Change
          </button>
        </div>
      )}

      <Drawer>
        <ul className="cr-elements-plugin__grid">
          {filteredTypes.map((name) => (
            <li key={name} className="cr-elements-plugin__tile">
              <ElementDrawerItem name={name} disabled={!canInsert} onClickAdd={clickToAdd} />
            </li>
          ))}
        </ul>
      </Drawer>
      {filteredTypes.length === 0 ? (
        <p className="cr-field-hint">No elements match “{query}”.</p>
      ) : null}
    </div>
  );
}

function ElementPreview({ type }) {
  switch (type) {
    case 'ElementHeading':
      return <span className="cr-el-preview cr-el-preview--heading">Aa</span>;
    case 'ElementRichText':
      return <span className="cr-el-preview cr-el-preview--text">Text</span>;
    case 'ElementImage':
      return <span className="cr-el-preview cr-el-preview--image" />;
    case 'ElementButton':
      return <span className="cr-el-preview cr-el-preview--button">Btn</span>;
    case 'ElementVideo':
      return <span className="cr-el-preview cr-el-preview--video">▶</span>;
    case 'ElementContainer':
      return <span className="cr-el-preview cr-el-preview--container" />;
    case 'ElementDivider':
      return <span className="cr-el-preview cr-el-preview--divider" />;
    case 'ElementShape':
      return <span className="cr-el-preview cr-el-preview--shape" />;
    default:
      return <span className="cr-el-preview" />;
  }
}

export function createElementsPlugin() {
  return {
    name: 'elements',
    label: 'Elements',
    icon: <IconElements />,
    render: () => <ElementsPanel />,
  };
}
