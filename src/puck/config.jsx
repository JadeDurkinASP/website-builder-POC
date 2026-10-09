import { FONT_OPTIONS, getFontStack } from '../constants';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Introduction } from './components/Introduction';
import { Stats } from './components/Stats';
import { Testimonials } from './components/Testimonials';
import { Speakers } from './components/Speakers';
import { Sponsors } from './components/Sponsors';
import { Faqs } from './components/Faqs';
import { Highlights } from './components/Highlights';
import { Information } from './components/Information';
import { CustomSection } from './components/CustomSection';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import { buttonStyleField } from './buttonStyles';
import {
  alignField,
  colourField,
  imageUploadField,
  inlineTextareaField,
  inlineTextField,
  spacingField,
} from './fields';
import {
  canvasSectionConfig,
  elementConfigsWithPlacement,
  ELEMENT_TYPES,
} from './canvas/elementConfigs';

const contentStateField = {
  type: 'radio',
  label: 'Content state',
  options: [
    { label: 'Content needed', value: 'needs_content' },
    { label: 'Ready', value: 'ready' },
  ],
};

const guidanceField = {
  type: 'textarea',
  label: 'Editor guidance',
};

function clearPlaceholdersWhenReady(data) {
  const props = data.props || {};
  const collections = [props.items, props.cards, props.logos].filter(Array.isArray);
  const hasPlaceholder = collections.some((list) =>
    list.some((item) => item.isPlaceholder === 'yes' || item.isPlaceholder === true),
  );
  if (collections.length > 0 && !hasPlaceholder && props.contentState === 'needs_content') {
    return { props: { ...props, contentState: 'ready' } };
  }
  return { props };
}

const fontField = {
  type: 'select',
  label: 'Font',
  options: FONT_OPTIONS.map((font) => ({ label: font.label, value: font.value })),
};

