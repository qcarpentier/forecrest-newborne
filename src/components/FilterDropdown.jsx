import { useState } from "react";
import { FunnelSimple, CaretDown } from "@phosphor-icons/react";

export default function FilterDropdown({ value, onChange, options }) {
  var [open, setOpen] = useState(false);
  var activeLabel = "";
  options.forEach(function (o) { if (o.value === value) activeLabel = o.label; });
  var isFiltered = value !== "all";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={function () { setOpen(function (v) { return !v; }); }}
        onKeyDown={function (e) { if (e.key === "Escape" && open) { setOpen(false); e.stopPropagation(); } }}
        style={{
          height: 40,
          padding: "0 var(--sp-3)",
          paddingRight: 32,
          border: "1px solid " + (isFiltered ? "var(--brand)" : "var(--border)"),
          borderRadius: "var(--r-md)",
          background: isFiltered ? "var(--brand-bg)" : "var(--bg-card)",
          color: isFiltered ? "var(--brand)" : "var(--text-secondary)",
          fontSize: 13, fontWeight: 500, fontFamily: "inherit",
          cursor: "pointer", outline: "none",
          display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
          transition: "border-color 0.12s, background 0.12s",
          whiteSpace: "nowrap",
        }}
      >
        <FunnelSimple size={16} weight="bold" />
        <span style={{ position: "relative" }}>
          {/* Invisible sizer — renders longest label to set stable width */}
          {options.map(function (o) {
            return <span key={o.value} style={{ display: "block", height: 0, overflow: "hidden", visibility: "hidden" }} aria-hidden="true">{o.label}</span>;
          })}
          {/* Visible active label */}
          <span style={{ display: "block", textAlign: "left" }}>{activeLabel}</span>
        </span>
        <CaretDown size={12} weight="bold" style={{ position: "absolute", right: 10, opacity: 0.5 }} />
      </button>

      {open ? (
        <>
          <div onClick={function () { setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 51,
            minWidth: "100%",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
            padding: "var(--sp-1)",
            animation: "tooltipIn 0.1s ease",
          }} role="listbox">
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
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    width: "100%", padding: "8px var(--sp-3)",
                    border: "none", borderRadius: "var(--r-sm)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
