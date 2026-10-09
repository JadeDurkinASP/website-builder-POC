import { useEffect, useRef } from 'react';
import { alignmentGuides, clamp, constrainToBounds, getMinSize, snapValue } from './geometry';

function getZoom(bounds, el) {
  if (bounds?.zoom) return bounds.zoom;
  if (!el) return 1;
  const rect = el.getBoundingClientRect();
  return el.offsetWidth ? rect.width / el.offsetWidth : 1;
}

function eventElement(target) {
  if (target instanceof Element) return target;
  return target?.parentElement || null;
}

function guidesEqual(a = [], b = []) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every(
    (guide, index) =>
      guide.axis === b[index]?.axis && Number(guide.offset) === Number(b[index]?.offset),
  );
}

/** Focus a contenteditable and put the caret at the click (or at the end). */
function focusInlineEditable(inline, clientX, clientY) {
  if (!inline || typeof inline.focus !== 'function') return;
  inline.focus({ preventScroll: true });
  const doc = inline.ownerDocument;
  const sel = doc.getSelection?.();
  if (!sel) return;

  try {
    let range = null;
    if (typeof doc.caretRangeFromPoint === 'function' && clientX != null && clientY != null) {
      range = doc.caretRangeFromPoint(clientX, clientY);
    } else if (
      typeof doc.caretPositionFromPoint === 'function' &&
      clientX != null &&
      clientY != null
    ) {
      const pos = doc.caretPositionFromPoint(clientX, clientY);
      if (pos?.offsetNode) {
        range = doc.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    if (range && inline.contains(range.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
  } catch {
    /* fall through to end-of-text */
  }

  const end = doc.createRange();
  end.selectNodeContents(inline);
  end.collapse(false);
  sel.removeAllRanges();
  sel.addRange(end);
}

/** Returns true when the pointer should NOT start a free-canvas move. */
function isNoDragTarget(target, root, event) {
  const node = eventElement(target);
  if (!node || !root) return true;
  const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];
  const inRoot = root.contains(node) || path.includes(root);
  if (!inRoot) return true;
  // Resize handles and non-move toolbar actions — never start a move.
  // Text / inline-edit ARE draggable; a click without movement focuses the text.
  if (node.closest('[data-cr-resize]')) return true;
  if (node.closest('.cr-element-frame__toolbar button:not(.cr-element-frame__drag-handle)')) {
    return true;
  }
  if (node.closest('input, textarea, select, option')) return true;
  return false;
}

/**
 * Free-position move/resize via pointer events inside Puck's iframe.
 * During a gesture, React must not re-apply left/top from props (see onDraggingChange)
 * or guide updates will fight the live DOM and the element only inches forward.
 */
export function useElementInteract({
  ref,
  enabled,
  locked,
  type,
  geometry,
  snapEnabled,
  snapGrid,
  keepAspectRatio,
  autoHeight,
  getBounds,
  setGuides,
  onCommit,
  onInteractStart,
  onDraggingChange,
}) {
  const onCommitRef = useRef(onCommit);
  const onInteractStartRef = useRef(onInteractStart);
  const onDraggingChangeRef = useRef(onDraggingChange);
  const getBoundsRef = useRef(getBounds);
  const setGuidesRef = useRef(setGuides);
  const geometryRef = useRef(geometry);
  const autoHeightRef = useRef(autoHeight);
  const lastGuidesRef = useRef([]);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onInteractStartRef.current = onInteractStart;
    onDraggingChangeRef.current = onDraggingChange;
    getBoundsRef.current = getBounds;
    setGuidesRef.current = setGuides;
    geometryRef.current = geometry;
    autoHeightRef.current = autoHeight;
  }, [onCommit, onInteractStart, onDraggingChange, getBounds, setGuides, geometry, autoHeight]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || locked) return undefined;

    const min = getMinSize(type);
    const doc = el.ownerDocument;
    let session = null;

    const publishGuides = (guides) => {
      if (guidesEqual(lastGuidesRef.current, guides)) return;
      lastGuidesRef.current = guides;
      setGuidesRef.current?.(guides);
    };

    const applyLive = (next) => {
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
      el.style.width = `${next.width}px`;
      if (next.height > 0) el.style.height = `${next.height}px`;
      else el.style.height = 'auto';
    };

    const endSession = (cancelled) => {
      if (!session) return;
      publishGuides([]);
      doc.removeEventListener('pointermove', session.onMove);
      doc.removeEventListener('pointerup', session.onUp);
      doc.removeEventListener('pointercancel', session.onUp);
      doc.removeEventListener('keydown', session.onKey);
      try {
        if (session.pointerId != null) el.releasePointerCapture(session.pointerId);
      } catch {
        /* already released */
      }
      el.classList.remove('cr-element-frame--dragging');
      onDraggingChangeRef.current?.(false);

      const committed = !cancelled && session.didMove;
      if (cancelled) {
        applyLive({
          x: session.start.x,
          y: session.start.y,
          width: session.start.width,
          height: session.start.height,
        });
      } else if (session.didMove) {
        onCommitRef.current?.({ ...session.live });
      } else {
        applyLive({
          x: session.start.x,
          y: session.start.y,
          width: session.start.width,
          height: session.start.height,
        });
        // Click (no drag): focus inline text; caret at click (or end).
        const inline = el.querySelector('[data-cr-inline-edit]');
        if (inline) {
          focusInlineEditable(inline, session.start.pointerX, session.start.pointerY);
        }
      }

      // Select after the gesture so toolbar mount / setUi cannot interrupt dragging.
      onInteractStartRef.current?.();
      session = null;
      return committed;
    };

    const startSession = (event, mode, edge = null, { capture = true } = {}) => {
      if (capture) {
        event.preventDefault();
        event.stopPropagation();
      }
      const bounds = getBoundsRef.current?.();
      const zoom = getZoom(bounds, el) || 1;
      const useAuto = autoHeightRef.current;
      const start = {
        x: geometryRef.current.x,
        y: geometryRef.current.y,
        width: Number(geometryRef.current.width) || min.width,
        height: useAuto
          ? el.offsetHeight || min.height
          : Number(geometryRef.current.height) || el.offsetHeight || min.height,
        pointerX: event.clientX,
        pointerY: event.clientY,
        zoom,
        mode,
        edge,
        useAuto,
      };
      const live = {
        x: start.x,
        y: start.y,
        width: start.width,
        height: useAuto && mode === 'move' ? 0 : start.height,
      };

      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }

      onDraggingChangeRef.current?.(true);

      const onMove = (ev) => {
        if (!session) return;
        const dx = (ev.clientX - session.start.pointerX) / session.start.zoom;
        const dy = (ev.clientY - session.start.pointerY) / session.start.zoom;
        if (!session.didMove && Math.hypot(dx, dy) < 3) return;
        if (!session.didMove) {
          session.didMove = true;
          el.classList.add('cr-element-frame--dragging');
          session.pointerId = ev.pointerId;
          ev.preventDefault();
          ev.stopPropagation();
        }

        let next = { ...session.live };

        if (session.start.mode === 'move') {
          next = {
            ...next,
            x: session.start.x + dx,
            y: session.start.y + dy,
            height: session.start.useAuto ? 0 : session.start.height,
          };
          if (snapEnabled) {
            next.x = snapValue(next.x, snapGrid);
            next.y = snapValue(next.y, snapGrid);
          }
          const guided = alignmentGuides(
            { ...next, height: next.height || session.start.height },
            getBoundsRef.current?.(),
          );
          next = { ...next, x: guided.x, y: guided.y };
          publishGuides(guided.guides);
        } else {
          const edgeName = session.start.edge || '';
          let width = session.start.width;
          let height = session.start.height;
          let x = session.start.x;
          let y = session.start.y;
          if (edgeName.includes('e')) width = session.start.width + dx;
          if (edgeName.includes('w')) {
            width = session.start.width - dx;
            x = session.start.x + dx;
          }
          if (edgeName.includes('s')) height = session.start.height + dy;
          if (edgeName.includes('n')) {
            height = session.start.height - dy;
            y = session.start.y + dy;
          }
          width = clamp(width, min.width, getBoundsRef.current?.()?.width || 4000);
          height = clamp(height, min.height, getBoundsRef.current?.()?.height || 4000);
          if (keepAspectRatio) {
            const ratio = session.start.width / Math.max(1, session.start.height);
            if (edgeName.includes('e') || edgeName.includes('w')) {
              height = Math.round(width / ratio);
            } else {
              width = Math.round(height * ratio);
            }
          }
          next = { x, y, width, height };
          if (snapEnabled) {
            next.width = snapValue(next.width, snapGrid);
            next.height = snapValue(next.height, snapGrid);
            next.x = snapValue(next.x, snapGrid);
            next.y = snapValue(next.y, snapGrid);
          }
        }

        next = constrainToBounds(
          {
            ...next,
            height: next.height || min.height,
          },
          getBoundsRef.current?.(),
        );
        if (session.start.mode === 'move' && session.start.useAuto) {
          next.height = 0;
        }
        session.live = next;
        applyLive(next);
      };

      const onUp = () => endSession(false);
      const onKey = (ev) => {
        if (ev.key === 'Escape') endSession(true);
      };

      session = {
        start,
        live,
        onMove,
        onUp,
        onKey,
        didMove: mode === 'resize',
        pointerId: event.pointerId,
      };
      doc.addEventListener('pointermove', onMove);
      doc.addEventListener('pointerup', onUp);
      doc.addEventListener('pointercancel', onUp);
      doc.addEventListener('keydown', onKey);
    };

    const onBodyPointerDown = (event) => {
      const root = event.currentTarget || el;
      if (event.button != null && event.button !== 0) return;
      if (isNoDragTarget(event.target, root, event)) {
        // Still block Puck from dragging the Canvas Section underneath.
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      startSession(event, 'move', null, { capture: true });
    };

    const onDragHandleDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      startSession(event, 'move', null, { capture: true });
    };

    const onResizeDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      const handle = event.currentTarget;
      const edge = handle.getAttribute('data-cr-resize') || '';
      startSession(event, 'resize', edge, { capture: true });
    };

    const bindControls = () => {
      const dragHandle = el.querySelector('.cr-element-frame__drag-handle');
      const resizeHandles = el.querySelectorAll('[data-cr-resize]');
      el.addEventListener('pointerdown', onBodyPointerDown);
      if (dragHandle) dragHandle.addEventListener('pointerdown', onDragHandleDown);
      resizeHandles.forEach((node) => node.addEventListener('pointerdown', onResizeDown));
      return () => {
        el.removeEventListener('pointerdown', onBodyPointerDown);
        if (dragHandle) dragHandle.removeEventListener('pointerdown', onDragHandleDown);
        resizeHandles.forEach((node) => node.removeEventListener('pointerdown', onResizeDown));
      };
    };

    let unbind = bindControls();
    // Only rebind when toolbar/handles are added/removed — not on every text tweak.
    const observer = new MutationObserver((mutations) => {
      if (session) return;
      const relevant = mutations.some(
        (mutation) =>
          Array.from(mutation.addedNodes).some(
            (node) =>
              node instanceof Element &&
              (node.matches?.('.cr-element-frame__toolbar, .cr-element-frame__handle') ||
                node.querySelector?.('.cr-element-frame__toolbar, .cr-element-frame__handle')),
          ) ||
          Array.from(mutation.removedNodes).some(
            (node) =>
              node instanceof Element &&
              (node.matches?.('.cr-element-frame__toolbar, .cr-element-frame__handle') ||
                node.querySelector?.('.cr-element-frame__toolbar, .cr-element-frame__handle')),
          ),
      );
      if (!relevant) return;
      unbind();
      unbind = bindControls();
    });
    observer.observe(el, { childList: true, subtree: true });

    const onKeyDown = (event) => {
      if (session) return;
      if (document.activeElement?.closest?.('[contenteditable="true"]')) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      if (!el.contains(document.activeElement) && document.activeElement !== el) return;
      event.preventDefault();
      const step = event.shiftKey ? snapGrid || 8 : 1;
      const delta = {
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
      }[event.key];
      const next = constrainToBounds(
        {
          x: geometryRef.current.x + delta.x,
          y: geometryRef.current.y + delta.y,
          width: Number(geometryRef.current.width) || min.width,
          height: autoHeightRef.current
            ? 0
            : Number(geometryRef.current.height) || min.height,
        },
        getBoundsRef.current?.(),
      );
      onCommitRef.current?.(next);
    };

    el.addEventListener('keydown', onKeyDown);
    if (el.tabIndex < 0) el.tabIndex = 0;

    return () => {
      if (session?.didMove) endSession(false);
      else endSession(true);
      unbind();
      observer.disconnect();
      el.removeEventListener('keydown', onKeyDown);
      onDraggingChangeRef.current?.(false);
    };
  }, [ref, enabled, locked, type, snapEnabled, snapGrid, keepAspectRatio, autoHeight]);
}
