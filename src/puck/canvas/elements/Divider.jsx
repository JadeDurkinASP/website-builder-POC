import { ElementFrame } from '../ElementFrame';

export function ElementDivider({
  id,
  thickness = 1,
  colour = '#c5ced6',
  puck,
  ...frameProps
}) {
  return (
    <ElementFrame
      id={id}
      type="ElementDivider"
      puck={puck}
      autoHeight={false}
      {...frameProps}
      heightMode="fixed"
      height={Math.max(8, Number(thickness) + 8)}
    >
      <hr
        className="cr-element-divider"
        style={{
          border: 'none',
          borderTop: `${Number(thickness) || 1}px solid ${colour || '#c5ced6'}`,
          margin: '8px 0',
          width: '100%',
        }}
      />
    </ElementFrame>
  );
}
