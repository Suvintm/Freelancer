/**
 * EditorWallet — Premium Mobile-First Fintech
 * Pure black canvas · crisp white elements · feels like a flagship bank app
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  FaWallet, FaClock, FaArrowUp, FaEye, FaEyeSlash,
  FaShieldAlt, FaChevronRight, FaCheckCircle, FaUniversity,
  FaExclamationCircle, FaBell,
} from "react-icons/fa";
import {
  HiOutlineArrowUpRight, HiOutlineArrowDownLeft, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineSparkles,
  HiOutlineBanknotes, HiOutlineChartBarSquare, HiOutlineArrowPath,
} from "react-icons/hi2";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import WithdrawalModal from "../components/WithdrawalModal";
import EditorKYCForm from "../components/EditorKYCForm";

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────
const Counter = ({ value, size = 38 }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const s = Date.now(), d = 1100, t = value || 0;
    const f = () => {
      const p = Math.min((Date.now() - s) / d, 1);
      setN(Math.round((1 - Math.pow(1 - p, 4)) * t));
      if (p < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }, [value]);
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: size, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>
      ₹{n.toLocaleString("en-IN")}
    </span>
  );
};

// ─── 3D CARD ──────────────────────────────────────────────────────────────
const Card = ({ available, pending, name, hidden }) => {
  const ref = useRef(null);
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 130, damping: 24 });
  const sy = useSpring(ry, { stiffness: 130, damping: 24 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        rx.set(((e.clientY - r.top - r.height / 2) / r.height) * -10);
        ry.set(((e.clientX - r.left - r.width / 2) / r.width) * 10);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      style={{ rotateX: sx, rotateY: sy, transformStyle: "preserve-3d", perspective: 1200 }}
    >
      <div style={{
        borderRadius: 28,
        background: "linear-gradient(140deg, #111118 0%, #1b1f3a 45%, #0d1829 75%, #080810 100%)",
        padding: "28px 26px 24px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.12)",
        minHeight: 206,
      }}>
        {/* Aurora blobs */}
        <div style={{ position:"absolute", top:-50, right:-30, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(120,180,255,0.13),transparent 65%)", animation:"blob1 7s ease-in-out infinite", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-40, left:0, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,255,140,0.06),transparent 65%)", animation:"blob2 9s ease-in-out infinite", pointerEvents:"none" }}/>
        {/* Shine sweep */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)", backgroundSize:"220% 100%", animation:"sweep 5s ease-in-out infinite", pointerEvents:"none" }}/>
        {/* Grid */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04, pointerEvents:"none" }}>
          <defs><pattern id="cg" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0L0 0 0 26" fill="none" stroke="white" strokeWidth="0.4"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#cg)"/>
        </svg>

        {/* Top */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, position:"relative" }}>
          <div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.32)", letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:5 }}>SUVIX WALLET</div>
            <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{name || "Editor"}</div>
          </div>
          {/* SIM chip */}
          <div style={{ width:36, height:27, borderRadius:5, background:"linear-gradient(135deg,#c5881e,#8a5c0e)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.28)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1.5, padding:"4px 4px 3px" }}>
              {[...Array(9)].map((_,k)=><div key={k} style={{ background:"rgba(0,0,0,0.3)", borderRadius:1, height:6 }}/>)}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div style={{ marginBottom:18, position:"relative" }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:7 }}>AVAILABLE BALANCE</div>
          {hidden
            ? <div style={{ fontFamily:"monospace", fontSize:34, fontWeight:800, color:"#fff", letterSpacing:5 }}>₹ ••••••</div>
            : <Counter value={available} size={34} />
          }
        </div>

        {/* Pending pill */}
        {pending > 0 && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:"rgba(245,166,35,0.13)", border:"1px solid rgba(245,166,35,0.28)", fontSize:11, color:"#f5a623", marginBottom:16 }}>
            <FaClock size={8}/>₹{pending.toLocaleString("en-IN")} clearing
          </div>
        )}

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: pending > 0 ? 0 : 16, position:"relative" }}>
          <div style={{ fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,0.22)", letterSpacing:3 }}>•••• •••• •••• ••••</div>
          <div style={{ display:"flex" }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(235,0,27,0.85)" }}/>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(247,158,27,0.85)", marginLeft:-10 }}/>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── ACTION BUTTON ────────────────────────────────────────────────────────
