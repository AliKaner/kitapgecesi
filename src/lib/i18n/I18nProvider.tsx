"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import tr from "./dictionaries/tr";
import en from "./dictionaries/en";

export type Locale = "tr" | "en";

const DICTIONARIES: Record<Locale, Record<string, string>> = { tr, en };
const LOCALE_KEY = "kg_locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof tr, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("tr");
  const updateLocale = useMutation(api.users.updateLocale);

  useEffect(() => {
    // Sync persisted locale (account preference or local storage) on mount/login.
    if (user?.locale) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(user.locale);
      return;
    }
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "tr" || stored === "en") setLocaleState(stored);
  }, [user?.locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
    if (user) updateLocale({ userId: user._id, locale: next });
  }, [user, updateLocale]);

  const t = useCallback((key: keyof typeof tr, vars?: Record<string, string | number>) => {
    let text = DICTIONARIES[locale][key] ?? DICTIONARIES.tr[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT, I18nProvider içinde kullanılmalı.");
  return ctx;
}
