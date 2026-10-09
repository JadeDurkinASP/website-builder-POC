import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_BRANDING,
  DEFAULT_CONTENT_AVAILABILITY,
  EMPTY_EVENT,
  EVENT_FORMATS,
  EVENT_TYPES,
  FONT_OPTIONS,
  MAX_IMAGE_BYTES,
  OBJECTIVES,
  getSuggestedCtaLabel,
  needsLocation,
} from '../../constants';
import { SAMPLE_EVENT } from '../../data/sampleEvent';
import { generateDemoHomepage } from '../../generation/generateDemoHomepage';
import {
  pruneSectionOverrides,
  recommendHomepage,
} from '../../recommendations/recommendHomepage';
import {
  createEmptyContentSetup,
  readImageAsDataUrl,
  syncOptionalSectionsFromResolved,
} from '../../storage/projectStorage';
import { AssetProvider } from '../../assets/AssetResolver';
import {
  createBlankHomepage,
  projectFromHomepagePuckData,
  projectHasBlankHomepage,
  projectHasPages,
  withSetupDraft,
} from '../../pages/pageModel';
import { ContentSetupPanel } from './ContentSetupPanel';
import { DesignDirectionCards } from './DesignDirectionCards';
import { EventTypeCards } from './EventTypeCards';
import { SetupLivePreview } from './SetupLivePreview';

const STEPS = [
  { id: 1, title: 'Your event', heading: 'What are you creating?' },
  { id: 2, title: 'Your content', heading: 'Do you already have content?' },
  { id: 3, title: 'Your brand', heading: 'Add your brand' },
];

const AVAILABILITY_EXTRA_IDS = new Set(['stats', 'testimonials', 'sponsors']);

function draftFromProject(project) {
  return {
    event: { ...EMPTY_EVENT, ...(project?.event || {}) },
    branding: { ...DEFAULT_BRANDING, ...(project?.branding || {}) },
    contentAvailability: {
      ...DEFAULT_CONTENT_AVAILABILITY,
      ...(project?.contentAvailability || {}),
    },
    contentSetup: {
      ...createEmptyContentSetup(),
      ...(project?.contentSetup || {}),
      coveredSectionIds: [...(project?.contentSetup?.coveredSectionIds || [])],
      assets: [...(project?.contentSetup?.assets || [])],
    },
    sectionOverrides: { ...(project?.sectionOverrides || {}) },
  };
}

