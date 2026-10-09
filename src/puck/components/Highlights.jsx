import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Highlights({
  heading,
  items = [],
  spacing = 'default',
  alignment = 'left',
  layoutVariant = 'grid',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState, items }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-highlights cr-highlights--${layoutVariant} cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-highlights-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-highlights-heading">{heading}</h2> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        <ul className="cr-highlights__grid">
          {(items || []).map((item, index) => {
            const placeholder = isPlaceholderFlag(item.isPlaceholder);
            return (
              <li
                key={`${item.title}-${index}`}
                className={placeholder ? 'cr-highlight cr-placeholder' : 'cr-highlight'}
              >
                <h3>{item.title}</h3>
                {item.body ? <p>{item.body}</p> : null}
                {placeholder ? (
                  <p className="cr-placeholder-note">Guidance — replace with your content</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
