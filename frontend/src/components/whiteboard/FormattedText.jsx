import { parseFormattedContent } from "../../redux/actions/textFormatting";

// Renders the crude inline "<b>/<i>/<bi>/<ib>" markup as styled spans.
// Handles nested formatting by recursively rendering parts.
const FormattedText = ({ content }) => {
  const renderParts = (
    parts,
    inheritedBold = false,
    inheritedItalic = false,
  ) => {
    return parts.map((part, idx) => {
      if (part.type === "text") {
        return part.text;
      }

      const isBold = part.format.includes("b") || inheritedBold;
      const isItalic = part.format.includes("i") || inheritedItalic;

      // Recursively render nested parts
      const innerContent = part.parts
        ? renderParts(part.parts, isBold, isItalic)
        : part.text;

      return (
        <span
          key={idx}
          style={{
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
          }}
        >
          {innerContent}
        </span>
      );
    });
  };

  const parts = parseFormattedContent(content);
  return renderParts(parts);
};

export default FormattedText;
