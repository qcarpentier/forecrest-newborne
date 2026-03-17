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
          padding: "var(--sp-3) var(--card-px)",
          background: "var(--bg-accordion)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div>
          <div style={{ fontSize: "calc(16px * var(--font-scale, 1))", fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.3px" }}>{String(title)}</div>
          {sub ? (
            <div style={{ fontSize: 12, color: gg[500], marginTop: 2 }}>{String(sub)}</div>
          ) : null}
        </div>
        {expanded
          ? <CaretDown size={15} weight="bold" color={gg[400]} />
          : <CaretRight size={15} weight="bold" color={gg[400]} />
        }
      </div>
      {expanded ? (
        <div style={{ padding: "var(--sp-3) var(--card-px)", background: "var(--bg-card)" }}>{children}</div>
      ) : null}
    </div>
  );
}
