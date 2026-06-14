"use client";

import { CSSProperties, HTMLAttributes } from "react";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n/I18nProvider";

/* Star rating. `compact` shows one gold star + the score in Turkish format
   "(5,0)"; otherwise renders the full five-star row. Score is 0–5. */

function fmt(v: number) {
  return "(" + v.toFixed(1).replace(".", ",") + ")";
}

export interface StarRatingProps extends HTMLAttributes<HTMLSpanElement> {
  value?: number;
  count?: number;
  size?: number;
  compact?: boolean;
  showValue?: boolean;
  onRate?: (value: number) => void;
}

export function StarRating({ value = 0, count, size = 14, compact = true, showValue = true, onRate, style, ...rest }: StarRatingProps) {
  const { t } = useT();
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  if (compact) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style } as CSSProperties} {...rest}>
        <Icon name="star" size={size} fill color="var(--rating-star)" />
        <span
          style={{
            fontSize: "var(--fs-body-3)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-secondary)",
            fontVariantNumeric: "tabular-nums",
          } as CSSProperties}
        >
          {fmt(v)}
          {count != null && <span style={{ opacity: 0.7 }}> · {count}</span>}
        </span>
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style } as CSSProperties} {...rest}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[0, 1, 2, 3, 4].map((i) =>
          onRate ? (
            <button
              key={i}
              type="button"
              onClick={() => onRate(i + 1)}
              aria-label={t("starRating.star", { count: i + 1 })}
              style={{ border: "none", background: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
            >
              <Icon name="star" size={size} fill={i < Math.round(v)} color={i < Math.round(v) ? "var(--rating-star)" : "var(--border-strong)"} />
            </button>
          ) : (
            <Icon
              key={i}
              name="star"
              size={size}
              fill={i < Math.round(v)}
              color={i < Math.round(v) ? "var(--rating-star)" : "var(--border-strong)"}
            />
          )
        )}
      </span>
      {showValue && (
        <span
          style={{
            fontSize: "var(--fs-body-2)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-primary)",
            marginLeft: 2,
            fontVariantNumeric: "tabular-nums",
          } as CSSProperties}
        >
          {v.toFixed(1).replace(".", ",")}
        </span>
      )}
    </span>
  );
}
