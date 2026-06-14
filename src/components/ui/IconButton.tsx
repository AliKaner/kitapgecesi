"use client";

import { ButtonHTMLAttributes, CSSProperties, useState } from "react";
import { Icon, IconName } from "./Icon";

/* Round/soft icon-only button. Used for the search trigger, post overflow
   menus, and the feed reaction row (with optional count). */

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  size?: number;
  iconSize?: number;
  count?: number | string | null;
  active?: boolean;
  label?: string;
  variant?: "ghost" | "outline";
}

export function IconButton({
  icon,
  size = 38,
  iconSize,
  count,
  active = false,
  label,
  variant = "ghost",
  style,
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const is = iconSize || Math.round(size * 0.5);
  const hasCount = count !== undefined && count !== null;
  const tint = active ? "var(--accent)" : "var(--text-secondary)";
  return (
    <button
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: size,
        padding: hasCount ? "0 10px 0 8px" : 0,
        width: hasCount ? "auto" : size,
        minWidth: size,
        justifyContent: "center",
        border: variant === "outline" ? "1px solid var(--border-default)" : "none",
        borderRadius: "10px",
        background: hover ? "var(--surface-sunken)" : "transparent",
        color: tint,
        cursor: "pointer",
        transition: "background var(--dur-fast) var(--ease-soft), color var(--dur-fast)",
        ...style,
      } as CSSProperties}
      {...rest}
    >
      <Icon name={icon} size={is} fill={active && (icon === "heart" || icon === "star" || icon === "bookmark")} />
      {hasCount && (
        <span
          style={{
            fontSize: "var(--fs-body-3)",
            fontWeight: "var(--fw-medium)",
            color: active ? "var(--accent)" : "var(--text-secondary)",
            fontVariantNumeric: "tabular-nums",
          } as CSSProperties}
        >
          {count}
        </span>
      )}
    </button>
  );
}
