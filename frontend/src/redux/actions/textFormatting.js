// Small pure-string helpers for the crude inline "<b>/<i>/<bi>/<ib>" markup
// used by CanvasElement's text editor. Deliberately dependency-free (no
// DOM/React) so the formatting logic can be reasoned about (and tested) on
// its own, separate from the textarea/selection plumbing.

const TAG_NAMES = ["b", "i", "bi", "ib"];

function tagToFormat(tag) {
  return { bold: tag.includes("b"), italic: tag.includes("i") };
}

function formatToTag({ bold, italic }) {
  if (bold && italic) return "bi";
  if (bold) return "b";
  if (italic) return "i";
  return null;
}

// If [start, end) in `value` is exactly wrapped by one of our known tags
// (e.g. the selection is precisely the inner text of a <b>...</b>), return
// that tag plus the surrounding text with the wrapper stripped off.
// Otherwise `tag` is null and before/after are returned unchanged.
function findWrappingTag(value, start, end) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  for (const tag of TAG_NAMES) {
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    if (before.endsWith(openTag) && after.startsWith(closeTag)) {
      return {
        tag,
        before: before.slice(0, -openTag.length),
        after: after.slice(closeTag.length),
      };
    }
  }
  return { tag: null, before, after };
}

// { bold, italic } describing the format currently applied to the exact
// selection, or all-false if there's no selection or it isn't a single
// formatted span.
export function getSelectionFormat(value, start, end) {
  if (start === end) return { bold: false, italic: false };
  const { tag } = findWrappingTag(value, start, end);
  return tag ? tagToFormat(tag) : { bold: false, italic: false };
}

// Toggles `bold` or `italic` on the current selection, combining with
// whatever format is already applied there rather than nesting a second
// tag around it — nesting is what made bold+italic together render as
// literal "<b>...</b>" text (the parser below doesn't recurse). Returns
// { content, selectionStart, selectionEnd }, or null if there's no
// selection to act on.
export function toggleSelectionFormat(value, start, end, kind) {
  if (start === end) return null;
  const selectedText = value.slice(start, end);
  const { tag, before, after } = findWrappingTag(value, start, end);
  const current = tag ? tagToFormat(tag) : { bold: false, italic: false };
  const nextTag = formatToTag({ ...current, [kind]: !current[kind] });

  const openTag = nextTag ? `<${nextTag}>` : "";
  const closeTag = nextTag ? `</${nextTag}>` : "";
  const content = before + openTag + selectedText + closeTag + after;
  const selectionStart = before.length + openTag.length;

  return {
    content,
    selectionStart,
    selectionEnd: selectionStart + selectedText.length,
  };
}

// Clears all formatting from the current selection. Returns
// { content, selectionStart, selectionEnd }, or null if there's no
// selection.
export function clearSelectionFormat(value, start, end) {
  if (start === end) return null;
  const selectedText = value.slice(start, end);
  const { tag, before, after } = findWrappingTag(value, start, end);
  // Exact wrapper match: the inner text is already clean. Otherwise (a
  // selection spanning part of/around tags) fall back to stripping any
  // stray tags found inside it.
  const cleaned = tag
    ? selectedText
    : selectedText.replace(/<\/?(?:b|i|bi|ib)>/g, "");
  return {
    content: before + cleaned + after,
    selectionStart: before.length,
    selectionEnd: before.length + cleaned.length,
  };
}

// Splits formatted content into plain-text and tagged segments for
// rendering (see FormattedText.jsx). Handles nested tags by recursively
// parsing inner content.
export function parseFormattedContent(content) {
  if (!content) return [];
  const parts = [];
  let lastIndex = 0;
  const regex = /<(b|i|bi|ib)>(.*?)<\/\1>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add any plain text before this tag
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: content.slice(lastIndex, match.index) });
    }

    // Recursively parse the inner content to handle nested tags
    const innerContent = match[2];
    const innerParts = parseFormattedContent(innerContent);

    // Add formatted part with the parsed inner content
    parts.push({
      type: "formatted",
      format: match[1],
      parts: innerParts,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining plain text
  if (lastIndex < content.length) {
    parts.push({ type: "text", text: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", text: content }];
}
