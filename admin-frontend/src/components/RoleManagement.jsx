import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
  HiOutlineShieldCheck
} from "react-icons/hi2";
import { rolesApi } from "../api/adminApi";
import { PERMISSIONS_LIST } from "../utils/constants";


const DEFAULT_ROLE_FORM = {
  name: "",
  value: "",
  description: "",
  color: "#1d4ed8",
  isActive: true,
  permissions: Object.fromEntries(PERMISSIONS_LIST.map(p => [p.key, false]))
};

const RoleManagement = () => {
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_ROLE_FORM);
  const [delConfirm, setDelConfirm] = useState(null);

  const { data: rolesResponse, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll().then(res => res.data),
  });

  const roles = rolesResponse?.roles || [];

  const createMut = useMutation({
    mutationFn: (d) => rolesApi.create(d),
    onSuccess: () => { toast.success("Role created"); queryClient.invalidateQueries(["roles"]); closePanel(); },
    onError: (e) => toast.error(e.response?.data?.message || "Create failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => rolesApi.update(id, d),
    onSuccess: () => { toast.success("Role updated"); queryClient.invalidateQueries(["roles"]); closePanel(); },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => rolesApi.remove(id),
    onSuccess: () => { toast.success("Role deleted"); queryClient.invalidateQueries(["roles"]); setDelConfirm(null); },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => rolesApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries(["roles"]),
    onError: () => toast.error("Toggle failed"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_ROLE_FORM);
    setShowPanel(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name,
      value: role.value,
      description: role.description || "",
      color: role.color || "#1d4ed8",
      isActive: role.isActive,
      permissions: { ...DEFAULT_ROLE_FORM.permissions, ...(role.permissions || {}) }
    });
    setShowPanel(true);
  };

  const closePanel = () => { setShowPanel(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value.trim()) return toast.error("Name and Value are required");

    if (editing) {
      updateMut.mutate({ id: editing._id, d: form });
    } else {
      createMut.mutate(form);
    }
  };

  const togglePermission = (key) => setForm((p) => ({ ...p, permissions: { ...p.permissions, [key]: !p.permissions[key] } }));

  // Auto-generate value from name if not editing
  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm(p => ({
      ...p,
      name: val,
      value: editing ? p.value : val.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    }));
  };

  return (
    <>
      <div style={{ background: "var(--am-card)", border: "1px solid var(--am-border)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--am-shadow)", marginTop: 20 }}>
        {/* Toolbar */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--am-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--am-text-primary)", display: "flex", gap: 8, alignItems: "center" }}>
            <HiOutlineShieldCheck size={18} /> Role Configurations
          </div>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "var(--am-text-primary)", border: "none", borderRadius: 7, fontSize: 13, color: "var(--am-page)", cursor: "pointer", fontWeight: 600 }}>
            <HiOutlinePlus size={15} /> Add Role
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr>
                {["Role Name", "Key Value", "Granted Permissions", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "left", color: "var(--am-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", background: "var(--am-thead)", borderBottom: "1px solid var(--am-border)", whiteSpace: "nowrap", ...(i === 4 ? { textAlign: "right" } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center" }}>Loading roles...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--am-text-muted)" }}>No custom roles defined.</td></tr>
              ) : roles.map((r) => (
                <tr key={r._id} style={{ borderBottom: "1px solid var(--am-row-brd)" }} className="am-row">
                  <td style={{ padding: "14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: r.color || "#000" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--am-text-primary)" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{r.description || "No description provided"}</div>
                    </div>
                  </td>
                  <td style={{ padding: "14px", fontSize: 13, color: "var(--am-text-primary)", fontFamily: "monospace" }}>{r.value}</td>
                  <td style={{ padding: "14px", fontSize: 13, color: "var(--am-text-muted)" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220 }}>
                      {Object.entries(r.permissions || {}).filter(([_, v]) => v).length} modules enabled
                    </div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: r.isActive ? "#f0fdf4" : "#fef2f2", color: r.isActive ? "#15803d" : "#b91c1c", border: `1px solid ${r.isActive ? "#bbf7d0" : "#fecaca"}` }}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                      {!r.isSystem && (
                        <button onClick={() => toggleMut.mutate({ id: r._id, isActive: !r.isActive })} title={r.isActive ? "Deactivate" : "Activate"} style={{ padding: "5px 8px", background: r.isActive ? "#fef2f2" : "#f0fdf4", border: `1px solid ${r.isActive ? "#fecaca" : "#bbf7d0"}`, borderRadius: 6, color: r.isActive ? "#b91c1c" : "#15803d", cursor: "pointer", display: "flex", alignItems: "center" }} className="am-tbtn">
                          {r.isActive ? <HiOutlineNoSymbol size={13} /> : <HiOutlineCheckCircle size={13} />}
                        </button>
                      )}
                      <button onClick={() => openEdit(r)} className="am-tbtn" style={{ padding: "5px 10px" }} title="Edit">
                        <HiOutlinePencilSquare size={13} />
                      </button>
                      {!r.isSystem && (
                        <button onClick={() => setDelConfirm(r._id)} style={{ padding: "5px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center" }} className="am-tbtn" title="Delete">
                          <HiOutlineTrash size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPanel && (
        <>
          <div onClick={closePanel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)", zIndex: 1000 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "var(--am-panel-bg)", zIndex: 1001, display: "flex", flexDirection: "column", boxShadow: "-6px 0 32px rgba(0,0,0,.18)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--am-border)", background: "var(--am-panel-hdr)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--am-text-primary)" }}>{editing ? "Edit Role" : "Add Role"}</div>
              <button onClick={closePanel} style={{ width: 30, height: 30, borderRadius: 6, border: "none", cursor: "pointer" }}><HiOutlineXMark size={16} /></button>
            </div>
            <div className="am-panel-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <form id="role-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--am-text-muted)", display: "block", marginBottom: 6 }}>Display Name</label>
                  <input type="text" required value={form.name} onChange={handleNameChange} className="am-input" placeholder="e.g. Finance Officer" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--am-text-muted)", display: "block", marginBottom: 6 }}>Internal Value (Snake_case)</label>
                  <input type="text" required disabled={!!editing} value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} className="am-input" placeholder="e.g. finance_officer" style={{ opacity: editing ? 0.7 : 1 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--am-text-muted)", display: "block", marginBottom: 6 }}>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="am-input" placeholder="Short summary" style={{ minHeight: 60 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--am-text-muted)", display: "block", marginBottom: 6 }}>Badge Color</label>
                  <input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} style={{ width: 100, height: 36, border: "none" }} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--am-text-muted)", display: "block", marginBottom: 10 }}>Module Clearances</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {PERMISSIONS_LIST.map((p) => {
                      const on = form.permissions[p.key];
                      return (
                        <div key={p.key} onClick={() => togglePermission(p.key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, border: `1px solid ${on ? "var(--am-text-primary)" : "var(--am-border)"}`, background: on ? "var(--am-hover)" : "var(--am-card)", cursor: "pointer" }}>
                          <input type="checkbox" checked={!!on} readOnly style={{ accentColor: "var(--am-text-primary)" }} />
                          <span style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? "var(--am-text-primary)" : "var(--am-text-muted)" }}>{p.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--am-border)", background: "var(--am-panel-hdr)", display: "flex", gap: 10 }}>
              <button form="role-form" type="submit" disabled={createMut.isPending || updateMut.isPending} style={{ flex: 1, padding: "10px 0", background: "var(--am-text-primary)", border: "none", borderRadius: 8, color: "var(--am-page)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {editing ? "Save Role" : "Create Role"}
              </button>
            </div>
          </div>
        </>
      )}

      {delConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--am-panel-bg)", borderRadius: 12, padding: 24, width: 320 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Confirm Delete</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--am-text-muted)" }}>Are you sure you want to delete this role?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDelConfirm(null)} className="am-tbtn">Cancel</button>
              <button onClick={() => deleteMut.mutate(delConfirm)} className="am-tbtn" style={{ background: "#dc2626", color: "#fff" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleManagement;
