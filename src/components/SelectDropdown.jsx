import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, XClose } from "@untitledui/icons";

/**
 * Custom styled dropdown (replaces native <select>).
 * Uses portal to avoid overflow clipping in modals.
 */
export default function SelectDropdown({ value, onChange, options, placeholder, width, height, clearable }) {
  var [open, setOpen] = useState(false);
  var [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  var btnRef = useRef(null);
  var menuRef = useRef(null);
  var h = height || 40;

  var activeOption = null;
  options.forEach(function (o) { if (o.value === value) activeOption = o; });
  var displayLabel = activeOption ? activeOption.label : (placeholder || "");

  var updatePos = useCallback(function () {
    if (!btnRef.current) return;
    var rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  function handleOpen() {
    updatePos();
    setOpen(function (v) { return !v; });
  }

  useEffect(function () {
    if (!open) return;
    function onClick(e) {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return function () { document.removeEventListener("mousedown", onClick); };
  }, [open]);

  function handleKeyDown(e) {
    if (e.key === "Escape" && open) { setOpen(false); e.stopPropagation(); }
  }

  return (
    <div style={{ position: "relative", width: width || "100%" }} onKeyDown={handleKeyDown}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleOpen}
        style={{
          width: "100%", height: h,
          padding: "0 38px 0 var(--sp-3)",
          border: "1px solid " + (open ? "var(--input-border-focus)" : "var(--input-border)"),
          borderRadius: "var(--r-md)",
          background: "var(--input-bg)",
          color: activeOption ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: 13, fontFamily: "inherit", fontWeight: 500,
          cursor: "pointer", outline: "none",
          display: "flex", alignItems: "center",
          textAlign: "left",
          transition: "border-color 0.12s, box-shadow 0.12s",
          position: "relative",
          boxShadow: open ? "var(--focus-ring)" : "none",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayLabel}
        </span>
        {clearable && activeOption && value ? (
          <span
            onClick={function (e) { e.stopPropagation(); onChange(""); setOpen(false); }}
            style={{
              position: "absolute", right: 28,
              width: 20, height: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--r-full)",
              background: "var(--bg-accordion)",
              color: "var(--text-muted)", cursor: "pointer",
              fontSize: 12, lineHeight: 1,
            }}
            aria-label="Clear"
          >
            <XClose style={{ width: 12, height: 12 }} />
          </span>
        ) : null}
        <ChevronDown style={{
          position: "absolute", right: 12,
          width: 14, height: 14,
          color: "var(--text-muted)", opacity: 0.6,
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.15s",
        }} />
      </button>

      {open ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 1100,
            maxHeight: 220, overflowY: "auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-dropdown)",
            padding: "6px",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border-strong) transparent",
            backdropFilter: "blur(12px)",
          }}
        >
          {options.map(function (opt) {
            var isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={function () { onChange(opt.value); setOpen(false); }}
                onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "8px var(--sp-3)",
                  border: "none", borderRadius: "var(--r-sm)",
                  background: isActive ? "var(--brand-bg)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {opt.label}
                </span>
                {isActive ? <Check style={{ width: 12, height: 12, color: "var(--brand)", flexShrink: 0, marginLeft: 8 }} /> : null}
              </button>
            );
          })}
        </div>,
        document.body
      ) : null}
    </div>
  );
}
