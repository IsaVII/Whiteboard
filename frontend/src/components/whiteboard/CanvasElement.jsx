import { createPortal } from "react-dom";
import Modal from "../Modal";
import ToolbarButton from "./ToolbarButton";
import ToolbarGroup from "./ToolbarGroup";
import ShapeBackground from "./ShapeBackground";
import FormattedText from "./FormattedText";
import ElementToolbar from "./ElementToolbar";
import { useCanvasElement } from "../../redux/actions/useCanvasElement";

const CanvasElement = ({
  element,
  boardId,
  scale,
  selected = false,
  onSelect,
  toolbarPortalNode,
}) => {
  const {
    isTextOnly,
    fontSize,
    textAlign,
    verticalAlign,
    displayContent,
    isEditing,
    editValue,
    resizing,
    rotating,
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
    handleRotatePointerDown,
    handleRotatePointerMove,
    handleRotateEnd,
    handleBoldToggle,
    handleItalicToggle,
    handleNormalToggle,
  } = useCanvasElement({ element, boardId, scale, onSelect });

  return (
    <div
      className={`absolute flex cursor-grab select-none touch-none group ${
        dragging ? "cursor-grabbing z-20" : ""
      } ${rotating ? "z-20" : ""} ${
        selected
          ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent z-30"
          : ""
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: "center center",
      }}
      title={element.createdBy ? `Added by ${element.createdBy}` : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={
        resizing
          ? handleResizePointerMove
          : rotating
            ? handleRotatePointerMove
            : handlePointerMove
      }
      onPointerUp={
        resizing ? handleResizeEnd : rotating ? handleRotateEnd : endDrag
      }
      onPointerCancel={
        resizing ? handleResizeEnd : rotating ? handleRotateEnd : endDrag
      }
      onClick={handleSelect}
      onDoubleClick={handleStartEditing}
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
              color: element.fontColor || "#1F2937",
              transform: `rotate(${-(element.rotation || 0)}deg)`,
              transformOrigin: "center center",
            }}
          />
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
            transform: `rotate(${-(element.rotation || 0)}deg)`,
            transformOrigin: "center center",
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
            <span
              style={{
                textAlign: textAlign,
                color: element.fontColor || "#1F2937",
              }}
            >
              <FormattedText content={displayContent} />
            </span>
          ) : (
            <span
              className={`text-gray-400 italic text-xs ${
                isTextOnly ? "" : "absolute"
              }`}
            >
              {isTextOnly ? "Double-click to type" : "Double-click to add text"}
            </span>
          )}
        </div>
      )}

      {/* Resize controls */}
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
          onDoubleClick={(e) => e.stopPropagation()}
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

      {/* Rotation controls - on all 4 edges */}
      {selected && !isEditing && (
        <>
          {/* Top edge rotation handle */}
          <div
            onPointerDown={handleRotatePointerDown}
            onPointerMove={rotating ? handleRotatePointerMove : undefined}
            onPointerUp={rotating ? handleRotateEnd : undefined}
            onPointerCancel={rotating ? handleRotateEnd : undefined}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute w-5 h-5 rounded-full cursor-grab opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ${
              rotating ? "opacity-100 cursor-grabbing" : ""
            }`}
            title="Drag to rotate"
            style={{
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: rotating ? "rgb(99, 102, 241)" : "white",
              border: "1px solid #d1d5db",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              fontSize: "10px",
            }}
          >
            ⤴
          </div>

          {/* Right edge rotation handle */}
          <div
            onPointerDown={handleRotatePointerDown}
            onPointerMove={rotating ? handleRotatePointerMove : undefined}
            onPointerUp={rotating ? handleRotateEnd : undefined}
            onPointerCancel={rotating ? handleRotateEnd : undefined}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute w-5 h-5 rounded-full cursor-grab opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ${
              rotating ? "opacity-100 cursor-grabbing" : ""
            }`}
            title="Drag to rotate"
            style={{
              right: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: rotating ? "rgb(99, 102, 241)" : "white",
              border: "1px solid #d1d5db",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              fontSize: "10px",
            }}
          >
            ⤳
          </div>

          {/* Bottom edge rotation handle */}
          <div
            onPointerDown={handleRotatePointerDown}
            onPointerMove={rotating ? handleRotatePointerMove : undefined}
            onPointerUp={rotating ? handleRotateEnd : undefined}
            onPointerCancel={rotating ? handleRotateEnd : undefined}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute w-5 h-5 rounded-full cursor-grab opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ${
              rotating ? "opacity-100 cursor-grabbing" : ""
            }`}
            title="Drag to rotate"
            style={{
              bottom: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: rotating ? "rgb(99, 102, 241)" : "white",
              border: "1px solid #d1d5db",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              fontSize: "10px",
            }}
          >
            ⤵
          </div>

          {/* Left edge rotation handle */}
          <div
            onPointerDown={handleRotatePointerDown}
            onPointerMove={rotating ? handleRotatePointerMove : undefined}
            onPointerUp={rotating ? handleRotateEnd : undefined}
            onPointerCancel={rotating ? handleRotateEnd : undefined}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute w-5 h-5 rounded-full cursor-grab opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ${
              rotating ? "opacity-100 cursor-grabbing" : ""
            }`}
            title="Drag to rotate"
            style={{
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: rotating ? "rgb(99, 102, 241)" : "white",
              border: "1px solid #d1d5db",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              fontSize: "10px",
            }}
          >
            ⤲
          </div>
        </>
      )}

      {/* Formatting controls toolbar portal */}
      {selected &&
        toolbarPortalNode &&
        createPortal(
          <>
            {!isEditing && (
              <ElementToolbar
                fontSize={fontSize}
                onFontSizeChange={handleFontSizeChange}
                textAlign={textAlign}
                onTextAlignChange={handleTextAlignChange}
                verticalAlign={verticalAlign}
                onVerticalAlignChange={handleVerticalAlignChange}
                onFontColorChange={handleFontColorChange}
                isTextOnly={isTextOnly}
                onStrokeColorChange={handleStrokeColorChange}
                onFillColorChange={handleFillColorChange}
                onDeleteClick={handleDeleteClick}
              />
            )}

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
      {createPortal(
        <Modal
          isOpen={showDeleteModal}
          title="Delete Element"
          message="Are you sure you want to delete this element? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          confirmText="Delete"
          cancelText="Cancel"
        />,
        document.body,
      )}
    </div>
  );
};

export default CanvasElement;
