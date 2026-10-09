import { useEffect, useId, useRef, useState } from 'react';
import { IconPages } from './icons';

export function createPagesPlugin({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}) {
  return {
    name: 'pages',
    label: 'Pages',
    icon: <IconPages />,
    render: () => (
      <PageStrip
        pages={pages}
        activePageId={activePageId}
        onSelect={onSelect}
        onAdd={onAdd}
        onRename={onRename}
        onDelete={onDelete}
      />
    ),
  };
}

function PageRowMenu({ page, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="cr-pages-plugin__menu-wrap" ref={ref}>
      <button
        type="button"
        className="cr-pages-plugin__menu-btn"
        aria-label={`Page options for ${page.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        ⋯
      </button>
      {open ? (
        <div className="cr-pages-plugin__menu" id={menuId} role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRename(page.id);
            }}
          >
            Rename
          </button>
          {page.role !== 'home' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete(page.id);
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PageStrip({
  pages = [],
  activePageId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}) {
  return (
    <div className="cr-drawer-panel cr-pages-plugin" aria-label="Site pages">
      <div className="cr-drawer-panel__header cr-pages-plugin__header">
        <p className="cr-drawer-panel__heading">Pages</p>
        <button type="button" className="cr-btn cr-btn--ghost cr-btn--small" onClick={onAdd}>
          Add page
        </button>
      </div>

      <ul className="cr-pages-plugin__list">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <li key={page.id} className="cr-pages-plugin__row">
              <button
                type="button"
                className={`cr-pages-plugin__item ${
                  isActive ? 'cr-pages-plugin__item--active' : ''
                }`}
                onClick={() => onSelect(page.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="cr-pages-plugin__name">{page.title}</span>
                {page.role === 'home' ? (
                  <span className="cr-pages-plugin__badge">Home</span>
                ) : null}
              </button>
              <PageRowMenu page={page} onRename={onRename} onDelete={onDelete} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
