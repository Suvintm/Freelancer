// ─── Topbar.jsx — Top navigation bar for admin panel ─────────────────────
// Features: hamburger (mobile), breadcrumb, search (opens command palette),
//           notification bell, admin avatar dropdown, theme toggle, time
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBell, HiOutlineMagnifyingGlass, HiOutlineMoon,
  HiOutlineSun, HiOutlineChevronDown, HiBars3,
} from "react-icons/hi2";
import { HiOutlineLogout, HiX } from "react-icons/hi";
import { useAdmin } from "../../context/AdminContext";
import { useTheme } from "../../context/ThemeContext";
import { formatRelativeTime } from "../../utils/formatters";

// Breadcrumb labels by path segment
const BREADCRUMB_MAP = {
  dashboard: "Dashboard", analytics: "Analytics", payments: "Payments",
  conversations: "Conversations", users: "Users", kyc: "KYC Management",
  orders: "Orders", gigs: "Gigs", advertisements: "Advertisements",
  subscriptions: "Subscriptions", activity: "Activity Log",
  storage: "Storage Manager", "service-analytics": "Service Analytics",
  settings: "Settings", "admin-management": "Admin Management", banners: "Banners",
};

const Topbar = ({ onMenuClick, collapsed }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { admin, logout, unreadCount, notifications, markNotificationsRead, fetchNotifications } = useAdmin();

  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [time,        setTime]        = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on outside click
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Breadcrumb
  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumb = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: i < segments.length - 1 ? "/" + segments.slice(0, i + 1).join("/") : null,
  }));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarW = collapsed ? 64 : 240;

  return (
    <header style={{
      position: "fixed", top: 0, right: 0,
      left: 0,
      height: 60,
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-default)",
      zIndex: 30,
      display: "flex", alignItems: "center",
      padding: "0 20px",
      gap: 12,
    }}>
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-secondary)", padding: 6, borderRadius: 8,
          display: "flex", alignItems: "center",
        }}
        className="topbar-hamburger"
      >
        <HiBars3 size={20} />
      </button>

      {/* Spacer for sidebar width on desktop */}
      <div className="topbar-sidebar-spacer" style={{ width: sidebarW - 20 }} />

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, overflow: "hidden" }}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {i > 0 && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>/</span>}
            {crumb.href ? (
              <button
                onClick={() => navigate(crumb.href)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--text-muted)", fontWeight: 500, padding: 0,
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseOut={(e)  => e.currentTarget.style.color = "var(--text-muted)"}
              >
                {crumb.label}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 700 }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {/* Time */}
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 4 }} className="topbar-clock">
          {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: 34, height: 34, borderRadius: 9, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "transparent", border: "1px solid var(--border-default)",
            color: "var(--text-secondary)", cursor: "pointer",
            transition: "all var(--transition)",
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseOut={(e)  => e.currentTarget.style.color = "var(--text-secondary)"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <HiOutlineSun size={16} /> : <HiOutlineMoon size={16} />}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowNotif(p => !p);
              setShowProfile(false);
              if (!showNotif) fetchNotifications();
            }}
            style={{
              width: 34, height: 34, borderRadius: 9, display: "flex",
              alignItems: "center", justifyContent: "center", position: "relative",
              background: showNotif ? "var(--bg-elevated)" : "transparent",
              border: "1px solid var(--border-default)",
              color: showNotif ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all var(--transition)",
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseOut={(e)  => { if (!showNotif) e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <HiOutlineBell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5,
                minWidth: 14, height: 14, borderRadius: 7,
                background: "var(--danger)", color: "#fff",
                fontSize: 8, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: 4,  scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  width: 320, background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 14, overflow: "hidden",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 100,
                }}
              >
                <div style={{
                  padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    Notifications {unreadCount > 0 && <span style={{ color: "var(--brand)" }}>({unreadCount})</span>}
                  </p>
                  {unreadCount > 0 && (
                    <button
                      onClick={markNotificationsRead}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, color: "var(--brand)", fontWeight: 600,
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => { if (n.link) navigate(n.link); setShowNotif(false); }}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border-subtle)",
                          cursor: n.link ? "pointer" : "default",
                          background: n.isRead ? "transparent" : "rgba(124,58,237,0.06)",
                          transition: "background var(--transition)",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "var(--bg-overlay)"; }}
                        onMouseOut={(e)  => { e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(124,58,237,0.06)"; }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                          {n.title}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{n.message}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowProfile(p => !p); setShowNotif(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 10px 5px 5px", borderRadius: 10,
              background: showProfile ? "var(--bg-elevated)" : "transparent",
              border: "1px solid var(--border-default)",
              cursor: "pointer", transition: "all var(--transition)",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
            onMouseOut={(e)  => { if (!showProfile) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff",
              flexShrink: 0,
            }}>
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}
              className="topbar-admin-name">
              {admin?.name?.split(" ")[0]}
            </span>
            <HiOutlineChevronDown
              size={12}
              style={{ color: "var(--text-muted)", transform: showProfile ? "rotate(180deg)" : "none", transition: "transform var(--transition)" }}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{   opacity: 0, y: 4  }}
                transition={{ duration: 0.14 }}
                style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  width: 200, background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 12, overflow: "hidden",
                  boxShadow: "var(--shadow-lg)", zIndex: 100,
                }}
              >
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{admin?.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{admin?.email}</p>
                </div>
                <div style={{ padding: 6 }}>
                  <button
                    onClick={() => { navigate("/settings"); setShowProfile(false); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 10px",
                      borderRadius: 8, border: "none", background: "none",
                      fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
                      transition: "all var(--transition)",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "var(--bg-overlay)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseOut={(e)  => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 10px",
                      borderRadius: 8, border: "none", background: "none",
                      fontSize: 12, color: "var(--danger)", cursor: "pointer",
                      transition: "background var(--transition)",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--danger-bg)"}
                    onMouseOut={(e)  => e.currentTarget.style.background = "none"}
                  >
                    <HiOutlineLogout size={13} style={{ display: "inline", marginRight: 6 }} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .topbar-hamburger { display: none !important; }
          .topbar-sidebar-spacer { display: block !important; }
        }
        @media (max-width: 767px) {
          .topbar-hamburger { display: flex !important; }
          .topbar-sidebar-spacer { display: none !important; }
          .topbar-clock, .topbar-admin-name { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Topbar;
