export const BUTTON_STYLE_OPTIONS = [
  { label: 'Primary colour', value: 'primary' },
  { label: 'Secondary colour', value: 'secondary' },
];

export function buttonStyleClass(style) {
  if (style === 'secondary') return 'cr-btn cr-btn--secondary';
  return 'cr-btn cr-btn--primary';
}

export const buttonStyleField = {
  type: 'radio',
  label: 'Button style',
  options: BUTTON_STYLE_OPTIONS,
};
