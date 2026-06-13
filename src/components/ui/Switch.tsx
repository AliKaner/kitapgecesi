"use client";

import { CSSProperties, HTMLAttributes, useState } from "react";

/* Toggle switch. Green when on. Controlled (`checked`+`onChange`) or
   uncontrolled (`defaultChecked`). Optional label to the left. */

export interface SwitchProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, defaultChecked = false, onChange, label, disabled = false, style, ...rest }: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked !== undefined ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!on);
    onChange?.(!on);
  };
  const track = (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={toggle}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        flex: "none",
        padding: 3,
        border: "none",
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        background: on ? "var(--accent)" : "var(--border-strong)",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--dur-base) var(--ease-soft)",
        display: "inline-flex",
        alignItems: "center",
      } as CSSProperties}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "var(--shadow-sm)",
          transform: on ? "translateX(18px)" : "translateX(0)",
          transition: "transform var(--dur-base) var(--ease-out)",
        } as CSSProperties}
      />
    </button>
  );
  if (!label) return track;
  return (
    <label
      style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "not-allowed" : "pointer", ...style } as CSSProperties}
      {...rest}
    >
      <span style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" } as CSSProperties}>{label}</span>
      {track}
    </label>
  );
}
