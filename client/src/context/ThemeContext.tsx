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
  const [theme, setThemeState] = useState<Theme>("night");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      let activeTheme: Theme = "night";

      if (stored === "day" || stored === "night") {
        activeTheme = stored;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        // Respect system preference when no explicit preference is saved
        activeTheme = "day";
      }

      setThemeState(activeTheme);
      if (activeTheme === "night") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "night");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "day");
      }

      // Dynamically react to system preference changes if user has NOT saved an explicit preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handleSystemChange = (e: MediaQueryListEvent) => {
        const hasExplicit = localStorage.getItem(STORAGE_KEY);
        if (!hasExplicit) {
          const sysTheme: Theme = e.matches ? "day" : "night";
          setThemeState(sysTheme);
          if (sysTheme === "night") {
            document.documentElement.classList.add("dark");
            document.documentElement.setAttribute("data-theme", "night");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "day");
          }
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleSystemChange);
        return () => mediaQuery.removeEventListener("change", handleSystemChange);
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
