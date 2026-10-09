import { useEffect, useId, useRef, useState } from 'react';

/**
 * Accessible application dialog (native <dialog>).
 * Supports Escape, focus restore, and labelled title.
 */
export function AppDialog({
  open,
  title,
  children,
  onClose,
  initialFocusRef,
  className = '',
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const previouslyFocused = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open) {
      previouslyFocused.current = document.activeElement;
      if (!dialog.open) dialog.showModal();
      const focusTarget =
        initialFocusRef?.current ||
        dialog.querySelector(
          'input:not([type="hidden"]), select, textarea, button:not([disabled])',
        );
      window.setTimeout(() => focusTarget?.focus?.(), 0);
    } else if (dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open, initialFocusRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    function onDialogClose() {
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === 'function') {
        window.setTimeout(() => prev.focus(), 0);
      }
    }

    dialog.addEventListener('close', onDialogClose);
    return () => dialog.removeEventListener('close', onDialogClose);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`cr-app-dialog ${className}`.trim()}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
    >
      <div className="cr-app-dialog__panel">
        <header className="cr-app-dialog__header">
          <h2 id={titleId} className="cr-app-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="cr-app-dialog__close"
            aria-label="Close dialog"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </header>
        <div className="cr-app-dialog__body">{children}</div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  return (
    <AppDialog open={open} title={title} onClose={onCancel} initialFocusRef={confirmRef}>
      {typeof message === 'string' ? <p className="cr-app-dialog__message">{message}</p> : message}
      <div className="cr-app-dialog__actions">
        <button type="button" className="cr-btn cr-btn--secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          ref={confirmRef}
          type="button"
          className={`cr-btn ${danger ? 'cr-btn--danger' : 'cr-btn--brand'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </AppDialog>
  );
}

export function PromptDialog({
  open,
  title,
  label,
  defaultValue = '',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  validate,
  onConfirm,
  onCancel,
}) {
  const inputRef = useRef(null);
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError('');
    }
  }, [open, defaultValue]);

  function submit(event) {
    event?.preventDefault?.();
    const trimmed = value.trim();
    const message = validate?.(trimmed);
    if (message) {
      setError(message);
      inputRef.current?.focus();
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <AppDialog open={open} title={title} onClose={onCancel} initialFocusRef={inputRef}>
      <form className="cr-app-dialog__form" onSubmit={submit}>
        <label className="cr-field">
          <span>{label}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
          />
        </label>
        {error ? (
          <p className="cr-app-dialog__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="cr-app-dialog__actions">
          <button type="button" className="cr-btn cr-btn--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="submit" className="cr-btn cr-btn--brand">
            {confirmLabel}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
