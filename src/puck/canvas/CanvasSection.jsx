import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createUsePuck, useGetPuck } from '@puckeditor/core';
import { ResolvedImage } from '../../assets/ResolvedImage';
import { CanvasDropGuard } from './CanvasDropGuard';
import { setCanvasDropPoint } from './canvasDropPoint';
import { ELEMENT_TYPES, MOBILE_BREAKPOINT } from './constants';
import { CanvasLayoutContext } from './context';

const usePuck = createUsePuck();

function isInsideCanvasSection(itemId, sectionId, getParentById) {
  if (!itemId || !sectionId) return false;
  let current = getParentById(itemId);
  while (current) {
    if (current.type === 'CanvasSection' && current.props?.id === sectionId) return true;
    current = getParentById(current.props?.id);
  }
  return false;
}

/** Geometry hit-test — works even when element frames have pointer-events: none. */
function findElementFrameAtPoint(surface, clientX, clientY) {
  if (!surface) return null;
  const frames = surface.querySelectorAll('[data-cr-element-id]');
  let best = null;
  let bestZ = -Infinity;
  for (const frame of frames) {
    const rect = frame.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      continue;
    }
    const z = Number(frame.style.zIndex) || 0;
    if (z >= bestZ) {
      best = frame;
      bestZ = z;
    }
  }
  return best;
}

function CanvasSectionEditing(props) {
  const viewportWidth = usePuck((s) => s.appState?.ui?.viewports?.current?.width);
  const getPuck = useGetPuck();
  const selectedItem = usePuck((s) => s.selectedItem);
  const isDragging = usePuck((s) => Boolean(s.appState?.ui?.isDragging));

  return (
    <>
      <CanvasDropGuard />
      <CanvasSectionView
        {...props}
        viewportWidth={viewportWidth}
        isEditing
        getPuck={getPuck}
        selectedItem={selectedItem}
        isDragging={isDragging}
      />
    </>
  );
}

function CanvasSectionPreview(props) {
  return <CanvasSectionView {...props} viewportWidth={null} isEditing={false} />;
}

