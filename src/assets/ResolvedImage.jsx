import { fromAssetRef, isAssetRef } from '../constants';
import { useAssetUrl } from './AssetResolver';

export function ResolvedImage({ src, alt = '', className, ...rest }) {
  const assetId = isAssetRef(src) ? fromAssetRef(src) : null;
  const { url, missing, loading } = useAssetUrl(assetId);

  if (!src) return null;

  if (assetId) {
    if (loading) {
      return <span className="cr-asset-missing">Loading image…</span>;
    }
    if (missing || !url) {
      return (
        <span className="cr-asset-missing" role="status">
          Missing asset
        </span>
      );
    }
    return <img src={url} alt={alt} className={className} {...rest} />;
  }

  // Legacy data URLs / normal URLs
  return <img src={src} alt={alt} className={className} {...rest} />;
}
