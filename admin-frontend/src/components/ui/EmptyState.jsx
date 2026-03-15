// ─── EmptyState ───────────────────────────────────────────────────────────
// Shown when a table/list has no data

const EmptyState = ({
  icon,
  title = "No data found",
  description,
  action,
  compact = false,
}) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    textAlign: "center",
    padding: compact ? "32px 24px" : "60px 24px",
    gap: compact ? 8 : 12,
  }}>
    {icon && (
      <div style={{
        fontSize: compact ? 28 : 40,
        color: "var(--text-muted)",
        marginBottom: compact ? 4 : 8,
        opacity: 0.6,
      }}>
        {icon}
      </div>
    )}
    <p style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: "var(--text-secondary)" }}>
      {title}
    </p>
    {description && (
      <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 320, lineHeight: 1.6 }}>
        {description}
      </p>
    )}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

export default EmptyState;
