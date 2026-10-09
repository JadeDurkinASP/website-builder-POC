import { useEffect } from 'react';
import { createUsePuck, useGetPuck } from '@puckeditor/core';
import { dataNeedsCanvasRelocation, relocateCanvasDrops } from './relocateCanvasDrops';

const usePuck = createUsePuck();

/** Shared across every Canvas Section instance on the page. */
let relocating = false;

/**
 * Keeps Element drops inside Canvas Sections when Puck's nested DropZone is
 * disabled (has children + absolute free layout).
 */
export function CanvasDropGuard() {
  const getPuck = useGetPuck();
  const data = usePuck((s) => s.appState?.data);

  useEffect(() => {
    if (!data || relocating) return;
    if (!dataNeedsCanvasRelocation(data)) return;

    const next = relocateCanvasDrops(data);
    if (next === data) return;

    relocating = true;
    getPuck().dispatch({
      type: 'setData',
      data: next,
      recordHistory: false,
    });

    window.requestAnimationFrame(() => {
      relocating = false;
    });
  }, [data, getPuck]);

  return null;
}
