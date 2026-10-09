import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Information({
  heading,
  body,
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
      className={`cr-section cr-information cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-information-heading"
      data-content-state={contentState}
    >
      <div className="cr-container cr-information__inner">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-information-heading">{heading}</h2> : null}
        {body ? <p className="cr-information__body">{body}</p> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        {(items || []).length > 0 ? (
          <dl className="cr-information__list">
            {(items || []).map((item, index) => {
              const placeholder = isPlaceholderFlag(item.isPlaceholder);
              return (
                <div
                  key={`${item.label}-${index}`}
                  className={placeholder ? 'cr-information__row cr-placeholder' : 'cr-information__row'}
                >
                  <dt>{item.label}</dt>
                  <dd>
                    {item.detail}
                    {placeholder ? (
                      <p className="cr-placeholder-note">Guidance — replace with your information</p>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
