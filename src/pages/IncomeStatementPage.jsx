import { useMemo, useState } from "react";
import { CaretDown, CaretUp, TreeStructure } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageLayout, KpiCard, SelectDropdown, NumberField, PnlCascade, PaletteToggle } from "../components";
import { eur, eurShort, calcStockValue, calcStockVariation } from "../utils";
import { useT } from "../context";

/**
 * Compte de resultat previsionnel — PCMN belge
 * Structure normalisee classes 6 (charges) et 7 (produits)
 * Projection sur 1, 2, 3 ou 5 ans avec escalation des couts
 */

/* ── Recharts custom tooltip ─────────────────────── */

function ChartTooltip(props) {
  if (!props.active || !props.payload) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "var(--sp-2) var(--sp-3)", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{props.label}</div>
      {props.payload.map(function (entry) {
        return <div key={entry.dataKey} style={{ color: entry.color }}>{entry.name}: {eur(entry.value)}</div>;
      })}
    </div>
  );
}

/* ── Section row (line item inside a year column) ── */

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

/* ── Year column (detailed P&L for one year) ─────── */

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
        {t.year_label || "Annee"} {year}
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

      {/* Marge brute — no color */}
      <SectionRow label={t.gross_margin || "Marge brute"} value={eur(grossMargin)} bold border />

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

      {/* 62 — Remunerations */}
      <SectionRow label={t.salaries || "Remunerations & charges sociales"} value={eur(-totalSalaries)} pcmn="62" showPcmn={showPcmn} />

      {/* EBITDA — no color */}
      <SectionRow label="EBITDA" value={eur(ebitda)} bold border />

      {/* 63 — Amortissements */}
      <SectionRow label={t.depreciation || "Dotations aux amortissements"} value={eur(-totalDepreciation)} pcmn="63" showPcmn={showPcmn} />

      {/* EBIT — no color */}
      <SectionRow label={t.ebit || "Resultat d'exploitation (EBIT)"} value={eur(ebit)} bold />

      {/* 65 — Charges financieres */}
      {financialCharges > 0 ? (
        <SectionRow label={t.financial || "Charges financieres"} value={eur(-financialCharges)} pcmn="65" showPcmn={showPcmn} />
      ) : null}

      {/* EBT — no color */}
      <SectionRow label={t.ebt || "Resultat avant impots (EBT)"} value={eur(ebt)} bold border />

      {/* 67 — ISOC */}
      {isoc > 0 ? (
        <SectionRow label={t.isoc || "Impot des societes (ISOC)"} value={eur(-isoc)} pcmn="67" showPcmn={showPcmn} />
      ) : null}

      {/* Resultat net — ONLY row with color */}
      <SectionRow label={t.net_result || "Resultat net"} value={eur(netResult)} bold border color={netResult >= 0 ? "var(--color-success)" : "var(--color-error)"} />
    </div>
  );
}

/* ── Main page component ─────────────────────────── */

