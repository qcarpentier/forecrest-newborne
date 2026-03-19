import { useMemo, useState } from "react";
import { Card } from "../components";
import { eur, pct } from "../utils";
import { Info, CaretDown, Sliders } from "@phosphor-icons/react";

var DEFAULT_VARIATION = 0.20;

// Sensitivity variables per business type
var VARIABLES = {
  _universal: [
    { id: "revenue", label_fr: "Chiffre d'affaires", label_en: "Revenue" },
    { id: "costs", label_fr: "Charges opérationnelles", label_en: "Operating costs" },
    { id: "salaries", label_fr: "Masse salariale", label_en: "Payroll" },
    { id: "vat", label_fr: "Taux TVA", label_en: "VAT rate" },
    { id: "initialCash", label_fr: "Trésorerie initiale", label_en: "Initial cash" },
  ],
  saas: [
    { id: "churn", label_fr: "Churn mensuel", label_en: "Monthly churn" },
    { id: "growth", label_fr: "Croissance CA", label_en: "Revenue growth" },
    { id: "cac", label_fr: "Coût acquisition client", label_en: "CAC" },
  ],
  ecommerce: [
    { id: "orders", label_fr: "Commandes / mois", label_en: "Orders / month" },
    { id: "returnRate", label_fr: "Taux de retour", label_en: "Return rate" },
    { id: "shipping", label_fr: "Coût livraison", label_en: "Shipping cost" },
  ],
  retail: [
    { id: "footfall", label_fr: "Fréquentation", label_en: "Footfall" },
    { id: "shrinkage", label_fr: "Démarque", label_en: "Shrinkage" },
  ],
  services: [
    { id: "utilization", label_fr: "Taux d'occupation", label_en: "Utilization" },
    { id: "hourlyRate", label_fr: "Taux horaire", label_en: "Hourly rate" },
  ],
  freelancer: [
    { id: "dailyRate", label_fr: "Tarif journalier", label_en: "Daily rate" },
    { id: "daysBilled", label_fr: "Jours facturés", label_en: "Days billed" },
  ],
};

function computeImpact(id, variation, baseEbitda, totalRevenue, monthlyCosts, salCosts, cfg) {
  var factor = 1 + variation;
  var annC = monthlyCosts * 12;

  switch (id) {
    case "revenue":
      return (totalRevenue * factor) - annC - baseEbitda;
    case "costs":
      return totalRevenue - ((monthlyCosts - salCosts) * factor + salCosts) * 12 - baseEbitda;
    case "salaries":
      return totalRevenue - ((monthlyCosts - salCosts) + salCosts * factor) * 12 - baseEbitda;
    case "vat":
      var baseVatNet = totalRevenue * cfg.vat / (1 + cfg.vat) - annC * cfg.vat / (1 + cfg.vat);
      var newVat = cfg.vat * factor;
      var newVatNet = totalRevenue * newVat / (1 + newVat) - annC * newVat / (1 + newVat);
      return -(newVatNet - baseVatNet);
    case "initialCash":
      return 0;
    case "churn":
      var churnBase = cfg.churnMonthly || 0.03;
      var revLost = totalRevenue * (churnBase * variation);
      return -revLost;
    case "growth":
      var growthBase = cfg.revenueGrowthRate || 0.10;
      return totalRevenue * (growthBase * variation);
    case "cac":
      return 0;
    case "orders":
      var ordersImpact = (cfg.ordersPerMonth || 0) * 12 * variation;
      var aov = (cfg.ordersPerMonth > 0 && totalRevenue > 0) ? totalRevenue / ((cfg.ordersPerMonth || 1) * 12) : 0;
      return ordersImpact * aov;
    case "returnRate":
      return -totalRevenue * ((cfg.returnRate || 0.05) * variation);
    case "shipping":
      return -(cfg.avgShippingCost || 0) * (cfg.ordersPerMonth || 0) * 12 * variation;
    case "footfall":
      var convRate = (cfg.monthlyTransactions || 0) / Math.max(cfg.monthlyFootfall || 1, 1);
      var avgTx = (cfg.monthlyTransactions > 0 && totalRevenue > 0) ? totalRevenue / ((cfg.monthlyTransactions || 1) * 12) : 0;
      return (cfg.monthlyFootfall || 0) * variation * convRate * avgTx * 12;
    case "shrinkage":
      return -totalRevenue * ((cfg.shrinkageRate || 0.015) * variation);
    case "utilization":
      return totalRevenue * ((cfg.utilizationTarget || 0.75) * variation);
    case "hourlyRate":
      return totalRevenue * variation;
    case "dailyRate":
      return (cfg.dailyRate || 0) * (cfg.daysBilled || 0) * variation;
    case "daysBilled":
      return (cfg.dailyRate || 0) * (cfg.daysBilled || 0) * variation;
    default:
      return 0;
  }
}

