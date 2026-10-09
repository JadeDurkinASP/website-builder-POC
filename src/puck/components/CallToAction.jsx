import { PageAnchor } from '../../pages/PageLinkContext';
import { ContentNeededBadge, needsContent } from '../placeholder.jsx';
import { buttonStyleClass } from '../buttonStyles';

export function CallToAction({
  heading,
  body,
  buttonLabel,
  buttonUrl,
  buttonStyle = 'primary',
  backgroundTreatment = 'brand',
  spacing = 'default',
  alignment = 'centre',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-cta cr-cta--${backgroundTreatment} cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-cta-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        <h2 id="cr-cta-heading">{heading}</h2>
        {body ? <p>{body}</p> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        {buttonLabel ? (
          <PageAnchor
            className={`${buttonStyleClass(buttonStyle)} cr-btn--large`}
            href={buttonUrl || '#'}
          >
            {buttonLabel}
          </PageAnchor>
        ) : null}
      </div>
    </section>
  );
}
