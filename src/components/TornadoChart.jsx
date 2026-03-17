import { useMemo, useState } from "react";
import { Card } from "../components";
import { eur } from "../utils";
import { vol, bkg, connectAnnual } from "../utils/calculations";
import { Info, CaretDown } from "@phosphor-icons/react";

var VARIATION = 0.20;

function computeARR(profs, cfgVariant) {
  var arrV = 0;
  profs.forEach(function (p) {
    var v = vol(p);
    var b = bkg(p.basket, cfgVariant);
    var conn = connectAnnual(p.basket, v, cfgVariant);
    var ny = b.netHT * v.medY - conn.total;
    arrV += p.signed * ny;
  });
  return arrV;
}

// Scale a specific rate field on all payment methods by a factor
function scaleMethodRate(cfg, field, factor) {
  var methods = cfg.paymentMethods;
  if (!methods || !methods.length) return cfg;
  return {
    ...cfg,
    paymentMethods: methods.map(function (m) {
      var copy = { ...m };
      if (copy[field] != null) copy[field] = copy[field] * factor;
      return copy;
    }),
  };
}

// Legacy params (used when no per-method fees)
var LEGACY_PARAMS = [
  { key: "varFee", label: "sensitivity_varfee", pct: true },
  { key: "fixFee", label: "sensitivity_fixfee" },
  { key: "sVar", label: "sensitivity_svar", pct: true },
  { key: "sFix", label: "sensitivity_sfix" },
];

// Simple config-level params (always applicable)
var SIMPLE_PARAMS = [
  { key: "vat", label: "sensitivity_vat", pct: true },
];

var SALES_PARAMS = [
  { key: "basket", label: "sensitivity_basket" },
  { key: "occ", label: "sensitivity_occ", pct: true },
];

