import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDevMode } from "../context";

/**
 * DevVal — Developer mode value display.
 *
 * Usage:
 *   <DevVal v={eur(6.3)} f="30,00 € × 21% = 6,30 €" />
 *   <DevVal v={eur(totalRevenue)} f={eur(arrV) + " + " + eur(extraStreamsMRR * 12)} />
 *
 * Props:
 *   v  — displayed value (string or node)
 *   f  — formula string shown on hover in devMode
 */
export default function DevVal({ v, f }) {
  var ctx = useDevMode();
  var devMode = ctx && ctx.devMode;
  var [tipState, setTipState] = useState(null);
  var ref = useRef(null);

  var onEnter = useCallback(function () {
    if (!ref.current) return;
    var rect = ref.current.getBoundingClientRect();
    setTipState({ top: rect.top - 6, left: rect.left + rect.width / 2 });
  }, []);

  if (!devMode || !f) return v;

  var bubble = tipState ? createPortal(
    <span style={{
      position: "fixed",
      bottom: window.innerHeight - tipState.top,
      left: tipState.left,
      transform: "translateX(-50%)",
      padding: "6px 10px", borderRadius: "var(--r-md)",
      background: "var(--color-dev-bg)", color: "var(--color-dev)",
      border: "1px solid var(--color-dev-border)",
      fontSize: 11, fontWeight: 500, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      whiteSpace: "nowrap", zIndex: 10000, pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      lineHeight: 1.4,
    }}>
      {f}
    </span>,
    document.body
  ) : null;

  return (
    <span
      ref={ref}
      onMouseEnter={onEnter}
      onMouseLeave={function () { setTipState(null); }}
      style={{ cursor: "help" }}
    >
      {v}
      {bubble}
    </span>
  );
}