const Act = ({ icon, label, white, disabled, onClick }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.06, y: -2 }}
    whileTap={disabled ? {} : { scale: 0.94 }}
    onClick={disabled ? undefined : onClick}
    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:9, background:"none", border:"none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.3 : 1, padding:0 }}
  >
    <div style={{
      width:58, height:58, borderRadius:20,
      background: white ? "#fff" : "rgba(255,255,255,0.07)",
      border: white ? "none" : "1px solid rgba(255,255,255,0.09)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:22, color: white ? "#000" : "#fff",
      boxShadow: white ? "0 6px 24px rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.4)" : "none",
    }}>
      {icon}
    </div>
    <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.38)", letterSpacing:"0.02em", whiteSpace:"nowrap" }}>{label}</span>
  </motion.button>
);

// ─── MINI STAT CARD ───────────────────────────────────────────────────────
const Mini = ({ label, value, color, icon, spark, hidden }) => (
  <motion.div
    whileHover={{ borderColor: "rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.06)" }}
    style={{
      background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
      borderRadius:22, padding:"18px 16px 14px", transition:"all 0.2s",
    }}
  >
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.14em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ width:26, height:26, borderRadius:8, background:`${color}16`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color }}>{icon}</div>
    </div>
    {hidden
      ? <div style={{ fontSize:20, fontWeight:800, color, fontFamily:"monospace", letterSpacing:3 }}>••••</div>
      : <div style={{ fontSize:21, fontWeight:800, color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:-1 }}>₹{(value||0).toLocaleString("en-IN")}</div>
    }
    {spark?.length > 1 && !hidden && (
      <div style={{ marginTop:10, height:30 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{top:0,right:0,bottom:0,left:0}}>
            <defs>
              <linearGradient id={`sl${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sl${label})`} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </motion.div>
);

// ─── SECTION LABEL ────────────────────────────────────────────────────────
const SLabel = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.28)", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:14 }}>
    {children}
  </div>
);

// ─── TRANSACTION ROW ──────────────────────────────────────────────────────
const TRow = ({ t, i }) => {
  const isIn = ["earning","clearance","bonus","refund_credit"].includes(t.type);
  const isPend = t.status === "pending_clearance";
  const LABELS = { earning:"Order Earning", clearance:"Cleared to Wallet", withdrawal:"Withdrawal", refund_credit:"Refund Credit", bonus:"Bonus", reversal:"Reversal" };
  const label = LABELS[t.type] || t.type?.replace(/_/g," ");

  return (
    <motion.div
      initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.045 }}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Icon box */}
      <div style={{
        width:48, height:48, borderRadius:16, flexShrink:0,
        background: isPend ? "rgba(245,166,35,0.09)" : isIn ? "rgba(255,255,255,0.06)" : "rgba(255,80,80,0.08)",
        border:`1px solid ${isPend ? "rgba(245,166,35,0.2)" : isIn ? "rgba(255,255,255,0.1)" : "rgba(255,80,80,0.14)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, color: isPend ? "#f5a623" : isIn ? "#fff" : "#ff5252",
      }}>
        {isPend ? <HiOutlineClock/> : isIn ? <HiOutlineArrowDownLeft/> : <HiOutlineArrowUpRight/>}
      </div>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{label}</span>
          {isPend && <span style={{ fontSize:8, fontWeight:900, letterSpacing:"0.1em", color:"#f5a623", background:"rgba(245,166,35,0.12)", border:"1px solid rgba(245,166,35,0.22)", padding:"2px 6px", borderRadius:4, textTransform:"uppercase" }}>CLEARING</span>}
          {t.status === "cleared" && <span style={{ fontSize:8, fontWeight:900, letterSpacing:"0.1em", color:"#4ade80", background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", padding:"2px 6px", borderRadius:4, textTransform:"uppercase" }}>CLEARED</span>}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>
          {t.order?.orderNumber && `#${t.order.orderNumber} · `}
          {isPend && t.clearanceDate
            ? `Unlocks ${new Date(t.clearanceDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}`
            : new Date(t.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})
          }
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color: isPend ? "#f5a623" : isIn ? "#4ade80" : "#ff5252" }}>
          {isIn ? "+" : "−"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:2 }}>
          {isPend ? "pending" : t.status === "cleared" ? "✓" : t.status}
        </div>
      </div>
    </motion.div>
  );
};

