import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CaretDown } from "@phosphor-icons/react";

export default function Select({ value, onChange, options, placeholder, height, width }) {
  var [open, setOpen] = useState(false);
  var [panelStyle, setPanelStyle] = useState({});
  var wrapRef = useRef(null);
  var panelRef = useRef(null);
  var h = height || 30;
  var selected = options.find(function (o) { return o.value === value; });

  function handleToggle() {
    if (!open && wrapRef.current) {
      var rect = wrapRef.current.getBoundingClientRect();
      var pw = Math.max(rect.width, 180);
      var spaceBelow = window.innerHeight - rect.bottom - 8;
      var spaceAbove = rect.top - 8;
      if (spaceBelow >= 220 || spaceBelow >= spaceAbove) {
        setPanelStyle({ top: rect.bottom + 4, bottom: "auto", left: rect.left, width: pw, maxH: Math.min(spaceBelow, 220) });
      } else {
        setPanelStyle({ top: "auto", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: pw, maxH: Math.min(spaceAbove, 220) });
      }
    }
    setOpen(function (v) { return !v; });
  }

  useEffect(function () {
    if (!open) return;
    function onOutside(e) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) { setOpen(false); }
    }
    function onScroll(e) {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("scroll", onScroll, true);
    return function () {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  var panel = open ? (
    <div
      ref={panelRef}
      className="custom-scroll"
      style={{
        position: "fixed",
        top: panelStyle.top,
        bottom: panelStyle.bottom,
        left: panelStyle.left,
        width: panelStyle.width,
        maxHeight: panelStyle.maxH || 220,
        overflowY: "auto",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-dropdown)",
        padding: "var(--sp-1)",
        zIndex: 9999,
      }}
    >
      {placeholder ? (
        <div
          onClick={function () { onChange(""); setOpen(false); }}
          style={{ padding: "var(--sp-2) var(--sp-3)", fontSize: 12, color: "var(--text-faint)", borderRadius: "var(--r-sm)", cursor: "pointer" }}
        >
          {placeholder}
        </div>
      ) : null}
      {options.map(function (opt) {
        var active = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={function () { onChange(opt.value); setOpen(false); }}
            style={{
              padding: "var(--sp-2) var(--sp-3)",
              fontSize: 12,
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              background: active ? "var(--brand-bg)" : "transparent",
              color: active ? "var(--brand)" : "var(--text-primary)",
              fontWeight: active ? 600 : 400,
            }}
            onMouseEnter={function (e) { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={function (e) { if (!active) e.currentTarget.style.background = active ? "var(--brand-bg)" : "transparent"; }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={wrapRef}
        style={{ position: "relative", display: "inline-flex", alignItems: "center", width: width || "auto" }}
      >
        <button
          type="button"
          onClick={handleToggle}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: h,
            padding: "0 26px 0 var(--sp-3)",
            fontSize: 12,
            border: open ? "1px solid var(--brand)" : "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--input-bg)",
            color: (selected && selected.value !== "") ? "var(--text-primary)" : "var(--text-faint)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            textAlign: "left",
            boxShadow: open ? "var(--focus-ring)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {selected ? selected.label : (placeholder || "")}
          </span>
        </button>
        <CaretDown
          size={11}
          weight="bold"
          color="var(--text-faint)"
          style={{
            position: "absolute",
            right: 8,
            pointerEvents: "none",
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      {createPortal(panel, document.body)}
    </>
  );
}
