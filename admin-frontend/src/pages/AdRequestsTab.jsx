// AdRequestsTab.jsx
// Drop this inside AdManagerPage as a new tab panel.
// Shows all incoming user ad requests with full detail view and approve/reject actions.

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineEye, HiOutlineCheck, HiOutlineXMark, HiOutlineArrowPath,
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone, HiOutlineCalendarDays,
  HiOutlineCurrencyRupee, HiOutlineGlobeAlt, HiOutlineChatBubbleLeft,
  HiOutlineArrowTopRightOnSquare, HiOutlinePencilSquare,
} from "react-icons/hi2";
import { FaYoutube, FaInstagram, FaFacebook } from "react-icons/fa";
import axios from "axios";

// ─── Status config ────────────────────────────────────────────────────────
const STATUS = {
  pending:           { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "Pending Review" },
  under_review:      { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  label: "Under Review" },
  approved:          { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   label: "Approved" },
  rejected:          { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "Rejected" },
  changes_requested: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", label: "Changes Requested" },
};

const AD_TYPE_LABELS = {
  youtube:    "YouTube Channel",
  instagram:  "Instagram Page",
  website:    "Website / Brand",
  app:        "Mobile App",
  course:     "Online Course",
  event:      "Event / Launch",
  freelancer: "Freelancer",
  ecommerce:  "E-commerce",
};

const PLACEMENT_LABELS = {
  home_banner: "Home Banner",
  reels_feed:  "Reels Feed",
  both:        "Both Placements",
};

const inputStyle = { width: "100%", background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: "8px 10px", color: "#f4f4f5", fontSize: 13, outline: "none", boxSizing: "border-box" };
const actionBtn  = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 };
const secondaryBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46", cursor: "pointer", fontSize: 13, fontWeight: 600 };

