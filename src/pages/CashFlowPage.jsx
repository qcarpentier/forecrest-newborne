import { brand, ok, err } from "../constants/colors";
import { Card, NumberField, PageLayout } from "../components";
import { InfoTip } from "../components/Tooltip";
import { eur, pct } from "../utils";
import { useT } from "../context";

function RunwayChart({ monthlyNet, initialCash, t }) {
  var months = 24;
  var pts = [];
  var cum = initialCash;
  for (var m = 0; m <= months; m++) {
    pts.push(cum);
    cum += monthlyNet;
  }

  var peak = Math.max.apply(null, pts);
  var trough = Math.min.apply(null, pts);
  if (peak === trough) { peak += 1; trough -= 1; }
  var range = peak - trough;

  var W = 560, H = 160, pL = 64, pR = 20, pT = 12, pB = 28;
  var cW = W - pL - pR, cH = H - pT - pB;
  function xp(m) { return pL + (m / months) * cW; }
  function yp(v) { return pT + cH * (1 - (v - trough) / range); }

  var projPath = pts.map(function (v, m) { return (m === 0 ? "M" : "L") + xp(m).toFixed(1) + " " + yp(v).toFixed(1); }).join(" ");
  var areaBase = yp(Math.max(trough, 0));
  var areaPath = projPath + " L" + xp(months).toFixed(1) + " " + areaBase.toFixed(1) + " L" + pL.toFixed(1) + " " + areaBase.toFixed(1) + " Z";

  var zeroY = yp(0);
  var showZero = zeroY >= pT && zeroY <= pT + cH;

  var lineColor = monthlyNet >= 0 ? "var(--brand)" : "var(--color-error)";

  var beMonth = null;
  if (initialCash > 0 && monthlyNet < 0) {
    var c = initialCash;
    for (var m2 = 1; m2 <= months; m2++) {
      c += monthlyNet;
      if (c <= 0) { beMonth = m2; break; }
    }
  }

  function fmtY(v) {
    var abs = Math.abs(v);
    var sign = v < 0 ? "-" : "";
    if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1) + "M";
    if (abs >= 1000) return sign + Math.round(abs / 1000) + "k";
    return sign + Math.round(abs);
  }

  var gridVals = [0, 0.25, 0.5, 0.75, 1].map(function (f) { return trough + range * f; });

  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" style={{ overflow: "visible", display: "block" }}>
      {gridVals.map(function (v, i) {
        return (
          <g key={i}>
            <line x1={pL} y1={yp(v)} x2={W - pR} y2={yp(v)} stroke="var(--border-light)" strokeWidth={1} />
            <text x={pL - 5} y={yp(v) + 4} textAnchor="end" fontSize={9} fill="var(--text-faint)">{fmtY(v)}</text>
          </g>
        );
      })}
      {showZero && (
        <line x1={pL} y1={zeroY} x2={W - pR} y2={zeroY} stroke="var(--border-strong)" strokeWidth={1.5} strokeDasharray="5 3" />
      )}
      {beMonth && (
        <g>
          <line x1={xp(beMonth)} y1={pT} x2={xp(beMonth)} y2={pT + cH} stroke="var(--color-error)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={xp(beMonth)} y={pT - 2} textAnchor="middle" fontSize={9} fill="var(--color-error)">{t.chart_zero_month + beMonth}</text>
        </g>
      )}
      <path d={areaPath} fill={lineColor} fillOpacity={0.07} />
      <path d={projPath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={pL} y1={pT + cH} x2={W - pR} y2={pT + cH} stroke="var(--border)" strokeWidth={1} />
      {[0, 6, 12, 18, 24].map(function (m) {
        return (
          <g key={m}>
            <line x1={xp(m)} y1={pT + cH} x2={xp(m)} y2={pT + cH + 4} stroke="var(--border-strong)" strokeWidth={1} />
            <text x={xp(m)} y={H - 2} textAnchor="middle" fontSize={9} fill="var(--text-faint)">{"M" + m}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function CashFlowPage({
  arrV, totalRevenue, monthlyCosts, annC, ebitda, netP, totS, cfg, setCfg,
}) {
  var t = useT().cashflow;

  var monthlyRev = totalRevenue / 12;
  var monthlyNet = monthlyRev - monthlyCosts;
  var isBurning = monthlyNet < 0;
  var initialCash = cfg.initialCash || 0;
  var runway = isBurning && initialCash > 0
    ? Math.floor(initialCash / Math.abs(monthlyNet))
    : null;

  var avgPerClient = totS > 0 ? arrV / totS : 0;
  var beClients = avgPerClient > 0 ? Math.ceil(annC / avgPerClient) : null;
  var beNeeded = beClients !== null ? Math.max(0, beClients - totS) : null;
  var beProgress = annC > 0 ? Math.min(arrV / annC, 1) : 1;

  var months12 = [];
  var cum = initialCash;
  for (var m = 1; m <= 12; m++) {
    cum += monthlyNet;
    months12.push({ m: m, rev: monthlyRev, cost: monthlyCosts, net: monthlyNet, cum: cum });
  }

  var beMonth = null;
  if (isBurning && initialCash > 0) {
    var c = initialCash;
    for (var m2 = 1; m2 <= 24; m2++) {
      c += monthlyNet;
      if (c <= 0) { beMonth = m2; break; }
    }
  }

  return (
    <PageLayout title={t.title} subtitle={t.subtitle}>

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
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            </Card>
          );
        })}
      </div>

      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)", marginBottom: "var(--gap-lg)" }}>

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.be_title}</h3>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.be_status}</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "2px 10px",
              background: isBurning ? "var(--color-error-bg)" : "var(--color-success-bg)",
              color: isBurning ? "var(--color-error)" : ok,
              borderRadius: "var(--r-full)",
            }}>
              {isBurning ? t.be_burning : t.be_ok}
            </span>
          </div>

          <div style={{ height: 6, background: "var(--bg-accordion)", borderRadius: 3, marginBottom: "var(--sp-3)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct(beProgress), background: beProgress >= 1 ? ok : "var(--brand)", borderRadius: 3, transition: "width 300ms" }} />
          </div>

          {[
            [t.be_arr_current, eur(arrV), brand],
            [t.be_arr_target, eur(annC), null],
            [t.be_clients_current, totS, null],
            [t.be_clients_needed, beClients !== null ? beClients : "--", null],
            [t.be_clients_todo, beNeeded !== null ? (beNeeded === 0 ? t.be_done : "+" + beNeeded) : "--", beNeeded === 0 ? ok : null],
          ].map(function (r, i, a) {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--sp-2)", paddingBottom: i < a.length - 1 ? "var(--sp-2)" : 0, borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r[0]}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: r[2] || "var(--text-primary)" }}>{String(r[1])}</span>
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.cash_title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-4)", lineHeight: 1.5 }}>{t.cash_hint}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.cash_initial}</span>
            <NumberField
              value={initialCash}
              onChange={function (v) { setCfg({ ...cfg, initialCash: v }); }}
              min={0} max={10000000} step={5000} suf="EUR" width="130px"
            />
          </div>

          {isBurning ? (
            <div style={{ background: beMonth ? "var(--color-error-bg)" : "var(--bg-accordion)", border: "1px solid " + (beMonth ? "var(--color-error-border)" : "var(--border)"), borderRadius: "var(--r-md)", padding: "var(--sp-3)" }}>
              {runway !== null ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-error)", marginBottom: 4 }}>
                    {t.runway_label} {runway} {t.runway_months}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.runway_hint(eur(Math.abs(monthlyNet)))}</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>{t.runway_no_cash}</div>
              )}
            </div>
          ) : (
            <div style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success-border, var(--border))", borderRadius: "var(--r-md)", padding: "var(--sp-3)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: ok, marginBottom: 4 }}>{t.surplus_label}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.surplus_hint(eur(Math.abs(monthlyNet)))}</div>
            </div>
          )}

          {beMonth && (
            <div style={{ marginTop: "var(--sp-3)", fontSize: 12, color: "var(--color-error)" }}>
              {t.zero_month(beMonth)}
            </div>
          )}
        </Card>
      </div>

      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{t.chart_title}</h3>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.chart_sub}</span>
        </div>
        <RunwayChart monthlyNet={monthlyNet} initialCash={initialCash} t={t} />
      </Card>

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
              {months12.map(function (row) {
                var isBeMonth = beMonth && row.m === beMonth;
                return (
                  <tr key={row.m} style={{ borderBottom: "1px solid var(--border-light)", background: isBeMonth ? "var(--color-error-bg)" : "transparent" }}>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--text-secondary)", fontWeight: 500 }}>{"M" + row.m}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", color: "var(--text-primary)" }}>{eur(row.rev)}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", color: "var(--text-primary)" }}>{eur(row.cost)}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 600, color: row.net >= 0 ? ok : "var(--color-error)" }}>{eur(row.net)}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, color: row.cum >= 0 ? "var(--text-primary)" : "var(--color-error)" }}>{eur(row.cum)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 600, color: "var(--text-secondary)" }}>{t.total_label}</td>
                <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, color: brand }}>{eur(monthlyRev * 12)}</td>
                <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>{eur(monthlyCosts * 12)}</td>
                <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, color: monthlyNet >= 0 ? ok : "var(--color-error)" }}>{eur(monthlyNet * 12)}</td>
                <td style={{ padding: "var(--sp-2) var(--sp-3)", textAlign: "right", fontWeight: 700, color: months12[11] && months12[11].cum >= 0 ? "var(--text-primary)" : "var(--color-error)" }}>
                  {months12.length === 12 ? eur(months12[11].cum) : "--"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ marginTop: "var(--sp-3)", fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>{t.table_note}</div>
      </Card>

      <div style={{ height: "var(--gap-lg)" }} />
    </PageLayout>
  );
}
