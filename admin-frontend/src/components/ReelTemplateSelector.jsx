/**
 * ReelTemplateSelector.jsx
 * Visual template picker for reel ad styles.
 * Shows 6 reel templates as mini portrait (9:16) previews.
 * Clicking one applies the complete reelConfig to the form.
 */

import React, { useState, useMemo } from "react";
import { REEL_TEMPLATES, REEL_TEMPLATE_CATEGORIES } from "./ReelAdTemplates";
import { HiOutlineCheck, HiOutlineVideoCamera } from "react-icons/hi2";
import { FaGlobe, FaChevronRight } from "react-icons/fa";

// ─── Mini portrait preview (fully self-contained) ─────────────────────────────
const ReelMiniPreview = ({ template, isSelected, mediaUrl, form }) => {
  const rc = template.reelConfig;

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

  const rad = { sm: "3px", md: "4px", lg: "6px", full: "999px" }[rc.btnRadius || "md"] || "4px";

  const btnBg = rc.btnVariant === "filled"
    ? rc.btnBgColor
    : rc.btnVariant === "outline"
    ? "transparent"
    : rc.btnBgColor || "rgba(255,255,255,0.1)";

  const btnColor = rc.btnVariant === "filled"
    ? rc.btnTextColor
    : rc.btnVariant === "outline"
    ? rc.btnBorderColor
    : "#ffffff";

  const btnBorder = rc.btnVariant === "outline"
    ? `1px solid ${rc.btnBorderColor}`
    : "none";

  const displayTitle = form?.title || "Ad Title";
  const displayCTA   = rc.ctaText || "Learn More";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "177.78%",
        borderRadius: 8,
        overflow: "hidden",
        background: "#111",
        border: isSelected ? "2px solid #6366f1" : "2px solid #1c1c1c",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: isSelected ? "0 0 0 1px #6366f1, 0 4px 16px rgba(99,102,241,0.25)" : "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Background media */}
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${template.preview.bg} 0%, #1a1a1a 100%)`,
          }} />
        )}

        {/* Overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: `linear-gradient(to top, ${overlayRgba} 0%, transparent 100%)`,
        }} />

        {/* Content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 5px 5px" }}>
          {/* Advertisement bar */}
          <div style={{ background: "#fff", borderRadius: 2, textAlign: "center", padding: "1px 0", marginBottom: 3 }}>
            <span style={{ fontSize: 5, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              ADVERTISEMENT
            </span>
          </div>

          {/* Title */}
          <div style={{
            fontSize: 7, fontWeight: 700, color: "#fff",
            marginBottom: 3, lineHeight: 1.2,
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
          }}>
            {displayTitle}
          </div>

          {/* CTA button */}
          <button style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "2px 5px", borderRadius: rad,
            background: btnBg, color: btnColor, border: btnBorder,
            fontSize: 5, fontWeight: 800, cursor: "default",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FaGlobe style={{ fontSize: 4, opacity: 0.5 }} />
              {displayCTA}
            </span>
            <FaChevronRight style={{ fontSize: 4, opacity: 0.4 }} />
          </button>
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div style={{
            position: "absolute", top: 5, right: 5,
            width: 14, height: 14, borderRadius: "50%",
            background: "#6366f1",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(99,102,241,0.6)",
          }}>
            <HiOutlineCheck style={{ fontSize: 8, color: "#fff" }} />
          </div>
        )}

        {/* Top progress bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>
    </div>
  );
};

// ─── Main ReelTemplateSelector ────────────────────────────────────────────────
const ReelTemplateSelector = ({ reelConfig, localMediaUrl, form, onApply }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState(null);

  const categories = ["All", "Premium", "Bold", "Clean"];

  const filtered = useMemo(() =>
    activeCategory === "All"
      ? REEL_TEMPLATES
      : REEL_TEMPLATES.filter(t => t.category === activeCategory),
    [activeCategory]
  );

  // Detect currently applied template
  const currentTemplateId = useMemo(() => {
    if (!reelConfig?.templateId) return null;
    return REEL_TEMPLATES.find(t => t.id === reelConfig.templateId)?.id || null;
  }, [reelConfig?.templateId]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <HiOutlineVideoCamera style={{ fontSize: 14, color: "#818cf8" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Reel Templates
        </span>
      </div>

      {/* Info */}
      <div style={{
        padding: "8px 12px", background: "rgba(99,102,241,0.08)",
        borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)",
        marginBottom: 12, fontSize: 11, color: "#818cf8", lineHeight: 1.5,
      }}>
        Pick a template to style the reel card. Your title, media, and CTA text are preserved — only the visual style changes.
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          const catStyle = REEL_TEMPLATE_CATEGORIES[cat] || { bg: "rgba(99,102,241,0.15)", color: "#818cf8", border: "#6366f1" };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                cursor: "pointer",
                background: isActive ? catStyle.bg : "#18181b",
                color: isActive ? catStyle.color : "#52525b",
                border: isActive ? `1px solid ${catStyle.border}` : "1px solid #27272a",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Template grid — 3 columns (portrait cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {filtered.map(template => (
          <div
            key={template.id}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onApply(template)}
            style={{ cursor: "pointer" }}
          >
            <ReelMiniPreview
              template={template}
              isSelected={currentTemplateId === template.id}
              mediaUrl={localMediaUrl || (form?.mediaType === "image" ? form?.mediaUrl : "")}
              form={form}
            />
            {/* Label */}
            <div style={{ marginTop: 5, paddingLeft: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: currentTemplateId === template.id ? "#818cf8" : "#d4d4d8",
                }}>
                  {template.name}
                </span>
                <span style={{
                  padding: "1px 5px", borderRadius: 4, fontSize: 8, fontWeight: 700,
                  background: REEL_TEMPLATE_CATEGORIES[template.category]?.bg || "rgba(99,102,241,0.15)",
                  color: REEL_TEMPLATE_CATEGORIES[template.category]?.color || "#818cf8",
                }}>
                  {template.category}
                </span>
              </div>
              {hoveredId === template.id && (
                <div style={{ fontSize: 9, color: "#52525b", marginTop: 2, lineHeight: 1.4 }}>
                  {template.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reset */}
      {currentTemplateId && (
        <button
          onClick={() => onApply(null)}
          style={{
            marginTop: 14, width: "100%", padding: "7px",
            borderRadius: 7, background: "#18181b",
            border: "1px solid #27272a", color: "#71717a",
            fontSize: 11, cursor: "pointer", fontWeight: 600,
          }}
        >
          Reset Reel Style
        </button>
      )}
    </div>
  );
};

export default ReelTemplateSelector;