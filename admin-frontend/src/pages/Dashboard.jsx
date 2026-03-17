/**
 * SuviX Admin — Command Center Dashboard
 * Dark industrial luxury theme
 * Drop your logo at: admin-frontend/src/assets/suvix-logo.png
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineUsers, HiOutlineShoppingBag, HiOutlineCurrencyRupee,
  HiOutlineBriefcase, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown,
  HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineClock,
  HiOutlineArrowPath, HiOutlineShieldCheck, HiOutlineBanknotes,
  HiOutlineChartBarSquare, HiOutlineSignal
} from "react-icons/hi2";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { statsApi } from "../api/adminApi";
import { formatCurrency } from "../utils/formatters";

// ─── LOGO — place your file at admin-frontend/src/assets/suvix-logo.png ───
// If the import fails (no logo yet), the text fallback renders instead.
let SuvixLogo = null;
try { SuvixLogo = (await import("../assets/suvix-logo.png")).default; } catch {}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
const COLORS = {
  bg:        "#080808",
  surface:   "#101010",
  elevated:  "#161616",
  border:    "#232323",
  borderHi:  "#2e2e2e",
  text:      "#f0f0f0",
  muted:     "#666",
  faint:     "#333",
  accent:    "#e8c547",   // gold — single sharp accent
  accentDim: "#e8c54722",
  green:     "#22c55e",
  red:       "#ef4444",
  blue:      "#3b82f6",
  violet:    "#a855f7",
};

const CHART_PALETTE = ["#e8c547", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4"];

// ─── PARTICLE CANVAS ──────────────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const particles = useRef([]);

  const init = useCallback((canvas) => {
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const COUNT = Math.floor((W * H) / 14000);

    particles.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.4 + 0.4,
      a:  Math.random() * 0.5 + 0.15,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => init(canvas);
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const pts = particles.current;
      // connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(232,197,71,${0.06 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      // dots
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,197,71,${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
};

// ─── HERO HEADER ──────────────────────────────────────────────────────────
const DashboardHero = ({ stats, onRefresh, loading }) => (
  <div style={{
    position: "relative", overflow: "hidden",
    borderRadius: 20,
    border: `1px solid ${COLORS.border}`,
    background: `linear-gradient(135deg, #0e0e0e 0%, #111008 60%, #0e0e0e 100%)`,
    padding: "36px 40px",
    minHeight: 180,
  }}>
    <ParticleField />

    {/* Noise texture overlay */}
    <div style={{
      position: "absolute", inset: 0, borderRadius: 20, zIndex: 1,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
      backgroundSize: "200px 200px", opacity: 0.4,
    }} />

    {/* Gold horizontal rule top */}
    <div style={{
      position: "absolute", top: 0, left: 40, right: 40, height: 1,
      background: `linear-gradient(90deg, transparent, ${COLORS.accent}55, transparent)`,
      zIndex: 2,
    }} />

    <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {SuvixLogo ? (
          <img src={SuvixLogo} alt="SuviX" style={{ height: 44, objectFit: "contain" }} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${COLORS.accent}, #c9a832)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 18, color: "#000",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: -1,
          }}>S</div>
        )}
        <div>
          <div style={{
            fontSize: 28, fontWeight: 900, color: COLORS.text,
            fontFamily: "'Syne', sans-serif", letterSpacing: -1, lineHeight: 1,
          }}>
            SuviX
            <span style={{ color: COLORS.accent, marginLeft: 2 }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 3 }}>
            Command Center
          </div>
        </div>
      </div>

      {/* Live indicator + refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20,
          background: "#22c55e12", border: "1px solid #22c55e30",
          fontSize: 11, fontWeight: 700, color: COLORS.green,
          letterSpacing: "0.06em",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: COLORS.green,
            boxShadow: `0 0 8px ${COLORS.green}`,
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
          SYSTEMS NOMINAL
        </div>

        <button
          onClick={onRefresh}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: COLORS.elevated, border: `1px solid ${COLORS.border}`,
            color: COLORS.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}
        >
          <HiOutlineArrowPath size={14} className={loading ? "spin" : ""} style={{ transition: "transform 0.5s" }} />
          Sync
        </button>
      </div>
    </div>

    {/* Quick metric strip */}
    {stats && (
      <div style={{
        position: "relative", zIndex: 3,
        display: "flex", gap: 32, marginTop: 28, flexWrap: "wrap",
      }}>
        {[
          { label: "Messages / 24h", value: stats.activity?.messagesLast24h?.toLocaleString() || "—" },
          { label: "Platform Uptime", value: "99.9%" },
          { label: "Editors Online", value: stats.users?.editors?.toLocaleString() || "—" },
          { label: "Disputes Open", value: stats.orders?.disputed || "0" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── ALERT BANNER ─────────────────────────────────────────────────────────
const AlertBanner = ({ alert }) => {
  const palette = {
    danger:  { bg: "#ef444412", border: "#ef444430", color: "#f87171" },
    warning: { bg: "#f59e0b12", border: "#f59e0b30", color: "#fbbf24" },
    info:    { bg: "#3b82f612", border: "#3b82f630", color: "#60a5fa" },
  }[alert.type] || { bg: "#3b82f612", border: "#3b82f630", color: "#60a5fa" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: 12,
        background: palette.bg, border: `1px solid ${palette.border}`,
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HiOutlineExclamationCircle size={16} color={palette.color} />
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: palette.color }}>{alert.title} — </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>{alert.message}</span>
        </div>
      </div>
      {alert.action && (
        <a href={alert.link || "#"} style={{
          fontSize: 11, fontWeight: 800, color: palette.color,
          textDecoration: "none", whiteSpace: "nowrap",
          padding: "4px 12px", borderRadius: 6,
          background: `${palette.color}15`, border: `1px solid ${palette.border}`,
        }}>
          {alert.action} →
        </a>
      )}
    </motion.div>
  );
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────
const KPICard = ({ label, value, trend, trendType, icon, accent, description, delay = 0 }) => {
  const up = trendType === "up";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "22px 24px",
        position: "relative", overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.2s, transform 0.2s",
      }}
      whileHover={{ borderColor: COLORS.borderHi, y: -2 }}
    >
      {/* Subtle corner glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 80, height: 80, borderRadius: "50%",
        background: `${accent}08`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${accent}12`, border: `1px solid ${accent}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, fontSize: 20,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            padding: "3px 8px", borderRadius: 6,
            background: up ? "#22c55e12" : "#ef444412",
            fontSize: 11, fontWeight: 800,
            color: up ? COLORS.green : COLORS.red,
          }}>
            {up ? <HiOutlineArrowTrendingUp size={12} /> : <HiOutlineArrowTrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{
        fontSize: 28, fontWeight: 900, color: COLORS.text, lineHeight: 1,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginTop: 6 }}>{label}</div>
      {description && (
        <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 4, letterSpacing: "0.03em" }}>{description}</div>
      )}
    </motion.div>
  );
};

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────
const Panel = ({ children, style = {} }) => (
  <div style={{
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: "24px 24px",
    ...style,
  }}>
    {children}
  </div>
);

const PanelTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={{
      fontSize: 14, fontWeight: 800, color: COLORS.text,
      letterSpacing: "0.04em", textTransform: "uppercase", margin: 0,
      fontFamily: "'Syne', sans-serif",
    }}>{children}</h3>
    {sub && <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{sub}</p>}
  </div>
);

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: COLORS.elevated, border: `1px solid ${COLORS.border}`,
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: COLORS.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, fontFamily: "monospace" }}>
          {p.name === "revenue" ? `₹${p.value?.toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── ACTIVITY ITEM ────────────────────────────────────────────────────────
const ActivityItem = ({ user, action, time, last }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${COLORS.accent}15`, border: `1px solid ${COLORS.accent}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: COLORS.accent, flexShrink: 0,
        fontFamily: "'Syne', sans-serif",
      }}>
        {user[0].toUpperCase()}
      </div>
      {!last && <div style={{ width: 1, flex: 1, minHeight: 16, background: COLORS.border, margin: "4px 0" }} />}
    </div>
    <div style={{ paddingBottom: last ? 0 : 16, flex: 1 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{user} </span>
      <span style={{ fontSize: 12, color: COLORS.muted }}>{action}</span>
      <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 3, letterSpacing: "0.06em" }}>{time}</div>
    </div>
  </div>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────
const MetricBar = ({ label, value, color, percent }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "monospace" }}>{value}</span>
    </div>
    <div style={{ height: 3, background: COLORS.elevated, borderRadius: 2, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        style={{ height: "100%", background: color, borderRadius: 2 }}
      />
    </div>
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────
const Dashboard = () => {
  const [period, setPeriod] = useState("30");

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsApi.getOverview().then(r => r.data.stats),
  });

  const { data: alerts } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: () => statsApi.getAlerts().then(r => r.data.alerts),
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ["admin-charts", period],
    queryFn: () => statsApi.getOrderChart({ period }).then(r => r.data.charts),
  });

  const kpis = stats ? [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.revenue.total),
      trend: 12.5, trendType: "up",
      icon: <HiOutlineCurrencyRupee />,
      accent: COLORS.accent,
      description: `₹${stats.revenue.monthly?.toLocaleString()} this month`,
    },
    {
      label: "Active Orders",
      value: stats.orders.active,
      trend: 8.2, trendType: "up",
      icon: <HiOutlineShoppingBag />,
      accent: COLORS.blue,
      description: `${stats.orders.completed} completed total`,
    },
    {
      label: "Total Users",
      value: stats.users.total.toLocaleString(),
      trend: stats.users.growth,
      trendType: stats.users.growth >= 0 ? "up" : "down",
      icon: <HiOutlineUsers />,
      accent: COLORS.violet,
      description: `${stats.users.newThisMonth} joined this month`,
    },
    {
      label: "Active Gigs",
      value: stats.gigs.active,
      trend: 4.1, trendType: "up",
      icon: <HiOutlineBriefcase />,
      accent: COLORS.green,
      description: `${stats.gigs.total} total listings`,
    },
  ] : [];

  return (
    <>
      {/* ── Global font imports ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=JetBrains+Mono:wght@400;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        body, #root {
          background: ${COLORS.bg} !important;
          font-family: 'DM Sans', sans-serif !important;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.muted}; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "'DM Sans', sans-serif",
        padding: "28px 32px",
        maxWidth: 1400,
        margin: "0 auto",
      }}>

        {/* ── Hero header with particles ── */}
        <div style={{ marginBottom: 24 }}>
          <DashboardHero stats={stats} onRefresh={refetch} loading={statsLoading} />
        </div>

        {/* ── Alerts ── */}
        <AnimatePresence>
          {alerts?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}
            >
              {alerts.map((a, i) => <AlertBanner key={i} alert={a} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── KPI grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, marginBottom: 24,
        }}>
          {statsLoading
            ? [0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 130, borderRadius: 16,
                  background: `linear-gradient(90deg, ${COLORS.surface} 25%, ${COLORS.elevated} 50%, ${COLORS.surface} 75%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }} />
              ))
            : kpis.map((k, i) => <KPICard key={i} {...k} delay={i * 0.08} />)
          }
        </div>

        {/* ── Charts row ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 16, marginBottom: 24,
        }}>
          {/* Revenue area chart */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <PanelTitle sub="Daily platform earnings">Revenue Dynamics</PanelTitle>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                style={{
                  background: COLORS.elevated, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: "6px 10px",
                  fontSize: 11, fontWeight: 600, color: COLORS.muted,
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            <div style={{ height: 260 }}>
              {charts?.revenueByDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.revenueByDay} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={COLORS.accent} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                    <XAxis
                      dataKey="_id" axisLine={false} tickLine={false}
                      tick={{ fill: COLORS.muted, fontSize: 10 }}
                      tickFormatter={s => s.slice(5)}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fill: COLORS.muted, fontSize: 10 }}
                      tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke={COLORS.accent} strokeWidth={2.5}
                      fill="url(#revGrad)" animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.muted, fontSize: 13 }}>
                  No revenue data yet
                </div>
              )}
            </div>
          </Panel>

          {/* Order status donut */}
          <Panel>
            <PanelTitle sub="Current distribution">Order Fulfillment</PanelTitle>

            <div style={{ height: 200, marginBottom: 16 }}>
              {charts?.ordersByStatus?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.ordersByStatus}
                      innerRadius={60} outerRadius={85}
                      paddingAngle={6} dataKey="count"
                      stroke="none" animationBegin={0}
                    >
                      {charts.ordersByStatus.map((_, i) => (
                        <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted, fontSize: 12 }}>
                  No data
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {charts?.ordersByStatus?.slice(0, 5).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    <span style={{ fontSize: 11, color: COLORS.muted, textTransform: "capitalize" }}>
                      {item._id?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.text, fontFamily: "monospace" }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Bottom row ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}>
          {/* Activity feed */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <PanelTitle>Activity Stream</PanelTitle>
              <button style={{
                fontSize: 11, fontWeight: 700, color: COLORS.accent,
                background: "none", border: "none", cursor: "pointer",
                letterSpacing: "0.04em",
              }}>
                View All →
              </button>
            </div>
            {[
              { user: "Admin", action: "Approved KYC for editor Arun Kumar", time: "2 min ago" },
              { user: "System", action: "Daily wallet clearance processed — ₹45,200 released", time: "1 hr ago" },
              { user: "Mod", action: "Resolved dispute #4029 in favour of client", time: "3 hr ago" },
              { user: "System", action: "MongoDB backup completed successfully", time: "5 hr ago" },
              { user: "Admin", action: "New editor KYC submission received", time: "6 hr ago" },
            ].map((a, i, arr) => (
              <ActivityItem key={i} {...a} last={i === arr.length - 1} />
            ))}
          </Panel>

          {/* Platform health */}
          <Panel>
            <PanelTitle sub="Rolling 30-day metrics">Platform Health</PanelTitle>

            <MetricBar
              label="Editor KYC Fulfilment"
              value="85%"
              color={COLORS.accent}
              percent={85}
            />
            <MetricBar
              label="Order Completion Rate"
              value="91%"
              color={COLORS.green}
              percent={91}
            />
            <MetricBar
              label="Platform Uptime"
              value="99.9%"
              color={COLORS.blue}
              percent={99.9}
            />
            <MetricBar
              label="Dispute Rate"
              value="1.2%"
              color={COLORS.red}
              percent={1.2}
            />

            {/* Insight card */}
            <div style={{
              marginTop: 8,
              padding: "14px 16px",
              borderRadius: 12,
              background: `${COLORS.accent}08`,
              border: `1px solid ${COLORS.accent}20`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: COLORS.accent,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6,
              }}>
                ◆ Superadmin Insight
              </div>
              <p style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.7, margin: 0 }}>
                Revenue up 14% vs last cycle. User churn at all-time low of 2.3%.
                Consider tier-based platform fees for high-volume editors.
              </p>
            </div>
          </Panel>
        </div>

        {/* ── Footer ── */}
        <div style={{
          marginTop: 32, paddingTop: 20,
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 11, color: COLORS.faint }}>
            SuviX Admin · v2.0 · {new Date().getFullYear()}
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {["Docs", "Support", "Status"].map(l => (
              <span key={l} style={{ fontSize: 11, color: COLORS.muted, cursor: "pointer", letterSpacing: "0.04em" }}
                onMouseEnter={e => e.target.style.color = COLORS.accent}
                onMouseLeave={e => e.target.style.color = COLORS.muted}
              >{l}</span>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;