import { useMemo } from "react";
import { Card, PageLayout } from "../components";
import { eur, pct } from "../utils";
import { useT } from "../context";

function RatioCard({ label, value, format, tip, thresholds, invertThreshold }) {
  var display = value == null || !isFinite(value) ? "-"
    : format === "pct" ? pct(value)
    : format === "eur" ? eur(value)
    : format === "months" ? Math.round(value) + " mo"
    : format === "x" ? value.toFixed(2) + "x"
    : value.toFixed(2);
  var color = "var(--text-primary)";
  if (thresholds && value != null && isFinite(value)) {
    if (invertThreshold) {
      if (value <= thresholds.good) color = "var(--color-success)";
      else if (value <= thresholds.ok) color = "var(--color-warning)";
      else color = "var(--color-error)";
    } else {
      if (value >= thresholds.good) color = "var(--color-success)";
      else if (value >= thresholds.ok) color = "var(--color-warning)";
      else color = "var(--color-error)";
    }
  }
  return (
    <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--sp-2)", lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{display}</div>
      {tip ? <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-1)" }}>{tip}</div> : null}
    </div>
  );
}

function SectionLabel({ children, desc }) {
  return (
    <div style={{ marginBottom: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</div>
      {desc ? <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: "var(--sp-1)", lineHeight: 1.4 }}>{desc}</div> : null}
    </div>
  );
}

