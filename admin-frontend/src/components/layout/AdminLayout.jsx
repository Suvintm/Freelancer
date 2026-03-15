// ─── AdminLayout.jsx — Main shell wrapping all protected pages ────────────
// Sidebar (collapsible) + Topbar + main content area with correct offsets
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";
import CommandPalette from "../ui/CommandPalette";

const AdminLayout = () => {
  const [sidebarOpen,     setSidebarOpen]     = useState(false);  // mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);  // desktop

  const sidebarW = sidebarCollapsed ? 64 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <CommandPalette />
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,  // prevents flex blowout
        transition: "margin-left var(--transition-slow)",
      }}
        className="admin-main-area"
      >
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          collapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: "24px 24px",
          marginTop: 60,       // topbar height
          overflowY: "auto",
          maxWidth: "100%",
          minHeight: "calc(100vh - 60px)",
        }}>
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Desktop sidebar offset */}
      <style>{`
        @media (min-width: 768px) {
          .admin-main-area {
            margin-left: ${sidebarW}px;
            transition: margin-left 250ms ease;
          }
        }
        @media (max-width: 767px) {
          .admin-main-area {
            margin-left: 0 !important;
          }
          main {
            padding: 16px 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