export function SetupModal({
  open,
  project,
  onClose,
  onCommitProject,
  onReadyMessage,
  triggerRef,
}) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(() => draftFromProject(project));
  const [uploadError, setUploadError] = useState('');
  const [contentUploadError, setContentUploadError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [brandOptionsOpen, setBrandOptionsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [homepageOpen, setHomepageOpen] = useState(true);
  const previousEventType = useRef(draft.event.eventType);

  const { event, branding, contentSetup, contentAvailability, sectionOverrides } = draft;
  const hasExistingSite = projectHasPages(project) && !projectHasBlankHomepage(project);
  const canSkip = !hasExistingSite;

  const recommendation = useMemo(
    () =>
      recommendHomepage({
        event,
        contentSetup,
        contentAvailability,
        sectionOverrides,
      }),
    [event, contentSetup, contentAvailability, sectionOverrides],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      setDraft(draftFromProject(project));
      setStep(1);
      setValidationMessage('');
      setUploadError('');
      setContentUploadError('');
      dialog.showModal();
      window.requestAnimationFrame(() => headingRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return undefined;
  }, [open, project]);

  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [step, open]);

  useEffect(() => {
    if (previousEventType.current === event.eventType) return;
    previousEventType.current = event.eventType;
    setDraft((current) => ({
      ...current,
      sectionOverrides: pruneSectionOverrides(current.sectionOverrides, event.eventType),
    }));
  }, [event.eventType]);

  function persistDraft(nextDraft = draft) {
    onCommitProject(withSetupDraft(project, nextDraft), { remount: false, closeSetup: false });
  }

  function updateEvent(field, value) {
    setDraft((current) => {
      const nextEvent = { ...current.event, [field]: value };
      if (field === 'objective' && !current.event.ctaLabelCustomised) {
        nextEvent.ctaLabel = getSuggestedCtaLabel(value);
      }
      if (field === 'ctaLabel') {
        nextEvent.ctaLabelCustomised = true;
      }
      return { ...current, event: nextEvent };
    });
  }

  function updateBranding(field, value) {
    setDraft((current) => ({
      ...current,
      branding: { ...current.branding, [field]: value },
    }));
  }

  function loadSample() {
    const next = {
      event: { ...EMPTY_EVENT, ...SAMPLE_EVENT.event },
      branding: { ...DEFAULT_BRANDING, ...SAMPLE_EVENT.branding },
      contentAvailability: {
        ...DEFAULT_CONTENT_AVAILABILITY,
        ...(SAMPLE_EVENT.contentAvailability || {}),
      },
      contentSetup: {
        ...createEmptyContentSetup(),
        ...(SAMPLE_EVENT.contentSetup || {}),
        coveredSectionIds: [...(SAMPLE_EVENT.contentSetup?.coveredSectionIds || [])],
        assets: [...(SAMPLE_EVENT.contentSetup?.assets || [])],
      },
      sectionOverrides: { ...(SAMPLE_EVENT.sectionOverrides || {}) },
    };
    setDraft(next);
    setUploadError('');
    setContentUploadError('');
    setValidationMessage('');
    setStep(1);
  }

  async function handleLogoUpload(file) {
    setUploadError('');
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file, MAX_IMAGE_BYTES);
      updateBranding('logoDataUrl', dataUrl);
    } catch (error) {
      setUploadError(error.message || 'Could not upload logo.');
    }
  }

  function validateStep(currentStep) {
    if (currentStep === 1) {
      if (!event.eventType) return 'Choose an event type.';
      if (!event.name.trim()) return 'Enter an event name to continue.';
    }
    if (currentStep === 2) {
      if (!contentSetup.hasExistingContent) {
        return 'Say whether you already have content for your website.';
      }
      if (contentSetup.hasExistingContent === 'no' && !contentSetup.wantSuggestions) {
        return 'Choose whether you want suggested content areas.';
      }
    }
    return '';
  }

  function goToStep(nextStep) {
    if (nextStep > step) {
      const message = validateStep(step);
      if (message) {
        setValidationMessage(message);
        return;
      }
    }
    setValidationMessage('');
    setStep(nextStep);
  }

  function toggleSectionOverride(sectionId, currentlyIncluded) {
    setDraft((current) => ({
      ...current,
      sectionOverrides: {
        ...current.sectionOverrides,
        [sectionId]: !currentlyIncluded,
      },
    }));
  }

  function addPlaceholderSection(sectionId) {
    setDraft((current) => ({
      ...current,
      sectionOverrides: {
        ...current.sectionOverrides,
        [sectionId]: true,
      },
    }));
  }

  function toggleCoveredSection(sectionId) {
    setDraft((current) => {
      const set = new Set(current.contentSetup.coveredSectionIds || []);
      if (set.has(sectionId)) set.delete(sectionId);
      else set.add(sectionId);
      return {
        ...current,
        contentSetup: { ...current.contentSetup, coveredSectionIds: [...set] },
      };
    });
  }

  function handleDismiss() {
    persistDraft(draft);
    onClose();
    window.requestAnimationFrame(() => triggerRef?.current?.focus?.());
  }

  function handleSkip() {
    const withDraft = withSetupDraft(project, draft);
    const next = projectFromHomepagePuckData(
      withDraft,
      createBlankHomepage({ branding: draft.branding }),
    );
    onCommitProject(next, { remount: true, closeSetup: true, save: true });
    window.requestAnimationFrame(() => triggerRef?.current?.focus?.());
  }

  function handleCreate() {
    if (hasExistingSite) {
      const confirmed = window.confirm(
        'Rebuild the demo homepage from this setup? Other pages you added will be removed, and manual home-page edits will be replaced. Cancel to keep your current site.',
      );
      if (!confirmed) return;
    }

    const setup = {
      event,
      branding,
      contentSetup,
      contentAvailability,
      sectionOverrides,
      recommendedSections: recommendation.sections,
    };
    const puckData = generateDemoHomepage(setup);
    const next = projectFromHomepagePuckData(
      {
        ...withSetupDraft(project, draft),
        optionalSections: syncOptionalSectionsFromResolved(recommendation.sections),
        updatedAt: new Date().toISOString(),
      },
      puckData,
    );
    onCommitProject(next, { remount: true, closeSetup: true, save: true });
    onReadyMessage?.('Your starting page is ready. Select anything to edit it.');
  }

  const showLocation = needsLocation(event.format);
  const includedIds = new Set(recommendation.sections.map((section) => section.id));
  const coveredSet = new Set(contentSetup.coveredSectionIds || []);
  const showCustomise =
    recommendation.mode === 'suggest_placeholders' ||
    recommendation.mode === 'missing_areas' ||
    recommendation.mode === 'minimal_with_sources' ||
    recommendation.mode === 'legacy';
  const stepMeta = STEPS[step - 1];

  return (
    <dialog
      ref={dialogRef}
      className="cr-setup-dialog"
      aria-labelledby="cr-setup-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        handleDismiss();
      }}
    >
      <AssetProvider assetMetas={contentSetup.assets || []}>
        <div className="cr-setup-dialog__shell">
          <header className="cr-setup-dialog__header">
            <div className="cr-setup-dialog__intro">
              <p className="cr-setup-dialog__kicker">Let&apos;s build your website</p>
              <ol className="cr-setup-dialog__steps" aria-label="Setup steps">
                {STEPS.map((item) => (
                  <li
                    key={item.id}
                    className={[
                      'cr-setup-dialog__step',
                      step === item.id ? 'cr-setup-dialog__step--current' : '',
                      step > item.id ? 'cr-setup-dialog__step--done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-current={step === item.id ? 'step' : undefined}
                  >
                    <span className="cr-setup-dialog__step-number">{item.id}</span>
                    <span className="cr-setup-dialog__step-label">{item.title}</span>
                  </li>
                ))}
              </ol>
              <h1
                id="cr-setup-dialog-title"
                ref={headingRef}
                tabIndex={-1}
                className="cr-setup-dialog__heading"
              >
                {stepMeta.heading}
              </h1>
              <p className="cr-setup-dialog__lede">
                {step === 1
                  ? 'Tell us about your event. We’ll suggest a starting layout.'
                  : step === 2
                    ? 'Attachments stay in this browser for you to use in the editor.'
                    : 'Colours and design direction style the demo layout — not AI.'}
              </p>
            </div>
            <button
              type="button"
              className="cr-setup-dialog__close"
              aria-label="Close website setup"
              onClick={handleDismiss}
            >
              ×
            </button>
          </header>

          {validationMessage ? (
            <div className="cr-banner cr-banner--error cr-setup-dialog__alert" role="alert">
              {validationMessage}
            </div>
          ) : null}

          <div className="cr-setup-dialog__body">
            <div className="cr-setup-dialog__form">
              {step === 1 ? (
                <section className="cr-setup-dialog__panel" aria-labelledby="event-basics-heading">
                  <div className="cr-field-grid">
                    <div className="cr-field cr-field--full">
                      <label htmlFor="event-name">Event name</label>
                      <input
                        id="event-name"
                        value={event.name}
                        onChange={(e) => updateEvent('name', e.target.value)}
                        placeholder="Future Forum 2026"
                      />
                    </div>
                  </div>

                  <h2 id="event-basics-heading" className="cr-setup-dialog__panel-title">
                    Event type
                  </h2>
                  <EventTypeCards
                    types={EVENT_TYPES.filter((type) => type.value !== 'other').concat(
                      EVENT_TYPES.filter((type) => type.value === 'other'),
                    )}
                    value={event.eventType}
                    onChange={(value) => updateEvent('eventType', value)}
                  />

                  <div className="cr-field-grid cr-setup-dialog__fields">
                    <div className="cr-field cr-field--full">
                      <label htmlFor="event-audience">Who is it for?</label>
                      <input
                        id="event-audience"
                        value={event.audience}
                        onChange={(e) => updateEvent('audience', e.target.value)}
                        placeholder="Technology leaders"
                      />
                    </div>
                    <div className="cr-field">
                      <label htmlFor="event-date">Date</label>
                      <input
                        id="event-date"
                        value={event.date}
                        onChange={(e) => updateEvent('date', e.target.value)}
                        placeholder="12 November 2026"
                      />
                    </div>
                    {showLocation ? (
                      <div className="cr-field">
                        <label htmlFor="event-location">Location</label>
                        <input
                          id="event-location"
                          value={event.location}
                          onChange={(e) => updateEvent('location', e.target.value)}
                          placeholder="London"
                        />
                      </div>
                    ) : (
                      <div className="cr-field">
                        <label htmlFor="event-format-inline">Format</label>
                        <select
                          id="event-format-inline"
                          value={event.format}
                          onChange={(e) => updateEvent('format', e.target.value)}
                        >
                          {EVENT_FORMATS.map((format) => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="cr-field cr-field--full">
                      <label htmlFor="event-objective">What should visitors do?</label>
                      <select
                        id="event-objective"
                        value={event.objective || ''}
                        onChange={(e) => updateEvent('objective', e.target.value || null)}
                      >
                        <option value="">Choose an action</option>
                        {OBJECTIVES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {event.objective === 'custom' ? (
                      <div className="cr-field cr-field--full">
                        <label htmlFor="event-cta-label">Button text</label>
                        <input
                          id="event-cta-label"
                          value={event.ctaLabel}
                          onChange={(e) => updateEvent('ctaLabel', e.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="cr-setup-dialog__sample">
                    <button
                      type="button"
                      className="cr-btn cr-btn--secondary cr-btn--small"
                      onClick={loadSample}
                    >
                      Load sample event
                    </button>
                    <p className="cr-field-hint">
                      Prefills fictional details for quicker debugging. It does not create the page
                      until you finish setup.
                    </p>
                  </div>

                  <details
                    className="cr-setup-dialog__more"
                    open={detailsOpen}
                    onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
                  >
                    <summary>+ Add more details</summary>
                    <div className="cr-field-grid" style={{ marginTop: '0.85rem' }}>
                      <div className="cr-field cr-field--full">
                        <label htmlFor="event-description">Short description</label>
                        <textarea
                          id="event-description"
                          value={event.description}
                          onChange={(e) => updateEvent('description', e.target.value)}
                        />
                      </div>
                      <div className="cr-field">
                        <label htmlFor="event-format">Format</label>
                        <select
                          id="event-format"
                          value={event.format}
                          onChange={(e) => updateEvent('format', e.target.value)}
                        >
                          {EVENT_FORMATS.map((format) => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {showLocation ? null : (
                        <div className="cr-field">
                          <label htmlFor="event-location-extra">Location</label>
                          <input
                            id="event-location-extra"
                            value={event.location}
                            onChange={(e) => updateEvent('location', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </details>
                </section>
              ) : null}

              {step === 2 ? (
                <ContentSetupPanel
                  contentSetup={contentSetup}
                  onChange={(next) => setDraft((current) => ({ ...current, contentSetup: next }))}
                  uploadError={contentUploadError}
                  setUploadError={setContentUploadError}
                />
              ) : null}

              {step === 3 ? (
                <>
                  <section className="cr-setup-dialog__panel" aria-labelledby="branding-heading">
                    <h2 id="branding-heading" className="cr-setup-dialog__panel-title">
                      Brand
                    </h2>
                    <div className="cr-field-grid">
                      <div className="cr-field cr-field--full">
                        <label htmlFor="logo-upload">Logo upload</label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                        />
                        <p className="cr-field-hint">
                          PNG, JPG or SVG under 500 KB. Stored locally in this browser.
                        </p>
                        {branding.logoDataUrl ? (
                          <div className="cr-image-field__preview">
                            <img src={branding.logoDataUrl} alt="Uploaded logo preview" />
                            <button
                              type="button"
                              className="cr-btn cr-btn--secondary cr-btn--small"
                              onClick={() => updateBranding('logoDataUrl', '')}
                            >
                              Remove logo
                            </button>
                          </div>
                        ) : null}
                        {uploadError ? (
                          <p className="cr-banner cr-banner--error">{uploadError}</p>
                        ) : null}
                      </div>

                      <div className="cr-field">
                        <label htmlFor="primary-colour">Primary colour</label>
                        <div className="cr-colour-row">
                          <input
                            id="primary-colour"
                            type="color"
                            value={branding.primaryColour}
                            onChange={(e) => updateBranding('primaryColour', e.target.value)}
                          />
                          <input
                            aria-label="Primary colour hex"
                            value={branding.primaryColour}
                            onChange={(e) => updateBranding('primaryColour', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="cr-field">
                        <label htmlFor="secondary-colour">Secondary colour</label>
                        <div className="cr-colour-row">
                          <input
                            id="secondary-colour"
                            type="color"
                            value={branding.secondaryColour}
                            onChange={(e) => updateBranding('secondaryColour', e.target.value)}
                          />
                          <input
                            aria-label="Secondary colour hex"
                            value={branding.secondaryColour}
                            onChange={(e) => updateBranding('secondaryColour', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="cr-field">
                        <label htmlFor="background-colour">Background colour</label>
                        <div className="cr-colour-row">
                          <input
                            id="background-colour"
                            type="color"
                            value={branding.backgroundColour}
                            onChange={(e) => updateBranding('backgroundColour', e.target.value)}
                          />
                          <input
                            aria-label="Background colour hex"
                            value={branding.backgroundColour}
                            onChange={(e) => updateBranding('backgroundColour', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <details
                      className="cr-brand-more"
                      open={brandOptionsOpen}
                      onToggle={(e) => setBrandOptionsOpen(e.currentTarget.open)}
                    >
                      <summary>More brand options</summary>
                      <div className="cr-field" style={{ marginTop: '0.85rem' }}>
                        <label htmlFor="font">Font</label>
                        <select
                          id="font"
                          value={branding.font}
                          onChange={(e) => updateBranding('font', e.target.value)}
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </details>

                    <div className="cr-field" style={{ marginTop: '1.25rem' }}>
                      <span className="cr-field-label" id="design-direction-label">
                        Design direction
                      </span>
                      <p className="cr-field-hint">
                        Predefined demo design directions. Event type shapes suggested content;
                        design direction only changes visual styling.
                      </p>
                      <DesignDirectionCards
                        value={branding.designDirection}
                        onChange={(value) => updateBranding('designDirection', value)}
                      />
                    </div>
                  </section>

                  <details
                    className="cr-setup-dialog__homepage"
                    open={homepageOpen}
                    onToggle={(e) => setHomepageOpen(e.currentTarget.open)}
                  >
                    <summary>Your suggested homepage</summary>
                    <div className="cr-setup-dialog__homepage-body">
                      <p className="cr-field-hint">{recommendation.reviewSummary}</p>

                      {recommendation.isMinimal ? (
                        <p>
                          Minimal page sections: <strong>Header</strong>, <strong>Hero</strong>,{' '}
                          <strong>Call to action</strong> and <strong>Footer</strong>.
                        </p>
                      ) : (
                        <ol className="cr-review-list">
                          {recommendation.sections.map((section) => (
                            <li key={section.id}>
                              <strong>{section.title}</strong>
                              <p>{section.explanation}</p>
                            </li>
                          ))}
                        </ol>
                      )}

                      {recommendation.mode === 'missing_areas' ? (
                        <div className="cr-setup-dialog__subpanel">
                          <h3>Which areas do you already cover?</h3>
                          <div className="cr-check-grid">
                            {(recommendation.candidates || [])
                              .filter((section) => !AVAILABILITY_EXTRA_IDS.has(section.id))
                              .map((section) => (
                                <label key={section.id} className="cr-check">
                                  <input
                                    type="checkbox"
                                    checked={coveredSet.has(section.id)}
                                    onChange={() => toggleCoveredSection(section.id)}
                                  />
                                  <span>{section.title}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                      ) : null}

                      {recommendation.missingEssentials.length > 0 ? (
                        <div className="cr-setup-dialog__subpanel">
                          <h3>Missing essential information</h3>
                          <ul className="cr-checklist">
                            {recommendation.missingEssentials.map((item) => (
                              <li key={item.field} className="cr-checklist__missing">
                                <span aria-hidden="true">!</span>
                                <span>{item.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {recommendation.optionalExtras?.length > 0 ? (
                        <div className="cr-setup-dialog__subpanel">
                          <h3>Optional extras</h3>
                          <ul className="cr-suggested-missing">
                            {recommendation.optionalExtras.map((section) => (
                              <li key={section.id}>
                                <div>
                                  <strong>{section.title}</strong>
                                  <p>{section.explanation}</p>
                                </div>
                                <button
                                  type="button"
                                  className="cr-btn cr-btn--secondary cr-btn--small"
                                  onClick={() => addPlaceholderSection(section.id)}
                                >
                                  Add empty section
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {showCustomise ? (
                        <div className="cr-setup-dialog__subpanel">
                          <h3>Customise suggested content</h3>
                          <div className="cr-check-grid">
                            {(recommendation.candidates || []).map((section) => {
                              const included = includedIds.has(section.id);
                              return (
                                <label key={section.id} className="cr-check">
                                  <input
                                    type="checkbox"
                                    checked={included}
                                    onChange={() => toggleSectionOverride(section.id, included)}
                                  />
                                  <span>{section.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </>
              ) : null}
            </div>

            <div className="cr-setup-dialog__preview-column">
              <details className="cr-setup-dialog__preview-collapse">
                <summary>Show live preview</summary>
                <SetupLivePreview
                  event={event}
                  branding={branding}
                  contentSetup={contentSetup}
                  contentAvailability={contentAvailability}
                  sectionOverrides={sectionOverrides}
                />
              </details>
              <div className="cr-setup-dialog__preview-desktop">
                <SetupLivePreview
                  event={event}
                  branding={branding}
                  contentSetup={contentSetup}
                  contentAvailability={contentAvailability}
                  sectionOverrides={sectionOverrides}
                />
              </div>
            </div>
          </div>

          <footer className="cr-setup-dialog__footer">
            <div className="cr-setup-dialog__footer-start">
              {canSkip ? (
                <button type="button" className="cr-setup-dialog__skip" onClick={handleSkip}>
                  Skip setup and start blank
                </button>
              ) : (
                <span className="cr-setup-dialog__footer-note">Demo layouts · No AI generation</span>
              )}
            </div>
            <div className="cr-setup-dialog__footer-actions">
              {canSkip ? (
                <span className="cr-setup-dialog__footer-note cr-setup-dialog__footer-note--desktop">
                  Demo layouts · No AI generation
                </span>
              ) : null}
              {step > 1 ? (
                <button
                  type="button"
                  className="cr-btn cr-btn--secondary"
                  onClick={() => goToStep(step - 1)}
                >
                  Back
                </button>
              ) : null}
              {step < 3 ? (
                <button
                  type="button"
                  className="cr-btn cr-btn--brand"
                  onClick={() => goToStep(step + 1)}
                >
                  Continue
                </button>
              ) : (
                <button type="button" className="cr-btn cr-btn--brand" onClick={handleCreate}>
                  {hasExistingSite ? 'Rebuild demo homepage' : 'Create demo homepage'}
                </button>
              )}
            </div>
          </footer>
        </div>
      </AssetProvider>
    </dialog>
  );
}
