"use client";

import { CSSProperties, ReactNode } from "react";

/* Compact, single-row filter strip. Lays out a search field and a set of
   Selects on one line, wrapping gracefully on narrow screens. The first child
   (the search field) is given room to grow; the rest stay their natural width. */

export function FilterBar({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