// ─── WITHDRAWAL ROW ───────────────────────────────────────────────────────
const WRow = ({ w, i }) => {
  const S = {
    pending:    { c:"#f5a623", label:"Pending",    icon:<HiOutlineClock/> },
    processing: { c:"#60a5fa", label:"Processing", icon:<HiOutlineSparkles/> },
    completed:  { c:"#4ade80", label:"Completed",  icon:<HiOutlineCheckCircle/> },
    failed:     { c:"#ff5252", label:"Failed",     icon:<HiOutlineExclamationCircle/> },
    cancelled:  { c:"rgba(255,255,255,0.3)", label:"Cancelled", icon:<HiOutlineExclamationCircle/> },
  }[w.status] || { c:"rgba(255,255,255,0.3)", label:w.status, icon:<HiOutlineClock/> };

  return (
    <motion.div
      initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.045 }}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}
    >
      <div style={{ width:48, height:48, borderRadius:16, flexShrink:0, background:`${S.c}10`, border:`1px solid ${S.c}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:S.c }}>
        {S.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Bank Transfer</span>
          <span style={{ fontSize:8, fontWeight:900, color:S.c, background:`${S.c}12`, border:`1px solid ${S.c}20`, padding:"2px 6px", borderRadius:4, letterSpacing:"0.08em", textTransform:"uppercase" }}>{S.label}</span>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>
          {w.bankSnapshot?.bankName || "—"}{w.bankSnapshot?.accountNumberMasked && ` · ••••${w.bankSnapshot.accountNumberMasked.slice(-4)}`}
        </div>
        {w.failureReason && <div style={{ fontSize:11, color:"#ff5252", marginTop:4 }}>{w.failureReason}</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:800, fontFamily:"monospace", color:"#ff5252" }}>−₹{w.amount.toLocaleString("en-IN")}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:2 }}>
          {new Date(w.requestedAt||w.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
        </div>
      </div>
    </motion.div>
  );
};

// ─── CLEARANCE STRIP ──────────────────────────────────────────────────────
const ClearanceStrip = ({ txns }) => {
  const q = txns.filter(t => t.status === "pending_clearance");
  if (!q.length) return null;
  const total = q.reduce((s, t) => s + t.amount, 0);
  return (
    <div style={{ background:"rgba(245,166,35,0.05)", border:"1px solid rgba(245,166,35,0.16)", borderRadius:22, padding:"18px 20px", marginBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <SLabel>Clearing Queue</SLabel>
          <div style={{ fontSize:26, fontWeight:800, color:"#f5a623", fontFamily:"monospace", letterSpacing:-1 }}>
            ₹{total.toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:800, color:"#f5a623", background:"rgba(245,166,35,0.1)", border:"1px solid rgba(245,166,35,0.22)", padding:"5px 12px", borderRadius:20 }}>
          {q.length} pending
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {q.slice(0,3).map((t,i) => (
          <div key={t._id} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#f5a623", opacity:1-i*0.22, flexShrink:0 }}/>
            <div style={{ flex:1, fontSize:12, color:"rgba(255,255,255,0.38)" }}>₹{t.amount.toLocaleString("en-IN")} — {t.order?.title?.slice(0,24)||`Order #${i+1}`}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#f5a623", fontFamily:"monospace" }}>
              {t.clearanceDate ? new Date(t.clearanceDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) : "—"}
            </div>
          </div>
        ))}
        {q.length > 3 && <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", paddingLeft:17 }}>+{q.length-3} more</div>}
      </div>
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────
const Empty = ({ icon, msg, sub }) => (
  <div style={{ padding:"56px 20px", textAlign:"center" }}>
    <div style={{ width:60, height:60, borderRadius:20, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, color:"rgba(255,255,255,0.13)" }}>{icon}</div>
    <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.3)" }}>{msg}</div>
    {sub && <div style={{ fontSize:12, color:"rgba(255,255,255,0.16)", marginTop:4 }}>{sub}</div>}
  </div>
);

