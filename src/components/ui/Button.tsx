"use client";

import { ButtonHTMLAttributes, CSSProperties, useState } from "react";
import { Icon, IconName } from "./Icon";

/* KitapGecesi Button — pill-shaped, Inter Medium.
   Variants: primary (green), secondary (near-black ink), menu (sand fill,
   hairline), ghost (transparent). Sizes lg / md / sm map to the spec's
   button text sizes (16 / 14 / 12). */

const SIZES = {
  lg: { height: 48, padding: "0 24px", font: "var(--fs-btn-lg)", gap: 8, icon: 20 },
  md: { height: 40, padding: "0 18px", font: "var(--fs-btn-md)", gap: 7, icon: 18 },
  sm: { height: 32, padding: "0 14px", font: "var(--fs-btn-sm)", gap: 6, icon: 15 },
};

const VARIANTS = {
  primary: {
    background: "var(--btn-primary-bg)",
    color: "var(--text-on-accent)",
    border: "1px solid transparent",
    hover: "var(--accent-hover)",
    active: "var(--accent-active)",
  },
  secondary: {
    background: "var(--btn-secondary-bg)",
    color: "#fff",
    border: "1px solid transparent",
    hover: "#3F3F46",
    active: "#18181B",
  },
  menu: {
    background: "var(--btn-menu-bg)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-default)",
    hover: "#EFEDE7",
    active: "#E7E4DC",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid transparent",
    hover: "var(--surface-sunken)",
    active: "#EFEDE7",
  },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth = false,
  disabled = false,
  type = "button",
  style,
  ...rest
}: ButtonProps) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [state, setState] = useState<"rest" | "hover" | "active">("rest");
  const bg = disabled
    ? v.background
    : state === "active"
      ? v.active
      : state === "hover"
        ? v.hover
        : v.background;

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setState("hover")}
      onMouseLeave={() => setState("rest")}
      onMouseDown={() => setState("active")}
      onMouseUp={() => setState("hover")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontFamily: "var(--font-sans)",
        fontSize: s.font,
        fontWeight: "var(--fw-medium)",
        lineHeight: 1,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        borderRadius: "var(--radius-pill)",
        border: v.border,
        background: bg,
        color: v.color,
        width: fullWidth ? "100%" : undefined,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background var(--dur-fast) var(--ease-soft), transform var(--dur-fast) var(--ease-soft)",
        transform: state === "active" && !disabled ? "scale(0.98)" : "none",
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {icon && <Icon name={icon} size={s.icon} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.icon} />}
    </button>
  );
}
