import {
  DEFAULT_BRANDING,
  DEFAULT_CONTENT_AVAILABILITY,
  DEFAULT_OPTIONAL_SECTIONS,
  PROJECT_VERSION,
} from '../constants';
import { generateDemoHomepage } from '../generation/generateDemoHomepage';
import { projectFromHomepagePuckData } from '../pages/pageModel';
import { recommendHomepage } from '../recommendations/recommendHomepage';
import {
  createEmptyContentSetup,
  syncOptionalSectionsFromResolved,
} from '../storage/projectStorage';

/** Clearly fictional sample content for the demo walkthrough. */
export const SAMPLE_EVENT = {
  event: {
    name: 'Northbridge Ideas Summit 2026',
    description:
      'A one-day gathering for product thinkers exploring practical ways to ship clearer customer experiences.',
    audience: 'Product managers, designers and engineering leads',
    date: '12 September 2026',
    location: 'Harbour Hall, Bristol',
    ctaLabel: '',
    ctaUrl: '',
    eventType: 'conference',
    format: 'hybrid',
    objective: null,
    ctaLabelCustomised: false,
  },
  branding: {
    ...DEFAULT_BRANDING,
    primaryColour: '#1f3a4a',
    secondaryColour: '#00a986',
    backgroundColour: '#f7faf9',
    font: 'Space Grotesk',
    designDirection: 'bold',
    logoDataUrl: '',
  },
  contentAvailability: {
    ...DEFAULT_CONTENT_AVAILABILITY,
  },
  contentSetup: {
    ...createEmptyContentSetup(),
    hasExistingContent: 'no',
    wantSuggestions: 'yes',
    suggestMissingAreas: false,
    pastedText: '',
    coveredSectionIds: [],
    assets: [],
  },
  sectionOverrides: {},
  optionalSections: {
    ...DEFAULT_OPTIONAL_SECTIONS,
  },
};

/**
 * Build a full sample project for debugging.
 * @param {{ withHomepage?: boolean }} [options]
 */
export function buildSampleProject({ withHomepage = false } = {}) {
  const event = { ...SAMPLE_EVENT.event };
  const branding = { ...SAMPLE_EVENT.branding };
  const contentAvailability = { ...SAMPLE_EVENT.contentAvailability };
  const contentSetup = {
    ...createEmptyContentSetup(),
    ...(SAMPLE_EVENT.contentSetup || {}),
    coveredSectionIds: [...(SAMPLE_EVENT.contentSetup?.coveredSectionIds || [])],
    assets: [...(SAMPLE_EVENT.contentSetup?.assets || [])],
  };
  const sectionOverrides = { ...(SAMPLE_EVENT.sectionOverrides || {}) };

  const recommendation = recommendHomepage({
    event,
    contentSetup,
    contentAvailability,
    sectionOverrides,
  });

  const base = {
    version: PROJECT_VERSION,
    event,
    branding,
    contentAvailability,
    contentSetup,
    sectionOverrides,
    optionalSections: withHomepage
      ? syncOptionalSectionsFromResolved(recommendation.sections)
      : { ...DEFAULT_OPTIONAL_SECTIONS },
    pages: [],
    activePageId: null,
    puckData: null,
    updatedAt: new Date().toISOString(),
  };

  if (!withHomepage) return base;

  const puckData = generateDemoHomepage({
    event,
    branding,
    contentSetup,
    contentAvailability,
    sectionOverrides,
    recommendedSections: recommendation.sections,
  });

  return projectFromHomepagePuckData(base, puckData);
}
