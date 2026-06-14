"use client";

import { ButtonHTMLAttributes, CSSProperties, ReactNode, useState } from "react";
import { Icon, IconName } from "../ui/Icon";

/* Sidebar navigation row. Active = sand fill + ink text + green icon;
   idle = secondary text that warms on hover. Optional trailing count badge. */

export interface NavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  active?: boolean;
  count?: number | null;
  children?: ReactNode;
}

export function NavItem({ icon, children, active = false, count, style, ...rest }: NavItemProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "100%",
        height: 44,
        padding: "0 14px",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        borderRadius: "10px",
        background: active ? "var(--surface-sunken)" : hover ? "var(--surface-sunken)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-body-1)",
        fontWeight: active ? "var(--fw-semibold)" : "var(--fw-medium)",
        ...style,
      } as CSSProperties}
      {...rest}
    >
      <Icon name={icon} size={21} color={active ? "var(--accent)" : "inherit"} strokeWidth={active ? 2 : 1.75} />
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {count != null && (
        <span
          style={{
            fontSize: "var(--fs-body-3)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-on-accent)",
            background: "var(--accent)",
            borderRadius: "var(--radius-pill)",
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          } as CSSProperties}
        >
          {count}
        </span>
      )}
    </button>
  );
}
