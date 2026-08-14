// Fill/border rendering for a shape element's background. Pulled out of
// CanvasElement mainly because the star's clip-path polygon is a big,
// self-contained chunk of markup that doesn't need to sit inline.
const ShapeBackground = ({ shapeType, fillColor, strokeColor }) => {
  if (shapeType === "star") {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: fillColor || "#FEF3C7",
          clipPath: `polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          )`,
        }}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 shadow-sm pointer-events-none ${
        shapeType === "rectangle" ? "rounded-lg" : ""
      } ${shapeType === "circle" ? "rounded-full" : ""}`}
      style={{
        backgroundColor: fillColor || "#FFFFFF",
        borderWidth: "2px",
        borderColor: strokeColor || "#4F46E5",
        opacity: 0.85,
      }}
    />
  );
};

export default ShapeBackground;
