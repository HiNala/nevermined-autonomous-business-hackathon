"use client";

import { createContext, useContext, useEffect } from "react";

type Theme = "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("light");
    root.classList.remove("dark");
    localStorage.setItem("ab_theme", "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
