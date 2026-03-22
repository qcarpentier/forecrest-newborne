import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Palette } from "@phosphor-icons/react";
import { CHART_MULTI, generateBrandPalette } from "../constants/colors";
import { useT } from "../context";

/**
 * Icon-only button with dropdown to switch chart palette mode.
 * Placed in chart card headers for quick accessibility toggle.
 *
 * Props:
 * - value: "brand" | "multi"
 * - onChange: function(mode)
 * - accentRgb: [r,g,b] — current accent color for brand preview
 */
export default function PaletteToggle({ value, onChange, accentRgb }) {
  var t = useT();
  var [open, setOpen] = useState(false);
  var [pos, setPos] = useState({ top: 0, left: 0 });
  var btnRef = useRef(null);
  var menuRef = useRef(null);

  var brandPreview = generateBrandPalette(accentRgb).slice(0, 5);
  var multiPreview = CHART_MULTI.slice(0, 5);

  function handleToggle() {
    if (!open && btnRef.current) {
      var rect = btnRef.current.getBoundingClientRect();
      var left = rect.right - 200;
      if (left < 8) left = 8;
      setPos({ top: rect.bottom + 4, left: left });
    }
    setOpen(function (v) { return !v; });
  }

  useEffect(function () {
    if (!open) return;
    function onClick(e) {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, true);
    return function () { document.removeEventListener("mousedown", onClick); window.removeEventListener("scroll", onScroll, true); };
  }, [open]);

  function select(mode) {
    onChange(mode);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-label={t.palette_toggle || "Changer la palette"}
        style={{
          height: 32, padding: "0 10px",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border)", borderRadius: "var(--r-md)",
          background: "transparent", cursor: "pointer",
          color: "var(--text-secondary)",
          fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          transition: "border-color 0.12s, color 0.12s, background 0.12s",
          gap: 6,
        }}
        onMouseEnter={function (e) { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.background = "var(--brand-bg)"; }}
        onMouseLeave={function (e) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
      >
        <Palette size={14} />
      </button>

      {open ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed", top: pos.top, left: pos.left,
            width: 200, zIndex: 1100,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            padding: "var(--sp-2)",
            animation: "tooltipInBottom 0.12s ease",
          }}
        >
          {[
            { mode: "brand", label: t.palette_brand || "Brand", desc: t.palette_brand_desc || "Dégradé monochrome", preview: brandPreview },
            { mode: "multi", label: t.palette_multi || "Multi", desc: t.palette_multi_desc || "Couleurs distinctes", preview: multiPreview },
          ].map(function (opt) {
            var isActive = value === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={function () { select(opt.mode); }}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-2)",
                  width: "100%", padding: "8px var(--sp-2)",
                  border: "none", borderRadius: "var(--r-sm)",
                  background: isActive ? "var(--brand-bg)" : "transparent",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s", fontFamily: "inherit",
                }}
                onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
              >
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  {opt.preview.map(function (c, i) {
                    return <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c }} />;
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-primary)" }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.2 }}>{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>,
        document.body
      ) : null}
    </div>
  );
}
