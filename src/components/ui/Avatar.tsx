import { CSSProperties, HTMLAttributes } from "react";

/* User avatar — round, image or initial fallback. `ring` adds a soft sand
   ring used on the feed; `size` is the diameter in px (or xs/sm/md/lg/xl). */

const NAMED: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 88 };

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: number | keyof typeof NAMED;
  ring?: boolean;
}

export function Avatar({ src, alt = "", name, size = "md", ring = false, style, ...rest }: AvatarProps) {
  const px = typeof size === "number" ? size : NAMED[size] || 40;
  const initial = (name || alt || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        borderRadius: "50%",
        overflow: "hidden",
        background: "var(--surface-sunken)",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        fontSize: Math.round(px * 0.4),
        flex: "none",
        boxShadow: ring ? "0 0 0 2px var(--bg-page), 0 0 0 3.5px var(--border-default)" : "none",
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initial
      )}
    </span>
  );
}
