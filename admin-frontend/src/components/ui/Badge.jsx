// ─── Badge — status/role/tag pills ────────────────────────────────────────
// Usage: <Badge config={STATUS_CONFIG['completed']} />
//        <Badge config={ROLE_CONFIG['editor']} size="sm" />

const Badge = ({ config, label, size = "md", dot = false, className = "" }) => {
  const text  = label ?? config?.label ?? "—";
  const color = config?.color ?? "#9898a8";
  const bg    = config?.bg    ?? "rgba(152,152,168,0.12)";

  const sizeStyles = {
    xs: { fontSize: "9px",  padding: "1px 6px"  },
    sm: { fontSize: "10px", padding: "2px 7px"  },
    md: { fontSize: "11px", padding: "3px 9px"  },
    lg: { fontSize: "12px", padding: "4px 11px" },
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full uppercase tracking-wide whitespace-nowrap ${className}`}
      style={{ color, background: bg, ...sizeStyles[size] }}
    >
      {dot && (
        <span
          style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }}
        />
      )}
      {text}
    </span>
  );
};

export default Badge;
