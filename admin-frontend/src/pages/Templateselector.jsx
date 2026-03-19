// TemplateSelector.jsx
// Visual template picker rendered inside the AdManagerPage Layout tab.
// Shows 12 templates as mini banner previews. Clicking one applies the
// complete layoutConfig + buttonStyle to the form immediately.

import React, { useState, useMemo } from "react";
import { AD_TEMPLATES, TEMPLATE_CATEGORIES } from "./adtemplates";
import { HiOutlineCheck, HiOutlineSparkles } from "react-icons/hi2";
import { FaAd, FaChevronRight, FaGlobe, FaInstagram } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi2";

// ─── Mini banner preview (self-contained, no external deps) ──────────────────
const TemplateMiniPreview = ({ template, isSelected, mediaUrl, form }) => {
  const lc = template.layoutConfig;
  const bs = template.buttonStyle;

  // Build overlay gradient inline
  const overlayGradient = (() => {
    const hexToRgba = (hex, op) => {
      try {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${(op/100).toFixed(2)})`;
      } catch { return `rgba(4,4,8,${(op/100).toFixed(2)})`; }
    };
    const c = lc.overlayColor || "#040408";
    const op = lc.overlayOpacity ?? 75;
    const dirs = {
      "to-top":    `linear-gradient(to top,${hexToRgba(c,op)} 0%,${hexToRgba(c,Math.round(op*0.35))} 42%,transparent 75%)`,
      "to-bottom": `linear-gradient(to bottom,${hexToRgba(c,op)} 0%,transparent 75%)`,
      "to-left":   `linear-gradient(to left,${hexToRgba(c,op)} 0%,transparent 75%)`,
      "to-right":  `linear-gradient(to right,${hexToRgba(c,op)} 0%,transparent 75%)`,
      "radial":    `radial-gradient(ellipse at center,transparent 30%,${hexToRgba(c,op)} 100%)`,
      "none":      "none",
    };
    return dirs[lc.overlayDirection] || dirs["to-top"];
  })();

  const posMap = {
    tl:{ justifyContent:"flex-start", alignItems:"flex-start" },
    tc:{ justifyContent:"flex-start", alignItems:"center" },
    tr:{ justifyContent:"flex-start", alignItems:"flex-end" },
    ml:{ justifyContent:"center",     alignItems:"flex-start" },
    mc:{ justifyContent:"center",     alignItems:"center" },
    mr:{ justifyContent:"center",     alignItems:"flex-end" },
    bl:{ justifyContent:"flex-end",   alignItems:"flex-start" },
    bc:{ justifyContent:"flex-end",   alignItems:"center" },
    br:{ justifyContent:"flex-end",   alignItems:"flex-end" },
  };
  const flex = posMap[lc.textPosition] || posMap["bl"];

  const titleFS = { sm:"8px", md:"9px", lg:"11px", xl:"12px" }[lc.titleSize] || "9px";
  const titleFW = { bold:700, black:900, extrabold:800 }[lc.titleWeight] || 900;
  const rad = { sm:"3px", md:"4px", lg:"6px", full:"999px" }[bs.radius] || "4px";

  const btnBg = bs.variant === "filled" ? bs.bgColor
    : bs.variant === "outline" ? "transparent"
    : "rgba(255,255,255,0.1)";
  const btnColor = bs.variant === "filled" ? bs.textColor : (bs.variant === "outline" ? bs.borderColor : "#fff");
  const btnBorder = bs.variant === "outline" ? `1px solid ${bs.borderColor}` : "none";

  const displayTitle = form?.title || "Your Ad Title";
  const displayDesc  = form?.description || form?.tagline || "Description";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 80,
        borderRadius: 8,
        overflow: "hidden",
        background: template.preview.bg,
        border: isSelected ? `2px solid #6366f1` : "2px solid transparent",
        cursor: "pointer",
        boxShadow: isSelected ? "0 0 0 1px #6366f1" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Background image if available */}
      {mediaUrl && (
        <img src={mediaUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
      )}

      {/* Overlay */}
      <div style={{ position:"absolute", inset:0, background: overlayGradient }} />

      {/* Content */}
      <div style={{ position:"absolute", inset:0, padding:"6px 8px 5px", display:"flex", flexDirection:"column", ...flex }}>
        {/* Badge */}
        {lc.showBadge && (
          <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:2, padding:"1px 4px", borderRadius:3, background: lc.badgeColor || "rgba(255,255,255,0.12)", fontSize:"5px", fontWeight:900, color:"#fff", textTransform:"uppercase", letterSpacing:"0.1em" }}>
              <FaAd style={{ fontSize:4, color: template.preview.accent }} />
              {(lc.badgeText || "SPONSOR").toUpperCase()}
            </span>
          </div>
        )}
        {/* Title */}
        <div style={{ fontSize: titleFS, fontWeight: titleFW, color: lc.titleColor, lineHeight:1.15, marginBottom:2, maxWidth:"75%", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", textAlign: flex.alignItems === "flex-end" ? "right" : flex.alignItems === "center" ? "center" : "left" }}>
          {displayTitle}
        </div>
        {/* Description */}
        {lc.showDescription && (
          <div style={{ fontSize:"5.5px", color: lc.descColor, fontWeight:500, marginBottom:4, maxWidth:"65%", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
            {displayDesc}
          </div>
        )}
        {/* Button */}
        <button style={{ display:"inline-flex", alignItems:"center", gap:2, padding:"2px 6px", borderRadius: rad, background: btnBg, color: btnColor, border: btnBorder, fontSize:"5.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", cursor:"default" }}>
          {form?.ctaText || "Learn More"}
          <FaChevronRight style={{ fontSize:4 }} />
        </button>
      </div>

      {/* Progress bar */}
      {lc.showProgressBar && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"rgba(255,255,255,0.08)" }}>
          <div style={{ width:"35%", height:"100%", background:"rgba(255,255,255,0.6)" }} />
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div style={{ position:"absolute", top:5, right:5, width:16, height:16, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <HiOutlineCheck style={{ fontSize:9, color:"#fff" }} />
        </div>
      )}
    </div>
  );
};

// ─── Main TemplateSelector ────────────────────────────────────────────────────
const TemplateSelector = ({ form, localMediaUrl, onApply }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState(null);

  const categories = ["All", ...Object.keys(TEMPLATE_CATEGORIES).filter(k => k !== "All")];

  const filtered = useMemo(() =>
    activeCategory === "All"
      ? AD_TEMPLATES
      : AD_TEMPLATES.filter(t => t.category === activeCategory),
    [activeCategory]
  );

  // Detect if current form matches a template
  const currentTemplateId = useMemo(() => {
    return AD_TEMPLATES.find(t =>
      t.layoutConfig.textPosition    === form.layoutConfig.textPosition &&
      t.layoutConfig.overlayColor    === form.layoutConfig.overlayColor &&
      t.buttonStyle.radius           === form.buttonStyle.radius &&
      t.buttonStyle.variant          === form.buttonStyle.variant
    )?.id || null;
  }, [form.layoutConfig, form.buttonStyle]);

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
        <HiOutlineSparkles style={{ fontSize:14, color:"#818cf8" }} />
        <span style={{ fontSize:11, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:"0.1em" }}>
          Design Templates
        </span>
      </div>

      {/* Info banner */}
      <div style={{ padding:"8px 12px", background:"rgba(99,102,241,0.08)", borderRadius:8, border:"1px solid rgba(99,102,241,0.2)", marginBottom:12 }}>
        <div style={{ fontSize:11, color:"#818cf8", lineHeight:1.5 }}>
          Select a template to instantly apply a professional layout. Your media, title, and text are kept — only the design style changes.
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          const catStyle = TEMPLATE_CATEGORIES[cat] || { bg:"rgba(99,102,241,0.15)", color:"#818cf8", border:"#6366f1" };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding:"3px 10px", borderRadius:6, fontSize:10, fontWeight:700,
                cursor:"pointer",
                background: isActive ? catStyle.bg : "#18181b",
                color: isActive ? catStyle.color : "#52525b",
                border: isActive ? `1px solid ${catStyle.border}` : "1px solid #27272a",
                transition:"all 0.15s",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Template grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {filtered.map(template => (
          <div
            key={template.id}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onApply(template)}
            style={{ cursor:"pointer" }}
          >
            <TemplateMiniPreview
              template={template}
              isSelected={currentTemplateId === template.id}
              mediaUrl={localMediaUrl || (form.mediaType === "image" ? form.mediaUrl : "")}
              form={form}
            />
            {/* Template info */}
            <div style={{ marginTop:5, paddingLeft:2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color: currentTemplateId === template.id ? "#818cf8" : "#d4d4d8" }}>
                  {template.name}
                </span>
                <span style={{
                  padding:"1px 5px", borderRadius:4, fontSize:8, fontWeight:700,
                  background: TEMPLATE_CATEGORIES[template.category]?.bg || "rgba(99,102,241,0.15)",
                  color: TEMPLATE_CATEGORIES[template.category]?.color || "#818cf8",
                }}>
                  {template.category}
                </span>
              </div>
              {hoveredId === template.id && (
                <div style={{ fontSize:10, color:"#52525b", marginTop:2, lineHeight:1.4 }}>
                  {template.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reset button */}
      {currentTemplateId && (
        <button
          onClick={() => onApply(null)}
          style={{ marginTop:14, width:"100%", padding:"7px", borderRadius:7, background:"#18181b", border:"1px solid #27272a", color:"#71717a", fontSize:11, cursor:"pointer", fontWeight:600 }}
        >
          Reset to Default Style
        </button>
      )}
    </div>
  );
};

export default TemplateSelector;