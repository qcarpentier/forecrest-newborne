import { useMemo, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { PageLayout, KpiCard, Button, SelectDropdown, Badge } from "../components";
import { eur, eurShort, pct, calcStockValue, calcMonthlyCogs, calcStockVariation } from "../utils";
import { useT, useLang, useDevMode } from "../context";

/**
 * Compte de résultat prévisionnel — PCMN belge
 * Structure normalisée classes 6 (charges) et 7 (produits)
 * Projection sur 1, 2 ou 3 ans avec escalation des coûts
 */

function SectionRow({ label, value, bold, color, indent, border, pcmn, showPcmn }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-2)",
      padding: "var(--sp-2) 0",
      borderTop: border ? "2px solid var(--border)" : undefined,
    }}>
      {showPcmn && pcmn ? <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)", width: 40, flexShrink: 0 }}>{pcmn}</span> : null}
      <span style={{
        flex: 1, fontSize: bold ? 13 : 12,
        fontWeight: bold ? 700 : 400,
        color: color || (bold ? "var(--text-primary)" : "var(--text-secondary)"),
        paddingLeft: indent ? 16 : 0,
      }}>{label}</span>
      <span style={{
        fontSize: bold ? 14 : 12,
        fontWeight: bold ? 700 : 500,
        color: color || "var(--text-primary)",
        fontVariantNumeric: "tabular-nums",
        fontFamily: bold ? "'Bricolage Grotesque', sans-serif" : "inherit",
        minWidth: 90, textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

function YearColumn({ year, data, showPcmn, t }) {
  var [openSections, setOpenSections] = useState({ revenue: true, costs: true });

  function toggle(key) {
    setOpenSections(function (prev) { return Object.assign({}, prev, { [key]: !prev[key] }); });
  }

  var totalRevenue = data.revenue;
  var totalPurchases = data.purchases;
  var stockVariation = data.stockVariation || 0;
  var grossMargin = totalRevenue - totalPurchases + stockVariation;
  var totalOpex = data.opex;
  var totalSalaries = data.salaries;
  var totalDepreciation = data.depreciation;
  var ebitda = grossMargin - totalOpex - totalSalaries;
  var ebit = ebitda - totalDepreciation;
  var financialCharges = data.interest;
  var ebt = ebit - financialCharges;
  var isoc = data.isoc;
  var netResult = ebt - isoc;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
        {t.year_label || "Année"} {year}
      </div>

      {/* 70 — Chiffre d'affaires */}
      <button type="button" onClick={function () { toggle("revenue"); }} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", padding: "var(--sp-1) 0", width: "100%", fontFamily: "inherit" }}>
        {openSections.revenue ? <CaretDown size={10} color="var(--text-muted)" /> : <CaretUp size={10} color="var(--text-muted)" />}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.section_revenue || "Produits d'exploitation"}</span>
      </button>
      {openSections.revenue ? (
        <div style={{ marginBottom: "var(--sp-2)" }}>
          {data.revenueBreakdown.map(function (row) {
            return <SectionRow key={row.label} label={row.label} value={eur(row.value)} indent pcmn={row.pcmn} showPcmn={showPcmn} />;
          })}
        </div>
      ) : null}
      <SectionRow label={t.total_revenue || "Chiffre d'affaires net"} value={eur(totalRevenue)} bold pcmn="70" showPcmn={showPcmn} />

      {/* 60 — Achats */}
      {totalPurchases > 0 ? (
        <SectionRow label={t.purchases || "Achats & approvisionnements"} value={eur(-totalPurchases)} indent pcmn="60" showPcmn={showPcmn} />
      ) : null}

      {/* 71 — Variation de stocks */}
      {stockVariation !== 0 ? (
        <SectionRow label={t.stock_variation || "Variation de stocks"} value={eur(stockVariation)} indent pcmn="71" showPcmn={showPcmn} />
      ) : null}

      {/* Marge brute */}
      <SectionRow label={t.gross_margin || "Marge brute"} value={eur(grossMargin)} bold border color={grossMargin >= 0 ? "var(--color-success)" : "var(--color-error)"} />

      {/* 61 — Services & biens divers */}
      <button type="button" onClick={function () { toggle("costs"); }} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", padding: "var(--sp-1) 0", width: "100%", fontFamily: "inherit", marginTop: "var(--sp-2)" }}>
        {openSections.costs ? <CaretDown size={10} color="var(--text-muted)" /> : <CaretUp size={10} color="var(--text-muted)" />}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.section_costs || "Charges d'exploitation"}</span>
      </button>
      {openSections.costs ? (
        <div style={{ marginBottom: "var(--sp-2)" }}>
          {data.costBreakdown.map(function (row) {
            return <SectionRow key={row.label} label={row.label} value={eur(-row.value)} indent pcmn={row.pcmn} showPcmn={showPcmn} />;
          })}
        </div>
      ) : null}
      <SectionRow label={t.total_opex || "Total charges d'exploitation"} value={eur(-totalOpex)} bold pcmn="61" showPcmn={showPcmn} />

      {/* 62 — Rémunérations */}
      <SectionRow label={t.salaries || "Rémunérations & charges sociales"} value={eur(-totalSalaries)} pcmn="62" showPcmn={showPcmn} />

      {/* EBITDA */}
      <SectionRow label="EBITDA" value={eur(ebitda)} bold border color={ebitda >= 0 ? "var(--color-success)" : "var(--color-error)"} />

      {/* 63 — Amortissements */}
      <SectionRow label={t.depreciation || "Dotations aux amortissements"} value={eur(-totalDepreciation)} pcmn="63" showPcmn={showPcmn} />

      {/* EBIT */}
      <SectionRow label={t.ebit || "Résultat d'exploitation (EBIT)"} value={eur(ebit)} bold color={ebit >= 0 ? "var(--color-success)" : "var(--color-error)"} />

      {/* 65 — Charges financières */}
      {financialCharges > 0 ? (
        <SectionRow label={t.financial || "Charges financières"} value={eur(-financialCharges)} pcmn="65" showPcmn={showPcmn} />
      ) : null}

      {/* EBT */}
      <SectionRow label={t.ebt || "Résultat avant impôts (EBT)"} value={eur(ebt)} bold border color={ebt >= 0 ? "var(--color-success)" : "var(--color-error)"} />

      {/* 67 — ISOC */}
      {isoc > 0 ? (
        <SectionRow label={t.isoc || "Impôt des sociétés (ISOC)"} value={eur(-isoc)} pcmn="67" showPcmn={showPcmn} />
      ) : null}

      {/* Résultat net */}
      <SectionRow label={t.net_result || "Résultat net"} value={eur(netResult)} bold border color={netResult >= 0 ? "var(--color-success)" : "var(--color-error)"} />
    </div>
  );
}

