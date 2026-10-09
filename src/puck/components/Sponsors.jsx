import { ResolvedImage } from '../../assets/ResolvedImage';
import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function Sponsors({
  heading,
  logos = [],
  spacing = 'default',
  alignment = 'centre',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState, logos }) && puck?.isEditing;

  return (
    <section
      className={`cr-section cr-sponsors cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby="cr-sponsors-heading"
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id="cr-sponsors-heading">{heading}</h2> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}
        <ul className="cr-sponsors__grid">
          {(logos || []).map((logo, index) => {
            const placeholder = isPlaceholderFlag(logo.isPlaceholder);
            return (
              <li
                key={`${logo.name}-${index}`}
                className={placeholder ? 'cr-sponsor cr-placeholder' : 'cr-sponsor'}
              >
                {logo.imageUrl ? (
                  logo.url ? (
                    <a href={logo.url} target="_blank" rel="noreferrer">
                      <ResolvedImage
                        src={logo.imageUrl}
                        alt={logo.imageAlt || logo.name || 'Sponsor logo'}
                      />
                    </a>
                  ) : (
                    <ResolvedImage
                      src={logo.imageUrl}
                      alt={logo.imageAlt || logo.name || 'Sponsor logo'}
                    />
                  )
                ) : (
                  <span className="cr-sponsor__name">{logo.name || 'Sponsor'}</span>
                )}
                {placeholder ? <p className="cr-placeholder-note">Guidance — add a confirmed sponsor</p> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
