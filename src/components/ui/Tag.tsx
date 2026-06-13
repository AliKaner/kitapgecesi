import { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Icon, IconName } from "./Icon";

/* Genre / topic chip — the small pills under a book ("Psikoloji", "Eğitici").
   `tone`: default (sand), tint (green), outline. Optional leading icon and
   onRemove (renders a tiny ✕ for filter chips). */

const TONES = {
  default: { background: "var(--surface-sunken)", color: "var(--text-primary)", border: "1px solid transparent" },
  tint: { background: "var(--accent-tint)", color: "var(--accent-active)", border: "1px solid transparent" },
  outline: { background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)" },
};

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  tone?: keyof typeof TONES;
  icon?: IconName;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function Tag({ children, tone = "default", icon, onRemove, size = "md", style, ...rest }: TagProps) {
  const t = TONES[tone] || TONES.default;
  const h = size === "sm" ? 24 : 28;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: h,
        padding: size === "sm" ? "0 10px" : "0 12px",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-body-3)",
        fontWeight: "var(--fw-medium)",
        lineHeight: 1,
        whiteSpace: "nowrap",
        borderRadius: "var(--radius-pill)",
        ...t,
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Kaldır"
          style={{
            display: "inline-flex",
            border: "none",
            background: "none",
            padding: 0,
            marginLeft: 1,
            cursor: "pointer",
            color: "inherit",
            opacity: 0.6,
          }}
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  );
}
