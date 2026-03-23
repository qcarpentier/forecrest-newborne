import { useMemo } from "react";
import { Card, PageLayout } from "../components";
import { eur, pct } from "../utils";
import { useT } from "../context";

function RatioCard({ label, value, format, tip, thresholds, invertThreshold }) {
  var display = value == null || !isFinite(value) ? "-"
    : format === "pct" ? pct(value)
    : format === "eur" ? eur(value)
    : format === "months" ? Math.round(value) + " mo"
    : format === "days" ? Math.round(value) + " j"
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

export default function RatiosPage({ cfg, totalRevenue, monthlyCosts, ebitda, netP, resLeg, debts, sals, salCosts, stocks, esopMonthly, esopEnabled }) {
  var t = useT().ratios;
  var bizType = cfg.businessType || "other";

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
    var totalActif = cash;

    // Solvency ratios
    var solvency = totalPassif > 0 ? equity / totalPassif : 0;
    var autonomy = totalActif > 0 ? equity / totalActif : 0;
    var leverage = equity > 0 ? totalDebt / equity : 0;

    // Liquidity ratios
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
    var currentRatio = monthlyLiabilities > 0 ? cash / (monthlyLiabilities * 3) : 0;
    var acidRatio = currentRatio;

    // Profitability ratios
    var roe = equity > 0 ? netP / equity : 0;
    var roa = totalActif > 0 ? netP / totalActif : 0;
    var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
    var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;

    // DSCR
    var dscr = annualDebtService > 0 ? ebitda / annualDebtService : null;

    // Business metrics
    var employeeCount = (sals || []).filter(function (s) { return s.net > 0; }).length;
    var revPerEmployee = employeeCount > 0 ? totalRevenue / employeeCount : null;
    var salaryRatio = totalRevenue > 0 ? (salCosts * 12) / totalRevenue : 0;
    var costRatio = totalRevenue > 0 ? (monthlyCosts * 12) / totalRevenue : 0;

    // Break-even
    var monthlyRevenue = totalRevenue / 12;
    var burnRate = monthlyCosts - monthlyRevenue;
    var runway = burnRate > 0 && (cfg.initialCash || 0) > 0 ? (cfg.initialCash || 0) / burnRate : null;

    // BFR (Working Capital Requirement)
    var dso = cfg.paymentTermsClient || 30; // Days Sales Outstanding
    var dpo = cfg.paymentTermsSupplier || 30; // Days Payable Outstanding
    var receivables = totalRevenue > 0 ? (totalRevenue / 365) * dso : 0;
    var payables = monthlyCosts > 0 ? (monthlyCosts * 12 / 365) * dpo : 0;

    // DIO — Days Inventory Outstanding
    var stockValue = 0;
    var monthlyCogs = 0;
    (stocks || []).forEach(function (s) {
      stockValue += (s.unitCost || 0) * (s.quantity || 0);
      monthlyCogs += (s.unitCost || 0) * (s.monthlyUsage || 0);
    });
    var annualCogs = monthlyCogs * 12;
    var dio = annualCogs > 0 ? (stockValue / annualCogs) * 365 : 0;

    var bfr = receivables + stockValue - payables;
    var cashConversionCycle = dso + dio - dpo;

    return {
      equity, totalDebt, totalPassif, cash,
      solvency, autonomy, leverage,
      currentRatio, acidRatio,
      roe, roa, netMargin, ebitdaMargin,
      dscr, annualDebtService,
      revPerEmployee, salaryRatio, costRatio, employeeCount,
      burnRate, runway,
      dso, dpo, dio, receivables, payables, stockValue, bfr, cashConversionCycle,
    };
  }, [cfg, totalRevenue, monthlyCosts, ebitda, netP, resLeg, debts, sals, salCosts, stocks]);

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

        {/* Business Metrics */}
        <Card>
          <SectionLabel desc={t["section_biz_desc_" + bizType] || t.section_biz_desc}>{t.section_biz}</SectionLabel>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.rev_per_employee} value={computed.revPerEmployee} format="eur" tip={t["rev_per_employee_tip_" + bizType] || t.rev_per_employee_tip} />
            <RatioCard label={t.salary_ratio} value={computed.salaryRatio} format="pct" tip={t.salary_ratio_tip} thresholds={{ good: 0.3, ok: 0.5 }} invertThreshold />
            <RatioCard label={t.cost_ratio} value={computed.costRatio} format="pct" tip={t.cost_ratio_tip} thresholds={{ good: 0.7, ok: 0.9 }} invertThreshold />
          </div>
        </Card>

        {/* Working Capital (BFR) */}
        <Card>
          <SectionLabel desc={t.section_bfr_desc}>{t.section_bfr}</SectionLabel>
          <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.dso} value={computed.dso} format="days" tip={t.dso_tip} thresholds={{ good: 30, ok: 60 }} invertThreshold />
            <RatioCard label={t.dpo} value={computed.dpo} format="days" tip={t.dpo_tip} thresholds={{ good: 45, ok: 30 }} />
            <RatioCard label={t.dio} value={computed.dio} format="days" tip={computed.stockValue > 0 ? t.dio_tip : t.dio_no_stock} thresholds={computed.stockValue > 0 ? { good: 30, ok: 60 } : undefined} invertThreshold />
            <RatioCard label={t.cash_conversion} value={computed.cashConversionCycle} format="days" tip={t.cash_conversion_tip} thresholds={{ good: 30, ok: 60 }} invertThreshold />
          </div>
          <div style={{ marginTop: "var(--gap-md)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioCard label={t.receivables} value={computed.receivables} format="eur" tip={t.receivables_tip} />
            <RatioCard label={t.payables} value={computed.payables} format="eur" tip={t.payables_tip} />
            <RatioCard label={t.bfr} value={computed.bfr} format="eur" tip={t.bfr_tip} />
          </div>
        </Card>

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
