"use client";

import { CSSProperties, HTMLAttributes, useState } from "react";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n/I18nProvider";

/* Star rating. `compact` shows one gold star + the score in Turkish format
   "(5,0)"; otherwise renders the full five-star row. Score is 0–5. */

function fmt(v: number) {
  return "(" + v.toFixed(1).replace(".", ",") + ")";
}

function StarIcon({ size, ratio, filledColor, emptyColor }: { size: number; ratio: number; filledColor: string; emptyColor: string }) {
  if (ratio <= 0) return <Icon name="star" size={size} color={emptyColor} />;
  if (ratio >= 1) return <Icon name="star" size={size} fill color={filledColor} />;
  return (
    <span style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}>
      <Icon name="star" size={size} color={emptyColor} />
      <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${ratio * 100}%` }}>
        <Icon name="star" size={size} fill color={filledColor} />
      </span>
    </span>
  );
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
  const [hoverValue, setHoverValue] = useState<number | null>(null);
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
  const display = hoverValue ?? Math.round(v * 2) / 2;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style } as CSSProperties} {...rest}>
      <span style={{ display: "inline-flex", gap: 2 }} onMouseLeave={() => setHoverValue(null)}>
        {[0, 1, 2, 3, 4].map((i) => {
          const ratio = Math.max(0, Math.min(1, display - i));
          return onRate ? (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const half = e.clientX - rect.left < rect.width / 2;
                onRate(i + (half ? 0.5 : 1));
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const half = e.clientX - rect.left < rect.width / 2;
                setHoverValue(i + (half ? 0.5 : 1));
              }}
              aria-label={t("starRating.star", { count: i + 1 })}
              style={{ border: "none", background: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
            >
              <StarIcon size={size} ratio={ratio} filledColor="var(--rating-star)" emptyColor="var(--border-strong)" />
            </button>
          ) : (
            <StarIcon key={i} size={size} ratio={ratio} filledColor="var(--rating-star)" emptyColor="var(--border-strong)" />
          );
        })}
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
