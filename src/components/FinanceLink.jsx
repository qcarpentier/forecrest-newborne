import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { BookOpen, ArrowRight } from "@phosphor-icons/react";
import { useLang, useGlossary, useT } from "../context";

/**
 * FinanceLink — inline term link with glossary tooltip.
 *
 * Props:
 *   term    — glossary entry id (used as drawer anchor)
 *   label   — display text (the financial term shown inline)
 *   desc    — short definition shown in the tooltip body
 */
export default function FinanceLink({ term, label, desc }) {
  var { lang } = useLang();
  var glossary = useGlossary();
  var g = useT().glossary || {};
  var TOOLTIP_W = 280;
  var [show, setShow] = useState(false);
  var [pos, setPos] = useState({ top: 0, left: 0 });
  var ref = useRef(null);

  var showTooltip = useCallback(function () {
    if (!ref.current) return;
    var rect = ref.current.getBoundingClientRect();
    var top = rect.bottom;
    var left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    /* clamp inside viewport */
    if (left + TOOLTIP_W > window.innerWidth - 8) left = window.innerWidth - 8 - TOOLTIP_W;
    if (left < 8) left = 8;
    setPos({ top: top, left: left });
    setShow(true);
  }, []);

  var glossaryLabel = g.view_full || "View in glossary";
  var glossaryTitle = g.page_title || "Glossary";

  function handleClick() {
    setShow(false);
    if (glossary && glossary.open) {
      glossary.open(term);
    }
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        onMouseEnter={showTooltip}
        onMouseLeave={function () { setShow(false); }}
        onClick={handleClick}
        style={{
          display: "inline",
          padding: 0, margin: 0, border: "none", background: "none",
          color: "var(--brand)",
          fontWeight: 600,
          fontSize: "inherit",
          fontFamily: "inherit",
          lineHeight: "inherit",
          cursor: "pointer",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textDecorationThickness: "12%",
          textUnderlineOffset: "24%",
          textDecorationColor: "var(--brand)",
          transition: "color 0.12s",
        }}
      >
        {label}
      </button>

      {show ? createPortal(
        <div
          onMouseEnter={function () { setShow(true); }}
          onMouseLeave={function () { setShow(false); }}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 2000,
            width: TOOLTIP_W,
            paddingTop: 6,
          }}
        >
        <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
            animation: "tooltipIn 0.12s ease",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--bg-accordion)",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "var(--r-sm)",
              background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <BookOpen size={12} weight="bold" color="var(--brand)" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 }}>
                {glossaryTitle}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginTop: 1 }}>
                {label}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{
            padding: "10px 14px",
            fontSize: 12, lineHeight: 1.5,
            color: "var(--text-secondary)",
          }}>
            {desc}
          </div>

          {/* Footer */}
          <div
            onClick={handleClick}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px",
              borderTop: "1px solid var(--border-light)",
              background: "var(--bg-accordion)",
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)" }}>
              {glossaryLabel}
            </span>
            <ArrowRight size={12} weight="bold" color="var(--brand)" />
          </div>
        </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
