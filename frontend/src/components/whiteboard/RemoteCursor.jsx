import "./RemoteCursor.css";

function RemoteCursor({ name, color, x, y }) {
  return (
    <div
      className="remote-cursor"
      style={{ left: `${x}px`, top: `${y}px`, color: color }}
    >
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
      <span className="remote-cursor-label">{name}</span>
    </div>
  );
}

export default RemoteCursor;
