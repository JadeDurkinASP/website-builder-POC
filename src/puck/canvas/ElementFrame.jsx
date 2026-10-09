import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createUsePuck, registerOverlayPortal, useGetPuck } from '@puckeditor/core';
import { useCanvasLayout } from './context';
import { resolveGeometry } from './geometry';
import { useElementInteract } from './useElementInteract';

const usePuck = createUsePuck();

function commitGeometryProps(getPuck, id, patch, { mobileFree }) {
  const { dispatch, getItemById, getSelectorForId } = getPuck();
  const item = getItemById(id);
  const selector = getSelectorForId(id);
  if (!item || !selector) return;

  const nextProps = { ...item.props };
  if (mobileFree) {
    nextProps.mobileX = patch.x;
    nextProps.mobileY = patch.y;
    nextProps.mobileWidth = patch.width;
    if (patch.height > 0) {
      nextProps.mobileHeight = patch.height;
      nextProps.mobileHeightMode = 'fixed';
    }
  } else {
    nextProps.x = patch.x;
    nextProps.y = patch.y;
    nextProps.width = patch.width;
    if (patch.height > 0) {
      nextProps.height = patch.height;
      nextProps.heightMode = 'fixed';
    } else {
      nextProps.heightMode = nextProps.heightMode || 'auto';
    }
  }

  dispatch({
    type: 'replace',
    destinationIndex: selector.index,
    destinationZone: selector.zone,
    data: { type: item.type, props: nextProps },
    recordHistory: true,
  });
}

function useFrameLayout(frameProps) {
  const canvas = useCanvasLayout();
  const useMobileFree =
    canvas.isMobileViewport && canvas.layoutMode === 'free' && canvas.mobileLayout === 'free';
  const isMobileStack =
    canvas.isMobileViewport && canvas.layoutMode === 'free' && canvas.mobileLayout !== 'free';
  const isFree =
    canvas.layoutMode === 'free' && !isMobileStack && (useMobileFree || !canvas.isMobileViewport);

  const geometry = useMemo(
    () => resolveGeometry(frameProps, { useMobileFree, isMobileStack }),
    // frame fields are primitives on props
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      frameProps.x,
      frameProps.y,
      frameProps.width,
      frameProps.height,
      frameProps.heightMode,
      frameProps.zIndex,
      frameProps.mobileX,
      frameProps.mobileY,
      frameProps.mobileWidth,
      frameProps.mobileHeight,
      frameProps.mobileHeightMode,
      useMobileFree,
      isMobileStack,
    ],
  );

  return { canvas, geometry, isFree, useMobileFree, isMobileStack };
}

