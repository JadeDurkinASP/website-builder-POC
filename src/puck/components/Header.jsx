import { ResolvedImage } from '../../assets/ResolvedImage';
import { PageAnchor } from '../../pages/PageLinkContext';
import { buttonStyleClass } from '../buttonStyles';

export function Header({
  eventName,
  logoUrl,
  logoAlt,
  navLinks = [],
  buttonLabel,
  buttonUrl,
  buttonStyle = 'primary',
  ctaLabel,
  ctaUrl,
  styleVariant = 'solid',
}) {
  const label = buttonLabel ?? ctaLabel;
  const url = buttonUrl ?? ctaUrl;
  const style = buttonStyle || 'primary';

  return (
    <header className={`cr-header cr-header--${styleVariant}`}>
      <div className="cr-container cr-header__inner">
        <div className="cr-header__brand">
          {logoUrl ? (
            <ResolvedImage
              className="cr-header__logo"
              src={logoUrl}
              alt={
                logoAlt || (typeof eventName === 'string' ? eventName : '') || 'Event logo'
              }
            />
          ) : (
            <span className="cr-header__name">{eventName || 'Event name'}</span>
          )}
        </div>
        <nav className="cr-header__nav" aria-label="Primary">
          <ul>
            {(navLinks || []).map((link, index) => (
              <li key={`nav-${index}`}>
                <PageAnchor href={link.url || '#'}>{link.label}</PageAnchor>
              </li>
            ))}
          </ul>
        </nav>
        {label ? (
          <PageAnchor className={buttonStyleClass(style)} href={url || '#'}>
            {label}
          </PageAnchor>
        ) : null}
      </div>
    </header>
  );
}
