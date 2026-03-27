/**
 * StackedBar — Reusable horizontal stacked bar chart with hover tooltip.
 *
 * Props:
 *   data      : { [key]: number }        — values by segment key
 *   labels    : { [key]: string }         — display label per key
 *   palette   : string[]                  — color array
 *   height    : number (default 36)
 *   formatter : function(value) → string  — format values (default: String)
 */
import { useState } from "react";

export default function StackedBar({ data, labels, palette, height, formatter }) {
  var [hovered, setHovered] = useState(null);
  var h = height || 36;
  var fmt = formatter || function (v) { return String(v); };
  var pal = palette || [];

  var keys = Object.keys(data || {}).filter(function (k) { return (data[k] || 0) > 0; });
  var total = keys.reduce(function (s, k) { return s + (data[k] || 0); }, 0);

  if (total <= 0 || keys.length === 0) return null;

  /* Compute cumulative left % for tooltip positioning */
  var cumLeft = {};
  var acc = 0;
  keys.forEach(function (k) {
    var pct = (data[k] / total) * 100;
    cumLeft[k] = acc + pct / 2;
    acc += pct;
  });

  return (
    <div onMouseLeave={function () { setHovered(null); }}>
      {/* Bar */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", height: h, borderRadius: "var(--r-md)", overflow: "hidden" }}>
          {keys.map(function (k, i) {
            var val = data[k];
            var w = (val / total) * 100;
            if (w < 1) return null;
            var isHov = hovered === k;
            var isDim = hovered !== null && !isHov;
            return (
              <div
                key={k}
                onMouseEnter={function () { setHovered(k); }}
                style={{
                  width: w + "%",
                  background: pal[i % pal.length],
                  transition: "opacity 0.15s ease",
                  opacity: isDim ? 0.35 : 1,
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>

        {/* Tooltip — clamped to avoid overflow */}
        {hovered && cumLeft[hovered] != null ? (function () {
          var val = data[hovered];
          var pct = (val / total) * 100;
          var idx = keys.indexOf(hovered);
          var leftPct = cumLeft[hovered];
          /* Clamp: near left edge → align left, near right edge → align right, else center */
          var tx = leftPct < 15 ? "0%" : leftPct > 85 ? "-100%" : "-50%";
          return (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)",
              left: leftPct + "%", transform: "translateX(" + tx + ")",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--r-md)", padding: "6px 10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
              whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10, fontSize: 12,
              animation: "tooltipInBottom 0.1s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: pal[idx % pal.length], flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{(labels || {})[hovered] || hovered}</span>
              </div>
              <div style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)", marginTop: 2 }}>
                {fmt(val)} <span style={{ color: "var(--text-faint)" }}>({pct.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })() : null}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
        {keys.map(function (k, i) {
          var val = data[k];
          var pct = (val / total) * 100;
          var isHov = hovered === k;
          var isDim = hovered !== null && !isHov;
          return (
            <div
              key={k}
              onMouseEnter={function () { setHovered(k); }}
              onMouseLeave={function () { setHovered(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                cursor: "pointer", opacity: isDim ? 0.4 : 1, transition: "opacity 0.15s ease",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 2, background: pal[i % pal.length], flexShrink: 0 }} />
              <span style={{ color: "var(--text-secondary)" }}>{(labels || {})[k] || k}</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{fmt(val)} ({pct.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
