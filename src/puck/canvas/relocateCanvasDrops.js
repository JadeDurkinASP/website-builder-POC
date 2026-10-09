import {
  cascadePlacement,
  consumeCanvasDropPoint,
  peekCanvasDropPoint,
  peekLatestCanvasDropPoint,
} from './canvasDropPoint';
import { ELEMENT_TYPES } from './constants';

function isElementType(type) {
  return ELEMENT_TYPES.includes(type);
}

function placeElement(item, section, siblingCount) {
  if (section.props?.layoutMode !== 'free') return item;

  const width = Number(item.props?.width) || 280;
  const local = peekCanvasDropPoint(section.props.id);
  const drop = local
    ? { ...local, sectionId: section.props.id }
    : peekLatestCanvasDropPoint();

  if (drop) {
    consumeCanvasDropPoint(drop.sectionId);
    return {
      ...item,
      props: {
        ...item.props,
        x: Math.max(0, Math.round(drop.x - width / 2)),
        y: Math.max(0, Math.round(drop.y - 16)),
      },
    };
  }

  // Prefer coords already set by resolveElementPlacement on insert.
  if (
    Number.isFinite(Number(item.props?.x)) &&
    Number.isFinite(Number(item.props?.y))
  ) {
    return item;
  }

  const cascade = cascadePlacement(siblingCount);
  return {
    ...item,
    props: {
      ...item.props,
      x: cascade.x,
      y: cascade.y,
    },
  };
}

function drainDropCatch(section) {
  const caught = Array.isArray(section.props?.dropCatch) ? section.props.dropCatch : [];
  if (!caught.length) return { section, changed: false };

  const elements = Array.isArray(section.props.elements) ? [...section.props.elements] : [];
  for (const item of caught) {
    elements.push(placeElement(item, section, elements.length));
  }

  return {
    changed: true,
    section: {
      ...section,
      props: {
        ...section.props,
        elements,
        dropCatch: [],
      },
    },
  };
}

function pickTargetSection(content) {
  const canvases = content.filter((item) => item?.type === 'CanvasSection');
  if (!canvases.length) return null;

  const latest = peekLatestCanvasDropPoint();
  if (latest?.sectionId) {
    const matched = canvases.find((item) => item.props?.id === latest.sectionId);
    if (matched) return matched.props.id;
  }

  const free = canvases.find((item) => item.props?.layoutMode === 'free');
  return (free || canvases[0]).props.id;
}

/**
 * Puck disables a DropZone once it has children. Free-positioned elements leave
 * no interstitial drop targets, so Element* drafts fall through to the page root.
 * An empty overlay slot (`dropCatch`) receives those drops; this helper moves them
 * into `elements`, and also rescues any Element* that landed on the root.
 */
export function relocateCanvasDrops(data) {
  if (!data || !Array.isArray(data.content)) return data;

  let changed = false;
  let content = data.content.map((item) => {
    if (item?.type !== 'CanvasSection') return item;
    const result = drainDropCatch(item);
    if (result.changed) changed = true;
    return result.section;
  });

  const rootElements = [];
  const withoutRootElements = [];
  for (const item of content) {
    if (isElementType(item?.type)) {
      rootElements.push(item);
    } else {
      withoutRootElements.push(item);
    }
  }

  if (rootElements.length) {
    const targetId = pickTargetSection(withoutRootElements);
    if (targetId) {
      changed = true;
      content = withoutRootElements.map((item) => {
        if (item?.type !== 'CanvasSection' || item.props?.id !== targetId) return item;
        const elements = Array.isArray(item.props.elements) ? [...item.props.elements] : [];
        for (const el of rootElements) {
          elements.push(placeElement(el, item, elements.length));
        }
        return {
          ...item,
          props: {
            ...item.props,
            elements,
            dropCatch: [],
          },
        };
      });
    } else {
      // No Canvas Section to absorb into — drop the orphaned root Elements.
      content = withoutRootElements;
      changed = true;
    }
  }

  if (!changed) return data;
  return { ...data, content };
}

export function dataNeedsCanvasRelocation(data) {
  if (!data || !Array.isArray(data.content)) return false;
  if (data.content.some((item) => isElementType(item?.type))) return true;
  return data.content.some(
    (item) =>
      item?.type === 'CanvasSection' &&
      Array.isArray(item.props?.dropCatch) &&
      item.props.dropCatch.length > 0,
  );
}
