import { useMemo, useState } from "react";
import { TrendUp, Heartbeat, CurrencyCircleDollar, Scales, ChartLineUp, Hourglass, Users, ArrowsClockwise, Lightbulb, Bank, Target, Compass, WarningCircle, Printer, DownloadSimple, CircleNotch } from "@phosphor-icons/react";
import { Card, PageLayout, KpiCard, Badge, ExplainerBox, FinanceLink, Button } from "../../components";
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

/* ── Report HTML generation ───────────────────────────────────── */

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function reportStatusClass(status) {
  if (status === "good") return "good";
  if (status === "warning") return "warning";
  if (status === "critical") return "critical";
  return "neutral";
}

function reportRatioCard(label, value, status, explanation, statusLabels) {
  var cls = reportStatusClass(status);
  var sl = status === "good" ? statusLabels.good : status === "warning" ? statusLabels.warning : status === "critical" ? statusLabels.critical : "";
  return '<div class="ratio-card"><div class="ratio-label">' + esc(label) + '</div>'
    + '<span class="ratio-value ' + cls + '">' + esc(value) + '</span>'
    + (sl ? '<span class="ratio-status ' + cls + '">' + esc(sl) + '</span>' : '')
    + '<div class="ratio-explanation">' + esc(explanation) + '</div></div>';
}

var REPORT_CSS = [
  '* { margin: 0; padding: 0; box-sizing: border-box; }',
  'body { font-family: "DM Sans", Inter, system-ui, sans-serif; color: #1a1a1a; padding: 40px; font-size: 11pt; line-height: 1.6; }',
  '@page { size: A4 portrait; margin: 20mm; }',
  '@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }',
  '.report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #E8431A; }',
  '.report-header-left { display: flex; flex-direction: column; gap: 4px; }',
  '.report-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }',
  '.report-logo-icon { width: 28px; height: 28px; border-radius: 6px; background: #E8431A; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 15px; font-family: system-ui; }',
  '.report-logo-text { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: #101828; }',
  '.report-title { font-family: "Bricolage Grotesque", "DM Sans", sans-serif; font-size: 22pt; font-weight: 800; color: #101828; letter-spacing: -0.03em; }',
  '.report-subtitle { font-size: 10pt; color: #667085; margin-top: 4px; }',
  '.report-meta { text-align: right; font-size: 9pt; color: #667085; }',
  '.report-meta strong { color: #344054; font-weight: 600; }',
  '.report-meta-badge { font-size: 9px; font-weight: 600; color: #667085; background: #F2F4F7; border: 1px solid #EAECF0; border-radius: 3px; padding: 1px 5px; margin-left: 4px; }',
  '.section { margin-bottom: 24px; page-break-inside: avoid; }',
  '.section-title { font-size: 14pt; font-weight: 700; color: #101828; margin-bottom: 8px; border-left: 3px solid #E8431A; padding-left: 10px; }',
  '.section-desc { font-size: 9pt; color: #667085; margin-bottom: 12px; padding-left: 13px; }',
  '.ratio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }',
  '.ratio-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }',
  '.ratio-card { border: 1px solid #E5E5E5; border-radius: 6px; padding: 12px; }',
  '.ratio-label { font-size: 9pt; font-weight: 600; color: #344054; margin-bottom: 4px; }',
  '.ratio-value { font-size: 18pt; font-weight: 800; font-family: "Bricolage Grotesque", sans-serif; }',
  '.ratio-value.good { color: #16A34A; }',
  '.ratio-value.warning { color: #D97706; }',
  '.ratio-value.critical { color: #DC2626; }',
  '.ratio-value.neutral { color: #101828; }',
  '.ratio-status { display: inline-block; font-size: 8pt; font-weight: 600; padding: 1px 6px; border-radius: 10px; margin-left: 6px; }',
  '.ratio-status.good { background: #DCFCE7; color: #16A34A; }',
  '.ratio-status.warning { background: #FEF3C7; color: #D97706; }',
  '.ratio-status.critical { background: #FEE2E2; color: #DC2626; }',
  '.ratio-explanation { font-size: 8pt; color: #667085; margin-top: 4px; }',
  '.summary-table { width: 100%; border-collapse: collapse; margin-top: 16px; }',
  '.summary-table th { text-align: left; font-size: 8pt; font-weight: 600; color: #667085; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 8px; border-bottom: 2px solid #E5E5E5; }',
  '.summary-table td { padding: 8px; border-bottom: 1px solid #F2F2F2; font-size: 9pt; }',
  '.summary-table .val { text-align: right; font-weight: 700; font-family: "Bricolage Grotesque", sans-serif; font-variant-numeric: tabular-nums; }',
  '.disclaimer { font-size: 8pt; color: #9CA3AF; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E5E5; }',
  '.footer-logo { font-weight: 800; color: #E8431A; }',
].join('\n');

