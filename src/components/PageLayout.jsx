import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { APP_NAME, VERSION, RELEASE_DATE } from "../constants/config";
import { BookOpen, ClockCounterClockwise } from "@phosphor-icons/react";
import { useT, useLang } from "../context";

var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
var MOD = isMac ? "⌘" : "Ctrl";

function Kbd({ children }) {
  return (
    <kbd style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 20, height: 20, padding: "0 5px",
      fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
      color: "var(--text-secondary)", background: "var(--bg-page)",
      border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
      boxShadow: "0 1px 0 var(--border-strong)",
      lineHeight: 1, whiteSpace: "nowrap",
    }}>
      {children}
    </kbd>
  );
}

function buildShortcuts(s) {
  return [
    { section: s.nav },
    { keys: ["G", "then", "…"], label: s.nav_pages },
    { keys: [MOD, "K"], label: s.command_palette },
    { section: s.actions },
    { keys: [MOD, "Z"], label: s.undo },
    { keys: [MOD, "⇧", "Z"], label: s.redo },
    { keys: [MOD, "S"], label: s.export },
    { keys: [MOD, "P"], label: s.presentation },
    { section: s.help_section },
    { keys: ["?"], label: s.show_shortcuts },
  ];
}

function ShortcutsModal({ onClose }) {
  var s = useT().shortcuts;
  var { lang } = useLang();
  useEffect(function () {
    var prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return function () {
      document.documentElement.style.overflowY = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "var(--overlay-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-modal)",
        width: 400, maxWidth: "92vw",
        overflow: "hidden",
        animation: "tooltipIn 0.1s ease",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", borderBottom: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</span>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24,
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer",
              color: "var(--text-faint)", fontSize: 14, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "var(--sp-3) var(--sp-4) var(--sp-4)" }}>
          {buildShortcuts(s).map(function (row, i) {
            if (row.section) {
              return (
                <div key={i} style={{
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: 0.6, color: "var(--text-faint)",
                  padding: i === 0 ? "2px 0 8px" : "14px 0 8px",
                }}>
                  {row.section}
                </div>
              );
            }
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "5px 0",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
                  {row.keys.map(function (k, j) {
                    if (k === "–" || k === "then") return <span key={j} style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400, margin: "0 1px" }}>{k === "then" ? (lang === "fr" ? "puis" : "then") : k}</span>;
                    return <Kbd key={j}>{k}</Kbd>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PageLayout({ title, subtitle, actions, children }) {
  var t = useT();
  var { lang } = useLang();
  var [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(function () {
    function onKey(e) {
      var tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcuts(function (v) { return !v; });
      }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "calc(100vh - var(--page-py) * 2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: subtitle ? "var(--sp-1)" : "var(--gap-lg)" }}>
        <h1 style={{ fontSize: "calc(32px * var(--font-scale, 1))", fontWeight: 800, margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{title}</h1>
        {actions ? <div style={{ display: "flex", gap: "var(--sp-2)", flexShrink: 0 }}>{actions}</div> : null}
      </div>
      {subtitle ? (
        <p style={{ fontSize: "calc(15px * var(--font-scale, 1))", color: "var(--text-muted)", margin: "0 0 var(--gap-xl)", lineHeight: 1.5 }}>{subtitle}</p>
      ) : null}
      <div style={{ flex: 1 }}>{children}</div>
      <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "var(--sp-8)", paddingTop: "var(--sp-4)", display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)" }}>{APP_NAME}</span>
        <span style={{ fontSize: 11, color: "var(--border-strong)" }}>·</span>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-faint)", letterSpacing: 0.3 }}>v{VERSION}</span>
        <span style={{ fontSize: 11, color: "var(--border-strong)" }}>·</span>
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{RELEASE_DATE}</span>
        <span style={{ fontSize: 11, color: "var(--border-strong)" }}>·</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--color-warning)", background: "var(--color-warning-bg)", padding: "1px 6px", borderRadius: 4 }}>alpha</span>
        <span style={{ fontSize: 11, color: "var(--border-strong)" }}>·</span>
        <button
          onClick={function () { window.dispatchEvent(new CustomEvent("nav-tab", { detail: "changelog" })); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "transparent", border: "none", cursor: "pointer", padding: 0,
            color: "var(--text-faint)", fontSize: 11,
          }}
        >
          <ClockCounterClockwise size={12} />
          <span>{t.tabs.changelog}</span>
        </button>
        <span style={{ fontSize: 11, color: "var(--border-strong)" }}>·</span>
        <button
          onClick={function () { window.dispatchEvent(new CustomEvent("nav-tab", { detail: "credits" })); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "transparent", border: "none", cursor: "pointer", padding: 0,
            color: "var(--text-faint)", fontSize: 11,
          }}
        >
          <span>{t.tabs.credits}</span>
        </button>
        <span style={{ fontSize: 11, color: "var(--border-strong)" }}>·</span>
        <button
          onClick={function () { setShowShortcuts(true); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "transparent", border: "none", cursor: "pointer", padding: 0,
            color: "var(--text-faint)", fontSize: 11,
          }}
        >
          <kbd style={{ fontSize: 11, fontFamily: "monospace", background: "var(--bg-page)", border: "1px solid var(--border-strong)", borderRadius: 3, padding: "1px 4px", boxShadow: "0 1px 0 var(--border-strong)", color: "var(--text-faint)" }}>?</kbd>
          <span>{t.shortcuts.title}</span>
        </button>
      </div>
      {showShortcuts ? <ShortcutsModal onClose={function () { setShowShortcuts(false); }} /> : null}
    </div>
  );
}
