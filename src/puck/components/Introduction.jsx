import { ContentNeededBadge, needsContent } from '../placeholder.jsx';

export function Introduction({
  heading,
  body,
  layoutVariant = 'single',
  alignment = 'left',
  spacing = 'default',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-intro cr-intro--${layoutVariant} cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-intro-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        <h2 id="cr-intro-heading">{heading}</h2>
        {body ? <p className="cr-intro__body">{body}</p> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
      </div>
    </section>
  );
}
