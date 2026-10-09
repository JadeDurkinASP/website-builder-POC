import { useGetPuck, createUsePuck } from '@puckeditor/core';
import { FONT_OPTIONS } from '../../constants';
import { DesignDirectionCards } from '../setup/DesignDirectionCards';
import { IconBrand } from './icons';

const usePuck = createUsePuck();

function normalizeHex(value, fallback = '#000000') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return fallback;
}

function BrandColourRow({ id, label, value, onChange }) {
  const hex = normalizeHex(value, '#2a3c4c');
  return (
    <div className="cr-brand-colour">
      <label className="cr-brand-colour__label" htmlFor={id}>
        {label}
      </label>
      <div className="cr-brand-colour__row">
        <input
          id={id}
          type="color"
          className="cr-brand-colour__swatch"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} swatch`}
        />
        <input
          className="cr-brand-colour__hex"
          value={value || hex}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex`}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function BrandPanel() {
  const getPuck = useGetPuck();
  const rootProps = usePuck((s) => s.appState?.data?.root?.props) || {};

  function patchRoot(patch) {
    const api = getPuck();
    const data = api.appState?.data;
    if (!data?.root) return;
    api.dispatch({
      type: 'replaceRoot',
      root: {
        ...data.root,
        props: {
          ...data.root.props,
          ...patch,
        },
      },
      recordHistory: true,
    });
  }

  return (
    <div className="cr-drawer-panel cr-brand-plugin" aria-label="Brand">
      <div className="cr-drawer-panel__header">
        <p className="cr-drawer-panel__heading">Brand</p>
        <p className="cr-drawer-panel__lede">
          Global page colours, font and design style. Explicit colours on individual blocks are kept.
        </p>
      </div>

      <div className="cr-brand-plugin__section">
        <h3 className="cr-brand-plugin__title">Colours</h3>
        <BrandColourRow
          id="brand-primary"
          label="Primary"
          value={rootProps.primaryColour}
          onChange={(primaryColour) => patchRoot({ primaryColour })}
        />
        <BrandColourRow
          id="brand-accent"
          label="Accent"
          value={rootProps.secondaryColour}
          onChange={(secondaryColour) => patchRoot({ secondaryColour })}
        />
        <BrandColourRow
          id="brand-bg"
          label="Page background"
          value={rootProps.backgroundColour}
          onChange={(backgroundColour) => patchRoot({ backgroundColour })}
        />
      </div>

      <div className="cr-brand-plugin__section">
        <h3 className="cr-brand-plugin__title">Typography</h3>
        <label className="cr-field" htmlFor="brand-font">
          <span>Font</span>
          <select
            id="brand-font"
            value={rootProps.font || 'DM Sans'}
            onChange={(e) => patchRoot({ font: e.target.value })}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="cr-brand-plugin__section">
        <h3 className="cr-brand-plugin__title">Design style</h3>
        <p className="cr-field-hint">
          Updates page styling only — it does not rebuild or replace your edited sections.
        </p>
        <DesignDirectionCards
          value={rootProps.designDirection || 'bold'}
          onChange={(designDirection) => patchRoot({ designDirection })}
        />
      </div>
    </div>
  );
}

export function createBrandPlugin() {
  return {
    name: 'brand',
    label: 'Brand',
    icon: <IconBrand />,
    render: () => <BrandPanel />,
  };
}
