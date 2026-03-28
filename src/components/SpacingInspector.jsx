import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check } from "@phosphor-icons/react";

/* ── Figma-style colors ── */
var COLORS = {
  padding: { fill: "rgba(186, 85, 211, 0.12)", stroke: "rgba(186, 85, 211, 0.6)", label: "#9B59B6" },  /* purple */
  margin: { fill: "rgba(255, 149, 0, 0.10)", stroke: "rgba(255, 149, 0, 0.5)", label: "#FF9500" },      /* orange */
  gap: { fill: "rgba(30, 195, 120, 0.12)", stroke: "rgba(30, 195, 120, 0.6)", label: "#1EC378" },        /* green */
  size: { label: "var(--text-primary)" },
};

var cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  var s = document.createElement("style");
  s.id = "fc-spacing-inspector";
  s.textContent = [
    "html.fc-inspect * { outline: 1px dashed rgba(186,85,211,0.25) !important; outline-offset: -1px; }",
    "html.fc-inspect *:hover { outline-color: rgba(186,85,211,0.7) !important; z-index: 9998 !important; position: relative; }",
  ].join("\n");
  document.head.appendChild(s);
}

function parsePx(v) {
  if (!v) return 0;
  return parseFloat(v) || 0;
}

function getSpacingInfo(el) {
  var cs = window.getComputedStyle(el);
  return {
    padding: {
      top: parsePx(cs.paddingTop), right: parsePx(cs.paddingRight),
      bottom: parsePx(cs.paddingBottom), left: parsePx(cs.paddingLeft),
    },
    margin: {
      top: parsePx(cs.marginTop), right: parsePx(cs.marginRight),
      bottom: parsePx(cs.marginBottom), left: parsePx(cs.marginLeft),
    },
    gap: parsePx(cs.gap) || parsePx(cs.rowGap) || 0,
    width: Math.round(el.offsetWidth),
    height: Math.round(el.offsetHeight),
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontFamily: cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
    borderRadius: cs.borderRadius,
    display: cs.display,
    tag: el.tagName.toLowerCase(),
  };
}

function fmtShorthand(obj) {
  var t = obj.top; var r = obj.right; var b = obj.bottom; var l = obj.left;
  if (t === r && r === b && b === l) return t + "px";
  if (t === b && l === r) return t + "px " + r + "px";
  return t + "px " + r + "px " + b + "px " + l + "px";
}

function hasSpacing(obj) {
  return obj.top > 0 || obj.right > 0 || obj.bottom > 0 || obj.left > 0;
}

function copyToClipboard(text, setCopied) {
  navigator.clipboard.writeText(text).then(function () {
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 1500);
  });
}

