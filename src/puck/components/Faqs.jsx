import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Faqs({
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
      className={`cr-section cr-faqs cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-faqs-heading"
      data-content-state={contentState}
    >
      <div className="cr-container cr-faqs__inner">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-faqs-heading">{heading}</h2> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        <div className="cr-faqs__list">
          {(items || []).map((item, index) => {
            const placeholder = isPlaceholderFlag(item.isPlaceholder);
            return (
              <details
                key={`${item.question}-${index}`}
                className={placeholder ? 'cr-faq cr-placeholder' : 'cr-faq'}
              >
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
                {placeholder ? (
                  <p className="cr-placeholder-note">Guidance — replace with your answer</p>
                ) : null}
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
