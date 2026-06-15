"use client";

import { CSSProperties, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

/* Centered modal dialog over a dimmed backdrop. Closes on Esc, on backdrop
   click, and via the corner ✕. Renders into <body> through a portal. */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 420 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(20, 20, 20, 0.45)",
        backdropFilter: "blur(2px)",
      } as CSSProperties}
    >
      <div
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          padding: 24,
        } as CSSProperties}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
          {title ? (
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.15 }}>{title}</h2>
          ) : (
            <span />
          )}
          <button
            aria-label="Kapat"
            onClick={onClose}
            style={{
              flex: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
            } as CSSProperties}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
