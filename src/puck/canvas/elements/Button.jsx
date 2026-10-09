import { useGetPuck } from '@puckeditor/core';
import { PageAnchor } from '../../../pages/PageLinkContext';
import { buttonStyleClass } from '../../buttonStyles';
import { useCanvasLayout } from '../context';
import { ElementFrame } from '../ElementFrame';
import { InlineEditableText } from '../InlineEditableText';

function resolveButtonColours({ backgroundColour, textColour, buttonStyle }) {
  if (backgroundColour) {
    return {
      background: backgroundColour,
      color: textColour || '#ffffff',
    };
  }
  if (buttonStyle === 'secondary') {
    return {
      background: 'var(--brand-secondary)',
      color: textColour || '#04352c',
    };
  }
  return {
    background: 'var(--brand-primary)',
    color: textColour || '#ffffff',
  };
}

function selectElementNow(getPuck, id, enterSurface) {
  enterSurface?.();
  const api = getPuck();
  if (api.selectedItem?.props?.id === id) return;
  const selector = api.getSelectorForId(id);
  if (!selector) return;
  api.dispatch({
    type: 'setUi',
    ui: { itemSelector: selector },
    recordHistory: false,
  });
}

export function ElementButton(props) {
  if (!props.puck?.isEditing) {
    return <ElementButtonPreview {...props} />;
  }
  return <ElementButtonEditing {...props} />;
}

function ElementButtonPreview({
  id,
  label = 'Button',
  url = '#',
  buttonStyle = 'primary',
  backgroundColour = '',
  textColour = '',
  puck,
  ...frameProps
}) {
  const className = `${buttonStyleClass(buttonStyle)} cr-element-button__link`;
  const colours = resolveButtonColours({ backgroundColour, textColour, buttonStyle });

  return (
    <ElementFrame id={id} type="ElementButton" puck={puck} autoHeight={false} {...frameProps}>
      <div className="cr-element-button">
        <PageAnchor className={className} href={url || '#'} style={colours}>
          <InlineEditableText
            id={id}
            value={label}
            propName="label"
            as="span"
            puck={puck}
            className="cr-element-button__label"
          />
        </PageAnchor>
      </div>
    </ElementFrame>
  );
}

function ElementButtonEditing({
  id,
  label = 'Button',
  url = '#',
  buttonStyle = 'primary',
  backgroundColour = '',
  textColour = '',
  puck,
  ...frameProps
}) {
  const getPuck = useGetPuck();
  const canvas = useCanvasLayout();
  const className = `${buttonStyleClass(buttonStyle)} cr-element-button__link`;
  const colours = resolveButtonColours({ backgroundColour, textColour, buttonStyle });

  return (
    <ElementFrame id={id} type="ElementButton" puck={puck} autoHeight={false} {...frameProps}>
      <div
        className="cr-element-button"
        data-cr-inline-text-host
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          selectElementNow(getPuck, id, canvas.enterSurface);
        }}
      >
        <span className={className} role="button" style={colours}>
          <InlineEditableText
            id={id}
            value={label}
            propName="label"
            as="span"
            puck={puck}
            className="cr-element-button__label"
          />
        </span>
      </div>
    </ElementFrame>
  );
}
