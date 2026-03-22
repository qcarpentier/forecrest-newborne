import { useState, useMemo } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { ok, err } from "../constants/colors";
import { Card, NumberField, PageLayout, ExplainerBox, KpiCard, Button, FinanceLink } from "../components";
import CurrencyInput from "../components/CurrencyInput";
import { eur, pct, projectFinancials } from "../utils";
import { useT, useLang } from "../context";

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

  var W = 700, H = 200, pL = 64, pR = 20, pT = 16, pB = 32;
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
            <text x={xp(m)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--text-faint)" fontFamily="'DM Sans',sans-serif">
              {typeof t.proj_year_marker === "function" ? t.proj_year_marker(m / 12 + 1) : ("Y" + (m / 12 + 1))}
            </text>
          </g>
        );
      })}
      <path d={makePath(cumPts) + " L" + xp(months - 1).toFixed(1) + " " + yp(0).toFixed(1) + " L" + xp(0).toFixed(1) + " " + yp(0).toFixed(1) + " Z"} fill="var(--brand)" fillOpacity={0.06} />
      <path d={makePath(revPts)} stroke="var(--color-success)" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d={makePath(costPts)} stroke="var(--color-error)" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="4,3" />
      <path d={makePath(cumPts)} stroke="var(--brand)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <g transform={"translate(" + (pL + 8) + "," + (pT + 4) + ")"}>
        {[
          { label: t.proj_legend_revenue || "Revenus", color: "var(--color-success)" },
          { label: t.proj_legend_costs || "Charges", color: "var(--color-error)", dash: true },
          { label: t.proj_legend_cash || "Trésorerie", color: "var(--brand)" },
        ].map(function (l, i) {
          return (
            <g key={i} transform={"translate(" + (i * 100) + ",0)"}>
              <line x1={0} x2={16} y1={0} y2={0} stroke={l.color} strokeWidth={2} strokeDasharray={l.dash ? "4,3" : "none"} />
              <text x={20} y={4} fontSize={10} fill="var(--text-muted)" fontFamily="'DM Sans',sans-serif">{l.label}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* ── BFR Visual Bar ── */
function BfrBar({ fr, bfr, tn, t }) {
  var total = Math.max(Math.abs(fr), Math.abs(bfr), 1);
  var frPct = Math.max(Math.min(Math.abs(fr) / total * 50, 95), 5);
  var bfrPct = Math.max(Math.min(Math.abs(bfr) / total * 50, 95), 5);

  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 28, borderRadius: 6, overflow: "hidden", marginBottom: "var(--sp-3)" }}>
        <div style={{ width: frPct + "%", background: fr >= 0 ? "var(--color-success)" : "var(--color-error)", opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.3s" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>FR</span>
        </div>
        <div style={{ width: bfrPct + "%", background: bfr >= 0 ? "var(--color-warning)" : "var(--color-info)", opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.3s" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>BFR</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "var(--sp-4)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: fr >= 0 ? "var(--color-success)" : "var(--color-error)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.bfr_fr_label || "Fonds de roulement"}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: fr >= 0 ? "var(--color-success)" : "var(--color-error)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(fr)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: bfr >= 0 ? "var(--color-warning)" : "var(--color-info)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.bfr_bfr_label || "Besoin en fonds de roulement"}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(bfr)}</div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.bfr_tn_label || "Trésorerie nette"}</span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: tn >= 0 ? "var(--brand)" : "var(--color-error)", flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: tn >= 0 ? "var(--brand)" : "var(--color-error)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(tn)}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function CashFlowPage({ totalRevenue, monthlyCosts, annC, ebitda, cfg, setCfg, debts, assets, setTab }) {
  var tAll = useT();
  var t = tAll.cashflow || {};
  var { lang } = useLang();
  var [activeTab, setActiveTab] = useState("cashflow");

  var [projYears, setProjYears] = useState(cfg.projectionYears || 3);

  var monthlyRev = totalRevenue / 12;
  var monthlyNet = monthlyRev - monthlyCosts;
  var isBurning = monthlyNet < 0;
  var initialCash = cfg.initialCash || 0;
  var runway = isBurning && initialCash > 0
    ? Math.floor(initialCash / Math.abs(monthlyNet))
    : null;

  /* Projection Y1 end cash */
  var projY1 = initialCash + monthlyNet * 12;

  var proj = useMemo(function () {
    return projectFinancials({
      monthlyRevenue: monthlyRev,
      monthlyCosts: monthlyCosts,
      initialCash: initialCash,
      revenueGrowthRate: cfg.revenueGrowthRate || 0.10,
      costEscalation: cfg.costEscalation || 0.02,
      months: projYears * 12,
    });
  }, [monthlyRev, monthlyCosts, initialCash, cfg.revenueGrowthRate, cfg.costEscalation, projYears]);

  /* ── BFR calculations ── */
  var clientDays = cfg.paymentTermsClient || 30;
  var supplierDays = cfg.paymentTermsSupplier || 30;
  var dailyRevenue = totalRevenue / 365;
  var dailyCosts = annC / 365;

  /* Créances clients = CA journalier × délai client */
  var receivables = dailyRevenue * clientDays;
  /* Dettes fournisseurs = Charges journalières × délai fournisseur */
  var payables = dailyCosts * supplierDays;
  /* BFR = Créances - Dettes fournisseurs (pas de stocks pour startup services) */
  var bfr = receivables - payables;

  /* Fonds de roulement = Capitaux permanents - Actifs immobilisés */
  var capitalSocial = cfg.capitalSocial || 0;
  var totalDebt = 0;
  (debts || []).forEach(function (d) { totalDebt += d.amount || 0; });
  var permanentCapital = capitalSocial + totalDebt + initialCash;

  var totalAssets = 0;
  (assets || []).forEach(function (a) { if (a.amount > 0) totalAssets += a.amount; });
  var fr = permanentCapital - totalAssets;

  /* Trésorerie nette = FR - BFR */
  var tn = fr - bfr;

  /* Ratio de liquidité = Actif circulant / Passif circulant */
  var liquidityRatio = payables > 0 ? (initialCash + receivables) / payables : null;

  var TAB_TYPES = ["cashflow", "bfr"];
  var TAB_LABELS = {
    cashflow: t.tab_cashflow || "Flux de trésorerie",
    bfr: t.tab_bfr || "Fonds de roulement",
  };

  function cfgSet(key, val) {
    setCfg(function (prev) { var nc = Object.assign({}, prev); nc[key] = val; return nc; });
  }

  return (
    <PageLayout title={t.title || "Trésorerie"} subtitle={t.subtitle || "Projection des flux financiers et fonds de roulement."}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard
          label={t.kpi_initial || "Trésorerie initiale"}
          value={initialCash > 0 ? eur(initialCash) : (t.kpi_initial_empty || "À saisir")}
          color={initialCash > 0 ? undefined : "var(--text-faint)"}
        />
        <KpiCard
          label={t.kpi_net || "Flux net mensuel"}
          value={eur(monthlyNet)}
          color={isBurning ? "var(--color-error)" : "var(--color-success)"}
        />
        <KpiCard
          label={t.kpi_runway || "Runway"}
          value={isBurning ? (runway !== null ? runway + " " + (t.kpi_runway_months || "mois") : (t.kpi_runway_unknown || "—")) : (t.kpi_profitable || "Rentable")}
          color={isBurning ? "var(--color-error)" : "var(--color-success)"}
        />
        <KpiCard
          label={t.kpi_proj_y1 || "Trésorerie fin Y1"}
          value={eur(projY1)}
          color={projY1 >= 0 ? undefined : "var(--color-error)"}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {TAB_TYPES.map(function (tabKey) {
          var isActive = activeTab === tabKey;
          return (
            <button key={tabKey} type="button" onClick={function () { setActiveTab(tabKey); }}
              style={{
                padding: "var(--sp-2) var(--sp-4)",
                border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2,
                background: "transparent",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.12s, border-color 0.12s",
              }}>
              {TAB_LABELS[tabKey]}
            </button>
          );
        })}
      </div>

      {/* ═══ Tab 1: Cash Flow ═══ */}
      {activeTab === "cashflow" ? (
        <>
          {/* Explainer */}
          <ExplainerBox variant="info" title={t.explainer_title || "La trésorerie, c'est quoi ?"}>
            {t.explainer_body || "C'est l'argent disponible sur vos comptes. Le runway indique combien de mois vous pouvez tenir."}{" "}
            <FinanceLink term="treasury" /> <FinanceLink term="burn_rate" /> <FinanceLink term="runway" />
          </ExplainerBox>

          {/* Projection controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 5].map(function (y) {
                var active = projYears === y;
                return (
                  <button key={y} onClick={function () { setProjYears(y); }} style={{
                    padding: "6px 14px", borderRadius: "var(--r-full)",
                    border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
                    background: active ? "var(--brand)" : "transparent",
                    color: active ? "var(--color-on-brand)" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 150ms",
                  }}>
                    {typeof t.proj_year_btn === "function" ? t.proj_year_btn(y) : (y + " an" + (y > 1 ? "s" : ""))}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.proj_revenue_growth || "Croissance CA"}</span>
              <NumberField value={cfg.revenueGrowthRate || 0.10} onChange={function (v) { cfgSet("revenueGrowthRate", v); }} min={-0.50} max={5} step={0.05} width="70px" pct />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.proj_cost_escalation || "Inflation charges"}</span>
              <NumberField value={cfg.costEscalation || 0.02} onChange={function (v) { cfgSet("costEscalation", v); }} min={0} max={0.50} step={0.01} width="70px" pct />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.cash_initial || "Trésorerie initiale"}</span>
              <CurrencyInput value={initialCash} onChange={function (v) { cfgSet("initialCash", v); }} suffix="€" width="130px" />
            </div>
          </div>

          {/* Projection Chart */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                {typeof t.proj_title === "function" ? t.proj_title(projYears) : ("Projection sur " + projYears + " ans")}
              </h3>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                {proj.zeroMonth ? (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-full)", background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error-border)" }}>
                    {typeof t.proj_cash_zero === "function" ? t.proj_cash_zero(proj.zeroMonth) : ("Cash à zéro : mois " + proj.zeroMonth)}
                  </span>
                ) : null}
                {proj.beMonth ? (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-full)", background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)" }}>
                    {typeof t.proj_breakeven === "function" ? t.proj_breakeven(proj.beMonth) : ("Rentable : mois " + proj.beMonth)}
                  </span>
                ) : null}
              </div>
            </div>
            <ProjectionChart rows={proj.rows} t={t} />
          </div>

          {/* Year summary cards */}
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
                    { label: "EBITDA", value: eur(yr.ebitda), color: yr.ebitda >= 0 ? ok : err, bold: true },
                    { label: t.proj_end_cash || "Trésorerie fin", value: eur(yr.endCash), color: yr.endCash >= 0 ? "var(--text-primary)" : err },
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

          {/* Monthly table */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.table_title || "Détail mensuel"}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    {[t.col_month || "Mois", t.col_rev || "Revenu", t.col_costs || "Charges", t.col_net || "Cash-flow", t.col_cum || "Cumulatif"].map(function (h, i) {
                      return <th key={i} style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: i === 0 ? "left" : "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {proj.rows.map(function (row) {
                    var isZero = proj.zeroMonth && row.month === proj.zeroMonth;
                    var isBe = proj.beMonth && row.month === proj.beMonth;
                    var isYearEnd = row.month % 12 === 0;
                    return (
                      <tr key={row.month} style={{
                        borderBottom: isYearEnd ? "2px solid var(--border)" : "1px solid var(--border-light)",
                        background: isZero ? "var(--color-error-bg)" : isBe ? "var(--color-success-bg)" : "transparent",
                      }}>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--text-secondary)", fontWeight: isYearEnd ? 700 : 500 }}>{"M" + row.month}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(row.monthlyRevenue)}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(row.monthlyCosts)}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 600, color: row.net >= 0 ? ok : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(row.net)}</td>
                        <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, color: row.cumulative >= 0 ? "var(--text-primary)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(row.cumulative)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "var(--sp-3)", fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>
              {typeof t.proj_footnote === "function" ? t.proj_footnote(pct(cfg.revenueGrowthRate || 0.10), pct(cfg.costEscalation || 0.02)) : ""}
            </div>
          </div>
        </>
      ) : null}

      {/* ═══ Tab 2: Fonds de roulement & BFR ═══ */}
      {activeTab === "bfr" ? (
        <>
          <ExplainerBox variant="info" title={t.bfr_explainer_title || "Comprendre le fonds de roulement"}>
            {t.bfr_explainer_body || "Le fonds de roulement (FR) mesure si vos ressources à long terme couvrent vos investissements. Le besoin en fonds de roulement (BFR) représente l'argent immobilisé entre le moment où vous payez vos fournisseurs et celui où vos clients vous paient."}{" "}
            <FinanceLink term="working_capital" />
          </ExplainerBox>

          {/* BFR KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
            <KpiCard label={t.bfr_kpi_fr || "Fonds de roulement"} value={eur(fr)} color={fr >= 0 ? "var(--color-success)" : "var(--color-error)"} />
            <KpiCard label={t.bfr_kpi_bfr || "BFR"} value={eur(bfr)} />
            <KpiCard label={t.bfr_kpi_tn || "Trésorerie nette"} value={eur(tn)} color={tn >= 0 ? "var(--color-success)" : "var(--color-error)"} />
            <KpiCard label={t.bfr_kpi_liquidity || "Ratio de liquidité"} value={liquidityRatio !== null ? liquidityRatio.toFixed(2) : "—"} color={liquidityRatio !== null && liquidityRatio < 1 ? "var(--color-error)" : undefined} />
          </div>

          {/* BFR Visual */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
            {/* FR vs BFR bar */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t.bfr_visual_title || "Équilibre financier"}
              </div>
              <BfrBar fr={fr} bfr={bfr} tn={tn} t={t} />
            </div>

            {/* BFR Detail */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t.bfr_detail_title || "Détail du BFR"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: t.bfr_receivables || "Créances clients", value: eur(receivables), sub: clientDays + " " + (t.bfr_days || "jours") },
                  { label: t.bfr_payables || "Dettes fournisseurs", value: "- " + eur(payables), sub: supplierDays + " " + (t.bfr_days || "jours"), color: "var(--text-muted)" },
                ].map(function (row, i) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: i === 0 ? "1px solid var(--border-light)" : "none" }}>
                      <div>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                        <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 8 }}>{row.sub}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                    </div>
                  );
                })}
                <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t.bfr_total || "BFR"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(bfr)}</span>
                </div>
              </div>

              {/* Settings link */}
              <div style={{ marginTop: "var(--sp-3)" }}>
                <Button color="tertiary" size="sm" onClick={function () { setTab("set", { section: "accounting" }); }} iconLeading={<ArrowRight size={12} weight="bold" />}>
                  {t.bfr_settings || "Configurer les délais"}
                </Button>
              </div>
            </div>
          </div>

          {/* FR Detail */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.fr_detail_title || "Détail du fonds de roulement"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
              {/* Capitaux permanents */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>{t.fr_permanent || "Capitaux permanents"}</div>
                {[
                  { label: t.fr_capital || "Capital social", value: eur(capitalSocial) },
                  { label: t.fr_debt || "Emprunts", value: eur(totalDebt) },
                  { label: t.fr_cash || "Trésorerie initiale", value: eur(initialCash) },
                ].map(function (row, i) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-1) 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-1) 0", fontWeight: 700 }}>
                  <span style={{ fontSize: 12 }}>Total</span>
                  <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{eur(permanentCapital)}</span>
                </div>
              </div>
              {/* Actifs immobilisés */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>{t.fr_assets || "Actifs immobilisés"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-1) 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.fr_fixed_assets || "Équipements (classe 2)"}</span>
                  <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{eur(totalAssets)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-1) 0", fontWeight: 700 }}>
                  <span style={{ fontSize: 12 }}>Total</span>
                  <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{eur(totalAssets)}</span>
                </div>
                <div style={{ marginTop: "var(--sp-2)" }}>
                  <Button color="tertiary" size="sm" onClick={function () { setTab("equipment"); }} iconLeading={<ArrowRight size={12} weight="bold" />}>
                    {t.fr_equipment_link || "Voir les équipements"}
                  </Button>
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "var(--sp-3) 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t.bfr_fr_label || "Fonds de roulement"} (FR)</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: fr >= 0 ? "var(--color-success)" : "var(--color-error)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(fr)}</span>
            </div>
          </div>
        </>
      ) : null}

    </PageLayout>
  );
}
