import { useRef, useState } from "react";

// Encapsulates the pointer-drag gesture for moving a canvas element:
// pointerdown captures the pointer and records the starting position;
// pointermove/up translate client-pixel deltas (divided by the current
// zoom `scale`) into canvas coordinates and forward them via `onMove`.
// `onMove(updates, { force })` is expected to match CanvasElement's
// `emitUpdate` signature — non-final moves are unthrottled here, letting
// the caller decide how to throttle the socket broadcast.
export function useDraggableElement({ x, y, scale, disabled, onMove }) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null); // {startClientX, startClientY, startX, startY}

  const handlePointerDown = (e) => {
    if (disabled) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: x,
      startY: y,
    };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const { startClientX, startClientY, startX, startY } = dragRef.current;
    const dx = (e.clientX - startClientX) / scale;
    const dy = (e.clientY - startClientY) / scale;
    onMove({ x: startX + dx, y: startY + dy });
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const { startClientX, startClientY, startX, startY } = dragRef.current;
    const dx = (e.clientX - startClientX) / scale;
    const dy = (e.clientY - startClientY) / scale;
    // Force this last one through even if we're inside the throttle
    // window, so the final position never gets dropped.
    onMove({ x: startX + dx, y: startY + dy }, { force: true });
    dragRef.current = null;
    setDragging(false);
  };

  return { dragging, handlePointerDown, handlePointerMove, endDrag };
}
