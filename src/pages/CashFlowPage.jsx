import { useState, useMemo } from "react";
import { Wallet } from "@phosphor-icons/react";
import { PAGE_ICON_COLORS } from "../constants";
import { NumberField, PageLayout, KpiCard, SelectDropdown, CurrencyInput, PaletteToggle } from "../components";
import { eur, pct, projectFinancials } from "../utils";
import { useT } from "../context";

/* ── Projection Chart (SVG) ── */
function ProjectionChart({ rows, t }) {
  if (!rows || rows.length === 0) return null;

  var months = rows.length;
  var revPts = rows.map(function (r) { return r.monthlyRevenue; });
  var costPts = rows.map(function (r) { return r.monthlyCosts; });
  var cumPts = rows.map(function (r) { return r.cumulative; });

  var allVals = revPts.concat(costPts).concat(cumPts);
  var peak = Math.max.apply(null, allVals);
  var trough = Math.min.apply(null, allVals);
  if (peak === trough) { peak += 1; trough -= 1; }
  var range = peak - trough;

  var W = 700, H = 220, pL = 64, pR = 20, pT = 12, pB = 32;
  var cW = W - pL - pR, cH = H - pT - pB;
  function xp(m) { return pL + (m / months) * cW; }
  function yp(v) { return pT + cH * (1 - (v - trough) / range); }

  function makePath(pts) {
    return pts.map(function (v, m) { return (m === 0 ? "M" : "L") + xp(m).toFixed(1) + " " + yp(v).toFixed(1); }).join(" ");
  }

  var zeroY = yp(0);
  var showZero = zeroY >= pT && zeroY <= pT + cH;

  function fmtY(v) {
    var abs = Math.abs(v);
    var sign = v < 0 ? "-" : "";
    if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1) + "M";
    if (abs >= 1000) return sign + Math.round(abs / 1000) + "k";
    return sign + Math.round(abs);
  }

  var yTicks = 5;
  var yStep = range / yTicks;

  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto" }}>
      {Array.from({ length: yTicks + 1 }).map(function (_, i) {
        var val = trough + yStep * i;
        var y = yp(val);
        return (
          <g key={i}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="var(--border-light)" strokeWidth={1} />
            <text x={pL - 8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-ghost)" fontFamily="'DM Sans',sans-serif">{fmtY(val)}</text>
          </g>
        );
      })}
      {showZero ? <line x1={pL} x2={W - pR} y1={zeroY} y2={zeroY} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4,3" /> : null}
      {[12, 24, 36, 48].map(function (m) {
        if (m >= months) return null;
        return (
          <g key={m}>
            <line x1={xp(m)} x2={xp(m)} y1={pT} y2={H - pB} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,3" />
            <text x={xp(m)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--text-faint)" fontFamily="'DM Sans',sans-serif">{typeof t.proj_year_marker === "function" ? t.proj_year_marker(m / 12 + 1) : ("An " + (m / 12 + 1))}</text>
          </g>
        );
      })}
      <path d={makePath(cumPts) + " L" + xp(months - 1).toFixed(1) + " " + yp(0).toFixed(1) + " L" + xp(0).toFixed(1) + " " + yp(0).toFixed(1) + " Z"} fill="var(--brand)" fillOpacity={0.06} />
      <path d={makePath(revPts)} stroke="var(--color-success)" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d={makePath(costPts)} stroke="var(--color-error)" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="4,3" />
      <path d={makePath(cumPts)} stroke="var(--brand)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── Debt service helper ── */
function calcMonthlyDebtService(debts) {
  var total = 0;
  (debts || []).forEach(function (d) {
    if (!d.amount || !d.duration) return;
    var r = (d.rate || 0) / 12;
    var pmt = r > 0
      ? d.amount * r / (1 - Math.pow(1 + r, -d.duration))
      : d.amount / d.duration;
    if ((d.elapsed || 0) < d.duration) total += pmt;
  });
  return total;
}

/* ── Cash Flow Statement (Belgian bank format) ── */
function CashFlowStatement({ proj, monthlyDebtService, salCosts, annVatC, annVatD, assets, debts, cfg, t }) {
  var [expanded, setExpanded] = useState(false);
  var visibleMonths = expanded ? 12 : 6;

  // Monthly breakdowns from annual totals
  var monthlyVatC = (annVatC || 0) / 12;
  var monthlyVatD = (annVatD || 0) / 12;
  var monthlyVatNet = monthlyVatC - monthlyVatD;
  var monthlySal = salCosts || 0;

  // Investment from assets (initial outflow)
  var totalInvestment = 0;
  (assets || []).forEach(function (a) { totalInvestment += a.amount || 0; });
  var monthlyInvestment = totalInvestment > 0 ? totalInvestment / 12 : 0;

  // Subsidies from debts
  var monthlySubsidy = 0;
  (debts || []).forEach(function (d) { if (d.type === "subsidy" && d.amount > 0) monthlySubsidy += d.amount / 12; });

  // Loan disbursements (first year only)
  var monthlyLoanIn = 0;
  (debts || []).forEach(function (d) {
    if (d.type !== "subsidy" && d.amount > 0 && (!d.elapsed || d.elapsed === 0)) monthlyLoanIn += d.amount / 12;
  });

  var thStyle = { padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" };
  var tdStyle = { padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12 };
  var sectionStyle = { padding: "var(--sp-2) var(--sp-3)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--bg-accordion)" };
  var totalStyle = { padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 12 };

  var rows = (proj && proj.rows) ? proj.rows.slice(0, visibleMonths) : [];

  function buildRow(label, valueFn, opts) {
    var isSub = opts && opts.sub;
    var isTotal = opts && opts.total;
    var colorFn = opts && opts.colorFn;
    return (
      <tr key={label} style={{ borderBottom: isTotal ? "2px solid var(--border)" : "1px solid var(--border-light)" }}>
        <td style={{ padding: "var(--sp-2) var(--sp-3)", fontSize: 12, color: isTotal ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isTotal ? 700 : (isSub ? 400 : 500), paddingLeft: isSub ? "var(--sp-6)" : "var(--sp-3)" }}>
          {label}
        </td>
        {rows.map(function (row) {
          var val = valueFn(row);
          var color = colorFn ? colorFn(val) : (isTotal ? "var(--text-primary)" : "var(--text-secondary)");
          return (
            <td key={row.month} style={Object.assign({}, isTotal ? totalStyle : tdStyle, { color: color })}>
              {eur(val)}
            </td>
          );
        })}
      </tr>
    );
  }

  function sectionHeader(label) {
    return (
      <tr key={"section_" + label}>
        <td colSpan={rows.length + 1} style={sectionStyle}>{label}</td>
      </tr>
    );
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.stmt_title || "Tableau de flux de trésorerie"}</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={Object.assign({}, thStyle, { textAlign: "left", minWidth: 180 })}>{t.stmt_label || "Libellé"}</th>
              {rows.map(function (row) {
                var isYearEnd = row.month % 12 === 0;
                return <th key={row.month} style={Object.assign({}, thStyle, { fontWeight: isYearEnd ? 700 : 600 })}>{"M" + row.month}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {/* Opening cash */}
            {buildRow(t.stmt_opening || "Solde d'ouverture", function (row) {
              return row.month === 1 ? (cfg.initialCash || 0) : (proj.rows[row.month - 2] ? proj.rows[row.month - 2].cumulative : 0);
            }, { total: true })}

            {/* ENCAISSEMENTS */}
            {sectionHeader(t.stmt_receipts || "ENCAISSEMENTS")}
            {buildRow(t.stmt_revenue || "Chiffre d'affaires", function (row) { return row.monthlyRevenue; }, { sub: true })}
            {monthlySubsidy > 0 ? buildRow(t.stmt_subsidies || "Subsides & aides", function () { return monthlySubsidy; }, { sub: true }) : null}
            {monthlyLoanIn > 0 ? buildRow(t.stmt_loans_in || "Emprunts encaissés", function () { return monthlyLoanIn; }, { sub: true }) : null}
            {buildRow(t.stmt_total_receipts || "Total encaissements", function (row) {
              return row.monthlyRevenue + monthlySubsidy + monthlyLoanIn;
            }, { total: true, colorFn: function () { return "var(--color-success)"; } })}

            {/* DÉCAISSEMENTS */}
            {sectionHeader(t.stmt_disbursements || "DÉCAISSEMENTS")}
            {buildRow(t.stmt_opex || "Charges d'exploitation", function (row) {
              return row.monthlyCosts - monthlyDebtService - monthlySal;
            }, { sub: true })}
            {monthlySal > 0 ? buildRow(t.stmt_salaries || "Rémunérations & charges sociales", function () { return monthlySal; }, { sub: true }) : null}
            {monthlyDebtService > 0 ? buildRow(t.stmt_debt_service || "Remboursements emprunts", function () { return monthlyDebtService; }, { sub: true }) : null}
            {monthlyVatNet > 0 ? buildRow(t.stmt_vat || "TVA nette à payer", function () { return monthlyVatNet; }, { sub: true }) : null}
            {monthlyInvestment > 0 ? buildRow(t.stmt_capex || "Investissements", function () { return monthlyInvestment; }, { sub: true }) : null}
            {buildRow(t.stmt_total_disbursements || "Total décaissements", function (row) {
              return row.monthlyCosts + (monthlyVatNet > 0 ? monthlyVatNet : 0) + monthlyInvestment;
            }, { total: true, colorFn: function () { return "var(--color-error)"; } })}

            {/* NET CASH FLOW */}
            {buildRow(t.stmt_net || "Flux net de trésorerie", function (row) { return row.net; }, {
              total: true,
              colorFn: function (v) { return v >= 0 ? "var(--color-success)" : "var(--color-error)"; },
            })}

            {/* CLOSING CASH */}
            {buildRow(t.stmt_closing || "Solde de clôture", function (row) { return row.cumulative; }, {
              total: true,
              colorFn: function (v) { return v >= 0 ? "var(--text-primary)" : "var(--color-error)"; },
            })}
          </tbody>
        </table>
      </div>
      {proj && proj.rows && proj.rows.length > 6 ? (
        <button type="button" onClick={function () { setExpanded(function (v) { return !v; }); }}
          style={{ display: "block", width: "100%", marginTop: "var(--sp-3)", padding: "var(--sp-2)", border: "none", background: "none", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {expanded ? (t.stmt_collapse || "Réduire") : (t.stmt_expand || "Voir les 12 mois")}
        </button>
      ) : null}
    </div>
  );
}

/* ── Main ── */
export default function CashFlowPage({ totalRevenue, monthlyCosts, debts, salCosts, assets, annVatC, annVatD, cfg, setCfg, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var tAll = useT();
  var t = tAll.cashflow || {};

  var [projYears, setProjYears] = useState(cfg.projectionYears || 3);

  var monthlyRev = totalRevenue / 12;
  var monthlyDebtService = calcMonthlyDebtService(debts);
  var monthlyNet = monthlyRev - monthlyCosts - monthlyDebtService;
  var isBurning = monthlyNet < 0;
  var initialCash = cfg.initialCash || 0;
  var runway = isBurning && initialCash > 0
    ? Math.floor(initialCash / Math.abs(monthlyNet))
    : null;

  var projY1 = initialCash + monthlyNet * 12;

  var proj = useMemo(function () {
    return projectFinancials({
      monthlyRevenue: monthlyRev,
      monthlyCosts: monthlyCosts + monthlyDebtService,
      initialCash: initialCash,
      revenueGrowthRate: cfg.revenueGrowthRate || 0.10,
      costEscalation: cfg.costEscalation || 0.02,
      months: projYears * 12,
    });
  }, [monthlyRev, monthlyCosts, monthlyDebtService, initialCash, cfg.revenueGrowthRate, cfg.costEscalation, projYears]);

  function cfgSet(key, val) {
    setCfg(function (prev) { var nc = Object.assign({}, prev); nc[key] = val; return nc; });
  }

  return (
    <PageLayout title={t.title || "Trésorerie"} subtitle={t.subtitle || "Projection des flux financiers."} icon={Wallet} iconColor={PAGE_ICON_COLORS.cashflow}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_initial || "Trésorerie initiale"} value={initialCash > 0 ? eur(initialCash) : "—"} glossaryKey="treasury" />
        <KpiCard label={t.kpi_net || "Flux net mensuel"} value={eur(monthlyNet)} glossaryKey="burn_rate" />
        <KpiCard label={t.kpi_remaining || "Mois restants"} value={isBurning ? (runway !== null ? String(runway) : "—") : (t.kpi_profitable || "Rentable")} glossaryKey="runway" />
        <KpiCard label={t.kpi_proj_y1 || "Trésorerie fin d'année"} value={eur(projY1)} />
      </div>

      {/* ── Insight cards: 3 columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          {
            title: t.cash_card_title || "Trésorerie de départ",
            hint: t.cash_initial || "Combien avez-vous en banque aujourd'hui ?",
            input: <CurrencyInput value={initialCash} onChange={function (v) { cfgSet("initialCash", v); }} suffix="€" width="140px" />,
          },
          {
            title: t.growth_title || "Évolution des revenus",
            hint: t.growth_hint || "De combien vos revenus augmentent chaque année.",
            input: <NumberField value={cfg.revenueGrowthRate || 0.10} onChange={function (v) { cfgSet("revenueGrowthRate", v); }} min={-0.50} max={5} step={0.05} width="80px" pct />,
          },
          {
            title: t.inflation_title || "Évolution des charges",
            hint: t.inflation_hint || "De combien vos charges augmentent chaque année.",
            input: <NumberField value={cfg.costEscalation || 0.02} onChange={function (v) { cfgSet("costEscalation", v); }} min={0} max={0.50} step={0.01} width="80px" pct />,
          },
        ].map(function (card, ci) {
          return (
            <div key={ci} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.4 }}>
                    {card.hint}
                  </div>
                </div>
                {card.input}
              </div>
              {ci === 0 && initialCash > 0 && monthlyCosts > 0 ? (
                <div style={{ marginTop: "var(--sp-3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginBottom: 4 }}>
                    <span>{t.runway_covers || "Couvre"}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {isBurning && runway !== null ? runway + " " + (t.kpi_runway_months || "mois") : (t.kpi_profitable || "Rentable")}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      background: isBurning ? (runway !== null && runway < 6 ? "var(--color-error)" : runway !== null && runway < 12 ? "var(--color-warning)" : "var(--color-success)") : "var(--color-success)",
                      width: isBurning && runway !== null ? Math.min(runway / 24 * 100, 100) + "%" : "100%",
                      transition: "width 0.3s",
                    }} />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ── Chart full-size ── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {typeof t.proj_title === "function" ? t.proj_title(projYears) : ("Projection sur " + projYears + " ans")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
            {proj.zeroMonth ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: "var(--r-full)", background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error-border)", whiteSpace: "nowrap" }}>
                {typeof t.proj_cash_zero === "function" ? t.proj_cash_zero(proj.zeroMonth) : ("Cash zéro : M" + proj.zeroMonth)}
              </span>
            ) : null}
            {proj.beMonth ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: "var(--r-full)", background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)", whiteSpace: "nowrap" }}>
                {typeof t.proj_breakeven === "function" ? t.proj_breakeven(proj.beMonth) : ("Rentable : mois " + proj.beMonth)}
              </span>
            ) : null}
            <SelectDropdown
              value={String(projYears)}
              onChange={function (v) { setProjYears(Number(v)); }}
              options={[1, 2, 3, 5].map(function (y) {
                return { value: String(y), label: typeof t.proj_year_btn === "function" ? t.proj_year_btn(y) : (y + " an" + (y > 1 ? "s" : "")) };
              })}
              height={40}
            />
          </div>
        </div>
        <ProjectionChart rows={proj.rows} t={t} />
        <div style={{ display: "flex", gap: "var(--sp-5)", marginTop: "var(--sp-3)", justifyContent: "center" }}>
          {[
            { label: t.proj_legend_revenue || "Revenus", color: "var(--color-success)", dash: false },
            { label: t.proj_legend_costs || "Charges", color: "var(--color-error)", dash: true },
            { label: t.proj_legend_cash || "Trésorerie", color: "var(--brand)", dash: false },
          ].map(function (l, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 16, height: 0, borderTop: "2px " + (l.dash ? "dashed" : "solid") + " " + l.color }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{l.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Year summary cards ── */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(proj.years.length, 3) + ", 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {proj.years.map(function (yr) {
          var margin = yr.revenue > 0 ? yr.ebitda / yr.revenue : 0;
          return (
            <div key={yr.year} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                  {typeof t.proj_year === "function" ? t.proj_year(yr.year) : ("Année " + yr.year)}
                </h4>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                  background: yr.ebitda >= 0 ? "var(--color-success-bg)" : "var(--color-error-bg)",
                  color: yr.ebitda >= 0 ? "var(--color-success)" : "var(--color-error)",
                  border: "1px solid " + (yr.ebitda >= 0 ? "var(--color-success-border)" : "var(--color-error-border)"),
                }}>
                  {yr.ebitda >= 0 ? "+" : ""}{pct(margin)}
                </span>
              </div>
              {[
                { label: t.proj_revenue || "Revenus", value: eur(yr.revenue), color: "var(--color-success)" },
                { label: t.proj_costs || "Charges", value: eur(yr.costs), color: "var(--text-primary)" },
                { label: "EBITDA", value: eur(yr.ebitda), color: yr.ebitda >= 0 ? "var(--color-success)" : "var(--color-error)", bold: true },
                { label: t.proj_end_cash || "Trésorerie fin", value: eur(yr.endCash), color: yr.endCash >= 0 ? "var(--text-primary)" : "var(--color-error)" },
              ].map(function (row, i) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-1) 0", borderBottom: i < 3 ? "1px solid var(--border-light)" : "none" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.color, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Monthly cash flow statement (Belgian bank format) ── */}
      <CashFlowStatement
        proj={proj}
        monthlyDebtService={monthlyDebtService}
        salCosts={salCosts}
        annVatC={annVatC}
        annVatD={annVatD}
        assets={assets}
        debts={debts}
        cfg={cfg}
        t={t}
      />

    </PageLayout>
  );
}
