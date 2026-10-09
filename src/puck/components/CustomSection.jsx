import { ResolvedImage } from '../../assets/ResolvedImage';
import { PageAnchor } from '../../pages/PageLinkContext';
import { buttonStyleClass } from '../buttonStyles';
import { ContentNeededBadge, isPlaceholderFlag, needsContent } from '../placeholder.jsx';

export function CustomSection({
  heading,
  body = '',
  items = [],
  layoutVariant = 'text',
  buttonLabel = '',
  buttonUrl = '#',
  buttonStyle = 'primary',
  spacing = 'default',
  alignment = 'left',
  contentState = 'ready',
  guidance = '',
  puck,
}) {
  const showNeeded = needsContent({ contentState, items }) && puck?.isEditing;
  const showItems = layoutVariant !== 'text' && (items || []).length > 0;
  const headingKey = typeof heading === 'string' && heading ? heading : 'section';
  const headingId = `cr-custom-${headingKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section
      className={`cr-section cr-custom cr-custom--${layoutVariant} cr-spacing-${spacing} cr-align-${alignment}`}
      aria-labelledby={heading ? headingId : undefined}
      data-content-state={contentState}
    >
      <div className="cr-container">
        <ContentNeededBadge show={showNeeded} />
        {heading ? <h2 id={headingId}>{heading}</h2> : null}
        {body ? <p className="cr-custom__body">{body}</p> : null}
        {showNeeded && guidance ? <p className="cr-guidance-note">{guidance}</p> : null}

        {showItems ? (
          <ul className="cr-custom__items">
            {(items || []).map((item, index) => {
              const placeholder = isPlaceholderFlag(item.isPlaceholder);
              return (
                <li
                  key={`${item.title || 'item'}-${index}`}
                  className={placeholder ? 'cr-custom__item cr-placeholder' : 'cr-custom__item'}
                >
                  {item.imageUrl ? (
                    <div className="cr-custom__media">
                      <ResolvedImage src={item.imageUrl} alt={item.imageAlt || ''} />
                    </div>
                  ) : null}
                  {item.title ? <h3>{item.title}</h3> : null}
                  {item.body ? <p>{item.body}</p> : null}
                  {placeholder ? (
                    <p className="cr-placeholder-note">Guidance — replace with your content</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {buttonLabel ? (
          <div className="cr-custom__actions">
            <PageAnchor
              className={`${buttonStyleClass(buttonStyle)} cr-btn--large`}
              href={buttonUrl || '#'}
            >
              {buttonLabel}
            </PageAnchor>
          </div>
        ) : null}
      </div>
    </section>
  );
}
