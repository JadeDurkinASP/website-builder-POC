import { needsLocation, SECTION_GUIDANCE } from '../constants';
import { AVAILABILITY_SECTIONS, EVENT_PROFILES } from './eventProfiles';

function cloneSection(section) {
  return {
    ...section,
    guidance: SECTION_GUIDANCE[section.id] || section.explanation,
  };
}

function getProfileSections(eventType) {
  return (EVENT_PROFILES[eventType] || EVENT_PROFILES.other).map(cloneSection);
}

function collectCandidateSections(eventType) {
  const base = getProfileSections(eventType);
  const extras = AVAILABILITY_SECTIONS.map(cloneSection);
  const byId = new Map();
  [...base, ...extras].forEach((section) => byId.set(section.id, section));
  return [...byId.values()];
}

function sortByProfile(sections, eventType) {
  const profileOrder = getProfileSections(eventType).map((section) => section.id);
  const extraOrder = AVAILABILITY_SECTIONS.map((section) => section.id);
  const order = [...profileOrder, ...extraOrder];
  return [...sections].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

function missingEssentialsFor(event) {
  const missingEssentials = [];
  if (!event.name?.trim()) {
    missingEssentials.push({ field: 'name', message: 'Add an event name.' });
  }
  if (!event.date?.trim()) {
    missingEssentials.push({ field: 'date', message: 'Add the event date.' });
  }
  if (needsLocation(event.format) && !event.location?.trim()) {
    missingEssentials.push({ field: 'location', message: 'Add a location for this format.' });
  }
  return missingEssentials;
}

function applyOverrides(sections, sectionOverrides, candidates) {
  const byId = new Map(candidates.map((section) => [section.id, section]));
  const included = new Map(sections.map((section) => [section.id, section]));

  Object.entries(sectionOverrides || {}).forEach(([id, value]) => {
    if (!byId.has(id)) return;
    if (value === true) {
      included.set(id, { ...byId.get(id), include: true, usesPlaceholder: true });
    } else if (value === false) {
      included.delete(id);
    }
  });

  return [...included.values()];
}

/**
 * Build homepage section recommendations from explicit event-profile rules.
 * Driven by contentSetup Yes/No answers and event type — not AI-generated.
 */
export function recommendHomepage({
  event = {},
  contentSetup = {},
  contentAvailability = {},
  sectionOverrides = {},
} = {}) {
  const eventType = event.eventType || 'other';
  const candidates = collectCandidateSections(eventType);
  const profileCore = getProfileSections(eventType);
  const extras = AVAILABILITY_SECTIONS.map(cloneSection);

  const hasExisting = contentSetup.hasExistingContent;
  const wantSuggestions = contentSetup.wantSuggestions;
  const suggestMissingAreas = Boolean(contentSetup.suggestMissingAreas);
  const covered = new Set(contentSetup.coveredSectionIds || []);

  let mode = 'minimal';
  let sections = [];
  let suggestedMissing = [];
  let reviewSummary = '';

  // Legacy fallback: if contentSetup unanswered but old availability exists
  const legacyAvailable = Object.entries(contentAvailability || {})
    .filter(([, value]) => value === 'available')
    .map(([key]) => key);

  if (hasExisting === 'no' && wantSuggestions === 'yes') {
    mode = 'suggest_placeholders';
    sections = profileCore.map((section) => ({
      ...section,
      include: true,
      usesPlaceholder: true,
    }));
    suggestedMissing = extras.map((section) => ({
      ...section,
      explanation: `${section.explanation} Optional — leave empty until you have real content.`,
    }));
    reviewSummary =
      'We will create editable placeholder sections for your event type. Buttons use your brand colours — finish labels and links in the editor.';
  } else if (hasExisting === 'no' && wantSuggestions === 'no') {
    mode = 'minimal';
    sections = [];
    reviewSummary =
      'We will create a minimal page with a header, hero (primary and secondary buttons), call to action and footer. Edit button text and links in the editor.';
  } else if (hasExisting === 'yes' && suggestMissingAreas) {
    mode = 'missing_areas';
    sections = profileCore
      .filter((section) => !covered.has(section.id))
      .map((section) => ({
        ...section,
        include: true,
        usesPlaceholder: true,
      }));
    suggestedMissing = [
      ...profileCore.filter((section) => covered.has(section.id)),
      ...extras,
    ].map((section) => ({
      ...section,
      explanation: covered.has(section.id)
        ? 'Marked as already covered by you — not auto-detected from uploads.'
        : `${section.explanation} Optional extra area.`,
    }));
    reviewSummary =
      'You chose to suggest missing content areas. Mark which areas you already cover — the app cannot judge that from uploaded files. Uncovered areas become editable placeholders. Buttons are finished in the editor.';
  } else if (hasExisting === 'yes') {
    mode = 'minimal_with_sources';
    sections = [];
    reviewSummary =
      'Your attachments and pasted text will stay available in the editor. The starting page stays minimal unless you customise sections below. Set button labels and links in the editor.';
  } else if (legacyAvailable.length > 0) {
    mode = 'legacy';
    const keyMap = {
      speakers: 'speakers',
      sponsors: 'sponsors',
      testimonials: 'testimonials',
      stats: 'stats',
      programme: 'topics',
      faqs: 'practical',
    };
    const includeIds = new Set(
      legacyAvailable.map((key) => keyMap[key]).filter(Boolean),
    );
    sections = candidates
      .filter((section) => !section.availabilityKey || includeIds.has(section.id))
      .filter((section) => section.kind === 'core' || includeIds.has(section.id))
      .map((section) => ({
        ...section,
        include: true,
        usesPlaceholder: Boolean(section.availabilityKey),
      }));
    reviewSummary = 'Using saved content preferences from an earlier project version.';
  } else {
    mode = 'unanswered';
    reviewSummary = 'Answer whether you already have content to continue.';
  }

  sections = applyOverrides(sections, sectionOverrides, candidates);
  sections = sortByProfile(sections, eventType);

  const optionalExtras =
    mode === 'suggest_placeholders' || mode === 'missing_areas' ? extras : [];

  return {
    mode,
    sections,
    candidates,
    optionalExtras,
    suggestedMissing: sortByProfile(suggestedMissing, eventType),
    missingEssentials: missingEssentialsFor(event),
    eventType,
    reviewSummary,
    isMinimal: sections.length === 0,
  };
}

export function pruneSectionOverrides(sectionOverrides, eventType) {
  const candidates = collectCandidateSections(eventType);
  const validIds = new Set(candidates.map((section) => section.id));
  const next = {};
  Object.entries(sectionOverrides || {}).forEach(([id, value]) => {
    if (validIds.has(id)) next[id] = value;
  });
  return next;
}
