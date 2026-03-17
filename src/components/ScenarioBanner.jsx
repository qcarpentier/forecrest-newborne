import { useState, useRef, useEffect } from "react";
import { X, Plus, Copy, Browsers, CaretDown, Trash } from "@phosphor-icons/react";
import { useT } from "../context";

var PRESET_COLORS = [
  "var(--text-muted)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-error)",
  "var(--brand)",
];

export default function ScenarioBanner({
  scenarios, activeId, onSwitch, onSave, onDelete, onDuplicate, onRename,
}) {
  var tAll = useT();
  var t = tAll.scenarios;
  var [dismissed, setDismissed] = useState(false);
  var [dropOpen, setDropOpen] = useState(false);
  var [editing, setEditing] = useState(null);
  var dropRef = useRef(null);

  useEffect(function () {
    if (!dropOpen) return;
    function onClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return function () { document.removeEventListener("mousedown", onClick); };
  }, [dropOpen]);

  if (dismissed) return null;

  function displayName(sc) { return sc ? (t[sc.name] || sc.name) : t.base; }
  var active = scenarios.find(function (s) { return s.id === activeId; });
  var activeName = displayName(active);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-5)",
      padding: "var(--sp-4) var(--sp-5)",
      paddingRight: "var(--sp-8)",
      background: "linear-gradient(135deg, var(--bg-card) 0%, var(--brand-bg) 100%)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-xl)",
      marginBottom: "var(--sp-6)",
      position: "relative",
      minHeight: 120,
    }}>
      {/* Left: icon + text */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--sp-2)", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <Browsers size={18} weight="duotone" color="var(--brand)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{t.banner_title}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px",
            borderRadius: "var(--r-full)",
            background: "var(--brand-bg)", color: "var(--brand)",
            border: "1px solid var(--brand)",
          }}>
            {t.banner_active}: {activeName}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5, maxWidth: 440 }}>
          {t.banner_desc}
        </p>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginTop: "var(--sp-1)" }}>
          {/* Scenario switcher dropdown */}
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={function () { setDropOpen(!dropOpen); }}
              style={{
                display: "flex", alignItems: "center", gap: "var(--sp-1)",
                padding: "5px 12px", borderRadius: "var(--r-md)",
                border: "1px solid var(--border)", background: "var(--bg-card)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)",
              }}
            >
              <Browsers size={13} />
              {activeName}
              {scenarios.length > 1 ? (
                <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400 }}>
                  ({scenarios.length})
                </span>
              ) : null}
              <CaretDown size={10} style={{ marginLeft: 2 }} />
            </button>

            {dropOpen ? (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 260,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-dropdown)",
                padding: "var(--sp-2)", zIndex: 200,
              }}>
                {scenarios.map(function (sc) {
                  var isActive = sc.id === activeId;
                  return (
                    <div
                      key={sc.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "var(--sp-2)",
                        padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-md)",
                        background: isActive ? "var(--brand-bg)" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={function () { if (!isActive) { onSwitch(sc.id); setDropOpen(false); } }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: sc.color || PRESET_COLORS[0],
                        flexShrink: 0,
                      }} />
                      {editing === sc.id ? (
                        <input
                          autoFocus
                          defaultValue={sc.name}
                          onClick={function (e) { e.stopPropagation(); }}
                          onKeyDown={function (e) {
                            if (e.key === "Enter") { onRename(sc.id, e.target.value); setEditing(null); }
                            if (e.key === "Escape") setEditing(null);
                          }}
                          onBlur={function (e) { onRename(sc.id, e.target.value); setEditing(null); }}
                          style={{
                            flex: 1, border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
                            padding: "2px var(--sp-2)", fontSize: 12, background: "var(--input-bg)",
                            color: "var(--text-primary)", outline: "none",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            flex: 1, fontSize: 12, fontWeight: isActive ? 600 : 400,
                            color: isActive ? "var(--brand)" : "var(--text-primary)",
                          }}
                          onDoubleClick={function (e) { e.stopPropagation(); setEditing(sc.id); }}
                        >
                          {displayName(sc)}
                        </span>
                      )}
                      <button
                        onClick={function (e) { e.stopPropagation(); onDuplicate(sc.id); }}
                        title={t.duplicate}
                        style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, display: "flex" }}
                      >
                        <Copy size={13} color="var(--text-faint)" />
                      </button>
                      {scenarios.length > 1 ? (
                        <button
                          onClick={function (e) { e.stopPropagation(); onDelete(sc.id); }}
                          title={t.delete}
                          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, display: "flex" }}
                        >
                          <Trash size={13} color="var(--text-faint)" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* New scenario (copy current) */}
          <button
            onClick={onSave}
            style={{
              display: "flex", alignItems: "center", gap: "var(--sp-1)",
              padding: "5px 12px", borderRadius: "var(--r-md)",
              border: "1px solid var(--brand)", background: "var(--brand-bg)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--brand)",
            }}
          >
            <Plus size={12} weight="bold" />
            {t.banner_new}
          </button>

          {/* Duplicate active */}
          <button
            onClick={function () { onDuplicate(activeId); }}
            style={{
              display: "flex", alignItems: "center", gap: "var(--sp-1)",
              padding: "5px 12px", borderRadius: "var(--r-md)",
              border: "1px solid var(--border)", background: "transparent",
              fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--text-muted)",
            }}
          >
            <Copy size={12} />
            {t.banner_duplicate}
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={function () { setDismissed(true); }}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 2,
          border: "none", background: "transparent", cursor: "pointer",
          padding: 4, display: "flex", color: "var(--text-faint)",
          borderRadius: "var(--r-sm)",
        }}
        title={tAll.close}
      >
        <X size={14} />
      </button>
    </div>
  );
}
