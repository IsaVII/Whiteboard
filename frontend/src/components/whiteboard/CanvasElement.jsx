import { useCallback, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { socket } from "../../redux/services/socket";
import { elementUpdated, elementRemoved } from "../../redux/slices/boardSlice";
import ColorButton from "./ColorButton";
import Modal from "../Modal";
import ToolbarButton from "./ToolbarButton";
import ToolbarGroup from "./ToolbarGroup";
import ShapeBackground from "./ShapeBackground";
import FormattedText from "./FormattedText";
import { useDraggableElement } from "./useDraggableElement";
import {
  getSelectionFormat,
  toggleSelectionFormat,
  clearSelectionFormat,
} from "./textFormatting";

const DRAG_EMIT_INTERVAL_MS = 40;
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

/**
 * A single shape (with optional inline text) or a plain textbox, sitting
 * inside the canvas's transformed viewport. Position/size are stored in
 * untransformed canvas-content coordinates; dragging only needs to divide
 * pointer-movement deltas by the current zoom `scale` to convert them.
 */
const CanvasElement = ({
  element,
  boardId,
  scale,
  selected = false,
  onSelect,
  toolbarPortalNode,
}) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resizing, setResizing] = useState(false);
  // Local buffer for the textarea while editing only. Everything else
  // (fontSize, textAlign, verticalAlign, the non-editing display text) is
  // read directly from `element` below so a remote update always shows up
  // immediately instead of needing a page refresh.
  const [editValue, setEditValue] = useState("");
  const lastEmitRef = useRef(0);
  const textareaRef = useRef(null);
  const measureDivRef = useRef(null);
  const pendingSelectionRef = useRef(null); // {start, end} to restore after a formatting toggle
  const resizeRef = useRef(null); // {startClientX, startClientY, startWidth, startHeight}

  const isTextOnly = element.type === "text";
  const fontSize = element.fontSize || 14;
  const textAlign = element.textAlign || "left";
  const verticalAlign = element.verticalAlign || "middle";
  const displayContent = element.formattedContent || element.content || "";

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

  const { dragging, handlePointerDown, handlePointerMove, endDrag } =
    useDraggableElement({
      x: element.x,
      y: element.y,
      scale,
      disabled: isEditing,
      onMove: emitUpdate,
    });

  const handleSelect = (e) => {
    // Selection is a plain click, distinct from the double-click that
    // starts editing. Stop it from bubbling to Canvas's click handler,
    // which deselects when the click lands on empty canvas space.
    e.stopPropagation();
    onSelect?.();
  };

  const handleStartEditing = () => {
    // Seed the editing buffer from the latest server/Redux state (not a
    // possibly-stale local copy) every time editing begins.
    setEditValue(displayContent);
    setIsEditing(true);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setEditValue(value);
    // Keep Redux's plain `content` in sync locally on every keystroke (this
    // drives the auto-grow measurement div below) without flooding the
    // socket; the full formattedContent broadcast happens once on blur.
    dispatch(
      elementUpdated({
        elementId: element.id,
        updates: { content: value },
      }),
    );
  };

  const handleTextBlur = () => {
    const textarea = textareaRef.current;
    // Auto-resize only if element was never manually resized
    if (!isTextOnly && textarea && !element.manuallyResized) {
      const scrollWidth = Math.max(textarea.scrollWidth, MIN_WIDTH);
      const scrollHeight = Math.max(textarea.scrollHeight, MIN_HEIGHT);

      // Add padding (matching the element's padding)
      const padding = 16; // 2 * 8px padding
      const newWidth = Math.max(scrollWidth + padding, MIN_WIDTH);
      const newHeight = Math.max(scrollHeight + padding, MIN_HEIGHT);

      // Only update if dimensions changed
      if (newWidth !== element.width || newHeight !== element.height) {
        emitUpdate({ width: newWidth, height: newHeight }, { force: true });
      }
    }

    setIsEditing(false);
    // Broadcast the final formatted text through the same emitUpdate path
    // as everything else, so it's dispatched to Redux and sent to the
    // socket consistently.
    emitUpdate({ formattedContent: editValue }, { force: true });
  };

  // Update measurement div when content changes during editing
  useEffect(() => {
    if (!isEditing || !measureDivRef.current) return;
    measureDivRef.current.textContent =
      element.content || "Double-click to add text";
  }, [isEditing, element.content]);

  // Restore focus + selection after a formatting toggle re-renders the
  // (controlled) textarea with new content — otherwise the browser drops
  // the cursor/selection and the next toolbar click has nothing to act on.
  useEffect(() => {
    if (!isEditing || !pendingSelectionRef.current || !textareaRef.current)
      return;
    const { start, end } = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    pendingSelectionRef.current = null;
  }, [editValue, isEditing]);

  const handleDelete = (e) => {
    e.stopPropagation();
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
    handleDelete({ stopPropagation: () => {} });
  };

  const handleStrokeColorChange = (color) => {
    emitUpdate({ strokeColor: color }, { force: true });
  };

  const handleFillColorChange = (color) => {
    emitUpdate({ fillColor: color }, { force: true });
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
    // Mark element as manually resized so auto-resize won't override it
    emitUpdate(
      { width: newWidth, height: newHeight, manuallyResized: true },
      { force: true },
    );
    resizeRef.current = null;
    setResizing(false);
  };

  const handleAutoResize = () => {
    if (!measureDivRef.current) {
      // Create a temporary measurement div if one doesn't exist (for text-only elements during non-editing)
      const tempDiv = document.createElement("div");
      tempDiv.style.visibility = "hidden";
      tempDiv.style.position = "absolute";
      tempDiv.style.whiteSpace = "pre-wrap";
      tempDiv.style.wordWrap = "break-word";
      tempDiv.style.padding = "8px"; // Match p-2 from the display div
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
      // During editing, use the visible measurement div
      const contentWidth = measureDivRef.current.scrollWidth;
      const contentHeight = measureDivRef.current.scrollHeight;
      const newWidth = Math.max(contentWidth, MIN_WIDTH);
      const newHeight = Math.max(contentHeight, MIN_HEIGHT);
      emitUpdate({ width: newWidth, height: newHeight }, { force: true });
    }
  };

  // Applies the result of a textFormatting helper (or does nothing if
  // there was no selection to act on) and queues the selection restore.
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

  return (
    <div
      className={`absolute flex cursor-grab select-none touch-none group ${
        dragging ? "cursor-grabbing z-20" : ""
      } ${
        selected
          ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent"
          : ""
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
      title={element.createdBy ? `Added by ${element.createdBy}` : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={resizing ? handleResizePointerMove : handlePointerMove}
      onPointerUp={resizing ? handleResizeEnd : endDrag}
      onPointerCancel={resizing ? handleResizeEnd : endDrag}
      onClick={handleSelect}
      onDoubleClick={handleStartEditing}
      // Stop touch events from also reaching Canvas's pan/pinch
      // handlers, which listen on the same element tree.
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {!isTextOnly && (
        <ShapeBackground
          shapeType={element.shapeType}
          fillColor={element.fillColor}
          strokeColor={element.strokeColor}
        />
      )}

      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            className={`relative z-[1] w-full h-full p-2 text-xs text-gray-800 break-words resize-none border-0 outline-none bg-transparent font-inherit text-inherit whitespace-pre-wrap ${
              element.manuallyResized ? "overflow-hidden" : ""
            } ${
              isTextOnly
                ? "border border-dashed border-gray-400 rounded bg-white/60"
                : ""
            }`}
            autoFocus
            value={editValue}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              fontSize: `${fontSize}px`,
              textAlign: textAlign,
            }}
          />
          {/* Hidden div to measure text content for auto-sizing shapes */}
          {!isTextOnly && (
            <div
              ref={measureDivRef}
              className="invisible absolute whitespace-pre-wrap break-words p-2 text-xs text-gray-800 pointer-events-none"
              style={{
                width: "100%",
                maxWidth: "500px",
              }}
            >
              {element.content || "Double-click to add text"}
            </div>
          )}
        </>
      ) : (
        <div
          className={`relative z-[1] w-full h-full p-2 text-xs text-gray-800 break-words whitespace-pre-wrap ${
            element.manuallyResized ? "overflow-hidden" : ""
          } ${
            isTextOnly
              ? "border border-dashed border-transparent rounded group-hover:border-gray-400 group-hover:bg-white/60"
              : "flex"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            ...(isTextOnly
              ? {}
              : {
                  justifyContent:
                    textAlign === "left"
                      ? "flex-start"
                      : textAlign === "right"
                        ? "flex-end"
                        : "center",
                  alignItems:
                    verticalAlign === "top"
                      ? "flex-start"
                      : verticalAlign === "bottom"
                        ? "flex-end"
                        : "center",
                }),
          }}
        >
          {displayContent ? (
            <span style={{ textAlign: textAlign }}>
              <FormattedText content={displayContent} />
            </span>
          ) : (
            <span
              className={`text-gray-400 italic text-xs ${isTextOnly ? "" : "absolute"}`}
            >
              {isTextOnly ? "Double-click to type" : "Double-click to add text"}
            </span>
          )}
        </div>
      )}

      {/* Resize buttons - bottom right corner. These stay anchored to the
          element itself rather than moving into the floating toolbar. */}
      <ToolbarGroup
        position="-bottom-2 -right-2"
        direction="row"
        hidden={isEditing}
      >
        <ToolbarButton
          title="Auto-resize to fit content"
          className="text-xs rounded"
          onClick={handleAutoResize}
        >
          ↔️
        </ToolbarButton>
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={resizing ? handleResizePointerMove : undefined}
          onPointerUp={resizing ? handleResizeEnd : undefined}
          onPointerCancel={resizing ? handleResizeEnd : undefined}
          className={`w-6 h-6 rounded cursor-se-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ${
            resizing ? "opacity-100" : ""
          }`}
          title="Drag to resize"
          style={{
            background: resizing ? "rgb(99, 102, 241)" : "white",
            border: "1px solid #d1d5db",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          ⬉
        </div>
      </ToolbarGroup>

      {/* Formatting controls (font size, alignment, colors, delete, and
          bold/italic/normal while editing) render into the floating
          second toolbar above the whiteboard instead of around the
          element - see Canvas.jsx. Only shown while this element is
          selected. */}
      {selected &&
        toolbarPortalNode &&
        createPortal(
          <>
            {!isEditing && (
              <>
                <div className="flex items-center gap-1">
                  <ToolbarButton
                    title="Decrease font size"
                    className="text-xs rounded"
                    onClick={() =>
                      handleFontSizeChange(Math.max(8, fontSize - 2))
                    }
                  >
                    −
                  </ToolbarButton>
                  <div className="w-10 h-6 rounded border border-gray-300 bg-white text-gray-600 text-xs flex items-center justify-center shadow-sm select-none">
                    {fontSize}px
                  </div>
                  <ToolbarButton
                    title="Increase font size"
                    className="text-xs rounded"
                    onClick={() =>
                      handleFontSizeChange(Math.min(20, fontSize + 2))
                    }
                  >
                    +
                  </ToolbarButton>
                </div>

                <div className="w-px h-5 bg-gray-200" />

                <div className="flex items-center gap-1">
                  <ToolbarButton
                    title="Align left"
                    className="text-xs rounded"
                    active={textAlign === "left"}
                    onClick={() => handleTextAlignChange("left")}
                  >
                    ⬅
                  </ToolbarButton>
                  <ToolbarButton
                    title="Align center"
                    className="text-xs rounded"
                    active={textAlign === "center"}
                    onClick={() => handleTextAlignChange("center")}
                  >
                    ⬌
                  </ToolbarButton>
                  <ToolbarButton
                    title="Align right"
                    className="text-xs rounded"
                    active={textAlign === "right"}
                    onClick={() => handleTextAlignChange("right")}
                  >
                    ➡
                  </ToolbarButton>
                </div>

                <div className="w-px h-5 bg-gray-200" />

                <div className="flex items-center gap-1">
                  <ToolbarButton
                    title="Align top"
                    className="text-xs rounded"
                    active={verticalAlign === "top"}
                    onClick={() => handleVerticalAlignChange("top")}
                  >
                    ⬆
                  </ToolbarButton>
                  <ToolbarButton
                    title="Align middle"
                    className="text-xs rounded"
                    active={verticalAlign === "middle"}
                    onClick={() => handleVerticalAlignChange("middle")}
                  >
                    ⬌
                  </ToolbarButton>
                  <ToolbarButton
                    title="Align bottom"
                    className="text-xs rounded"
                    active={verticalAlign === "bottom"}
                    onClick={() => handleVerticalAlignChange("bottom")}
                  >
                    ⬇
                  </ToolbarButton>
                </div>

                <div className="w-px h-5 bg-gray-200" />

                <div className="flex items-center gap-2">
                  <ColorButton
                    isSoft={false}
                    onColorSelect={handleStrokeColorChange}
                    alwaysVisible
                  />
                  <ColorButton
                    isSoft={true}
                    onColorSelect={handleFillColorChange}
                    alwaysVisible
                  />
                </div>

                <div className="w-px h-5 bg-gray-200" />

                <ToolbarButton
                  tone="danger"
                  className="text-sm leading-none rounded-full"
                  onClick={handleDeleteClick}
                  title="Delete"
                  aria-label="Delete"
                >
                  ×
                </ToolbarButton>
              </>
            )}

            {/* Bold/italic/normal only make sense while actively editing
                this element's text, and each button keeps focus on the
                textarea so clicking it doesn't blur out of edit mode. */}
            {isEditing && (
              <div className="flex items-center gap-1">
                <ToolbarButton
                  title="Normal"
                  className="text-xs rounded"
                  active={!selectedFormat.bold && !selectedFormat.italic}
                  onClick={handleNormalToggle}
                  keepFocusOnTextarea
                >
                  N
                </ToolbarButton>
                <ToolbarButton
                  title="Bold"
                  className="text-xs rounded font-bold"
                  active={selectedFormat.bold}
                  onClick={handleBoldToggle}
                  keepFocusOnTextarea
                >
                  B
                </ToolbarButton>
                <ToolbarButton
                  title="Italic"
                  className="text-xs rounded italic"
                  active={selectedFormat.italic}
                  onClick={handleItalicToggle}
                  keepFocusOnTextarea
                >
                  I
                </ToolbarButton>
              </div>
            )}
          </>,
          toolbarPortalNode,
        )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Delete Element"
        message="Are you sure you want to delete this element? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CanvasElement;
