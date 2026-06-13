"use client";

import { CSSProperties, HTMLAttributes, ReactNode, useState } from "react";

/* Generic surface container. White card, hairline border, soft rounding.
   Optional header (title + action) and adjustable padding/tone. Used for the
   right-rail widgets, clubs, list panels and settings sections. */

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  action?: ReactNode;
  tone?: "card" | "sunken" | "tint";
  padding?: number | string;
  hover?: boolean;
}

export function Card({ children, title, action, tone = "card", padding = 20, hover = false, style, ...rest }: CardProps) {
  const [h, setH] = useState(false);
  const bg =
    tone === "sunken" ? "var(--surface-sunken)" : tone === "tint" ? "var(--surface-tint)" : "var(--surface-card)";
  return (
    <section
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: bg,
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding,
        boxShadow: hover && h ? "var(--shadow-md)" : "none",
        transition: "box-shadow var(--dur-base) var(--ease-soft)",
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {(title || action) && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          {title && (
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-h3)",
                fontWeight: "var(--fw-semibold)",
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              } as CSSProperties}
            >
              {title}
            </h3>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
