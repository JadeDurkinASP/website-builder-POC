import { ElementFrame } from '../ElementFrame';

export function ElementShape({
  id,
  shape = 'rectangle',
  fill = '#00a986',
  opacity = 1,
  puck,
  ...frameProps
}) {
  const radius = shape === 'circle' || shape === 'ellipse' ? '999px' : shape === 'rounded' ? '16px' : '0';

  return (
    <ElementFrame
      id={id}
      type="ElementShape"
      puck={puck}
      autoHeight={false}
      {...frameProps}
      heightMode={frameProps.heightMode || 'fixed'}
      height={frameProps.height || 120}
      width={frameProps.width || 120}
    >
      <div
        className="cr-element-shape"
        aria-hidden
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: fill || '#00a986',
          opacity: Number(opacity) || 1,
          borderRadius: radius,
        }}
      />
    </ElementFrame>
  );
}
