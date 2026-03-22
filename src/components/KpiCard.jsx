import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info, BookOpen, ArrowRight } from "@phosphor-icons/react";
import { Card } from "../components";
import { useGlossary } from "../context";
import { GLOSSARY_MAP } from "../constants";
import { useT } from "../context";

export default function KpiCard({ label, value, fullValue, sub, color, icon, spark, sparkColor, target, current, onClick, tip, glossaryKey }) {
  var progress = target && target > 0 && current != null ? Math.min(current / target, 1) : null;
  var hit = progress !== null && progress >= 1;
  var hasTooltip = fullValue && fullValue !== String(value) && !/^0[.,]?0*\s/.test(fullValue);
  var [hover, setHover] = useState(false);
  var [glossaryHover, setGlossaryHover] = useState(false);
  var [tipShow, setTipShow] = useState(false);
  var [tipPos, setTipPos] = useState({ top: 0, left: 0 });
  var glossary = useGlossary();
  var t = useT();
  var g = t.glossary || {};
  var hitRef = useRef(null);

  var glossaryEntry = glossaryKey ? GLOSSARY_MAP[glossaryKey] : null;
  var glossaryTitle = glossaryEntry ? (g[glossaryKey + "_title"] || glossaryKey) : null;
  var glossaryDef = glossaryEntry ? (g[glossaryKey + "_def"] || "") : null;

  var showGlossaryTip = useCallback(function () {
    if (!hitRef.current) return;
    var rect = hitRef.current.getBoundingClientRect();
    var tipW = 280;
    var left = rect.right - tipW;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    setTipPos({ top: rect.bottom, left: left });
    setTipShow(true);
    setGlossaryHover(true);
  }, []);

  var hideGlossaryTip = useCallback(function () {
    setTipShow(false);
    setGlossaryHover(false);
  }, []);

  function openGlossary(e) {
    if (e) e.stopPropagation();
    setTipShow(false);
    setGlossaryHover(false);
    glossary.open(glossaryKey);
  }

  return (
    <Card onClick={onClick} sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)", position: "relative", cursor: onClick ? "pointer" : undefined, borderLeft: hit ? "3px solid var(--color-success)" : progress !== null ? "3px solid var(--color-warning)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        {icon ? <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span> : null}
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, flex: 1 }}>{label}</span>
        {spark}
      </div>
      <div
        onMouseEnter={hasTooltip ? function () { setHover(true); } : undefined}
        onMouseLeave={hasTooltip ? function () { setHover(false); } : undefined}
        style={{ fontSize: 28, fontWeight: 700, color: color || "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em", position: "relative", cursor: hasTooltip ? "help" : undefined }}
      >
        {String(value)}
        {hasTooltip && hover ? (
          <span style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: 0,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", boxShadow: "var(--shadow-dropdown)",
            padding: "4px 10px", fontSize: 13, fontWeight: 600,
            color: "var(--text-primary)", whiteSpace: "nowrap", zIndex: 100,
            pointerEvents: "none",
          }}>
            {fullValue}
          </span>
        ) : null}
      </div>
      {progress !== null ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: progress * 100 + "%", background: hit ? "var(--color-success)" : "var(--color-warning)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: hit ? "var(--color-success)" : "var(--text-faint)", whiteSpace: "nowrap" }}>{Math.round(progress * 100)}%</span>
        </div>
      ) : null}
      {sub ? <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{sub}</div> : null}
      {tip ? <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{tip}</div> : null}

      {/* Glossary hitbox — top-right corner */}
      {glossaryKey && glossaryTitle ? (
        <div
          ref={hitRef}
          onMouseEnter={showGlossaryTip}
          onMouseLeave={hideGlossaryTip}
          onClick={openGlossary}
          style={{
            position: "absolute", top: 0, right: 0, zIndex: 2,
            width: 44, height: 44,
            display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
            padding: 10, cursor: "pointer",
            borderRadius: "0 var(--r-lg) 0 0",
          }}
        >
          <Info size={14} weight="regular" color={glossaryHover ? "var(--brand)" : "var(--text-faint)"} style={{ transition: "color 0.12s" }} />
        </div>
      ) : null}

      {/* Glossary tooltip — same style as FinanceLink */}
      {tipShow && glossaryTitle ? createPortal(
        <div
          onMouseEnter={function () { setTipShow(true); setGlossaryHover(true); }}
          onMouseLeave={hideGlossaryTip}
          style={{
            position: "fixed", top: tipPos.top, left: tipPos.left,
            zIndex: 2000, width: 280, paddingTop: 6,
          }}
        >
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden", animation: "tooltipIn 0.12s ease",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderBottom: "1px solid var(--border-light)",
              background: "var(--bg-accordion)",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "var(--r-sm)",
                background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <BookOpen size={12} weight="bold" color="var(--brand)" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 }}>
                  {g.page_title || "Glossaire"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginTop: 1 }}>
                  {glossaryTitle}
                </div>
              </div>
            </div>
            {/* Body */}
            {glossaryDef ? (
              <div style={{ padding: "10px 14px", fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                {glossaryDef}
              </div>
            ) : null}
            {/* Footer */}
            <div
              onClick={openGlossary}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 14px", borderTop: "1px solid var(--border-light)",
                background: "var(--bg-accordion)", cursor: "pointer", transition: "background 0.12s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)" }}>
                {g.view_full || "Voir en pleine page"}
              </span>
              <ArrowRight size={12} weight="bold" color="var(--brand)" />
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </Card>
  );
}
