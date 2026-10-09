import { buttonStyleField } from '../buttonStyles';
import { colourField, imageUploadField } from '../fields';
import { displayNameField } from '../inspectorFieldGroups';
import { ELEMENT_TYPES } from './constants';
import { frameDefaultProps, withFrameFields } from './layoutFields';
import { CanvasSection } from './CanvasSection';
import { elementResolvePermissions } from './ElementFrame';
import { ResetMobileField } from './ResetMobileField';
import { ElementHeading } from './elements/Heading';
import { ElementRichText } from './elements/RichText';
import { ElementImage } from './elements/Image';
import { ElementButton } from './elements/Button';
import { ElementVideo } from './elements/Video';
import { ElementContainer } from './elements/Container';
import { ElementDivider } from './elements/Divider';
import { ElementShape } from './elements/Shape';
import { applyPlacementToAllElementConfigs } from './resolveElementPlacement';

const alignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Centre', value: 'centre' },
];

export const canvasSectionConfig = {
  label: 'Canvas Section',
  fields: {
    displayName: displayNameField,
    backgroundColour: colourField('Background colour'),
    backgroundImage: imageUploadField('Background image'),
    padding: { type: 'number', label: 'Padding (px)', min: 0 },
    contentWidth: {
      type: 'radio',
      label: 'Content width',
      options: [
        { label: 'Constrained', value: 'constrained' },
        { label: 'Full width', value: 'full' },
      ],
    },
    minHeight: { type: 'number', label: 'Minimum height (px)', min: 120 },
    layoutMode: {
      type: 'radio',
      label: 'Layout',
      options: [
        { label: 'Flow', value: 'flow' },
        { label: 'Free', value: 'free' },
      ],
    },
    flowArrangement: {
      type: 'select',
      label: 'Flow arrangement',
      options: [
        { label: 'Stack', value: 'stack' },
        { label: 'Row', value: 'row' },
        { label: 'Grid', value: 'grid' },
      ],
    },
    flowGap: { type: 'number', label: 'Flow gap (px)', min: 0 },
    flowAlign: {
      type: 'select',
      label: 'Flow alignment',
      options: [
        { label: 'Start', value: 'start' },
        { label: 'Centre', value: 'centre' },
        { label: 'End', value: 'end' },
        { label: 'Stretch', value: 'stretch' },
      ],
    },
    flowColumns: { type: 'number', label: 'Grid columns', min: 1, max: 6 },
    snapEnabled: {
      type: 'radio',
      label: 'Grid snapping',
      options: [
        { label: 'On', value: 'yes' },
        { label: 'Off', value: 'no' },
      ],
    },
    snapGrid: { type: 'number', label: 'Snap grid size (px)', min: 1 },
    mobileLayout: {
      type: 'radio',
      label: 'Mobile layout',
      options: [
        { label: 'Automatic stack', value: 'stack' },
        { label: 'Free position', value: 'free' },
      ],
    },
    resetMobile: {
      type: 'custom',
      label: 'Reset mobile layout',
      render: () => <ResetMobileField />,
    },
    elements: {
      type: 'slot',
      allow: [...ELEMENT_TYPES],
    },
    // Empty overlay slot so free canvases stay droppable after they have children.
    // Hidden from the fields panel; drained into `elements` by CanvasDropGuard.
    dropCatch: {
      type: 'slot',
      allow: [...ELEMENT_TYPES],
    },
  },
  defaultProps: {
    displayName: '',
    backgroundColour: '#f7f8fa',
    backgroundImage: '',
    padding: 32,
    contentWidth: 'constrained',
    minHeight: 480,
    layoutMode: 'free',
    flowArrangement: 'stack',
    flowGap: 16,
    flowAlign: 'stretch',
    flowColumns: 2,
    snapEnabled: 'yes',
    snapGrid: 8,
    mobileLayout: 'stack',
    resetMobile: '',
    elements: [],
    dropCatch: [],
  },
  resolveFields: async (data, { fields }) => {
    const next = { ...fields };
    delete next.dropCatch;
    return next;
  },
  render: (props) => <CanvasSection {...props} />,
};

