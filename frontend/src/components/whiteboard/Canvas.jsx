import { useDispatch, useSelector } from "react-redux";
import { useCallback, useRef, useState } from "react";
import { socket } from "../../redux/services/socket";
import RemoteCursor from "./RemoteCursor";
import CanvasElement from "./CanvasElement";
import "./Canvas.css";

const CURSOR_EMIT_INTERVAL_MS = 40;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const Canvas = () => {
  const dispatch = useDispatch();
  const boardId = useSelector((state) => state.board.boardId);
  const elements = useSelector((state) => state.board.elements);
  const cursors = useSelector((state) => state.user.cursors);
  const canvasRef = useRef(null);
  const lastCursorEmitRef = useRef(0);

  // Pan/zoom state for the canvas content. `x`/`y` are pixel offsets and
  // `scale` is applied via CSS transform on the inner .canvas-viewport,
  // so the outer .canvas can stay clipped (overflow: hidden) while the
  // content underneath can be bigger than the visible area.
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Touch gesture tracking. Kept in a ref (not state) since it updates on
  // every touchmove and doesn't need to trigger re-renders itself.
  const gestureRef = useRef({
    mode: null, // 'pan' | 'pinch' | null
    lastX: 0,
    lastY: 0,
    startDistance: 0,
    startScale: 1,
    startMidX: 0,
    startMidY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Convert a raw client (screen) coordinate into canvas-content space,
  // undoing the current pan/zoom. Use this anywhere you need "where on
  // the board did the user actually click/move", e.g. before emitting.
  const toCanvasCoords = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const { scale, x: offsetX, y: offsetY } = viewportRef.current;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }, []);

  const handleCanvasClick = (e) => {
    if (!boardId) {
      console.error("Board ID is not set. Cannot emit cursor position.");
      return;
    }

    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
  };

  const handleMouseDown = (e, elementId) => {};

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const { x, y } = toCanvasCoords(e.clientX, e.clientY);

    // Broadcast our own cursor position to everyone else on the board,
    // throttled so we don't flood the socket on every pixel of movement.
    if (boardId) {
      const now = Date.now();
      if (now - lastCursorEmitRef.current >= CURSOR_EMIT_INTERVAL_MS) {
        lastCursorEmitRef.current = now;
        socket.emit("cursor-move", { boardId, x, y });
      }
    }
  };

  const handleMouseUp = (e) => {};

  // --- Touch gestures: one finger pans, two fingers pinch-to-zoom ---

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const getTouchMidpoint = (touches) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const handleTouchStart = (e) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    if (touches.length === 1) {
      gesture.mode = "pan";
      gesture.lastX = touches[0].clientX;
      gesture.lastY = touches[0].clientY;
    } else if (touches.length === 2) {
      gesture.mode = "pinch";
      gesture.startDistance = getTouchDistance(touches);
      gesture.startScale = viewportRef.current.scale;
      const mid = getTouchMidpoint(touches);
      gesture.startMidX = mid.x;
      gesture.startMidY = mid.y;
      gesture.startOffsetX = viewportRef.current.x;
      gesture.startOffsetY = viewportRef.current.y;
    }
  };

  const handleTouchMove = (e) => {
    // Stop the page itself from scrolling/refreshing while gesturing
    // on the canvas.
    e.preventDefault();

    const touches = e.touches;
    const gesture = gestureRef.current;

    if (gesture.mode === "pan" && touches.length === 1) {
      const dx = touches[0].clientX - gesture.lastX;
      const dy = touches[0].clientY - gesture.lastY;
      gesture.lastX = touches[0].clientX;
      gesture.lastY = touches[0].clientY;

      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    } else if (gesture.mode === "pinch" && touches.length === 2) {
      const distance = getTouchDistance(touches);
      const scale = clamp(
        gesture.startScale * (distance / gesture.startDistance),
        MIN_SCALE,
        MAX_SCALE,
      );
      const mid = getTouchMidpoint(touches);

      // Anchor the zoom on the content point that was under the fingers
      // when the gesture started, so it doesn't jump around as you pinch.
      const contentX =
        (gesture.startMidX - gesture.startOffsetX) / gesture.startScale;
      const contentY =
        (gesture.startMidY - gesture.startOffsetY) / gesture.startScale;

      setViewport({
        scale,
        x: mid.x - contentX * scale,
        y: mid.y - contentY * scale,
      });
    }
  };

  const handleTouchEnd = (e) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    if (touches.length === 0) {
      gesture.mode = null;
    } else if (touches.length === 1) {
      // Went from pinching to one finger left down — restart pan
      // tracking from that finger's current position.
      gesture.mode = "pan";
      gesture.lastX = touches[0].clientX;
      gesture.lastY = touches[0].clientY;
    }
  };

  // --- Zoom control buttons (mouse-friendly fallback for pinch) ---

  const zoomBy = (factor) => {
    setViewport((prev) => {
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      if (!canvasRef.current) return { ...prev, scale: newScale };

      // Zoom toward the center of the visible canvas area.
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const contentX = (centerX - prev.x) / prev.scale;
      const contentY = (centerY - prev.y) / prev.scale;

      return {
        scale: newScale,
        x: centerX - contentX * newScale,
        y: centerY - contentY * newScale,
      };
    });
  };

  const resetView = () => setViewport({ scale: 1, x: 0, y: 0 });

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="canvas-viewport"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        }}
      >
        {/* SHAPES & TEXTBOXES */}
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            boardId={boardId}
            scale={viewport.scale}
          />
        ))}

        {/* CURSORS */}
        {Object.entries(cursors).map(([socketId, cursor]) => (
          <RemoteCursor
            key={socketId}
            name={cursor.name}
            color={cursor.color}
            x={cursor.x}
            y={cursor.y}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="canvas-zoom-controls">
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomBy(0.8)} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={resetView} aria-label="Reset view">
          ⟲
        </button>
      </div>
    </div>
  );
};

export default Canvas;
