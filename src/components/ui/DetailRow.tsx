export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border-default)",
        fontSize: "var(--fs-body-2)",
      }}
    >
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontWeight: "var(--fw-medium)" as unknown as number }}>{value}</span>
    </div>
  );
}
