import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlass, X, Code, Info, Wrench, Database, Palette, MapTrifold, TreeStructure, Shuffle,
} from "@phosphor-icons/react";

var DEV_PAGES = [
  { id: "dev-roadmap", icon: MapTrifold, label: "Roadmap", desc: "Planned features, payment integrations, role system" },
  { id: "dev-sitemap", icon: TreeStructure, label: "Sitemap", desc: "Page architecture, components, utils, data flows" },
  { id: "dev-tooltips", icon: Info, label: "Tooltip Registry", desc: "View all InfoTip tooltips across the app" },
  { id: "dev-calc", icon: Database, label: "Debug Calculations", desc: "All financial calculations with inputs, formulas, and results" },
  { id: "dev-tokens", icon: Palette, label: "Design Tokens", desc: "CSS custom properties, colors, spacing, radii" },
  { id: "_randomize_all", icon: Shuffle, label: "Randomize all pages", desc: "Fill revenue, costs, team, equipment, stocks, financing with sample data" },
];

function DevItem({ item, active, onMouseDown, onMouseEnter, idx }) {
  var Icon = item.icon;
  return (
    <button
      data-cmd-idx={idx}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "8px 12px",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--color-dev-bg)" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.08s",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
        <Icon size={16} color={active ? "var(--color-dev)" : "var(--text-muted)"} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "var(--color-dev)" : "var(--text-primary)" }}>{item.label}</div>
        {item.desc ? <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>{item.desc}</div> : null}
      </div>
    </button>
  );
}

export default function DevCommandPalette({ open, onClose, setTab, onRandomizeAll }) {
  var [query, setQuery] = useState("");
  var [cursor, setCursor] = useState(0);
  var inputRef = useRef(null);

  useEffect(function () {
    if (!open) return;
    setQuery("");
    setCursor(0);
    requestAnimationFrame(function () { if (inputRef.current) inputRef.current.focus(); });
    var prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    return function () { document.documentElement.style.overflowY = prev; };
  }, [open]);

  useEffect(function () { setCursor(0); }, [query]);

  var q = query.toLowerCase().trim();
  var filtered = q
    ? DEV_PAGES.filter(function (p) { return p.label.toLowerCase().includes(q) || (p.desc || "").toLowerCase().includes(q); })
    : DEV_PAGES;

  function execute(item) {
    if (item.id === "_randomize_all") {
      if (onRandomizeAll) onRandomizeAll();
      onClose();
      return;
    }
    setTab(item.id);
    onClose();
  }

  useEffect(function () {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(function (c) { return Math.min(c + 1, filtered.length - 1); }); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor(function (c) { return Math.max(c - 1, 0); }); return; }
      if (e.key === "Enter") { e.preventDefault(); if (filtered[cursor]) execute(filtered[cursor]); }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [open, cursor, filtered]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 700,
        background: "var(--overlay-bg)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--r-xl)",
        border: "2px solid var(--color-dev)",
        boxShadow: "0 0 0 4px var(--color-dev-bg), var(--shadow-modal)",
        width: 480, maxWidth: "92vw",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        maxHeight: "60vh",
        animation: "tooltipIn 0.1s ease",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid var(--color-dev-border)",
          background: "var(--color-dev-bg)",
          flexShrink: 0,
        }}>
          <Code size={16} color="var(--color-dev)" weight="bold" />
          <input
            ref={inputRef}
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            placeholder="Dev pages..."
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, color: "var(--text-primary)", outline: "none",
              fontFamily: "inherit",
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dev)", background: "var(--color-dev-border)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>DEV</span>
          <button
            onMouseDown={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24,
              border: "1px solid var(--color-dev-border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer",
            }}
          >
            <X size={12} color="var(--color-dev)" weight="bold" />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "var(--sp-2)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>No dev pages found</div>
          ) : null}
          {filtered.map(function (item, i) {
            return (
              <DevItem
                key={item.id}
                item={item}
                idx={i}
                active={cursor === i}
                onMouseDown={function () { execute(item); }}
                onMouseEnter={function () { setCursor(i); }}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          borderTop: "1px solid var(--color-dev-border)",
          fontSize: 11, color: "var(--color-dev)",
          flexShrink: 0,
        }}>
          <Wrench size={12} />
          <span>Developer-only pages — Ctrl+Shift+K</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
