import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../redux/services/socket";
import {
  elementAdded,
  toolTypeSelected,
  outlineToggled,
} from "../../redux/slices/boardSlice";
import ToolbarButton from "./ToolbarButton";

const SHAPE_OPTIONS = [
  { type: "rectangle", label: "Rectangle", icon: "▭" },
  { type: "circle", label: "Circle", icon: "●" },
  { type: "triangle", label: "Triangle", icon: "▲" },
  { type: "diamond", label: "Diamond", icon: "◆" },
  { type: "arrow", label: "Arrow", icon: "➤" },
  { type: "pentagon", label: "Pentagon", icon: "⬟" },
  { type: "star", label: "Star", icon: "★" },
  { type: "heart", label: "Heart", icon: "♥" },
];

const DEFAULT_SIZES = {
  rectangle: { width: 160, height: 100 },
  circle: { width: 120, height: 120 },
  triangle: { width: 130, height: 130 },
  diamond: { width: 120, height: 120 },
  arrow: { width: 140, height: 80 },
  pentagon: { width: 130, height: 130 },
  star: { width: 130, height: 130 },
  heart: { width: 120, height: 130 },
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
  const lastStrokeColor = useSelector((state) => state.board.lastStrokeColor);
  const lastFillColor = useSelector((state) => state.board.lastFillColor);
  const lastFontColor = useSelector((state) => state.board.lastFontColor);
  const lastShowStroke = useSelector((state) => state.board.lastShowStroke);

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
      strokeColor: lastStrokeColor,
      fillColor: lastFillColor,
      fontColor: lastFontColor,
      showStroke: lastShowStroke !== false,
    };

    // Optimistic local add; the server only echoes this to *other*
    // clients (see socketHandlers.js), so we add it ourselves here.
    dispatch(elementAdded(element));
    socket.emit("element-added", { boardId, element });
  };

  const handleShapeClick = () => {
    spawnElement("shape", selectedToolType);
  };

  const handleShapeArrowClick = () => {
    setDropdownOpen(!dropdownOpen);
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
    SHAPE_OPTIONS.find((s) => s.type === selectedToolType) || SHAPE_OPTIONS[0];

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-[10px] shadow-sm w-fit mx-auto my-3">
      <div ref={dropdownRef} className="relative">
        <ToolbarButton
          showArrow={SHAPE_OPTIONS.length > 1}
          onArrowClick={handleShapeArrowClick}
          onClick={handleShapeClick}
          active={dropdownOpen}
          title={`Add ${activeShape.label}`}
        >
          {activeShape.icon}
        </ToolbarButton>
        {dropdownOpen && (
          <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 flex flex-col gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-50 min-w-[150px]">
            {SHAPE_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                className={`flex items-center gap-2 px-2.5 py-1.5 border-0 bg-transparent rounded-md text-xs text-gray-700 cursor-pointer text-left hover:bg-gray-100 transition-colors ${
                  option.type === selectedToolType
                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                    : ""
                }`}
                onClick={() => handleShapeOptionClick(option.type)}
              >
                <span className="text-sm w-4.5 text-center">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarButton icon="T" label="Add text box" onClick={handleTextClick}>
        T
      </ToolbarButton>
    </div>
  );
};

export default Toolbar;
