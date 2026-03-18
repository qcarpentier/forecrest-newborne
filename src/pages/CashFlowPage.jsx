import { useState, useMemo } from "react";
import { brand, ok, err } from "../constants/colors";
import { Card, NumberField, PageLayout, ExplainerBox } from "../components";
import { eur, pct, projectFinancials } from "../utils";
import { useT, useLang } from "../context";

/* ── Projection Chart (SVG) ── */

function ProjectionChart({ rows, t, lang }) {
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
      {/* Grid lines + labels */}
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

      {/* Zero line */}
      {showZero ? <line x1={pL} x2={W - pR} y1={zeroY} y2={zeroY} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4,3" /> : null}

      {/* Year markers */}
      {[12, 24].map(function (m) {
        if (m >= months) return null;
        return (
          <g key={m}>
            <line x1={xp(m)} x2={xp(m)} y1={pT} y2={H - pB} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,3" />
            <text x={xp(m)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--text-faint)" fontFamily="'DM Sans',sans-serif">
              {lang === "fr" ? "An " + (m / 12 + 1) : "Y" + (m / 12 + 1)}
            </text>
          </g>
        );
      })}

      {/* Cumulative area */}
      <path
        d={makePath(cumPts) + " L" + xp(months - 1).toFixed(1) + " " + yp(0).toFixed(1) + " L" + xp(0).toFixed(1) + " " + yp(0).toFixed(1) + " Z"}
        fill="var(--brand)" fillOpacity={0.06}
      />

      {/* Lines */}
      <path d={makePath(revPts)} stroke="var(--color-success)" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d={makePath(costPts)} stroke="var(--color-error)" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="4,3" />
      <path d={makePath(cumPts)} stroke="var(--brand)" strokeWidth={2.5} fill="none" strokeLinecap="round" />

      {/* Legend */}
      <g transform={"translate(" + (pL + 8) + "," + (pT + 4) + ")"}>
        {[
          { label: lang === "fr" ? "Revenus" : "Revenue", color: "var(--color-success)" },
          { label: lang === "fr" ? "Charges" : "Costs", color: "var(--color-error)", dash: true },
          { label: lang === "fr" ? "Trésorerie" : "Cash", color: "var(--brand)" },
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

/* ── Main ── */

export default function CashFlowPage({
  arrV, totalRevenue, monthlyCosts, annC, ebitda, netP, totS, cfg, setCfg,
}) {
  var tAll = useT();
  var t = tAll.cashflow;
  var { lang } = useLang();

  var [projYears, setProjYears] = useState(cfg.projectionYears || 3);

  var monthlyRev = totalRevenue / 12;
  var monthlyNet = monthlyRev - monthlyCosts;
  var isBurning = monthlyNet < 0;
  var initialCash = cfg.initialCash || 0;
  var runway = isBurning && initialCash > 0
    ? Math.floor(initialCash / Math.abs(monthlyNet))
    : null;

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

  return (
    <PageLayout title={t.title} subtitle={t.subtitle}>

      {/* Explainer */}
      <ExplainerBox variant="info" title={lang === "fr" ? "La trésorerie, c'est quoi ?" : "What is cash flow?"}>
        {lang === "fr"
          ? "C'est l'argent réellement disponible sur vos comptes. Une entreprise peut être rentable sur papier mais manquer de cash pour payer ses factures. Le runway indique combien de mois vous pouvez tenir avec votre trésorerie actuelle."
          : "It's the cash actually available in your accounts. A company can be profitable on paper but lack cash to pay bills. Runway shows how many months you can last with current cash."}
      </ExplainerBox>

      {/* KPIs */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { label: t.kpi_rev, value: eur(monthlyRev), color: "var(--text-primary)" },
          { label: t.kpi_costs, value: eur(monthlyCosts), color: "var(--text-primary)" },
          { label: t.kpi_net, value: eur(monthlyNet), color: isBurning ? "var(--color-error)" : ok },
          {
            label: t.kpi_runway,
            value: isBurning
              ? (runway !== null ? runway + " " + t.kpi_runway_months : t.kpi_runway_unknown)
              : t.kpi_profitable,
            color: isBurning ? "var(--color-error)" : ok,
          },
        ].map(function (k, i) {
          return (
            <Card key={i}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Projection controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)", flexWrap: "wrap" }}>
        {/* Year selector */}
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 5].map(function (y) {
            var active = projYears === y;
            return (
              <button key={y} onClick={function () { setProjYears(y); }} style={{
                padding: "6px 14px", borderRadius: "var(--r-full)",
                border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
                background: active ? "var(--brand)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 150ms",
              }}>
                {y} {lang === "fr" ? "an" + (y > 1 ? "s" : "") : "yr" + (y > 1 ? "s" : "")}
              </button>
            );
          })}
        </div>

        {/* Growth rate */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "fr" ? "Croissance CA" : "Revenue growth"}</span>
          <NumberField
            value={cfg.revenueGrowthRate || 0.10}
            onChange={function (v) { setCfg({ ...cfg, revenueGrowthRate: v }); }}
            min={-0.50} max={5} step={0.05} width="70px" pct
          />
        </div>

        {/* Cost escalation */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "fr" ? "Inflation charges" : "Cost escalation"}</span>
          <NumberField
            value={cfg.costEscalation || 0.02}
            onChange={function (v) { setCfg({ ...cfg, costEscalation: v }); }}
            min={0} max={0.50} step={0.01} width="70px" pct
          />
        </div>

        {/* Initial cash */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.cash_initial}</span>
          <NumberField
            value={initialCash}
            onChange={function (v) { setCfg({ ...cfg, initialCash: v }); }}
            min={0} max={10000000} step={5000} suf="EUR" width="120px"
          />
        </div>
      </div>

      {/* Projection Chart */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
            {lang === "fr" ? "Projection sur " + projYears + " an" + (projYears > 1 ? "s" : "") : projYears + "-Year Projection"}
          </h3>
          {proj.zeroMonth ? (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-full)", background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error-border)" }}>
              {lang === "fr" ? "Cash à zéro : mois " + proj.zeroMonth : "Cash zero: month " + proj.zeroMonth}
            </span>
          ) : null}
          {proj.beMonth ? (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-full)", background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)" }}>
              {lang === "fr" ? "Break-even : mois " + proj.beMonth : "Break-even: month " + proj.beMonth}
            </span>
          ) : null}
        </div>
        <ProjectionChart rows={proj.rows} t={t} lang={lang} />
      </Card>

      {/* Year summary cards */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(proj.years.length, 3) + ", 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {proj.years.map(function (yr) {
          var margin = yr.revenue > 0 ? yr.ebitda / yr.revenue : 0;
          return (
            <Card key={yr.year}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                  {lang === "fr" ? "Année " + yr.year : "Year " + yr.year}
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
                { label: lang === "fr" ? "Revenus" : "Revenue", value: eur(yr.revenue), color: "var(--color-success)" },
                { label: lang === "fr" ? "Charges" : "Costs", value: eur(yr.costs), color: "var(--text-primary)" },
                { label: "EBITDA", value: eur(yr.ebitda), color: yr.ebitda >= 0 ? ok : err, bold: true },
                { label: lang === "fr" ? "Trésorerie fin" : "End cash", value: eur(yr.endCash), color: yr.endCash >= 0 ? "var(--text-primary)" : err },
              ].map(function (row, i) {
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "var(--sp-1) 0",
                    borderBottom: i < 3 ? "1px solid var(--border-light)" : "none",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.color, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                  </div>
                );
              })}
            </Card>
          );
        })}
      </div>

      {/* Monthly table */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.table_title}</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {[t.col_month, t.col_rev, t.col_costs, t.col_net, t.col_cum].map(function (h, i) {
                  return (
                    <th key={i} style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: i === 0 ? "left" : "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  );
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
          {lang === "fr"
            ? "Projection basée sur une croissance annuelle de " + pct(cfg.revenueGrowthRate || 0.10) + " du CA et une inflation des charges de " + pct(cfg.costEscalation || 0.02) + ". Les montants sont composés mensuellement."
            : "Projection based on " + pct(cfg.revenueGrowthRate || 0.10) + " annual revenue growth and " + pct(cfg.costEscalation || 0.02) + " cost escalation. Amounts compounded monthly."}
        </div>
      </Card>

    </PageLayout>
  );
}
