import { createContext, useContext } from 'react';

const defaultCanvasLayout = {
  layoutMode: 'flow',
  flowArrangement: 'stack',
  flowGap: 16,
  flowAlign: 'stretch',
  flowColumns: 2,
  contentWidth: 'constrained',
  snapGrid: 8,
  snapEnabled: true,
  isMobileViewport: false,
  mobileLayout: 'stack',
  sectionId: null,
  /** false = section-level edit; true = editing elements inside the canvas */
  surfaceOpen: false,
  enterSurface: () => {},
  exitSurface: () => {},
  setGuides: () => {},
  getBounds: () => null,
};

export const CanvasLayoutContext = createContext(defaultCanvasLayout);

export function useCanvasLayout() {
  return useContext(CanvasLayoutContext);
}
