import { useEffect, useState } from "react";
import BoardManager from "./BoardManager";
import { useDayNightTheme } from "../redux/actions/useDayNightTheme.js";

const Header = () => {
  const { theme, toggleTheme } = useDayNightTheme();

  return (
    <header
      style={{
        backgroundColor: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        color: "var(--text-h)",
        transition: "background-color 0.3s, border-color 0.3s, color 0.3s",
      }}
      className="p-4 shadow-sm"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 flex-wrap">
        <div className="flex items-center gap-3">
          <img
            src={theme === "dark" ? "/icon_dark.png" : "/icon.png"}
            alt="Whiteboard icon"
            className="h-10 w-10"
          />
          <h1 className="m-0 font-bold min-w-fit">Whiteboard</h1>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <BoardManager />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              transition: "background-color 0.3s, color 0.3s",
            }}
            className="px-4 py-2 rounded font-semibold hover:opacity-90 active:opacity-75"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
