/**
 * Collect and remap asset: references across a project’s Puck documents.
 */

import { fromAssetRef, isAssetRef, toAssetRef } from '../constants';
import { walkPuckData } from '../pages/pageLinks';

function collectFromValue(value, ids) {
  if (typeof value === 'string' && isAssetRef(value)) {
    const id = fromAssetRef(value);
    if (id) ids.add(id);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectFromValue(item, ids));
    return;
  }
  Object.values(value).forEach((child) => collectFromValue(child, ids));
}

export function collectAssetIdsFromData(data) {
  const ids = new Set();
  if (!data) return ids;
  walkPuckData(data, (node) => collectFromValue(node.props, ids));
  return ids;
}

export function collectAssetIdsFromProject(project) {
  const ids = new Set();
  (project?.pages || []).forEach((page) => {
    collectAssetIdsFromData(page.puckData).forEach((id) => ids.add(id));
  });
  if (project?.puckData) {
    collectAssetIdsFromData(project.puckData).forEach((id) => ids.add(id));
  }
  const logo = project?.branding?.logoDataUrl;
  if (typeof logo === 'string' && isAssetRef(logo)) {
    const id = fromAssetRef(logo);
    if (id) ids.add(id);
  }
  (project?.contentSetup?.assets || []).forEach((asset) => {
    if (asset?.id) ids.add(asset.id);
  });
  return ids;
}

function remapValue(value, idMap) {
  if (typeof value === 'string' && isAssetRef(value)) {
    const oldId = fromAssetRef(value);
    if (oldId && idMap[oldId]) return toAssetRef(idMap[oldId]);
    return value;
  }
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => remapValue(item, idMap));
  const next = {};
  Object.entries(value).forEach(([key, child]) => {
    next[key] = remapValue(child, idMap);
  });
  return next;
}

export function remapAssetIdsInData(data, idMap) {
  if (!data || !idMap || !Object.keys(idMap).length) return data;
  const clone = structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));
  walkPuckData(clone, (node) => {
    if (!node.props) return;
    node.props = remapValue(node.props, idMap);
  });
  return clone;
}

export function remapAssetIdsInProject(project, idMap) {
  if (!project || !idMap || !Object.keys(idMap).length) return project;
  const pages = (project.pages || []).map((page) => ({
    ...page,
    puckData: remapAssetIdsInData(page.puckData, idMap),
  }));
  const home = pages.find((page) => page.role === 'home') || pages[0];
  let branding = project.branding;
  if (branding?.logoDataUrl && isAssetRef(branding.logoDataUrl)) {
    const oldId = fromAssetRef(branding.logoDataUrl);
    if (oldId && idMap[oldId]) {
      branding = { ...branding, logoDataUrl: toAssetRef(idMap[oldId]) };
    }
  }
  const assets = (project.contentSetup?.assets || []).map((asset) => {
    if (!asset?.id || !idMap[asset.id]) return asset;
    return { ...asset, id: idMap[asset.id] };
  });

  return {
    ...project,
    branding,
    pages,
    puckData: home?.puckData || remapAssetIdsInData(project.puckData, idMap),
    contentSetup: {
      ...project.contentSetup,
      assets,
    },
  };
}
