import { useEffect, useLayoutEffect, useRef } from 'react';
import { registerOverlayPortal, useGetPuck } from '@puckeditor/core';

function asPlainText(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return '';
}

function commitProp(getPuck, id, propName, nextValue, recordHistory) {
  const { dispatch, getItemById, getSelectorForId } = getPuck();
  const item = getItemById(id);
  const selector = getSelectorForId(id);
  if (!item || !selector) return;
  if (item.props?.[propName] === nextValue) return;
  dispatch({
    type: 'replace',
    destinationIndex: selector.index,
    destinationZone: selector.zone,
    data: {
      type: item.type,
      props: { ...item.props, [propName]: nextValue },
    },
    recordHistory,
  });
}

/**
 * Stable on-canvas text editing.
 * Preview path avoids useGetPuck so setup Render / public preview work outside the editor.
 */
export function InlineEditableText(props) {
  if (!props.puck?.isEditing) {
    const Comp = props.as || 'span';
    return (
      <Comp className={props.className || ''} style={props.style}>
        {asPlainText(props.value)}
      </Comp>
    );
  }
  return <InlineEditableTextEditing {...props} />;
}

function InlineEditableTextEditing({
  id,
  value,
  propName = 'text',
  multiline = false,
  className = '',
  style,
  as: Comp = 'span',
}) {
  const ref = useRef(null);
  const focusedRef = useRef(false);
  const getPuck = useGetPuck();
  const plain = asPlainText(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || focusedRef.current) return;
    if (el.innerText !== plain) el.textContent = plain;
  }, [plain]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return registerOverlayPortal(el, { disableDrag: false, disableDragOnFocus: false });
  }, [id]);

  return (
    <Comp
      ref={ref}
      className={`cr-inline-edit ${className}`.trim()}
      style={style}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      data-cr-inline-edit=""
      data-cr-no-drag=""
      data-cr-inline-text-host=""
      spellCheck={false}
      onPointerDown={() => {
        const api = getPuck();
        if (api.selectedItem?.props?.id === id) return;
        const selector = api.getSelectorForId(id);
        if (!selector) return;
        api.dispatch({
          type: 'setUi',
          ui: { itemSelector: selector },
          recordHistory: false,
        });
      }}
      onFocus={() => {
        focusedRef.current = true;
        const api = getPuck();
        if (api.selectedItem?.props?.id === id) return;
        const selector = api.getSelectorForId(id);
        if (!selector) return;
        api.dispatch({
          type: 'setUi',
          ui: { itemSelector: selector },
          recordHistory: false,
        });
      }}
      onBlur={() => {
        const next = ref.current?.innerText ?? '';
        focusedRef.current = false;
        commitProp(getPuck, id, propName, next, true);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
        }
      }}
      onKeyUp={(event) => {
        event.stopPropagation();
      }}
    />
  );
}
