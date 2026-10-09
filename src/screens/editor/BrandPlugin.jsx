import { FONT_OPTIONS } from '../../constants';
import { DesignDirectionCards } from '../setup/DesignDirectionCards';
import { IconBrand } from './icons';

function normalizeHex(value, fallback = '#000000') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return fallback;
}

function BrandColourRow({ id, label, hint, value, onChange }) {
  const hex = normalizeHex(value, '#2a3c4c');
  return (
    <div className="cr-brand-colour">
      <label className="cr-brand-colour__label" htmlFor={id}>
        {label}
      </label>
      {hint ? <p className="cr-field-hint">{hint}</p> : null}
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

function BrandPanel({ branding = {}, onBrandingChange }) {
  const primary = branding.primaryColour || '#2a3c4c';
  const accent = branding.secondaryColour || '#00a986';
  const background = branding.backgroundColour || '#ffffff';
  const font = branding.font || 'DM Sans';
  const designDirection = branding.designDirection || 'bold';

  return (
    <div className="cr-drawer-panel cr-brand-plugin" aria-label="Website branding">
      <div className="cr-drawer-panel__header">
        <p className="cr-drawer-panel__heading">Website branding</p>
        <p className="cr-drawer-panel__lede">
          Applies across all pages. Individual element overrides are preserved.
        </p>
        <p className="cr-field-hint">
          Branding updates every page immediately and is not undone by the canvas Undo control
          (which only reverts content edits on the active page). Save to keep branding changes.
        </p>
      </div>

      <div className="cr-brand-plugin__section">
        <h3 className="cr-brand-plugin__title">Colours</h3>
        <BrandColourRow
          id="brand-primary"
          label="Primary"
          hint="Main brand colour."
          value={primary}
          onChange={(primaryColour) => onBrandingChange?.({ primaryColour })}
        />
        <BrandColourRow
          id="brand-accent"
          label="Accent"
          hint="Emphasis and highlights."
          value={accent}
          onChange={(secondaryColour) => onBrandingChange?.({ secondaryColour })}
        />
        <BrandColourRow
          id="brand-bg"
          label="Background"
          hint="Default page background."
          value={background}
          onChange={(backgroundColour) => onBrandingChange?.({ backgroundColour })}
        />
      </div>

      <div className="cr-brand-plugin__section">
        <h3 className="cr-brand-plugin__title">Typography</h3>
        <label className="cr-field" htmlFor="brand-font">
          <span>Font</span>
          <select
            id="brand-font"
            value={font}
            onChange={(e) => onBrandingChange?.({ font: e.target.value })}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="cr-brand-plugin__section">
        <h3 className="cr-brand-plugin__title">Design style</h3>
        <p className="cr-field-hint">
          Updates website styling only — it does not rebuild or replace your edited sections.
        </p>
        <DesignDirectionCards
          value={designDirection}
          onChange={(next) => onBrandingChange?.({ designDirection: next })}
        />
      </div>
    </div>
  );
}

export function createBrandPlugin({ branding, onBrandingChange } = {}) {
  return {
    name: 'brand',
    label: 'Brand',
    icon: <IconBrand />,
    render: () => (
      <BrandPanel branding={branding} onBrandingChange={onBrandingChange} />
    ),
  };
}
