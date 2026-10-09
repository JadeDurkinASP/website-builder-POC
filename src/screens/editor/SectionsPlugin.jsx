import { useMemo, useState } from 'react';
import { createUsePuck, useGetPuck } from '@puckeditor/core';
import {
  SECTION_TEMPLATE_CATALOG,
  buildCatalogTemplate,
} from '../../generation/sectionTemplates';
import { IconSections } from './icons';

const usePuck = createUsePuck();

function SectionsPanel() {
  const getPuck = useGetPuck();
  const [query, setQuery] = useState('');
  const rootProps = usePuck((s) => s.appState?.data?.root?.props) || {};

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTION_TEMPLATE_CATALOG;
    return SECTION_TEMPLATE_CATALOG.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.includes(q),
    );
  }, [query]);

  function insertTemplate(catalogId) {
    const api = getPuck();
    const data = api.appState?.data;
    if (!data) return;
    const content = [...(data.content || [])];
    const footerIndex = content.findIndex((item) => item?.type === 'Footer');
    const index = footerIndex >= 0 ? footerIndex : content.length;
    const seed = buildCatalogTemplate(catalogId, {
      name: rootProps?.eventName,
    });
    content.splice(index, 0, seed);

    api.dispatch({
      type: 'setData',
      data: (previous) => {
        const prevContent = [...(previous.content || [])];
        const prevFooter = prevContent.findIndex((item) => item?.type === 'Footer');
        const at = prevFooter >= 0 ? prevFooter : prevContent.length;
        // Avoid double-insert if stale closure already applied
        if (prevContent.some((item) => item?.props?.id === seed.props.id)) {
          return previous;
        }
        prevContent.splice(at, 0, seed);
        return { content: prevContent };
      },
    });

    window.setTimeout(() => {
      const latest = getPuck();
      const selector = latest.getSelectorForId(seed.props.id);
      if (!selector) return;
      latest.dispatch({
        type: 'setUi',
        ui: { itemSelector: { zone: selector.zone, index: selector.index } },
      });
    }, 50);
  }

  return (
    <div className="cr-drawer-panel" aria-label="Sections">
      <div className="cr-drawer-panel__header">
        <p className="cr-drawer-panel__heading">Sections</p>
        <p className="cr-drawer-panel__lede">
          Add a full section as an editable canvas. Edit content with Elements inside each section.
        </p>
      </div>

      <label className="cr-elements-plugin__search">
        <span className="visually-hidden">Search sections</span>
        <input
          type="search"
          placeholder="Search sections"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <ul className="cr-sections-catalog">
        {filtered.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="cr-sections-catalog__item"
              onClick={() => insertTemplate(item.id)}
            >
              <span className="cr-sections-catalog__label">{item.label}</span>
              <span className="cr-sections-catalog__hint">Canvas template</span>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="cr-field-hint">No sections match “{query}”.</p>
      ) : null}
    </div>
  );
}

export function createSectionsPlugin() {
  return {
    name: 'blocks',
    label: 'Sections',
    icon: <IconSections />,
    render: () => <SectionsPanel />,
  };
}
