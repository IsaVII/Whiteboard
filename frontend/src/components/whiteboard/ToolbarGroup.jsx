/**
 * Positions a row/column of ToolbarButtons (or other small controls) around
 * a canvas element, and applies the shared "fade in on hover, hidden while
 * editing" visibility. Not used for the bold/italic/normal panel — that one
 * mounts only while editing rather than fading, since it has nothing
 * sensible to show the rest of the time.
 */
const ToolbarGroup = ({ position, direction = "row", hidden, children }) => (
  <div
    className={`absolute ${position} flex ${direction === "col" ? "flex-col" : ""} gap-1 z-[50] ${
      hidden
        ? "opacity-0 pointer-events-none"
        : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
    }`}
  >
    {children}
  </div>
);

export default ToolbarGroup;