export default function RatiosPage({ cfg, totalRevenue, monthlyCosts, ebitda, netP, resLeg, debts, totS, arrV, salCosts, esopMonthly, esopEnabled, extraStreamsMRR }) {
  var t = useT().ratios;

  var computed = useMemo(function () {
    // Equity
    var retainedEarnings = netP - resLeg;
    var equity = cfg.capitalSocial + resLeg + retainedEarnings;

    // Debt
    var totalDebt = 0;
    var annualDebtService = 0;
    debts.forEach(function (d) {
      if (d.amount <= 0 || d.duration <= d.elapsed) return;
      var r = d.rate / 12;
      var bal = d.amount;
      if (r > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var powE = Math.pow(1 + r, d.elapsed);
        bal = d.amount * (pow - powE) / (pow - 1);
        var payment = d.amount * r * pow / (pow - 1);
        annualDebtService += payment * 12;
      } else if (d.duration > 0) {
        bal = d.amount - (d.amount / d.duration) * d.elapsed;
        annualDebtService += (d.amount / d.duration) * 12;
      }
      totalDebt += bal;
    });

    var totalPassif = equity + totalDebt;
    var cash = (cfg.initialCash || 0) + Math.max(netP, 0);
    var totalActif = cash; // simplified (SaaS, minimal fixed assets)

    // Solvency ratios
    var solvency = totalPassif > 0 ? equity / totalPassif : 0;
    var autonomy = totalActif > 0 ? equity / totalActif : 0;
    var leverage = equity > 0 ? totalDebt / equity : 0;

    // Liquidity ratios (SaaS: no stock, current assets = cash)
    var debtCT = 0;
    debts.forEach(function (d) {
      if (d.amount <= 0) return;
      var rem = d.duration - d.elapsed;
      if (rem > 0 && rem <= 12) {
        var r = d.rate / 12;
        if (r > 0) {
          var pow = Math.pow(1 + r, d.duration);
          var powE = Math.pow(1 + r, d.elapsed);
          debtCT += d.amount * (pow - powE) / (pow - 1);
        } else {
          debtCT += d.amount - (d.amount / d.duration) * d.elapsed;
        }
      }
    });
    var monthlyLiabilities = monthlyCosts + (debtCT > 0 ? debtCT / 12 : 0);
    var currentRatio = monthlyLiabilities > 0 ? cash / (monthlyLiabilities * 3) : 0; // 3 months of liabilities
    var acidRatio = currentRatio; // SaaS: no inventory

    // Profitability ratios
    var roe = equity > 0 ? netP / equity : 0;
    var roa = totalActif > 0 ? netP / totalActif : 0;
    var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
    var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;

    // DSCR
    var dscr = annualDebtService > 0 ? ebitda / annualDebtService : null;

    // SaaS metrics
    var arpuMonthly = totS > 0 ? (arrV / 12 + (extraStreamsMRR || 0)) / totS : 0;
    var churn = cfg.churnMonthly || 0.03;
    var ltv = churn > 0 ? arpuMonthly / churn : 0;
    var cac = cfg.cacTarget || 0;
    var ltvCac = cac > 0 && ltv > 0 ? ltv / cac : 0;
    var payback = cac > 0 && arpuMonthly > 0 ? cac / arpuMonthly : 0;

    // Rule of 40
    var revenueGrowth = 0; // Would need historical data; placeholder
    var rule40 = revenueGrowth + ebitdaMargin;

    // Break-even
    var monthlyRevenue = totalRevenue / 12;
    var burnRate = monthlyCosts - monthlyRevenue;
    var runway = burnRate > 0 && (cfg.initialCash || 0) > 0 ? (cfg.initialCash || 0) / burnRate : null;

    return {
      equity, totalDebt, totalPassif, cash,
      solvency, autonomy, leverage,
      currentRatio, acidRatio,
      roe, roa, netMargin, ebitdaMargin,
      dscr, annualDebtService,
      arpuMonthly, ltv, ltvCac, payback, cac, churn,
      rule40, burnRate, runway,
    };
  }, [cfg, totalRevenue, monthlyCosts, ebitda, netP, resLeg, debts, totS, arrV, extraStreamsMRR]);

  return (
    <PageLayout title={t.title} subtitle={t.subtitle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>

        {/* Solvency */}
        <Card>
          <SectionLabel desc={t.section_solvency_desc}>{t.section_solvency}</SectionLabel>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.solvency} value={computed.solvency} format="pct" tip={t.solvency_tip} thresholds={{ good: 0.3, ok: 0.2 }} />
            <RatioCard label={t.autonomy} value={computed.autonomy} format="pct" tip={t.autonomy_tip} thresholds={{ good: 0.5, ok: 0.3 }} />
            <RatioCard label={t.leverage} value={computed.leverage} format="x" tip={t.leverage_tip} thresholds={{ good: 0.5, ok: 1 }} invertThreshold />
          </div>
        </Card>

        {/* Liquidity */}
        <Card>
          <SectionLabel desc={t.section_liquidity_desc}>{t.section_liquidity}</SectionLabel>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.current_ratio} value={computed.currentRatio} format="x" tip={t.current_ratio_tip} thresholds={{ good: 1.5, ok: 1.0 }} />
            <RatioCard label={t.acid_ratio} value={computed.acidRatio} format="x" tip={t.acid_ratio_tip} thresholds={{ good: 1.0, ok: 0.7 }} />
            {computed.dscr != null ? (
              <RatioCard label={t.dscr} value={computed.dscr} format="x" tip={t.dscr_tip} thresholds={{ good: 1.25, ok: 1.0 }} />
            ) : (
              <RatioCard label={t.dscr} value={null} format="x" tip={t.dscr_no_debt} />
            )}
          </div>
        </Card>

        {/* Profitability */}
        <Card>
          <SectionLabel desc={t.section_profitability_desc}>{t.section_profitability}</SectionLabel>
          <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.net_margin} value={computed.netMargin} format="pct" tip={t.net_margin_tip} thresholds={{ good: 0.1, ok: 0 }} />
            <RatioCard label={t.ebitda_margin} value={computed.ebitdaMargin} format="pct" tip={t.ebitda_margin_tip} thresholds={{ good: 0.2, ok: 0.05 }} />
            <RatioCard label={t.roe} value={computed.roe} format="pct" tip={t.roe_tip} thresholds={{ good: 0.15, ok: 0.05 }} />
            <RatioCard label={t.roa} value={computed.roa} format="pct" tip={t.roa_tip} thresholds={{ good: 0.1, ok: 0.03 }} />
          </div>
        </Card>

        {/* SaaS Metrics — visible for SaaS and e-commerce types */}
        {(cfg.businessType === "saas" || cfg.businessType === "ecommerce" || !cfg.businessType) ? (
          <Card>
            <SectionLabel desc={t.section_saas_desc}>{t.section_saas}</SectionLabel>
            <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--gap-md)" }}>
              <RatioCard label={t.arpu} value={computed.arpuMonthly} format="eur" tip={t.arpu_tip} />
              <RatioCard label={t.ltv} value={computed.ltv} format="eur" tip={t.ltv_tip} />
              <RatioCard label={t.ltv_cac} value={computed.ltvCac} format="x" tip={t.ltv_cac_tip} thresholds={{ good: 3, ok: 1.5 }} />
              <RatioCard label={t.payback} value={computed.payback} format="months" tip={t.payback_tip} />
            </div>
          </Card>
        ) : null}

        {/* Cash & Runway */}
        <Card>
          <SectionLabel desc={t.section_cash_desc}>{t.section_cash}</SectionLabel>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.cash_position} value={computed.cash} format="eur" tip={t.cash_tip} />
            <RatioCard label={t.burn_rate} value={computed.burnRate > 0 ? computed.burnRate : 0} format="eur" tip={computed.burnRate <= 0 ? t.burn_positive : t.burn_tip} />
            <RatioCard label={t.runway} value={computed.runway} format="months" tip={t.runway_tip} thresholds={computed.runway != null ? { good: 18, ok: 6 } : undefined} />
          </div>
        </Card>

      </div>
    </PageLayout>
  );
}
