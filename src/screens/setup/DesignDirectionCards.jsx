import { DESIGN_DIRECTIONS } from '../../constants';

export function DesignDirectionCards({ value, onChange }) {
  return (
    <div className="cr-direction-cards" role="group" aria-label="Design direction">
      {DESIGN_DIRECTIONS.map((direction) => {
        const selected = value === direction.value;
        return (
          <button
            key={direction.value}
            type="button"
            className={`cr-direction-card ${selected ? 'cr-direction-card--selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onChange(direction.value)}
          >
            <div
              className={`cr-direction-thumb cr-direction-thumb--${direction.value}`}
              aria-hidden="true"
            >
              <span className="cr-direction-thumb__nav" />
              <span className="cr-direction-thumb__hero" />
              <span className="cr-direction-thumb__line" />
              <span className="cr-direction-thumb__line cr-direction-thumb__line--short" />
              <span className="cr-direction-thumb__blocks">
                <i />
                <i />
                <i />
              </span>
            </div>
            <strong>{direction.label}</strong>
            <p>{direction.description}</p>
          </button>
        );
      })}
    </div>
  );
}