function FrameShell({
  id,
  type,
  className,
  styleProp,
  frameProps,
  geometry,
  isFree,
  isDragging = false,
  canvas,
  children,
  overflowWarning,
  isEditing,
  selected,
  toolbar,
  handles,
  frameRef,
}) {
  // While dragging, omit left/top/width/height so React does not overwrite the
  // live pointer positions applied directly to the DOM.
  const frameStyle = isFree
    ? {
        position: 'absolute',
        zIndex: geometry.zIndex,
        maxWidth: 'none',
        boxSizing: 'border-box',
        ...(isDragging
          ? {}
          : {
              left: geometry.x,
              top: geometry.y,
              width: geometry.width,
              height:
                geometry.heightMode === 'auto' || !geometry.height
                  ? 'auto'
                  : geometry.height,
            }),
        ...styleProp,
      }
    : {
        position: 'relative',
        width: frameProps.flowWidth || (canvas.flowArrangement === 'grid' ? '100%' : undefined),
        maxWidth: '100%',
        boxSizing: 'border-box',
        zIndex: geometry.zIndex,
        ...styleProp,
      };

  return (
    <div
      ref={frameRef}
      className={[
        'cr-element-frame',
        isFree ? 'cr-element-frame--free' : 'cr-element-frame--flow',
        selected ? 'cr-element-frame--selected' : '',
        frameProps.locked === true || frameProps.locked === 'yes' || frameProps.locked === 'true'
          ? 'cr-element-frame--locked'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={frameStyle}
      data-cr-element={type}
      data-cr-element-id={id}
    >
      {children}
      {overflowWarning && isEditing ? (
        <p className="cr-element-frame__warning" role="status">
          Content may overflow this frame.
        </p>
      ) : null}
      {toolbar}
      {handles}
    </div>
  );
}

function ElementFrameEditing({
  id,
  type,
  children,
  className = '',
  keepAspectRatio = false,
  autoHeight = true,
  overflowWarning = false,
  style: styleProp,
  ...frameProps
}) {
  const ref = useRef(null);
  const getPuck = useGetPuck();
  const selected = usePuck((s) => s.selectedItem?.props?.id === id);
  const { canvas, geometry, isFree, useMobileFree } = useFrameLayout(frameProps);
  const [isDragging, setIsDragging] = useState(false);

  const onCommit = useCallback(
    (patch) => {
      commitGeometryProps(getPuck, id, patch, { mobileFree: useMobileFree });
    },
    [getPuck, id, useMobileFree],
  );

  const surfaceOpen = Boolean(canvas.surfaceOpen);
  const canEditElement = isFree && surfaceOpen;

  const onInteractStart = useCallback(() => {
    if (!surfaceOpen) {
      canvas.enterSurface?.();
    }
    const { dispatch, getSelectorForId, selectedItem } = getPuck();
    if (selectedItem?.props?.id === id) return;
    const selector = getSelectorForId(id);
    if (!selector) return;
    dispatch({
      type: 'setUi',
      ui: { itemSelector: selector },
      recordHistory: false,
    });
  }, [getPuck, id, surfaceOpen, canvas]);

  useElementInteract({
    ref,
    // Only move/resize once the canvas is drilled into (double-click / after drop).
    enabled: canEditElement,
    locked: frameProps.locked === true || frameProps.locked === 'yes' || frameProps.locked === 'true',
    type,
    geometry,
    snapEnabled: canvas.snapEnabled,
    snapGrid: canvas.snapGrid,
    keepAspectRatio,
    autoHeight: autoHeight || geometry.heightMode === 'auto',
    getBounds: canvas.getBounds,
    setGuides: canvas.setGuides,
    onCommit,
    onInteractStart,
    onDraggingChange: setIsDragging,
  });

  useEffect(() => {
    if (!canEditElement || !selected || !ref.current) return undefined;
    // Portal individual controls so they receive hits above Puck's overlay.
    // Avoid disableDrag stopPropagation — that blocks our pointer move/resize handlers.
    const nodes = ref.current.querySelectorAll(
      '.cr-element-frame__toolbar button, .cr-element-frame__handle',
    );
    const cleanups = Array.from(nodes).map((node) =>
      registerOverlayPortal(node, { disableDrag: false, disableDragOnFocus: false }),
    );
    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [selected, canEditElement, id]);

  function runAction(action) {
    const { dispatch, getItemById, getSelectorForId } = getPuck();
    const item = getItemById(id);
    const selector = getSelectorForId(id);
    if (!item || !selector) return;

    if (action === 'delete') {
      dispatch({ type: 'remove', index: selector.index, zone: selector.zone, recordHistory: true });
      return;
    }
    if (action === 'duplicate') {
      dispatch({
        type: 'duplicate',
        sourceIndex: selector.index,
        sourceZone: selector.zone,
        recordHistory: true,
      });
      return;
    }
    if (action === 'lock') {
      const isLocked =
        item.props.locked === true || item.props.locked === 'yes' || item.props.locked === 'true';
      dispatch({
        type: 'replace',
        destinationIndex: selector.index,
        destinationZone: selector.zone,
        data: {
          type: item.type,
          props: { ...item.props, locked: isLocked ? 'no' : 'yes' },
        },
        recordHistory: true,
      });
      return;
    }
    if (action === 'forward' || action === 'backward') {
      const delta = action === 'forward' ? 1 : -1;
      const nextZ = Math.max(0, (Number(item.props.zIndex) || 1) + delta);
      dispatch({
        type: 'replace',
        destinationIndex: selector.index,
        destinationZone: selector.zone,
        data: { type: item.type, props: { ...item.props, zIndex: nextZ } },
        recordHistory: true,
      });
    }
  }

  return (
    <FrameShell
      id={id}
      type={type}
      className={className}
      styleProp={styleProp}
      frameProps={frameProps}
      geometry={geometry}
      isFree={isFree}
      isDragging={isDragging}
      canvas={canvas}
      overflowWarning={overflowWarning}
      isEditing
      selected={selected}
      frameRef={ref}
      toolbar={
        selected && canEditElement ? (
          <div className="cr-element-frame__toolbar">
            <button
              type="button"
              className="cr-element-frame__drag-handle"
              aria-label="Move element"
              title="Move"
            >
              Move
            </button>
            <button type="button" onClick={() => runAction('duplicate')} aria-label="Duplicate" title="Duplicate">
              Dup
            </button>
            <button
              type="button"
              onClick={() => runAction('lock')}
              aria-label={
                frameProps.locked === true ||
                frameProps.locked === 'yes' ||
                frameProps.locked === 'true'
                  ? 'Unlock'
                  : 'Lock'
              }
              title={
                frameProps.locked === true ||
                frameProps.locked === 'yes' ||
                frameProps.locked === 'true'
                  ? 'Unlock'
                  : 'Lock'
              }
            >
              {frameProps.locked === true ||
              frameProps.locked === 'yes' ||
              frameProps.locked === 'true'
                ? 'Unlock'
                : 'Lock'}
            </button>
            <button type="button" onClick={() => runAction('delete')} aria-label="Delete" title="Delete">
              Del
            </button>
          </div>
        ) : null
      }
      handles={
        selected &&
        canEditElement &&
        !(
          frameProps.locked === true ||
          frameProps.locked === 'yes' ||
          frameProps.locked === 'true'
        ) ? (
          <>
            <span className="cr-element-frame__handle cr-element-frame__handle--nw" data-cr-resize="nw" />
            <span className="cr-element-frame__handle cr-element-frame__handle--n" data-cr-resize="n" />
            <span className="cr-element-frame__handle cr-element-frame__handle--ne" data-cr-resize="ne" />
            <span className="cr-element-frame__handle cr-element-frame__handle--e" data-cr-resize="e" />
            <span className="cr-element-frame__handle cr-element-frame__handle--se" data-cr-resize="se" />
            <span className="cr-element-frame__handle cr-element-frame__handle--s" data-cr-resize="s" />
            <span className="cr-element-frame__handle cr-element-frame__handle--sw" data-cr-resize="sw" />
            <span className="cr-element-frame__handle cr-element-frame__handle--w" data-cr-resize="w" />
          </>
        ) : null
      }
    >
      {children}
    </FrameShell>
  );
}

function ElementFramePreview({
  id,
  type,
  children,
  className = '',
  style: styleProp,
  ...frameProps
}) {
  const { canvas, geometry, isFree } = useFrameLayout(frameProps);
  return (
    <FrameShell
      id={id}
      type={type}
      className={className}
      styleProp={styleProp}
      frameProps={frameProps}
      geometry={geometry}
      isFree={isFree}
      canvas={canvas}
      isEditing={false}
      selected={false}
      frameRef={null}
    >
      {children}
    </FrameShell>
  );
}

export function ElementFrame(props) {
  if (props.puck?.isEditing) {
    return <ElementFrameEditing {...props} />;
  }
  return <ElementFramePreview {...props} />;
}

/** Disable Puck slot reordering while a Canvas Section is in free-position mode. */
export function elementResolvePermissions(_data, { permissions, parent }) {
  if (parent?.type === 'CanvasSection' && parent.props?.layoutMode === 'free') {
    return { ...permissions, drag: false };
  }
  if (parent?.type === 'ElementContainer') {
    // Containers stay flow-based; allow Puck reorder inside them.
    return permissions;
  }
  return permissions;
}
