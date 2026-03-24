import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { useT, useLang } from "../context";

var ROTATE_MS = 1400;
var MAX_VISIBLE = 5;

var stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  var s = document.createElement("style");
  s.textContent = [
    "@keyframes fc-chord-in{from{opacity:0}to{opacity:1}}",
    "@keyframes fc-chord-fade{0%{opacity:0;transform:translateY(6px)}60%{opacity:1}100%{opacity:1;transform:translateY(0)}}",
  ].join("");
  document.head.appendChild(s);
}

function Kbd({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 20, height: 20, padding: "0 5px",
      fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
      color: "var(--text-secondary)", background: "var(--bg-page)",
      border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
      boxShadow: "0 1px 0 var(--border-strong)",
      lineHeight: 1, textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

export default function ChordPalette({ chordNav, onSelect, onDismiss }) {
  var t = useT();
  var { lang } = useLang();
  var tb = t.tabs || {};
  var thenLabel = lang === "fr" ? "puis" : "then";

  var entries = [];
  Object.keys(chordNav).forEach(function (key) {
    entries.push({ key: key, tab: chordNav[key], label: tb[chordNav[key]] || chordNav[key] });
  });

  var [expanded, setExpanded] = useState(false);
  var [idx, setIdx] = useState(function () { return Math.floor(Math.random() * entries.length); });
  var timerRef = useRef(null);

  // Auto-rotate when collapsed
  useEffect(function () {
    if (expanded || entries.length === 0) return;
    timerRef.current = setInterval(function () {
      setIdx(function () { return Math.floor(Math.random() * entries.length); });
    }, ROTATE_MS);
    return function () { clearInterval(timerRef.current); };
  }, [expanded, entries.length]);

  injectStyles();

  var current = entries[idx] || entries[0];
  if (!current) return null;

  function handleToggle() { setExpanded(function (v) { return !v; }); }

  function handleSelect(tabId) {
    if (onSelect) onSelect(tabId);
    if (onDismiss) onDismiss();
  }

  return createPortal(
    <div style={{
      position: "fixed", bottom: 130,
      left: "var(--fc-content-center, 50%)",
      transform: "translateX(-50%)",
      zIndex: 700,
      animation: "fc-chord-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
    }}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: expanded ? "var(--r-xl)" : "var(--r-lg)",
        boxShadow: "0 8px 32px -8px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        minWidth: 240, maxWidth: 360,
        transition: "border-radius 0.2s",
      }}>

        {/* Header — collapsed: rotating shortcut / expanded: title */}
        <button
          type="button"
          onClick={handleToggle}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "10px 14px",
            border: "none", background: "transparent",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <Kbd>G</Kbd>

          {!expanded ? (
            <div key={idx} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 6,
              animation: "fc-chord-fade 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              minWidth: 0,
            }}>
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{thenLabel}</span>
              <Kbd>{current.key}</Kbd>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {current.label}
              </span>
            </div>
          ) : (
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "left" }}>
              {lang === "fr" ? "Aller à" : "Go to"}
            </span>
          )}

          <span style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, color: "var(--text-faint)" }}>
            <CaretUp size={10} weight="bold" style={{ marginBottom: -3 }} />
            <CaretDown size={10} weight="bold" />
          </span>
        </button>

        {/* Expanded: scrollable list */}
        {expanded ? (
          <div style={{
            borderTop: "1px solid var(--border-light)",
            maxHeight: MAX_VISIBLE * 40,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border-strong) transparent",
          }}>
            {entries.map(function (e) {
              return (
                <button
                  key={e.key}
                  type="button"
                  onClick={function () { handleSelect(e.tab); }}
                  onMouseEnter={function (ev) { ev.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (ev) { ev.currentTarget.style.background = "transparent"; }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", height: 40, padding: "0 14px",
                    border: "none", background: "transparent",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.1s",
                  }}
                >
                  <Kbd>{e.key}</Kbd>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", textAlign: "left" }}>
                    {e.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
