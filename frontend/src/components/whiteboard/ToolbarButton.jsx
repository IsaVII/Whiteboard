import { useRef } from "react";

const LONG_PRESS_MS = 450;

/**
 * A toolbar button that distinguishes a short press (onClick) from a
 * press-and-hold (onLongPress). If onLongPress fires, the eventual
 * pointerup does NOT also fire onClick.
 *
 * `children` renders inside a positioned wrapper so callers can attach a
 * dropdown/popover anchored to this button.
 */
const ToolbarButton = ({
  icon,
  label,
  onClick,
  onLongPress,
  active = false,
  children,
}) => {
  const timerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // left click / touch only
    longPressFiredRef.current = false;

    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    }
  };

  const handlePointerUp = () => {
    clearTimer();
    if (!longPressFiredRef.current && onClick) {
      onClick();
    }
  };

  const handlePointerLeaveOrCancel = () => {
    clearTimer();
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`w-[42px] h-[42px] rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-lg font-semibold flex items-center justify-center cursor-pointer select-none touch-none shadow-sm active:bg-gray-200 transition-colors ${
          active ? "bg-indigo-100 border-indigo-500 text-indigo-700" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeaveOrCancel}
        onPointerCancel={handlePointerLeaveOrCancel}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={label}
        title={label}
      >
        <span className="pointer-events-none leading-none">{icon}</span>
      </button>
      {children}
    </div>
  );
};

export default ToolbarButton;
