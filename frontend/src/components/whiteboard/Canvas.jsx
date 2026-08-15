import { createPortal } from "react-dom";
import Modal from "../Modal";
import CanvasButton from "./CanvasButton";
import RemoteCursor from "./RemoteCursor";
import CanvasElement from "./CanvasElement";
import { useCanvas } from "../../redux/actions/useCanvas.js";
import "./Canvas.css";

const Canvas = () => {
  const {
    canvasRef,
    boardId,
    elements,
    cursors,
    viewport,
    selectedElementId,
    setSelectedElementId,
    toolbarNode,
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
  } = useCanvas();

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onMouseDown={handleMouseDown}
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
            selected={element.id === selectedElementId}
            onSelect={() => setSelectedElementId(element.id)}
            toolbarPortalNode={toolbarNode}
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

      {/* Formatting controls toolbar portal target */}
      <div
        ref={setToolbarNode}
        className={`canvas-element-toolbar ${
          selectedElementId ? "canvas-element-toolbar--visible" : ""
        }`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-100">
        <CanvasButton
          onClick={() => zoomBy(1.25)}
          title="Zoom in"
          ariaLabel="Zoom in"
        >
          +
        </CanvasButton>
        <CanvasButton
          onClick={() => zoomBy(0.8)}
          title="Zoom out"
          ariaLabel="Zoom out"
        >
          −
        </CanvasButton>
        <CanvasButton
          onClick={resetView}
          title="Reset view"
          ariaLabel="Reset view"
        >
          ⟲
        </CanvasButton>
      </div>

      {/* Delete all elements button */}
      <CanvasButton
        onClick={handleDeleteAllClick}
        title="Delete all elements"
        ariaLabel="Delete all elements"
        variant="danger"
        className="absolute top-3 right-3 z-100"
      >
        🗑️
      </CanvasButton>

      {/* Delete all confirmation modal */}
      {createPortal(
        <Modal
          isOpen={showDeleteAllModal}
          title="Delete All Elements"
          message="Are you REALLY sure you want to delete ALL ELEMENTS?"
          onConfirm={confirmDeleteAll}
          onCancel={() => setShowDeleteAllModal(false)}
          confirmText="Yes, Delete All"
          cancelText="Cancel"
        />,
        document.body,
      )}
    </div>
  );
};

export default Canvas;
