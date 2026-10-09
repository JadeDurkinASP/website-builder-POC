import { ResolvedImage } from '../../../assets/ResolvedImage';
import { ElementFrame } from '../ElementFrame';

export function ElementImage({
  id,
  imageUrl = '',
  imageAlt = '',
  objectFit = 'cover',
  lockAspectRatio = true,
  puck,
  ...frameProps
}) {
  return (
    <ElementFrame
      id={id}
      type="ElementImage"
      puck={puck}
      autoHeight={false}
      keepAspectRatio={
        lockAspectRatio === true || lockAspectRatio === 'true' || lockAspectRatio === 'yes'
      }
      {...frameProps}
      heightMode={frameProps.heightMode || 'fixed'}
      height={frameProps.height || 180}
    >
      <div className="cr-element-image">
        {imageUrl ? (
          <ResolvedImage
            src={imageUrl}
            alt={imageAlt || ''}
            style={{
              width: '100%',
              height: '100%',
              objectFit: objectFit === 'contain' ? 'contain' : 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div className="cr-element-image__placeholder">Add an image</div>
        )}
      </div>
    </ElementFrame>
  );
}
