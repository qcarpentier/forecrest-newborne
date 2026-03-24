import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowBendUpLeft } from "@phosphor-icons/react";
import { useT, useLang } from "../context";

var TOAST_DURATION = 10000;
var ANIM_IN_MS = 300;
var ANIM_OUT_MS = 200;

/**
 * Figma-style "back to previous page" toast.
 * Shows when navigating from one page to another via a link/button.
 * Displays a countdown bar and allows Ctrl+Z or click to go back.
 *
 * Props:
 * - fromTab: string — the tab the user came from
 * - onBack: () => void — callback to navigate back
 * - onDismiss: () => void — callback when toast is dismissed (timer or X)
 */
export default function NavigationToast({ fromTab, onBack, onDismiss }) {
  var t = useT();
  var { lang } = useLang();
  var tb = (t && t.tabs) || {};
  var ts = (t && t.toast) || {};
  var [visible, setVisible] = useState(true);
  var [exiting, setExiting] = useState(false);
  var [progress, setProgress] = useState(100);
  var startRef = useRef(Date.now());
  var rafRef = useRef(null);
  var timerRef = useRef(null);

  var fromLabel = tb[fromTab] || fromTab;
  var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  var shortcut = isMac ? "\u2318Z" : "Ctrl+Z";

  function dismiss() {
    if (exiting) return;
    setExiting(true);
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    setTimeout(function () {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, ANIM_OUT_MS);
  }

  function handleBack() {
    if (exiting) return;
    setExiting(true);
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    if (onBack) onBack();
    setTimeout(function () {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, ANIM_OUT_MS);
  }

  /* Progress bar animation */
  useEffect(function () {
    startRef.current = Date.now();
    function tick() {
      var elapsed = Date.now() - startRef.current;
      var pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(dismiss, TOAST_DURATION);
    return function () {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  /* Listen for Ctrl+Z / Cmd+Z */
  useEffect(function () {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleBack();
      }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [exiting]);

  if (!visible) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      onClick={handleBack}
      style={{
        position: "fixed",
        bottom: 130,
        left: "var(--fc-content-center, 50%)",
        transform: "translateX(-50%)",
        zIndex: 700,
        cursor: "pointer",
        animation: exiting
          ? "toastSlideDown " + ANIM_OUT_MS + "ms ease forwards"
          : "toastSlideUp " + ANIM_IN_MS + "ms cubic-bezier(0.16,1,0.3,1) forwards",
      }}
    >
      <style>{
        "@keyframes toastSlideUp{from{transform:translateX(-50%) translateY(24px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}" +
        "@keyframes toastSlideDown{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(24px);opacity:0}}"
      }</style>

      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-modal)",
        overflow: "hidden",
        minWidth: 280,
        maxWidth: "90vw",
      }}>
        {/* Content */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px 10px 14px",
        }}>
          <ArrowBendUpLeft size={16} weight="bold" color="var(--brand)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>
            <span style={{ fontWeight: 400 }}>
              {ts.back_to || (lang === "fr" ? "Revenir \u00e0" : "Back to")}
            </span>
            {" "}
            <span style={{ fontWeight: 600 }}>{fromLabel}</span>
            <span style={{ color: "var(--text-faint)", fontSize: 11, marginLeft: 6 }}>
              {ts.click_or || (lang === "fr" ? "Cliquez ou" : "Click or")} {shortcut}
            </span>
          </div>
          <button
            type="button"
            onClick={function (e) { e.stopPropagation(); dismiss(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, flexShrink: 0,
              border: "none", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer",
            }}
          >
            <X size={12} weight="bold" color="var(--text-faint)" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: progress + "%",
            background: "var(--brand)",
            borderRadius: "0 2px 2px 0",
            transition: "none",
          }} />
        </div>
      </div>
    </div>,
    document.body
  );
}
