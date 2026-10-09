import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Testimonials({
  heading,
  items = [],
  spacing = 'default',
  alignment = 'left',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState, items }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-testimonials cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-testimonials-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-testimonials-heading">{heading}</h2> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        <ul className="cr-testimonials__grid">
          {(items || []).map((item, index) => {
            const placeholder = isPlaceholderFlag(item.isPlaceholder);
            return (
              <li
                key={`${item.name}-${index}`}
                className={placeholder ? 'cr-testimonial cr-placeholder' : 'cr-testimonial'}
              >
                <blockquote>
                  <p>“{item.quote}”</p>
                </blockquote>
                <p className="cr-testimonial__name">{item.name}</p>
                {item.role ? <p className="cr-testimonial__role">{item.role}</p> : null}
                {placeholder ? (
                  <p className="cr-placeholder-note">
                    Guidance — replace with a real endorsed quote
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
