import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "@phosphor-icons/react";

function renderTip(tip) {
  if (typeof tip !== "string") return tip;
  var parts = tip.split("`");
  var out = [];
  parts.forEach(function (p, i) {
    if (i % 2 === 1) {
      out.push(
        <code
          key={i}
          style={{
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            fontSize: 11,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 4,
            padding: "1px 5px",
            display: "block",
            marginTop: 4,
            lineHeight: 1.6,
            letterSpacing: 0,
          }}
        >
          {p}
        </code>
      );
    } else {
      p.split("\n").forEach(function (line, j) {
        if (j > 0) out.push(<br key={i + "-" + j} />);
        if (line) out.push(line);
      });
    }
  });
  return out;
}

export default function Tooltip({ tip, children, width }) {
  var w = width || 280;
  var [show, setShow] = useState(false);
  var [pos, setPos] = useState({ top: 0, left: 0 });
  var ref = useRef(null);

  var onEnter = useCallback(function () {
    if (!ref.current) return;
    var rect = ref.current.getBoundingClientRect();
    var mid = rect.left + rect.width / 2;
    var tipLeft = mid - w / 2;
    var tipTop = rect.top - 7;

    // Clamp horizontally
    if (tipLeft < 8) tipLeft = 8;
    if (tipLeft + w > window.innerWidth - 8) tipLeft = window.innerWidth - w - 8;

    setPos({ top: tipTop, left: tipLeft });
    setShow(true);
  }, [w]);

  var bubble = show ? createPortal(
    <span
      style={{
        position: "fixed",
        bottom: window.innerHeight - pos.top,
        left: pos.left,
        background: "var(--tooltip-bg)",
        color: "var(--tooltip-text)",
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.55,
        padding: "8px 12px",
        borderRadius: "var(--r-md)",
        width: w,
        maxWidth: "90vw",
        zIndex: 10000,
        pointerEvents: "none",
        boxShadow: "var(--shadow-dropdown)",
        whiteSpace: "normal",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        animation: "tooltipIn 0.14s ease",
      }}
    >
      {renderTip(tip)}
    </span>,
    document.body
  ) : null;

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={onEnter}
      onMouseLeave={function () { setShow(false); }}
    >
      {children}
      {bubble}
    </span>
  );
}

export function InfoTip({ tip, width }) {
  return (
    <Tooltip tip={tip} width={width}>
      <Info
        size={12}
        color="var(--text-faint)"
        style={{ cursor: "help", marginLeft: 4, flexShrink: 0 }}
      />
    </Tooltip>
  );
}
