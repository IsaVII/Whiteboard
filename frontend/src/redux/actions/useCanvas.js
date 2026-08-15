import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../services/socket";
import { elementRemoved } from "../slices/boardSlice";

const CURSOR_EMIT_INTERVAL_MS = 40;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const useCanvas = () => {
  const dispatch = useDispatch();
  const boardId = useSelector((state) => state.board.boardId);
  const elements = useSelector((state) => state.board.elements);
  const cursors = useSelector((state) => state.user.cursors);

  const canvasRef = useRef(null);
  const lastCursorEmitRef = useRef(0);

  // Pan/zoom state for canvas viewport
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Selected element and formatting portal target node
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [toolbarNode, setToolbarNode] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Drop selection if selected element gets deleted
  useEffect(() => {
    if (
      selectedElementId &&
      !elements.some((el) => el.id === selectedElementId)
    ) {
      setSelectedElementId(null);
    }
  }, [elements, selectedElementId]);

  // Touch/Mouse gesture tracking
  const gestureRef = useRef({
    mode: null, // 'pan' | 'pinch' | 'mouse-pan' | null
    lastX: 0,
    lastY: 0,
    startDistance: 0,
    startScale: 1,
    startMidX: 0,
    startMidY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Convert raw screen coords to transformed canvas-content coordinates
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
    if (gestureRef.current.mode === "mouse-pan") return;

    if (!boardId) {
      console.error("Board ID is not set. Cannot emit cursor position.");
      return;
    }

    setSelectedElementId(null);
  };

  const handleMouseDown = (e) => {
    if (
      e.target === canvasRef.current ||
      e.target.classList.contains("canvas-viewport")
    ) {
      const gesture = gestureRef.current;
      gesture.mode = "mouse-pan";
      gesture.lastX = e.clientX;
      gesture.lastY = e.clientY;

      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const gesture = gestureRef.current;

    if (gesture.mode === "mouse-pan") {
      const dx = e.clientX - gesture.lastX;
      const dy = e.clientY - gesture.lastY;
      gesture.lastX = e.clientX;
      gesture.lastY = e.clientY;

      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      return;
    }

    const { x, y } = toCanvasCoords(e.clientX, e.clientY);

    if (boardId) {
      const now = Date.now();
      if (now - lastCursorEmitRef.current >= CURSOR_EMIT_INTERVAL_MS) {
        lastCursorEmitRef.current = now;
        socket.emit("cursor-move", { boardId, x, y });
      }
    }
  };

  const handleMouseUp = () => {
    const gesture = gestureRef.current;
    if (gesture.mode === "mouse-pan") {
      gesture.mode = null;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grab";
      }
    }
  };

  // --- Touch Gestures ---

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
      gesture.mode = "pan";
      gesture.lastX = touches[0].clientX;
      gesture.lastY = touches[0].clientY;
    }
  };

  // --- Zoom Controls ---

  const zoomBy = (factor) => {
    setViewport((prev) => {
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      if (!canvasRef.current) return { ...prev, scale: newScale };

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

  // --- Actions ---

  const handleDeleteAllClick = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAll = () => {
    setShowDeleteAllModal(false);
    elements.forEach((element) => {
      dispatch(elementRemoved({ elementId: element.id }));
    });
    if (boardId) {
      elements.forEach((element) => {
        socket.emit("element-removed", { boardId, elementId: element.id });
      });
    }
    setSelectedElementId(null);
  };

  return {
    canvasRef,
    boardId,
    elements,
    cursors,
    viewport,
    selectedElementId,
    setSelectedElementId,
    setToolbarNode,
    showDeleteAllModal,
    setShowDeleteAllModal,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    zoomBy,
    resetView,
    handleDeleteAllClick,
    confirmDeleteAll,
  };
};
