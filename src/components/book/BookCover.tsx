import { CSSProperties, HTMLAttributes } from "react";
import { Icon } from "../ui/Icon";

/* Book cover image. Fixed 2:3 portrait by default, soft directional drop
   shadow, gentle rounding. Falls back to a warm paper panel with a centered
   book icon if no image is supplied. */

export interface BookCoverProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  title?: string;
  width?: number;
  ratio?: number;
  rounded?: string;
  shadow?: boolean;
}

export function BookCover({ src, title = "", width = 96, ratio = 1.5, rounded = "var(--radius-sm)", shadow = true, style, ...rest }: BookCoverProps) {
  return (
    <div
      style={{
        width,
        height: Math.round(width * ratio),
        flex: "none",
        borderRadius: rounded,
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-book-image)",
        boxShadow: shadow ? "var(--shadow-book)" : "none",
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            opacity: 0.5,
          } as CSSProperties}
        >
          <Icon name="book" size={Math.max(14, Math.round(width * 0.36))} />
        </span>
      )}
      <span style={{ position: "absolute", inset: 0, borderRadius: rounded, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" } as CSSProperties} />
    </div>
  );
}
