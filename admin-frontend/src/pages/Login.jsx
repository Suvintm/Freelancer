// ─── Login.jsx — Production-Grade Admin Login ─────────────────────────────
// Features: Split-screen layout, Ticking lockout timer, Inline validation, 
//           Remember device, Security badges, Adaptive loading states.
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineShieldCheck, HiOutlineEnvelope, HiOutlineLockClosed, 
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineExclamationTriangle,
  HiOutlineCheckBadge, HiOutlineClock, HiOutlineChevronDown,
  HiCheck
} from "react-icons/hi2";
import { authApi } from "../api/adminApi";
import { ROLE_CONFIG } from "../utils/constants";
import { useAdmin } from "../context/AdminContext";

// Map role IDs to their respective icons for the dropdown
const ROLE_ICONS = {
  superadmin: <HiOutlineShieldCheck />,
  admin: <HiOutlineCheckBadge />,
  moderator: <HiOutlineCheckBadge />
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAdmin();
  
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("superadmin");
  const [availableRoles, setAvailableRoles] = useState([
    { id: "superadmin", label: "Super Admin", icon: ROLE_ICONS.superadmin }
  ]);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const dropdownRef = useRef(null);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [lockedUntil, setLockedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // ── Fetch Available Roles ────────────────────────────────────────────────
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await authApi.getRoles();
        if (res.data?.roles) {
          const rolesArray = res.data.roles;
          
          // Map backend objects to UI format
          const mapped = rolesArray.map(r => {
            // Handle both new object format and legacy string format
            const id = typeof r === "object" ? (r.id || r.value) : r;
            const label = typeof r === "object" ? (r.label || r.name) : (ROLE_CONFIG[r]?.label || r.charAt(0).toUpperCase() + r.slice(1));
            const icon = ROLE_ICONS[id] || <HiOutlineCheckBadge />;
            
            return { id, label, icon };
          });
          
          setAvailableRoles(mapped);
          
          // If current role is not in the list, set to first available
          const validIds = mapped.map(m => m.id);
          if (!validIds.includes(role)) {
            setRole(validIds[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };
    fetchRoles();
  }, []);

  // ── Close dropdown on click outside ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentRole = availableRoles.find(r => r.id === role) || availableRoles[0];

  // ── Redirect if already authenticated ───────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // ── Lockout Timer Logic (Ticks every second) ────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;

    const calculateTime = () => {
      const remaining = Math.max(0, new Date(lockedUntil).getTime() - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) setLockedUntil(null);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const formatTimeLeft = (ms) => {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.ceil(s / 60)}m`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || timeLeft > 0) return;

    setError("");
    setLoading(true);

    const result = await login(email, password, role, remember);
    
    if (result.success) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } else {
      setError(result.message);
      if (result.lockedUntil) {
        setLockedUntil(result.lockedUntil);
      }
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-base)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid var(--border-default)",
          borderTopColor: "var(--brand)",
          animation: "spin 0.8s linear infinite"
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr",
      background: "var(--bg-base)", color: "var(--text-primary)"
    }} className="lg:grid-cols-2">
      
      {/* ── Left Side: Brand & Visuals (Hidden on Mobile) ────────────────── */}
      <div style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-default)",
        display: "none", flexDirection: "column", justifyContent: "center",
        padding: "60px", position: "relative", overflow: "hidden"
      }} className="lg:flex">
        {/* Abstract Background Visuals */}
        <div style={{
          position: "absolute", top: "-10%", left: "-10%", width: "60%", height: "60%",
          background: "var(--brand)", opacity: 0.15, filter: "blur(120px)", borderRadius: "50%"
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-10%", width: "50%", height: "50%",
          background: "var(--brand-secondary)", opacity: 0.1, filter: "blur(120px)", borderRadius: "50%"
        }} />

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "var(--brand-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900, color: "#fff",
            boxShadow: "0 0 30px var(--brand-glow)", marginBottom: 32
          }}>
            S
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Management <br /> 
            <span className="text-gradient">Simplified.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 400, lineHeight: 1.6, marginBottom: 48 }}>
            Secure, end-to-end platform oversight for SuviX. Monitor users, manage orders, and analyze performance in real-time.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Role Specific</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Granular permissions for Superadmins and Moderators.</p>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Audit Logs</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Every administrative action is tracked and logged securely.</p>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 40, left: 60, display: "flex", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <HiOutlineCheckBadge size={16} /> 256-bit Encrypted
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <HiOutlineCheckBadge size={16} /> SSAE Type II
          </div>
        </div>
      </div>

      {/* ── Right Side: Login Form ────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", position: "relative"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px", color: "var(--brand)"
            }} className="lg:hidden">
               <HiOutlineShieldCheck size={30} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>Sign In</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Enter your credentials to access the portal</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  background: "var(--danger-bg)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 12, padding: "12px 16px", marginBottom: 24,
                  display: "flex", alignItems: "flex-start", gap: 12, overflow: "hidden"
                }}
              >
                <HiOutlineExclamationTriangle style={{ color: "var(--danger)", marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>Login Failed</p>
                  <p style={{ fontSize: 12, color: "var(--danger)", opacity: 0.8, marginTop: 2 }}>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Role Selection Dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, marginLeft: 4 }}>
                Access Level
              </label>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                  borderRadius: 12, cursor: "pointer", transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, color: "var(--brand)" }}>{currentRole.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{currentRole.label}</span>
                </div>
                <HiOutlineChevronDown style={{ 
                  color: "var(--text-muted)", 
                  transition: "transform 0.3s ease",
                  transform: showRoleMenu ? "rotate(180deg)" : "rotate(0)" 
                }} />
              </button>

              <AnimatePresence>
                {showRoleMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{
                      position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 50,
                      background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                      borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", padding: 6
                    }}
                  >
                    {availableRoles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setRole(r.id); setShowRoleMenu(false); }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                          borderRadius: 8, border: "none", background: role === r.id ? "var(--bg-base)" : "transparent",
                          cursor: "pointer", transition: "all 0.15s ease", textAlign: "left"
                        }}
                      >
                        <span style={{ fontSize: 18, color: role === r.id ? "var(--brand)" : "var(--text-muted)" }}>{r.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</div>
                        </div>
                        {role === r.id && <HiCheck style={{ color: "var(--brand)" }} size={16} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Email Field */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, marginLeft: 4 }}>
                Admin Email
              </label>
              <div style={{ position: "relative" }}>
                <HiOutlineEnvelope style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  disabled={loading || timeLeft > 0}
                  style={{
                    width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                    borderRadius: 12, padding: "12px 16px 12px 46px", color: "var(--text-primary)",
                    fontSize: 14, outline: "none", transition: "all var(--transition)"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, marginLeft: 4 }}>
                Security Code
              </label>
              <div style={{ position: "relative" }}>
                <HiOutlineLockClosed style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading || timeLeft > 0}
                  style={{
                    width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                    borderRadius: 12, padding: "12px 16px 12px 46px", color: "var(--text-primary)",
                    fontSize: 14, outline: "none", transition: "all var(--transition)"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer"
                  }}
                >
                  {showPass ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: "var(--brand)" }}
                />
                Remember this device
              </label>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                onClick={() => alert("Contact the platform owner to reset admin credentials.")}
              >
                Reset Access?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || timeLeft > 0}
              style={{
                width: "100%", background: timeLeft > 0 ? "var(--bg-elevated)" : "var(--brand-gradient)",
                color: "#fff", border: "none", borderRadius: 12, padding: "14px",
                fontSize: 15, fontWeight: 700, cursor: (loading || timeLeft > 0) ? "not-allowed" : "pointer",
                boxShadow: timeLeft > 0 ? "none" : "0 4px 15px var(--brand-glow)",
                marginTop: 8, transition: "all var(--transition)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10
              }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              ) : timeLeft > 0 ? (
                <>
                  <HiOutlineClock size={18} />
                  Locked for {formatTimeLeft(timeLeft)}
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </form>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
              © 2026 SUVIX INTERNAL MANAGEMENT SYSTEM <br />
              All login attempts, successful or otherwise, are recorded with IP and Device signatures.
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .text-gradient {
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Login;
