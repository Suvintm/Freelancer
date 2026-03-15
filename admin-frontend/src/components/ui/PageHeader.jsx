// ─── PageHeader ───────────────────────────────────────────────────────────
// Top section of every admin page: breadcrumb, title, description, actions
import { useNavigate } from "react-router-dom";
import { HiChevronRight } from "react-icons/hi";

const PageHeader = ({
  title,
  description,
  breadcrumb = [],  // [{ label: "Dashboard", href: "/" }, { label: "Users" }]
  actions,          // React nodes: buttons on the right
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={className}
      style={{ marginBottom: 24 }}
    >
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          {breadcrumb.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <HiChevronRight style={{ color: "var(--text-muted)", fontSize: 12 }} />}
              {crumb.href ? (
                <button
                  onClick={() => navigate(crumb.href)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: "var(--text-muted)", fontWeight: 500,
                    padding: 0,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                  onMouseOut={(e)  => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  {crumb.label}
                </button>
              ) : (
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {title}
          </h1>
          {description && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
