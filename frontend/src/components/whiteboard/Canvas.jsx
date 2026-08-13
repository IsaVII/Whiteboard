import { useDispatch, useSelector } from "react-redux";
import { useRef, useState } from "react";
import { socket } from "../../redux/services/socket";
import RemoteCursor from "./RemoteCursor";
import "./Canvas.css";

const CURSOR_EMIT_INTERVAL_MS = 40;

const Canvas = () => {
  const dispatch = useDispatch();
  const boardId = useSelector((state) => state.board.boardId);
  const cursors = useSelector((state) => state.user.cursors);
  const canvasRef = useRef(null);
  const lastCursorEmitRef = useRef(0);

  const handleCanvasClick = (e) => {
    if (!boardId) {
      console.error("Board ID is not set. Cannot emit cursor position.");
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  };

  const handleMouseDown = (e, elementId) => {};

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // Broadcast our own cursor position to everyone else on the board,
    // throttled so we don't flood the socket on every pixel of movement.
    if (boardId) {
      const now = Date.now();
      if (now - lastCursorEmitRef.current >= CURSOR_EMIT_INTERVAL_MS) {
        lastCursorEmitRef.current = now;
        socket.emit("cursor-move", {
          boardId,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleMouseUp = (e) => {};

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
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
  );
};

export default Canvas;
