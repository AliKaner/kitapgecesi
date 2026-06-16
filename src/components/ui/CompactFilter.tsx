"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { Icon, IconName } from "./Icon";

/* Compact icon-only filter row used across listing pages.
   - The search field collapses to a single icon button; clicking/focusing it
     (or typing) expands it into a text input. Blurring an empty search
     collapses it back.
   - Each select collapses to an icon-sized square that toggles a custom
     dropdown. The dropdown has a capped height with internal scrolling so a
     long option list (e.g. years) never grows past the viewport. A select
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
const EASE = "220ms cubic-bezier(0.22, 1, 0.36, 1)";

function FilterDropdown({ value, onChange, options, icon, ariaLabel }: CompactFilterSelect) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== options[0]?.value;
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={selected?.label}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: SIZE,
          height: SIZE,
          borderRadius: 10,
          border: `1px solid ${active || open ? "var(--accent)" : "var(--border-default)"}`,
          background: active ? "var(--accent-tint)" : "var(--surface-card)",
          color: active || open ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer",
          boxShadow: open ? "0 0 0 3px var(--focus-ring)" : "none",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        } as CSSProperties}
      >
        <Icon name={icon} size={16} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: SIZE + 6,
            right: 0,
            zIndex: 200,
            minWidth: 180,
            maxWidth: 260,
            maxHeight: 280,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: 6,
            borderRadius: 12,
            border: "1px solid var(--border-default)",
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-pop, 0 12px 32px rgba(20,20,20,0.16))",
          } as CSSProperties}
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: isSelected ? "var(--accent-tint)" : "transparent",
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body-2)",
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                } as CSSProperties}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--surface-hover, rgba(20,20,20,0.05))";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>
                {isSelected && <Icon name="check" size={14} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CompactFilter({ searchValue, onSearchChange, searchPlaceholder, selects = [], style }: CompactFilterProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchOpen = searchFocused || searchValue.length > 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", marginBottom: 24, ...style } as CSSProperties}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: SIZE,
          flex: "1 1 auto",
          minWidth: SIZE,
          padding: "0 14px",
          justifyContent: "flex-start",
          borderRadius: 10,
          border: `1px solid ${searchOpen ? "var(--accent)" : "var(--border-default)"}`,
          background: "var(--surface-card)",
          boxShadow: searchFocused ? "0 0 0 3px var(--focus-ring)" : "none",
          cursor: "text",
          overflow: "hidden",
          transition: `padding ${EASE}, border-color var(--dur-fast), box-shadow var(--dur-fast)`,
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
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-2)",
            color: "var(--text-primary)",
          } as CSSProperties}
        />
      </label>

      {selects.map((s, i) => (
        <FilterDropdown key={i} {...s} />
      ))}
    </div>
  );
}