// ─── SKELETON ROW ─────────────────────────────────────────────────────────
const SkRow = () => (
  <div style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
    <div style={{ width:48, height:48, borderRadius:16, background:"rgba(255,255,255,0.04)", backgroundImage:"linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.05) 50%,transparent 75%)", backgroundSize:"200% 100%", animation:"skim 1.5s ease-in-out infinite", flexShrink:0 }}/>
    <div style={{ flex:1 }}>
      <div style={{ height:13, width:"45%", borderRadius:6, background:"rgba(255,255,255,0.05)", marginBottom:8, backgroundImage:"linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.05) 50%,transparent 75%)", backgroundSize:"200% 100%", animation:"skim 1.5s ease-in-out infinite 0.1s" }}/>
      <div style={{ height:10, width:"30%", borderRadius:5, background:"rgba(255,255,255,0.03)", backgroundImage:"linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.04) 50%,transparent 75%)", backgroundSize:"200% 100%", animation:"skim 1.5s ease-in-out infinite 0.2s" }}/>
    </div>
    <div style={{ width:60, height:14, borderRadius:6, background:"rgba(255,255,255,0.05)", backgroundImage:"linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.05) 50%,transparent 75%)", backgroundSize:"200% 100%", animation:"skim 1.5s ease-in-out infinite 0.15s" }}/>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────
const EditorWallet = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const [walletData, setWalletData] = useState(null);
  const [txns, setTxns]   = useState([]);
  const [wds, setWds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWD,  setShowWD]  = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [tab,     setTab]     = useState("earnings");
  const [hidden,  setHidden]  = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [wR, tR, wr] = await Promise.all([
        axios.get(`${backendURL}/api/wallet/balance`,     { headers: { Authorization:`Bearer ${user?.token}` } }),
        axios.get(`${backendURL}/api/wallet/transactions`,{ headers: { Authorization:`Bearer ${user?.token}` } }),
        axios.get(`${backendURL}/api/withdrawals/my`,     { headers: { Authorization:`Bearer ${user?.token}` } }),
      ]);
      setWalletData(wR.data?.wallet || wR.data);
      setTxns(tR.data?.transactions || []);
      setWds(wr.data?.withdrawals   || []);
    } catch { toast.error("Failed to load wallet"); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (user) load(); }, [user]);

  const av  = walletData?.available   || walletData?.walletBalance    || 0;
  const pnd = walletData?.pending     || walletData?.pendingBalance    || 0;
  const lft = walletData?.lifetime    || walletData?.lifetimeEarnings  || 0;
  const wd  = walletData?.withdrawn   || walletData?.totalWithdrawn    || 0;
  const kycOk = user?.kycStatus === "verified";
  const spark = txns.filter(t=>t.type==="earning").slice(0,7).reverse().map((t,i)=>({v:t.amount,i}));

  const onWd = () => {
    if (!kycOk) { setShowKYC(true); return; }
    if (av <= 0) { toast.info("No available balance to withdraw"); return; }
    setShowWD(true);
  };

  return (
    <>
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,12px) scale(1.08)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-10px) scale(1.06)} }
        @keyframes sweep { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes skim  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes wglow { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.18)} 50%{box-shadow:0 0 0 10px rgba(255,255,255,0)} }
        ::-webkit-scrollbar { width: 0; }
        @media (max-width:480px) {
          .w-actions { grid-template-columns: repeat(4,1fr) !important; gap: 6px !important; }
          .w-stats   { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#030305", fontFamily:"'DM Sans',sans-serif", color:"#fff", paddingBottom:100 }}>

        {/* ── TOP BAR ── */}
        <div style={{ position:"sticky", top:0, zIndex:60, background:"rgba(3,3,5,0.9)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"14px 20px" }}>
          <div style={{ maxWidth:520, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:20, fontWeight:900, letterSpacing:-0.5 }}>Wallet</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>Earnings · Payouts · History</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {/* Eye toggle */}
              <motion.button whileTap={{ scale:0.88 }} onClick={() => setHidden(h=>!h)}
                style={{ width:38, height:38, borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14 }}>
                {hidden ? <FaEye/> : <FaEyeSlash/>}
              </motion.button>
              {/* Refresh */}
              <motion.button whileTap={{ rotate:180, scale:0.88, transition:{ duration:0.4 } }} onClick={load}
                style={{ width:38, height:38, borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}>
                <HiOutlineArrowPath/>
              </motion.button>
              {/* Withdraw CTA */}
              <motion.button
                whileHover={av>0 ? { scale:1.04 } : {}} whileTap={av>0 ? { scale:0.95 } : {}}
                onClick={onWd}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:13, cursor:"pointer", fontWeight:800, fontSize:13, border:"none",
                  background: av>0 ? "#ffffff" : "rgba(255,255,255,0.06)",
                  color: av>0 ? "#000" : "rgba(255,255,255,0.22)",
                  boxShadow: av>0 ? "0 4px 20px rgba(255,255,255,0.22)" : "none",
                  animation: av>0 ? "wglow 2.5s ease-in-out infinite" : "none",
                }}>
                <HiOutlineArrowUpRight size={15}/> Withdraw
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth:520, margin:"0 auto", padding:"24px 18px" }}>

          {/* CARD */}
          <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }} style={{ marginBottom:28 }}>
            <Card available={av} pending={pnd} name={user?.name} hidden={hidden}/>
          </motion.div>

          {/* ACTIONS */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className="w-actions"
            style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:34 }}>
            <Act icon={<HiOutlineArrowUpRight/>} label="Withdraw" white onClick={onWd} disabled={av<=0}/>
            <Act icon={<HiOutlineBanknotes/>}    label="Add Bank"  onClick={()=>navigate("/kyc-details")}/>
            <Act icon={<HiOutlineChartBarSquare/>} label="Analytics" onClick={()=>navigate("/editor-analytics")}/>
            <Act icon={<FaShieldAlt/>} label={kycOk?"Verified":"KYC"} onClick={()=>navigate("/kyc-details")}/>
          </motion.div>

          {/* OVERVIEW */}
          <SLabel>Overview</SLabel>
          <div className="w-stats"
            style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
            {[
              { label:"Available", value:av,  color:"#4ade80", icon:<FaWallet/>,      spark },
              { label:"Clearing",  value:pnd, color:"#f5a623", icon:<FaClock/> },
              { label:"All-Time",  value:lft, color:"#60a5fa", icon:<FaCheckCircle/> },
              { label:"Withdrawn", value:wd,  color:"#c084fc", icon:<FaArrowUp/> },
            ].map((s,i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12+i*0.07 }}>
                <Mini {...s} hidden={hidden}/>
              </motion.div>
            ))}
          </div>

          {/* KYC BANNER */}
          <AnimatePresence>
            {!kycOk && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ overflow:"hidden", marginBottom:24 }}>
                <div onClick={()=>navigate("/kyc-details")}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 18px", borderRadius:20, background:"rgba(245,166,35,0.05)", border:"1px solid rgba(245,166,35,0.16)", cursor:"pointer", transition:"background 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(245,166,35,0.1)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(245,166,35,0.05)"}>
                  <div style={{ width:44, height:44, borderRadius:14, background:"rgba(245,166,35,0.1)", border:"1px solid rgba(245,166,35,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#f5a623", fontSize:19 }}>
                    <FaShieldAlt/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#f5a623" }}>Verify to Withdraw</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>One-time KYC · takes 2 minutes</div>
                  </div>
                  <FaChevronRight size={11} color="rgba(255,255,255,0.2)"/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CLEARANCE QUEUE */}
          <ClearanceStrip txns={txns}/>

          {/* ACTIVITY */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <SLabel>Activity</SLabel>
            {/* Tab pill */}
            <div style={{ display:"flex", gap:3, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:3 }}>
              {[{ id:"earnings", l:"Earnings" },{ id:"withdrawals", l:"Payouts" }].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding:"5px 14px", borderRadius:11, fontSize:11, fontWeight:800, cursor:"pointer", border:"none", transition:"all 0.2s",
                  background: tab===t.id ? "#fff" : "transparent",
                  color:       tab===t.id ? "#000" : "rgba(255,255,255,0.35)",
                  boxShadow:   tab===t.id ? "0 2px 10px rgba(0,0,0,0.4)" : "none",
                }}>{t.l}</button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="sk" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                {[...Array(5)].map((_,k)=><SkRow key={k}/>)}
              </motion.div>
            ) : tab === "earnings" ? (
              <motion.div key="earn" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                {txns.length===0
                  ? <Empty icon={<HiOutlineBanknotes/>} msg="No earnings yet" sub="Complete your first order to start earning"/>
                  : txns.map((t,i)=><TRow key={t._id} t={t} i={i}/>)
                }
              </motion.div>
            ) : (
              <motion.div key="wd" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                {wds.length===0
                  ? <Empty icon={<HiOutlineArrowUpRight/>} msg="No withdrawals yet"/>
                  : wds.map((w,i)=><WRow key={w._id} w={w} i={i}/>)
                }
              </motion.div>
            )}
          </AnimatePresence>

          {/* HOW IT WORKS */}
          <div style={{ marginTop:32, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:24, padding:"22px 20px 18px" }}>
            <SLabel>How Clearance Works</SLabel>
            {[
              { n:"01", text:"Order completes",  sub:"Earnings enter 7-day clearance",           c:"#f5a623" },
              { n:"02", text:"Clearance period", sub:"Fraud & chargeback protection window",     c:"#60a5fa" },
              { n:"03", text:"Funds unlock",     sub:"Available balance ready to withdraw",      c:"#4ade80" },
            ].map((s,i,a)=>(
              <div key={i} style={{ display:"flex", gap:16 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingBottom: i<a.length-1 ? 18 : 0 }}>
                  <div style={{ width:34, height:34, borderRadius:11, background:`${s.c}10`, border:`1px solid ${s.c}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:s.c, fontFamily:"monospace", flexShrink:0 }}>{s.n}</div>
                  {i<a.length-1 && <div style={{ width:1, flex:1, minHeight:12, background:"rgba(255,255,255,0.06)", marginTop:5 }}/>}
                </div>
                <div style={{ paddingBottom: i<a.length-1 ? 18 : 0, paddingTop:7 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{s.text}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:3 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SECURITY */}
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10, padding:"13px 16px", borderRadius:16, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.055)" }}>
            <FaShieldAlt size={12} color="rgba(255,255,255,0.25)" style={{ flexShrink:0 }}/>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.26)", lineHeight:1.6 }}>
              AES-256 encrypted · Payouts only to verified bank account
            </div>
          </div>

        </div>
      </div>

      <WithdrawalModal isOpen={showWD} onClose={()=>setShowWD(false)} availableBalance={av} onSuccess={load}/>
      {showKYC && <EditorKYCForm onSuccess={()=>{ setShowKYC(false); load(); }} onClose={()=>setShowKYC(false)}/>}
    </>
  );
};

export default EditorWallet;