export default function SensitivityChart({ totalRevenue, monthlyCosts, salCosts, ebitda, cfg, t }) {
  var [variation, setVariation] = useState(DEFAULT_VARIATION);
  var [helpOpen, setHelpOpen] = useState(false);
  var lang = t.legend_variation === "de variation" ? "fr" : "en";

  var bizType = cfg.businessType || "other";

  var data = useMemo(function () {
    var vars = (VARIABLES._universal || []).concat(VARIABLES[bizType] || []);
    var results = [];

    vars.forEach(function (v) {
      var lowImpact = computeImpact(v.id, -variation, ebitda, totalRevenue, monthlyCosts, salCosts, cfg);
      var highImpact = computeImpact(v.id, variation, ebitda, totalRevenue, monthlyCosts, salCosts, cfg);

      if (Math.abs(lowImpact) < 1 && Math.abs(highImpact) < 1) return;

      results.push({
        id: v.id,
        label: lang === "fr" ? v.label_fr : v.label_en,
        low: lowImpact,
        high: highImpact,
      });
    });

    results.sort(function (a, b) {
      return Math.max(Math.abs(b.low), Math.abs(b.high)) - Math.max(Math.abs(a.low), Math.abs(a.high));
    });

    return results;
  }, [totalRevenue, monthlyCosts, salCosts, ebitda, cfg, bizType, variation, lang]);

  if (data.length === 0) return null;

  var maxAbsImpact = 1;
  data.forEach(function (d) {
    var m = Math.max(Math.abs(d.low), Math.abs(d.high));
    if (m > maxAbsImpact) maxAbsImpact = m;
  });

  var vPct = Math.round(variation * 100);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-2)" }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
            {t.chart_title}
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0 }}>
            {typeof t.chart_sub === "function" ? t.chart_sub(vPct) : t.chart_sub}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexShrink: 0 }}>
          <Sliders size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>±</span>
          {[10, 20, 30, 50].map(function (v) {
            var active = vPct === v;
            return (
              <button key={v} onClick={function () { setVariation(v / 100); }} style={{
                padding: "3px 8px", borderRadius: "var(--r-full)",
                border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
                background: active ? "var(--brand)" : "transparent",
                color: active ? "#fff" : "var(--text-muted)",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
                {v}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Help toggle */}
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
        {t.help_toggle}
        <CaretDown size={10} color="var(--color-info)" style={{ transition: "transform 150ms", transform: helpOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {helpOpen ? (
        <div style={{
          fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
          padding: "var(--sp-3)", background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-border)", borderRadius: "var(--r-md)",
          marginBottom: "var(--sp-4)",
        }}>
          {typeof t.help_body === "function" ? t.help_body(vPct) : t.help_body}
        </div>
      ) : null}

      {/* EBITDA reference */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--sp-3)",
        padding: "var(--sp-2) var(--sp-3)", marginBottom: "var(--sp-4)",
        background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
      }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.ebitda_current}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: ebitda >= 0 ? "var(--color-success)" : "var(--color-error)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{eur(ebitda)}</span>
      </div>

      {/* Tornado bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {data.map(function (d, idx) {
          var negImpact = Math.min(d.low, d.high);
          var posImpact = Math.max(d.low, d.high);
          var negW = Math.abs(negImpact) / maxAbsImpact * 100;
          var posW = Math.abs(posImpact) / maxAbsImpact * 100;

          return (
            <div key={d.id} style={{
              display: "grid",
              gridTemplateColumns: "140px 90px 1fr 1fr 90px",
              alignItems: "center",
              minHeight: 36,
              padding: "2px 0",
              borderRadius: "var(--r-md)",
              background: idx % 2 === 0 ? "transparent" : "var(--bg-accordion)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textAlign: "right", paddingRight: 10, lineHeight: 1.3 }}>
                {d.label}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: negImpact < 0 ? "var(--color-error)" : "var(--text-faint)", textAlign: "right", paddingRight: 6, fontVariantNumeric: "tabular-nums" }}>
                {negImpact < 0 ? eur(Math.round(negImpact)) : ""}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: 22, position: "relative" }}>
                {negImpact < 0 ? (
                  <div style={{
                    width: Math.max(negW, 1) + "%", height: "100%",
                    background: "var(--color-error)", opacity: 0.6,
                    borderRadius: "4px 0 0 4px",
                  }} />
                ) : null}
                <div style={{ position: "absolute", right: 0, top: -4, bottom: -4, width: 2, background: "var(--border-strong)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", height: 22, position: "relative" }}>
                {posImpact > 0 ? (
                  <div style={{
                    width: Math.max(posW, 1) + "%", height: "100%",
                    background: "var(--color-success)", opacity: 0.6,
                    borderRadius: "0 4px 4px 0",
                  }} />
                ) : null}
                <div style={{ position: "absolute", left: 0, top: -4, bottom: -4, width: 2, background: "var(--border-strong)" }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: posImpact > 0 ? "var(--color-success)" : "var(--text-faint)", textAlign: "left", paddingLeft: 6, fontVariantNumeric: "tabular-nums" }}>
                {posImpact > 0 ? "+" + eur(Math.round(posImpact)) : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-6)", marginTop: "var(--sp-5)", fontSize: 11, color: "var(--text-faint)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 8, borderRadius: 2, background: "var(--color-error)", opacity: 0.6 }} />
          {t.legend_negative}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 8, borderRadius: 2, background: "var(--color-success)", opacity: 0.6 }} />
          {t.legend_positive}
        </span>
        <span>±{vPct}% {t.legend_variation}</span>
      </div>
    </Card>
  );
}
