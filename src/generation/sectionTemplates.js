/**
 * Canvas Section templates for generated and drawer-added page sections.
 * Header/Footer stay classic blocks; middle content is editable canvases.
 */

import { SECTION_GUIDANCE, getSuggestedCtaLabel } from '../constants';

function uid(prefix, suffix = 'x') {
  return `${prefix}-${suffix}-${Math.random().toString(36).slice(2, 8)}`;
}

function frameDefaults(overrides = {}) {
  return {
    height: 0,
    heightMode: 'auto',
    zIndex: 2,
    locked: 'no',
    mobileX: null,
    mobileY: null,
    mobileWidth: null,
    mobileHeight: null,
    mobileHeightMode: null,
    displayName: '',
    ...overrides,
  };
}

function headingEl({ id, text, x, y, fontSize = 32, width = 480, level = 'h2', colour = '' }) {
  return {
    type: 'ElementHeading',
    props: {
      id,
      text,
      level,
      align: 'left',
      colour,
      fontSize,
      ...frameDefaults({ x, y, width }),
    },
  };
}

function textEl({ id, text, x, y, width = 420, fontSize = 16 }) {
  return {
    type: 'ElementRichText',
    props: {
      id,
      text,
      align: 'left',
      colour: '',
      fontSize,
      ...frameDefaults({ x, y, width }),
    },
  };
}

function buttonEl({ id, label, url = '#', x, y, width = 180, style = 'primary' }) {
  return {
    type: 'ElementButton',
    props: {
      id,
      label,
      url,
      buttonStyle: style,
      backgroundColour: 'var(--brand-primary)',
      textColour: '#ffffff',
      ...frameDefaults({
        x,
        y,
        width,
        height: 48,
        heightMode: 'fixed',
      }),
    },
  };
}

function imageEl({ id, x, y, width = 280, height = 180 }) {
  return {
    type: 'ElementImage',
    props: {
      id,
      imageUrl: '',
      imageAlt: '',
      objectFit: 'cover',
      lockAspectRatio: 'yes',
      ...frameDefaults({
        x,
        y,
        width,
        height,
        heightMode: 'fixed',
      }),
    },
  };
}

function shapeEl({ id, x, y, width = 120, height = 120, fill = 'var(--brand-secondary)' }) {
  return {
    type: 'ElementShape',
    props: {
      id,
      shape: 'rounded',
      fill,
      opacity: 0.35,
      ...frameDefaults({
        x,
        y,
        width,
        height,
        heightMode: 'fixed',
        zIndex: 0,
      }),
    },
  };
}

function canvasSection({
  suffix,
  displayName,
  backgroundColour = '#f7f8fa',
  minHeight = 420,
  layoutMode = 'free',
  elements = [],
}) {
  return {
    type: 'CanvasSection',
    props: {
      id: uid('CanvasSection', suffix),
      displayName,
      backgroundColour,
      backgroundImage: '',
      padding: 32,
      contentWidth: 'constrained',
      minHeight,
      layoutMode,
      flowArrangement: 'stack',
      flowGap: 16,
      flowAlign: 'stretch',
      flowColumns: 2,
      snapEnabled: 'yes',
      snapGrid: 8,
      mobileLayout: 'stack',
      resetMobile: '',
      dropCatch: [],
      elements,
    },
  };
}

function guidanceFor(section) {
  return section?.guidance || SECTION_GUIDANCE[section?.id] || section?.explanation || '';
}

function metaLine(event) {
  return [event?.date, event?.location].filter(Boolean).join(' · ');
}

function resolvePrimaryCtaLabel(event) {
  const custom = event?.ctaLabel?.trim();
  if (custom) return custom;
  return getSuggestedCtaLabel(event?.objective) || 'Primary action';
}

/** Catalog entries for the Sections drawer (same builders as generation). */
export const SECTION_TEMPLATE_CATALOG = [
  { id: 'hero', label: 'Hero', component: 'Hero' },
  { id: 'introduction', label: 'Introduction', component: 'Introduction' },
  { id: 'highlights', label: 'Highlights', component: 'Highlights' },
  { id: 'information', label: 'Information', component: 'Information' },
  { id: 'speakers', label: 'Speakers', component: 'Speakers' },
  { id: 'sponsors', label: 'Sponsors', component: 'Sponsors' },
  { id: 'testimonials', label: 'Testimonials', component: 'Testimonials' },
  { id: 'stats', label: 'Stats', component: 'Stats' },
  { id: 'faqs', label: 'FAQs', component: 'Faqs' },
  { id: 'cta', label: 'Call to action', component: 'CallToAction' },
  { id: 'blank', label: 'Blank canvas', component: 'Blank' },
];

