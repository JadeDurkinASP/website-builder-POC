import { ResolvedImage } from '../../assets/ResolvedImage';
import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Speakers({
  heading,
  cards = [],
  spacing = 'default',
  alignment = 'left',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState, cards }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-speakers cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-speakers-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-speakers-heading">{heading}</h2> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        <ul className="cr-speakers__grid">
          {(cards || []).map((card, index) => {
            const placeholder = isPlaceholderFlag(card.isPlaceholder);
            return (
              <li
                key={`${card.name}-${index}`}
                className={placeholder ? 'cr-speaker cr-placeholder' : 'cr-speaker'}
              >
                {card.imageUrl ? (
                  <ResolvedImage
                    src={card.imageUrl}
                    alt={
                      card.imageAlt ||
                      (typeof card.name === 'string' ? card.name : '') ||
                      ''
                    }
                  />
                ) : (
                  <div className="cr-speaker__avatar" aria-hidden="true">
                    {typeof card.name === 'string' && card.name ? card.name.slice(0, 1) : '?'}
                  </div>
                )}
                <h3>{card.name}</h3>
                {card.role ? <p className="cr-speaker__role">{card.role}</p> : null}
                {card.bio ? <p className="cr-speaker__bio">{card.bio}</p> : null}
                {placeholder ? (
                  <p className="cr-placeholder-note">
                    Guidance — replace with a confirmed speaker
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