function CanvasSectionView({
  id,
  elements: Elements,
  dropCatch: DropCatch,
  backgroundColour = '#f7f8fa',
  backgroundImage = '',
  padding = 32,
  contentWidth = 'constrained',
  minHeight = 320,
  layoutMode = 'free',
  flowArrangement = 'stack',
  flowGap = 16,
  flowAlign = 'stretch',
  flowColumns = 2,
  snapEnabled = true,
  snapGrid = 8,
  mobileLayout = 'stack',
  viewportWidth,
  isEditing,
  getPuck,
  selectedItem,
  isDragging,
}) {
  const surfaceRef = useRef(null);
  const [guides, setGuides] = useState([]);
  const [measuredWidth, setMeasuredWidth] = useState(viewportWidth || 1280);
  const [surfaceOpen, setSurfaceOpen] = useState(false);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setMeasuredWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (viewportWidth) setMeasuredWidth(viewportWidth);
  }, [viewportWidth]);

  // Keep drill-in in sync with Puck selection (outline / after drop).
  // Do NOT close on transient null selection — that cancelled in-progress moves
  // when Puck briefly cleared selectedItem during replace/setUi.
  useEffect(() => {
    if (!isEditing || !id || !getPuck) {
      setSurfaceOpen(false);
      return;
    }
    if (!selectedItem) return;
    // Section selected: stay in whatever mode the user chose (Done / Esc exits).
    if (selectedItem.props?.id === id) return;
    if (isInsideCanvasSection(selectedItem.props?.id, id, getPuck().getParentById)) {
      setSurfaceOpen(true);
    } else {
      setSurfaceOpen(false);
    }
  }, [selectedItem, id, isEditing, getPuck]);

  // Auto-enter element edit when something is dropped onto this canvas.
  useEffect(() => {
    if (!isEditing || !id || !getPuck || isDragging) return;
    if (surfaceOpen) return;
    const api = getPuck();
    const selected = api.selectedItem;
    if (selected && isInsideCanvasSection(selected.props?.id, id, api.getParentById)) {
      setSurfaceOpen(true);
    }
  }, [isDragging, isEditing, id, surfaceOpen, getPuck]);

  const selectSection = useCallback(() => {
    if (!getPuck) return;
    const api = getPuck();
    const selector = api.getSelectorForId(id);
    if (!selector) return;
    api.dispatch({
      type: 'setUi',
      ui: { itemSelector: selector },
      recordHistory: false,
    });
  }, [getPuck, id]);

  const selectElementById = useCallback(
    (elementId) => {
      if (!getPuck) return;
      const api = getPuck();
      const selector = api.getSelectorForId(elementId);
      if (!selector) return;
      api.dispatch({
        type: 'setUi',
        ui: { itemSelector: selector },
        recordHistory: false,
      });
    },
    [getPuck],
  );

  const enterSurface = useCallback(() => {
    setSurfaceOpen(true);
  }, []);

  const exitSurface = useCallback(() => {
    setSurfaceOpen(false);
    setGuides([]);
    selectSection();
  }, [selectSection]);

  const isMobileViewport = measuredWidth < MOBILE_BREAKPOINT;

  const getBounds = useCallback(() => {
    const el = surfaceRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: el.clientWidth,
      height: el.clientHeight,
      zoom: el.offsetWidth ? rect.width / el.offsetWidth : 1,
    };
  }, []);

  // Track pointer over this section so inserted elements land where you drop.
  useEffect(() => {
    if (!isEditing || !id) return undefined;
    const surface = surfaceRef.current;
    if (!surface) return undefined;
    const doc = surface.ownerDocument;

    const updatePoint = (clientX, clientY) => {
      const rect = surface.getBoundingClientRect();
      const zoom = surface.offsetWidth ? rect.width / surface.offsetWidth : 1;
      const x = (clientX - rect.left) / zoom;
      const y = (clientY - rect.top) / zoom;
      if (x < -8 || y < -8 || x > surface.clientWidth + 8 || y > surface.clientHeight + 8) {
        return;
      }
      setCanvasDropPoint(id, x, y);
    };

    const onPointerMove = (event) => updatePoint(event.clientX, event.clientY);

    doc.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      doc.removeEventListener('pointermove', onPointerMove);
    };
  }, [id, isEditing, measuredWidth]);

  // Escape leaves element edit and returns to the section.
  useEffect(() => {
    if (!isEditing || !surfaceOpen) return undefined;
    const surface = surfaceRef.current;
    const doc = surface?.ownerDocument || document;

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (event.target?.closest?.('[contenteditable="true"], input, textarea')) return;
      event.preventDefault();
      exitSurface();
    };

    doc.addEventListener('keydown', onKeyDown);
    return () => doc.removeEventListener('keydown', onKeyDown);
  }, [isEditing, surfaceOpen, exitSurface]);

  const onSurfaceDoubleClick = useCallback(
    (event) => {
      if (!isEditing) return;
      event.preventDefault();
      event.stopPropagation();
      const frame = findElementFrameAtPoint(surfaceRef.current, event.clientX, event.clientY);
      setSurfaceOpen(true);
      if (frame) {
        const elementId = frame.getAttribute('data-cr-element-id');
        if (elementId) selectElementById(elementId);
      } else {
        selectSection();
      }
    },
    [isEditing, selectElementById, selectSection],
  );

  // When section-edit is active, elements have pointer-events:none — a drag on
  // an element would move the Canvas Section. Enter element edit + select instead.
  useEffect(() => {
    if (!isEditing) return undefined;
    const surface = surfaceRef.current;
    if (!surface) return undefined;
    const onPointerDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      if (surfaceOpen) return;
      const frame = findElementFrameAtPoint(surface, event.clientX, event.clientY);
      if (!frame) return;
      const elementId = frame.getAttribute('data-cr-element-id');
      if (!elementId) return;
      event.preventDefault();
      event.stopPropagation();
      setSurfaceOpen(true);
      selectElementById(elementId);
    };
    surface.addEventListener('pointerdown', onPointerDown, true);
    return () => surface.removeEventListener('pointerdown', onPointerDown, true);
  }, [isEditing, surfaceOpen, selectElementById]);

  const layoutValue = useMemo(
    () => ({
      layoutMode,
      flowArrangement,
      flowGap,
      flowAlign,
      flowColumns,
      contentWidth,
      snapGrid: Number(snapGrid) || 8,
      snapEnabled:
        snapEnabled === true || snapEnabled === 'true' || snapEnabled === 'yes',
      isMobileViewport,
      mobileLayout,
      sectionId: id,
      surfaceOpen: isEditing ? surfaceOpen : false,
      enterSurface,
      exitSurface,
      setGuides,
      getBounds,
    }),
    [
      layoutMode,
      flowArrangement,
      flowGap,
      flowAlign,
      flowColumns,
      contentWidth,
      snapGrid,
      snapEnabled,
      isMobileViewport,
      mobileLayout,
      id,
      isEditing,
      surfaceOpen,
      enterSurface,
      exitSurface,
      getBounds,
    ],
  );

  const isFreeDesktop = layoutMode === 'free' && !isMobileViewport;
  const isFreeMobile = layoutMode === 'free' && isMobileViewport && mobileLayout === 'free';
  const useFree = isFreeDesktop || isFreeMobile;
  const sectionItem = getPuck?.()?.getItemById?.(id);
  const sectionIsEmpty = !Array.isArray(sectionItem?.props?.elements) || sectionItem.props.elements.length === 0;
  const pad = Number(padding) || 0;

  const slotMinHeight = Number(minHeight) || 320;
  const slotCssVars = {
    '--cr-canvas-slot-min-height': `${slotMinHeight}px`,
  };

  const flowStyle = useFree
    ? {
        ...slotCssVars,
        position: 'relative',
        minHeight: slotMinHeight,
        width: '100%',
        height: '100%',
      }
    : {
        ...slotCssVars,
        display: flowArrangement === 'grid' ? 'grid' : 'flex',
        flexDirection: flowArrangement === 'row' && !isMobileViewport ? 'row' : 'column',
        flexWrap: flowArrangement === 'row' ? 'wrap' : undefined,
        gridTemplateColumns:
          flowArrangement === 'grid' && !isMobileViewport
            ? `repeat(${Number(flowColumns) || 2}, minmax(0, 1fr))`
            : undefined,
        gap: Number(flowGap) || 16,
        alignItems:
          flowAlign === 'centre' || flowAlign === 'center'
            ? 'center'
            : flowAlign === 'end'
              ? 'flex-end'
              : flowAlign === 'stretch'
                ? 'stretch'
                : 'flex-start',
        minHeight: slotMinHeight,
        width: '100%',
      };

  return (
    <section
      className={[
        'cr-section',
        'cr-canvas-section',
        `cr-canvas-section--${layoutMode}`,
        contentWidth === 'full' ? 'cr-canvas-section--full' : 'cr-canvas-section--constrained',
        isEditing ? 'cr-canvas-section--editing' : '',
        isEditing && surfaceOpen ? 'cr-canvas-section--surface-open' : '',
        isEditing && !surfaceOpen ? 'cr-canvas-section--surface-closed' : '',
        isEditing && isDragging ? 'cr-canvas-section--puck-dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: backgroundColour || '#f7f8fa',
        minHeight: slotMinHeight,
        ...slotCssVars,
      }}
      data-cr-canvas={id}
      data-cr-canvas-drop="true"
      data-cr-canvas-surface={surfaceOpen ? 'open' : 'closed'}
      data-cr-puck-dragging={isDragging ? 'true' : undefined}
    >
      {backgroundImage ? (
        <div className="cr-canvas-section__bg" aria-hidden>
          <ResolvedImage src={backgroundImage} alt="" />
        </div>
      ) : null}

      <div
        className={
          contentWidth === 'full'
            ? 'cr-canvas-section__inner'
            : 'cr-container cr-canvas-section__inner'
        }
        style={{ padding: pad }}
      >
        <CanvasLayoutContext.Provider value={layoutValue}>
          {isEditing ? (
            <div
              className={[
                'cr-canvas-section__level-bar',
                surfaceOpen
                  ? 'cr-canvas-section__level-bar--elements'
                  : 'cr-canvas-section__level-bar--section',
              ].join(' ')}
              role="status"
            >
              <div className="cr-canvas-section__level-bar-main">
                <span className="cr-canvas-section__breadcrumb">
                  {surfaceOpen ? 'Section / Elements' : 'Section'}
                </span>
              </div>
              {surfaceOpen ? (
                <button
                  type="button"
                  className="cr-btn cr-btn--ghost cr-btn--small"
                  onClick={exitSurface}
                >
                  Select section
                </button>
              ) : (
                <button
                  type="button"
                  className="cr-btn cr-btn--ghost cr-btn--small"
                  onClick={() => {
                    enterSurface();
                    selectSection();
                  }}
                >
                  Edit elements
                </button>
              )}
            </div>
          ) : null}

          <div
            className="cr-canvas-section__surface"
            ref={surfaceRef}
            onDoubleClick={onSurfaceDoubleClick}
          >
            {isEditing && (sectionIsEmpty || isDragging) ? (
              <div
                className={[
                  'cr-canvas-section__drop-pad',
                  useFree ? 'cr-canvas-section__drop-pad--free' : 'cr-canvas-section__drop-pad--flow',
                  surfaceOpen ? 'cr-canvas-section__drop-pad--open' : '',
                  sectionIsEmpty ? 'cr-canvas-section__drop-pad--empty' : 'cr-canvas-section__drop-pad--drag',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden
              >
                {sectionIsEmpty ? (
                  <span className="cr-canvas-section__drop-pad-label">
                    {surfaceOpen
                      ? 'Drop or add elements here'
                      : 'Double-click to edit elements, or drag a section child in'}
                  </span>
                ) : null}
              </div>
            ) : null}

            {isEditing && useFree && guides.length > 0 ? (
              <div className="cr-canvas-section__guides" aria-hidden>
                {guides.map((guide, index) => (
                  <span
                    key={`${guide.axis}-${guide.offset}-${index}`}
                    className={`cr-canvas-section__guide cr-canvas-section__guide--${guide.axis}`}
                    style={
                      guide.axis === 'x' ? { left: guide.offset } : { top: guide.offset }
                    }
                  />
                ))}
              </div>
            ) : null}

            <Elements
              className={[
                'cr-canvas-section__slot',
                useFree ? 'cr-canvas-section__slot--free' : 'cr-canvas-section__slot--flow',
              ].join(' ')}
              style={flowStyle}
              minEmptyHeight={slotMinHeight}
              allow={[...ELEMENT_TYPES]}
              collisionAxis={useFree ? 'dynamic' : flowArrangement === 'row' ? 'x' : 'y'}
            />

            {isEditing && useFree && typeof DropCatch === 'function' ? (
              <DropCatch
                className="cr-canvas-section__drop-catch"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: isDragging ? 80 : 0,
                  width: '100%',
                  height: '100%',
                  minHeight: slotMinHeight,
                }}
                minEmptyHeight={slotMinHeight}
                allow={[...ELEMENT_TYPES]}
                collisionAxis="dynamic"
              />
            ) : null}

            {isEditing && layoutMode === 'free' && isMobileViewport && mobileLayout === 'stack' ? (
              <p className="cr-canvas-section__note" role="status">
                Mobile preview stacks elements in reading order. Choose “Free position” under mobile
                layout to override.
              </p>
            ) : null}
          </div>
        </CanvasLayoutContext.Provider>
      </div>
    </section>
  );
}

export function CanvasSection(props) {
  if (props.puck?.isEditing) {
    return <CanvasSectionEditing {...props} />;
  }
  return <CanvasSectionPreview {...props} />;
}
