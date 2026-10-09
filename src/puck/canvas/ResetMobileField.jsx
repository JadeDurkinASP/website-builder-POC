import { useGetPuck } from '@puckeditor/core';

/**
 * Returns the selected Canvas Section to automatic mobile stacking.
 * Element mobile overrides remain stored but unused until free mobile layout is re-enabled.
 */
export function ResetMobileField() {
  const getPuck = useGetPuck();

  function handleReset() {
    const { dispatch, selectedItem, getSelectorForId } = getPuck();
    if (!selectedItem || selectedItem.type !== 'CanvasSection') {
      window.alert('Select a Canvas Section to reset its mobile layout.');
      return;
    }

    const sectionSelector = getSelectorForId(selectedItem.props.id);
    if (!sectionSelector) return;

    dispatch({
      type: 'replace',
      destinationIndex: sectionSelector.index,
      destinationZone: sectionSelector.zone,
      data: {
        type: 'CanvasSection',
        props: {
          ...selectedItem.props,
          mobileLayout: 'stack',
        },
      },
      recordHistory: true,
    });
  }

  return (
    <div className="cr-reset-mobile-field">
      <button type="button" className="cr-btn cr-btn--ghost cr-btn--small" onClick={handleReset}>
        Reset mobile layout
      </button>
      <p className="cr-image-field__hint">
        Returns this section to automatic mobile stacking. Desktop free-position layout is kept.
      </p>
    </div>
  );
}
