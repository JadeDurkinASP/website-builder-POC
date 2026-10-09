/**
 * Back-compat seed helper — blank/starter canvas sections now live in
 * generation/sectionTemplates.js.
 */
import { buildBlankCanvasTemplate } from '../../generation/sectionTemplates';

export function createSeedCanvasSection({
  suffix = 'demo',
  heading = 'Free-layout canvas',
  body = 'Drag Elements into this green area. Select an item, then drag to move or pull the green handles to stretch.',
} = {}) {
  const section = buildBlankCanvasTemplate({ suffix, title: heading });
  const text = section.props.elements?.find((el) => el.type === 'ElementRichText');
  if (text) text.props.text = body;
  const headingEl = section.props.elements?.find((el) => el.type === 'ElementHeading');
  if (headingEl) headingEl.props.text = heading;
  return section;
}
