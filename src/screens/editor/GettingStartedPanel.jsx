import { useGetPuck } from '@puckeditor/core';

function findFirstByType(content, type) {
  for (const item of content || []) {
    if (item?.type === type) return item;
    const nested = item?.props?.elements;
    if (Array.isArray(nested)) {
      const hit = findFirstByType(nested, type);
      if (hit) return hit;
    }
  }
  return null;
}

function findHeroTarget(content) {
  const classic = findFirstByType(content, 'Hero');
  if (classic) return classic;
  const sections = (content || []).filter((item) => item?.type === 'CanvasSection');
  const named = sections.find((item) =>
    /hero/i.test(item.props?.displayName || ''),
  );
  if (named) {
    const heading = findFirstByType(named.props?.elements, 'ElementHeading');
    return heading || named;
  }
  return findFirstByType(content, 'ElementHeading');
}

function findImageTarget(content) {
  const elementImage = findFirstByType(content, 'ElementImage');
  if (elementImage) return elementImage;
  const hero = findFirstByType(content, 'Hero');
  if (hero) return hero;
  return null;
}

function selectItem(api, item) {
  if (!item?.props?.id) return false;
  const selector = api.getSelectorForId(item.props.id);
  if (!selector) return false;
  api.dispatch({
    type: 'setUi',
    ui: {
      itemSelector: { zone: selector.zone, index: selector.index },
      leftSideBarVisible: true,
    },
  });
  return true;
}

export function GettingStartedPanel({ onDismiss, onStatus }) {
  const getPuck = useGetPuck();

  function editHero() {
    const api = getPuck();
    const content = api.appState?.data?.content || [];
    const target = findHeroTarget(content);
    if (!target || !selectItem(api, target)) {
      onStatus?.('No hero content found on this page yet. Add a Hero section from Sections.');
      return;
    }
    onStatus?.('');
  }

  function editImage() {
    const api = getPuck();
    const content = api.appState?.data?.content || [];
    const target = findImageTarget(content);
    if (!target || !selectItem(api, target)) {
      onStatus?.(
        'No image element found yet. Select a Canvas Section, then add an Image from Elements.',
      );
      return;
    }
    onStatus?.('');
  }

  function checkMobile() {
    const api = getPuck();
    api.dispatch({
      type: 'setUi',
      ui: {
        viewports: {
          current: { width: 390, height: 'auto' },
          controlsVisible: true,
        },
      },
    });
    onStatus?.('Switched to the mobile viewport. Adjust free-position elements as needed.');
  }

  return (
    <aside className="cr-getting-started" aria-label="Getting started">
      <div className="cr-getting-started__header">
        <p className="cr-getting-started__title">Getting started</p>
        <button
          type="button"
          className="cr-getting-started__dismiss"
          aria-label="Dismiss getting started"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
      <p className="cr-getting-started__lede">
        A few first edits for this demo homepage. The artboard stays available behind this panel.
      </p>
      <ul className="cr-getting-started__actions">
        <li>
          <button type="button" className="cr-btn cr-btn--secondary cr-btn--small" onClick={editHero}>
            Edit your hero content
          </button>
        </li>
        <li>
          <button type="button" className="cr-btn cr-btn--secondary cr-btn--small" onClick={editImage}>
            Add or replace an image
          </button>
        </li>
        <li>
          <button type="button" className="cr-btn cr-btn--secondary cr-btn--small" onClick={checkMobile}>
            Check your mobile layout
          </button>
        </li>
      </ul>
      <p className="cr-field-hint">
        Tip: free-position elements sit on Canvas Sections; containers use flow layout.
      </p>
    </aside>
  );
}
