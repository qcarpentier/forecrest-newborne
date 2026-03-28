import { useMemo } from "react";
import { TrendUp, Heartbeat, CurrencyCircleDollar, Scales, ChartLineUp, Hourglass, Users, ArrowsClockwise, Lightbulb, Bank, Target, Compass, WarningCircle } from "@phosphor-icons/react";
import { Card, PageLayout, KpiCard, Badge, ExplainerBox, FinanceLink } from "../../components";
import { eur, eurShort, pct } from "../../utils";
import { useT, useLang } from "../../context";

/* ── Status color helper ──────────────────────────────────────── */

function statusColor(value, thresholds, invert) {
  if (value == null || !isFinite(value)) return { color: "var(--text-faint)", status: "neutral" };
  if (invert) {
    if (value <= thresholds.good) return { color: "var(--color-success)", status: "good" };
    if (value <= thresholds.ok) return { color: "var(--color-warning)", status: "warning" };
    return { color: "var(--color-error)", status: "critical" };
  }
  if (value >= thresholds.good) return { color: "var(--color-success)", status: "good" };
  if (value >= thresholds.ok) return { color: "var(--color-warning)", status: "warning" };
  return { color: "var(--color-error)", status: "critical" };
}

function statusLabel(status, t) {
  if (status === "good") return t.status_good;
  if (status === "warning") return t.status_warning;
  if (status === "critical") return t.status_critical;
  return "";
}

function statusBadgeColor(status) {
  if (status === "good") return "green";
  if (status === "warning") return "amber";
  if (status === "critical") return "red";
  return "gray";
}

/* ── Section label ────────────────────────────────────────────── */

function SectionHeader({ icon, title, desc }) {
  var Icon = icon;
  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
        {Icon ? <Icon size={18} weight="duotone" color="var(--brand)" /> : null}
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{title}</div>
      </div>
      {desc ? <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, paddingLeft: 26 }}>{desc}</div> : null}
    </div>
  );
}

/* ── Ratio row item ───────────────────────────────────────────── */

function RatioRow({ label, techLabel, techTerm, value, format, explanation, thresholds, invert, t, lk, noData, displayOverride, statusOverride }) {
  var display = displayOverride ? displayOverride
    : noData ? "-"
    : value == null || !isFinite(value) ? "-"
    : format === "pct" ? pct(value)
    : format === "eur" ? eurShort(value)
    : format === "months" ? Math.round(value) + " " + t.kpi_months
    : format === "days" ? Math.round(value) + (lk === "fr" ? " j" : " d")
    : format === "x" ? value.toFixed(2) + "x"
    : value.toFixed(2);

  var sc = statusOverride ? statusOverride
    : thresholds && !noData ? statusColor(value, thresholds, invert) : { color: "var(--text-primary)", status: "neutral" };

  return (
    <div style={{
      padding: "var(--sp-4)",
      background: "var(--bg-accordion)",
      borderRadius: "var(--r-md)",
      display: "flex", flexDirection: "column", gap: "var(--sp-2)",
    }}>
      {/* Label with FinanceLink style (text color, underline only) */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
        {techTerm ? (
          <FinanceLink term={techTerm} label={label} subtle />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
        )}
        {techLabel ? (
          <span style={{ fontSize: 10, color: "var(--text-faint)", fontStyle: "italic" }}>{techLabel}</span>
        ) : null}
      </div>

      {/* Value + status dot */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-3)" }}>
        {display === "-" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
            <WarningCircle size={16} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
              {lk === "fr" ? "Non calculable" : "Not calculable"}
            </span>
          </span>
        ) : (
          <span style={{
            fontSize: 26, fontWeight: 800, color: sc.color, lineHeight: 1,
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            fontVariantNumeric: "tabular-nums",
          }}>{display}</span>
        )}
        {display !== "-" && sc.status !== "neutral" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: sc.color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
            {statusLabel(sc.status, t)}
          </span>
        ) : null}
      </div>

      {/* Explanation */}
      {explanation ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
          {explanation}
        </div>
      ) : null}
    </div>
  );
}

/* ── Gauge bar ────────────────────────────────────────────────── */

