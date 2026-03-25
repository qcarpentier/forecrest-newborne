import { eur } from "../utils";

/**
 * PnlCascade — Visual "waterfall" flow showing Revenue → Costs → Net Result.
 * Beginner-friendly: no financial jargon, horizontal blocks.
 *
 * Props:
 *   steps   — Array of { label, value, type } where type is "start", "deduction" or "result"
 *   t       — Translation object
 */
export default function PnlCascade({ steps }) {
  if (!steps || steps.length === 0) return null;

  var maxVal = 0;
  steps.forEach(function (s) { if (Math.abs(s.value) > maxVal) maxVal = Math.abs(s.value); });
  if (maxVal === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map(function (step, i) {
        var pct = maxVal > 0 ? Math.abs(step.value) / maxVal * 100 : 0;
        var isResult = step.type === "result";
        var isDeduction = step.type === "deduction";
        var barColor = isResult
          ? (step.value >= 0 ? "var(--color-success)" : "var(--color-error)")
          : (isDeduction ? "var(--text-muted)" : "var(--brand)");
        var barOpacity = isDeduction ? 0.3 : 1;

        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
              <span style={{
                fontSize: isResult ? 13 : 12,
                fontWeight: isResult ? 700 : 400,
                color: isResult ? "var(--text-primary)" : "var(--text-secondary)",
              }}>
                {isDeduction ? "− " : ""}{step.label}
              </span>
              <span style={{
                fontSize: isResult ? 14 : 12,
                fontWeight: isResult ? 700 : 500,
                fontVariantNumeric: "tabular-nums",
                fontFamily: isResult ? "'Bricolage Grotesque', sans-serif" : "inherit",
                color: isResult
                  ? (step.value >= 0 ? "var(--color-success)" : "var(--color-error)")
                  : "var(--text-primary)",
              }}>
                {eur(step.value)}
              </span>
            </div>
            <div style={{ height: isResult ? 8 : 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: Math.max(pct, 2) + "%",
                background: barColor,
                opacity: barOpacity,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
