"use client";

import { CSSProperties, InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";
import { Icon, IconName } from "./Icon";

/* Text input. Optional floating-above label and a leading icon (e.g. search).
   Calm hairline border that warms to green on focus. `pill` for the search
   field; default radius for forms. */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  icon?: IconName;
  pill?: boolean;
  fullWidth?: boolean;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  defaultValue,
  onChange,
  pill = false,
  fullWidth = true,
  disabled = false,
  hint,
  style,
  ...rest
}, ref) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "inline-flex", flexDirection: "column", gap: 7, width: fullWidth ? "100%" : undefined }}>
      {label && (
        <span style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)", color: "var(--text-secondary)" } as CSSProperties}>
          {label}
        </span>
      )}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          height: 44,
          padding: icon ? "0 14px 0 12px" : "0 14px",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          border: `1px solid ${focus ? "var(--accent)" : "var(--border-default)"}`,
          borderRadius: "10px",
          boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "none",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        } as CSSProperties}
      >
        {icon && <Icon name={icon} size={18} color="var(--text-secondary)" />}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-2)",
            color: "var(--text-primary)",
            ...style,
          } as CSSProperties}
          {...rest}
        />
      </span>
      {hint && <span style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" } as CSSProperties}>{hint}</span>}
    </label>
  );
});
