// ─── Sidebar.jsx — Production-grade collapsible sidebar ──────────────────────
// • Black/white theme with light + dark mode
// • Collapsible desktop (icon-only at 64px, full at 240px)
// • Mobile off-canvas overlay with spring animation
// • Grouped navigation with badge counts
// • Active route indicator bar
// • Admin avatar + info at bottom
// • Zero Tailwind dependency — pure inline styles + CSS variables
// Deps: react-router-dom, framer-motion, react-icons/hi2, AdminContext

import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineCircleStack,
  HiOutlineComputerDesktop,
  HiOutlineSpeakerWave,
  HiOutlinePresentationChartLine,
  HiOutlineServerStack,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCog8Tooth,
  HiOutlineUserGroup,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineBell,
  HiOutlineExclamationTriangle,
  HiMiniChevronRight,
} from "react-icons/hi2";
import { useAdmin } from "../../context/AdminContext";

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard",          label: "Dashboard",         icon: HiOutlineSquares2X2 },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/users",              label: "Users",             icon: HiOutlineUsers,               permission: "users",      badgeKey: "bannedUsers",    badgeVariant: "red"    },
      { to: "/orders",             label: "Orders",            icon: HiOutlineShoppingBag,          permission: "orders",     badgeKey: "disputedOrders", badgeVariant: "orange" },
      { to: "/gigs",               label: "Gigs",              icon: HiOutlineBriefcase,           permission: "gigs"         },
      { to: "/kyc",                label: "KYC",               icon: HiOutlineShieldCheck,          permission: "users",      badgeKey: "kycPending",     badgeVariant: "amber"  },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payments",           label: "Payments",          icon: HiOutlineBanknotes,           permission: "analytics"     }, // Financial data usually requires analytics perm or higher
      { to: "/subscriptions",      label: "Subscriptions",     icon: HiOutlineCreditCard,          permission: "analytics"     },
      { to: "/storage",            label: "Storage",           icon: HiOutlineCircleStack,         permission: "settings"      },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/advertisements",     label: "Advertisements",    icon: HiOutlineSpeakerWave,         permission: "gigs"          },
      { to: "/banners",            label: "Banners",           icon: HiOutlineComputerDesktop,     permission: "settings"      },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/analytics",          label: "Business",          icon: HiOutlinePresentationChartLine, permission: "analytics" },
      { to: "/service-analytics",  label: "Infrastructure",    icon: HiOutlineServerStack,           permission: "settings"  },
    ],
  },
  {
    label: "Moderation",
    items: [
      { to: "/conversations",      label: "Conversations",     icon: HiOutlineChatBubbleLeftRight,   permission: "orders"    },
      { to: "/activity",           label: "Activity Log",      icon: HiOutlineClipboardDocumentList, permission: "settings"  },
    ],
  },
  {
    label: "System",
    superAdminOnly: true,
    items: [
      { to: "/admin-management",   label: "Admin Team",        icon: HiOutlineUserGroup             },
      { to: "/settings",           label: "Settings",          icon: HiOutlineCog8Tooth             },
    ],
  },
];