function generateFinancialReport(computed, cfg, lk, t) {
  var isFr = lk !== "en";
  var now = new Date();
  var dateStr = now.toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  var timeStr = now.toLocaleTimeString(isFr ? "fr-BE" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  var statusLabels = {
    good: isFr ? "Bon" : "Good",
    warning: isFr ? "Attention" : "Warning",
    critical: isFr ? "Critique" : "Critical",
  };

  /* Helper to get status from thresholds (mirrors statusColor logic) */
  function getStatus(value, thresholds, invert) {
    if (value == null || !isFinite(value)) return "neutral";
    if (invert) {
      if (value <= thresholds.good) return "good";
      if (value <= thresholds.ok) return "warning";
      return "critical";
    }
    if (value >= thresholds.good) return "good";
    if (value >= thresholds.ok) return "warning";
    return "critical";
  }

  var html = '<!DOCTYPE html><html lang="' + lk + '"><head><meta charset="UTF-8"><title>'
    + esc(isFr ? "Rapport de Santé Financière — Forecrest" : "Financial Health Report — Forecrest")
    + '</title><style>' + REPORT_CSS + '</style></head><body>';

  /* ── Header ── */
  html += '<div class="report-header"><div class="report-header-left">';
  html += '<div class="report-logo"><div class="report-logo-icon">F</div><div class="report-logo-text">Forecrest</div></div>';
  html += '<div class="report-title">' + esc(isFr ? "RAPPORT DE SANTÉ FINANCIÈRE" : "FINANCIAL HEALTH REPORT") + '</div>';
  html += '<div class="report-subtitle">' + esc(isFr ? "Document préparatoire — à valider par un conseiller financier" : "Preliminary document — to be validated by a financial advisor") + '</div>';
  html += '</div><div class="report-meta">';
  html += '<div>' + esc(dateStr) + ' · ' + esc(timeStr) + '</div>';
  if (cfg.companyName) {
    html += '<div style="margin-top:4px"><strong>' + esc(cfg.companyName) + '</strong>';
    if (cfg.legalForm) html += '<span class="report-meta-badge">' + esc(cfg.legalForm) + '</span>';
    html += '</div>';
  }
  if (cfg.tvaNumber) html += '<div>TVA ' + esc(cfg.tvaNumber) + '</div>';
  var fullName = [cfg.firstName, cfg.lastName].filter(Boolean).join(" ");
  if (fullName) {
    html += '<div>' + (isFr ? "Resp. légal : " : "Legal rep.: ") + '<strong>' + esc(fullName) + '</strong>';
    if (cfg.userRole) html += ' · ' + esc(cfg.userRole);
    html += '</div>';
  }
  html += '</div></div>';

  /* ── Executive Summary ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Synthèse" : "Executive Summary") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Les 4 indicateurs clés de votre entreprise en un coup d'œil." : "Your 4 key business indicators at a glance.") + '</div>';
  html += '<table class="summary-table"><thead><tr>';
  html += '<th>' + esc(isFr ? "Indicateur" : "Indicator") + '</th>';
  html += '<th class="val">' + esc(isFr ? "Valeur" : "Value") + '</th>';
  html += '<th>' + esc(isFr ? "Statut" : "Status") + '</th>';
  html += '</tr></thead><tbody>';

  var ebitMarginStatus = getStatus(computed.ebitMargin, { good: 0.15, ok: 0.05 }, false);
  var runwayStatus = computed.burnRate <= 0 ? "good" : computed.runway != null ? getStatus(computed.runway, { good: 12, ok: 6 }, false) : "neutral";
  var currentRatioStatus = computed.currentRatio != null ? getStatus(computed.currentRatio, { good: 1.5, ok: 1.0 }, false) : "good";
  var debtStatus = computed.negativeEquity ? "critical" : computed.totalDebt <= 0 ? "good" : getStatus(computed.leverage, { good: 1, ok: 2 }, true);

  var runwayVal = computed.burnRate <= 0 ? (isFr ? "Rentable" : "Profitable")
    : computed.runway != null ? Math.round(computed.runway) + " " + (isFr ? "mois" : "months") : "-";
  var debtVal = computed.totalDebt <= 0 ? (isFr ? "Pas de dette" : "No debt")
    : computed.negativeEquity ? "-" : computed.leverage.toFixed(2) + "x";

  var summaryRows = [
    [isFr ? "Marge opérationnelle" : "Operating margin", pct(computed.ebitMargin), ebitMarginStatus],
    [isFr ? "Autonomie financière" : "Financial runway", runwayVal, runwayStatus],
    [isFr ? "Liquidité à court terme" : "Short-term liquidity", computed.currentRatio != null ? computed.currentRatio.toFixed(2) + "x" : "-", currentRatioStatus],
    [isFr ? "Poids de la dette" : "Debt weight", debtVal, debtStatus],
  ];
  summaryRows.forEach(function (row) {
    var cls = reportStatusClass(row[2]);
    var sl = row[2] === "good" ? statusLabels.good : row[2] === "warning" ? statusLabels.warning : row[2] === "critical" ? statusLabels.critical : "-";
    html += '<tr><td>' + esc(row[0]) + '</td><td class="val">' + esc(row[1]) + '</td>';
    html += '<td><span class="ratio-status ' + cls + '">' + esc(sl) + '</span></td></tr>';
  });
  html += '</tbody></table></div>';

  /* ── Section 1: Profitability ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Rentabilité" : "Profitability") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Ces indicateurs montrent si vos revenus couvrent vos charges." : "These indicators show whether your revenue covers your costs.") + '</div>';
  html += '<div class="ratio-grid">';
  html += reportRatioCard(
    isFr ? "Marge opérationnelle (EBITDA)" : "Operating margin (EBITDA)",
    pct(computed.ebitMargin),
    ebitMarginStatus,
    isFr ? "Part du CA restant après les charges d'exploitation." : "Share of revenue left after operating costs.",
    statusLabels
  );
  html += reportRatioCard(
    isFr ? "Marge nette" : "Net margin",
    pct(computed.netMargin),
    getStatus(computed.netMargin, { good: 0.1, ok: 0 }, false),
    isFr ? "Part du CA restant après toutes les charges et impôts." : "Share of revenue left after all costs and taxes.",
    statusLabels
  );
  var burnDisplay = computed.burnRate > 0 ? eurShort(computed.burnRate) : "0 €";
  var burnStatus = computed.burnRate > 0 ? getStatus(computed.burnRate, { good: 0, ok: 5000 }, true) : "good";
  html += reportRatioCard(
    isFr ? "Consommation mensuelle (Burn rate)" : "Monthly burn (Burn rate)",
    burnDisplay,
    burnStatus,
    computed.burnRate <= 0
      ? (isFr ? "L'entreprise est rentable — pas de consommation de cash." : "The business is profitable — no cash burn.")
      : (isFr ? "Montant dépensé par mois au-delà des revenus." : "Amount spent per month beyond revenue."),
    statusLabels
  );
  var breakEvenVal = computed.burnRate <= 0
    ? (isFr ? "Atteint" : "Reached")
    : computed.runway != null ? Math.round(computed.runway) + " " + (isFr ? "mois" : "months") : "-";
  var breakEvenStatus = computed.burnRate <= 0 ? "good"
    : computed.runway != null ? getStatus(computed.runway, { good: 6, ok: 12 }, true) : "neutral";
  html += reportRatioCard(
    isFr ? "Seuil de rentabilité (Break-even)" : "Break-even point",
    breakEvenVal,
    breakEvenStatus,
    computed.burnRate <= 0
      ? (isFr ? "Atteint — votre entreprise est rentable." : "Reached — your business is profitable.")
      : (isFr ? "Quand vos revenus couvrent exactement vos dépenses." : "When revenue exactly covers your expenses."),
    statusLabels
  );
  html += '</div></div>';

  /* ── Section 2: Liquidity ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Liquidité" : "Liquidity") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Votre trésorerie couvre-t-elle vos engagements des prochains mois ?" : "Does your cash cover upcoming obligations?") + '</div>';
  html += '<div class="ratio-grid">';
  html += reportRatioCard(
    isFr ? "Liquidité à court terme (Current ratio)" : "Short-term liquidity (Current ratio)",
    computed.currentRatio != null ? computed.currentRatio.toFixed(2) + "x" : "-",
    currentRatioStatus,
    isFr ? "Avez-vous assez de cash pour payer les 3 prochains mois ?" : "Do you have enough cash to cover the next 3 months?",
    statusLabels
  );
  html += reportRatioCard(
    isFr ? "Liquidité immédiate (Quick ratio)" : "Immediate liquidity (Quick ratio)",
    computed.quickRatio != null ? computed.quickRatio.toFixed(2) + "x" : "-",
    computed.quickRatio != null ? getStatus(computed.quickRatio, { good: 1.0, ok: 0.7 }, false) : "neutral",
    isFr ? "Cash disponible immédiatement, sans vendre de stock." : "Cash available immediately, without selling stock.",
    statusLabels
  );
  html += '</div></div>';

  /* ── Section 3: Debt ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Endettement" : "Debt") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Les banques regardent ces ratios pour décider de vous prêter." : "Banks look at these ratios when deciding whether to lend.") + '</div>';
  html += '<div class="ratio-grid-3">';
  var dteVal = computed.totalDebt <= 0 ? (isFr ? "Pas de dette" : "No debt")
    : computed.negativeEquity ? "-" : computed.leverage.toFixed(2) + "x";
  var dteStatus = computed.totalDebt <= 0 ? "good" : debtStatus;
  html += reportRatioCard(
    isFr ? "Poids de la dette (Debt-to-equity)" : "Debt weight (Debt-to-equity)",
    dteVal, dteStatus,
    computed.negativeEquity
      ? (isFr ? "Fonds propres négatifs : situation critique." : "Negative equity: critical situation.")
      : (isFr ? "Endettement par rapport aux fonds propres." : "Debt relative to equity."),
    statusLabels
  );
  var dscrVal = computed.dscr != null ? computed.dscr.toFixed(2) + "x" : (isFr ? "Pas de dette" : "No debt");
  var dscrStatus = computed.dscr != null ? getStatus(computed.dscr, { good: 1.25, ok: 1.0 }, false) : "good";
  html += reportRatioCard(
    isFr ? "Capacité de remboursement (DSCR)" : "Debt repayment capacity (DSCR)",
    dscrVal, dscrStatus,
    computed.dscr != null
      ? (isFr ? "Vos revenus couvrent-ils les remboursements ?" : "Does your revenue cover loan repayments?")
      : (isFr ? "Aucune dette — ratio non applicable." : "No debt — ratio not applicable."),
    statusLabels
  );
  var icVal = computed.interestCoverage != null ? computed.interestCoverage.toFixed(2) + "x" : (isFr ? "Pas d'intérêts" : "No interest");
  var icStatus = computed.interestCoverage != null ? getStatus(computed.interestCoverage, { good: 3, ok: 1.5 }, false) : "good";
  html += reportRatioCard(
    isFr ? "Couverture des intérêts" : "Interest coverage",
    icVal, icStatus,
    computed.interestCoverage != null
      ? (isFr ? "Vos bénéfices couvrent-ils les intérêts de vos prêts ?" : "Do your profits cover your loan interest?")
      : (isFr ? "Pas d'intérêts à payer." : "No interest to pay."),
    statusLabels
  );
  html += '</div></div>';

  /* ── Section 4: Returns ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Rendement" : "Returns") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Combien chaque euro investi rapporte-t-il ?" : "How much does each euro invested generate?") + '</div>';
  html += '<div class="ratio-grid">';
  html += reportRatioCard(
    isFr ? "Rendement des actifs (ROA)" : "Return on assets (ROA)",
    pct(computed.roa),
    getStatus(computed.roa, { good: 0.1, ok: 0.05 }, false),
    isFr ? "Combien chaque euro investi dans l'entreprise génère de profit." : "How much each euro invested in the business generates in profit.",
    statusLabels
  );
  var roeVal = computed.negativeEquity ? "-" : pct(computed.roe);
  var roeStatus = computed.negativeEquity ? "neutral" : computed.roe != null ? getStatus(computed.roe, { good: 0.15, ok: 0.05 }, false) : "neutral";
  html += reportRatioCard(
    isFr ? "Rendement des fonds propres (ROE)" : "Return on equity (ROE)",
    roeVal, roeStatus,
    computed.negativeEquity
      ? (isFr ? "Fonds propres négatifs — le ratio n'est pas significatif." : "Negative equity — the ratio is not meaningful.")
      : (isFr ? "Combien chaque euro des fondateurs génère de profit." : "How much each euro from founders generates in profit."),
    statusLabels
  );
  html += '</div></div>';

  /* ── Section 5: Runway ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Autonomie financière" : "Financial Runway") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Combien de temps pouvez-vous fonctionner avec votre trésorerie actuelle ?" : "How long can you operate with current cash?") + '</div>';
  html += '<div class="ratio-grid-3">';
  var runwayCardVal = computed.burnRate <= 0
    ? (isFr ? "Rentable" : "Profitable")
    : computed.runway != null ? Math.round(computed.runway) + " " + (isFr ? "mois" : "months") : "-";
  var runwayCardStatus = computed.burnRate <= 0 ? "good"
    : computed.runway != null ? getStatus(computed.runway, { good: 12, ok: 6 }, false) : "neutral";
  html += reportRatioCard(
    isFr ? "Autonomie (Runway)" : "Runway",
    runwayCardVal, runwayCardStatus,
    computed.burnRate <= 0
      ? (isFr ? "Votre entreprise est rentable — pas de consommation de trésorerie." : "Your business is profitable — no cash burn.")
      : (isFr ? "Combien de mois avant d'être à sec." : "How many months until you run out of cash."),
    statusLabels
  );
  html += reportRatioCard(
    isFr ? "Trésorerie actuelle" : "Current cash",
    eurShort(computed.cash), "neutral",
    isFr ? "Montant total disponible en banque." : "Total amount available in the bank.",
    statusLabels
  );
  html += reportRatioCard(
    isFr ? "Consommation mensuelle" : "Monthly burn",
    computed.burnRate > 0 ? eurShort(computed.burnRate) : "0 €",
    computed.burnRate > 0 ? "warning" : "good",
    computed.burnRate <= 0
      ? (isFr ? "L'entreprise est rentable." : "The business is profitable.")
      : eurShort(computed.burnRate) + " / " + (isFr ? "mois" : "month"),
    statusLabels
  );
  html += '</div></div>';

  /* ── Section 6: Operational ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Indicateurs opérationnels" : "Operational Indicators") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Performance de l'entreprise au niveau opérationnel." : "Operational performance metrics.") + '</div>';
  html += '<div class="ratio-grid-3">';
  html += reportRatioCard(
    isFr ? "CA par employé" : "Revenue per employee",
    computed.revPerEmployee != null ? eurShort(computed.revPerEmployee) : "-",
    "neutral",
    isFr ? "Chiffre d'affaires annuel divisé par le nombre de salariés." : "Annual revenue divided by headcount.",
    statusLabels
  );
  html += reportRatioCard(
    isFr ? "Poids salarial" : "Salary weight",
    pct(computed.salaryRatio),
    getStatus(computed.salaryRatio, { good: 0.3, ok: 0.5 }, true),
    isFr ? "Part du CA consacrée aux rémunérations." : "Share of revenue spent on salaries.",
    statusLabels
  );
  html += reportRatioCard(
    isFr ? "Ratio de charges" : "Cost ratio",
    pct(computed.costRatio),
    getStatus(computed.costRatio, { good: 0.7, ok: 0.9 }, true),
    isFr ? "Part du CA absorbée par les charges." : "Share of revenue absorbed by costs.",
    statusLabels
  );
  html += '</div></div>';

  /* ── Section 7: BFR ── */
  html += '<div class="section">';
  html += '<div class="section-title">' + esc(isFr ? "Besoin en fonds de roulement (BFR)" : "Working Capital Requirement (WCR)") + '</div>';
  html += '<div class="section-desc">' + esc(isFr ? "Combien de trésorerie l'entreprise doit immobiliser pour financer son cycle d'exploitation." : "How much cash must the business tie up to fund its operating cycle.") + '</div>';
  html += '<table class="summary-table"><thead><tr>';
  html += '<th>' + esc(isFr ? "Indicateur" : "Indicator") + '</th>';
  html += '<th class="val">' + esc(isFr ? "Valeur" : "Value") + '</th>';
  html += '<th>' + esc(isFr ? "Description" : "Description") + '</th>';
  html += '</tr></thead><tbody>';
  var bfrRows = [
    [isFr ? "Délai clients (DSO)" : "Customer delay (DSO)", computed.dso + (isFr ? " j" : " d"), isFr ? "Délai moyen de paiement clients." : "Average customer payment delay."],
    [isFr ? "Délai fournisseurs (DPO)" : "Supplier delay (DPO)", computed.dpo + (isFr ? " j" : " d"), isFr ? "Délai moyen de paiement fournisseurs." : "Average supplier payment delay."],
    [isFr ? "Jours de stock (DIO)" : "Inventory days (DIO)", Math.round(computed.dio) + (isFr ? " j" : " d"), isFr ? "Nombre de jours de stock moyen avant vente." : "Average days of inventory before sale."],
    [isFr ? "Cycle de conversion" : "Cash conversion cycle", Math.round(computed.cashConversionCycle) + (isFr ? " j" : " d"), isFr ? "DSO + DIO - DPO." : "DSO + DIO - DPO."],
    [isFr ? "Créances clients" : "Trade receivables", eurShort(computed.receivables), isFr ? "Factures émises mais pas encore encaissées." : "Invoices issued but not yet collected."],
    [isFr ? "Dettes fournisseurs" : "Trade payables", eurShort(computed.payables), isFr ? "Factures reçues mais pas encore payées." : "Invoices received but not yet paid."],
    [isFr ? "BFR" : "WCR", eurShort(computed.bfr), isFr ? "Créances + stocks - dettes fournisseurs." : "Receivables + inventory - payables."],
  ];
  bfrRows.forEach(function (row) {
    html += '<tr><td>' + esc(row[0]) + '</td><td class="val">' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td></tr>';
  });
  html += '</tbody></table></div>';

  /* ── Disclaimer & Footer ── */
  html += '<div class="disclaimer">';
  html += '<span class="footer-logo">Forecrest</span> — <a href="https://forecrest.be" style="color:#E8431A;text-decoration:none;">forecrest.be</a><br/><br/>';
  html += esc(isFr
    ? "Ce rapport est généré automatiquement. Il ne constitue pas un avis financier professionnel. Les ratios sont calculés sur base des données saisies et peuvent différer d'une analyse approfondie. Consultez un expert-comptable ou un conseiller financier pour une évaluation complète."
    : "This report is automatically generated. It does not constitute professional financial advice. Ratios are calculated based on entered data and may differ from an in-depth analysis. Consult a certified accountant or financial advisor for a complete evaluation.");
  html += '</div>';

  html += '</body></html>';
  return html;
}

function printReportHtml(html) {
  var w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function () { w.print(); }, 400);
}

