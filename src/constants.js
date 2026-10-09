export const STORAGE_KEY = 'composer-rapid-project';
export const PROJECT_VERSION = 4;
export const MAX_IMAGE_BYTES = 500 * 1024;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_PROJECT_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const ACCEPTED_UPLOAD_EXTENSIONS = '.pdf,.docx,.png,.jpg,.jpeg,.webp,.txt';

export const ASSET_STATUS_LABEL =
  'Attached — automatic content extraction is not included in this demo.';

export const FONT_OPTIONS = [
  { value: 'DM Sans', label: 'DM Sans', stack: '"DM Sans", sans-serif' },
  { value: 'Space Grotesk', label: 'Space Grotesk', stack: '"Space Grotesk", sans-serif' },
  { value: 'Source Serif 4', label: 'Source Serif 4', stack: '"Source Serif 4", serif' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', stack: '"Libre Baskerville", serif' },
];

export const DESIGN_DIRECTIONS = [
  {
    value: 'bold',
    label: 'Bold',
    description: 'Large type, high contrast and a strong call to action.',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Generous space, restrained type and a calmer layout.',
  },
  {
    value: 'editorial',
    label: 'Editorial',
    description: 'Asymmetric rhythm with a more editorial, story-led feel.',
  },
];

export const EVENT_TYPES = [
  { value: 'conference', label: 'Conference' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'awards', label: 'Awards' },
  { value: 'networking', label: 'Networking' },
  { value: 'festival', label: 'Festival' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Other' },
];

export const EVENT_FORMATS = [
  { value: 'in_person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const OBJECTIVES = [
  { value: 'book_tickets', label: 'Book tickets', ctaLabel: 'Book tickets' },
  { value: 'register', label: 'Register', ctaLabel: 'Register' },
  { value: 'register_interest', label: 'Register interest', ctaLabel: 'Register interest' },
  {
    value: 'enquire_exhibiting',
    label: 'Enquire about exhibiting',
    ctaLabel: 'Enquire about exhibiting',
  },
  { value: 'enter_awards', label: 'Enter the awards', ctaLabel: 'Enter the awards' },
  { value: 'find_out_more', label: 'Find out more', ctaLabel: 'Find out more' },
  { value: 'custom', label: 'Custom action', ctaLabel: '' },
];

/** Kept for migration compatibility with older projects. */
export const CONTENT_AVAILABILITY_KEYS = [
  { key: 'speakers', label: 'Speaker or presenter information' },
  { key: 'sponsors', label: 'Sponsor or partner logos' },
  { key: 'testimonials', label: 'Feedback from previous attendees' },
  { key: 'stats', label: 'Event figures, such as attendance numbers' },
  { key: 'programme', label: 'Programme or activity highlights' },
  { key: 'faqs', label: 'Practical information or FAQs' },
];

export const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'not_yet', label: 'Not yet' },
  { value: 'not_relevant', label: 'Not relevant' },
];

export const DEFAULT_BRANDING = {
  primaryColour: '#2a3c4c',
  secondaryColour: '#00a986',
  backgroundColour: '#ffffff',
  font: 'DM Sans',
  logoDataUrl: '',
  designDirection: 'bold',
};

export const DEFAULT_CONTENT_AVAILABILITY = {
  speakers: 'not_yet',
  sponsors: 'not_yet',
  testimonials: 'not_yet',
  stats: 'not_yet',
  programme: 'not_yet',
  faqs: 'not_yet',
};

export const DEFAULT_CONTENT_SETUP = {
  hasExistingContent: null,
  wantSuggestions: null,
  suggestMissingAreas: false,
  pastedText: '',
  coveredSectionIds: [],
  assets: [],
};

export const EMPTY_EVENT = {
  name: '',
  description: '',
  audience: '',
  date: '',
  location: '',
  ctaLabel: '',
  ctaUrl: '',
  eventType: 'conference',
  format: 'in_person',
  objective: null,
  ctaLabelCustomised: false,
};

export const DEFAULT_OPTIONAL_SECTIONS = {
  stats: false,
  testimonials: false,
  speakers: false,
  sponsors: false,
  faqs: false,
  highlights: false,
  information: false,
};

export const SECTION_GUIDANCE = {
  introduction: 'Explain what your event is and who it is for.',
  reasons: 'Add three benefits visitors will get from attending.',
  topics: 'Add the key topics or activities.',
  speakers: 'Add confirmed speakers and their biographies.',
  practical: 'Add practical questions and answers for attendees.',
  registration: 'Confirm the primary action visitors should take.',
  visitor_benefits: 'Add the main benefits for visitors.',
  exhibitor_highlights: 'Add industry or exhibitor highlights.',
  categories: 'Add the award categories people can enter or follow.',
  entry_process: 'Explain how people enter.',
  deadlines: 'Add the key entry and announcement dates.',
  judging: 'Add judging or ceremony information.',
  audience: 'Describe who this event is for.',
  benefits: 'Add the main benefits of attending.',
  format_info: 'Describe how the event is structured.',
  venue: 'Add venue or online access details.',
  experiences: 'Add headline experiences or programme highlights.',
  learning_outcomes: 'Add what attendees will take away.',
  datetime: 'Confirm the date and time details.',
  stats: 'Add confirmed figures once you have them.',
  testimonials: 'Add real feedback once you have permission to use it.',
  sponsors: 'Add confirmed sponsor or partner logos.',
};

export function getFontStack(fontValue) {
  const match = FONT_OPTIONS.find((option) => option.value === fontValue);
  return match?.stack ?? FONT_OPTIONS[0].stack;
}

export function getSuggestedCtaLabel(objective) {
  const match = OBJECTIVES.find((item) => item.value === objective);
  return match?.ctaLabel ?? '';
}

export function needsLocation(format) {
  return format === 'in_person' || format === 'hybrid';
}

export function isAssetRef(value) {
  return typeof value === 'string' && value.startsWith('asset:');
}

export function toAssetRef(id) {
  return `asset:${id}`;
}

export function fromAssetRef(value) {
  if (!isAssetRef(value)) return null;
  return value.slice('asset:'.length);
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