export const puckConfig = {
  categories: {
    // Classic blocks stay registered for old projects but are hidden from the
    // Sections drawer — new sections come from canvas templates in SectionsPlugin.
    layout: {
      title: 'Layout',
      visible: false,
      components: ['Header', 'Hero', 'Introduction', 'CallToAction', 'CanvasSection', 'Footer'],
    },
    content: {
      title: 'Content sections',
      visible: false,
      components: [
        'CustomSection',
        'Highlights',
        'Information',
        'Stats',
        'Testimonials',
        'Speakers',
        'Sponsors',
        'Faqs',
      ],
    },
    // Hidden — available via the Elements plugin and Canvas Section slots.
    elements: {
      title: 'Elements',
      visible: false,
      components: [...ELEMENT_TYPES],
    },
  },
  root: {
    label: 'Page',
    fields: {
      // Owned by the Brand rail panel — hidden from the right inspector.
      primaryColour: {
        ...colourField('Primary colour', { includeBrand: false }),
        visible: false,
      },
      secondaryColour: {
        ...colourField('Secondary colour', { includeBrand: false }),
        visible: false,
      },
      backgroundColour: {
        ...colourField('Background colour', { includeBrand: false }),
        visible: false,
      },
      font: { ...fontField, visible: false },
      designDirection: {
        type: 'select',
        label: 'Design direction',
        visible: false,
        options: [
          { label: 'Bold', value: 'bold' },
          { label: 'Minimal', value: 'minimal' },
          { label: 'Editorial', value: 'editorial' },
        ],
      },
    },
    defaultProps: {
      primaryColour: '#2a3c4c',
      secondaryColour: '#00a986',
      backgroundColour: '#ffffff',
      font: 'DM Sans',
      designDirection: 'bold',
    },
    render: ({
      children,
      primaryColour,
      secondaryColour,
      backgroundColour,
      font,
      designDirection,
    }) => (
      <div
        className={`cr-event-page cr-direction-${designDirection || 'bold'}`}
        style={{
          '--brand-primary': primaryColour || '#2a3c4c',
          '--brand-secondary': secondaryColour || '#00a986',
          '--brand-bg': backgroundColour || '#ffffff',
          '--brand-font': getFontStack(font),
          backgroundColor: backgroundColour || '#ffffff',
          fontFamily: getFontStack(font),
          color: primaryColour || '#2a3c4c',
        }}
      >
        {children}
      </div>
    ),
  },
  components: {
    Header: {
      label: 'Header',
      fields: {
        eventName: inlineTextField('Event name'),
        logoUrl: imageUploadField('Logo'),
        logoAlt: { type: 'text', label: 'Logo alternative text' },
        navLinks: {
          type: 'array',
          label: 'Navigation links',
          getItemSummary: (item) => item.label || 'Link',
          arrayFields: {
            label: inlineTextField('Label'),
            url: { type: 'text', label: 'URL' },
          },
          defaultItemProps: { label: 'About', url: '#about' },
        },
        buttonLabel: inlineTextField('Button label'),
        buttonUrl: { type: 'text', label: 'Button URL' },
        buttonStyle: buttonStyleField,
        styleVariant: {
          type: 'radio',
          label: 'Style',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Transparent', value: 'transparent' },
            { label: 'Underline', value: 'underline' },
          ],
        },
      },
      defaultProps: {
        eventName: 'Event name',
        logoUrl: '',
        logoAlt: '',
        navLinks: [
          { label: 'About', url: '#about' },
          { label: 'Speakers', url: '#speakers' },
        ],
        buttonLabel: 'Add button label',
        buttonUrl: '#',
        buttonStyle: 'primary',
        styleVariant: 'solid',
      },
      render: (props) => <Header {...props} />,
    },
    Hero: {
      label: 'Hero',
      fields: {
        headline: inlineTextField('Headline'),
        subcopy: inlineTextareaField('Supporting text'),
        imageUrl: imageUploadField('Hero image'),
        imageAlt: { type: 'text', label: 'Image alternative text' },
        buttons: {
          type: 'array',
          label: 'Buttons',
          getItemSummary: (item) => item.label || 'Button',
          arrayFields: {
            label: inlineTextField('Label'),
            url: { type: 'text', label: 'URL' },
            style: buttonStyleField,
          },
          defaultItemProps: {
            label: 'Add button label',
            url: '#',
            style: 'primary',
          },
        },
        alignment: alignField,
        density: {
          type: 'select',
          label: 'Density',
          options: [
            { label: 'Compact', value: 'compact' },
            { label: 'Default', value: 'default' },
            { label: 'Spacious', value: 'spacious' },
          ],
        },
        layoutVariant: {
          type: 'select',
          label: 'Layout',
          options: [
            { label: 'Split', value: 'split' },
            { label: 'Stacked', value: 'stacked' },
            { label: 'Banner', value: 'banner' },
          ],
        },
      },
      defaultProps: {
        headline: 'Your event headline',
        subcopy: 'A short supporting sentence about the event.',
        imageUrl: '',
        imageAlt: '',
        buttons: [
          { label: 'Primary action', url: '#', style: 'primary' },
          { label: 'Secondary action', url: '#', style: 'secondary' },
        ],
        alignment: 'left',
        density: 'default',
        layoutVariant: 'split',
      },
      render: (props) => <Hero {...props} />,
    },
    Introduction: {
      label: 'Introduction',
      fields: {
        heading: inlineTextField('Heading'),
        body: inlineTextareaField('Body'),
        contentState: contentStateField,
        guidance: guidanceField,
        layoutVariant: {
          type: 'radio',
          label: 'Layout',
          options: [
            { label: 'Single column', value: 'single' },
            { label: 'Narrow measure', value: 'narrow' },
            { label: 'Wide lead', value: 'wide' },
          ],
        },
        alignment: alignField,
        spacing: spacingField,
      },
      defaultProps: {
        heading: 'Why attend',
        body: 'Describe what attendees will learn or experience.',
        contentState: 'ready',
        guidance: '',
        layoutVariant: 'single',
        alignment: 'left',
        spacing: 'default',
      },
      render: (props) => <Introduction {...props} />,
    },
    Highlights: {
      label: 'Highlights',
      fields: {
        heading: inlineTextField('Heading'),
        contentState: contentStateField,
        guidance: guidanceField,
        items: {
          type: 'array',
          label: 'Highlight cards',
          getItemSummary: (item) => item.title || 'Highlight',
          arrayFields: {
            title: inlineTextField('Title'),
            body: inlineTextareaField('Body'),
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            title: 'Highlight title',
            body: 'Add a short supporting detail.',
            isPlaceholder: 'yes',
          },
        },
        layoutVariant: {
          type: 'radio',
          label: 'Layout',
          options: [
            { label: 'Grid', value: 'grid' },
            { label: 'Stacked', value: 'stacked' },
          ],
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'Highlights',
        contentState: 'needs_content',
        guidance: '',
        items: [
          {
            title: 'Highlight title',
            body: 'Add a short supporting detail.',
            isPlaceholder: 'yes',
          },
        ],
        layoutVariant: 'grid',
        spacing: 'default',
        alignment: 'left',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Highlights {...props} />,
    },
    Information: {
      label: 'Information',
      fields: {
        heading: inlineTextField('Heading'),
        body: inlineTextareaField('Body'),
        contentState: contentStateField,
        guidance: guidanceField,
        items: {
          type: 'array',
          label: 'Information rows',
          getItemSummary: (item) => item.label || 'Detail',
          arrayFields: {
            label: inlineTextField('Label'),
            detail: inlineTextareaField('Detail'),
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            label: 'Detail label',
            detail: 'Add the detail visitors need.',
            isPlaceholder: 'yes',
          },
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'Good to know',
        body: 'Add practical information for visitors.',
        contentState: 'needs_content',
        guidance: '',
        items: [
          {
            label: 'Detail label',
            detail: 'Add the detail visitors need.',
            isPlaceholder: 'yes',
          },
        ],
        spacing: 'default',
        alignment: 'left',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Information {...props} />,
    },
    Stats: {
      label: 'Stats',
      fields: {
        heading: inlineTextField('Heading'),
        contentState: contentStateField,
        guidance: guidanceField,
        items: {
          type: 'array',
          label: 'Statistics',
          getItemSummary: (item) => item.label || item.value || 'Statistic',
          arrayFields: {
            value: inlineTextField('Value'),
            label: inlineTextField('Label'),
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            value: '—',
            label: 'Placeholder statistic — replace with your figure',
            isPlaceholder: 'yes',
          },
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'At a glance',
        contentState: 'needs_content',
        guidance: '',
        items: [
          {
            value: '—',
            label: 'Placeholder statistic — replace with your figure',
            isPlaceholder: 'yes',
          },
        ],
        spacing: 'default',
        alignment: 'centre',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Stats {...props} />,
    },
    Testimonials: {
      label: 'Testimonials',
      fields: {
        heading: inlineTextField('Heading'),
        contentState: contentStateField,
        guidance: guidanceField,
        items: {
          type: 'array',
          label: 'Testimonials',
          getItemSummary: (item) => item.name || 'Testimonial',
          arrayFields: {
            quote: inlineTextareaField('Quote'),
            name: inlineTextField('Name'),
            role: inlineTextField('Role'),
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            quote: 'Add a real endorsement here.',
            name: 'Placeholder name',
            role: 'Role or organisation',
            isPlaceholder: 'yes',
          },
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'What people say',
        contentState: 'needs_content',
        guidance: '',
        items: [
          {
            quote: 'Add a real endorsement here.',
            name: 'Placeholder name',
            role: 'Role or organisation',
            isPlaceholder: 'yes',
          },
        ],
        spacing: 'default',
        alignment: 'left',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Testimonials {...props} />,
    },
    Speakers: {
      label: 'Speakers',
      fields: {
        heading: inlineTextField('Heading'),
        contentState: contentStateField,
        guidance: guidanceField,
        cards: {
          type: 'array',
          label: 'Speakers',
          getItemSummary: (item) => item.name || 'Speaker',
          arrayFields: {
            name: inlineTextField('Name'),
            role: inlineTextField('Role'),
            bio: inlineTextareaField('Bio'),
            imageUrl: imageUploadField('Photo'),
            imageAlt: { type: 'text', label: 'Photo alternative text' },
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            name: 'Speaker name',
            role: 'Role or organisation',
            bio: 'Short biography.',
            imageUrl: '',
            imageAlt: '',
            isPlaceholder: 'yes',
          },
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'Speakers',
        contentState: 'needs_content',
        guidance: '',
        cards: [
          {
            name: 'Speaker name',
            role: 'Role or organisation',
            bio: 'Short biography.',
            imageUrl: '',
            imageAlt: '',
            isPlaceholder: 'yes',
          },
        ],
        spacing: 'default',
        alignment: 'left',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Speakers {...props} />,
    },
    Sponsors: {
      label: 'Sponsors',
      fields: {
        heading: inlineTextField('Heading'),
        contentState: contentStateField,
        guidance: guidanceField,
        logos: {
          type: 'array',
          label: 'Sponsors',
          getItemSummary: (item) => item.name || 'Sponsor',
          arrayFields: {
            name: inlineTextField('Name'),
            imageUrl: imageUploadField('Logo'),
            imageAlt: { type: 'text', label: 'Logo alternative text' },
            url: { type: 'text', label: 'Website URL' },
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            name: 'Sponsor name',
            imageUrl: '',
            imageAlt: '',
            url: '',
            isPlaceholder: 'yes',
          },
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'Sponsors',
        contentState: 'needs_content',
        guidance: '',
        logos: [
          {
            name: 'Sponsor name',
            imageUrl: '',
            imageAlt: '',
            url: '',
            isPlaceholder: 'yes',
          },
        ],
        spacing: 'default',
        alignment: 'centre',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Sponsors {...props} />,
    },
    Faqs: {
      label: 'FAQs',
      fields: {
        heading: inlineTextField('Heading'),
        contentState: contentStateField,
        guidance: guidanceField,
        items: {
          type: 'array',
          label: 'Questions',
          getItemSummary: (item) => item.question || 'Question',
          arrayFields: {
            question: inlineTextField('Question'),
            answer: inlineTextareaField('Answer'),
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            question: 'Your question here?',
            answer: 'Add a clear answer for attendees.',
            isPlaceholder: 'yes',
          },
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'Frequently asked questions',
        contentState: 'needs_content',
        guidance: '',
        items: [
          {
            question: 'Your question here?',
            answer: 'Add a clear answer for attendees.',
            isPlaceholder: 'yes',
          },
        ],
        spacing: 'default',
        alignment: 'left',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <Faqs {...props} />,
    },
    CallToAction: {
      label: 'Call to action',
      fields: {
        heading: inlineTextField('Heading'),
        body: inlineTextareaField('Body'),
        contentState: contentStateField,
        guidance: guidanceField,
        buttonLabel: inlineTextField('Button label'),
        buttonUrl: { type: 'text', label: 'Button URL' },
        buttonStyle: buttonStyleField,
        backgroundTreatment: {
          type: 'select',
          label: 'Background',
          options: [
            { label: 'Brand band', value: 'brand' },
            { label: 'Soft', value: 'soft' },
            { label: 'Outline', value: 'outline' },
          ],
        },
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'Ready to join?',
        body: 'Add a short invitation for visitors to take the next step.',
        contentState: 'needs_content',
        guidance: 'Set the button label and destination link in the editor.',
        buttonLabel: 'Add button label',
        buttonUrl: '#',
        buttonStyle: 'primary',
        backgroundTreatment: 'brand',
        spacing: 'default',
        alignment: 'centre',
      },
      render: (props) => <CallToAction {...props} />,
    },
    CustomSection: {
      label: 'Custom section',
      fields: {
        heading: inlineTextField('Section heading'),
        body: inlineTextareaField('Intro text'),
        contentState: contentStateField,
        guidance: guidanceField,
        layoutVariant: {
          type: 'radio',
          label: 'Layout',
          options: [
            { label: 'Text only', value: 'text' },
            { label: 'Stacked list', value: 'list' },
            { label: 'Card grid', value: 'grid' },
            { label: 'Two columns', value: 'split' },
          ],
        },
        items: {
          type: 'array',
          label: 'Items (for list, grid or two-column layouts)',
          getItemSummary: (item) => item.title || 'Item',
          arrayFields: {
            title: inlineTextField('Title'),
            body: inlineTextareaField('Body'),
            imageUrl: imageUploadField('Image'),
            imageAlt: { type: 'text', label: 'Image alternative text' },
            isPlaceholder: {
              type: 'radio',
              label: 'Placeholder item',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          },
          defaultItemProps: {
            title: 'Item title',
            body: 'Add your content here.',
            imageUrl: '',
            imageAlt: '',
            isPlaceholder: 'no',
          },
        },
        buttonLabel: inlineTextField('Optional button label'),
        buttonUrl: { type: 'text', label: 'Optional button URL' },
        buttonStyle: buttonStyleField,
        spacing: spacingField,
        alignment: alignField,
      },
      defaultProps: {
        heading: 'New section',
        body: 'Describe this section in your own words.',
        contentState: 'needs_content',
        guidance: 'Replace this heading and text with your own content. Add items if you need a list or grid.',
        layoutVariant: 'text',
        items: [],
        buttonLabel: '',
        buttonUrl: '#',
        buttonStyle: 'primary',
        spacing: 'default',
        alignment: 'left',
      },
      resolveData: clearPlaceholdersWhenReady,
      render: (props) => <CustomSection {...props} />,
    },
    Footer: {
      label: 'Footer',
      fields: {
        eventName: inlineTextField('Event name'),
        metaLine: inlineTextField('Date and location line'),
        links: {
          type: 'array',
          label: 'Links',
          getItemSummary: (item) => item.label || 'Link',
          arrayFields: {
            label: inlineTextField('Label'),
            url: { type: 'text', label: 'URL' },
          },
          defaultItemProps: { label: 'Contact', url: '#' },
        },
        legalNote: inlineTextareaField('Legal note'),
        styleVariant: {
          type: 'radio',
          label: 'Style',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Minimal', value: 'minimal' },
          ],
        },
      },
      defaultProps: {
        eventName: 'Event name',
        metaLine: '',
        links: [{ label: 'Contact', url: '#' }],
        legalNote: 'Demo page created with Composer Rapid. Not a live website.',
        styleVariant: 'solid',
      },
      render: (props) => <Footer {...props} />,
    },
    CanvasSection: canvasSectionConfig,
    ...elementConfigsWithPlacement,
  },
};
