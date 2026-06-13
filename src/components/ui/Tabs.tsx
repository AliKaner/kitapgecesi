"use client";

import { CSSProperties, HTMLAttributes, useState } from "react";

/* Tabs — two looks driven by `variant`:
   • "underline" (default): editorial text tabs with a green active rule,
     as on the profile (Profil / Aktivite / Kitaplık / Günlük).
   • "segmented": a sand-filled pill group with a white active capsule,
     as on the journal range (Gün / Hafta / Ay / Yıl) and theme picker. */

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: (TabItem | string)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: "underline" | "segmented";
  size?: "sm" | "md";
}

export function Tabs({ items = [], value, defaultValue, onChange, variant = "underline", size = "md", style, ...rest }: TabsProps) {
  const opts: TabItem[] = items.map((it) => (typeof it === "string" ? { value: it, label: it } : it));
  const [internal, setInternal] = useState(defaultValue ?? opts[0]?.value);
  const active = value !== undefined ? value : internal;
  const pick = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  if (variant === "segmented") {
    const h = size === "sm" ? 32 : 38;
    return (
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          gap: 3,
          padding: 3,
          background: "var(--surface-sunken)",
          borderRadius: "var(--radius-pill)",
          ...style,
        } as CSSProperties}
        {...rest}
      >
        {opts.map((o) => {
          const on = o.value === active;
          return (
            <button
              key={o.value}
              role="tab"
              aria-selected={on}
              onClick={() => pick(o.value)}
              style={{
                height: h,
                padding: "0 16px",
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
                background: on ? "var(--surface-card)" : "transparent",
                color: on ? "var(--text-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-btn-md)",
                fontWeight: "var(--fw-medium)",
                whiteSpace: "nowrap",
                boxShadow: on ? "var(--shadow-xs)" : "none",
                transition: "background var(--dur-fast), color var(--dur-fast)",
              } as CSSProperties}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  // underline
  return (
    <div role="tablist" style={{ display: "flex", gap: 26, borderBottom: "1px solid var(--border-default)", ...style } as CSSProperties} {...rest}>
      {opts.map((o) => {
        const on = o.value === active;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => pick(o.value)}
            style={{
              position: "relative",
              padding: "0 0 12px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-h3)",
              fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
              transition: "color var(--dur-fast)",
            } as CSSProperties}
          >
            {o.label}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
                height: 2,
                borderRadius: 2,
                background: on ? "var(--accent)" : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
