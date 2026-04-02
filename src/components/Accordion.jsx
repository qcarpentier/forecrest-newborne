import { useState, useRef, useEffect } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { gg } from "../constants/colors";

export default function Accordion({ title, sub, open, forceOpen, children }) {
  var [expanded, setExpanded] = useState(!!open);
  var lastRev = useRef(-1);

  useEffect(function () {
    if (!forceOpen) return;
    if (forceOpen.rev !== lastRev.current) {
      lastRev.current = forceOpen.rev;
      setExpanded(forceOpen.state);
    }
  }, [forceOpen]);

  return (
    <div
      data-animate="accordion"
      style={{
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
        marginBottom: "var(--sp-3)",
        overflow: "hidden",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={function () { setExpanded(!expanded); }}
        onKeyDown={function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); }
        }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--sp-4) var(--card-px)",
          background: expanded ? "var(--bg-card)" : "var(--bg-accordion)",
          borderBottom: expanded ? "1px solid var(--border-light)" : "1px solid transparent",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <div>
          <div style={{ fontSize: "calc(15px * var(--font-scale, 1))", fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>{String(title)}</div>
          {sub ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>{String(sub)}</div>
          ) : null}
        </div>
        {expanded
          ? <CaretDown size={15} weight="bold" color={gg[400]} />
          : <CaretRight size={15} weight="bold" color={gg[400]} />
        }
      </div>
      {expanded ? (
        <div style={{ padding: "var(--sp-4) var(--card-px)", background: "var(--bg-card)" }}>{children}</div>
      ) : null}
    </div>
  );
}