// ─── Detail Modal ─────────────────────────────────────────────────────────
const RequestDetail = ({ request, onClose, onAction, saving }) => {
  const [rejectReason, setRejectReason] = useState("");
  const [changesText, setChangesText] = useState("");
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || "");
  const [activeAction, setActiveAction] = useState(null); // "reject" | "changes"

  const status = STATUS[request.status] || STATUS.pending;

  const linkItems = [
    { key: "websiteUrl",   label: "Website",   icon: HiOutlineGlobeAlt, href: request.websiteUrl },
    { key: "youtubeUrl",   label: "YouTube",   icon: FaYoutube,          href: request.youtubeUrl },
    { key: "instagramUrl", label: "Instagram", icon: FaInstagram,        href: request.instagramUrl },
    { key: "facebookUrl",  label: "Facebook",  icon: FaFacebook,         href: request.facebookUrl },
    { key: "otherUrl",     label: "Other",     icon: HiOutlineGlobeAlt,  href: request.otherUrl },
  ].filter(l => l.href);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1c1c1e", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#111113", zIndex: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: status.bg, color: status.color }}>{status.label}</span>
              <span style={{ fontSize: 11, color: "#52525b" }}>#{request._id.toString().slice(-8).toUpperCase()}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f4f4f5", margin: 0 }}>{request.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer" }}>
            <HiOutlineXMark style={{ fontSize: 20 }} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Media preview */}
          {request.mediaUrl && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Banner Creative</div>
              <div style={{ borderRadius: 12, overflow: "hidden", background: "#0c0c0e", border: "1px solid #1c1c1e", position: "relative", paddingBottom: `${(192/375)*100}%` }}>
                <div style={{ position: "absolute", inset: 0 }}>
                  {request.mediaType === "video"
                    ? <video src={request.mediaUrl} muted autoPlay loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <img src={request.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                </div>
              </div>
            </div>
          )}

          {/* Request details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { icon: HiOutlineUser,            label: "Advertiser",    value: request.advertiserName },
              { icon: HiOutlineEnvelope,         label: "Email",         value: request.advertiserEmail },
              { icon: HiOutlinePhone,            label: "Phone",         value: request.advertiserPhone || "—" },
              { icon: HiOutlineGlobeAlt,         label: "Ad Type",       value: AD_TYPE_LABELS[request.adType] || request.adType },
              { icon: HiOutlineGlobeAlt,         label: "Placement",     value: PLACEMENT_LABELS[request.placement] || request.placement },
              { icon: HiOutlineCalendarDays,     label: "Duration",      value: `${request.days} day${request.days > 1 ? "s" : ""}` },
              { icon: HiOutlineCurrencyRupee,    label: "Quoted Price",  value: request.requestedPrice ? `₹${request.requestedPrice.toLocaleString("en-IN")}` : "—" },
              { icon: HiOutlineCalendarDays,     label: "Submitted",     value: new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 10, background: "#0c0c0e", border: "1px solid #1c1c1e" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <Icon style={{ fontSize: 11, color: "#52525b" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                </div>
                <p style={{ fontSize: 12, color: "#d4d4d8", fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Ad copy */}
          {(request.description || request.ctaText) && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "#0c0c0e", border: "1px solid #1c1c1e", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Ad Copy</div>
              {request.description && <p style={{ fontSize: 12, color: "#d4d4d8", marginBottom: 6 }}>{request.description}</p>}
              {request.ctaText && <span style={{ padding: "3px 10px", borderRadius: 6, background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700 }}>{request.ctaText}</span>}
            </div>
          )}

          {/* Links */}
          {linkItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Links</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {linkItems.map(({ key, label, icon: Icon, href }) => (
                  <a key={key} href={href} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#18181b", border: "1px solid #27272a", color: "#a1a1aa", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                    <Icon style={{ fontSize: 11 }} /> {label} <HiOutlineArrowTopRightOnSquare style={{ fontSize: 9 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Additional notes from advertiser */}
          {request.additionalNotes && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Note from Advertiser</div>
              <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0 }}>{request.additionalNotes}</p>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {request.status === "rejected" && request.rejectionReason && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Rejection Reason</div>
              <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>{request.rejectionReason}</p>
            </div>
          )}

          {/* Admin notes field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Internal Admin Notes</label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} style={{ ...inputStyle, height: 64, resize: "vertical" }} placeholder="Internal notes (not shown to advertiser)…" />
          </div>

          {/* Action buttons — only show for actionable statuses */}
          {["pending", "under_review", "changes_requested"].includes(request.status) && (
            <div>
              <div style={{ height: 1, background: "#1c1c1e", margin: "16px 0" }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Actions</div>

              {/* Mark as under review */}
              {request.status === "pending" && (
                <div style={{ marginBottom: 10 }}>
                  <button onClick={() => onAction("review", request._id, {})} disabled={saving} style={{ ...secondaryBtn, opacity: saving ? 0.6 : 1 }}>
                    <HiOutlineClock style={{ fontSize: 14 }} /> Mark as Under Review
                  </button>
                </div>
              )}

              {/* Approve */}
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => onAction("approve", request._id, { adminNotes })}
                  disabled={saving}
                  style={{ ...actionBtn, background: "#22c55e", opacity: saving ? 0.6 : 1 }}
                >
                  <HiOutlineCheck style={{ fontSize: 14 }} />
                  {saving ? "Processing…" : "Approve & Create Ad"}
                </button>
                <p style={{ fontSize: 10, color: "#52525b", marginTop: 4 }}>
                  This will create an Advertisement automatically. You can then edit layout & button style in Ad Manager.
                </p>
              </div>

              {/* Request changes */}
              {activeAction !== "reject" && (
                <div style={{ marginBottom: 10 }}>
                  {activeAction === "changes" ? (
                    <div>
                      <textarea value={changesText} onChange={e => setChangesText(e.target.value)} style={{ ...inputStyle, height: 80, resize: "vertical", marginBottom: 8 }} placeholder="Describe what changes are needed…" />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => onAction("request-changes", request._id, { changes: changesText, adminNotes })} disabled={!changesText.trim() || saving} style={{ ...secondaryBtn, opacity: (!changesText.trim() || saving) ? 0.5 : 1, color: "#a78bfa", borderColor: "#6d28d9" }}>
                          <HiOutlinePencilSquare style={{ fontSize: 14 }} /> Send Change Request
                        </button>
                        <button onClick={() => setActiveAction(null)} style={secondaryBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setActiveAction("changes")} style={{ ...secondaryBtn, color: "#a78bfa", borderColor: "#6d28d9" }}>
                      <HiOutlinePencilSquare style={{ fontSize: 14 }} /> Request Changes
                    </button>
                  )}
                </div>
              )}

              {/* Reject */}
              {activeAction !== "changes" && (
                <div>
                  {activeAction === "reject" ? (
                    <div>
                      <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ ...inputStyle, height: 80, resize: "vertical", marginBottom: 8, borderColor: "#7f1d1d" }} placeholder="Reason for rejection (sent to advertiser)…" />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => onAction("reject", request._id, { reason: rejectReason, adminNotes })} disabled={!rejectReason.trim() || saving} style={{ ...secondaryBtn, opacity: (!rejectReason.trim() || saving) ? 0.5 : 1, color: "#ef4444", borderColor: "#7f1d1d" }}>
                          <HiOutlineXMark style={{ fontSize: 14 }} /> Confirm Rejection
                        </button>
                        <button onClick={() => setActiveAction(null)} style={secondaryBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setActiveAction("reject")} style={{ ...secondaryBtn, color: "#ef4444", borderColor: "#7f1d1d" }}>
                      <HiOutlineXMark style={{ fontSize: 14 }} /> Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {request.status === "approved" && request.advertisementId && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
              <HiOutlineCheckCircle style={{ color: "#22c55e", fontSize: 16 }} />
              <span style={{ fontSize: 12, color: "#86efac" }}>Approved — Advertisement created (ID: {request.advertisementId.toString().slice(-8).toUpperCase()})</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main AdRequestsTab ───────────────────────────────────────────────────
const AdRequestsTab = ({ API, authHeader, showToast }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const { data } = await axios.get(`${API}/admin/ad-requests?${params}`, { headers: authHeader });
      setRequests(data.requests || []);
      setPendingCount(data.pendingCount || 0);
    } catch {
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  }, [API, filter, search, authHeader]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (action, id, payload) => {
    setSaving(true);
    try {
      await axios.patch(`${API}/admin/ad-requests/${id}/${action}`, payload, { headers: authHeader });
      showToast(
        action === "approve" ? "Request approved! Ad is now live." :
        action === "reject"  ? "Request rejected." :
        action === "review"  ? "Marked as under review." :
        "Changes requested."
      );
      setSelected(null);
      fetchRequests();
    } catch (e) {
      showToast(e.response?.data?.message || `Failed to ${action}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const filters = [
    { id: "all",              label: "All" },
    { id: "pending",          label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { id: "under_review",     label: "Under Review" },
    { id: "changes_requested", label: "Needs Changes" },
    { id: "approved",         label: "Approved" },
    { id: "rejected",         label: "Rejected" },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: filter === f.id ? "1px solid #6366f1" : "1px solid #27272a",
              background: filter === f.id ? "rgba(99,102,241,0.15)" : "#18181b",
              color: filter === f.id ? "#818cf8" : "#71717a",
            }}
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, title…"
          style={{ ...inputStyle, flex: 1, minWidth: 200, maxWidth: 300 }}
          onKeyDown={e => e.key === "Enter" && fetchRequests()}
        />
        <button onClick={fetchRequests} style={{ ...secondaryBtn, padding: "6px 12px" }}>
          <HiOutlineArrowPath style={{ fontSize: 14 }} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#52525b" }}>Loading requests…</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#52525b" }}>
          <HiOutlineExclamationCircle style={{ fontSize: 36, display: "block", margin: "0 auto 12px", color: "#27272a" }} />
          <p>No ad requests found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requests.map(req => {
            const st = STATUS[req.status] || STATUS.pending;
            return (
              <div
                key={req._id}
                style={{ background: "#111113", border: "1px solid #1c1c1e", borderRadius: 14, overflow: "hidden", display: "flex", alignItems: "stretch", cursor: "pointer" }}
                onClick={() => setSelected(req)}
              >
                {/* Thumbnail */}
                <div style={{ width: 100, flexShrink: 0, background: "#18181b", position: "relative" }}>
                  {req.mediaUrl ? (
                    req.mediaType === "video"
                      ? <video src={req.mediaUrl} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <img src={req.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#27272a", fontSize: 24 }}>📷</div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                    <span style={{ fontSize: 10, color: "#52525b", flexShrink: 0 }}>{AD_TYPE_LABELS[req.adType] || req.adType}</span>
                    <span style={{ fontSize: 10, color: "#52525b", flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 10, color: "#52525b", flexShrink: 0 }}>{PLACEMENT_LABELS[req.placement] || req.placement}</span>
                    <span style={{ fontSize: 10, color: "#52525b", flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 10, color: "#52525b", flexShrink: 0 }}>{req.days}d</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5", margin: "0 0 2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{req.title}</p>
                  <p style={{ fontSize: 11, color: "#71717a", margin: 0 }}>{req.advertiserName} · {req.advertiserEmail}</p>
                </div>
                {/* Right */}
                <div style={{ padding: "12px 14px", flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
                  {req.requestedPrice && <p style={{ fontSize: 13, fontWeight: 800, color: "#f4f4f5", margin: 0 }}>₹{req.requestedPrice.toLocaleString("en-IN")}</p>}
                  <p style={{ fontSize: 10, color: "#52525b", margin: 0 }}>{new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  <button style={{ ...secondaryBtn, padding: "5px 10px", fontSize: 11, marginTop: 4 }} onClick={e => { e.stopPropagation(); setSelected(req); }}>
                    <HiOutlineEye style={{ fontSize: 12 }} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <RequestDetail
            request={selected}
            onClose={() => setSelected(null)}
            onAction={handleAction}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdRequestsTab;