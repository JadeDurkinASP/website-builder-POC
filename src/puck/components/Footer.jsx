import { PageAnchor } from '../../pages/PageLinkContext';

export function Footer({
  eventName,
  metaLine,
  links = [],
  legalNote,
  styleVariant = 'solid',
}) {
  return (
    <footer className={`cr-footer cr-footer--${styleVariant}`}>
      <div className="cr-container cr-footer__inner">
        <div>
          <p className="cr-footer__name">{eventName}</p>
          {metaLine ? <p className="cr-footer__meta">{metaLine}</p> : null}
        </div>
        {(links || []).length > 0 ? (
          <nav aria-label="Footer">
            <ul className="cr-footer__links">
              {links.map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <PageAnchor href={link.url || '#'}>{link.label}</PageAnchor>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {legalNote ? <p className="cr-footer__legal">{legalNote}</p> : null}
      </div>
    </footer>
  );
}
