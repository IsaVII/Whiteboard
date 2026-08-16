// Fill/border rendering for a shape element's background. Pulled out of
// CanvasElement mainly because the more complex shapes' polygon/path data
// is a big, self-contained chunk of markup that doesn't need to sit inline.
//
// Rectangle and circle are simple enough to stay as plain divs (border +
// border-radius). Everything else is an outline shape, so it's rendered as
// an SVG on a 0-100 viewBox with preserveAspectRatio="none" - that makes
// the polygon/path scale to fill whatever width/height the element has,
// the same trick the star used before this was generalized.
const OUTLINE_SHAPES = {
  triangle: { points: "50,3 97,97 3,97" },
  diamond: { points: "50,2 98,50 50,98 2,50" },
  pentagon: { points: "50,2 98,38 80,97 20,97 2,38" },
  arrow: { points: "2,35 60,35 60,12 98,50 60,88 60,65 2,65" },
  star: {
    points: "50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35",
    defaultFill: "#FEF3C7",
  },
  heart: {
    path: "M50,90 C15,66 2,42 2,26 C2,11 14,2 27,2 C38,2 46,8 50,19 C54,8 62,2 73,2 C86,2 98,11 98,26 C98,42 85,66 50,90 Z",
    defaultFill: "#FCA5A5",
  },
};

const ShapeBackground = ({
  shapeType,
  fillColor,
  strokeColor,
  showStroke = true,
}) => {
  const outline = OUTLINE_SHAPES[shapeType];

  if (outline) {
    const shapeProps = {
      fill: fillColor || outline.defaultFill || "#FFFFFF",
      fillOpacity: 0.85,
      stroke: showStroke ? strokeColor || "#4F46E5" : "none",
      strokeWidth: 3,
      vectorEffect: "non-scaling-stroke",
    };

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {outline.path ? (
          <path d={outline.path} {...shapeProps} />
        ) : (
          <polygon points={outline.points} {...shapeProps} />
        )}
      </svg>
    );
  }

  return (
    <div
      className={`absolute inset-0 shadow-sm pointer-events-none ${
        shapeType === "rectangle" ? "rounded-lg" : ""
      } ${shapeType === "circle" ? "rounded-full" : ""}`}
      style={{
        backgroundColor: fillColor || "#FFFFFF",
        borderWidth: showStroke ? "2px" : "0px",
        borderColor: strokeColor || "#4F46E5",
        opacity: 0.85,
      }}
    />
  );
};

export default ShapeBackground;
