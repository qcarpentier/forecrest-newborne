/**
 * MobileActions — Groups action buttons into a bottom sheet on mobile.
 *
 * On desktop: renders children inline (transparent wrapper).
 * On mobile: renders a "..." trigger button that opens a bottom sheet
 * with swipe-down-to-close and each action as a full-width row.
 *
 * Props:
 *   actions: [{ icon, label, onClick, variant }]   — action definitions
 *   children: JSX (rendered on desktop, hidden on mobile)
 */
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { DotsThree } from "@phosphor-icons/react";
import useBreakpoint from "../hooks/useBreakpoint";

var ANIM_MS = 200;

export default function MobileActions({ actions, children }) {
  var { isMobile } = useBreakpoint();
  var [open, setOpen] = useState(false);
  var [closing, setClosing] = useState(false);
  var startY = useRef(null);

  var handleClose = useCallback(function () {
    setClosing(true);
    setTimeout(function () { setOpen(false); setClosing(false); }, ANIM_MS);
  }, []);

  function handleTouchStart(e) {
    startY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (startY.current !== null) {
      var delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 60) handleClose();
      startY.current = null;
    }
  }

  /* Desktop: render children inline */
  if (!isMobile) return children;

  /* Mobile: trigger button + bottom sheet */
  return (
    <>
      <button
        type="button"
        onClick={function () { setOpen(true); }}
        style={{
          width: 32, height: 32, borderRadius: "var(--r-md)",
          border: "1px solid var(--border)", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, flexShrink: 0,
        }}
      >
        <DotsThree size={18} weight="bold" color="var(--text-muted)" />
      </button>

      {open ? createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: "rgba(0,0,0,0.3)",
              opacity: closing ? 0 : 1,
              transition: "opacity " + ANIM_MS + "ms ease",
            }}
          />

          {/* Bottom sheet */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              zIndex: 1000,
              background: "var(--bg-card)",
              borderTopLeftRadius: "var(--r-xl)",
              borderTopRightRadius: "var(--r-xl)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
              transform: closing ? "translateY(100%)" : "translateY(0)",
              animation: closing ? "none" : "fc-sheet-up " + ANIM_MS + "ms ease forwards",
              transition: closing ? "transform " + ANIM_MS + "ms ease" : "none",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--sp-2) 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)" }} />
            </div>

            {/* Action rows */}
            <div style={{ padding: "0 var(--sp-3) var(--sp-3)" }}>
              {(actions || []).map(function (action, i) {
                var Icon = action.icon;
                var isDanger = action.variant === "danger";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={function () { handleClose(); if (action.onClick) action.onClick(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--sp-3)",
                      width: "100%", padding: "var(--sp-3) var(--sp-3)",
                      border: "none", borderRadius: "var(--r-md)",
                      background: "transparent", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 14,
                      color: isDanger ? "var(--color-error)" : "var(--text-primary)",
                      transition: "background 0.1s",
                    }}
                    onTouchStart={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
                    onTouchEnd={function (e) { e.currentTarget.style.background = "transparent"; }}
                  >
                    {Icon ? <Icon size={20} weight="duotone" color={isDanger ? "var(--color-error)" : "var(--text-muted)"} /> : null}
                    <span style={{ fontWeight: 500 }}>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      ) : null}
    </>
  );
}