function GaugeBar({ value, max, color, label }) {
  var pctW = max > 0 && value != null && isFinite(value) ? Math.min(value / max, 1) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
      {label ? <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{label}</span> : null}
      <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: pctW + "%",
          background: color || "var(--brand)",
          borderRadius: 4, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

/* ── Runway timeline bar ──────────────────────────────────────── */

function RunwayBar({ months, t }) {
  var maxMonths = 24;
  var capped = months != null && isFinite(months) ? Math.min(months, maxMonths) : 0;
  var pctW = (capped / maxMonths) * 100;
  var sc = statusColor(months, { good: 12, ok: 6 }, false);

  return (
    <div style={{ marginTop: "var(--sp-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-1)" }}>
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.runway_bar_label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>
          {months != null && isFinite(months) ? Math.round(months) + " " + t.runway_months : "-"}
        </span>
      </div>
      <div style={{ height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", width: pctW + "%",
          background: sc.color,
          borderRadius: 5, transition: "width 0.5s ease",
        }} />
        {/* Markers at 6 and 12 months */}
        <div style={{ position: "absolute", top: 0, left: (6 / maxMonths * 100) + "%", width: 1, height: "100%", background: "var(--text-faint)", opacity: 0.3 }} />
        <div style={{ position: "absolute", top: 0, left: (12 / maxMonths * 100) + "%", width: 1, height: "100%", background: "var(--text-faint)", opacity: 0.3 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>0</span>
        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>6</span>
        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>12</span>
        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>18</span>
        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>24+</span>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

export default function RatiosPage({ cfg, totalRevenue, monthlyCosts, ebit, netP, resLeg, debts, sals, salCosts, stocks, esopMonthly, esopEnabled }) {
  var t = useT().ratios;
  var { lang } = useLang();
  var lk = lang;
  var bizType = cfg.businessType || "other";

  var computed = useMemo(function () {
    /* Equity */
    var retainedEarnings = netP - resLeg;
    var equity = cfg.capitalSocial + resLeg + retainedEarnings;

    /* Debt */
    var totalDebt = 0;
    var annualDebtService = 0;
    var annualInterest = 0;
    debts.forEach(function (d) {
      if (d.amount <= 0 || d.duration <= d.elapsed) return;
      var r = d.rate / 12;
      var bal = d.amount;
      if (r > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var powE = Math.pow(1 + r, d.elapsed);
        bal = d.amount * (pow - powE) / (pow - 1);
        var payment = d.amount * r * pow / (pow - 1);
        var interestPortion = bal * r;
        annualDebtService += payment * 12;
        annualInterest += interestPortion * 12;
      } else if (d.duration > 0) {
        bal = d.amount - (d.amount / d.duration) * d.elapsed;
        annualDebtService += (d.amount / d.duration) * 12;
      }
      totalDebt += bal;
    });

    var totalPassif = equity + totalDebt;

    /* BFR — compute early so totalActif can include receivables + stock */
    var dso = cfg.paymentTermsClient || 30;
    var dpo = cfg.paymentTermsSupplier || 30;
    var receivables = totalRevenue > 0 ? (totalRevenue / 365) * dso : 0;
    var payables = monthlyCosts > 0 ? (monthlyCosts * 12 / 365) * dpo : 0;
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

    /* Cash & total assets — losses reduce cash; floor at 0 */
    var cash = Math.max((cfg.initialCash || 0) + netP, 0);
    var totalActif = cash + receivables + stockValue;

    /* Solvency — handle negative equity (startup losses exceed capital) */
    var leverage;
    if (totalDebt <= 0) {
      leverage = 0;
    } else if (equity <= 0) {
      /* Negative or zero equity with debt = critical (ratio meaningless, show large value) */
      leverage = totalDebt > 0 ? 999 : 0;
    } else {
      leverage = totalDebt / equity;
    }
    var negativeEquity = equity <= 0;

    /* Liquidity */
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
    var annualLiabilities = (monthlyCosts * 12) + debtCT;
    var currentRatio = annualLiabilities > 0 ? (cash + receivables) / annualLiabilities : null;
    var quickRatio = annualLiabilities > 0 ? cash / annualLiabilities : null;

    /* Profitability */
    var roe = equity !== 0 ? netP / equity : null;
    var roa = totalActif > 0 ? netP / totalActif : 0;
    var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
    var ebitMargin = totalRevenue > 0 ? ebit / totalRevenue : 0;

    /* DSCR */
    var dscr = annualDebtService > 0 ? ebit / annualDebtService : null;

    /* Interest coverage */
    var interestCoverage = annualInterest > 0 ? ebit / annualInterest : null;

    /* Business metrics */
    var employeeCount = (sals || []).filter(function (s) { return s.net > 0; }).length;
    var revPerEmployee = employeeCount > 0 ? totalRevenue / employeeCount : null;
    var salaryRatio = totalRevenue > 0 ? (salCosts * 12) / totalRevenue : 0;
    var costRatio = totalRevenue > 0 ? (monthlyCosts * 12) / totalRevenue : 0;

    /* Break-even & Runway */
    var monthlyRevenue = totalRevenue / 12;
    var burnRate = monthlyCosts - monthlyRevenue;
    var runway = burnRate > 0 && cash > 0 ? cash / burnRate : null;

    return {
      equity, totalDebt, totalPassif, cash, totalActif,
      leverage, negativeEquity,
      currentRatio, quickRatio,
      roe, roa, netMargin, ebitMargin,
      dscr, annualDebtService, annualInterest, interestCoverage,
      revPerEmployee, salaryRatio, costRatio, employeeCount,
      burnRate, runway,
      dso, dpo, dio, receivables, payables, stockValue, bfr, cashConversionCycle,
    };
  }, [cfg, totalRevenue, monthlyCosts, ebit, netP, resLeg, debts, sals, salCosts, stocks]);

  /* KPI card helpers */
  var ebitMarginSc = statusColor(computed.ebitMargin, { good: 0.15, ok: 0.05 }, false);
  var runwaySc = computed.runway != null ? statusColor(computed.runway, { good: 12, ok: 6 }, false) : { color: "var(--color-success)", status: "good" };
  var currentRatioSc = computed.currentRatio != null ? statusColor(computed.currentRatio, { good: 1.5, ok: 1.0 }, false) : { color: "var(--color-success)", status: "good" };
  var debtSc = computed.negativeEquity ? { color: "var(--color-error)", status: "critical" } : statusColor(computed.leverage, { good: 1, ok: 2 }, true);

  var runwayDisplay = computed.burnRate <= 0
    ? t.kpi_no_burn
    : computed.runway != null
      ? Math.round(computed.runway) + " " + t.kpi_months
      : "-";

  var debtDisplay = computed.totalDebt <= 0
    ? t.kpi_no_debt
    : computed.negativeEquity
      ? "-"
      : computed.leverage.toFixed(2) + "x";

  return (
    <PageLayout title={t.title} subtitle={t.subtitle} icon={TrendUp} iconColor="#06B6D4">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>

        {/* ── KPI cards ──────────────────────────────────────── */}
        <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--gap-md)" }}>
          <KpiCard
            label={t.kpi_ebitda_margin}
            value={pct(computed.ebitMargin)}
            color={ebitMarginSc.color}
            glossaryKey="ebitda_margin"
          />
          <KpiCard
            label={t.kpi_runway}
            value={runwayDisplay}
            color={runwaySc.color}
            glossaryKey="runway"
          />
          <KpiCard
            label={t.kpi_current_ratio}
            value={computed.currentRatio != null ? computed.currentRatio.toFixed(2) + "x" : "-"}
            color={currentRatioSc.color}
            glossaryKey="current_ratio"
          />
          <KpiCard
            label={t.kpi_debt_weight}
            value={debtDisplay}
            color={debtSc.color}
            glossaryKey="debt_to_equity"
          />
        </div>

        {/* ── Section 1: Profitability ───────────────────────── */}
        <Card>
          <SectionHeader icon={Heartbeat} title={t.section_profitable} desc={t.section_profitable_desc} />
          <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.ebitda_margin} techLabel={t.ebitda_margin_tech} techTerm="ebitda_margin"
              value={computed.ebitMargin} format="pct"
              explanation={t.ebitda_margin_what}
              thresholds={{ good: 0.15, ok: 0.05 }}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.net_margin} techLabel={t.net_margin_tech}
              value={computed.netMargin} format="pct"
              explanation={t.net_margin_what}
              thresholds={{ good: 0.1, ok: 0 }}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.burn_rate} techLabel={t.burn_rate_tech} techTerm="burn_rate"
              value={computed.burnRate > 0 ? computed.burnRate : 0} format="eur"
              explanation={computed.burnRate <= 0 ? t.burn_positive : t.burn_rate_what}
              thresholds={computed.burnRate > 0 ? { good: 0, ok: 5000 } : undefined} invert
              t={t} lk={lk}
            />
            <RatioRow
              label={t.break_even} techLabel={t.break_even_tech} techTerm="break_even"
              value={computed.burnRate <= 0 ? null : computed.runway}
              format="months"
              explanation={computed.burnRate <= 0 ? t.break_even_reached : t.break_even_what}
              thresholds={computed.burnRate > 0 ? { good: 6, ok: 12 } : undefined} invert
              noData={computed.burnRate <= 0}
              t={t} lk={lk}
            />
          </div>
          <ExplainerBox variant="tip" title={lk === "fr" ? "Le saviez-vous ?" : "Did you know?"} icon={Lightbulb}>
            {t.hint_profitable}
          </ExplainerBox>
        </Card>

        {/* ── Section 2: Liquidity ───────────────────────────── */}
        <Card>
          <SectionHeader icon={CurrencyCircleDollar} title={t.section_bills} desc={t.section_bills_desc} />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <RatioRow
                label={t.current_ratio} techLabel={t.current_ratio_tech} techTerm="current_ratio"
                value={computed.currentRatio} format="x"
                explanation={t.current_ratio_what}
                thresholds={{ good: 1.5, ok: 1.0 }}
                t={t} lk={lk}
              />
              <GaugeBar
                value={computed.currentRatio}
                max={3}
                color={statusColor(computed.currentRatio, { good: 1.5, ok: 1.0 }, false).color}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <RatioRow
                label={t.quick_ratio} techLabel={t.quick_ratio_tech} techTerm="quick_ratio"
                value={computed.quickRatio} format="x"
                explanation={t.quick_ratio_what}
                thresholds={{ good: 1.0, ok: 0.7 }}
                t={t} lk={lk}
              />
              <GaugeBar
                value={computed.quickRatio}
                max={3}
                color={statusColor(computed.quickRatio, { good: 1.0, ok: 0.7 }, false).color}
              />
            </div>
          </div>
          <ExplainerBox variant="tip" title={lk === "fr" ? "Le saviez-vous ?" : "Did you know?"} icon={Lightbulb}>
            {t.hint_bills}
          </ExplainerBox>
        </Card>

        {/* ── Section 3: Debt ────────────────────────────────── */}
        <Card>
          <SectionHeader icon={Scales} title={t.section_debt} desc={t.section_debt_desc} />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.debt_to_equity} techLabel={t.debt_to_equity_tech} techTerm="debt_to_equity"
              value={computed.negativeEquity ? null : computed.leverage} format="x"
              explanation={computed.negativeEquity ? t.debt_negative_equity : t.debt_to_equity_what}
              thresholds={computed.negativeEquity ? undefined : { good: 1, ok: 2 }} invert
              noData={computed.totalDebt <= 0 && !computed.negativeEquity}
              displayOverride={computed.negativeEquity && computed.totalDebt > 0 ? "-" : undefined}
              statusOverride={computed.negativeEquity && computed.totalDebt > 0 ? { color: "var(--color-error)", status: "critical" } : undefined}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.dscr} techLabel={t.dscr_tech} techTerm="dscr"
              value={computed.dscr} format="x"
              explanation={computed.dscr != null ? t.dscr_what : t.dscr_no_debt}
              thresholds={computed.dscr != null ? { good: 1.25, ok: 1.0 } : undefined}
              noData={computed.dscr == null}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.interest_coverage} techLabel={t.interest_coverage_tech} techTerm="interest_coverage"
              value={computed.interestCoverage} format="x"
              explanation={computed.interestCoverage != null ? t.interest_coverage_what : t.interest_coverage_no_interest}
              thresholds={computed.interestCoverage != null ? { good: 3, ok: 1.5 } : undefined}
              noData={computed.interestCoverage == null}
              t={t} lk={lk}
            />
          </div>
          <ExplainerBox variant="info" title={lk === "fr" ? "Pour votre banquier" : "For your banker"} icon={Bank}>
            {t.hint_debt}
          </ExplainerBox>
        </Card>

        {/* ── Section 4: ROI ─────────────────────────────────── */}
        <Card>
          <SectionHeader icon={ChartLineUp} title={t.section_roi} desc={t.section_roi_desc} />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.roa} techLabel={t.roa_tech} techTerm="roa"
              value={computed.roa} format="pct"
              explanation={t.roa_what}
              thresholds={{ good: 0.1, ok: 0.05 }}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.roe} techLabel={t.roe_tech} techTerm="roe"
              value={computed.negativeEquity ? null : computed.roe} format="pct"
              explanation={computed.negativeEquity ? t.roe_negative_equity : t.roe_what}
              thresholds={computed.negativeEquity ? undefined : { good: 0.15, ok: 0.05 }}
              noData={computed.roe == null || computed.negativeEquity}
              t={t} lk={lk}
            />
          </div>
          <ExplainerBox variant="tip" title={lk === "fr" ? "Repère" : "Benchmark"} icon={Target}>
            {t.hint_roi}
          </ExplainerBox>
        </Card>

        {/* ── Section 5: Runway ──────────────────────────────── */}
        <Card>
          <SectionHeader icon={Hourglass} title={t.section_runway} desc={t.section_runway_desc} />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.runway} techLabel={t.runway_tech} techTerm="runway"
              value={computed.runway}
              format="months"
              explanation={computed.burnRate <= 0 ? t.runway_infinite : t.runway_what}
              thresholds={computed.runway != null ? { good: 12, ok: 6 } : undefined}
              noData={computed.burnRate <= 0}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.cash_position}
              value={computed.cash} format="eur"
              explanation={t.cash_tip}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.burn_monthly} techLabel={t.burn_rate_tech} techTerm="burn_rate"
              value={computed.burnRate > 0 ? computed.burnRate : 0} format="eur"
              explanation={computed.burnRate <= 0 ? t.burn_positive : (eurShort(computed.burnRate) + " " + t.per_month)}
              t={t} lk={lk}
            />
          </div>
          <RunwayBar months={computed.burnRate > 0 ? computed.runway : 24} t={t} />
          <ExplainerBox variant="tip" title={lk === "fr" ? "Conseil" : "Tip"} icon={Compass}>
            {t.hint_runway}
          </ExplainerBox>
        </Card>

        {/* ── Section 6: Business metrics ────────────────────── */}
        <Card>
          <SectionHeader icon={Users} title={t.section_biz} desc={t["section_biz_desc_" + bizType] || t.section_biz_desc} />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.rev_per_employee}
              value={computed.revPerEmployee} format="eur"
              explanation={t["rev_per_employee_tip_" + bizType] || t.rev_per_employee_tip}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.salary_ratio}
              value={computed.salaryRatio} format="pct"
              explanation={t.salary_ratio_tip}
              thresholds={{ good: 0.3, ok: 0.5 }} invert
              t={t} lk={lk}
            />
            <RatioRow
              label={t.cost_ratio}
              value={computed.costRatio} format="pct"
              explanation={t.cost_ratio_tip}
              thresholds={{ good: 0.7, ok: 0.9 }} invert
              t={t} lk={lk}
            />
          </div>
        </Card>

        {/* ── Section 7: Working capital (BFR) ───────────────── */}
        <Card>
          <SectionHeader icon={ArrowsClockwise} title={t.section_bfr} desc={t.section_bfr_desc} />
          <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.dso} techLabel={t.dso_tech}
              value={computed.dso} format="days"
              explanation={t.dso_tip}
              thresholds={{ good: 30, ok: 60 }} invert
              t={t} lk={lk}
            />
            <RatioRow
              label={t.dpo} techLabel={t.dpo_tech}
              value={computed.dpo} format="days"
              explanation={t.dpo_tip}
              thresholds={{ good: 45, ok: 30 }}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.dio} techLabel={t.dio_tech}
              value={computed.dio} format="days"
              explanation={computed.stockValue > 0 ? t.dio_tip : t.dio_no_stock}
              thresholds={computed.stockValue > 0 ? { good: 30, ok: 60 } : undefined} invert
              t={t} lk={lk}
            />
            <RatioRow
              label={t.cash_conversion}
              value={computed.cashConversionCycle} format="days"
              explanation={t.cash_conversion_tip}
              thresholds={{ good: 30, ok: 60 }} invert
              t={t} lk={lk}
            />
          </div>
          <div style={{ marginTop: "var(--gap-md)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <RatioRow
              label={t.receivables}
              value={computed.receivables} format="eur"
              explanation={t.receivables_tip}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.payables}
              value={computed.payables} format="eur"
              explanation={t.payables_tip}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.bfr}
              value={computed.bfr} format="eur"
              explanation={t.bfr_tip}
              t={t} lk={lk}
            />
          </div>
        </Card>

      </div>
    </PageLayout>
  );
}
