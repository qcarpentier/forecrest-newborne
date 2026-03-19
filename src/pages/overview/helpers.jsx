import { CaretDown, Hourglass } from "@phosphor-icons/react";
import { brand } from "../../constants/colors";

/* ─── SectionHeader ─── */

export function SectionHeader({ icon, title, sub, collapsed, onToggle }) {
  return (
    <div
      style={{ marginBottom: collapsed ? "var(--sp-2)" : "var(--sp-4)", cursor: onToggle ? "pointer" : undefined, userSelect: "none" }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: sub && !collapsed ? "var(--sp-1)" : 0 }}>
        {icon ? <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span> : null}
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", flex: 1 }}>{String(title)}</h2>
        {onToggle ? (
          <CaretDown size={14} weight="bold" color="var(--text-faint)"
            style={{ transition: "transform 200ms", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", flexShrink: 0 }} />
        ) : null}
      </div>
      {sub && !collapsed ? <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{sub}</p> : null}
    </div>
  );
}

/* ─── ProgressBar ─── */

export function ProgressBar({ value, color, height }) {
  var clamped = Math.max(0, Math.min(value, 1));
  return (
    <div style={{ height: height || 6, background: "var(--border)", borderRadius: height || 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: clamped * 100 + "%", background: color || brand, borderRadius: height || 6, transition: "width 0.4s ease" }} />
    </div>
  );
}

/* ─── StatusBadge ─── */

export function StatusBadge({ label, positive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 600,
      background: positive ? "var(--color-success-bg)" : "var(--color-error-bg)",
      color: positive ? "var(--color-success)" : "var(--color-error)",
      border: "1px solid " + (positive ? "var(--color-success-border)" : "var(--color-error-border)"),
    }}>
      {String(label)}
    </span>
  );
}

/* ─── DelayPills (BFR simulation) ─── */

export function DelayPills({ value, onChange, options, label, unit }) {
  return (
    <div style={{ marginBottom: "var(--sp-3)" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(function (d) {
          var active = d === value;
          return (
            <button key={d} onClick={function () { onChange(d); }} style={{
              height: 36, minWidth: 44, padding: "0 14px", borderRadius: "var(--r-full)",
              border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
              background: active ? "var(--brand)" : "transparent",
              color: active ? "#fff" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 150ms",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              {d + " " + (unit || "j")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CashCycleViz ─── */

export function CashCycleViz({ clientDelay, supplierDelay, clientLabel, supplierLabel, t }) {
  var maxDay = Math.max(clientDelay, supplierDelay, 1);
  var clientPct = (clientDelay / maxDay) * 100;
  var supplierPct = (supplierDelay / maxDay) * 100;
  var gap = clientDelay - supplierDelay;
  var unit = t.bfr_day_unit || "j";

  return (
    <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", marginBottom: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
        <Hourglass size={14} weight="duotone" color="var(--text-muted)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{t.bfr_cash_cycle || "Cycle de trésorerie"}</span>
      </div>
      <div style={{ marginBottom: "var(--sp-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{clientLabel}</span>
          <div style={{ flex: 1, height: 14, background: "var(--border)", borderRadius: 7, overflow: "hidden", position: "relative" }}>
            <div style={{ height: "100%", width: Math.max(clientPct, 2) + "%", background: clientDelay > supplierDelay ? "var(--color-warning)" : "var(--color-success)", borderRadius: 7, transition: "width 300ms ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", width: 40, textAlign: "right" }}>{clientDelay + " " + unit}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{supplierLabel}</span>
          <div style={{ flex: 1, height: 14, background: "var(--border)", borderRadius: 7, overflow: "hidden", position: "relative" }}>
            <div style={{ height: "100%", width: Math.max(supplierPct, 2) + "%", background: supplierDelay >= clientDelay ? "var(--color-warning)" : "var(--color-success)", borderRadius: 7, transition: "width 300ms ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", width: 40, textAlign: "right" }}>{supplierDelay + " " + unit}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.bfr_gap_label || "Décalage"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: gap <= 0 ? "var(--color-success)" : gap <= 30 ? "var(--color-warning)" : "var(--color-error)" }}>
          {gap <= 0 ? gap + " " + unit : "+" + gap + " " + unit}
        </span>
      </div>
    </div>
  );
}

/* ─── HealthDonut ─── */

export function HealthDonut({ score, items }) {
  var r = 32;
  var circ = 2 * Math.PI * r;
  var pctV = Math.max(0, Math.min(score, 100)) / 100;
  var color = score >= 75 ? "var(--color-success)" : score >= 50 ? "var(--color-warning)" : "var(--color-error)";

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "var(--sp-3)" }}>
        <svg width={80} height={80} viewBox="0 0 80 80">
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth={7} />
          <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={pctV * circ + " " + circ}
            strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
          <text x={40} y={40} textAnchor="middle" dominantBaseline="central"
            fontSize={22} fontWeight={700} fill={color}
            fontFamily="'Bricolage Grotesque','DM Sans',sans-serif">{score}</text>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(function (item) {
          var c = item.value >= 75 ? "var(--color-success)" : item.value >= 50 ? "var(--color-warning)" : "var(--color-error)";
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", width: 72, flexShrink: 0 }}>{item.label}</span>
              <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: item.value + "%", background: c, borderRadius: 3, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", width: 24, textAlign: "right" }}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
