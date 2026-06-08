import React, { useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";

/**
 * ThemeProvider wraps the application and synchronises the selected theme
 * with the HTML root element. It reads the current theme from `useThemeStore`
 * and applies the appropriate class (`dark`, `high-contrast`) and a `data-theme`
 * attribute for CSS variable usage.
 */
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    // Reset any previously applied theme classes
    root.classList.remove("dark", "high-contrast");
    // Determine which theme should be active
    const isSystemDark = theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (theme === "dark" || isSystemDark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else if (theme === "high-contrast") {
      root.classList.add("high-contrast");
      root.setAttribute("data-theme", "high-contrast");
    } else {
      // light or system (light) fallback
      root.setAttribute("data-theme", "light");
    }
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
