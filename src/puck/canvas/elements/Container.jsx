import { ELEMENT_TYPES } from '../constants';
import { CanvasLayoutContext, useCanvasLayout } from '../context';
import { ElementFrame } from '../ElementFrame';

const CONTAINER_ALLOW = ELEMENT_TYPES.filter((type) => type !== 'ElementContainer');

export function ElementContainer({
  id,
  elements: Elements,
  gap = 12,
  padding = 16,
  backgroundColour = 'transparent',
  arrangement = 'stack',
  puck,
  ...frameProps
}) {
  const parentLayout = useCanvasLayout();
  // Nested container children are always flow-based in this iteration.
  const nestedLayout = {
    ...parentLayout,
    layoutMode: 'flow',
    flowArrangement: arrangement === 'row' ? 'row' : 'stack',
    mobileLayout: 'stack',
  };

  return (
    <ElementFrame
      id={id}
      type="ElementContainer"
      puck={puck}
      autoHeight={false}
      {...frameProps}
      heightMode={frameProps.heightMode || 'fixed'}
      height={frameProps.height || 220}
      width={frameProps.width || 320}
    >
      <CanvasLayoutContext.Provider value={nestedLayout}>
        <div
          className="cr-element-container"
          style={{
            gap: Number(gap) || 12,
            padding: Number(padding) || 16,
            backgroundColor: backgroundColour || 'transparent',
            display: 'flex',
            flexDirection: arrangement === 'row' ? 'row' : 'column',
            flexWrap: arrangement === 'row' ? 'wrap' : undefined,
            alignItems: 'stretch',
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            minHeight: 80,
            overflow: 'auto',
          }}
        >
          <Elements
            className="cr-element-container__slot"
            style={{
              display: 'flex',
              flexDirection: arrangement === 'row' ? 'row' : 'column',
              flexWrap: arrangement === 'row' ? 'wrap' : undefined,
              gap: Number(gap) || 12,
              width: '100%',
              minHeight: 64,
            }}
            minEmptyHeight={64}
            allow={CONTAINER_ALLOW}
          />
        </div>
      </CanvasLayoutContext.Provider>
    </ElementFrame>
  );
}
