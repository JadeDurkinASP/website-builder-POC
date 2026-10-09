import { useMemo } from 'react';
import { Render } from '@puckeditor/core';
import { AssetProvider } from '../../assets/AssetResolver';
import { EVENT_TYPES } from '../../constants';
import { generateDemoHomepage } from '../../generation/generateDemoHomepage';
import { puckConfig } from '../../puck/config';

export function SetupLivePreview({
  event,
  branding,
  contentSetup,
  contentAvailability,
  sectionOverrides,
}) {
  const puckData = useMemo(
    () =>
      generateDemoHomepage({
        event,
        branding,
        contentSetup,
        contentAvailability,
        sectionOverrides,
      }),
    [event, branding, contentSetup, contentAvailability, sectionOverrides],
  );

  const typeLabel =
    EVENT_TYPES.find((item) => item.value === event.eventType)?.label || 'Event';

  return (
    <aside className="cr-setup-preview" aria-label="Live proposed website preview">
      <div className="cr-setup-preview__header">
        <h2 className="cr-setup-preview__title">Your starting layout</h2>
        <span className="cr-setup-preview__badge">Live preview</span>
      </div>

      <div className="cr-setup-preview__browser">
        <div className="cr-setup-preview__chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="cr-setup-preview__viewport">
          <div className="cr-setup-preview__scale">
            <AssetProvider assetMetas={contentSetup?.assets || []}>
              <Render config={puckConfig} data={puckData} />
            </AssetProvider>
          </div>
        </div>
      </div>

      <p className="cr-setup-preview__caption">
        {typeLabel} layout suggested. Each section is an editable canvas in the editor.
      </p>
    </aside>
  );
}
