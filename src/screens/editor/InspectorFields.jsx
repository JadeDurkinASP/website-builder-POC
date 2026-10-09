import { Children, isValidElement, useEffect, useMemo, useState } from 'react';
import { createUsePuck, useGetPuck } from '@puckeditor/core';
import { ELEMENT_LABELS } from '../../puck/canvas/constants';
import { groupForField, INSPECTOR_TABS } from '../../puck/inspectorFieldGroups';

const usePuck = createUsePuck();

function itemLabel(item) {
  if (!item) return 'Page';
  const display = item.props?.displayName?.trim();
  if (display) return display;
  if (item.type === 'CanvasSection') return 'Canvas Section';
  if (ELEMENT_LABELS[item.type]) return ELEMENT_LABELS[item.type];
  if (item.props?.text) return String(item.props.text).slice(0, 28);
  if (item.props?.label) return String(item.props.label).slice(0, 28);
  if (item.props?.heading) return String(item.props.heading).slice(0, 28);
  if (item.props?.title) return String(item.props.title).slice(0, 28);
  return item.type || 'Block';
}

function useAncestry(selectedItem) {
  const getPuck = useGetPuck();
  return useMemo(() => {
    if (!selectedItem?.props?.id) return [];
    const api = getPuck();
    const chain = [];
    let current = selectedItem;
    while (current) {
      chain.unshift(current);
      current = api.getParentById(current.props.id);
    }
    return chain;
  }, [selectedItem, getPuck]);
}

export function InspectorFields({ children, isLoading }) {
  const selectedItem = usePuck((s) => s.selectedItem);
  const getPuck = useGetPuck();
  const ancestry = useAncestry(selectedItem);
  const [activeTab, setActiveTab] = useState('content');

  const fieldEntries = useMemo(() => {
    return Children.toArray(children)
      .filter(isValidElement)
      .map((child) => {
        const fieldName = child.key != null ? String(child.key).replace(/^\.\$?/, '') : '';
        return { fieldName, child, group: groupForField(fieldName) };
      })
      .filter((entry) => entry.fieldName);
  }, [children]);

  const availableTabs = INSPECTOR_TABS.filter((tab) =>
    fieldEntries.some((entry) => entry.group === tab.id),
  );

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Root / no selection — Brand owns page branding.
  if (!selectedItem) {
    return (
      <div className="cr-inspector">
        <p className="cr-inspector__empty">
          Select a section or element to edit. Page colours, font and design style live in the{' '}
          <strong>Brand</strong> panel.
        </p>
      </div>
    );
  }

  function selectItem(item) {
    const api = getPuck();
    const selector = api.getSelectorForId(item.props.id);
    if (!selector) return;
    api.dispatch({
      type: 'setUi',
      ui: { itemSelector: { zone: selector.zone, index: selector.index } },
    });
  }

  return (
    <div className={`cr-inspector ${isLoading ? 'cr-inspector--loading' : ''}`}>
      <nav className="cr-inspector__breadcrumb" aria-label="Selection path">
        <button type="button" className="cr-inspector__crumb" onClick={() => getPuck().dispatch({ type: 'setUi', ui: { itemSelector: null } })}>
          Home
        </button>
        {ancestry.map((item) => (
          <span key={item.props.id} className="cr-inspector__crumb-wrap">
            <span className="cr-inspector__crumb-sep" aria-hidden>
              /
            </span>
            <button type="button" className="cr-inspector__crumb" onClick={() => selectItem(item)}>
              {itemLabel(item)}
            </button>
          </span>
        ))}
      </nav>

      {availableTabs.length > 1 ? (
        <div className="cr-inspector__tabs" role="tablist" aria-label="Field groups">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`cr-inspector__tab ${activeTab === tab.id ? 'cr-inspector__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="cr-inspector__panels">
        {INSPECTOR_TABS.map((tab) => {
          const entries = fieldEntries.filter((entry) => entry.group === tab.id);
          if (!entries.length) return null;
          const hidden = availableTabs.length > 1 && activeTab !== tab.id;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              hidden={hidden}
              className="cr-inspector__panel"
              aria-label={tab.label}
            >
              {entries.map((entry) => (
                <div key={entry.fieldName} className="cr-inspector__field" data-field={entry.fieldName}>
                  {entry.child}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
