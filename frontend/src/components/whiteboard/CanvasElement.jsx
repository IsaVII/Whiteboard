import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../redux/services/socket";
import { elementUpdated, elementRemoved } from "../../redux/slices/boardSlice";
import "./CanvasElement.css";

const DRAG_EMIT_INTERVAL_MS = 40;

/**
 * A single shape (with optional inline text) or a plain textbox, sitting
 * inside the canvas's transformed viewport. Position/size are stored in
 * untransformed canvas-content coordinates; dragging only needs to divide
 * pointer-movement deltas by the current zoom `scale` to convert them.
 */
const CanvasElement = ({ element, boardId, scale }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null); // {startClientX, startClientY, startX, startY}
  const lastEmitRef = useRef(0);

  const emitUpdate = useCallback(
    (updates, { force = false } = {}) => {
      // Optimistic local update...
      dispatch(elementUpdated({ elementId: element.id, updates }));

      // ...throttled broadcast to everyone else on the board.
      if (!boardId) return;
      const now = Date.now();
      if (force || now - lastEmitRef.current >= DRAG_EMIT_INTERVAL_MS) {
        lastEmitRef.current = now;
        socket.emit("element-updated", {
          boardId,
          elementId: element.id,
          updates,
        });
      }
    },
    [dispatch, boardId, element.id],
  );

  const handlePointerDown = (e) => {
    if (isEditing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: element.x,
      startY: element.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const { startClientX, startClientY, startX, startY } = dragRef.current;
    const dx = (e.clientX - startClientX) / scale;
    const dy = (e.clientY - startClientY) / scale;
    emitUpdate({ x: startX + dx, y: startY + dy });
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const { startClientX, startClientY, startX, startY } = dragRef.current;
    const dx = (e.clientX - startClientX) / scale;
    const dy = (e.clientY - startClientY) / scale;
    // Force this last one through even if we're inside the throttle
    // window, so the final position never gets dropped.
    emitUpdate({ x: startX + dx, y: startY + dy }, { force: true });
    dragRef.current = null;
    setDragging(false);
  };

  const handleTextChange = (e) => {
    // Local-only while typing so we don't flood the socket on every
    // keystroke; broadcast once on blur.
    dispatch(
      elementUpdated({
        elementId: element.id,
        updates: { content: e.target.value },
      }),
    );
  };

  const handleTextBlur = (e) => {
    setIsEditing(false);
    if (!boardId) return;
    socket.emit("element-updated", {
      boardId,
      elementId: element.id,
      updates: { content: e.target.value },
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch(elementRemoved({ elementId: element.id }));
    if (boardId) {
      socket.emit("element-removed", { boardId, elementId: element.id });
    }
  };

  const isTextOnly = element.type === "text";

  return (
    <div
      className={`canvas-element${dragging ? " canvas-element--dragging" : ""}${
        isTextOnly ? " canvas-element--text" : ""
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
      title={element.createdBy ? `Added by ${element.createdBy}` : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => setIsEditing(true)}
      // Stop touch events from also reaching Canvas's pan/pinch
      // handlers, which listen on the same element tree.
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {!isTextOnly && (
        <div className={`canvas-shape canvas-shape--${element.shapeType}`} />
      )}

      {isEditing ? (
        <textarea
          className="canvas-element-textarea"
          autoFocus
          defaultValue={element.content}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="canvas-element-content">
          {element.content || (
            <span className="canvas-element-placeholder">
              {isTextOnly ? "Double-click to type" : "Double-click to add text"}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        className="canvas-element-delete"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleDelete}
        aria-label="Delete"
        title="Delete"
      >
        ×
      </button>
    </div>
  );
};

export default CanvasElement;
