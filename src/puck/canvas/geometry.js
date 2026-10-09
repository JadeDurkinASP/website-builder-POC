import { DEFAULT_FRAME, MIN_SIZES, MOBILE_BREAKPOINT } from './constants';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function mergeFrame(props = {}) {
  return {
    ...DEFAULT_FRAME,
    ...props,
    x: Number.isFinite(props.x) ? props.x : DEFAULT_FRAME.x,
    y: Number.isFinite(props.y) ? props.y : DEFAULT_FRAME.y,
    width: Number.isFinite(props.width) ? props.width : DEFAULT_FRAME.width,
    height: Number.isFinite(props.height) ? props.height : DEFAULT_FRAME.height,
    zIndex: Number.isFinite(props.zIndex) ? props.zIndex : DEFAULT_FRAME.zIndex,
    locked: props.locked === true || props.locked === 'yes' || props.locked === 'true',
  };
}

export function getMinSize(type) {
  return MIN_SIZES[type] || { width: 40, height: 24 };
}

/** Resolve which geometry to use for the current viewport. */
export function resolveGeometry(props, { useMobileFree, isMobileStack }) {
  const frame = mergeFrame(props);

  if (isMobileStack) {
    return {
      ...frame,
      mode: 'stack',
      width: '100%',
      height: 'auto',
      x: 0,
      y: 0,
    };
  }

  if (useMobileFree) {
    return {
      ...frame,
      mode: 'free',
      x: frame.mobileX ?? frame.x,
      y: frame.mobileY ?? frame.y,
      width: frame.mobileWidth ?? Math.min(frame.width, 320),
      height: frame.mobileHeight ?? frame.height,
      heightMode: frame.mobileHeightMode ?? frame.heightMode,
    };
  }

  return {
    ...frame,
    mode: 'free',
  };
}

export function isNarrowViewport(width) {
  return Number(width) > 0 && Number(width) < MOBILE_BREAKPOINT;
}

export function snapValue(value, gridSize) {
  if (!gridSize || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function constrainToBounds({ x, y, width, height }, bounds) {
  if (!bounds) return { x, y, width, height };
  const maxW = Math.max(getMinSize().width, bounds.width);
  const maxH = Math.max(getMinSize().height, bounds.height);
  const nextWidth = clamp(width, getMinSize().width, maxW);
  const nextHeight = height > 0 ? clamp(height, getMinSize().height, maxH) : height;
  const nextX = clamp(x, 0, Math.max(0, bounds.width - nextWidth));
  const nextY = clamp(y, 0, Math.max(0, bounds.height - (nextHeight || 24)));
  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
}

export function alignmentGuides({ x, y, width, height }, bounds, threshold = 6) {
  if (!bounds) return { guides: [], x, y };
  const guides = [];
  let nextX = x;
  let nextY = y;
  const midX = x + width / 2;
  const midY = y + height / 2;
  const right = x + width;
  const bottom = y + height;
  const centreX = bounds.width / 2;
  const centreY = bounds.height / 2;

  if (Math.abs(x) <= threshold) {
    nextX = 0;
    guides.push({ axis: 'x', offset: 0 });
  } else if (Math.abs(right - bounds.width) <= threshold) {
    nextX = bounds.width - width;
    guides.push({ axis: 'x', offset: bounds.width });
  } else if (Math.abs(midX - centreX) <= threshold) {
    nextX = centreX - width / 2;
    guides.push({ axis: 'x', offset: centreX });
  }

  if (Math.abs(y) <= threshold) {
    nextY = 0;
    guides.push({ axis: 'y', offset: 0 });
  } else if (Math.abs(bottom - bounds.height) <= threshold) {
    nextY = bounds.height - (height || 24);
    guides.push({ axis: 'y', offset: bounds.height });
  } else if (Math.abs(midY - centreY) <= threshold) {
    nextY = centreY - (height || 24) / 2;
    guides.push({ axis: 'y', offset: centreY });
  }

  return { guides, x: nextX, y: nextY };
}
