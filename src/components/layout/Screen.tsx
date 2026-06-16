import { CSSProperties, ReactNode } from "react";
import { Icon } from "../ui/Icon";

export function SectionHead({
  title,
  action,
  onClick,
  active,
}: {
  title: string;
  action?: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const heading = (
    <h2
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        margin: 0,
        color: onClick && active ? "var(--accent)" : "inherit",
      }}
    >
      {title}
      {onClick && <Icon name="chevron-right" size={18} color={active ? "var(--accent)" : "var(--text-secondary)"} />}
    </h2>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 14px" }}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" } as CSSProperties}
        >
          {heading}
        </button>
      ) : (
        heading
      )}
      {action}
    </div>
  );
}

export function ScreenTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }}>{children}</h1>
      {sub && <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}
