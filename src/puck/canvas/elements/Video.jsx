import { ResolvedImage } from '../../../assets/ResolvedImage';
import { ElementFrame } from '../ElementFrame';

function isSafeVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function ElementVideo({
  id,
  videoUrl = '',
  posterUrl = '',
  controls = true,
  puck,
  ...frameProps
}) {
  const safe = isSafeVideoUrl(videoUrl);

  return (
    <ElementFrame
      id={id}
      type="ElementVideo"
      puck={puck}
      autoHeight={false}
      keepAspectRatio
      {...frameProps}
      heightMode={frameProps.heightMode || 'fixed'}
      height={frameProps.height || 202}
      width={frameProps.width || 360}
    >
      <div className="cr-element-video">
        {safe ? (
          <video
            src={videoUrl}
            poster={posterUrl || undefined}
            controls={controls === true || controls === 'true' || controls === 'yes'}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f1720' }}
          >
            {posterUrl ? <ResolvedImage src={posterUrl} alt="" /> : null}
          </video>
        ) : (
          <div className="cr-element-video__placeholder">
            {posterUrl ? <ResolvedImage src={posterUrl} alt="" /> : null}
            <span>Add a direct browser-playable video URL (https)</span>
          </div>
        )}
      </div>
    </ElementFrame>
  );
}
