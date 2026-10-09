import { useState } from 'react';
import { ASSET_STATUS_LABEL, formatBytes, toAssetRef } from '../../constants';
import { ResolvedImage } from '../../assets/ResolvedImage';
import { downloadProjectAsset } from '../../storage/projectStorage';

export function SourceContentPanel({ contentSetup, open, onClose }) {
  const [copyStatus, setCopyStatus] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const assets = contentSetup?.assets || [];
  const pastedText = contentSetup?.pastedText || '';

  async function copyPaste() {
    setError('');
    try {
      await navigator.clipboard.writeText(pastedText);
      setCopyStatus('Copied to clipboard.');
    } catch {
      setError('Could not copy that text in this browser.');
    }
  }

  async function downloadAsset(assetId) {
    setError('');
    try {
      await downloadProjectAsset(assetId);
    } catch (err) {
      setError(err.message || 'Could not download that attachment.');
    }
  }

  return (
    <aside className="cr-source-panel" aria-labelledby="source-content-heading">
      <div className="cr-source-panel__header">
        <h2 id="source-content-heading">Source content</h2>
        <button type="button" className="cr-btn cr-btn--ghost cr-btn--small" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="cr-field-hint">
        Attachments and pasted text are kept for you to use. They are not automatically extracted
        into page sections.
      </p>

      <section aria-labelledby="pasted-source-heading">
        <h3 id="pasted-source-heading">Pasted text</h3>
        {pastedText ? (
          <>
            <pre className="cr-source-panel__paste">{pastedText}</pre>
            <button type="button" className="cr-btn cr-btn--secondary cr-btn--small" onClick={copyPaste}>
              Copy text
            </button>
            {copyStatus ? <p className="cr-status cr-status--ok">{copyStatus}</p> : null}
          </>
        ) : (
          <p className="cr-field-hint">No pasted source text in this project.</p>
        )}
      </section>

      <section aria-labelledby="attachments-heading">
        <h3 id="attachments-heading">Attachments</h3>
        {assets.length === 0 ? (
          <p className="cr-field-hint">No files attached.</p>
        ) : (
          <ul className="cr-asset-list">
            {assets.map((asset) => (
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
                  onClick={() => downloadAsset(asset.id)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="cr-banner cr-banner--error" role="alert">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
