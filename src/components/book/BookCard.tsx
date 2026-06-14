"use client";

import { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { BookCover } from "./BookCover";
import { StarRating } from "../ui/StarRating";
import { Tag } from "../ui/Tag";
import { useT } from "@/lib/i18n/I18nProvider";

/* BookCard — composes a cover with title / author / rating.
   layout "grid": vertical, compact (the "Popüler Kitaplar" rail).
   layout "row":  horizontal cover + meta + optional action (search results,
   feed attachments, lists). */

export interface BookCardProps extends HTMLAttributes<HTMLDivElement> {
  cover?: string;
  title: string;
  author?: string;
  rating?: number;
  ratingCount?: number;
  genres?: string[];
  pages?: number;
  dateRange?: string;
  layout?: "grid" | "row";
  width?: number;
  action?: ReactNode;
  onClick?: () => void;
  serif?: boolean;
}

export function BookCard({
  cover,
  title,
  author,
  rating,
  ratingCount,
  genres = [],
  pages,
  dateRange,
  layout = "grid",
  width,
  action,
  onClick,
  serif = false,
  style,
  ...rest
}: BookCardProps) {
  const { t } = useT();
  const titleStyle: CSSProperties = {
    fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)",
    fontSize: serif ? "var(--fs-display-sm)" : "var(--fs-h3)",
    fontWeight: serif ? 400 : "var(--fw-semibold)" as unknown as number,
    lineHeight: serif ? 1.1 : 1.3,
    letterSpacing: serif ? 0 : "-0.01em",
    color: "var(--text-primary)",
  };

  if (layout === "row") {
    return (
      <div onClick={onClick} style={{ display: "flex", gap: 16, cursor: onClick ? "pointer" : "default", ...style }} {...rest}>
        <BookCover src={cover} title={title} width={width || 88} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
          <div style={titleStyle}>{title}</div>
          {author && <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-secondary)" } as CSSProperties}>{author}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
            {rating != null && <StarRating value={rating} count={ratingCount} />}
            {pages && <span style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" } as CSSProperties}>{t("kitap.pages", { count: pages })}</span>}
          </div>
          {dateRange && <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" } as CSSProperties}>{dateRange}</div>}
          {genres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              {genres.map((g) => (
                <Tag key={g} size="sm">
                  {g}
                </Tag>
              ))}
            </div>
          )}
          {action && <div style={{ marginTop: 8 }}>{action}</div>}
        </div>
      </div>
    );
  }

  // grid
  return (
    <div onClick={onClick} style={{ display: "flex", flexDirection: "column", gap: 8, width: width || 124, cursor: onClick ? "pointer" : "default", ...style }} {...rest}>
      <BookCover src={cover} title={title} width={width || 124} />
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ ...titleStyle, fontSize: "var(--fs-body-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } as CSSProperties}>
          {title}
        </div>
        {author && (
          <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } as CSSProperties}>
            {author}
          </div>
        )}
        {rating != null && <StarRating value={rating} size={12} />}
      </div>
      {action}
    </div>
  );
}
