import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  ASSET_STATUS_LABEL,
  formatBytes,
  toAssetRef,
} from '../../constants';
import { ResolvedImage } from '../../assets/ResolvedImage';
import { addFileAsAsset, deleteAsset } from '../../storage/assetStore';

export function ContentSetupPanel({
  contentSetup,
  onChange,
  uploadError,
  setUploadError,
}) {
  async function handleFiles(fileList) {
    setUploadError('');
    const files = [...(fileList || [])];
    let assets = [...(contentSetup.assets || [])];

    for (const file of files) {
      const result = await addFileAsAsset(file, assets);
      if (!result.ok) {
        setUploadError(result.error);
        break;
      }
      assets = [...assets, result.meta];
    }

    onChange({ ...contentSetup, assets });
  }

  async function removeAsset(assetId) {
    setUploadError('');
    try {
      await deleteAsset(assetId);
    } catch {
      // Still remove metadata if IndexedDB entry is already gone.
    }
    onChange({
      ...contentSetup,
      assets: (contentSetup.assets || []).filter((asset) => asset.id !== assetId),
    });
  }

  return (
    <section className="cr-panel" aria-labelledby="content-setup-heading">
      <h2 id="content-setup-heading">Do you already have content for your website?</h2>
      <div className="cr-choice-grid" role="radiogroup" aria-labelledby="content-setup-heading">
        {[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ].map((option) => (
          <label key={option.value} className="cr-choice">
            <input
              type="radio"
              name="has-existing-content"
              value={option.value}
              checked={contentSetup.hasExistingContent === option.value}
              onChange={() =>
                onChange({
                  ...contentSetup,
                  hasExistingContent: option.value,
                })
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      {contentSetup.hasExistingContent === 'yes' ? (
        <div className="cr-content-yes">
          <p className="cr-field-hint">
            These files are available for reference while editing. This demo does not read them
            automatically, and uploading a document does not populate sections for you.
          </p>

          <div className="cr-field cr-field--full">
            <label htmlFor="content-files">Upload files</label>
            <input
              id="content-files"
              type="file"
              multiple
              accept={ACCEPTED_UPLOAD_EXTENSIONS}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <p className="cr-field-hint">
              PDF, Word (.docx), PNG, JPG, WebP or plain text. Images under 500 KB; documents under
              5 MB; 20 MB total per project.
            </p>
          </div>

          <div className="cr-field cr-field--full">
            <label htmlFor="pasted-content">Paste your content</label>
            <textarea
              id="pasted-content"
              rows={6}
              value={contentSetup.pastedText || ''}
              onChange={(e) => onChange({ ...contentSetup, pastedText: e.target.value })}
              placeholder="Paste notes, speaker lists or other source text. It will be kept as source content for the editor."
            />
          </div>

          {(contentSetup.assets || []).length > 0 ? (
            <ul className="cr-asset-list">
              {(contentSetup.assets || []).map((asset) => (
                <li key={asset.id} className="cr-asset-list__item">
                  <div className="cr-asset-list__main">
                    {asset.kind === 'image' ? (
                      <div className="cr-asset-list__thumb">
                        <ResolvedImage src={toAssetRef(asset.id)} alt="" />
                      </div>
                    ) : (
                      <div className="cr-asset-list__icon" aria-hidden="true">
                        Doc
                      </div>
                    )}
                    <div>
                      <strong>{asset.name}</strong>
                      <p>
                        {asset.kind === 'image' ? 'Image' : 'Document'} · {formatBytes(asset.size)}
                      </p>
                      <p className="cr-asset-status">{ASSET_STATUS_LABEL}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cr-btn cr-btn--secondary cr-btn--small"
                    onClick={() => removeAsset(asset.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {uploadError ? (
            <p className="cr-banner cr-banner--error" role="alert">
              {uploadError}
            </p>
          ) : null}

          <label className="cr-check" style={{ marginTop: '1rem' }}>
            <input
              type="checkbox"
              checked={Boolean(contentSetup.suggestMissingAreas)}
              onChange={(e) =>
                onChange({ ...contentSetup, suggestMissingAreas: e.target.checked })
              }
            />
            <span>Suggest any missing content areas for my event</span>
          </label>
          <p className="cr-field-hint">
            Suggestions use your event type and details. The app cannot tell what is already covered
            inside uploaded documents — you choose that under Your suggested homepage.
          </p>
        </div>
      ) : null}

      {contentSetup.hasExistingContent === 'no' ? (
        <div className="cr-content-no">
          <h3 id="want-suggestions-heading">
            Would you like us to suggest content areas for your event?
          </h3>
          <div
            className="cr-choice-grid"
            role="radiogroup"
            aria-labelledby="want-suggestions-heading"
          >
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ].map((option) => (
              <label key={option.value} className="cr-choice">
                <input
                  type="radio"
                  name="want-suggestions"
                  value={option.value}
                  checked={contentSetup.wantSuggestions === option.value}
                  onChange={() =>
                    onChange({
                      ...contentSetup,
                      wantSuggestions: option.value,
                    })
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <p className="cr-field-hint">
            Yes creates editable placeholder sections from predefined event profiles. No creates a
            minimal page from the details you supplied.
          </p>
        </div>
      ) : null}
    </section>
  );
}