export const elementComponentConfigs = {
  ElementHeading: {
    label: 'Heading',
    fields: withFrameFields({
      displayName: displayNameField,
      text: { type: 'text', label: 'Text' },
      level: {
        type: 'select',
        label: 'Heading level',
        options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
          { label: 'H4', value: 'h4' },
        ],
      },
      align: { type: 'radio', label: 'Alignment', options: alignOptions },
      colour: colourField('Colour', { allowInherit: true }),
      fontSize: { type: 'number', label: 'Font size (px)', min: 12 },
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      text: 'Heading',
      level: 'h2',
      align: 'left',
      colour: '',
      fontSize: 32,
      width: 320,
      height: 0,
      heightMode: 'auto',
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementHeading {...props} />,
  },
  ElementRichText: {
    label: 'Rich text',
    fields: withFrameFields({
      displayName: displayNameField,
      text: { type: 'textarea', label: 'Text' },
      align: { type: 'radio', label: 'Alignment', options: alignOptions },
      colour: colourField('Colour', { allowInherit: true }),
      fontSize: { type: 'number', label: 'Font size (px)', min: 12 },
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      text: 'Add your supporting copy here.',
      align: 'left',
      colour: '',
      fontSize: 16,
      width: 360,
      height: 0,
      heightMode: 'auto',
      y: 80,
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementRichText {...props} />,
  },
  ElementImage: {
    label: 'Image',
    fields: withFrameFields({
      displayName: displayNameField,
      imageUrl: imageUploadField('Image'),
      imageAlt: { type: 'text', label: 'Alternative text' },
      objectFit: {
        type: 'radio',
        label: 'Image fit',
        options: [
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
        ],
      },
      lockAspectRatio: {
        type: 'radio',
        label: 'Lock aspect ratio',
        options: [
          { label: 'On', value: 'yes' },
          { label: 'Off', value: 'no' },
        ],
      },
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      imageUrl: '',
      imageAlt: '',
      objectFit: 'cover',
      lockAspectRatio: 'yes',
      width: 320,
      height: 200,
      heightMode: 'fixed',
      y: 160,
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementImage {...props} />,
  },
  ElementButton: {
    label: 'Button',
    fields: withFrameFields({
      displayName: displayNameField,
      label: { type: 'text', label: 'Label' },
      url: { type: 'text', label: 'URL or page:slug' },
      buttonStyle: buttonStyleField,
      backgroundColour: colourField('Background colour'),
      textColour: colourField('Text colour'),
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      label: 'Learn more',
      url: '#',
      buttonStyle: 'primary',
      backgroundColour: 'var(--brand-primary)',
      textColour: '#ffffff',
      width: 160,
      height: 48,
      heightMode: 'fixed',
      y: 380,
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementButton {...props} />,
  },
  ElementVideo: {
    label: 'Video',
    fields: withFrameFields({
      displayName: displayNameField,
      videoUrl: { type: 'text', label: 'Video URL (https, browser-playable)' },
      posterUrl: imageUploadField('Poster image'),
      controls: {
        type: 'radio',
        label: 'Playback controls',
        options: [
          { label: 'Show', value: 'yes' },
          { label: 'Hide', value: 'no' },
        ],
      },
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      videoUrl: '',
      posterUrl: '',
      controls: 'yes',
      width: 360,
      height: 202,
      heightMode: 'fixed',
      y: 24,
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementVideo {...props} />,
  },
  ElementContainer: {
    label: 'Content container',
    fields: withFrameFields({
      displayName: displayNameField,
      backgroundColour: colourField('Background colour'),
      padding: { type: 'number', label: 'Padding (px)', min: 0 },
      gap: { type: 'number', label: 'Gap (px)', min: 0 },
      arrangement: {
        type: 'radio',
        label: 'Child arrangement',
        options: [
          { label: 'Stack', value: 'stack' },
          { label: 'Row', value: 'row' },
        ],
      },
      elements: {
        type: 'slot',
        allow: ELEMENT_TYPES.filter((type) => type !== 'ElementContainer'),
      },
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      backgroundColour: 'rgba(255,255,255,0.9)',
      padding: 16,
      gap: 12,
      arrangement: 'stack',
      width: 360,
      height: 240,
      heightMode: 'fixed',
      elements: [],
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementContainer {...props} />,
  },
  ElementDivider: {
    label: 'Divider',
    fields: withFrameFields({
      displayName: displayNameField,
      thickness: { type: 'number', label: 'Thickness (px)', min: 1 },
      colour: colourField('Colour'),
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      thickness: 1,
      colour: '#c5ced6',
      width: 320,
      height: 16,
      heightMode: 'fixed',
      y: 40,
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementDivider {...props} />,
  },
  ElementShape: {
    label: 'Decorative shape',
    fields: withFrameFields({
      displayName: displayNameField,
      shape: {
        type: 'select',
        label: 'Shape',
        options: [
          { label: 'Rectangle', value: 'rectangle' },
          { label: 'Rounded', value: 'rounded' },
          { label: 'Circle / ellipse', value: 'ellipse' },
        ],
      },
      fill: colourField('Fill colour'),
      opacity: { type: 'number', label: 'Opacity (0–1)', min: 0, max: 1 },
    }),
    defaultProps: {
      ...frameDefaultProps,
      displayName: '',
      shape: 'rounded',
      fill: 'var(--brand-secondary)',
      opacity: 0.35,
      width: 160,
      height: 160,
      heightMode: 'fixed',
      zIndex: 0,
    },
    resolvePermissions: elementResolvePermissions,
    render: (props) => <ElementShape {...props} />,
  },
};

export const elementConfigsWithPlacement = applyPlacementToAllElementConfigs(
  elementComponentConfigs,
);

export { ELEMENT_TYPES };