function downloadReportPdf(html, onStart, onEnd) {
  if (onStart) onStart();
  var iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:none;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(function () {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(function () {
      document.body.removeChild(iframe);
      if (onEnd) onEnd();
    }, 1000);
  }, 500);
}

/* ── Main page ────────────────────────────────────────────────── */

export default function RatiosPage({ cfg, totalRevenue, monthlyCosts, ebit, netP, resLeg, debts, sals, salCosts, stocks, esopMonthly, esopEnabled }) {
  var t = useT().ratios;
  var { lang } = useLang();
  var lk = lang;
  var bizType = cfg.businessType || "other";
  var [exporting, setExporting] = useState(false);

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

  function handlePrint() {
    var html = generateFinancialReport(computed, cfg, lk, t);
    printReportHtml(html);
  }

  function handleExport() {
    var html = generateFinancialReport(computed, cfg, lk, t);
    downloadReportPdf(html, function () { setExporting(true); }, function () { setExporting(false); });
  }

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
    <PageLayout title={t.title} subtitle={t.subtitle} icon={TrendUp} iconColor="#06B6D4" actions={
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        <Button color="tertiary" size="lg" onClick={handlePrint} title={lk === "fr" ? "Imprimer le rapport" : "Print report"} iconLeading={<Printer size={14} weight="bold" />} sx={{ width: 40, minWidth: 40, padding: 0, justifyContent: "center" }} />
        <Button color="primary" size="lg" isDisabled={exporting} onClick={handleExport} iconLeading={exporting ? <CircleNotch size={14} weight="bold" style={{ animation: "spin 1s linear infinite" }} /> : <DownloadSimple size={14} weight="bold" />}>
          {exporting ? (lk === "fr" ? "Génération..." : "Generating...") : (lk === "fr" ? "Exporter" : "Export")}
        </Button>
      </div>
    }>
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
              label={t.net_margin} techLabel={t.net_margin_tech} techTerm="net_profit"
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
              value={computed.burnRate > 0 ? computed.runway : null}
              format="months"
              explanation={computed.burnRate <= 0 ? t.break_even_reached : t.break_even_what}
              thresholds={computed.burnRate > 0 ? { good: 6, ok: 12 } : undefined} invert
              displayOverride={computed.burnRate <= 0 ? (lk === "fr" ? "Atteint" : "Reached") : undefined}
              statusOverride={computed.burnRate <= 0 ? { color: "var(--color-success)", status: "good" } : undefined}
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
              displayOverride={computed.dscr == null ? (lk === "fr" ? "Pas de dette" : "No debt") : undefined}
              statusOverride={computed.dscr == null ? { color: "var(--color-success)", status: "good" } : undefined}
              t={t} lk={lk}
            />
            <RatioRow
              label={t.interest_coverage} techLabel={t.interest_coverage_tech} techTerm="interest_coverage"
              value={computed.interestCoverage} format="x"
              explanation={computed.interestCoverage != null ? t.interest_coverage_what : t.interest_coverage_no_interest}
              thresholds={computed.interestCoverage != null ? { good: 3, ok: 1.5 } : undefined}
              displayOverride={computed.interestCoverage == null ? (lk === "fr" ? "Pas d'intérêts" : "No interest") : undefined}
              statusOverride={computed.interestCoverage == null ? { color: "var(--color-success)", status: "good" } : undefined}
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
              label={t.cash_position} techTerm="treasury"
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
              label={t.bfr} techTerm="working_capital"
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
