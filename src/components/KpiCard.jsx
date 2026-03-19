import { useState } from "react";
import { Card } from "../components";

export default function KpiCard({ label, value, fullValue, sub, color, icon, spark, sparkColor, target, current, onClick, tip }) {
  var progress = target && target > 0 && current != null ? Math.min(current / target, 1) : null;
  var hit = progress !== null && progress >= 1;
  var hasTooltip = fullValue && fullValue !== String(value) && !/^0[.,]?0*\s/.test(fullValue);
  var [hover, setHover] = useState(false);

  return (
    <Card onClick={onClick} sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)", position: "relative", cursor: onClick ? "pointer" : undefined, borderLeft: hit ? "3px solid var(--color-success)" : progress !== null ? "3px solid var(--color-warning)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        {icon ? <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span> : null}
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, flex: 1 }}>{String(label)}</span>
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
    </Card>
  );
}
