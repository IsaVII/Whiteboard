import { useState } from "react";

// Bright colors for outline
const BRIGHT_COLORS = [
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Green", hex: "#22C55E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
];

// Soft/whitish colors for fill
const SOFT_COLORS = [
  { name: "Red", hex: "#FECACA" },
  { name: "Orange", hex: "#FDBA74" },
  { name: "Yellow", hex: "#FDE047" },
  { name: "Green", hex: "#BBFB7E" },
  { name: "Blue", hex: "#BFDBFE" },
  { name: "Indigo", hex: "#C7D2FE" },
  { name: "Purple", hex: "#E9D5FF" },
  { name: "Pink", hex: "#FBCFE8" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#1F2937" },
];

/**
 * ColorButton displays a 2x5 grid of color options
 * @param {boolean} isSoft - if true, use softer colors; if false, use bright colors
 * @param {Function} onColorSelect - callback when a color is selected
 * @param {boolean} alwaysVisible - if true, skip the "fade in on hover of a
 *   `.group` ancestor" behavior and just show the button. Needed when the
 *   button is rendered somewhere (e.g. the floating element toolbar) that
 *   isn't a descendant of the canvas element's `.group` wrapper anymore.
 * @param {string} label - optional custom label for the button (e.g., "T" for text color).
 *   Defaults to "O" for outline or "F" for fill based on isSoft.
 */
const ColorButton = ({
  isSoft = false,
  onColorSelect,
  alwaysVisible = false,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = isSoft ? SOFT_COLORS : BRIGHT_COLORS;
  const buttonLabel = label !== undefined ? label : isSoft ? "F" : "O";
  const ariaLabel =
    label !== undefined ? label : isSoft ? "Fill color" : "Outline color";
  const titleText =
    label !== undefined
      ? `${label} color`
      : isSoft
        ? "Fill color"
        : "Outline color";

  const handleColorClick = (hex) => {
    onColorSelect(hex);
    setIsOpen(false);
  };

  return (
    <div className="relative w-5 h-5">
      <button
        type="button"
        className={`absolute top-0 left-0 w-5 h-5 rounded border border-gray-300 bg-white text-gray-500 text-xs leading-none flex items-center justify-center cursor-pointer shadow-sm transition-opacity hover:bg-gray-100 hover:border-gray-400 ${
          alwaysVisible
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        }`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`Select ${ariaLabel}`}
        title={titleText}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 grid grid-cols-2 gap-2 z-[9999] w-max"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {colors.map((color) => (
            <button
              key={color.hex}
              type="button"
              className="w-4 h-4 rounded border border-gray-300 hover:border-gray-500 hover:shadow-md transition-all"
              style={{ backgroundColor: color.hex }}
              onClick={() => handleColorClick(color.hex)}
              onPointerDown={(e) => e.stopPropagation()}
              title={color.name}
              aria-label={`Select ${color.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorButton;
