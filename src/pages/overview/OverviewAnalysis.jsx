import { Card, Row } from "../../components";
import { DevVal } from "../../components";
import { InfoTip } from "../../components/Tooltip";
import { eur, pct } from "../../utils";
import { ok, err, warn } from "../../constants/colors";
import { Gauge, ChartLine } from "@phosphor-icons/react";
import { linkSettings } from "../../utils/linkSettings";
import { SectionHeader, ProgressBar, StatusBadge, HealthDonut } from "./helpers";

export default function OverviewAnalysis({
  t, lang,
  totalRevenue, monthlyCosts, ebitda, netP,
  monthlyRevenue, isProfitable, netBurn,
  ebitdaMargin, netMargin,
  health,
  bizKpis, cfg,
  setTab, onNavigate,
}) {
  return (
    <>
      {/* ── SANTÉ FINANCIÈRE ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<Gauge size={18} weight="bold" />} title={t.section_health} sub={t.section_health_sub} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* Health metrics */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t.health_title}</h3>
              <StatusBadge label={isProfitable ? t.health_profitable : t.health_deficit} positive={isProfitable} />
            </div>
            {[
              { label: t.health_ebitda_margin, value: ebitdaMargin, pctVal: pct(ebitdaMargin), color: ebitdaMargin >= 0.20 ? ok : ebitdaMargin >= 0 ? warn : err, tip: t.tip_ebitda_margin },
              { label: t.health_net_margin, value: netMargin, pctVal: pct(netMargin), color: netMargin >= 0.10 ? ok : netMargin >= 0 ? warn : err, tip: t.tip_net_margin },
            ].map(function (bar) {
              return (
                <div key={bar.label} style={{ marginBottom: "var(--sp-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                      {bar.label}
                      {bar.tip ? <InfoTip tip={bar.tip} width={240} /> : null}
                    </span>
                    <span style={{ fontWeight: 700, color: bar.color }}>{bar.pctVal}</span>
                  </div>
                  <ProgressBar value={Math.max(0, Math.min(bar.value, 1))} color={bar.color} height={6} />
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
              <Row label={t.health_burn} value={isProfitable ? "0 EUR" : <DevVal v={eur(netBurn)} f={eur(monthlyCosts) + " - " + eur(monthlyRevenue) + " = " + eur(netBurn)} />} color={isProfitable ? ok : err} tip={t.tip_burn} />
              <Row label={t.health_coverage} value={monthlyCosts > 0 ? <DevVal v={pct(Math.min(monthlyRevenue / monthlyCosts, 1))} f={eur(monthlyRevenue) + " / " + eur(monthlyCosts) + " = " + pct(monthlyRevenue / monthlyCosts)} /> : "–"} color={monthlyRevenue >= monthlyCosts ? ok : warn} last tip={t.tip_coverage} />
            </div>
          </Card>

          {/* Health score donut */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-3)" }}>{t.simple_health_title}</h3>
            <HealthDonut
              score={health.total}
              items={[
                { label: t.simple_health_profitability, value: health.profitability },
                { label: t.simple_health_liquidity, value: health.liquidity },
                { label: t.simple_health_solvency, value: health.solvency },
              ]}
            />
          </Card>
        </div>
      </section>

      {/* ── Business-Type KPIs ── */}
      {bizKpis && bizKpis.kpis && bizKpis.kpis.length > 0 ? (
        <section style={{ marginBottom: "var(--sp-8)" }}>
          <SectionHeader
            icon={<ChartLine size={18} weight="bold" />}
            title={(t.section_metrics || "Métriques") + " " + (t["biz_" + cfg.businessType] || cfg.businessType)}
            sub={t.section_metrics_sub || linkSettings(t.section_saas_sub || "", function () { if (onNavigate) onNavigate("set"); else setTab("set"); })}
          />
          <Card>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "var(--sp-4)",
            }}>
              {bizKpis.kpis.map(function (kpi) {
                var label = t["kpi_" + cfg.businessType + "_" + kpi.id] || t["kpi_" + kpi.id] || kpi.id.replace(/_/g, " ");
                var displayValue = "–";
                if (kpi.value != null && !isNaN(kpi.value) && kpi.value !== 0) {
                  if (kpi.format === "eur") displayValue = eur(kpi.value);
                  else if (kpi.format === "pct") displayValue = pct(kpi.value);
                  else if (kpi.format === "ratio") displayValue = kpi.value.toFixed(1) + "x";
                  else if (kpi.format === "months") displayValue = kpi.value.toFixed(1) + " mois";
                  else displayValue = typeof kpi.value === "number" ? kpi.value.toLocaleString() : String(kpi.value);
                }
                var color = "var(--text-primary)";
                if (kpi.format === "pct" && kpi.value > 0) color = "var(--color-success)";
                if (kpi.id === "churn_rate" || kpi.id === "cart_abandonment" || kpi.id === "return_rate" || kpi.id === "shrinkage_rate") {
                  color = kpi.value > 0.10 ? err : kpi.value > 0.05 ? warn : ok;
                }
                if (kpi.id === "quick_ratio" || kpi.id === "ltv_cac" || kpi.id === "pipeline_coverage") {
                  color = kpi.value >= 3 ? ok : kpi.value >= 1 ? warn : err;
                }
                if (kpi.id === "rule_of_40") {
                  color = kpi.value >= 40 ? ok : kpi.value >= 20 ? warn : err;
                }
                if (kpi.id === "utilization") {
                  color = kpi.value >= 0.75 ? ok : kpi.value >= 0.50 ? warn : err;
                }

                var tip = t["tip_kpi_" + kpi.id];

                return (
                  <div key={kpi.id} style={{
                    padding: "var(--sp-3)",
                    background: "var(--bg-accordion)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-light)",
                  }}>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-1)", display: "flex", alignItems: "center", gap: 2 }}>
                      {label}
                      {tip ? <InfoTip tip={tip} width={260} /> : null}
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, color: color,
                      fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
                      letterSpacing: "-0.5px",
                    }}>
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      ) : null}
    </>
  );
}