export default function TornadoChart({ profs, cfg, baseARR, monthlyCosts, t }) {
  var [helpOpen, setHelpOpen] = useState(false);
  var data = useMemo(function () {
    var results = [];
    var hasPerMethod = cfg.paymentMethods && cfg.paymentMethods.length > 0 && cfg.paymentMethods[0].guVar !== undefined;

    if (hasPerMethod) {
      // Per-method fee sensitivity: vary all guVar rates together
      var lowGU = scaleMethodRate(cfg, "guVar", 1 - VARIATION);
      var highGU = scaleMethodRate(cfg, "guVar", 1 + VARIATION);
      var arrLowGU = computeARR(profs, lowGU);
      var arrHighGU = computeARR(profs, highGU);
      var avgGuVar = cfg.paymentMethods.reduce(function (s, m) { return s + m.mix * (m.guVar || 0); }, 0);
      results.push({
        label: t.sensitivity_varfee || "GU commission",
        low: arrLowGU - baseARR,
        high: arrHighGU - baseARR,
        baseVal: (avgGuVar * 100).toFixed(1) + "%",
      });

      // Per-method Stripe sensitivity: vary all sVar rates together
      var lowSV = scaleMethodRate(cfg, "sVar", 1 - VARIATION);
      var highSV = scaleMethodRate(cfg, "sVar", 1 + VARIATION);
      var arrLowSV = computeARR(profs, lowSV);
      var arrHighSV = computeARR(profs, highSV);
      var avgSVar = cfg.paymentMethods.reduce(function (s, m) { return s + m.mix * (m.sVar || 0); }, 0);
      results.push({
        label: t.sensitivity_svar || "Stripe variable",
        low: arrLowSV - baseARR,
        high: arrHighSV - baseARR,
        baseVal: (avgSVar * 100).toFixed(1) + "%",
      });
    } else {
      // Legacy config-level parameters
      LEGACY_PARAMS.forEach(function (param) {
        var base = cfg[param.key];
        if (base == null || base === 0) return;
        var low = { ...cfg, [param.key]: base * (1 - VARIATION) };
        var high = { ...cfg, [param.key]: base * (1 + VARIATION) };
        var arrLow = computeARR(profs, low);
        var arrHigh = computeARR(profs, high);
        results.push({
          label: t[param.label] || param.key,
          low: arrLow - baseARR,
          high: arrHigh - baseARR,
          baseVal: param.pct ? (base * 100).toFixed(1) + "%" : base.toFixed(2),
        });
      });
    }

    // Simple params (vat, etc.)
    SIMPLE_PARAMS.forEach(function (param) {
      var base = cfg[param.key];
      if (base == null || base === 0) return;
      var low = { ...cfg, [param.key]: base * (1 - VARIATION) };
      var high = { ...cfg, [param.key]: base * (1 + VARIATION) };
      var arrLow = computeARR(profs, low);
      var arrHigh = computeARR(profs, high);
      results.push({
        label: t[param.label] || param.key,
        low: arrLow - baseARR,
        high: arrHigh - baseARR,
        baseVal: param.pct ? (base * 100).toFixed(1) + "%" : base.toFixed(2),
      });
    });

    // Sales-level parameters (applied to all profs)
    SALES_PARAMS.forEach(function (param) {
      var any = profs.find(function (p) { return p.signed > 0; });
      if (!any) return;
      var profsLow = profs.map(function (p) {
        return { ...p, [param.key]: (p[param.key] || any[param.key]) * (1 - VARIATION) };
      });
      var profsHigh = profs.map(function (p) {
        return { ...p, [param.key]: (p[param.key] || any[param.key]) * (1 + VARIATION) };
      });
      var arrLow = computeARR(profsLow, cfg);
      var arrHigh = computeARR(profsHigh, cfg);
      var baseVal = any[param.key];
      results.push({
        label: t[param.label] || param.key,
        low: arrLow - baseARR,
        high: arrHigh - baseARR,
        baseVal: param.pct ? (baseVal * 100).toFixed(0) + "%" : String(baseVal),
      });
    });

    // Monthly costs sensitivity
    var costBase = monthlyCosts * 12;
    if (costBase > 0) {
      results.push({
        label: t.sensitivity_costs || "OpEx",
        low: costBase * VARIATION,
        high: -costBase * VARIATION,
        baseVal: eur(monthlyCosts),
        isEbitda: true,
      });
    }

    // Sort by total impact (descending)
    results.sort(function (a, b) {
      return Math.max(Math.abs(b.low), Math.abs(b.high)) - Math.max(Math.abs(a.low), Math.abs(a.high));
    });

    return results;
  }, [profs, cfg, baseARR, monthlyCosts, t]);

  if (data.length === 0) return null;

  var maxAbsImpact = 1;
  data.forEach(function (d) {
    var m = Math.max(Math.abs(d.low), Math.abs(d.high));
    if (m > maxAbsImpact) maxAbsImpact = m;
  });

  return (
    <Card sx={{ marginTop: "var(--gap-lg)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>{t.sensitivity_title}</h3>
      <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-3)" }}>{t.sensitivity_sub}</p>

      <button
        onClick={function () { setHelpOpen(function (v) { return !v; }); }}
        style={{
          display: "flex", alignItems: "center", gap: "var(--sp-2)",
          border: "none", background: "transparent", cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: "var(--color-info)",
          padding: 0, marginBottom: "var(--sp-4)",
        }}
      >
        <Info size={14} color="var(--color-info)" />
        {t.sensitivity_help_title}
        <CaretDown size={10} color="var(--color-info)" style={{ transition: "transform 150ms", transform: helpOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {helpOpen ? (
        <div style={{
          fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
          padding: "var(--sp-3)", background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-border)", borderRadius: "var(--r-md)",
          marginBottom: "var(--sp-4)",
        }}>
          {t.sensitivity_help}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {data.map(function (d, idx) {
          var negImpact = Math.min(d.low, d.high);
          var posImpact = Math.max(d.low, d.high);
          var negW = Math.abs(negImpact) / maxAbsImpact * 100;
          var posW = Math.abs(posImpact) / maxAbsImpact * 100;

          return (
            <div key={d.label} style={{
              display: "grid",
              gridTemplateColumns: "130px 100px 1fr 1fr 100px 64px",
              alignItems: "center",
              minHeight: 32,
              padding: "2px 0",
              borderRadius: "var(--r-md)",
              background: idx % 2 === 0 ? "transparent" : "var(--bg-accordion)",
            }}>
              {/* Label */}
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textAlign: "right", paddingRight: 10, lineHeight: 1.3 }}>
                {d.label}
              </div>

              {/* Negative EUR value */}
              <div style={{ fontSize: 11, fontWeight: 600, color: negImpact < 0 ? "var(--color-error)" : "var(--text-faint)", textAlign: "right", paddingRight: 6, fontVariantNumeric: "tabular-nums" }}>
                {negImpact < 0 ? eur(Math.round(negImpact)) : ""}
              </div>

              {/* Negative bar (right-aligned within its cell) */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: 20, position: "relative" }}>
                {negImpact < 0 ? (
                  <div style={{
                    width: negW + "%",
                    height: "100%",
                    background: "var(--color-error)",
                    opacity: 0.65,
                    borderRadius: "3px 0 0 3px",
                    minWidth: negW > 0 ? 2 : 0,
                  }} />
                ) : null}
                {/* Center line (right edge of this cell) */}
                <div style={{ position: "absolute", right: 0, top: -4, bottom: -4, width: 1, background: "var(--border-strong)" }} />
              </div>

              {/* Positive bar (left-aligned within its cell) */}
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", height: 20, position: "relative" }}>
                {posImpact > 0 ? (
                  <div style={{
                    width: posW + "%",
                    height: "100%",
                    background: "var(--color-success)",
                    opacity: 0.65,
                    borderRadius: "0 3px 3px 0",
                    minWidth: posW > 0 ? 2 : 0,
                  }} />
                ) : null}
                {/* Center line (left edge of this cell) */}
                <div style={{ position: "absolute", left: 0, top: -4, bottom: -4, width: 1, background: "var(--border-strong)" }} />
              </div>

              {/* Positive EUR value */}
              <div style={{ fontSize: 11, fontWeight: 600, color: posImpact > 0 ? "var(--color-success)" : "var(--text-faint)", textAlign: "left", paddingLeft: 6, fontVariantNumeric: "tabular-nums" }}>
                {posImpact > 0 ? "+" + eur(Math.round(posImpact)) : ""}
              </div>

              {/* Base value */}
              <div style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "right", paddingRight: 4, fontVariantNumeric: "tabular-nums" }}>
                {d.baseVal}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-4)", marginTop: "var(--sp-5)", fontSize: 11, color: "var(--text-faint)" }}>
        <span>{t.sensitivity_range}</span>
      </div>
    </Card>
  );
}