export function buildHeroTemplate(event = {}, { suffix = 'hero' } = {}) {
  const s = suffix;
  return canvasSection({
    suffix: s,
    displayName: 'Hero',
    backgroundColour: '#eef2f5',
    minHeight: 480,
    elements: [
      shapeEl({ id: uid('ElementShape', s), x: 520, y: 40, width: 200, height: 200 }),
      headingEl({
        id: uid('ElementHeading', s),
        text: event.name || 'Your event headline',
        x: 32,
        y: 48,
        fontSize: 44,
        width: 460,
        level: 'h1',
      }),
      textEl({
        id: uid('ElementRichText', s),
        text: event.description || 'Add a short description of your event.',
        x: 32,
        y: 140,
        width: 440,
      }),
      buttonEl({
        id: uid('ElementButton', `${s}-a`),
        label: resolvePrimaryCtaLabel(event),
        url: event.ctaUrl?.trim() || '#',
        x: 32,
        y: 240,
      }),
      buttonEl({
        id: uid('ElementButton', `${s}-b`),
        label: 'Secondary action',
        url: '#',
        x: 230,
        y: 240,
        style: 'secondary',
      }),
      imageEl({ id: uid('ElementImage', s), x: 520, y: 180, width: 300, height: 220 }),
    ],
  });
}

export function buildIntroductionTemplate(section = {}, event = {}, { suffix } = {}) {
  const s = suffix || section.id || 'intro';
  const guidance = guidanceFor(section);
  const supplied = [event.description, event.audience ? `For ${event.audience}.` : '']
    .filter(Boolean)
    .join(' ');
  const heading =
    section.title === 'Topic' ? event.name || section.title || 'Introduction' : section.title || 'Introduction';

  return canvasSection({
    suffix: s,
    displayName: section.title || 'Introduction',
    backgroundColour: '#ffffff',
    minHeight: 320,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: heading,
        x: 32,
        y: 32,
        fontSize: 32,
      }),
      textEl({
        id: uid('ElementRichText', s),
        text: supplied || guidance || 'Introduce your event for visitors.',
        x: 32,
        y: 96,
        width: 520,
      }),
    ],
  });
}

export function buildHighlightsTemplate(section = {}, { suffix } = {}) {
  const s = suffix || section.id || 'highlights';
  const guidance = guidanceFor(section) || 'Add a short supporting detail.';
  const title = section.title || 'Highlights';
  const cards = [0, 1, 2].map((index) => {
    const x = 32 + index * 220;
    return [
      headingEl({
        id: uid('ElementHeading', `${s}-${index}`),
        text: 'Benefit or highlight',
        x,
        y: 100,
        fontSize: 20,
        width: 200,
        level: 'h3',
      }),
      textEl({
        id: uid('ElementRichText', `${s}-${index}`),
        text: index === 0 ? guidance : 'Add a short supporting detail.',
        x,
        y: 150,
        width: 200,
        fontSize: 14,
      }),
    ];
  });

  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#f7fafb',
    minHeight: 360,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
        fontSize: 28,
      }),
      ...cards.flat(),
    ],
  });
}

export function buildInformationTemplate(section = {}, event = {}, { suffix } = {}) {
  const s = suffix || section.id || 'info';
  const guidance = guidanceFor(section);
  const title = section.title || 'Information';
  const variant = section.variant || 'info';

  let body = guidance;
  let lines = [];

  if (variant === 'audience') {
    body = event.audience ? `This event is aimed at ${event.audience}.` : guidance;
  } else if (variant === 'venue' || variant === 'datetime') {
    lines = [
      `Date: ${event.date || 'Add your confirmed date.'}`,
      `${variant === 'datetime' ? 'Access' : 'Location'}: ${
        event.location || 'Add location or online access details.'
      }`,
    ];
  } else if (variant === 'format') {
    const formatLabel =
      { in_person: 'In person', online: 'Online', hybrid: 'Hybrid' }[event.format] ||
      'Add your format';
    lines = [`Format: ${formatLabel}`, 'What to expect: Describe how the event is structured.'];
  } else {
    lines = ['Detail: Add the information visitors need.'];
  }

  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#ffffff',
    minHeight: 340,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
      }),
      textEl({
        id: uid('ElementRichText', `${s}-body`),
        text: body || 'Add details visitors need.',
        x: 32,
        y: 96,
        width: 520,
      }),
      ...lines.map((line, index) =>
        textEl({
          id: uid('ElementRichText', `${s}-l${index}`),
          text: line,
          x: 32,
          y: 180 + index * 48,
          width: 480,
          fontSize: 15,
        }),
      ),
    ],
  });
}