export default function IncomeStatementPage({ streams, costs, cfg, setCfg, assets, stocks, salCosts, annualInterest, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var t = useT().income_statement || {};
  var [horizon, setHorizon] = useState(3);
  var showPcmn = cfg.showPcmn;

  function cfgSet(key, val) {
    setCfg(function (prev) { return Object.assign({}, prev, { [key]: val }); });
  }

  /* ── Build year data (calculation logic unchanged) ── */
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
  }, [streams, costs, assets, stocks, cfg, salCosts, annualInterest, horizon]);

  /* ── KPIs from Y1 ── */
  var y1 = yearData[0] || {};
  var y1Ebitda = (y1.revenue || 0) - (y1.purchases || 0) + (y1.stockVariation || 0) - (y1.opex || 0) - (y1.salaries || 0);
  var y1Net = (y1.revenue || 0) - (y1.purchases || 0) + (y1.stockVariation || 0) - (y1.opex || 0) - (y1.salaries || 0) - (y1.depreciation || 0) - (y1.interest || 0) - (y1.isoc || 0);
  var y1Margin = y1.revenue > 0 ? Math.round(y1Ebitda / y1.revenue * 100) : 0;

  /* ── Chart data: Revenue vs Total Costs per year ── */
  var chartData = useMemo(function () {
    return yearData.map(function (d) {
      return {
        name: "Y" + d.year,
        revenue: d.revenue,
        costs: d.opex + d.salaries + d.purchases + d.depreciation + d.interest + d.isoc,
      };
    });
  }, [yearData]);

  /* ── Cascade steps (Y1 waterfall) ── */
  var cascadeSteps = useMemo(function () {
    return [
      { label: t.total_revenue || "Chiffre d'affaires", value: y1.revenue || 0, type: "start" },
      { label: t.purchases || "Achats", value: y1.purchases || 0, type: "deduction" },
      { label: t.total_opex || "Charges d'exploitation", value: y1.opex || 0, type: "deduction" },
      { label: t.salaries || "Salaires", value: y1.salaries || 0, type: "deduction" },
      { label: t.depreciation || "Amortissements", value: y1.depreciation || 0, type: "deduction" },
      { label: t.isoc || "Impots", value: y1.isoc || 0, type: "deduction" },
      { label: t.net_result || "Resultat net", value: y1Net, type: "result" },
    ];
  }, [y1, y1Net, t]);

  return (
    <PageLayout title={t.title || "Compte de resultat"} subtitle={t.subtitle || "Projection du resultat d'exploitation sur la duree du plan financier."} icon={TreeStructure} iconColor="var(--text-muted)">

      {/* ── 1. KPI cards ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_revenue || "Chiffre d'affaires Y1"} value={y1.revenue > 0 ? eurShort(y1.revenue) : "\u2014"} fullValue={y1.revenue > 0 ? eur(y1.revenue) : undefined} glossaryKey="annual_revenue" />
        <KpiCard label={t.kpi_ebitda || "EBITDA Y1"} value={eurShort(y1Ebitda)} fullValue={eur(y1Ebitda)} glossaryKey="ebitda" />
        <KpiCard label={t.kpi_margin || "Marge EBITDA"} value={y1Margin + "%"} glossaryKey="ebitda_margin" />
        <KpiCard label={t.kpi_net || "Resultat net Y1"} value={eurShort(y1Net)} fullValue={eur(y1Net)} glossaryKey="net_profit" />
      </div>

      {/* ── 2. Insight section — chart + cascade ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>

        {/* Left: Revenue vs Costs bar chart */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.chart_rev_vs_costs || "Revenus vs charges"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={function (v) { return eurShort(v); }} />
              <Tooltip content={ChartTooltip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name={t.total_revenue || "Revenus"} fill="#E8431A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="costs" name={t.total_costs || "Charges"} fill="#6B7280" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: P&L cascade waterfall (Y1) */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {t.cascade_title || "Du revenu au resultat net (Y1)"}
          </div>
          <PnlCascade steps={cascadeSteps} />
        </div>
      </div>

      {/* ── 3. Assumptions card — 3-column grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          {
            title: t.hyp_growth_title || "Croissance des revenus",
            hint: t.hyp_growth_hint || "De combien vos revenus augmentent chaque annee.",
            input: <NumberField value={cfg.revenueGrowthRate || 0.10} onChange={function (v) { cfgSet("revenueGrowthRate", v); }} min={-0.50} max={5} step={0.05} width="80px" pct />,
          },
          {
            title: t.hyp_inflation_title || "Evolution des charges",
            hint: t.hyp_inflation_hint || "De combien vos charges augmentent chaque annee.",
            input: <NumberField value={cfg.costEscalation || 0.02} onChange={function (v) { cfgSet("costEscalation", v); }} min={0} max={0.50} step={0.01} width="80px" pct />,
          },
          {
            title: t.hyp_horizon || "Horizon",
            hint: t.hyp_horizon_hint || "Nombre d'annees de projection.",
            input: <SelectDropdown value={String(horizon)} onChange={function (v) { setHorizon(parseInt(v, 10)); }} height={36} width="80px"
              options={[
                { value: "1", label: "1 " + (t.year || "an") },
                { value: "2", label: "2 " + (t.years || "ans") },
                { value: "3", label: "3 " + (t.years || "ans") },
                { value: "5", label: "5 " + (t.years || "ans") },
              ]}
            />,
          },
        ].map(function (card, ci) {
          return (
            <div key={ci} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.4 }}>{card.hint}</div>
                </div>
                {card.input}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Year columns (simplified colors) ── */}
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
