export const ELEMENT_TYPES = [
  'ElementHeading',
  'ElementRichText',
  'ElementImage',
  'ElementButton',
  'ElementVideo',
  'ElementContainer',
  'ElementDivider',
  'ElementShape',
];

export const ELEMENT_LABELS = {
  ElementHeading: 'Heading',
  ElementRichText: 'Rich text',
  ElementImage: 'Image',
  ElementButton: 'Button',
  ElementVideo: 'Video',
  ElementContainer: 'Content container',
  ElementDivider: 'Divider',
  ElementShape: 'Decorative shape',
};

export const MOBILE_BREAKPOINT = 640;

export const DEFAULT_FRAME = {
  x: 24,
  y: 24,
  width: 280,
  height: 0,
  heightMode: 'auto',
  zIndex: 1,
  locked: 'no',
  mobileX: null,
  mobileY: null,
  mobileWidth: null,
  mobileHeight: null,
  mobileHeightMode: null,
};

export const MIN_SIZES = {
  ElementHeading: { width: 80, height: 24 },
  ElementRichText: { width: 120, height: 40 },
  ElementImage: { width: 64, height: 64 },
  ElementButton: { width: 72, height: 36 },
  ElementVideo: { width: 160, height: 90 },
  ElementContainer: { width: 120, height: 80 },
  ElementDivider: { width: 40, height: 8 },
  ElementShape: { width: 40, height: 40 },
};
