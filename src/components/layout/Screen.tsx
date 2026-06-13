import { ReactNode } from "react";

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 14px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</h2>
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
