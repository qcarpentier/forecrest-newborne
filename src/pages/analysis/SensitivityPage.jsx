import { useMemo, useState } from "react";
import { ChartLine, TrendUp, ArrowsOutCardinal, ListNumbers, Printer, DownloadSimple, CircleNotch } from "@phosphor-icons/react";
import { PageLayout, ExplainerBox, KpiCard, Card, Button } from "../../components";
import SensitivityChart, { VARIABLES, computeImpact, DEFAULT_VARIATION } from "../../components/SensitivityChart";
import { eur, pct, projectMarketplace, projectHardwareSales } from "../../utils";
import { useT, useLang } from "../../context";

/* ── Skeleton chart for empty state ── */

function SkeletonChart({ t }) {
  var bars = [
    { w: 90 }, { w: 72 }, { w: 58 }, { w: 40 }, { w: 25 },
  ];
  return (
    <Card>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-2)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", color: "var(--text-faint)" }}>
        {t.chart_title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0.4 }}>
        {bars.map(function (b, i) {
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "160px 1fr 1fr",
              alignItems: "center", minHeight: 36,
            }}>
              <div style={{ height: 12, borderRadius: "var(--r-sm)", background: "var(--border)", marginRight: 10, width: "70%" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", height: 20 }}>
                <div style={{ width: b.w * 0.6 + "%", height: "100%", background: "var(--border)", borderRadius: "var(--r-sm) 0 0 var(--r-sm)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", height: 20 }}>
                <div style={{ width: b.w + "%", height: "100%", background: "var(--border)", borderRadius: "0 var(--r-sm) var(--r-sm) 0" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        textAlign: "center", marginTop: "var(--sp-5)",
        padding: "var(--sp-4)", background: "var(--bg-accordion)",
        borderRadius: "var(--r-md)", border: "1px solid var(--border-light)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
          {t.empty_title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {t.empty_body}
        </div>
      </div>
    </Card>
  );
}

/* ── Print report CSS ── */

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
  '.kpi-row { display: flex; gap: 12px; margin-bottom: 24px; }',
  '.kpi-card { flex: 1; border: 1px solid #E5E5E5; border-radius: 8px; padding: 14px; }',
  '.kpi-label { font-size: 9pt; font-weight: 500; color: #667085; margin-bottom: 4px; }',
  '.kpi-value { font-size: 16pt; font-weight: 800; font-family: "Bricolage Grotesque", sans-serif; color: #101828; }',
  '.kpi-value.brand { color: #E8431A; }',
  'table { width: 100%; border-collapse: collapse; margin-top: 16px; }',
  'thead tr { border-bottom: 2px solid #E5E5E5; }',
  'th { text-align: left; padding: 8px 12px; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; color: #667085; background: #F9FAFB; }',
  'th.right { text-align: right; }',
  'td { padding: 9px 12px; border-bottom: 1px solid #F2F2F2; font-size: 10pt; color: #344054; }',
  'td.right { text-align: right; font-variant-numeric: tabular-nums; }',
  'td.neg { color: #DC2626; font-weight: 600; }',
  'td.pos { color: #16A34A; font-weight: 600; }',
  'tr:nth-child(even) td { background: #FAFAFA; }',
  'tr:first-child td { font-weight: 700; }',
  '.bar-cell { position: relative; }',
  '.bar-neg { display: inline-block; height: 12px; background: #DC2626; opacity: 0.5; border-radius: 2px 0 0 2px; }',
  '.bar-pos { display: inline-block; height: 12px; background: #16A34A; opacity: 0.5; border-radius: 0 2px 2px 0; }',
  '.most-sensitive { font-size: 8pt; font-weight: 700; color: #E8431A; background: #FEF3F2; border: 1px solid #FECDCA; border-radius: 3px; padding: 1px 5px; margin-left: 6px; }',
  '.ebitda-box { background: #F9FAFB; border: 1px solid #E5E5E5; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }',
  '.ebitda-label { font-size: 10pt; color: #667085; }',
  '.ebitda-value { font-size: 16pt; font-weight: 800; font-family: "Bricolage Grotesque", sans-serif; }',
  '.ebitda-value.positive { color: #16A34A; }',
  '.ebitda-value.negative { color: #DC2626; }',
  '.disclaimer { font-size: 8pt; color: #9CA3AF; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E5E5; }',
  '.footer-logo { font-weight: 800; color: #E8431A; }',
].join('\n');

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateSensitivityReport(data, ebit, variation, cfg, lk, t) {
  var isFr = lk !== "en";
  var now = new Date();
  var dateStr = now.toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  var timeStr = now.toLocaleTimeString(isFr ? "fr-BE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  var vPct = Math.round(variation * 100);

  var html = '<!DOCTYPE html><html lang="' + lk + '"><head><meta charset="UTF-8"><title>'
    + esc(isFr ? "Analyse de sensibilité — Forecrest" : "Sensitivity Analysis — Forecrest")
    + '</title><style>' + REPORT_CSS + '</style></head><body>';

  /* Header */
  html += '<div class="report-header"><div class="report-header-left">';
  html += '<div class="report-logo"><div class="report-logo-icon">F</div><div class="report-logo-text">Forecrest</div></div>';
  html += '<div class="report-title">' + esc(t.print_title) + '</div>';
  html += '<div class="report-subtitle">' + esc(t.print_subtitle) + ' (±' + vPct + '%)</div>';
  html += '</div>';
  html += '<div class="report-meta">';
  html += '<div>' + esc(dateStr) + ' · ' + esc(timeStr) + '</div>';
  if (cfg.companyName) {
    html += '<div><strong>' + esc(cfg.companyName) + '</strong>';
    if (cfg.legalForm) html += ' <span class="report-meta-badge">' + esc(cfg.legalForm) + '</span>';
    html += '</div>';
  }
  html += '</div></div>';

  /* EBITDA reference */
  html += '<div class="ebitda-box">';
  html += '<span class="ebitda-label">' + esc(t.ebitda_current) + '</span>';
  html += '<span class="ebitda-value ' + (ebit >= 0 ? "positive" : "negative") + '">' + esc(eur(ebit)) + '</span>';
  html += '</div>';

  /* KPI row */
  if (data.length > 0) {
    var topVar = data[0];
    var maxImpact = Math.max(Math.abs(topVar.low), Math.abs(topVar.high));
    html += '<div class="kpi-row">';
    html += '<div class="kpi-card"><div class="kpi-label">' + esc(t.kpi_most_sensitive) + '</div><div class="kpi-value brand">' + esc(topVar.label) + '</div></div>';
    html += '<div class="kpi-card"><div class="kpi-label">' + esc(t.kpi_max_impact) + '</div><div class="kpi-value">' + esc(eur(Math.round(maxImpact))) + '</div></div>';
    html += '<div class="kpi-card"><div class="kpi-label">' + esc(t.kpi_vars_analyzed) + '</div><div class="kpi-value">' + data.length + '</div></div>';
    html += '</div>';
  }

  /* Table */
  var maxAbs = 1;
  data.forEach(function (d) {
    var m = Math.max(Math.abs(d.low), Math.abs(d.high));
    if (m > maxAbs) maxAbs = m;
  });

  html += '<table><thead><tr>';
  html += '<th>' + esc(t.print_table_variable) + '</th>';
  html += '<th class="right">' + esc(t.print_table_neg) + '</th>';
  html += '<th class="right">' + esc(t.print_table_pos) + '</th>';
  html += '<th class="right">' + esc(t.print_table_pct) + '</th>';
  html += '</tr></thead><tbody>';

  data.forEach(function (d, idx) {
    var neg = Math.min(d.low, d.high);
    var pos = Math.max(d.low, d.high);
    var maxRow = Math.max(Math.abs(neg), Math.abs(pos));
    var pctEbitda = ebit !== 0 ? maxRow / Math.abs(ebit) : 0;

    html += '<tr>';
    html += '<td>' + esc(d.label);
    if (idx === 0) html += ' <span class="most-sensitive">' + esc(t.badge_most_sensitive) + '</span>';
    html += '</td>';
    html += '<td class="right neg">' + (neg < 0 ? esc(eur(Math.round(neg))) : '-') + '</td>';
    html += '<td class="right pos">' + (pos > 0 ? '+' + esc(eur(Math.round(pos))) : '-') + '</td>';
    html += '<td class="right">' + esc(pct(pctEbitda)) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';

  /* Disclaimer */
  html += '<div class="disclaimer">';
  html += '<span class="footer-logo">Forecrest</span> — <a href="https://forecrest.be" style="color:#E8431A;text-decoration:none;">forecrest.be</a><br/><br/>';
  html += esc(t.print_disclaimer);
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

/* ── Main page ── */

/* ── Marketplace sensitivity — tornado sur EBIT cumulé 3 ans ── */
function MarketplaceSensitivityCard({ cfg, lang }) {
  var lk = lang === "en" ? "en" : "fr";
  var baseParams = useMemo(function () {
    return {
      acquisitionPlan: cfg.marketplaceAcquisitionPlan || [],
      churnMonthly: cfg.churnMonthly || 0.02,
      visitsPerMonth: cfg.marketplaceVisitsPerMonth || 5.72,
      priceTTC: cfg.marketplacePriceTTC || 5.41,
      commissionPct: cfg.marketplaceCommissionPct || 0.2034,
      vatRate: cfg.vat || 0.21,
      stripePct: cfg.marketplaceStripePct || 0.014,
      stripeFixed: cfg.marketplaceStripeFixed || 0.25,
      marketingMonthly: cfg.marketplaceMarketingMonthly || 667,
      infraTiers: cfg.marketplaceInfraTiers || [],
      hardwareUnitCost: cfg.marketplaceHardwareUnitCost || 60,
      hardwareClientsPerUnit: cfg.marketplaceHardwareClientsPerUnit || 3,
      amortAnnual: cfg.marketplaceAmortAnnual || 1400,
    };
  }, [cfg]);

  var evParams = useMemo(function () {
    if (!cfg.evSalesPlan || !cfg.evSalesPlan.length) return null;
    return {
      salesPlan: cfg.evSalesPlan,
      pricePerUnit: cfg.evPricePerUnit || 0,
      priceGrowthRate: cfg.evPriceGrowthRate || 0,
      costPct: cfg.evCostPct || 0,
      costPerUnit: cfg.evCostPerUnit,
      installPct: cfg.evInstallPct || 0,
      installPerUnit: cfg.evInstallPerUnit,
      marketingMonthly: cfg.evMarketingMonthly || 0,
      commercialMonthly: cfg.evCommercialMonthly || 0,
    };
  }, [cfg]);

  var baseProj = useMemo(function () { return projectMarketplace(baseParams); }, [baseParams]);
  var baseEvProj = useMemo(function () { return evParams ? projectHardwareSales(evParams) : null; }, [evParams]);
  var baseEbit3y = (baseProj.total.ebit || 0) + (baseEvProj ? (baseEvProj.total.ebitda || 0) : 0);

  var scenarios = useMemo(function () {
    function runMp(overrides) {
      var merged = Object.assign({}, baseParams, overrides);
      return projectMarketplace(merged).total.ebit || 0;
    }
    function runEv(overrides) {
      if (!evParams) return 0;
      var merged = Object.assign({}, evParams, overrides);
      return projectHardwareSales(merged).total.ebitda || 0;
    }
    function runCombined(mpOverrides, evOverrides) {
      return runMp(mpOverrides || {}) + runEv(evOverrides || {});
    }
    function runWith(overrides) { return runMp(overrides) + (baseEvProj ? baseEvProj.total.ebitda : 0); }
    var list = [
      {
        id: "acquisition",
        label: { fr: "Plan d'acquisition ±20%", en: "Acquisition plan ±20%" },
        low: runWith({ acquisitionPlan: baseParams.acquisitionPlan.map(function (n) { return n * 0.8; }) }),
        high: runWith({ acquisitionPlan: baseParams.acquisitionPlan.map(function (n) { return n * 1.2; }) }),
      },
      {
        id: "commission",
        label: { fr: "Commission ±5 pts", en: "Commission ±5 pts" },
        low: runWith({ commissionPct: Math.max(0, baseParams.commissionPct - 0.05) }),
        high: runWith({ commissionPct: baseParams.commissionPct + 0.05 }),
      },
      {
        id: "churn",
        label: { fr: "Churn mensuel ±1 pt", en: "Monthly churn ±1 pt" },
        low: runWith({ churnMonthly: Math.max(0, baseParams.churnMonthly - 0.01) }),
        high: runWith({ churnMonthly: baseParams.churnMonthly + 0.01 }),
      },
      {
        id: "price",
        label: { fr: "Prix moyen ±10%", en: "Avg price ±10%" },
        low: runWith({ priceTTC: baseParams.priceTTC * 0.9 }),
        high: runWith({ priceTTC: baseParams.priceTTC * 1.1 }),
      },
      {
        id: "visits",
        label: { fr: "Visites/mois ±15%", en: "Visits/mo ±15%" },
        low: runWith({ visitsPerMonth: baseParams.visitsPerMonth * 0.85 }),
        high: runWith({ visitsPerMonth: baseParams.visitsPerMonth * 1.15 }),
      },
      {
        id: "marketing",
        label: { fr: "Marketing ±50%", en: "Marketing ±50%" },
        low: runWith({ marketingMonthly: baseParams.marketingMonthly * 0.5 }),
        high: runWith({ marketingMonthly: baseParams.marketingMonthly * 1.5 }),
      },
      {
        id: "stripe",
        label: { fr: "Frais transaction ±50%", en: "Transaction fees ±50%" },
        low: runWith({ stripePct: baseParams.stripePct * 0.5, stripeFixed: baseParams.stripeFixed * 0.5 }),
        high: runWith({ stripePct: baseParams.stripePct * 1.5, stripeFixed: baseParams.stripeFixed * 1.5 }),
      },
      {
        id: "hardware",
        label: { fr: "Coût hardware ±30%", en: "Hardware cost ±30%" },
        low: runWith({ hardwareUnitCost: baseParams.hardwareUnitCost * 0.7 }),
        high: runWith({ hardwareUnitCost: baseParams.hardwareUnitCost * 1.3 }),
      },
    ];
    if (evParams) {
      list.push(
        {
          id: "ev_sales_plan",
          label: { fr: "Plan ventes EV ±20%", en: "EV sales plan ±20%" },
          low: runCombined({}, { salesPlan: evParams.salesPlan.map(function (n) { return n * 0.8; }) }),
          high: runCombined({}, { salesPlan: evParams.salesPlan.map(function (n) { return n * 1.2; }) }),
        },
        {
          id: "ev_price",
          label: { fr: "Prix borne EV ±10%", en: "EV price ±10%" },
          low: runCombined({}, { pricePerUnit: evParams.pricePerUnit * 0.9 }),
          high: runCombined({}, { pricePerUnit: evParams.pricePerUnit * 1.1 }),
        },
        {
          id: "ev_cost_pct",
          label: { fr: "Coût borne ±10 pts", en: "EV cost pct ±10 pts" },
          low: runCombined({}, { costPct: Math.max(0, evParams.costPct - 0.10) }),
          high: runCombined({}, { costPct: Math.min(1, evParams.costPct + 0.10) }),
        },
        {
          id: "ev_install",
          label: { fr: "Pose installateur ±50%", en: "Installation cost ±50%" },
          low: runCombined({}, { installPct: evParams.installPct * 0.5 }),
          high: runCombined({}, { installPct: evParams.installPct * 1.5 }),
        }
      );
    }
    return list.map(function (s) {
      return {
        id: s.id,
        label: s.label[lk],
        lowImpact: s.low - baseEbit3y,
        highImpact: s.high - baseEbit3y,
        lowValue: s.low,
        highValue: s.high,
      };
    }).sort(function (a, b) {
      return Math.max(Math.abs(b.lowImpact), Math.abs(b.highImpact)) - Math.max(Math.abs(a.lowImpact), Math.abs(a.highImpact));
    });
  }, [baseParams, baseEbit3y, lk]);

  var maxAbs = 0;
  scenarios.forEach(function (s) {
    var m = Math.max(Math.abs(s.lowImpact), Math.abs(s.highImpact));
    if (m > maxAbs) maxAbs = m;
  });
  if (!maxAbs) maxAbs = 1;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
      <div style={{ marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {lk === "fr" ? "Sensibilité Business Plan (EBIT cumulé 3 ans)" : "Business Plan sensitivity (3-year cumulative EBIT)"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {lk === "fr"
            ? "Impact sur l'EBIT cumulé 3 ans quand chaque paramètre du preset Marketplace varie. Base : "
            : "Impact on 3-year cumulative EBIT when each Marketplace parameter varies. Base: "}
          <strong style={{ color: baseEbit3y >= 0 ? "var(--color-success)" : "var(--color-error)" }}>{eur(baseEbit3y)}</strong>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {scenarios.map(function (s) {
          var lowPct = Math.min(100, Math.abs(s.lowImpact) / maxAbs * 50);
          var highPct = Math.min(100, Math.abs(s.highImpact) / maxAbs * 50);
          return (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "minmax(160px, 1fr) 2fr minmax(140px, auto)", gap: "var(--sp-3)", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{s.label}</div>
              <div style={{ position: "relative", height: 18, background: "var(--bg-accordion)", borderRadius: 4, display: "flex", justifyContent: "center" }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border-strong)" }} />
                {s.lowImpact < 0 ? (
                  <div style={{ position: "absolute", right: "50%", top: 0, bottom: 0, width: lowPct + "%", background: "var(--color-error)", opacity: 0.7, borderRadius: "4px 0 0 4px" }} />
                ) : (
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: lowPct + "%", background: "var(--color-success)", opacity: 0.5, borderRadius: "0 4px 4px 0" }} />
                )}
                {s.highImpact > 0 ? (
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: highPct + "%", background: "var(--color-success)", opacity: 0.7, borderRadius: "0 4px 4px 0" }} />
                ) : (
                  <div style={{ position: "absolute", right: "50%", top: 0, bottom: 0, width: highPct + "%", background: "var(--color-error)", opacity: 0.5, borderRadius: "4px 0 0 4px" }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 8, fontSize: 11, fontVariantNumeric: "tabular-nums", justifyContent: "flex-end" }}>
                <span style={{ color: s.lowImpact < 0 ? "var(--color-error)" : "var(--color-success)" }}>{s.lowImpact >= 0 ? "+" : ""}{eur(Math.round(s.lowImpact))}</span>
                <span style={{ color: "var(--text-faint)" }}>/</span>
                <span style={{ color: s.highImpact < 0 ? "var(--color-error)" : "var(--color-success)" }}>{s.highImpact >= 0 ? "+" : ""}{eur(Math.round(s.highImpact))}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SensitivityPage({ totalRevenue, monthlyCosts, salCosts, ebit, cfg, marketplaceProj }) {
  var tAll = useT();
  var t = tAll.sensitivity;
  var { lang } = useLang();
  var lk = lang;
  var [variation, setVariation] = useState(DEFAULT_VARIATION);
  var [exporting, setExporting] = useState(false);

  var bizType = cfg.businessType || "other";
  var hasData = totalRevenue > 0 || monthlyCosts > 0;

  /* Compute data for KPI cards + report */
  var data = useMemo(function () {
    if (!hasData) return [];
    var vars = (VARIABLES._universal || []).concat(VARIABLES[bizType] || []);
    var results = [];

    vars.forEach(function (v) {
      var lowImpact = computeImpact(v.id, -variation, ebit, totalRevenue, monthlyCosts, salCosts, cfg);
      var highImpact = computeImpact(v.id, variation, ebit, totalRevenue, monthlyCosts, salCosts, cfg);

      if (Math.abs(lowImpact) < 1 && Math.abs(highImpact) < 1) return;

      results.push({
        id: v.id,
        label: lk === "fr" ? v.label_fr : v.label_en,
        low: lowImpact,
        high: highImpact,
      });
    });

    results.sort(function (a, b) {
      return Math.max(Math.abs(b.low), Math.abs(b.high)) - Math.max(Math.abs(a.low), Math.abs(a.high));
    });

    return results;
  }, [totalRevenue, monthlyCosts, salCosts, ebit, cfg, bizType, variation, lk, hasData]);

  /* KPI values */
  var topVariable = data.length > 0 ? data[0] : null;
  var maxImpact = topVariable ? Math.max(Math.abs(topVariable.low), Math.abs(topVariable.high)) : 0;
  var varsCount = data.length;

  function handlePrint() {
    var html = generateSensitivityReport(data, ebit, variation, cfg, lk, t);
    printReportHtml(html);
  }

  function handleExport() {
    var html = generateSensitivityReport(data, ebit, variation, cfg, lk, t);
    downloadReportPdf(html, function () { setExporting(true); }, function () { setExporting(false); });
  }

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      icon={ChartLine} iconColor="#06B6D4"
      actions={hasData && data.length > 0 ? (
        <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
          <Button color="tertiary" size="lg" onClick={handlePrint} title={lk === "fr" ? "Imprimer le rapport" : "Print report"} iconLeading={<Printer size={14} weight="bold" />} sx={{ width: 40, minWidth: 40, padding: 0, justifyContent: "center" }} />
          <Button color="primary" size="lg" isDisabled={exporting} onClick={handleExport} iconLeading={exporting ? <CircleNotch size={14} weight="bold" style={{ animation: "spin 1s linear infinite" }} /> : <DownloadSimple size={14} weight="bold" />}>
            {exporting ? (lk === "fr" ? "Génération..." : "Generating...") : (lk === "fr" ? "Exporter" : "Export")}
          </Button>
        </div>
      ) : null}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>

        {marketplaceProj && marketplaceProj.years && marketplaceProj.years.length ? (
          <MarketplaceSensitivityCard cfg={cfg} lang={lang} />
        ) : null}

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-4)" }}>
          <KpiCard
            label={t.kpi_most_sensitive}
            value={topVariable ? topVariable.label : t.kpi_none}
            color={topVariable ? "var(--brand)" : "var(--text-faint)"}
          />
          <KpiCard
            label={t.kpi_max_impact}
            value={maxImpact > 0 ? eur(Math.round(maxImpact)) : t.kpi_no_data}
          />
          <KpiCard
            label={t.kpi_vars_analyzed}
            value={varsCount > 0 ? String(varsCount) : "0"}
          />
        </div>

        {/* Educational explainer */}
        <ExplainerBox variant="tip" title={t.explainer_title}>
          {t.explainer_body}
        </ExplainerBox>

        {/* Chart or skeleton */}
        {hasData ? (
          <SensitivityChart
            totalRevenue={totalRevenue}
            monthlyCosts={monthlyCosts}
            salCosts={salCosts}
            ebit={ebit}
            cfg={cfg}
            t={t}
            variation={variation}
            setVariation={setVariation}
          />
        ) : (
          <SkeletonChart t={t} />
        )}
      </div>
    </PageLayout>
  );
}
