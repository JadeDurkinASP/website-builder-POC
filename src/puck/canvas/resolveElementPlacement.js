import { ELEMENT_TYPES } from './constants';
import { cascadePlacement, consumeCanvasDropPoint } from './canvasDropPoint';

/**
 * On insert into a free-position Canvas Section, place the element at the
 * last pointer position over that section (or a cascade fallback).
 */
export function resolveElementPlacement(data, { trigger, parent }) {
  if (trigger !== 'insert') {
    return { props: data.props };
  }

  const props = { ...data.props };
  const parentIsFreeCanvas =
    parent?.type === 'CanvasSection' && parent.props?.layoutMode === 'free';

  if (!parentIsFreeCanvas) {
    return { props };
  }

  const siblings = Array.isArray(parent.props?.elements) ? parent.props.elements : [];
  const index = Math.max(0, siblings.length - 1);
  const point = consumeCanvasDropPoint(parent.props.id);
  const width = Number(props.width) || 280;

  if (point) {
    props.x = Math.max(0, Math.round(point.x - width / 2));
    props.y = Math.max(0, Math.round(point.y - 16));
  } else {
    const cascade = cascadePlacement(index);
    props.x = cascade.x;
    props.y = cascade.y;
  }

  return { props };
}

export function withElementPlacement(config) {
  const previous = config.resolveData;
  return {
    ...config,
    resolveData: async (data, params) => {
      let next = resolveElementPlacement(data, params);
      if (previous) {
        const prior = await previous({ ...data, props: next.props }, params);
        next = { props: { ...next.props, ...(prior.props || {}) } };
      }
      return next;
    },
  };
}

export function applyPlacementToAllElementConfigs(configs) {
  const next = {};
  for (const [name, config] of Object.entries(configs)) {
    next[name] = ELEMENT_TYPES.includes(name) ? withElementPlacement(config) : config;
  }
  return next;
}