// Badge colors
const BADGE_COLORS = {
  red:    { bg: "#fee2e2", text: "#dc2626", dark_bg: "#450a0a", dark_text: "#fca5a5" },
  orange: { bg: "#fff7ed", text: "#c2410c", dark_bg: "#431407", dark_text: "#fdba74" },
  amber:  { bg: "#fffbeb", text: "#b45309", dark_bg: "#451a03", dark_text: "#fcd34d" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Avatar with initials fallback
// ─────────────────────────────────────────────────────────────────────────────
const AdminAvatar = ({ name, size = 32 }) => {
  const initials = (name || "AD").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff",
      flexShrink: 0, letterSpacing: "-.5px",
      boxShadow: "0 0 0 2px var(--sb-avatar-ring)",
    }}>{initials}</div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip (for collapsed icon-only mode)
// ─────────────────────────────────────────────────────────────────────────────
const Tooltip = ({ label, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute", left: "calc(100% + 10px)", top: "50%",
              transform: "translateY(-50%)", zIndex: 100,
              background: "var(--sb-tooltip-bg)", color: "var(--sb-tooltip-text)",
              padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              whiteSpace: "nowrap", pointerEvents: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,.18)",
              border: "1px solid var(--sb-border)",
            }}
          >
            {label}
            <div style={{
              position: "absolute", right: "100%", top: "50%",
              transform: "translateY(-50%)",
              width: 0, height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "5px solid var(--sb-border)",
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { admin, logout, isSuperAdmin, alerts } = useAdmin();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getBadge = (key) => (key && alerts ? (alerts[key] || 0) : 0);

  // ── NavItem ────────────────────────────────────────────────────────────
  const NavItem = ({ item, mini }) => {
    const Icon     = item.icon;
    const badge    = getBadge(item.badgeKey);
    const bc       = BADGE_COLORS[item.badgeVariant] || BADGE_COLORS.red;
    const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");

    const inner = (
      <NavLink
        to={item.to}
        onClick={onClose}
        style={{
          display: "flex", alignItems: "center",
          gap: mini ? 0 : 9,
          justifyContent: mini ? "center" : "flex-start",
          padding: mini ? "8px 0" : "7px 10px",
          borderRadius: 8, textDecoration: "none",
          fontSize: 13, fontWeight: isActive ? 600 : 500,
          color: isActive ? "var(--sb-active-text)" : "var(--sb-text)",
          background: isActive ? "var(--sb-active-bg)" : "transparent",
          position: "relative", transition: "all .15s",
          outline: "none",
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = "var(--sb-hover-bg)";
            e.currentTarget.style.color = "var(--sb-hover-text)";
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--sb-text)";
          }
        }}
      >
        {/* Active bar */}
        {isActive && !mini && (
          <span style={{
            position: "absolute", left: 0, top: "20%", bottom: "20%",
            width: 3, borderRadius: "0 3px 3px 0", background: "var(--sb-active-bar)",
            marginLeft: -10,
          }} />
        )}

        {/* Icon + mini badge */}
        <span style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <Icon size={16} />
          {badge > 0 && mini && (
            <span style={{
              position: "absolute", top: -5, right: -5,
              minWidth: 13, height: 13, borderRadius: 7,
              background: "#dc2626", color: "#fff",
              fontSize: 7, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 2px", lineHeight: 1,
            }}>
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>

        {/* Label */}
        {!mini && (
          <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
        )}

        {/* Full badge pill */}
        {!mini && badge > 0 && (
          <span style={{
            minWidth: 18, height: 18, borderRadius: 9,
            background: `var(--sb-badge-${item.badgeVariant || "red"}-bg)`,
            color: `var(--sb-badge-${item.badgeVariant || "red"}-text)`,
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 5px", lineHeight: 1,
          }}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </NavLink>
    );

    return mini ? <Tooltip label={item.label}>{inner}</Tooltip> : inner;
  };

  // ── SidebarContent ─────────────────────────────────────────────────────
  const SidebarContent = ({ mini }) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Logo Row ────────────────────────────────────────────────────── */}
      <div style={{
        height: 56, flexShrink: 0,
        padding: mini ? "0 12px" : "0 14px",
        display: "flex", alignItems: "center",
        justifyContent: mini ? "center" : "space-between",
        borderBottom: "1px solid var(--sb-border)",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "#18181b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
            boxShadow: "0 0 0 1px rgba(255,255,255,.08)",
          }}>S</div>
          <AnimatePresence>
            {!mini && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: .18 }}
                style={{ overflow: "hidden", whiteSpace: "nowrap" }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sb-brand-text)", lineHeight: 1.2 }}>SuviX</div>
                <div style={{ fontSize: 10, color: "var(--sb-muted)", lineHeight: 1, textTransform: "capitalize" }}>
                  Admin Console
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle — desktop only */}
        {onToggleCollapse && !mini && (
          <button
            onClick={onToggleCollapse}
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: "transparent", border: "1px solid var(--sb-border)",
              cursor: "pointer", color: "var(--sb-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--sb-hover-bg)"; e.currentTarget.style.color = "var(--sb-text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sb-muted)"; }}
            title="Collapse sidebar"
          >
            <HiOutlineChevronLeft size={12} />
          </button>
        )}
        {onToggleCollapse && mini && (
          <Tooltip label="Expand sidebar">
            <button
              onClick={onToggleCollapse}
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: "transparent", border: "1px solid var(--sb-border)",
                cursor: "pointer", color: "var(--sb-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--sb-hover-bg)"; e.currentTarget.style.color = "var(--sb-text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sb-muted)"; }}
            >
              <HiOutlineChevronRight size={12} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: mini ? "8px 8px" : "8px 10px",
        scrollbarWidth: "none",
      }}>
        <style>{`
          nav::-webkit-scrollbar { display: none; }
        `}</style>

        {NAV
          .filter(g => !g.superAdminOnly || isSuperAdmin)
          .map((group, gi) => (
            <div key={gi} style={{ marginBottom: 2 }}>
              {/* Group label */}
              {!mini ? (
                <div style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em",
                  textTransform: "uppercase", color: "var(--sb-muted)",
                  padding: "10px 10px 4px",
                }}>
                  {group.label}
                </div>
              ) : (
                gi > 0 && (
                  <div style={{
                    height: 1, background: "var(--sb-border)",
                    margin: "6px 4px",
                  }} />
                )
              )}

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {group.items
                  .filter(item => {
                    if (isSuperAdmin) return true;
                    if (!item.permission) return true;
                    return admin?.permissions?.[item.permission];
                  })
                  .map(item => (
                    <NavItem key={item.to} item={item} mini={mini} />
                  ))
                }
              </div>
            </div>
          ))
        }
      </nav>

      {/* ── Footer: Admin info + Logout ─────────────────────────────────── */}
      <div style={{
        flexShrink: 0, borderTop: "1px solid var(--sb-border)",
        padding: mini ? "10px 8px" : "10px 10px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {/* Admin profile row */}
        {!mini ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 8,
            background: "var(--sb-hover-bg)",
            border: "1px solid var(--sb-border)",
          }}>
            <AdminAvatar name={admin?.name} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: "var(--sb-text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {admin?.name || "Admin"}
              </div>
              <div style={{
                fontSize: 10, color: "var(--sb-muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                textTransform: "capitalize",
              }}>
                {admin?.role || "admin"}
              </div>
            </div>
            <HiMiniChevronRight size={14} style={{ color: "var(--sb-muted)", flexShrink: 0 }} />
          </div>
        ) : (
          <Tooltip label={admin?.name || "Admin"}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <AdminAvatar name={admin?.name} size={28} />
            </div>
          </Tooltip>
        )}

        {/* Logout */}
        {mini ? (
          <Tooltip label="Sign out">
            <button
              onClick={handleLogout}
              style={{
                width: "100%", height: 32, borderRadius: 8, border: "1px solid var(--sb-border)",
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--sb-muted)", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sb-muted)"; e.currentTarget.style.borderColor = "var(--sb-border)"; }}
            >
              <HiOutlineArrowLeftOnRectangle size={15} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 8,
              border: "1px solid var(--sb-border)",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              color: "var(--sb-muted)", fontSize: 12, fontWeight: 600,
              transition: "all .15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--sb-logout-hover-bg)";
              e.currentTarget.style.color = "var(--sb-logout-hover-text)";
              e.currentTarget.style.borderColor = "var(--sb-logout-hover-border)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--sb-muted)";
              e.currentTarget.style.borderColor = "var(--sb-border)";
            }}
          >
            <HiOutlineArrowLeftOnRectangle size={15} />
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CSS variables for light / dark ───────────────────────────────── */}
      <style>{`
        /* ── Light mode ──────────────────────────────────────── */
        :root {
          --sb-bg:               #ffffff;
          --sb-border:           #e5e7eb;
          --sb-text:             #374151;
          --sb-muted:            #9ca3af;
          --sb-brand-text:       #111827;
          --sb-hover-bg:         #f9fafb;
          --sb-hover-text:       #111827;
          --sb-active-bg:        #f3f4f6;
          --sb-active-text:      #111827;
          --sb-active-bar:       #111827;
          --sb-tooltip-bg:       #111827;
          --sb-tooltip-text:     #f9fafb;
          --sb-avatar-ring:      #e5e7eb;
          --sb-logout-hover-bg:      #fef2f2;
          --sb-logout-hover-text:    #dc2626;
          --sb-logout-hover-border:  #fecaca;
          --sb-badge-red-bg:    #fee2e2;
          --sb-badge-red-text:  #dc2626;
          --sb-badge-orange-bg: #fff7ed;
          --sb-badge-orange-text:#c2410c;
          --sb-badge-amber-bg:  #fffbeb;
          --sb-badge-amber-text:#b45309;
        }

        /* ── Dark mode ───────────────────────────────────────── */
        @media (prefers-color-scheme: dark) {
          :root {
            --sb-bg:               #0f0f0f;
            --sb-border:           #1f1f1f;
            --sb-text:             #e5e7eb;
            --sb-muted:            #6b7280;
            --sb-brand-text:       #f9fafb;
            --sb-hover-bg:         #1a1a1a;
            --sb-hover-text:       #f9fafb;
            --sb-active-bg:        #1f1f1f;
            --sb-active-text:      #f9fafb;
            --sb-active-bar:       #f9fafb;
            --sb-tooltip-bg:       #1f1f1f;
            --sb-tooltip-text:     #f9fafb;
            --sb-avatar-ring:      #2a2a2a;
            --sb-logout-hover-bg:      #1c0a0a;
            --sb-logout-hover-text:    #fca5a5;
            --sb-logout-hover-border:  #450a0a;
            --sb-badge-red-bg:    #450a0a;
            --sb-badge-red-text:  #fca5a5;
            --sb-badge-orange-bg: #431407;
            --sb-badge-orange-text:#fdba74;
            --sb-badge-amber-bg:  #451a03;
            --sb-badge-amber-text:#fcd34d;
          }
        }

        /* ── Dark mode class override (for manual toggle) ────── */
        .dark {
          --sb-bg:               #0f0f0f;
          --sb-border:           #1f1f1f;
          --sb-text:             #e5e7eb;
          --sb-muted:            #6b7280;
          --sb-brand-text:       #f9fafb;
          --sb-hover-bg:         #1a1a1a;
          --sb-hover-text:       #f9fafb;
          --sb-active-bg:        #1f1f1f;
          --sb-active-text:      #f9fafb;
          --sb-active-bar:       #f9fafb;
          --sb-tooltip-bg:       #1f1f1f;
          --sb-tooltip-text:     #f9fafb;
          --sb-avatar-ring:      #2a2a2a;
          --sb-logout-hover-bg:      #1c0a0a;
          --sb-logout-hover-text:    #fca5a5;
          --sb-logout-hover-border:  #450a0a;
          --sb-badge-red-bg:    #450a0a;
          --sb-badge-red-text:  #fca5a5;
          --sb-badge-orange-bg: #431407;
          --sb-badge-orange-text:#fdba74;
          --sb-badge-amber-bg:  #451a03;
          --sb-badge-amber-text:#fcd34d;
        }

        /* ── Responsive visibility ───────────────────────────── */
        .sb-desktop { display: none !important; }
        @media (min-width: 768px) {
          .sb-desktop { display: flex !important; }
          .sb-mobile-trigger { display: none !important; }
        }
      `}</style>

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside
        className="sb-desktop"
        style={{
          position: "fixed", left: 0, top: 0, bottom: 0,
          width: collapsed ? 64 : 240,
          background: "var(--sb-bg)",
          borderRight: "1px solid var(--sb-border)",
          zIndex: 40, flexDirection: "column",
          transition: "width .22s cubic-bezier(.4,0,.2,1)",
          overflowX: "hidden",
        }}
      >
        <SidebarContent mini={collapsed} />
      </aside>

      {/* ── Mobile sidebar (off-canvas) ───────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .2 }}
              onClick={onClose}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,.55)",
                backdropFilter: "blur(3px)",
                zIndex: 50,
              }}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "fixed", left: 0, top: 0, bottom: 0, width: 260,
                background: "var(--sb-bg)",
                borderRight: "1px solid var(--sb-border)",
                zIndex: 51,
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 28, height: 28, borderRadius: 6,
                  background: "var(--sb-hover-bg)", border: "1px solid var(--sb-border)",
                  cursor: "pointer", color: "var(--sb-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1, transition: "all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--sb-text)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--sb-muted)"; }}
              >
                <HiOutlineXMark size={14} />
              </button>

              <SidebarContent mini={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;