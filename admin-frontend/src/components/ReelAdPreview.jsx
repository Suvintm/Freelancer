/**
 * ReelAdPreview.jsx
 * Static phone-shaped preview of how the ad will look inside the ReelsPage feed.
 * Mirrors ReelAdCard.jsx layout exactly — 9:16 portrait ratio.
 * Used inside AdManagerPage right panel when reels_feed location is selected.
 */

import React, { useMemo } from "react";
import { FaGlobe, FaChevronRight } from "react-icons/fa";
import { HiCheckCircle, HiXMark } from "react-icons/hi2";

// ─── URL repair (same helper used everywhere) ─────────────────────────────────
const repairUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
  let fixed = url;
  fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
  fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
               .replace(/res_cloudinary_com/g, "res.cloudinary.com")
               .replace(/cloudinary_com/g, "cloudinary.com");
  if (fixed.includes("res.cloudinary.com")) {
    fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
    fixed = fixed.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/");
    fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
    fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/")
                 .replace(/advertisements_videos_+/g, "advertisements/videos/");
    fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
  }
  fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
               .replace(/_png([/_?#]|$)/gi, ".png$1")
               .replace(/_mp4([/_?#]|$)/gi, ".mp4$1");
  return fixed;
};

const ReelAdPreview = ({ form, localMediaUrl }) => {
  const rc = form?.reelConfig || {};

  const mediaUrl = localMediaUrl || repairUrl(form?.mediaUrl) || "";

  // Build overlay rgba from hex + opacity
  const overlayRgba = useMemo(() => {
    const hex = rc.overlayColor || "#000000";
    const op = ((rc.overlayOpacity ?? 80) / 100).toFixed(2);
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${op})`;
    } catch {
      return `rgba(0,0,0,${op})`;
    }
  }, [rc.overlayColor, rc.overlayOpacity]);

  // Button radius
  const btnRadius = { sm: "6px", md: "8px", lg: "12px", full: "999px" }[rc.btnRadius || "md"] || "8px";

  // Button style object
  const btnStyle = useMemo(() => {
    const base = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "8px 14px",
      borderRadius: btnRadius,
      fontSize: 11,
      fontWeight: 800,
      cursor: "default",
      border: "none",
      marginBottom: 8,
    };
    const v = rc.btnVariant || "ghost";
    if (v === "filled") return { ...base, background: rc.btnBgColor || "#ffffff", color: rc.btnTextColor || "#000000" };
    if (v === "outline") return { ...base, background: "transparent", color: rc.btnBorderColor || "#ffffff", border: `1.5px solid ${rc.btnBorderColor || "#ffffff"}` };
    // ghost
    return { ...base, background: rc.btnBgColor || "rgba(255,255,255,0.1)", color: rc.btnTextColor || "#ffffff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" };
  }, [rc, btnRadius]);

  const ctaText  = rc.ctaText  || form?.ctaText  || "Learn More";
  const title    = form?.title || "Your Ad Title";
  const desc     = rc.reelDescription || form?.description || form?.tagline || "";
  const company  = form?.companyName || form?.advertiserName || "Sponsored";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        Reel Preview · 9:16
      </div>

      {/* Phone frame */}
      <div style={{
        width: 185,
        borderRadius: 22,
        overflow: "hidden",
        background: "#000",
        border: "2px solid #222",
        boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px #111",
        position: "relative",
      }}>
        {/* Aspect ratio enforcer 9:16 */}
        <div style={{ paddingBottom: "177.78%", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0 }}>

            {/* ── MEDIA ── */}
            {mediaUrl ? (
              form?.mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  autoPlay loop muted playsInline
                  style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="reel preview"
                  style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                />
              )
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 20 }}>🎬</span>
                <span style={{ fontSize: 9, color: "#333" }}>No media yet</span>
              </div>
            )}

            {/* ── PROGRESS BAR (top, ultra thin) ── */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: "rgba(255,255,255,0.1)", zIndex: 50 }}>
              <div style={{ width: "0%", height: "100%", background: "rgba(255,255,255,0.7)", boxShadow: "0 0 4px rgba(255,255,255,0.7)" }} />
            </div>

            {/* ── TOP HEADER: SuviX Reels label ── */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 10px 0", zIndex: 40, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.7)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.25em" }}>
                SuviX Reels
              </span>
            </div>

            {/* ── SIDE CONTROLS ── */}
            <div style={{ position: "absolute", top: "42%", right: 6, zIndex: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* Skip countdown */}
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: "#fff", fontWeight: 900 }}>3</span>
              </div>
            </div>

            {/* ── BOTTOM GRADIENT OVERLAY ── */}
            <div style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              height: "52%",
              background: `linear-gradient(to top, ${overlayRgba} 0%, rgba(0,0,0,0.35) 55%, transparent 100%)`,
              pointerEvents: "none",
            }} />

            {/* ── BOTTOM CONTENT ── */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 10px 10px", zIndex: 40 }}>

              {/* "ADVERTISEMENT" white bar */}
              <div style={{
                background: "#ffffff",
                borderRadius: 4,
                padding: "3px 0",
                textAlign: "center",
                marginBottom: 7,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}>
                <span style={{ fontSize: 7, fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.25em" }}>
                  Advertisement
                </span>
              </div>

              {/* Advertiser badge */}
              {rc.showAdvertiserBadge !== false && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 7, fontWeight: 900, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    {company}
                  </span>
                  <HiCheckCircle style={{ fontSize: 7, color: "#3b82f6" }} />
                </div>
              )}

              {/* Title */}
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.25,
                marginBottom: 8,
                letterSpacing: "-0.01em",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}>
                {title}
              </div>

              {/* CTA button */}
              <button style={btnStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FaGlobe style={{ fontSize: 9, opacity: 0.5 }} />
                  {ctaText}
                </span>
                <FaChevronRight style={{ fontSize: 8, opacity: 0.45 }} />
              </button>

              {/* Description */}
              {rc.showDescription !== false && desc && (
                <div style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.45,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  marginTop: 2,
                }}>
                  {desc}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Info label below phone */}
      <div style={{ marginTop: 8, fontSize: 9, color: "#3f3f46", textAlign: "center", lineHeight: 1.5 }}>
        Shown every 5 reels · skip after 3s
      </div>
    </div>
  );
};

export default ReelAdPreview;