/**
 * Demo homepage generator.
 * Builds a sample Puck layout from setup details and explicit recommendations.
 * Middle content sections are Canvas Section templates (editable like free/flow Elements).
 * Header and Footer stay classic structured blocks.
 */

import {
  buildCallToActionTemplate,
  buildHeroTemplate,
  buildSectionTemplate,
} from './sectionTemplates';
import { recommendHomepage } from '../recommendations/recommendHomepage';

function id(type, suffix) {
  return `${type}-${suffix}-${Math.random().toString(36).slice(2, 8)}`;
}

function block(type, props, suffix) {
  return {
    type,
    props: {
      id: id(type, suffix),
      ...props,
    },
  };
}

function metaLine(event) {
  return [event.date, event.location].filter(Boolean).join(' · ');
}

function directionStyles(direction) {
  if (direction === 'minimal') {
    return {
      headerStyle: 'transparent',
      footerStyle: 'minimal',
    };
  }
  if (direction === 'editorial') {
    return {
      headerStyle: 'underline',
      footerStyle: 'minimal',
    };
  }
  return {
    headerStyle: 'solid',
    footerStyle: 'solid',
  };
}

const PLACEHOLDER_BUTTON_LABEL = 'Add button label';

function navFromSections(sections) {
  const links = [{ label: 'About', url: '#about' }];
  if (sections.some((section) => section.id === 'speakers' || section.component === 'Speakers')) {
    links.push({ label: 'Speakers', url: '#speakers' });
  }
  if (sections.some((section) => section.id === 'practical' || section.component === 'Faqs')) {
    links.push({ label: 'FAQs', url: '#faqs' });
  }
  return links.slice(0, 4);
}

/**
 * @param {{
 *  event: object,
 *  branding: object,
 *  contentSetup?: object,
 *  contentAvailability?: object,
 *  sectionOverrides?: object,
 *  recommendedSections?: object[],
 * }} setup
 */
export function generateDemoHomepage(setup) {
  const event = setup.event || {};
  const branding = setup.branding || {};
  const direction = branding.designDirection || 'bold';
  const styles = directionStyles(direction);

  const recommendation = setup.recommendedSections
    ? { sections: setup.recommendedSections }
    : recommendHomepage({
        event,
        contentSetup: setup.contentSetup,
        contentAvailability: setup.contentAvailability,
        sectionOverrides: setup.sectionOverrides,
      });

  const sections = recommendation.sections || [];
  const sectionBlocks = sections
    .map((section) => buildSectionTemplate(section, event, { suffix: section.id }))
    .filter(Boolean);
  const hasCtaSection = sections.some((section) => section.component === 'CallToAction');

  const logoUrl = branding.logoDataUrl || '';

  const content = [
    block(
      'Header',
      {
        eventName: event.name || 'Event name',
        logoUrl,
        logoAlt: event.name ? `${event.name} logo` : 'Event logo',
        navLinks: navFromSections(sections),
        buttonLabel: PLACEHOLDER_BUTTON_LABEL,
        buttonUrl: '#',
        buttonStyle: 'primary',
        styleVariant: styles.headerStyle,
      },
      'header',
    ),
    buildHeroTemplate(event, { suffix: 'hero' }),
    ...sectionBlocks,
    ...(hasCtaSection
      ? []
      : [
          buildCallToActionTemplate(
            { id: 'registration', title: 'Take the next step' },
            event,
            { suffix: 'registration' },
          ),
        ]),
    block(
      'Footer',
      {
        eventName: event.name || 'Event name',
        metaLine: metaLine(event),
        links: [
          { label: 'Contact', url: '#' },
          { label: 'About', url: '#about' },
        ],
        legalNote: 'Demo page created with Composer Rapid. Not a live website.',
        styleVariant: styles.footerStyle,
      },
      'footer',
    ),
  ];

  return {
    content,
    root: {
      props: {
        primaryColour: branding.primaryColour || '#2a3c4c',
        secondaryColour: branding.secondaryColour || '#00a986',
        backgroundColour: branding.backgroundColour || '#ffffff',
        font: branding.font || 'DM Sans',
        designDirection: direction,
      },
    },
  };
}
