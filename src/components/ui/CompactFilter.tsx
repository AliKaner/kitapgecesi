"use client";

import { CSSProperties, useState } from "react";
import { Input } from "./Input";
import { Select, SelectOption } from "./Select";
import { IconName } from "./Icon";

/* Single-row, self-animating filter strip used across listing pages.
   - Focusing the search box expands it to fill the row and the selects slide
     away; blurring it shrinks search back and the selects return.
   - The select you're interacting with grows slightly, then settles back once
     you move on. */

export interface CompactFilterSelect {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: IconName;
  ariaLabel?: string;
}

export interface CompactFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selects?: CompactFilterSelect[];
  style?: CSSProperties;
}

const EASE = "260ms cubic-bezier(0.22, 1, 0.36, 1)";

export function CompactFilter({ searchValue, onSearchChange, searchPlaceholder, selects = [], style }: CompactFilterProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSelect, setActiveSelect] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, width: "100%", ...style }}>
      {/* Search — grows to fill the row while focused. onFocus/onBlur ride the
          bubble from the inner <input> so Input keeps its own focus styling. */}
      <div
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        style={{
          flexGrow: searchFocused ? 1 : 0,
          flexShrink: 1,
          flexBasis: searchFocused ? "100%" : "280px",
          minWidth: 0,
          transition: `flex-basis ${EASE}, flex-grow ${EASE}`,
        }}
      >
        <Input
          icon="search"
          pill
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Selects — collapse out of view while the search is focused. */}
      {selects.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
            flex: "none",
            maxWidth: searchFocused ? 0 : 1000,
            opacity: searchFocused ? 0 : 1,
            transform: searchFocused ? "translateX(12px)" : "none",
            pointerEvents: searchFocused ? "none" : "auto",
            transition: `max-width ${EASE}, opacity ${EASE}, transform ${EASE}`,
          }}
        >
          {selects.map((s, i) => (
            <div
              key={i}
              onFocus={() => setActiveSelect(i)}
              onBlur={() => setActiveSelect(null)}
              style={{
                flex: "none",
                transformOrigin: "center",
                transform: activeSelect === i ? "scale(1.06)" : "scale(1)",
                transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <Select
                pill
                icon={s.icon}
                value={s.value}
                onChange={(e) => s.onChange(e.target.value)}
                options={s.options}
                aria-label={s.ariaLabel}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
