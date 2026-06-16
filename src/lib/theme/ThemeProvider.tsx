"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth/AuthProvider";

const THEME_KEY = "kg_theme_accent";
const MODE_KEY = "kg_theme_mode";
const DEFAULT_ACCENT = "#5B913B";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  accent: string;
  setAccent: (color: string) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyMode(mode: ThemeMode) {
  if (mode === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [mode, setModeState] = useState<ThemeMode>("light");
  const updateThemeColor = useMutation(api.users.updateThemeColor);

  useEffect(() => {
    // Sync persisted accent color (account preference or local storage) onto the document root.
    const next = user?.themeColor ?? localStorage.getItem(THEME_KEY) ?? DEFAULT_ACCENT;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccentState(next);
    document.documentElement.style.setProperty("--theme-accent", next);
  }, [user?.themeColor]);

  useEffect(() => {
    // Restore persisted dark/light mode (the pre-paint script in <head> already
    // applied the attribute; this keeps React state in sync).
    const stored = localStorage.getItem(MODE_KEY);
    const next: ThemeMode = stored === "dark" ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(next);
    applyMode(next);
  }, []);

  const setAccent = useCallback((color: string) => {
    setAccentState(color);
    document.documentElement.style.setProperty("--theme-accent", color);
    localStorage.setItem(THEME_KEY, color);
    if (user) updateThemeColor({ userId: user._id, themeColor: color });
  }, [user, updateThemeColor]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyMode(next);
    localStorage.setItem(MODE_KEY, next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ accent, setAccent, mode, setMode, toggleMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı.");
  return ctx;
}