export function buildSpeakersTemplate(section = {}, { suffix } = {}) {
  const s = suffix || section.id || 'speakers';
  const title = section.title || 'Speakers';
  const cards = [0, 1].map((index) => {
    const x = 32 + index * 340;
    return [
      imageEl({
        id: uid('ElementImage', `${s}-${index}`),
        x,
        y: 100,
        width: 140,
        height: 140,
      }),
      headingEl({
        id: uid('ElementHeading', `${s}-${index}`),
        text: 'Speaker name',
        x: x + 156,
        y: 100,
        fontSize: 20,
        width: 160,
        level: 'h3',
      }),
      textEl({
        id: uid('ElementRichText', `${s}-${index}`),
        text: 'Role or organisation\n\nAdd a short biography for a confirmed speaker.',
        x: x + 156,
        y: 140,
        width: 160,
        fontSize: 14,
      }),
    ];
  });

  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#f4f7f9',
    minHeight: 400,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
      }),
      ...cards.flat(),
    ],
  });
}

export function buildSponsorsTemplate(section = {}, { suffix } = {}) {
  const s = suffix || section.id || 'sponsors';
  const title = section.title || 'Sponsors';
  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#ffffff',
    minHeight: 280,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
      }),
      textEl({
        id: uid('ElementRichText', s),
        text: guidanceFor(section) || 'Add sponsor names and logos.',
        x: 32,
        y: 88,
        width: 400,
      }),
      imageEl({ id: uid('ElementImage', `${s}-0`), x: 32, y: 150, width: 140, height: 72 }),
      imageEl({ id: uid('ElementImage', `${s}-1`), x: 196, y: 150, width: 140, height: 72 }),
      imageEl({ id: uid('ElementImage', `${s}-2`), x: 360, y: 150, width: 140, height: 72 }),
    ],
  });
}

export function buildTestimonialsTemplate(section = {}, { suffix } = {}) {
  const s = suffix || section.id || 'testimonials';
  const title = section.title || 'Testimonials';
  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#eef7f4',
    minHeight: 320,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
      }),
      textEl({
        id: uid('ElementRichText', `${s}-q`),
        text: '“Add a real endorsement once you have permission to use it.”',
        x: 32,
        y: 100,
        width: 520,
        fontSize: 18,
      }),
      textEl({
        id: uid('ElementRichText', `${s}-n`),
        text: 'Name — Role or organisation',
        x: 32,
        y: 200,
        width: 360,
        fontSize: 14,
      }),
    ],
  });
}

export function buildStatsTemplate(section = {}, { suffix } = {}) {
  const s = suffix || section.id || 'stats';
  const title = section.title || 'Stats';
  const stats = [0, 1, 2].map((index) => {
    const x = 32 + index * 200;
    return [
      headingEl({
        id: uid('ElementHeading', `${s}-${index}`),
        text: '—',
        x,
        y: 110,
        fontSize: 40,
        width: 160,
        level: 'h3',
        colour: 'var(--brand-secondary)',
      }),
      textEl({
        id: uid('ElementRichText', `${s}-${index}`),
        text: 'Add a confirmed figure',
        x,
        y: 170,
        width: 160,
        fontSize: 14,
      }),
    ];
  });

  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#2a3c4c',
    minHeight: 300,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
        colour: '#ffffff',
      }),
      ...stats.flat().map((el) => {
        if (el.type === 'ElementRichText') {
          return {
            ...el,
            props: { ...el.props, colour: 'rgba(255,255,255,0.85)' },
          };
        }
        if (el.type === 'ElementHeading' && el.props.text === '—') {
          return el;
        }
        return el;
      }),
    ],
  });
}

