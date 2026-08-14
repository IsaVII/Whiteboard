import { useCallback, useRef, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../redux/services/socket";
import { elementUpdated, elementRemoved } from "../../redux/slices/boardSlice";
import ColorButton from "./ColorButton";
import Modal from "../Modal";

const DRAG_EMIT_INTERVAL_MS = 40;
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fontSize, setFontSize] = useState(element.fontSize || 14);
  const [textAlign, setTextAlign] = useState(element.textAlign || "left");
  const [verticalAlign, setVerticalAlign] = useState(
    element.verticalAlign || "middle",
  );
  const [isBold, setIsBold] = useState(element.isBold || false);
  const [isItalic, setIsItalic] = useState(element.isItalic || false);
  const dragRef = useRef(null); // {startClientX, startClientY, startX, startY}
  const lastEmitRef = useRef(0);
  const textareaRef = useRef(null);
  const measureDivRef = useRef(null);

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
    // Measure and update size before closing edit mode
    if (!isTextOnly && element.type !== "text" && textareaRef.current) {
      const textarea = textareaRef.current;
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
    if (!boardId) return;
    socket.emit("element-updated", {
      boardId,
      elementId: element.id,
      updates: { content: e.target.value },
    });
  };

  // Update measurement div when content changes during editing
  useEffect(() => {
    if (!isEditing || !measureDivRef.current) return;
    measureDivRef.current.textContent =
      element.content || "Double-click to add text";
  }, [isEditing, element.content]);

  // Sync text formatting properties when element changes
  useEffect(() => {
    setFontSize(element.fontSize || 14);
    setTextAlign(element.textAlign || "left");
    setVerticalAlign(element.verticalAlign || "middle");
    setIsBold(element.isBold || false);
    setIsItalic(element.isItalic || false);
  }, [element.id]);

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
    setFontSize(newSize);
    emitUpdate({ fontSize: newSize }, { force: true });
  };

  const handleTextAlignChange = (align) => {
    setTextAlign(align);
    emitUpdate({ textAlign: align }, { force: true });
  };

  const handleVerticalAlignChange = (align) => {
    setVerticalAlign(align);
    emitUpdate({ verticalAlign: align }, { force: true });
  };

  const handleBoldToggle = () => {
    const newBoldState = !isBold;
    setIsBold(newBoldState);
    emitUpdate({ isBold: newBoldState }, { force: true });
  };

  const handleItalicToggle = () => {
    const newItalicState = !isItalic;
    setIsItalic(newItalicState);
    emitUpdate({ isItalic: newItalicState }, { force: true });
  };

  const handleNormalToggle = () => {
    const newBoldState = false;
    const newItalicState = false;
    setIsBold(newBoldState);
    setIsItalic(newItalicState);
    emitUpdate(
      { isBold: newBoldState, isItalic: newItalicState },
      { force: true },
    );
  };

  const isTextOnly = element.type === "text";

  return (
    <div
      className={`absolute flex cursor-grab select-none touch-none group ${
        dragging ? "cursor-grabbing z-20" : ""
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
        <>
          {element.shapeType === "star" ? (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: element.fillColor || "#FEF3C7",
                clipPath: `polygon(
                  50% 0%,
                  61% 35%,
                  98% 35%,
                  68% 57%,
                  79% 91%,
                  50% 70%,
                  21% 91%,
                  32% 57%,
                  2% 35%,
                  39% 35%
                )`,
              }}
            />
          ) : (
            <div
              className={`absolute inset-0 shadow-sm pointer-events-none ${
                element.shapeType === "rectangle" ? "rounded-lg" : ""
              } ${element.shapeType === "circle" ? "rounded-full" : ""}`}
              style={{
                backgroundColor: element.fillColor || "#FFFFFF",
                borderWidth: "2px",
                borderColor: element.strokeColor || "#4F46E5",
                opacity: 0.85,
              }}
            />
          )}
        </>
      )}

      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            className={`relative z-[1] w-full h-full p-2 text-xs text-gray-800 break-words resize-none border-0 outline-none bg-transparent font-inherit text-inherit whitespace-pre-wrap ${
              isTextOnly
                ? "border border-dashed border-gray-400 rounded bg-white/60"
                : ""
            }`}
            autoFocus
            defaultValue={element.content}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              fontSize: `${fontSize}px`,
              textAlign: textAlign,
              fontWeight: isBold ? "bold" : "normal",
              fontStyle: isItalic ? "italic" : "normal",
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
            isTextOnly
              ? "border border-dashed border-transparent rounded group-hover:border-gray-400 group-hover:bg-white/60"
              : "flex"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
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
          {element.content ? (
            <span style={{ textAlign: textAlign }}>{element.content}</span>
          ) : (
            <span
              className={`text-gray-400 italic text-xs ${isTextOnly ? "" : "absolute"}`}
            >
              {isTextOnly ? "Double-click to type" : "Double-click to add text"}
            </span>
          )}
        </div>
      )}

      {/* Font size buttons - always visible */}
      {!isEditing && (
        <div
          className={`absolute -top-4 left-25 flex gap-1 z-[50] ${isEditing ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
        >
          <button
            type="button"
            title="Decrease font size"
            onClick={() => handleFontSizeChange(Math.max(8, fontSize - 2))}
            className="w-6 h-6 rounded border border-gray-300 bg-white text-gray-600 text-xs flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            −
          </button>
          <div className="w-10 h-6 rounded border border-gray-300 bg-white text-gray-600 text-xs flex items-center justify-center shadow-sm select-none pointer-events-none">
            {fontSize}px
          </div>
          <button
            type="button"
            title="Increase font size"
            onClick={() => handleFontSizeChange(Math.min(20, fontSize + 2))}
            className="w-6 h-6 rounded border border-gray-300 bg-white text-gray-600 text-xs flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            +
          </button>
        </div>
      )}

      {/* Horizontal text align buttons - always visible */}
      <div
        className={`absolute -top-4 left-0 flex gap-1 z-[50] ${isEditing ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
      >
        <button
          type="button"
          title="Align left"
          onClick={() => handleTextAlignChange("left")}
          className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
            textAlign === "left"
              ? "bg-indigo-100 border-indigo-400 text-indigo-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ⬅
        </button>
        <button
          type="button"
          title="Align center"
          onClick={() => handleTextAlignChange("center")}
          className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
            textAlign === "center"
              ? "bg-indigo-100 border-indigo-400 text-indigo-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ⬌
        </button>
        <button
          type="button"
          title="Align right"
          onClick={() => handleTextAlignChange("right")}
          className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
            textAlign === "right"
              ? "bg-indigo-100 border-indigo-400 text-indigo-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ➡
        </button>
      </div>

      {/* Vertical text align buttons - always visible */}
      <div
        className={`absolute top-4 -left-4 flex flex-col gap-1 z-[50] ${isEditing ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
      >
        <button
          type="button"
          title="Align top"
          onClick={() => handleVerticalAlignChange("top")}
          className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
            verticalAlign === "top"
              ? "bg-indigo-100 border-indigo-400 text-indigo-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ⬆
        </button>
        <button
          type="button"
          title="Align middle"
          onClick={() => handleVerticalAlignChange("middle")}
          className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
            verticalAlign === "middle"
              ? "bg-indigo-100 border-indigo-400 text-indigo-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ⬌
        </button>
        <button
          type="button"
          title="Align bottom"
          onClick={() => handleVerticalAlignChange("bottom")}
          className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
            verticalAlign === "bottom"
              ? "bg-indigo-100 border-indigo-400 text-indigo-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ⬇
        </button>
      </div>

      {/* Text formatting buttons - normal, bold and italic */}
      {isEditing && (
        <div className="absolute -top-4 left-64 flex gap-1 z-[50] ">
          <button
            type="button"
            title="Normal"
            onClick={handleNormalToggle}
            className={`w-6 h-6 rounded border text-xs flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
              !isBold && !isItalic
                ? "bg-indigo-100 border-indigo-400 text-indigo-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            N
          </button>
          <button
            type="button"
            title="Bold"
            onClick={handleBoldToggle}
            className={`w-6 h-6 rounded border text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
              isBold
                ? "bg-indigo-100 border-indigo-400 text-indigo-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            B
          </button>
          <button
            type="button"
            title="Italic"
            onClick={handleItalicToggle}
            className={`w-6 h-6 rounded border text-xs italic flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
              isItalic
                ? "bg-indigo-100 border-indigo-400 text-indigo-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            I
          </button>
        </div>
      )}
      <button
        type="button"
        className={`absolute -top-1 -right-2 w-6 h-6 rounded-full border border-gray-300 bg-white text-gray-500 text-sm leading-none flex items-center justify-center cursor-pointer shadow-sm transition-opacity z-[2] hover:bg-red-50 hover:text-red-700 hover:border-red-300 ${
          isEditing
            ? "opacity-0 pointer-events-none"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        }`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleDeleteClick}
        aria-label="Delete"
        title="Delete"
      >
        ×
      </button>

      {/* Color picker buttons - vertically stacked below delete button */}
      <div
        className={`absolute top-7 -right-2 flex flex-col gap-1 z-[100] transition-opacity ${
          isEditing
            ? "opacity-0 pointer-events-none"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        }`}
      >
        <ColorButton isSoft={false} onColorSelect={handleStrokeColorChange} />
        <ColorButton isSoft={true} onColorSelect={handleFillColorChange} />
      </div>

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
