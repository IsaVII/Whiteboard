import ColorButton from "./ColorButton";
import ToolbarButton from "./ToolbarButton";

/**
 * Formatting toolbar for selected canvas elements (not while editing).
 * Shows font size, alignment, color, and delete controls.
 */
const ElementToolbar = ({
  fontSize,
  onFontSizeChange,
  textAlign,
  onTextAlignChange,
  verticalAlign,
  onVerticalAlignChange,
  onFontColorChange,
  isTextOnly,
  onStrokeColorChange,
  onFillColorChange,
  onDeleteClick,
}) => (
  <>
    <div className="flex items-center gap-1">
      <ToolbarButton
        title="Decrease font size"
        className="text-xs rounded"
        onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
      >
        −
      </ToolbarButton>
      <div className="w-10 h-6 rounded border border-gray-300 bg-white text-gray-600 text-xs flex items-center justify-center shadow-sm select-none">
        {fontSize}px
      </div>
      <ToolbarButton
        title="Increase font size"
        className="text-xs rounded"
        onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
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
        onClick={() => onTextAlignChange("left")}
      >
        ⬅
      </ToolbarButton>
      <ToolbarButton
        title="Align center"
        className="text-xs rounded"
        active={textAlign === "center"}
        onClick={() => onTextAlignChange("center")}
      >
        ⬌
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        className="text-xs rounded"
        active={textAlign === "right"}
        onClick={() => onTextAlignChange("right")}
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
        onClick={() => onVerticalAlignChange("top")}
      >
        ⬆
      </ToolbarButton>
      <ToolbarButton
        title="Align middle"
        className="text-xs rounded"
        active={verticalAlign === "middle"}
        onClick={() => onVerticalAlignChange("middle")}
      >
        ⬌
      </ToolbarButton>
      <ToolbarButton
        title="Align bottom"
        className="text-xs rounded"
        active={verticalAlign === "bottom"}
        onClick={() => onVerticalAlignChange("bottom")}
      >
        ⬇
      </ToolbarButton>
    </div>

    <div className="w-px h-5 bg-gray-200" />

    <div className="flex items-center gap-2">
      <ColorButton
        isSoft={false}
        onColorSelect={onFontColorChange}
        alwaysVisible
        label="A"
      />
      {!isTextOnly && (
        <>
          <ColorButton
            isSoft={false}
            onColorSelect={onStrokeColorChange}
            alwaysVisible
          />
          <ColorButton
            isSoft={true}
            onColorSelect={onFillColorChange}
            alwaysVisible
          />
        </>
      )}
    </div>

    <div className="w-px h-5 bg-gray-200" />

    <ToolbarButton
      tone="danger"
      className="text-sm leading-none rounded-full"
      onClick={onDeleteClick}
      title="Delete"
      aria-label="Delete"
    >
      ×
    </ToolbarButton>
  </>
);

export default ElementToolbar;
