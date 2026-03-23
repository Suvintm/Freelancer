import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { repairUrl } from "../utils/urlHelper.jsx";

const TrendingReelsCarousel = ({ reels = [], isSwiping = false }) => {
  const navigate = useNavigate();
  const rafRef = useRef(null);
  const angleRef = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);
  const velocityRef = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const [renderAngle, setRenderAngle] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const trendingReels = useMemo(() => {
    let result = [...reels]
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 10);

    // If fewer than 10, fill up to 10 by repeating items to ensure a full ring
    if (result.length > 0 && result.length < 10) {
      const originalItems = [...result];
      while (result.length < 10) {
        const nextItem = originalItems[result.length % originalItems.length];
        result.push({ ...nextItem, _dupId: `dup-${result.length}` });
      }
    }
    return result;
  }, [reels]);

  const count = trendingReels.length;
  const theta = count > 0 ? 360 / count : 0;

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer heavy animation until tab transition is likely finished
    const t = setTimeout(() => setIsReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-rotate & Momentum ────────────────────────────────────────────────
  useEffect(() => {
    if (count === 0 || !isReady || isSwiping) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let lastTs = null;

    const tick = (ts) => {
      if (lastTs === null) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      if (!isDragging.current) {
        // Apply velocity decay (momentum)
        if (Math.abs(velocityRef.current) > 0.01) {
          angleRef.current += velocityRef.current * dt;
          velocityRef.current *= 0.95; // Decay factor
        } else {
          // Slow constant rotation when no momentum
          angleRef.current += 0.018 * dt;
        }
        setRenderAngle(angleRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [count, isReady, isSwiping]);

  // ── Drag / touch ───────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    isDragging.current = true;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragStartX.current = x;
    dragStartAngle.current = angleRef.current;
    lastX.current = x;
    lastTime.current = performance.now();
    velocityRef.current = 0;
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) velocityRef.current = (x - lastX.current) / dt;
    lastX.current = x;
    lastTime.current = now;
    angleRef.current = dragStartAngle.current - (x - dragStartX.current) * 0.35;
    setRenderAngle(angleRef.current);
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // The velocity is already being updated in onPointerMove
    // We just let the tick function take over with the current velocity
  };

  if (count === 0) return null;

  const radius = isMobile ? 155 : 215;
  const cardW  = isMobile ? 85  : 108;
  const cardH  = isMobile ? 136 : 172;
  const containerH = isMobile ? 255 : 330;

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height: containerH }}>

      {/* ── Atmospheric dark bg with pink + blue glow ─────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 65% at 50% 60%, rgba(57, 24, 123, 0.92) 0%, rgba(8,12,48,0.78) 40%, transparent 72%)",
      }} />
      <div className="absolute pointer-events-none" style={{
        left: "50%", top: "50%", transform: "translate(-50%, -52%)",
        width: radius * 2.8, height: radius * 1.2, borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 50%, rgba(55, 0, 255, 1) 0%, rgba(60,30,200,0.10) 50%, transparent 78%)",
        filter: "blur(22px)",
      }} />
      <div className="absolute pointer-events-none" style={{
        left: "30%", top: "55%", transform: "translate(-50%, -50%)",
        width: radius * 1.4, height: radius * 0.8, borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 50%, rgba(18, 25, 150, 1) 0%, transparent 75%)",
        filter: "blur(30px)",
      }} />

      {/* ── Background Pulsing Ring ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
        width: radius * 2.2, height: radius * 2.2,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.03)",
        boxShadow: "0 0 40px rgba(130, 60, 255, 0.05)",
        animation: "pulseRing 4s infinite ease-in-out",
        opacity: 0.4
      }} />

      {/* ── 3D Stage ──────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ cursor: isDragging.current ? "grabbing" : "grab", perspective: isMobile ? 680 : 880 }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={(e) => onPointerDown(e.touches[0])}
        onTouchMove={(e) => { e.preventDefault(); onPointerMove(e.touches[0]); }}
        onTouchEnd={onPointerUp}
      >
        {/* Ring container — spins on Y axis */}
        <div style={{
          position: "relative",
          width: cardW, height: cardH,
          transformStyle: "preserve-3d",
          transform: `rotateY(${-renderAngle}deg)`,
        }}>
          {trendingReels.map((reel, i) => {
            const angle = theta * i;
            const cardAngle = ((angle - renderAngle) % 360 + 360) % 360;
            const signed = cardAngle > 180 ? cardAngle - 360 : cardAngle;
            const frontness = 1 - Math.abs(signed) / 180; // 0=back → 1=front
            const scale      = 0.72 + frontness * 0.32;
            const brightness = 0.38 + frontness * 0.72;

            const thumb = repairUrl(reel.mediaUrl)?.replace(/\.mp4(\?.*)?$/i, ".jpg") || repairUrl(reel.mediaUrl);

            return (
              <div
                key={reel._dupId || reel._id}
                onClick={() => { 
                  if (Math.abs(velocityRef.current) < 0.5) {
                    navigate(`/reels?id=${reel._id}`); 
                  }
                }}
                style={{
                  position: "absolute", width: cardW, height: cardH, left: 0, top: 0,
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: "100%", height: "100%",
                  borderRadius: 14, overflow: "hidden",
                  border: `1.5px solid rgba(255,255,255,${0.05 + frontness * 0.20})`,
                  boxShadow: frontness > 0.65
                    ? "0 12px 40px rgba(0,0,0,0.6), 0 0 28px rgba(160,80,255,0.22)"
                    : "0 6px 20px rgba(0,0,0,0.5)",
                  transform: `scale(${scale})`,
                  filter: `brightness(${brightness})`,
                  background: "#0d0d18",
                  position: "relative",
                }}>
                  {thumb ? (
                    <img src={thumb} alt={reel.title || ""} draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#1a0a38 0%,#0a1548 100%)" }} />
                  )}

                  {/* Bottom info */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "22px 7px 7px",
                    background: "linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 100%)" }}>
                    {(reel.viewsCount || 0) > 0 && (
                      <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px", lineHeight: 1 }}>
                        ▶ {reel.viewsCount}
                      </p>
                    )}
                    {reel.title && (
                      <p style={{ fontSize: 9.5, fontWeight: 400, color: "#ffffffad", margin: 0, lineHeight: 1.25,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {reel.title}
                      </p>
                    )}
                  </div>

                  {/* Shine on front card */}
                  {frontness > 0.72 && (
                    <div style={{ position: "absolute", inset: 0,
                      background: "linear-gradient(135deg,rgba(255,255,255,0.09) 0%,transparent 55%)",
                      pointerEvents: "none" }} />
                  )}

                  {/* Pulsing Highlight Ring for front card */}
                  {frontness > 0.88 && (
                    <div style={{
                      position: "absolute", inset: -2,
                      borderRadius: 16,
                      border: "2px solid rgba(255,255,255,0.4)",
                      boxShadow: "0 0 15px rgba(255,255,255,0.3)",
                      animation: "cardRingPulse 2s infinite ease-in-out",
                      pointerEvents: "none"
                    }} />
                  )}
                </div>

                {/* ── Floating Profile popup (identity) ── */}
                <div style={{
                  position: "absolute",
                  top: -24, left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex", alignItems: "center", gap: 5,
                  // Smooth popup/popout based on frontness
                  opacity: Math.max(0, (frontness - 0.78) * 4.5), 
                  scale: 0.8 + Math.min(0.2, (frontness - 0.78) * 1.5),
                  pointerEvents: "none",
                  transition: "opacity 0.2s ease-out, scale 0.2s ease-out",
                  padding: "4px 0",
                  background: "transparent" // Removed background
                }}>
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    <img 
                      src={repairUrl(reel.editor?.profilePicture) || ` `} 
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <span className="text-[8px]  text-white lowercase tracking-[0.14em] whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {reel.editor?.name || ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Progress Indicators (Positioned lower to avoid overlap) ────── */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {trendingReels.map((_, i) => {
           const activeIdx = Math.round(((renderAngle % 360 + 360) % 360) / theta) % count;
           const isCurrent = (count - activeIdx) % count === i;
           return (
             <div 
               key={i} 
               className={`h-1 rounded-full transition-all duration-300 ${isCurrent ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "w-1 bg-white/20"}`} 
             />
           );
        })}
      </div>

      <style>{`
        @keyframes trendPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.8); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
          50%       { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
        }
        @keyframes cardRingPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default TrendingReelsCarousel;