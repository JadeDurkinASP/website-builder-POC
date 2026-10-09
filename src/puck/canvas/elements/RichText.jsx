import { ElementFrame } from '../ElementFrame';
import { InlineEditableText } from '../InlineEditableText';

export function ElementRichText({
  id,
  text = 'Add your supporting copy here.',
  align = 'left',
  colour = '',
  fontSize = 16,
  puck,
  ...frameProps
}) {
  return (
    <ElementFrame id={id} type="ElementRichText" puck={puck} autoHeight {...frameProps}>
      <InlineEditableText
        id={id}
        value={text}
        propName="text"
        multiline
        as="div"
        puck={puck}
        className={`cr-element-richtext cr-align-${align === 'centre' ? 'centre' : align}`}
        style={{
          color: colour || 'inherit',
          fontSize: Number(fontSize) || 16,
          lineHeight: 1.55,
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
          minHeight: '1.2em',
        }}
      />
    </ElementFrame>
  );
}
