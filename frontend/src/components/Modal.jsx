import React from "react";

/**
 * Modal component for displaying confirmation dialogs
 * @param {boolean} isOpen - whether the modal is visible
 * @param {string} title - modal title
 * @param {string} message - modal message
 * @param {Function} onConfirm - callback when "Yes" is clicked
 * @param {Function} onCancel - callback when "No" or backdrop is clicked
 * @param {string} confirmText - text for confirm button (default: "Yes")
 * @param {string} cancelText - text for cancel button (default: "No")
 */
const Modal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black z-[9998] pointer-events-auto"
        style={{ opacity: 0.5 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Modal */}
      <div
        className="fixed rounded-lg shadow-xl p-6 z-[9999] max-w-sm w-full mx-4 pointer-events-auto"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "var(--bg_modal)",
          color: "var(--text)",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            className="text-lg font-bold mb-3"
            style={{ color: "var(--text-h)" }}
          >
            {title}
          </h2>
        )}
        <p className="mb-6" style={{ color: "var(--text)" }}>
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded transition-colors pointer-events-auto"
            style={{
              backgroundColor: "var(--bg_modal)",
              color: "var(--text)",
              borderColor: "var(--border)",
              borderWidth: "1px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg_modal)";
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};

export default Modal;
