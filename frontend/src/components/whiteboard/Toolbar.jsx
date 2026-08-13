import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../redux/services/socket";
import { elementAdded, toolTypeSelected } from "../../redux/slices/boardSlice";
import ToolbarButton from "./ToolbarButton";
import "./Toolbar.css";

const SHAPE_OPTIONS = [
  { type: "rectangle", label: "Rectangle", icon: "▭" },
  { type: "circle", label: "Circle", icon: "●" },
  { type: "star", label: "Star", icon: "★" },
];

const DEFAULT_SIZES = {
  rectangle: { width: 160, height: 100 },
  circle: { width: 120, height: 120 },
  star: { width: 130, height: 130 },
  text: { width: 180, height: 40 },
};

function createElementId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `el-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const Toolbar = () => {
  const dispatch = useDispatch();
  const boardId = useSelector((state) => state.board.boardId);
  const userName = useSelector((state) => state.user.name);
  const selectedToolType =
    useSelector((state) => state.board.selectedToolType) || "rectangle";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const spawnCountRef = useRef(0);

  // Close the dropdown on an outside click/tap.
  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const handleOutsidePointerDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [dropdownOpen]);

  // Spread newly created elements out a little so repeated clicks don't
  // stack exactly on top of each other. Positions are in the canvas's
  // untransformed content space (see Canvas.jsx's toCanvasCoords) - we
  // don't have the current pan/zoom here, so this is a simple, cheap
  // default rather than a "centered in view" placement.
  const nextSpawnPosition = () => {
    const step = spawnCountRef.current % 8;
    spawnCountRef.current += 1;
    return { x: 120 + step * 24, y: 120 + step * 18 };
  };

  const spawnElement = (type, shapeType) => {
    if (!boardId) return;

    const size = DEFAULT_SIZES[shapeType || type];
    const { x, y } = nextSpawnPosition();

    const element = {
      id: createElementId(),
      type, // "shape" | "text"
      shapeType: shapeType || null,
      x,
      y,
      width: size.width,
      height: size.height,
      content: "",
      createdBy: userName || "Someone",
    };

    // Optimistic local add; the server only echoes this to *other*
    // clients (see socketHandlers.js), so we add it ourselves here.
    dispatch(elementAdded(element));
    socket.emit("element-added", { boardId, element });
  };

  const handleShapeShortPress = () => {
    spawnElement("shape", selectedToolType);
    setDropdownOpen(false);
  };

  const handleShapeLongPress = () => {
    setDropdownOpen(true);
  };

  const handleShapeOptionClick = (type) => {
    dispatch(toolTypeSelected(type));
    spawnElement("shape", type);
    setDropdownOpen(false);
  };

  const handleTextClick = () => {
    spawnElement("text", null);
  };

  const activeShape =
    SHAPE_OPTIONS.find((s) => s.type === selectedToolType) ||
    SHAPE_OPTIONS[0];

  return (
    <div className="toolbar">
      <div ref={dropdownRef} className="toolbar-shape-button">
        <ToolbarButton
          icon={activeShape.icon}
          label={`Add ${activeShape.label} (hold for more shapes)`}
          onClick={handleShapeShortPress}
          onLongPress={handleShapeLongPress}
          active={dropdownOpen}
        >
          {dropdownOpen && (
            <div className="toolbar-dropdown">
              {SHAPE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  className={`toolbar-dropdown-item${
                    option.type === selectedToolType
                      ? " toolbar-dropdown-item--active"
                      : ""
                  }`}
                  onClick={() => handleShapeOptionClick(option.type)}
                >
                  <span className="toolbar-dropdown-icon">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </ToolbarButton>
      </div>

      <ToolbarButton icon="T" label="Add text box" onClick={handleTextClick} />
    </div>
  );
};

export default Toolbar;
