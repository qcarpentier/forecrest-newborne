import { useMemo, useState } from "react";
import { Card, FinanceLink, SelectDropdown } from "../components";
import { eur, pct } from "../utils";

var DEFAULT_VARIATION = 0.20;

/* ── Glossary mapping: variable id → glossary term ── */
var GLOSSARY_MAP = {
  revenue: "annual_revenue",
  costs: "total_costs",
  salaries: "salary_cost",
  vat: "tva",
  cac: "cac",
  onss: "onss",
};

/* ── Sensitivity variables per business type ── */
var VARIABLES = {
  _universal: [
    { id: "revenue", label_fr: "Chiffre d'affaires", label_en: "Revenue" },
    { id: "costs", label_fr: "Charges d'exploitation", label_en: "Operating costs" },
    { id: "salaries", label_fr: "Salaires", label_en: "Payroll" },
    { id: "vat", label_fr: "Taux TVA", label_en: "VAT rate" },
  ],
  saas: [
    { id: "churn", label_fr: "Churn mensuel", label_en: "Monthly churn" },
    { id: "growth", label_fr: "Croissance CA", label_en: "Revenue growth" },
    { id: "cac", label_fr: "Coût acquisition client", label_en: "Customer acquisition cost" },
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
    case "churn":
      var churnBase = cfg.churnMonthly || 0.03;
      var revLost = totalRevenue * (churnBase * variation);
      return -revLost;
    case "growth":
      var growthBase = cfg.revenueGrowthRate || 0.10;
      return totalRevenue * (growthBase * variation);
    case "cac":
      var cacBase = cfg.cacTarget || 0;
      if (cacBase <= 0) return 0;
      var growthForCac = cfg.revenueGrowthRate || 0.10;
      return -(cacBase * growthForCac * 12 * variation);
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

/* ── Exported for SensitivityPage (report + KPI) ── */
export { VARIABLES, computeImpact, DEFAULT_VARIATION };

export default function SensitivityChart({ totalRevenue, monthlyCosts, salCosts, ebit, cfg, t, variation, setVariation }) {
  var [hoveredRow, setHoveredRow] = useState(null);
  var lang = t.legend_variation === "de variation" ? "fr" : "en";

  var bizType = cfg.businessType || "other";

  var data = useMemo(function () {
    var vars = (VARIABLES._universal || []).concat(VARIABLES[bizType] || []);
    var results = [];

    vars.forEach(function (v) {
      var lowImpact = computeImpact(v.id, -variation, ebit, totalRevenue, monthlyCosts, salCosts, cfg);
      var highImpact = computeImpact(v.id, variation, ebit, totalRevenue, monthlyCosts, salCosts, cfg);

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
  }, [totalRevenue, monthlyCosts, salCosts, ebit, cfg, bizType, variation, lang]);

  if (data.length === 0) return null;

  var maxAbsImpact = 1;
  data.forEach(function (d) {
    var m = Math.max(Math.abs(d.low), Math.abs(d.high));
    if (m > maxAbsImpact) maxAbsImpact = m;
  });

  var vPct = Math.round(variation * 100);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
            {t.chart_title}
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0 }}>
            {typeof t.chart_sub === "function" ? t.chart_sub(vPct) : t.chart_sub}
          </p>
        </div>
        <SelectDropdown
          value={variation}
          onChange={setVariation}
          options={[
            { value: 0.10, label: lang === "fr" ? "Variation de ± 10%" : "± 10% variation" },
            { value: 0.20, label: lang === "fr" ? "Variation de ± 20%" : "± 20% variation" },
            { value: 0.30, label: lang === "fr" ? "Variation de ± 30%" : "± 30% variation" },
            { value: 0.50, label: lang === "fr" ? "Variation de ± 50%" : "± 50% variation" },
          ]}
          width="200px"
        />
      </div>

      {/* EBITDA reference */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--sp-3)",
        padding: "var(--sp-2) var(--sp-3)", marginBottom: "var(--sp-4)",
        background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
      }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.ebitda_current}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: ebit >= 0 ? "var(--color-success)" : "var(--color-error)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{eur(ebit)}</span>
      </div>

      {/* Tornado bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {data.map(function (d, idx) {
          var negImpact = Math.min(d.low, d.high);
          var posImpact = Math.max(d.low, d.high);
          var negW = Math.abs(negImpact) / maxAbsImpact * 100;
          var posW = Math.abs(posImpact) / maxAbsImpact * 100;
          var glossaryTerm = GLOSSARY_MAP[d.id];
          var isFirst = idx === 0;

          /* % of EBITDA for each impact */
          var negPct = ebit !== 0 ? Math.abs(negImpact) / Math.abs(ebit) : 0;
          var posPct = ebit !== 0 ? Math.abs(posImpact) / Math.abs(ebit) : 0;

          return (
            <div key={d.id}
              onMouseEnter={function () { setHoveredRow(d.id); }}
              onMouseLeave={function () { setHoveredRow(null); }}
              style={{
              display: "grid",
              gridTemplateColumns: "160px 110px 1fr 1fr 110px",
              alignItems: "center",
              minHeight: 38,
              padding: "var(--sp-1) var(--sp-2)",
              borderRadius: "var(--r-md)",
              background: hoveredRow === d.id ? "var(--bg-hover)" : (idx % 2 === 0 ? "transparent" : "var(--bg-accordion)"),
              transition: "background 0.12s",
              cursor: "default",
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textAlign: "right", paddingRight: 10, lineHeight: 1.3, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--sp-2)" }}>
                {isFirst ? (
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                    color: "var(--brand)", background: "var(--brand-bg)",
                    border: "1px solid var(--brand-border)",
                    padding: "1px 6px", borderRadius: "var(--r-sm)", whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {t.badge_most_sensitive}
                  </span>
                ) : null}
                {glossaryTerm ? (
                  <FinanceLink term={glossaryTerm} label={d.label} subtle />
                ) : (
                  <span>{d.label}</span>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: negImpact < 0 ? "var(--color-error)" : "var(--text-faint)", textAlign: "right", paddingRight: 6, fontVariantNumeric: "tabular-nums", lineHeight: 1.3 }}>
                {negImpact < 0 ? (
                  <>
                    <span>{eur(Math.round(negImpact))}</span>
                    {negPct > 0.005 ? (
                      <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 3 }}>({pct(negPct)})</span>
                    ) : null}
                  </>
                ) : ""}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: 22, position: "relative" }}>
                {negImpact < 0 ? (
                  <div style={{
                    width: Math.max(negW, 1) + "%", height: "100%",
                    background: "var(--color-error)", opacity: 0.6,
                    borderRadius: "var(--r-sm) 0 0 var(--r-sm)",
                    transition: "width 0.3s ease",
                  }} />
                ) : null}
                <div style={{ position: "absolute", right: 0, top: -4, bottom: -4, width: 2, background: "var(--border-strong)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", height: 22, position: "relative" }}>
                {posImpact > 0 ? (
                  <div style={{
                    width: Math.max(posW, 1) + "%", height: "100%",
                    background: "var(--color-success)", opacity: 0.6,
                    borderRadius: "0 var(--r-sm) var(--r-sm) 0",
                    transition: "width 0.3s ease",
                  }} />
                ) : null}
                <div style={{ position: "absolute", left: 0, top: -4, bottom: -4, width: 2, background: "var(--border-strong)" }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: posImpact > 0 ? "var(--color-success)" : "var(--text-faint)", textAlign: "left", paddingLeft: 6, fontVariantNumeric: "tabular-nums", lineHeight: 1.3 }}>
                {posImpact > 0 ? (
                  <>
                    <span>+{eur(Math.round(posImpact))}</span>
                    {posPct > 0.005 ? (
                      <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 3 }}>({pct(posPct)})</span>
                    ) : null}
                  </>
                ) : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-6)", marginTop: "var(--sp-5)", fontSize: 11, color: "var(--text-faint)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 8, borderRadius: "var(--r-sm)", background: "var(--color-error)", opacity: 0.6 }} />
          {t.legend_negative}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 8, borderRadius: "var(--r-sm)", background: "var(--color-success)", opacity: 0.6 }} />
          {t.legend_positive}
        </span>
        <span>±{vPct}% {t.legend_variation}</span>
      </div>
    </Card>
  );
}
