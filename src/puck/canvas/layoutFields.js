import { DEFAULT_FRAME } from './constants';

export const frameFields = {
  x: { type: 'number', label: 'X position', min: 0 },
  y: { type: 'number', label: 'Y position', min: 0 },
  width: { type: 'number', label: 'Width', min: 40 },
  height: { type: 'number', label: 'Height (0 = auto)', min: 0 },
  heightMode: {
    type: 'radio',
    label: 'Height mode',
    options: [
      { label: 'Automatic', value: 'auto' },
      { label: 'Fixed', value: 'fixed' },
    ],
  },
  zIndex: { type: 'number', label: 'Layer order', min: 0 },
  locked: {
    type: 'radio',
    label: 'Lock position',
    options: [
      { label: 'Unlocked', value: 'no' },
      { label: 'Locked', value: 'yes' },
    ],
  },
  mobileX: { type: 'number', label: 'Mobile X (override)', min: 0 },
  mobileY: { type: 'number', label: 'Mobile Y (override)', min: 0 },
  mobileWidth: { type: 'number', label: 'Mobile width (override)', min: 40 },
  mobileHeight: { type: 'number', label: 'Mobile height (override)', min: 0 },
};

export const frameDefaultProps = { ...DEFAULT_FRAME };

/** Shared fields shown for free-position geometry. */
export function withFrameFields(fields) {
  return {
    ...fields,
    ...frameFields,
  };
}