export function buildFaqsTemplate(section = {}, { suffix } = {}) {
  const s = suffix || section.id || 'faqs';
  const title = section.title || 'FAQs';
  const guidance = guidanceFor(section) || 'Add a clear answer for attendees.';
  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#ffffff',
    minHeight: 380,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 28,
      }),
      headingEl({
        id: uid('ElementHeading', `${s}-q1`),
        text: 'Add a practical question',
        x: 32,
        y: 100,
        fontSize: 18,
        width: 520,
        level: 'h3',
      }),
      textEl({
        id: uid('ElementRichText', `${s}-a1`),
        text: guidance,
        x: 32,
        y: 140,
        width: 520,
      }),
      headingEl({
        id: uid('ElementHeading', `${s}-q2`),
        text: 'Add another practical question',
        x: 32,
        y: 220,
        fontSize: 18,
        width: 520,
        level: 'h3',
      }),
      textEl({
        id: uid('ElementRichText', `${s}-a2`),
        text: 'Add a clear answer for attendees.',
        x: 32,
        y: 260,
        width: 520,
      }),
    ],
  });
}

export function buildCallToActionTemplate(section = {}, event = {}, { suffix } = {}) {
  const s = suffix || section.id || 'cta';
  const title = section.title || 'Take the next step';
  const guidance = guidanceFor(section) || 'Set the button label and destination link in the editor.';
  return canvasSection({
    suffix: s,
    displayName: title,
    backgroundColour: '#e8f8f3',
    minHeight: 280,
    elements: [
      headingEl({
        id: uid('ElementHeading', s),
        text: title,
        x: 32,
        y: 40,
      }),
      textEl({
        id: uid('ElementRichText', s),
        text: metaLine(event) || guidance,
        x: 32,
        y: 110,
        width: 480,
      }),
      buttonEl({
        id: uid('ElementButton', s),
        label: resolvePrimaryCtaLabel(event),
        url: event.ctaUrl?.trim() || '#',
        x: 32,
        y: 180,
      }),
    ],
  });
}

export function buildBlankCanvasTemplate({ suffix = 'blank', title = 'Canvas Section' } = {}) {
  return canvasSection({
    suffix,
    displayName: title,
    backgroundColour: '#f7f8fa',
    minHeight: 360,
    elements: [
      headingEl({
        id: uid('ElementHeading', suffix),
        text: title,
        x: 32,
        y: 32,
      }),
      textEl({
        id: uid('ElementRichText', suffix),
        text: 'Double-click to edit elements. Add more from the Elements rail.',
        x: 32,
        y: 96,
        width: 440,
      }),
    ],
  });
}

/**
 * Build a Canvas Section template from a recommendation section or catalog entry.
 */
export function buildSectionTemplate(section, event = {}, options = {}) {
  const component = section?.component || section?.id || 'Blank';
  const suffix = options.suffix || section?.id || component.toLowerCase();

  switch (component) {
    case 'Hero':
      return buildHeroTemplate(event, { suffix });
    case 'Introduction':
      return buildIntroductionTemplate(section, event, { suffix });
    case 'Highlights':
      return buildHighlightsTemplate(section, { suffix });
    case 'Information':
      return buildInformationTemplate(section, event, { suffix });
    case 'Speakers':
      return buildSpeakersTemplate(section, { suffix });
    case 'Sponsors':
      return buildSponsorsTemplate(section, { suffix });
    case 'Testimonials':
      return buildTestimonialsTemplate(section, { suffix });
    case 'Stats':
      return buildStatsTemplate(section, { suffix });
    case 'Faqs':
      return buildFaqsTemplate(section, { suffix });
    case 'CallToAction':
      return buildCallToActionTemplate(section, event, { suffix });
    case 'Blank':
    case 'CanvasSection':
      return buildBlankCanvasTemplate({
        suffix,
        title: section?.title || section?.label || 'Canvas Section',
      });
    default:
      return buildBlankCanvasTemplate({
        suffix,
        title: section?.title || component,
      });
  }
}

/** Insert a catalog template (drawer). */
export function buildCatalogTemplate(catalogId, event = {}) {
  const entry = SECTION_TEMPLATE_CATALOG.find((item) => item.id === catalogId);
  if (!entry) {
    return buildBlankCanvasTemplate({ suffix: catalogId });
  }
  return buildSectionTemplate(
    { id: entry.id, component: entry.component, title: entry.label },
    event,
    { suffix: entry.id },
  );
}
