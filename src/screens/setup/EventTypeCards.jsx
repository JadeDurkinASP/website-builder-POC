const ICONS = {
  conference: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7.5 8a5.5 5.5 0 0 1 11 0H4.5Zm13.2-8.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Zm1.3 1.2c2 0 4.5 1.1 4.5 3.6h-3.2c0-1.4-.9-2.4-2.5-3-.4-.1-.8-.3-1.3-.4.8-.3 1.6-.8 2.5-1.2Z"
      />
    </svg>
  ),
  exhibition: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h16v3H4V5Zm1 5h6v9H5v-9Zm8 0h6v9h-6v-9Z"
      />
    </svg>
  ),
  awards: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2 9.5 8H3l5.2 3.9L6.2 18 12 14.2 17.8 18l-2-6.1L21 8h-6.5L12 2Zm-3 16.5V22l3-1.5 3 1.5v-3.5l-3 1.2-3-1.2Z"
      />
    </svg>
  ),
  networking: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 12c-2.5 0-5 1.4-5 3.5V18h10v-2.5C12 13.4 9.5 12 7 12Zm10 0c-.7 0-1.4.1-2 .4 1.2.8 2 2 2 3.1V18h7v-2.5c0-2.1-2.5-3.5-5-3.5Z"
      />
    </svg>
  ),
  festival: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3 4 8v2h16V8l-8-5Zm-6 9h2v7H6v-7Zm6 0h2v7h-2v-7Zm6 0h2v7h-2v-7ZM3 20h18v2H3v-2Z"
      />
    </svg>
  ),
  webinar: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 5h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5l-3 3v-3H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm16 3h3v8h-3l-2 2v-2h-1v-6h1V8h2Z"
      />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"
      />
    </svg>
  ),
};

export function EventTypeCards({ types, value, onChange }) {
  return (
    <div className="cr-event-type-cards" role="radiogroup" aria-label="Event type">
      {types.map((type) => {
        const selected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            className={`cr-event-type-card ${selected ? 'cr-event-type-card--selected' : ''}`}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type.value)}
          >
            <span className="cr-event-type-card__icon">{ICONS[type.value] || ICONS.other}</span>
            <span className="cr-event-type-card__label">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
