const BASE_CLASSES =
  "w-6 h-6 border flex items-center justify-center cursor-pointer shadow-sm transition-colors";

const TONE_CLASSES = {
  default: {
    active: "bg-indigo-100 border-indigo-400 text-indigo-700",
    inactive: "bg-white border-gray-300 text-gray-600 hover:bg-gray-100",
  },
  danger: {
    active: "bg-indigo-100 border-indigo-400 text-indigo-700",
    inactive:
      "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-700 hover:border-red-300",
  },
};

/**
 * Shared building block for every small square control drawn around a
 * canvas element: align, font size, bold/italic/normal, delete. Centralizes
 * the toggle-active styling, the show/hide-on-hover visibility, and the
 * "don't steal focus away from the textarea" pointer handling — each of
 * those only needs to be gotten right once now instead of per-button.
 *
 * `className` is for structural/text classes only (rounding, font size,
 * position) — never re-set color/background/border there, or it can
 * silently conflict with the tone classes depending on Tailwind's
 * generated stylesheet order.
 */
const ToolbarButton = ({
  active = false,
  tone = "default",
  title,
  onClick,
  children,
  className = "",
  hidden,
  keepFocusOnTextarea = false,
  ...rest
}) => {
  const toneClasses = TONE_CLASSES[tone][active ? "active" : "inactive"];
  const visibilityClasses =
    hidden === undefined
      ? ""
      : hidden
        ? "opacity-0 pointer-events-none"
        : "opacity-0 group-hover:opacity-100 focus-within:opacity-100";

  const onPointerDown = keepFocusOnTextarea
    ? (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    : (e) => e.stopPropagation();

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
  };

  return (
    <button
      type="button"
      title={title}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`${BASE_CLASSES} ${toneClasses} ${visibilityClasses} ${className}`}
      onPointerDown={onPointerDown}
      onMouseDown={keepFocusOnTextarea ? (e) => e.preventDefault() : undefined}
      {...rest}
    >
      {children}
    </button>
  );
};

export default ToolbarButton;
