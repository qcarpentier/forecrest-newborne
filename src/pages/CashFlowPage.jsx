import { useState, useMemo } from "react";
import { ok, err } from "../constants/colors";
import { NumberField, PageLayout, KpiCard, SelectDropdown } from "../components";
import CurrencyInput from "../components/CurrencyInput";
import { eur, pct, projectFinancials } from "../utils";
import { useT } from "../context";

/* ── Projection Chart (SVG) ── */
function ProjectionChart({ rows }) {
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
            <text x={xp(m)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--text-faint)" fontFamily="'DM Sans',sans-serif">{"An " + (m / 12 + 1)}</text>
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

/* ── Main ── */
export default function CashFlowPage({ totalRevenue, monthlyCosts, annC, ebitda, cfg, setCfg, setTab }) {
  var tAll = useT();
  var t = tAll.cashflow || {};

  var [projYears, setProjYears] = useState(cfg.projectionYears || 3);

  var monthlyRev = totalRevenue / 12;
  var monthlyNet = monthlyRev - monthlyCosts;
  var isBurning = monthlyNet < 0;
  var initialCash = cfg.initialCash || 0;
  var runway = isBurning && initialCash > 0
    ? Math.floor(initialCash / Math.abs(monthlyNet))
    : null;

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

  function cfgSet(key, val) {
    setCfg(function (prev) { var nc = Object.assign({}, prev); nc[key] = val; return nc; });
  }

  return (
    <PageLayout title={t.title || "Trésorerie"} subtitle={t.subtitle || "Projection des flux financiers."}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_initial || "Trésorerie initiale"} value={initialCash > 0 ? eur(initialCash) : "—"} />
        <KpiCard label={t.kpi_net || "Flux net mensuel"} value={eur(monthlyNet)} />
        <KpiCard label={t.kpi_remaining || "Mois restants"} value={isBurning ? (runway !== null ? String(runway) : "—") : (t.kpi_profitable || "Rentable")} />
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
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
            {typeof t.proj_title === "function" ? t.proj_title(projYears) : ("Projection sur " + projYears + " ans")}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            {proj.zeroMonth ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: "var(--r-full)", background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error-border)" }}>
                {typeof t.proj_cash_zero === "function" ? t.proj_cash_zero(proj.zeroMonth) : ("Cash à zéro : mois " + proj.zeroMonth)}
              </span>
            ) : null}
            {proj.beMonth ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: "var(--r-full)", background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)" }}>
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
        <ProjectionChart rows={proj.rows} />
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

      {/* ── Monthly table ── */}
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

    </PageLayout>
  );
}
