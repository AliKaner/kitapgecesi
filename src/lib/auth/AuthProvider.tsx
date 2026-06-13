"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";

const TOKEN_KEY = "kg_session_token";

interface AuthContextValue {
  user: Doc<"users"> | null | undefined;
  token: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (args: { name: string; username: string; email: string; password: string; inviteCode: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage is only available after client mount; sync it once here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(localStorage.getItem(TOKEN_KEY));
    setHydrated(true);
  }, []);

  const user = useQuery(api.auth.getCurrentUser, hydrated ? { token: token ?? undefined } : "skip");

  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);
  const logoutMutation = useMutation(api.auth.logout);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const result = await loginMutation({ usernameOrEmail, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  }, [loginMutation]);

  const register = useCallback(async (args: { name: string; username: string; email: string; password: string; inviteCode: string }) => {
    const result = await registerMutation(args);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    if (token) await logoutMutation({ token });
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, [logoutMutation, token]);

  const isLoading = !hydrated || (token !== null && user === undefined);

  return (
    <AuthContext.Provider value={{ user: hydrated ? user : undefined, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return ctx;
}
