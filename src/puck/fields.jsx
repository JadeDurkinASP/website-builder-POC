import { useEffect, useRef, useState } from 'react';
import { createUsePuck } from '@puckeditor/core';
import { DEFAULT_BRANDING, MAX_IMAGE_BYTES, toAssetRef } from '../constants';
import { useAssets } from '../assets/AssetResolver';
import { addFileAsAsset } from '../storage/assetStore';
import { ResolvedImage } from '../assets/ResolvedImage';

const usePuck = createUsePuck();

const COLOUR_BLACK = '#000000';
const COLOUR_WHITE = '#ffffff';
const COLOUR_MUTED = '#5a6b78';
const CUSTOM_SENTINEL = '__custom__';

const BRAND_PRESETS = [
  {
    id: 'primary',
    label: 'Primary',
    value: 'var(--brand-primary)',
    prop: 'primaryColour',
    fallback: DEFAULT_BRANDING.primaryColour,
  },
  {
    id: 'secondary',
    label: 'Secondary',
    value: 'var(--brand-secondary)',
    prop: 'secondaryColour',
    fallback: DEFAULT_BRANDING.secondaryColour,
  },
  {
    id: 'background',
    label: 'Background',
    value: 'var(--brand-bg)',
    prop: 'backgroundColour',
    fallback: DEFAULT_BRANDING.backgroundColour,
  },
];

const STANDARD_PRESETS = [
  { id: 'black', label: 'Black', value: COLOUR_BLACK, swatch: COLOUR_BLACK },
  { id: 'white', label: 'White', value: COLOUR_WHITE, swatch: COLOUR_WHITE },
  { id: 'muted', label: 'Muted', value: COLOUR_MUTED, swatch: COLOUR_MUTED },
];

function normalizeHex(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return '';
}

function hexForColorInput(value, fallback = COLOUR_BLACK) {
  const hex = normalizeHex(value);
  if (hex) return hex;
  // Best-effort for rgb()/rgba() so the native picker still opens with something useful.
  const rgb = value?.match?.(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const toHex = (n) => Number(n).toString(16).padStart(2, '0');
    return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
  }
  return normalizeHex(fallback) || COLOUR_BLACK;
}

function ColourFieldControl({
  value,
  onChange,
  name,
  label,
  allowInherit = false,
  includeBrand = true,
}) {
  const rootProps = usePuck((s) => s.appState?.data?.root?.props) || {};
  // Keeps Custom selected even when its hex matches a preset (e.g. brand → custom).
  const [customActive, setCustomActive] = useState(false);

  const brandOptions = includeBrand
    ? BRAND_PRESETS.map((preset) => ({
        ...preset,
        swatch: normalizeHex(rootProps[preset.prop]) || preset.fallback,
      }))
    : [];

  const presets = [...brandOptions, ...STANDARD_PRESETS];

  const matchedPreset = presets.find((preset) => {
    if (!value) return false;
    // Brand tokens only match their CSS var — raw hex is treated as custom.
    if (preset.value.startsWith('var(')) return value === preset.value;
    if (value === preset.value) return true;
    const hex = normalizeHex(value);
    return hex && hex === normalizeHex(preset.swatch);
  });

  const isInherit = allowInherit && (value === '' || value == null);
  const isCustomValue = !isInherit && !matchedPreset;

  // If the stored value isn't a preset, keep Custom selected after remounts / external updates.
  useEffect(() => {
    if (isCustomValue) setCustomActive(true);
  }, [isCustomValue]);

  const showCustom = customActive || isCustomValue;
  const selectedId = isInherit ? 'inherit' : showCustom ? CUSTOM_SENTINEL : matchedPreset?.id;

  const customHex = hexForColorInput(
    showCustom && value ? value : matchedPreset?.swatch || value || COLOUR_BLACK,
    COLOUR_BLACK,
  );
  const customText = showCustom && value ? String(value) : customHex;

  function selectPreset(preset) {
    setCustomActive(false);
    onChange(preset.value);
  }

  function selectInherit() {
    setCustomActive(false);
    onChange('');
  }

  function selectCustom() {
    setCustomActive(true);
    // Convert brand tokens / current swatch into an editable hex for the picker.
    if (!isCustomValue) onChange(customHex);
  }

  return (
    <div className="cr-colour-field">
      <div
        className="cr-colour-field__swatches"
        role="radiogroup"
        aria-label={label}
      >
        {allowInherit ? (
          <button
            type="button"
            className={`cr-colour-field__swatch cr-colour-field__swatch--inherit ${
              selectedId === 'inherit' ? 'cr-colour-field__swatch--selected' : ''
            }`}
            onClick={selectInherit}
            aria-checked={selectedId === 'inherit'}
            role="radio"
            title="Default"
          >
            <span className="cr-colour-field__swatch-face" aria-hidden="true" />
            <span className="cr-colour-field__swatch-label">Default</span>
          </button>
        ) : null}

        {presets.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className={`cr-colour-field__swatch ${
              selectedId === preset.id ? 'cr-colour-field__swatch--selected' : ''
            }`}
            onClick={() => selectPreset(preset)}
            aria-checked={selectedId === preset.id}
            role="radio"
            title={preset.label}
          >
            <span
              className={`cr-colour-field__swatch-face ${
                normalizeHex(preset.swatch) === COLOUR_WHITE
                  ? 'cr-colour-field__swatch-face--bordered'
                  : ''
              }`}
              style={{ background: preset.swatch }}
              aria-hidden="true"
            />
            <span className="cr-colour-field__swatch-label">{preset.label}</span>
          </button>
        ))}

        <button
          type="button"
          className={`cr-colour-field__swatch cr-colour-field__swatch--custom ${
            selectedId === CUSTOM_SENTINEL ? 'cr-colour-field__swatch--selected' : ''
          }`}
          onClick={selectCustom}
          aria-checked={selectedId === CUSTOM_SENTINEL}
          role="radio"
          title="Custom colour"
        >
          <span
            className={`cr-colour-field__swatch-face ${
              showCustom ? '' : 'cr-colour-field__swatch-face--blank'
            }`}
            style={showCustom ? { background: customHex } : undefined}
            aria-hidden="true"
          />
          <span className="cr-colour-field__swatch-label">Custom</span>
        </button>
      </div>

      {selectedId === CUSTOM_SENTINEL ? (
        <div className="cr-colour-field__picker">
          <input
            id={`${name}-colour-picker`}
            type="color"
            value={customHex}
            onChange={(event) => {
              setCustomActive(true);
              onChange(event.target.value);
            }}
            aria-label={`${label} picker`}
          />
          <input
            id={`${name}-colour-hex`}
            type="text"
            className="cr-colour-field__hex"
            value={customText}
            onChange={(event) => {
              setCustomActive(true);
              onChange(event.target.value);
            }}
            spellCheck={false}
            aria-label={`${label} hex value`}
            placeholder="#000000"
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Colour field: template brand colours + black/white/muted, with a Custom option
 * that reveals a colour picker.
 */
export function colourField(label = 'Colour', { allowInherit = false, includeBrand = true } = {}) {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, name }) => (
      <ColourFieldControl
        value={value}
        onChange={onChange}
        name={name}
        label={label}
        allowInherit={allowInherit}
        includeBrand={includeBrand}
      />
    ),
  };
}