export default function IncomeStatementPage({ streams, costs, sals, cfg, debts, assets, totalRevenue, monthlyCosts, opCosts, salCosts, ebitda, isoc, netP, annualInterest, stocks }) {
  var t = useT().income_statement || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var { devMode } = useDevMode();
  var [horizon, setHorizon] = useState(3);
  var showPcmn = cfg.showPcmn;

  /* Build year data */
  var yearData = useMemo(function () {
    var years = [];
    var escalation = cfg.costEscalation || 0.02;
    var revenueGrowth = cfg.revenueGrowthRate || 0.10;

    for (var y = 1; y <= horizon; y++) {
      var revMultiplier = Math.pow(1 + revenueGrowth, y - 1);
      var costMultiplier = Math.pow(1 + escalation, y - 1);

      /* Revenue breakdown by behavior */
      var revenueBreakdown = [];
      var revTotal = 0;
      var revByBehavior = {};
      (streams || []).forEach(function (cat) {
        (cat.items || []).forEach(function (item) {
          var b = item.behavior || "recurring";
          var annual = 0;
          var price = item.price || 0;
          var qty = item.qty || 0;
          if (b === "one_time" || b === "subsidy") {
            annual = y === 1 ? price * qty : 0;
          } else if (b === "project" || b === "daily_rate") {
            annual = price * qty * revMultiplier;
          } else {
            annual = price * qty * 12 * revMultiplier;
          }
          revByBehavior[b] = (revByBehavior[b] || 0) + annual;
          revTotal += annual;
        });
      });
      Object.keys(revByBehavior).forEach(function (b) {
        if (revByBehavior[b] > 0) {
          revenueBreakdown.push({ label: b, value: revByBehavior[b], pcmn: "70" });
        }
      });

      /* Cost breakdown by category */
      var costBreakdown = [];
      var purchasesTotal = 0;
      var opexTotal = 0;
      var depTotal = 0;
      var costByCategory = {};
      (costs || []).forEach(function (cat) {
        (cat.items || []).forEach(function (item) {
          var catKey = item._category || "other";
          var a = item.pu ? (item.a || 0) * (item.u || 1) : (item.a || 0);
          var freqMap = { monthly: 12, quarterly: 4, annual: 1, once: 1 };
          var annual = a * (freqMap[item.freq] || 12);
          if (item.freq === "once") {
            annual = y === 1 ? annual : 0;
          } else {
            annual = annual * costMultiplier;
          }

          if (catKey === "purchases") {
            purchasesTotal += annual;
          } else if (catKey === "depreciation") {
            depTotal += annual;
          } else if (catKey === "financial_auto") {
            // handled separately via annualInterest
          } else {
            opexTotal += annual;
            costByCategory[catKey] = (costByCategory[catKey] || 0) + annual;
          }
        });
      });
      Object.keys(costByCategory).forEach(function (ck) {
        if (costByCategory[ck] > 0) {
          costBreakdown.push({ label: ck, value: costByCategory[ck], pcmn: "61" });
        }
      });

      /* Salaries — escalated */
      var salTotal = salCosts * 12 * costMultiplier;

      /* Depreciation from assets */
      var assetDepTotal = 0;
      (assets || []).forEach(function (a) {
        if (a.amount > 0 && a.years > 0) {
          var dep = (a.amount - (a.residual || 0)) / a.years;
          var elapsed = (a.elapsed || 0) + y - 1;
          if (elapsed < a.years) assetDepTotal += dep;
        }
      });
      if (assetDepTotal > depTotal) depTotal = assetDepTotal;

      /* Stock variation (PCMN 71) */
      var stockValue = calcStockValue(stocks);
      var monthlyCogs = calcMonthlyCogs(stocks);
      var annualCogs = monthlyCogs * 12;
      var openingStock = y === 1 ? 0 : stockValue * Math.pow(1 + revenueGrowth, y - 2);
      var closingStock = stockValue * Math.pow(1 + revenueGrowth, y - 1);
      var stockVar = calcStockVariation(openingStock, closingStock);

      /* Interest — escalated (simple) */
      var interest = (annualInterest || 0) * costMultiplier;

      /* ISOC */
      var ebitdaY = revTotal - purchasesTotal + stockVar - opexTotal - salTotal;
      var ebitY = ebitdaY - depTotal;
      var ebtY = ebitY - interest;
      var isocY = 0;
      if (ebtY > 0) {
        isocY = ebtY <= 100000 ? ebtY * 0.20 : 100000 * 0.20 + (ebtY - 100000) * 0.25;
      }

      years.push({
        year: y,
        revenue: revTotal,
        revenueBreakdown: revenueBreakdown,
        purchases: purchasesTotal,
        stockVariation: stockVar,
        opex: opexTotal,
        costBreakdown: costBreakdown,
        salaries: salTotal,
        depreciation: depTotal,
        interest: interest,
        isoc: isocY,
      });
    }
    return years;
  }, [streams, costs, sals, assets, stocks, cfg, salCosts, annualInterest, horizon]);

  /* KPIs from Y1 */
  var y1 = yearData[0] || {};
  var y1Ebitda = (y1.revenue || 0) - (y1.purchases || 0) + (y1.stockVariation || 0) - (y1.opex || 0) - (y1.salaries || 0);
  var y1Net = (y1.revenue || 0) - (y1.purchases || 0) + (y1.stockVariation || 0) - (y1.opex || 0) - (y1.salaries || 0) - (y1.depreciation || 0) - (y1.interest || 0) - (y1.isoc || 0);
  var y1Margin = y1.revenue > 0 ? Math.round(y1Ebitda / y1.revenue * 100) : 0;

  return (
    <PageLayout title={t.title || "Compte de résultat"} subtitle={t.subtitle || "Projection du résultat d'exploitation sur la durée du plan financier."}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_revenue || "Chiffre d'affaires Y1"} value={y1.revenue > 0 ? eurShort(y1.revenue) : "—"} fullValue={y1.revenue > 0 ? eur(y1.revenue) : undefined} glossaryKey="annual_revenue" />
        <KpiCard label={t.kpi_ebitda || "EBITDA Y1"} value={eurShort(y1Ebitda)} fullValue={eur(y1Ebitda)} glossaryKey="ebitda" />
        <KpiCard label={t.kpi_margin || "Marge EBITDA"} value={y1Margin + "%"} glossaryKey="ebitda_margin" />
        <KpiCard label={t.kpi_net || "Résultat net Y1"} value={eurShort(y1Net)} fullValue={eur(y1Net)} glossaryKey="net_profit" />
      </div>

      {/* Horizon selector */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--gap-md)" }}>
        <SelectDropdown value={String(horizon)} onChange={function (v) { setHorizon(parseInt(v, 10)); }} height={36} width="140px"
          options={[
            { value: "1", label: "1 " + (t.year || "an") },
            { value: "2", label: "2 " + (t.years || "ans") },
            { value: "3", label: "3 " + (t.years || "ans") },
            { value: "5", label: "5 " + (t.years || "ans") },
          ]}
        />
      </div>

      {/* Year columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(horizon, 3) + ", 1fr)", gap: "var(--gap-md)" }}>
        {yearData.slice(0, Math.min(horizon, 3)).map(function (data) {
          return <YearColumn key={data.year} year={data.year} data={data} showPcmn={showPcmn} t={t} />;
        })}
      </div>
      {horizon > 3 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + (horizon - 3) + ", 1fr)", gap: "var(--gap-md)", marginTop: "var(--gap-md)" }}>
          {yearData.slice(3).map(function (data) {
            return <YearColumn key={data.year} year={data.year} data={data} showPcmn={showPcmn} t={t} />;
          })}
        </div>
      ) : null}
    </PageLayout>
  );
}
