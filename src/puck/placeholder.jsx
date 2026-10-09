export function isPlaceholderFlag(value) {
  return value === true || value === 'yes';
}

export function needsContent(props = {}) {
  if (props.contentState === 'needs_content') return true;
  if (props.contentState === 'ready') return false;

  const collections = [props.items, props.cards, props.logos].filter(Array.isArray);
  if (collections.some((list) => list.some((item) => isPlaceholderFlag(item.isPlaceholder)))) {
    return true;
  }

  return false;
}

export function ContentNeededBadge({ show }) {
  if (!show) return null;
  return (
    <p className="cr-content-needed" role="status">
      Content needed
    </p>
  );
}
