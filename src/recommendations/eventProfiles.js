/**
 * Explicit event-profile starting guidance for homepage recommendations.
 * These are predefined rules, not AI-generated suggestions.
 */

/** @typedef {'core' | 'content' | 'optional'} SectionKind */

/**
 * @typedef {object} ProfileSection
 * @property {string} id
 * @property {string} component
 * @property {string} title
 * @property {string} explanation
 * @property {SectionKind} kind
 * @property {string} [availabilityKey]
 * @property {string} [variant]
 */

/** @type {Record<string, ProfileSection[]>} */
export const EVENT_PROFILES = {
  conference: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Introduction',
      explanation: 'Set the scene for the conference and who it is for.',
      kind: 'core',
    },
    {
      id: 'reasons',
      component: 'Highlights',
      title: 'Reasons to attend',
      explanation: 'Highlight why people should join.',
      kind: 'core',
      variant: 'reasons',
    },
    {
      id: 'topics',
      component: 'Highlights',
      title: 'Topics and programme highlights',
      explanation: 'Show key themes or sessions without a full schedule.',
      kind: 'content',
      availabilityKey: 'programme',
      variant: 'programme',
    },
    {
      id: 'speakers',
      component: 'Speakers',
      title: 'Speakers',
      explanation: 'Feature presenters when speaker information is available.',
      kind: 'content',
      availabilityKey: 'speakers',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Registration',
      explanation: 'Guide visitors to the primary action.',
      kind: 'core',
    },
    {
      id: 'practical',
      component: 'Faqs',
      title: 'Practical information',
      explanation: 'Answer common questions about attending.',
      kind: 'content',
      availabilityKey: 'faqs',
    },
  ],
  exhibition: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Introduction',
      explanation: 'Introduce the exhibition and what visitors will find.',
      kind: 'core',
    },
    {
      id: 'visitor_benefits',
      component: 'Highlights',
      title: 'Visitor benefits',
      explanation: 'Explain what visitors gain from attending.',
      kind: 'core',
      variant: 'benefits',
    },
    {
      id: 'exhibitor_highlights',
      component: 'Highlights',
      title: 'Industry or exhibitor highlights',
      explanation: 'Showcase sectors, stands or featured exhibitors.',
      kind: 'content',
      availabilityKey: 'programme',
      variant: 'exhibitors',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Visiting or exhibiting action',
      explanation: 'Point visitors to booking, registration or exhibitor enquiries.',
      kind: 'core',
    },
    {
      id: 'practical',
      component: 'Faqs',
      title: 'Practical information',
      explanation: 'Cover travel, opening times and visitor basics.',
      kind: 'content',
      availabilityKey: 'faqs',
    },
  ],
  awards: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Introduction',
      explanation: 'Introduce the awards and who they celebrate.',
      kind: 'core',
    },
    {
      id: 'categories',
      component: 'Highlights',
      title: 'Award categories',
      explanation: 'List the main categories people can enter or follow.',
      kind: 'core',
      variant: 'categories',
    },
    {
      id: 'entry_process',
      component: 'Information',
      title: 'Entry process',
      explanation: 'Explain how people enter, without a full submission system.',
      kind: 'core',
      variant: 'entry',
    },
    {
      id: 'deadlines',
      component: 'Information',
      title: 'Deadlines',
      explanation: 'Surface key dates for entries and announcements.',
      kind: 'core',
      variant: 'deadlines',
    },
    {
      id: 'judging',
      component: 'Information',
      title: 'Judging and ceremony information',
      explanation: 'Share judging notes or ceremony details.',
      kind: 'core',
      variant: 'judging',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Primary action',
      explanation: 'Drive entries or further interest.',
      kind: 'core',
    },
  ],
  networking: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Introduction',
      explanation: 'Introduce the networking event and its purpose.',
      kind: 'core',
    },
    {
      id: 'audience',
      component: 'Information',
      title: 'Intended audience',
      explanation: 'Clarify who will get the most from attending.',
      kind: 'core',
      variant: 'audience',
    },
    {
      id: 'benefits',
      component: 'Highlights',
      title: 'Benefits',
      explanation: 'Highlight the value of joining.',
      kind: 'core',
      variant: 'benefits',
    },
    {
      id: 'format_info',
      component: 'Information',
      title: 'Format',
      explanation: 'Describe how the event runs.',
      kind: 'core',
      variant: 'format',
    },
    {
      id: 'venue',
      component: 'Information',
      title: 'Venue',
      explanation: 'Share venue or online access details.',
      kind: 'core',
      variant: 'venue',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Booking',
      explanation: 'Send people to book or register.',
      kind: 'core',
    },
  ],
  festival: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Introduction',
      explanation: 'Introduce the festival atmosphere and offer.',
      kind: 'core',
    },
    {
      id: 'experiences',
      component: 'Highlights',
      title: 'Experiences and programme',
      explanation: 'Show headline experiences without a full timetable.',
      kind: 'content',
      availabilityKey: 'programme',
      variant: 'experiences',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Tickets',
      explanation: 'Point visitors to ticketing.',
      kind: 'core',
    },
    {
      id: 'practical',
      component: 'Faqs',
      title: 'Practical information',
      explanation: 'Cover access, timing and visitor basics.',
      kind: 'content',
      availabilityKey: 'faqs',
    },
  ],
  webinar: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Topic',
      explanation: 'Introduce the webinar topic clearly.',
      kind: 'core',
    },
    {
      id: 'learning_outcomes',
      component: 'Highlights',
      title: 'Learning outcomes',
      explanation: 'Explain what attendees will take away.',
      kind: 'core',
      variant: 'outcomes',
    },
    {
      id: 'speakers',
      component: 'Speakers',
      title: 'Presenters',
      explanation: 'Feature presenters when information is available.',
      kind: 'content',
      availabilityKey: 'speakers',
    },
    {
      id: 'datetime',
      component: 'Information',
      title: 'Date and time information',
      explanation: 'Confirm when the session takes place.',
      kind: 'core',
      variant: 'datetime',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Registration',
      explanation: 'Drive webinar registration.',
      kind: 'core',
    },
  ],
  other: [
    {
      id: 'introduction',
      component: 'Introduction',
      title: 'Introduction',
      explanation: 'Introduce the event and its purpose.',
      kind: 'core',
    },
    {
      id: 'benefits',
      component: 'Highlights',
      title: 'Benefits',
      explanation: 'Explain why someone should take part.',
      kind: 'core',
      variant: 'benefits',
    },
    {
      id: 'registration',
      component: 'CallToAction',
      title: 'Primary action',
      explanation: 'Guide visitors to the next step.',
      kind: 'core',
    },
    {
      id: 'practical',
      component: 'Faqs',
      title: 'Practical information',
      explanation: 'Cover common questions and logistics.',
      kind: 'content',
      availabilityKey: 'faqs',
    },
  ],
};

/** Extra content sections that can be offered when marked available. */
export const AVAILABILITY_SECTIONS = [
  {
    id: 'stats',
    component: 'Stats',
    title: 'Event figures',
    explanation: 'Show attendance or other figures you already have.',
    kind: 'content',
    availabilityKey: 'stats',
  },
  {
    id: 'testimonials',
    component: 'Testimonials',
    title: 'Attendee feedback',
    explanation: 'Share feedback from previous attendees.',
    kind: 'content',
    availabilityKey: 'testimonials',
  },
  {
    id: 'sponsors',
    component: 'Sponsors',
    title: 'Sponsors and partners',
    explanation: 'Display sponsor or partner logos.',
    kind: 'content',
    availabilityKey: 'sponsors',
  },
];
