// ─── Skeleton — shimmer loading placeholders ──────────────────────────────
// Renders a shimmer block of specified dimensions

export const Skeleton = ({ width = "100%", height = 16, rounded = "md", className = "" }) => {
  const radiusMap = { sm: 4, md: 8, lg: 12, full: 9999 };
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radiusMap[rounded] ?? rounded,
        flexShrink: 0,
      }}
    />
  );
};

// Row of skeletons for table loading
export const SkeletonRow = ({ cols = 5 }) => (
  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <Skeleton height={13} width={i === 0 ? "60%" : i === cols - 1 ? "40%" : "80%"} />
      </td>
    ))}
  </tr>
);

// Card skeleton
export const SkeletonCard = ({ lines = 3 }) => (
  <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
    <Skeleton height={12} width="40%" />
    <Skeleton height={28} width="60%" />
    {lines > 2 && <Skeleton height={11} width="90%" />}
    {lines > 3 && <Skeleton height={11} width="70%" />}
  </div>
);

export default Skeleton;
