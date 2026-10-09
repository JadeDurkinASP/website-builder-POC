/** Stable JSON snapshot for dirty detection. */
export function snapshotKey(project) {
  try {
    return JSON.stringify(project);
  } catch {
    return '';
  }
}

export function brandingRootProps(branding = {}) {
  return {
    primaryColour: branding.primaryColour || '#2a3c4c',
    secondaryColour: branding.secondaryColour || '#00a986',
    backgroundColour: branding.backgroundColour || '#ffffff',
    font: branding.font || 'DM Sans',
    designDirection: branding.designDirection || 'bold',
  };
}

/** Apply website branding to every page root without changing content. */
export function applyWebsiteBrandingToProject(project, brandingPatch) {
  const branding = {
    ...(project.branding || {}),
    ...brandingPatch,
  };
  const rootProps = brandingRootProps(branding);

  const pages = (project.pages || []).map((page) => {
    const data = page.puckData;
    if (!data?.root) return page;
    return {
      ...page,
      puckData: {
        ...data,
        root: {
          ...data.root,
          props: {
            ...(data.root.props || {}),
            ...rootProps,
          },
        },
      },
    };
  });

  const home = pages.find((page) => page.role === 'home') || pages[0];
  let puckData = project.puckData;
  if (home?.puckData) {
    puckData = home.puckData;
  } else if (puckData?.root) {
    puckData = {
      ...puckData,
      root: {
        ...puckData.root,
        props: {
          ...(puckData.root.props || {}),
          ...rootProps,
        },
      },
    };
  }

  return {
    ...project,
    branding,
    pages,
    puckData,
  };
}
