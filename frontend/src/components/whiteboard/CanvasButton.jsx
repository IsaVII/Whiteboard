/**
 * Reusable button component for canvas controls (zoom, delete all, etc.)
 * Uses Tailwind CSS for styling.
 */
const CanvasButton = ({
  onClick,
  title,
  ariaLabel,
  children,
  variant = "default", // 'default' | 'danger'
  className = "",
  ...rest
}) => {
  const baseClasses =
    "w-9 h-9 flex items-center justify-center rounded border font-semibold text-lg cursor-pointer transition-all shadow-sm";

  const variantClasses = {
    default:
      "bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200",
    danger:
      "bg-white/90 border-gray-300 text-gray-700 hover:bg-red-100 hover:border-red-500 hover:shadow-md active:bg-red-200 active:border-red-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default CanvasButton;
