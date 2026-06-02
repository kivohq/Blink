import { create } from "zustand";

const DEFAULT_THEME = "system";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem("chat-theme") || DEFAULT_THEME,
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.className = theme;
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      let nextTheme: string;
      if (state.theme === "system") {
        nextTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
      } else if (state.theme === "light") {
        nextTheme = "dark";
      } else if (state.theme === "dark") {
        nextTheme = "high-contrast";
      } else {
        nextTheme = "light";
      }
      localStorage.setItem("chat-theme", nextTheme);
      document.documentElement.className = nextTheme;
      return { theme: nextTheme };
    });
  },
}));
