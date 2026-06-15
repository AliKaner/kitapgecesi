"use client";

import { CSSProperties, useState } from "react";
import { Input } from "./Input";
import { Select, SelectOption } from "./Select";
import { IconName } from "./Icon";

/* Single-row, self-animating filter bar used across listing pages.
   Everything lives inside ONE bordered, rounded container (max 600px wide) —
   the inner search and selects are borderless segments, not separate pills.
   - Focusing the search expands it to fill the row and the selects slide away;
     blurring it shrinks search back and the selects return.
   - The select you're interacting with grows slightly, then settles back. */

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

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 20, background: "var(--border-default)", flex: "none" }} />;
}

export function CompactFilter({ searchValue, onSearchChange, searchPlaceholder, selects = [], style }: CompactFilterProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSelect, setActiveSelect] = useState<number | null>(null);
  const barActive = searchFocused || activeSelect !== null;

  return (
    <div style={{ width: "100%", maxWidth: 600, marginBottom: 24, ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 44,
          padding: "0 8px",
          borderRadius: 12,
          border: `1px solid ${barActive ? "var(--accent)" : "var(--border-default)"}`,
          background: "var(--surface-card)",
          boxShadow: barActive ? "0 0 0 3px var(--focus-ring)" : "none",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
          overflow: "hidden",
        }}
      >
        {/* Search — grows to fill while focused. onFocus/onBlur ride the bubble
            from the inner <input>. */}
        <div
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: searchFocused ? "100%" : "0%",
            minWidth: 0,
            transition: `flex-basis ${EASE}`,
          }}
        >
          <Input bare icon="search" placeholder={searchPlaceholder} value={searchValue} onChange={(e) => onSearchChange(e.target.value)} />
        </div>

        {/* Selects — collapse out of view while the search is focused. */}
        {selects.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
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
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }}>
                <Divider />
                <div
                  onFocus={() => setActiveSelect(i)}
                  onBlur={() => setActiveSelect(null)}
                  style={{
                    flex: "none",
                    transformOrigin: "center",
                    transform: activeSelect === i ? "scale(1.06)" : "scale(1)",
                    transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <Select bare icon={s.icon} value={s.value} onChange={(e) => s.onChange(e.target.value)} options={s.options} aria-label={s.ariaLabel} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
