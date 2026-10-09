/** Last pointer position inside a Canvas Section content area (section-local px). */
let latest = {
  sectionId: null,
  x: 24,
  y: 24,
  at: 0,
};

export function setCanvasDropPoint(sectionId, x, y) {
  if (!sectionId) return;
  latest = {
    sectionId,
    x: Math.max(0, Number(x) || 0),
    y: Math.max(0, Number(y) || 0),
    at: Date.now(),
  };
}

export function peekCanvasDropPoint(sectionId) {
  if (!sectionId || latest.sectionId !== sectionId) return null;
  if (Date.now() - latest.at > 4000) return null;
  return { x: latest.x, y: latest.y };
}

/** Most recent Canvas Section under the pointer, regardless of id match. */
export function peekLatestCanvasDropPoint() {
  if (!latest.sectionId || Date.now() - latest.at > 4000) return null;
  return {
    sectionId: latest.sectionId,
    x: latest.x,
    y: latest.y,
  };
}

export function consumeCanvasDropPoint(sectionId) {
  const point = peekCanvasDropPoint(sectionId);
  if (point) {
    latest = { sectionId: null, x: 24, y: 24, at: 0 };
  }
  return point;
}

/** Cascade placement when no pointer drop point is available. */
export function cascadePlacement(index = 0) {
  return {
    x: 24 + (index % 4) * 28,
    y: 24 + index * 48,
  };
}
