// ─── NotFound — 404 page for unknown admin routes ─────────────────────────
import { useNavigate } from "react-router-dom";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "var(--bg-base)", gap: 16, textAlign: "center",
    }}>
      <HiOutlineExclamationTriangle size={52} style={{ color: "var(--warning)", opacity: 0.7 }} />
      <div>
        <p style={{ fontSize: 48, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>404</p>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 8 }}>Page not found</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          The admin page you were looking for doesn't exist.
        </p>
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "var(--brand)", color: "#fff", fontSize: 13,
          fontWeight: 700, cursor: "pointer", marginTop: 8,
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
