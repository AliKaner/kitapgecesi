"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth/AuthProvider";

const THEME_KEY = "kg_theme_accent";
const DEFAULT_ACCENT = "#5B913B";

interface ThemeContextValue {
  accent: string;
  setAccent: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const updateThemeColor = useMutation(api.users.updateThemeColor);

  useEffect(() => {
    // Sync persisted accent color (account preference or local storage) onto the document root.
    const next = user?.themeColor ?? localStorage.getItem(THEME_KEY) ?? DEFAULT_ACCENT;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccentState(next);
    document.documentElement.style.setProperty("--theme-accent", next);
  }, [user?.themeColor]);

  const setAccent = useCallback((color: string) => {
    setAccentState(color);
    document.documentElement.style.setProperty("--theme-accent", color);
    localStorage.setItem(THEME_KEY, color);
    if (user) updateThemeColor({ userId: user._id, themeColor: color });
  }, [user, updateThemeColor]);

  return <ThemeContext.Provider value={{ accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı.");
  return ctx;
}
