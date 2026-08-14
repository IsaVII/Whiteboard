import { useCallback, useRef, useState, useEffect } from "react";
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
const CanvasElement = ({ element, boardId, scale }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Local buffer for the textarea while editing only. Everything else
  // (fontSize, textAlign, verticalAlign, the non-editing display text) is
  // read directly from `element` below so a remote update always shows up
  // immediately instead of needing a page refresh.
  const [editValue, setEditValue] = useState("");
  const lastEmitRef = useRef(0);
  const textareaRef = useRef(null);
  const measureDivRef = useRef(null);
  const pendingSelectionRef = useRef(null); // {start, end} to restore after a formatting toggle

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
    // Measure and update size before closing edit mode
    if (!isTextOnly && textarea) {
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

      {/* Font size buttons */}
      <ToolbarGroup position="-top-4 left-25" hidden={isEditing}>
        <ToolbarButton
          title="Decrease font size"
          className="text-xs rounded"
          onClick={() => handleFontSizeChange(Math.max(8, fontSize - 2))}
        >
          −
        </ToolbarButton>
        <div className="w-10 h-6 rounded border border-gray-300 bg-white text-gray-600 text-xs flex items-center justify-center shadow-sm select-none pointer-events-none">
          {fontSize}px
        </div>
        <ToolbarButton
          title="Increase font size"
          className="text-xs rounded"
          onClick={() => handleFontSizeChange(Math.min(20, fontSize + 2))}
        >
          +
        </ToolbarButton>
      </ToolbarGroup>

      {/* Horizontal text align buttons */}
      <ToolbarGroup position="-top-4 left-0" hidden={isEditing}>
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
      </ToolbarGroup>

      {/* Vertical text align buttons */}
      <ToolbarGroup position="top-4 -left-4" direction="col" hidden={isEditing}>
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
      </ToolbarGroup>

      {/* Text formatting buttons - normal, bold and italic. Mounted only
          while editing (rather than faded like the groups above), and each
          one keeps focus on the textarea so clicking it doesn't blur out
          of edit mode. */}
      {isEditing && (
        <div className="absolute -top-4 left-64 flex gap-1 z-[50]">
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

      <ToolbarButton
        tone="danger"
        hidden={isEditing}
        className="text-sm leading-none rounded-full absolute -top-1 -right-2 z-[2]"
        onClick={handleDeleteClick}
        title="Delete"
        aria-label="Delete"
      >
        ×
      </ToolbarButton>

      {/* Color picker buttons - vertically stacked below delete button */}
      <ToolbarGroup position="top-7 -right-2" direction="col" hidden={isEditing}>
        <ColorButton isSoft={false} onColorSelect={handleStrokeColorChange} />
        <ColorButton isSoft={true} onColorSelect={handleFillColorChange} />
      </ToolbarGroup>

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
