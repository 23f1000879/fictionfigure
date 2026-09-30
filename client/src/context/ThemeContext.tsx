"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "day" | "night";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "fictionfigure_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("day");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "night") {
        setThemeState("night");
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "night");
      } else {
        setThemeState("day");
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "day");
      }
    } catch (e) {}
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      if (nextTheme === "night") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "night");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "day");
      }

      // Update meta theme-color for mobile browser status bar
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", nextTheme === "night" ? "#08090B" : "#FFFFFF");
      }
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme(theme === "day" ? "night" : "day");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
