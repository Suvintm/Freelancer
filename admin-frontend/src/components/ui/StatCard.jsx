// ─── StatCard ─────────────────────────────────────────────────────────────
// KPI cards for Dashboard. Shows a metric, trend, icon, and optional sparkline.
// Usage: <StatCard title="Total Users" value={4231} change={+12.5} icon={<FaUsers />} color="blue" />
import { motion } from "framer-motion";

const StatCard = ({
  title,
  value,
  change,        // number: positive = up, negative = down, undefined = no change
  icon,
  color = "violet",  // violet | blue | green | amber | red
  loading = false,
  prefix = "",
  suffix = "",
  onClick,
  className = "",
}) => {
  const colorMap = {
    violet: { icon: "var(--brand-surface)",  text: "var(--brand)" },
    blue:   { icon: "var(--info-surface)",   text: "var(--info)" },
    green:  { icon: "var(--success-surface)", text: "var(--success)" },
    amber:  { icon: "var(--warning-surface)", text: "var(--warning)" },
    red:    { icon: "var(--danger-surface)",  text: "var(--danger)" },
    indigo: { icon: "var(--info-surface)",   text: "var(--info)" },
  };

  const c = colorMap[color] ?? colorMap.violet;
  const isUp   = change > 0;
  const isDown = change < 0;

  if (loading) {
    return (
      <div className={`card ${className}`} style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 12, width: "50%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 28, width: "65%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 11, width: "40%" }} />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`card ${className}`}
      style={{
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow var(--transition)",
      }}
      onMouseOver={(e) => { if (onClick) e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseOut={(e)  => { e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </p>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: c.icon, color: c.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>
            {icon}
          </div>
        )}
      </div>

      <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 8 }}>
        {prefix}{value}{suffix}
      </p>

      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
          <span style={{ color: isUp ? "var(--success)" : isDown ? "var(--danger)" : "var(--text-muted)" }}>
            {isUp ? "↑" : isDown ? "↓" : "→"} {Math.abs(change).toFixed(1)}%
          </span>
          <span style={{ color: "var(--text-muted)" }}>vs last period</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
