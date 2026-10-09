import { ElementFrame } from '../ElementFrame';
import { InlineEditableText } from '../InlineEditableText';

export function ElementHeading({
  id,
  text = 'Heading',
  level = 'h2',
  align = 'left',
  colour = '',
  fontSize = 32,
  puck,
  ...frameProps
}) {
  const Tag = ['h1', 'h2', 'h3', 'h4'].includes(level) ? level : 'h2';

  return (
    <ElementFrame id={id} type="ElementHeading" puck={puck} autoHeight {...frameProps}>
      <InlineEditableText
        id={id}
        value={text}
        propName="text"
        as={Tag}
        puck={puck}
        className={`cr-element-heading cr-align-${align === 'centre' ? 'centre' : align}`}
        style={{
          color: colour || 'inherit',
          fontSize: Number(fontSize) || 32,
          margin: 0,
          lineHeight: 1.2,
          overflowWrap: 'anywhere',
        }}
      />
    </ElementFrame>
  );
}
