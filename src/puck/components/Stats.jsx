import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Stats({
  heading,
  items = [],
  spacing = 'default',
  alignment = 'centre',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState, items }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-stats cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-stats-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-stats-heading">{heading}</h2> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        <ul className="cr-stats__grid">
          {(items || []).map((item, index) => {
            const placeholder = isPlaceholderFlag(item.isPlaceholder);
            return (
              <li
                key={`${item.label}-${index}`}
                className={placeholder ? 'cr-stats__item cr-placeholder' : 'cr-stats__item'}
              >
                <p className="cr-stats__value">{item.value}</p>
                <p className="cr-stats__label">{item.label}</p>
                {placeholder ? (
                  <p className="cr-placeholder-note">Guidance — add a confirmed figure</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
