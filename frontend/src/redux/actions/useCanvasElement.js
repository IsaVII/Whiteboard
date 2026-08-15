import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../services/socket";
import { elementUpdated, elementRemoved } from "../slices/boardSlice";
import { useDraggableElement } from "./useDraggableElement";
import {
  getSelectionFormat,
  toggleSelectionFormat,
  clearSelectionFormat,
} from "../../components/Canvas/textFormatting";

const DRAG_EMIT_INTERVAL_MS = 40;
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

export const useCanvasElement = ({ element, boardId, scale, onSelect }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const lastEmitRef = useRef(0);
  const textareaRef = useRef(null);
  const measureDivRef = useRef(null);
  const pendingSelectionRef = useRef(null);
  const resizeRef = useRef(null);

  const isTextOnly = element.type === "text";
  const fontSize = element.fontSize || 14;
  const textAlign = element.textAlign || "left";
  const verticalAlign = element.verticalAlign || "middle";
  const displayContent = element.formattedContent || element.content || "";

  // Broadcast & store local updates
  const emitUpdate = useCallback(
    (updates, { force = false } = {}) => {
      dispatch(elementUpdated({ elementId: element.id, updates }));

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

  // Dragging hook integration
  const { dragging, handlePointerDown, handlePointerMove, endDrag } =
    useDraggableElement({
      x: element.x,
      y: element.y,
      scale,
      disabled: isEditing,
      onMove: emitUpdate,
    });

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect?.();
  };

  const handleStartEditing = () => {
    setEditValue(displayContent);
    setIsEditing(true);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setEditValue(value);
    dispatch(
      elementUpdated({
        elementId: element.id,
        updates: { content: value },
      }),
    );
  };

  const handleTextBlur = () => {
    const textarea = textareaRef.current;
    if (!isTextOnly && textarea && !element.manuallyResized) {
      const scrollWidth = Math.max(textarea.scrollWidth, MIN_WIDTH);
      const scrollHeight = Math.max(textarea.scrollHeight, MIN_HEIGHT);

      const padding = 16;
      const newWidth = Math.max(scrollWidth + padding, MIN_WIDTH);
      const newHeight = Math.max(scrollHeight + padding, MIN_HEIGHT);

      if (newWidth !== element.width || newHeight !== element.height) {
        emitUpdate({ width: newWidth, height: newHeight }, { force: true });
      }
    }

    setIsEditing(false);
    emitUpdate({ formattedContent: editValue }, { force: true });
  };

  // Sync measurement div during editing
  useEffect(() => {
    if (!isEditing || !measureDivRef.current) return;
    measureDivRef.current.textContent =
      element.content || "Double-click to add text";
  }, [isEditing, element.content]);

  // Restore focus/selection after text formatting updates
  useEffect(() => {
    if (!isEditing || !pendingSelectionRef.current || !textareaRef.current)
      return;
    const { start, end } = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    pendingSelectionRef.current = null;
  }, [editValue, isEditing]);

  // Auto-resize elements when content loads (e.g. page refresh)
  useEffect(() => {
    if (isEditing || element.manuallyResized || !displayContent) return;

    const resizeTimer = requestAnimationFrame(() => {
      const tempDiv = document.createElement("div");
      tempDiv.style.visibility = "hidden";
      tempDiv.style.position = "absolute";
      tempDiv.style.whiteSpace = "pre-wrap";
      tempDiv.style.wordWrap = "break-word";
      tempDiv.style.padding = "8px";
      tempDiv.style.fontSize = `${fontSize}px`;
      tempDiv.style.fontFamily = "inherit";
      tempDiv.style.lineHeight = "1.5";
      tempDiv.textContent = displayContent;
      document.body.appendChild(tempDiv);

      const contentWidth = tempDiv.scrollWidth;
      const contentHeight = tempDiv.scrollHeight;
      document.body.removeChild(tempDiv);

      const newWidth = Math.max(contentWidth, MIN_WIDTH);
      const newHeight = Math.max(contentHeight, MIN_HEIGHT);

      if (
        Math.abs(newWidth - element.width) > 2 ||
        Math.abs(newHeight - element.height) > 2
      ) {
        emitUpdate({ width: newWidth, height: newHeight }, { force: true });
      }
    });

    return () => cancelAnimationFrame(resizeTimer);
  }, [
    displayContent,
    isEditing,
    element.manuallyResized,
    element.width,
    element.height,
    element.id,
    fontSize,
    emitUpdate,
  ]);

  const handleDelete = (e) => {
    e?.stopPropagation?.();
    dispatch(elementRemoved({ elementId: element.id }));
    if (boardId) {
      socket.emit("element-removed", { boardId, elementId: element.id });
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    handleDelete();
  };

  const handleStrokeColorChange = (color) => {
    emitUpdate({ strokeColor: color }, { force: true });
  };

  const handleFillColorChange = (color) => {
    emitUpdate({ fillColor: color }, { force: true });
  };

  const handleFontColorChange = (color) => {
    emitUpdate({ fontColor: color }, { force: true });
  };

  const handleFontSizeChange = (newSize) => {
    emitUpdate({ fontSize: newSize }, { force: true });
  };

  const handleTextAlignChange = (align) => {
    emitUpdate({ textAlign: align }, { force: true });
  };

  const handleVerticalAlignChange = (align) => {
    emitUpdate({ verticalAlign: align }, { force: true });
  };

  const handleResizePointerDown = (e) => {
    if (isEditing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
    };
    setResizing(true);
  };

  const handleResizePointerMove = (e) => {
    if (!resizeRef.current) return;
    e.stopPropagation();
    const { startClientX, startClientY, startWidth, startHeight } =
      resizeRef.current;
    const dx = (e.clientX - startClientX) / scale;
    const dy = (e.clientY - startClientY) / scale;
    const newWidth = Math.max(MIN_WIDTH, startWidth + dx);
    const newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
    emitUpdate({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = (e) => {
    if (!resizeRef.current) return;
    e.stopPropagation();
    const { startClientX, startClientY, startWidth, startHeight } =
      resizeRef.current;
    const dx = (e.clientX - startClientX) / scale;
    const dy = (e.clientY - startClientY) / scale;
    const newWidth = Math.max(MIN_WIDTH, startWidth + dx);
    const newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
    emitUpdate(
      { width: newWidth, height: newHeight, manuallyResized: true },
      { force: true },
    );
    resizeRef.current = null;
    setResizing(false);
  };

  const handleAutoResize = () => {
    if (!measureDivRef.current) {
      const tempDiv = document.createElement("div");
      tempDiv.style.visibility = "hidden";
      tempDiv.style.position = "absolute";
      tempDiv.style.whiteSpace = "pre-wrap";
      tempDiv.style.wordWrap = "break-word";
      tempDiv.style.padding = "8px";
      tempDiv.style.fontSize = `${fontSize}px`;
      tempDiv.style.fontFamily = "inherit";
      tempDiv.style.lineHeight = "1.5";
      tempDiv.textContent = element.content || "Double-click to add text";
      document.body.appendChild(tempDiv);
      const contentWidth = tempDiv.scrollWidth;
      const contentHeight = tempDiv.scrollHeight;
      document.body.removeChild(tempDiv);
      const newWidth = Math.max(contentWidth, MIN_WIDTH);
      const newHeight = Math.max(contentHeight, MIN_HEIGHT);
      emitUpdate({ width: newWidth, height: newHeight }, { force: true });
    } else {
      const contentWidth = measureDivRef.current.scrollWidth;
      const contentHeight = measureDivRef.current.scrollHeight;
      const newWidth = Math.max(contentWidth, MIN_WIDTH);
      const newHeight = Math.max(contentHeight, MIN_HEIGHT);
      emitUpdate({ width: newWidth, height: newHeight }, { force: true });
    }
  };

  const applySelectionUpdate = (result) => {
    if (!result) return;
    setEditValue(result.content);
    pendingSelectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    emitUpdate({ formattedContent: result.content }, { force: true });
  };

  const handleBoldToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    applySelectionUpdate(
      toggleSelectionFormat(
        textarea.value,
        textarea.selectionStart,
        textarea.selectionEnd,
        "bold",
      ),
    );
  };

  const handleItalicToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    applySelectionUpdate(
      toggleSelectionFormat(
        textarea.value,
        textarea.selectionStart,
        textarea.selectionEnd,
        "italic",
      ),
    );
  };

  const handleNormalToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    applySelectionUpdate(
      clearSelectionFormat(
        textarea.value,
        textarea.selectionStart,
        textarea.selectionEnd,
      ),
    );
  };

  const selectedFormat =
    isEditing && textareaRef.current
      ? getSelectionFormat(
          textareaRef.current.value,
          textareaRef.current.selectionStart,
          textareaRef.current.selectionEnd,
        )
      : { bold: false, italic: false };

  return {
    isTextOnly,
    fontSize,
    textAlign,
    verticalAlign,
    displayContent,
    isEditing,
    editValue,
    resizing,
    dragging,
    textareaRef,
    measureDivRef,
    showDeleteModal,
    setShowDeleteModal,
    selectedFormat,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    handleSelect,
    handleStartEditing,
    handleTextChange,
    handleTextBlur,
    handleDeleteClick,
    confirmDelete,
    handleStrokeColorChange,
    handleFillColorChange,
    handleFontColorChange,
    handleFontSizeChange,
    handleTextAlignChange,
    handleVerticalAlignChange,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizeEnd,
    handleAutoResize,
    handleBoldToggle,
    handleItalicToggle,
    handleNormalToggle,
  };
};
