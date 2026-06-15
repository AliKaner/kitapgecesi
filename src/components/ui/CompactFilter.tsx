"use client";

import { CSSProperties, useState } from "react";
import { Icon, IconName } from "./Icon";

/* Compact icon-only filter row used across listing pages.
   - The search field collapses to a single icon button; clicking/focusing it
     (or typing) expands it into a text input. Blurring an empty search
     collapses it back.
   - Each select collapses to an icon-sized square; a transparent native
     <select> sits on top so clicking still opens the native picker. A select
     whose value differs from its first ("default") option gets an accent
     highlight so active filters stay visible even while collapsed. */

export interface SelectOption {
  value: string;
  label: string;
}

export interface CompactFilterSelect {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon: IconName;
  ariaLabel?: string;
}

export interface CompactFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selects?: CompactFilterSelect[];
  style?: CSSProperties;
}

const SIZE = 38;
const SEARCH_WIDTH = 220;
const EASE = "220ms cubic-bezier(0.22, 1, 0.36, 1)";

export function CompactFilter({ searchValue, onSearchChange, searchPlaceholder, selects = [], style }: CompactFilterProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchOpen = searchFocused || searchValue.length > 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, ...style } as CSSProperties}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: SIZE,
          width: searchOpen ? SEARCH_WIDTH : SIZE,
          padding: searchOpen ? "0 12px" : 0,
          justifyContent: searchOpen ? "flex-start" : "center",
          borderRadius: 10,
          border: `1px solid ${searchOpen ? "var(--accent)" : "var(--border-default)"}`,
          background: "var(--surface-card)",
          boxShadow: searchFocused ? "0 0 0 3px var(--focus-ring)" : "none",
          cursor: "text",
          flex: "none",
          overflow: "hidden",
          transition: `width ${EASE}, padding ${EASE}, border-color var(--dur-fast), box-shadow var(--dur-fast)`,
        } as CSSProperties}
      >
        <Icon name="search" size={16} color="var(--text-secondary)" style={{ flex: "none" } as CSSProperties} />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder={searchPlaceholder}
          style={{
            flex: 1,
            minWidth: 0,
            width: searchOpen ? "auto" : 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-2)",
            color: "var(--text-primary)",
          } as CSSProperties}
        />
      </label>

      {selects.map((s, i) => {
        const active = s.value !== s.options[0]?.value;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: SIZE,
              height: SIZE,
              flex: "none",
              borderRadius: 10,
              border: `1px solid ${active ? "var(--accent)" : "var(--border-default)"}`,
              background: active ? "var(--accent-tint)" : "var(--surface-card)",
              color: active ? "var(--accent)" : "var(--text-secondary)",
            } as CSSProperties}
          >
            <Icon name={s.icon} size={16} />
            <select
              value={s.value}
              onChange={(e) => s.onChange(e.target.value)}
              aria-label={s.ariaLabel}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                border: "none",
                cursor: "pointer",
                appearance: "none",
              } as CSSProperties}
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        );
      })}
    </div>
  );
}
