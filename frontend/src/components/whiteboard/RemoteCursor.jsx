import "./RemoteCursor.css";

// Map Tailwind color classes to hex values
const tailwindColorMap = {
  "bg-blue-400": "#60a5fa",
  "bg-purple-400": "#c084fc",
  "bg-pink-400": "#f472b6",
  "bg-green-400": "#4ade80",
  "bg-yellow-400": "#facc15",
  "bg-red-400": "#f87171",
  "bg-indigo-400": "#818cf8",
  "bg-cyan-400": "#22d3ee",
  "bg-orange-400": "#fb923c",
  "bg-teal-400": "#2dd4bf",
};

function RemoteCursor({ name, color, x, y }) {
  const hexColor = tailwindColorMap[color] || "#60a5fa";

  return (
    <div
      className="remote-cursor"
      style={{ left: `${x}px`, top: `${y}px`, color: hexColor }}
    >
      <div className="flex items-center gap-1">
        <svg
          className="remote-cursor-pointer"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M2 2L8.5 17.5L11 11L17.5 8.5L2 2Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-bold whitespace-nowrap">{name}</span>
      </div>
    </div>
  );
}

export default RemoteCursor;
