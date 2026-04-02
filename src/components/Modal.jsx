import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { XClose } from "@untitledui/icons";

var SIZE_MAP = {
  sm: 400,
  md: 480,
  lg: 640,
};

var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open, onClose, size, height, children, title, subtitle, icon, hideClose,
}) {
  var prevState = useRef({});
  var cardRef = useRef(null);

  useEffect(function () {
    if (open) {
      var scrollY = window.scrollY;
      prevState.current = {
        scrollY: scrollY,
        htmlOverflow: document.documentElement.style.overflow,
        bodyPosition: document.body.style.position,
        bodyTop: document.body.style.top,
        bodyWidth: document.body.style.width,
      };
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "-" + scrollY + "px";
      document.body.style.width = "100%";
    }
    return function () {
      var s = prevState.current;
      if (s.scrollY == null) return;
      document.documentElement.style.overflow = s.htmlOverflow || "";
      document.body.style.position = s.bodyPosition || "";
      document.body.style.top = s.bodyTop || "";
      document.body.style.width = s.bodyWidth || "";
      window.scrollTo(0, s.scrollY);
      prevState.current = {};
    };
  }, [open]);

  var handleKeyDown = useCallback(function (e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !cardRef.current) return;
    var focusable = cardRef.current.querySelectorAll(FOCUSABLE);
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  /* Keydown listener — re-registers when handler changes */
  useEffect(function () {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return function () { window.removeEventListener("keydown", handleKeyDown); };
  }, [open, handleKeyDown]);

  /* Auto-focus first element — only on open, not on every re-render */
  useEffect(function () {
    if (!open) return;
    if (cardRef.current) {
      var first = cardRef.current.querySelector(FOCUSABLE);
      if (first) first.focus();
    }
  }, [open]);

  if (!open) return null;

  var width = SIZE_MAP[size] || SIZE_MAP.md;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "var(--overlay-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--sp-4)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={function (e) { e.stopPropagation(); }}
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-modal)",
          width: width, maxWidth: "95vw",
          height: height || undefined,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "tooltipIn 0.12s ease",
        }}
      >
        {/* Header — only if title provided */}
        {title ? (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "var(--sp-3)",
            padding: "var(--sp-5) var(--sp-5) var(--sp-4)",
            flexShrink: 0,
            borderBottom: "1px solid var(--border-light)",
            background: "var(--bg-card)",
          }}>
            {icon ? (
              <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 16, fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
                lineHeight: 1.3,
              }}>
                {title}
              </div>
              {subtitle ? (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            {!hideClose ? (
              <button
                onClick={onClose}
                type="button"
                style={{
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                  background: "var(--bg-elevated)", cursor: "pointer", flexShrink: 0,
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <XClose style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
              </button>
            ) : null}
          </div>
        ) : null}

        {children}
      </div>
    </div>,
    document.body
  );
}

/* Sub-components for consistent modal anatomy */

export function ModalBody({ children, noPadding }) {
  return (
    <div
      className="custom-scroll"
      style={{
        flex: 1, overflowY: "auto",
        padding: noPadding ? 0 : "var(--sp-5)",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--border-strong) transparent",
      }}
    >
      {children}
    </div>
  );
}

export function ModalFooter({ children, compact }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: "var(--sp-2)",
      paddingTop: compact ? 16 : 20, paddingBottom: compact ? 16 : 20,
      paddingLeft: 20, paddingRight: 20,
      borderTop: "1px solid var(--border-light)",
      flexShrink: 0,
      background: "var(--bg-card)",
    }}>
      {children}
    </div>
  );
}

export function ModalDivider() {
  return <div style={{ height: 1, background: "var(--border-light)", margin: "0" }} />;
}

/* Custom checkbox — slightly rounded */
export function Checkbox({ checked, onChange, label }) {
  function handleClick() { onChange(!checked); }

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleClick(); } }}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
        cursor: "pointer", userSelect: "none",
      }}
    >
      <span style={{
        width: 18, height: 18,
        borderRadius: "var(--r-sm)",
        border: checked ? "1.5px solid var(--brand)" : "1.5px solid var(--border-strong)",
        background: checked ? "var(--brand)" : "var(--bg-card)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
        flexShrink: 0,
        boxShadow: checked ? "var(--shadow-xs)" : "none",
      }}>
        {checked ? (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1.5 4.5L4 7L9.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label ? (
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      ) : null}
    </div>
  );
}
