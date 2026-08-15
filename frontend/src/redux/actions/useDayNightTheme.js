import { useEffect, useState } from "react";

export const useDayNightTheme = () => {
  const [theme, setTheme] = useState("light");

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.classList.remove("dark-mode", "light-mode");
    root.classList.add(`${newTheme}-mode`);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const preferredTheme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, toggleTheme };
};