export default function SpacingInspector({ enabled, onClose }) {
  var [hovered, setHovered] = useState(null);
  var [info, setInfo] = useState(null);
  var [pos, setPos] = useState({ x: 0, y: 0 });
  var [copied, setCopied] = useState(false);
  var ignoreRef = useRef(null);

  useEffect(function () {
    if (!enabled) {
      document.documentElement.classList.remove("fc-inspect");
      return;
    }
    injectCSS();
    document.documentElement.classList.add("fc-inspect");
    return function () { document.documentElement.classList.remove("fc-inspect"); };
  }, [enabled]);

  var handleMouseMove = useCallback(function (e) {
    if (!enabled) return;
    /* Ignore the inspector panel itself */
    if (ignoreRef.current && ignoreRef.current.contains(e.target)) return;

    var el = e.target;
    if (el === hovered) return;
    setHovered(el);
    setInfo(getSpacingInfo(el));
    setPos({ x: e.clientX, y: e.clientY });
  }, [enabled, hovered]);

  var handleClick = useCallback(function (e) {
    if (!enabled) return;
    if (ignoreRef.current && ignoreRef.current.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();

    var el = e.target;
    var data = getSpacingInfo(el);
    var lines = [];
    lines.push("/* " + data.tag + " " + data.width + "x" + data.height + " */");
    if (hasSpacing(data.padding)) lines.push("padding: " + fmtShorthand(data.padding) + ";");
    if (hasSpacing(data.margin)) lines.push("margin: " + fmtShorthand(data.margin) + ";");
    if (data.gap > 0) lines.push("gap: " + data.gap + "px;");
    lines.push("font: " + data.fontWeight + " " + data.fontSize + " " + data.fontFamily + ";");
    if (data.borderRadius && data.borderRadius !== "0px") lines.push("border-radius: " + data.borderRadius + ";");
    lines.push("display: " + data.display + ";");

    copyToClipboard(lines.join("\n"), setCopied);
  }, [enabled]);

  useEffect(function () {
    if (!enabled) return;
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    return function () {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [enabled, handleMouseMove, handleClick]);

  if (!enabled) return null;

  /* ── Overlay boxes for padding/margin on hovered element ── */
  var overlays = null;
  if (hovered && info) {
    var rect = hovered.getBoundingClientRect();

    overlays = (
      <>
        {/* Margin overlay (orange) */}
        {hasSpacing(info.margin) ? (
          <div style={{
            position: "fixed", pointerEvents: "none", zIndex: 9996,
            top: rect.top - info.margin.top, left: rect.left - info.margin.left,
            width: rect.width + info.margin.left + info.margin.right,
            height: rect.height + info.margin.top + info.margin.bottom,
            background: COLORS.margin.fill, border: "1px dashed " + COLORS.margin.stroke,
          }} />
        ) : null}

        {/* Padding overlay (purple) */}
        {hasSpacing(info.padding) ? (
          <div style={{
            position: "fixed", pointerEvents: "none", zIndex: 9997,
            top: rect.top, left: rect.left,
            width: rect.width, height: rect.height,
            borderTop: info.padding.top + "px solid " + COLORS.padding.fill,
            borderRight: info.padding.right + "px solid " + COLORS.padding.fill,
            borderBottom: info.padding.bottom + "px solid " + COLORS.padding.fill,
            borderLeft: info.padding.left + "px solid " + COLORS.padding.fill,
            boxSizing: "border-box",
          }} />
        ) : null}
      </>
    );
  }

  /* ── Info tooltip ── */
  var tooltip = null;
  if (info && hovered) {
    var tx = Math.min(pos.x + 16, window.innerWidth - 260);
    var ty = pos.y + 20;
    if (ty + 200 > window.innerHeight) ty = pos.y - 180;

    tooltip = (
      <div style={{
        position: "fixed", top: ty, left: tx, zIndex: 10000,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-md)", boxShadow: "var(--shadow-dropdown)",
        padding: "var(--sp-3)", width: 240, pointerEvents: "none",
        fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11,
      }}>
        {/* Tag + size */}
        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          {"<" + info.tag + ">"} <span style={{ fontWeight: 400, color: "var(--text-faint)" }}>{info.width} x {info.height}</span>
        </div>

        {/* Padding */}
        {hasSpacing(info.padding) ? (
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <span style={{ color: COLORS.padding.label, fontWeight: 600, width: 52 }}>padding</span>
            <span style={{ color: "var(--text-secondary)" }}>{fmtShorthand(info.padding)}</span>
          </div>
        ) : null}

        {/* Margin */}
        {hasSpacing(info.margin) ? (
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <span style={{ color: COLORS.margin.label, fontWeight: 600, width: 52 }}>margin</span>
            <span style={{ color: "var(--text-secondary)" }}>{fmtShorthand(info.margin)}</span>
          </div>
        ) : null}

        {/* Gap */}
        {info.gap > 0 ? (
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <span style={{ color: COLORS.gap.label, fontWeight: 600, width: 52 }}>gap</span>
            <span style={{ color: "var(--text-secondary)" }}>{info.gap}px</span>
          </div>
        ) : null}

        {/* Font */}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <span style={{ color: "var(--text-faint)", fontWeight: 600, width: 52 }}>font</span>
          <span style={{ color: "var(--text-secondary)" }}>{info.fontWeight} {info.fontSize}</span>
        </div>

        {/* Font family */}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <span style={{ color: "var(--text-faint)", fontWeight: 600, width: 52 }}>family</span>
          <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.fontFamily}</span>
        </div>

        {/* Border radius */}
        {info.borderRadius && info.borderRadius !== "0px" ? (
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <span style={{ color: "var(--text-faint)", fontWeight: 600, width: 52 }}>radius</span>
            <span style={{ color: "var(--text-secondary)" }}>{info.borderRadius}</span>
          </div>
        ) : null}

        {/* Click hint */}
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border-light)", color: "var(--text-faint)", fontSize: 10 }}>
          {copied ? "Copied!" : "Click to copy CSS"}
        </div>
      </div>
    );
  }

  return createPortal(
    <>
      {overlays}
      {tooltip}

      {/* Close button (fixed top-right) */}
      <div ref={ignoreRef} style={{
        position: "fixed", top: 12, right: 12, zIndex: 10001,
        display: "flex", gap: "var(--sp-2)", alignItems: "center",
      }}>
        {copied ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: "var(--r-md)",
            background: "var(--color-success)", color: "#fff",
            fontSize: 12, fontWeight: 600,
          }}>
            <Check size={14} weight="bold" /> CSS copied
          </div>
        ) : null}
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: "var(--r-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          boxShadow: "var(--shadow-dropdown)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <X size={16} color="var(--text-primary)" />
        </button>
      </div>

      {/* Legend (fixed bottom-left) */}
      <div style={{
        position: "fixed", bottom: 12, left: 12, zIndex: 10001,
        display: "flex", gap: "var(--sp-3)", alignItems: "center",
        padding: "8px 14px", borderRadius: "var(--r-md)",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        boxShadow: "var(--shadow-dropdown)", fontSize: 11,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.padding.fill, border: "1px solid " + COLORS.padding.stroke }} />
          <span style={{ color: COLORS.padding.label, fontWeight: 600 }}>Padding</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.margin.fill, border: "1px dashed " + COLORS.margin.stroke }} />
          <span style={{ color: COLORS.margin.label, fontWeight: 600 }}>Margin</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.gap.fill, border: "1px solid " + COLORS.gap.stroke }} />
          <span style={{ color: COLORS.gap.label, fontWeight: 600 }}>Gap</span>
        </span>
        <span style={{ color: "var(--text-faint)" }}>Click to copy</span>
      </div>
    </>,
    document.body
  );
}
