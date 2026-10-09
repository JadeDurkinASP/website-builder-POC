import { ResolvedImage } from '../../assets/ResolvedImage';
import { PageAnchor } from '../../pages/PageLinkContext';
import { buttonStyleClass } from '../buttonStyles';

function hasInlineText(value) {
  if (value == null || value === false) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  // contentEditable turns strings into React nodes while editing
  return true;
}

function resolveButtons({ buttons, ctaLabel, ctaUrl }) {
  if (Array.isArray(buttons) && buttons.length > 0) {
    return buttons.filter((button) => hasInlineText(button?.label));
  }
  if (hasInlineText(ctaLabel)) {
    return [{ label: ctaLabel, url: ctaUrl || '#', style: 'primary' }];
  }
  return [];
}

export function Hero({
  headline,
  subcopy,
  imageUrl,
  imageAlt,
  buttons = [],
  ctaLabel,
  ctaUrl,
  alignment = 'left',
  density = 'default',
  layoutVariant = 'split',
}) {
  const visibleButtons = resolveButtons({ buttons, ctaLabel, ctaUrl });

  return (
    <section
      className={`cr-hero cr-hero--${layoutVariant} cr-hero--${density} cr-align-${alignment}`}
      aria-labelledby="cr-hero-heading"
    >
      <div className="cr-container cr-hero__inner">
        <div className="cr-hero__copy">
          <h1 id="cr-hero-heading">{headline}</h1>
          {subcopy ? <p className="cr-hero__subcopy">{subcopy}</p> : null}
          {visibleButtons.length > 0 ? (
            <div className="cr-btn-group">
              {visibleButtons.map((button, index) => (
                <PageAnchor
                  key={`${button.label}-${index}`}
                  className={`${buttonStyleClass(button.style)} cr-btn--large`}
                  href={button.url || '#'}
                >
                  {button.label}
                </PageAnchor>
              ))}
            </div>
          ) : null}
        </div>
        {imageUrl ? (
          <div className="cr-hero__media">
            <ResolvedImage src={imageUrl} alt={imageAlt || ''} />
          </div>
        ) : (
          <div className="cr-hero__media cr-hero__media--placeholder" aria-hidden="true">
            <span>Add a hero image</span>
          </div>
        )}
      </div>
    </section>
  );
}