/** Visible page copy — editable on the canvas, not only in the sidebar. */
export function inlineTextField(label, extras = {}) {
  return { type: 'text', label, contentEditable: true, ...extras };
}

export function inlineTextareaField(label, extras = {}) {
  return { type: 'textarea', label, contentEditable: true, ...extras };
}

export const spacingField = {
  type: 'select',
  label: 'Vertical spacing',
  options: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Spacious', value: 'spacious' },
  ],
};

export const alignField = {
  type: 'radio',
  label: 'Alignment',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Centre', value: 'centre' },
  ],
};

function ImageFieldControl({ value, onChange, name, label }) {
  const { imageAssets, refreshAssets, assets } = useAssets();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef(null);
  const hasImage = Boolean(value);

  async function handleUpload(file) {
    if (!file) return;
    const result = await addFileAsAsset(file, assets);
    if (!result.ok) {
      window.alert(result.error || 'Could not upload image.');
      return;
    }
    window.dispatchEvent(
      new CustomEvent('composer-rapid:asset-added', { detail: { meta: result.meta } }),
    );
    await refreshAssets();
    onChange(toAssetRef(result.meta.id));
    setLibraryOpen(false);
  }

  return (
    <div className="cr-image-field">
      <span className="cr-image-field__label">{label}</span>

      <div className={`cr-image-field__stage ${hasImage ? '' : 'cr-image-field__stage--empty'}`}>
        {hasImage ? (
          <ResolvedImage src={value} alt="" />
        ) : (
          <span className="cr-image-field__placeholder">No image</span>
        )}
      </div>

      <div className="cr-image-field__actions">
        <button
          type="button"
          className="cr-btn cr-btn--ghost cr-btn--small"
          onClick={() => setLibraryOpen((open) => !open)}
        >
          Choose
        </button>
        <button
          type="button"
          className="cr-btn cr-btn--ghost cr-btn--small"
          onClick={() => fileInputRef.current?.click()}
        >
          {hasImage ? 'Replace' : 'Upload'}
        </button>
        {hasImage ? (
          <button
            type="button"
            className="cr-btn cr-btn--ghost cr-btn--small"
            onClick={() => onChange('')}
          >
            Remove
          </button>
        ) : null}
      </div>

      {libraryOpen ? (
        <div className="cr-image-picker">
          {imageAssets.length > 0 ? (
            <div className="cr-image-picker__grid">
              {imageAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className={`cr-image-picker__item ${
                    value === toAssetRef(asset.id) ? 'cr-image-picker__item--selected' : ''
                  }`}
                  onClick={() => {
                    onChange(toAssetRef(asset.id));
                    setLibraryOpen(false);
                  }}
                  aria-pressed={value === toAssetRef(asset.id)}
                  title={asset.name}
                >
                  <ResolvedImage src={toAssetRef(asset.id)} alt={asset.name} />
                </button>
              ))}
            </div>
          ) : (
            <p className="cr-image-field__hint">
              No project images yet. Upload one here or in website setup.
            </p>
          )}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        id={`image-${name}`}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          try {
            await handleUpload(file);
          } finally {
            event.target.value = '';
          }
        }}
      />
      <p className="cr-image-field__hint">
        PNG, JPG or WebP under {Math.round(MAX_IMAGE_BYTES / 1024)} KB. Stored in this browser.
      </p>
    </div>
  );
}

/** Custom Puck field: pick a project image or upload into IndexedDB. */
export function imageUploadField(label = 'Image') {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, name }) => (
      <ImageFieldControl value={value} onChange={onChange} name={name} label={label} />
    ),
  };
}
