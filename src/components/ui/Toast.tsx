"use client";

import { useEffect, useState } from "react";

/* Minimal global toast: call showToast("...") from anywhere; mount
   <ToastHost /> once near the root to render it. */

interface ToastItem {
  id: number;
  message: string;
}

let listeners: ((message: string) => void)[] = [];

export function showToast(message: string) {
  listeners.forEach((l) => l(message));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (message: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--text-primary)",
            color: "var(--bg-page)",
            padding: "10px 18px",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-body-2)",
            fontFamily: "var(--font-sans)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
