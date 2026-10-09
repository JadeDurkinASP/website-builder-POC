import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getAsset, getAssetsByIds } from '../storage/assetStore';

const AssetContext = createContext({
  getUrl: () => null,
  refreshAssets: async () => {},
  imageAssets: [],
  assets: [],
});

export function AssetProvider({ assetMetas = [], children }) {
  const [records, setRecords] = useState([]);
  const urlMapRef = useRef(new Map());
  const metasRef = useRef(assetMetas);
  metasRef.current = assetMetas;
  const assetKey = (assetMetas || []).map((asset) => asset.id).join('|');

  const revokeAll = useCallback(() => {
    urlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlMapRef.current = new Map();
  }, []);

  const refreshAssets = useCallback(async () => {
    const ids = (metasRef.current || []).map((asset) => asset.id);
    const stored = await getAssetsByIds(ids);
    revokeAll();
    const nextMap = new Map();
    stored.forEach((item) => {
      if (item?.blob) {
        nextMap.set(item.id, URL.createObjectURL(item.blob));
      }
    });
    urlMapRef.current = nextMap;
    setRecords(stored);
  }, [revokeAll, assetKey]);

  useEffect(() => {
    refreshAssets();
    return () => revokeAll();
  }, [refreshAssets, revokeAll]);

  const getUrl = useCallback((id) => {
    if (!id) return null;
    return urlMapRef.current.get(id) || null;
  }, []);

  const value = useMemo(
    () => ({
      getUrl,
      refreshAssets,
      assets: assetMetas || [],
      imageAssets: (assetMetas || []).filter((asset) => asset.kind === 'image'),
      records,
    }),
    [getUrl, refreshAssets, assetMetas, records],
  );

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export function useAssets() {
  return useContext(AssetContext);
}

export function useAssetUrl(assetId) {
  const { getUrl, records } = useAssets();
  const [state, setState] = useState({ url: null, missing: false, loading: Boolean(assetId) });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!assetId) {
        setState({ url: null, missing: false, loading: false });
        return;
      }

      const cached = getUrl(assetId);
      if (cached) {
        setState({ url: cached, missing: false, loading: false });
        return;
      }

      setState((current) => ({ ...current, loading: true }));
      const stored = await getAsset(assetId);
      if (cancelled) return;
      if (!stored?.blob) {
        setState({ url: null, missing: true, loading: false });
        return;
      }
      const url = URL.createObjectURL(stored.blob);
      setState({ url, missing: false, loading: false });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [assetId, getUrl, records]);

  return state;
}
