"use client";

import { CSSProperties, SelectHTMLAttributes, forwardRef, useState } from "react";
import { Icon, IconName } from "./Icon";

/* Native <select> dressed to match Input: hairline border that warms to green
   on focus, optional leading icon, and a custom chevron. `pill` for filter
   bars, default radius for forms. */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  icon?: IconName;
  pill?: boolean;
  fullWidth?: boolean;
  /* Borderless, transparent, tight-padded — for embedding inside a shared
     bordered container (e.g. the compact filter bar). */
  bare?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  options,
  icon,
  pill = false,
  fullWidth = false,
  disabled = false,
  bare = false,
  style,
  ...rest
}, ref) {
  const [focus, setFocus] = useState(false);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: bare ? 6 : 9,
        height: bare ? 38 : 44,
        padding: bare ? "0 6px" : icon ? "0 12px 0 12px" : "0 14px",
        background: bare ? "transparent" : disabled ? "var(--surface-sunken)" : "var(--surface-card)",
        border: bare ? "none" : `1px solid ${focus ? "var(--accent)" : "var(--border-default)"}`,
        borderRadius: bare ? 0 : pill ? "999px" : "10px",
        boxShadow: bare || !focus ? "none" : "0 0 0 3px var(--focus-ring)",
        transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        width: fullWidth ? "100%" : undefined,
      } as CSSProperties}
    >
      {icon && <Icon name={icon} size={18} color="var(--text-secondary)" />}
      <select
        ref={ref}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body-2)",
          color: "var(--text-primary)",
          cursor: disabled ? "default" : "pointer",
          paddingRight: 16,
          ...style,
        } as CSSProperties}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "absolute", right: bare ? 4 : 12, pointerEvents: "none" }}
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
});
