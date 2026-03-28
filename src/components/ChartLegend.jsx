import { useState } from "react";
import { Badge, Button } from "../components";
import { useT } from "../context";

var MAX_VISIBLE = 5;

/**
 * Chart legend with blur + expand for long lists.
 * Shows max 5 items, then gradient blur + "Voir tout" button.
 *
 * Props:
 * - children: the chart element (donut SVG) rendered on the left
 * - palette: string[] hex colors
 * - distribution: { [key]: number } — values per category
 * - meta: { [key]: { label, badge } } — category metadata
 * - total: number — total for percentage calculation
 * - lk: "fr" | "en"
 */
export default function ChartLegend({ children, palette, distribution, meta, total, lk }) {
  var t = useT();
  var keys = Object.keys(distribution || {});
  var needsCollapse = keys.length > MAX_VISIBLE;
  var [expanded, setExpanded] = useState(false);
  var visibleKeys = expanded || !needsCollapse ? keys : keys.slice(0, MAX_VISIBLE);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
      {children}
      <div style={{ flex: 1, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {keys.length > 0 ? visibleKeys.map(function (key, ci) {
            var m = (meta || {})[key];
            if (!m) return null;
            var keyIdx = keys.indexOf(key);
            var pctV = total > 0 ? Math.round((distribution[key] || 0) / total * 100) : 0;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: (palette || [])[keyIdx % (palette || []).length] || "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ color: "var(--text-secondary)", flex: 1 }}>{m.label[lk]}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pctV}%</span>
              </div>
            );
          }) : [0, 1, 2].map(function (i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-hover)", flexShrink: 0 }} />
                <span style={{ height: 10, borderRadius: 4, background: "var(--bg-hover)", flex: 1 }} />
                <span style={{ width: 24, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} />
              </div>
            );
          })}
        </div>

        {/* Blur gradient when collapsed */}
        {needsCollapse && !expanded ? (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 28,
            background: "linear-gradient(transparent, var(--bg-card))",
            pointerEvents: "none",
          }} />
        ) : null}

        {/* Expand/collapse */}
        {needsCollapse ? (
          <button type="button" onClick={function () { setExpanded(function (v) { return !v; }); }}
            style={{
              display: "block", width: "100%", marginTop: 6,
              border: "none", background: "none",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
              color: "var(--brand)", cursor: "pointer",
              padding: "2px 0", textAlign: "left",
              position: "relative", zIndex: 2,
            }}
          >
            {expanded
              ? (t.legend_collapse || "Réduire")
              : "+" + String(keys.length - MAX_VISIBLE) + " " + (t.legend_expand || "de plus")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
