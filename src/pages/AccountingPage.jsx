import { useMemo, useState } from "react";
import { Card, NumberField, PageLayout } from "../components";
import { InfoTip } from "../components/Tooltip";
import { eur, nm, pct } from "../utils";
import { salCalc } from "../utils";
import { calcStreamAnnual, calcStreamPcmn } from "../utils/revenueCalc";
import { useT, useLang } from "../context";
import { PCMN_OPTS } from "../constants/defaults";
import { Printer, Download, CaretDown } from "@phosphor-icons/react";
import { DevVal } from "../components";
var logoUrl = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 32"><rect width="32" height="32" rx="7" fill="#E8431A"/><text x="16" y="18" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" font-family="system-ui,sans-serif">F</text><text x="44" y="22" fill="#101828" font-size="18" font-weight="800" font-family="system-ui,sans-serif" letter-spacing="-0.3">Forecrest</text></svg>');

// ── Helpers ──

var PCMN_LABEL = {};
PCMN_OPTS.forEach(function (o) { PCMN_LABEL[o.c] = o.l; });

function pcmnLabel(code) { return PCMN_LABEL[code] || code; }

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-4)", color: "var(--text-primary)" }}>{children}</h3>;
}

function Row({ label, value, bold, indent, color, border }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "var(--sp-2) 0",
      paddingLeft: indent ? "var(--sp-4)" : 0,
      borderTop: border ? "1px solid var(--border)" : "none",
    }}>
      <span style={{ fontSize: 13, color: color || (bold ? "var(--text-primary)" : "var(--text-secondary)"), fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function SubRow({ label, monthly, annual }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 110px 110px", alignItems: "center",
      padding: "var(--sp-1) 0", paddingLeft: "var(--sp-6)",
    }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(monthly)}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(annual)}</span>
    </div>
  );
}

function PcmnHeader({ code, label, total }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 110px 110px", alignItems: "center",
      padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
        <span style={{ color: "var(--text-muted)", marginRight: "var(--sp-2)" }}>{code}</span>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(total)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(total * 12)}</span>
    </div>
  );
}

function ClassHeader({ label }) {
  return (
    <div style={{
      padding: "var(--sp-3) 0 var(--sp-2)",
      borderBottom: "2px solid var(--border)",
      marginTop: "var(--sp-3)",
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

function AdviceCard({ title, desc, priorityLabel, color, children }) {
  var borderColor = color === "success" ? "var(--color-success)" : color === "warning" ? "var(--color-warning)" : color === "error" ? "var(--color-error)" : "var(--brand)";
  var badgeBg = color === "success" ? "var(--color-success-bg)" : color === "warning" ? "var(--color-warning-bg)" : color === "error" ? "var(--color-error-bg)" : "var(--bg-accordion)";
  return (
    <div style={{
      padding: "var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
      borderLeft: "3px solid " + borderColor,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-2)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
        {priorityLabel ? (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: badgeBg, color: borderColor, whiteSpace: "nowrap" }}>{priorityLabel}</span>
        ) : null}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: children ? "var(--sp-3)" : 0 }}>{desc}</div>
      {children}
    </div>
  );
}

function AdviceRow({ label, value, bold, color, tip }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>{label}{tip ? <InfoTip tip={tip} /> : null}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

// ── Page ──

export default function AccountingPage({ costs, sals, cfg, debts, streams, totalRevenue, monthlyCosts, opCosts, salCosts, ebitda, isoc, netP, resLeg, annVatC, annVatD, vatBalance, esopMonthly, esopEnabled, setCosts }) {
  var tAll = useT();
  var t = tAll.accounting;
  var { lang } = useLang();
  var [chartOpen, setChartOpen] = useState(false);

  // ── 1. Chart of accounts: group items by PCMN code ──
  var pcmnMap = useMemo(function () {
    var map = {};

    function addEntry(code, label, monthly) {
      if (!map[code]) map[code] = { items: [], total: 0 };
      map[code].items.push({ label: label, monthly: monthly, annual: monthly * 12 });
      map[code].total += monthly;
    }

    // Cost items
    costs.forEach(function (cat) {
      cat.items.forEach(function (item) {
        var monthly = item.pu ? item.a * (item.u || 1) : item.a;
        if (monthly <= 0) return;
        addEntry(item.pcmn || "6160", item.l, monthly);
      });
    });

    // Salaries
    var totalBrut = 0;
    var totalPatr = 0;
    sals.forEach(function (s) {
      if (!s.net || s.net <= 0) return;
      var eO = s.type === "student" ? 0.0271 : cfg.onss;
      var eP = s.type === "student" ? 0 : cfg.patr;
      var sc = salCalc(s.net, eO, cfg.prec, eP);
      totalBrut += sc.brutO;
      totalPatr += sc.patrV;
    });
    if (totalBrut > 0) addEntry("6200", t.sal_brut, totalBrut);
    if (totalPatr > 0) addEntry("6210", t.sal_onss, totalPatr);

    // Revenue — from streams (v2 behavior-based)
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        var annual = calcStreamAnnual(item);
        if (annual <= 0) return;
        addEntry(calcStreamPcmn(item), item.l || cat.cat, annual / 12);
      });
    });

    // ISOC
    if (isoc > 0) addEntry("6700", t.isoc_label, isoc / 12);

    // Interest expense (class 65)
    var intAnn = 0;
    debts.forEach(function (d) {
      if (d.rate > 0 && d.amount > 0 && d.duration > d.elapsed) {
        var r = d.rate / 12;
        if (r > 0) {
          var pow = Math.pow(1 + r, d.duration);
          var powE = Math.pow(1 + r, d.elapsed);
          var bal = d.amount * (pow - powE) / (pow - 1);
          intAnn += bal * d.rate;
        }
      }
    });
    if (intAnn > 0) addEntry("6500", t.inc_interest, intAnn / 12);

    // ESOP expense
    if (esopEnabled && esopMonthly > 0) addEntry("6210", t.inc_esop, esopMonthly);

    // Class 1 — Equity & long-term debts
    if (cfg.capitalSocial > 0) addEntry("1000", t.bal_capital, cfg.capitalSocial / 12);
    if (resLeg > 0) addEntry("1300", t.bal_reserve, resLeg / 12);

    // Debt balances (class 17 LT, class 42 CT)
    debts.forEach(function (d) {
      if (d.amount <= 0) return;
      var rem = d.duration - d.elapsed;
      if (rem <= 0) return;
      var r = d.rate / 12;
      var bal = d.amount;
      if (r > 0 && d.duration > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var powE = Math.pow(1 + r, d.elapsed);
        bal = d.amount * (pow - powE) / (pow - 1);
      } else if (d.duration > 0) {
        bal = d.amount - (d.amount / d.duration) * d.elapsed;
      }
      if (bal <= 0) return;
      if (rem > 12) {
        addEntry("1700", d.label || t.bal_debt_lt, bal / 12);
      } else {
        addEntry("4200", d.label || t.bal_debt_ct, bal / 12);
      }
    });

    // VAT (class 4)
    if (annVatC > 0) addEntry("4510", t.vat_collected, annVatC / 12);
    if (annVatD > 0) addEntry("4110", t.vat_deductible, annVatD / 12);

    return map;
  }, [costs, sals, cfg, streams, totalRevenue, isoc, resLeg, debts, esopMonthly, esopEnabled, annVatC, annVatD, t]);

  // Group by PCMN class (first digit)
  var pcmnByClass = useMemo(function () {
    var classes = {};
    Object.keys(pcmnMap).sort().forEach(function (code) {
      var cls = code.charAt(0);
      if (!classes[cls]) classes[cls] = [];
      classes[cls].push({
        code: code,
        label: pcmnLabel(code),
        items: pcmnMap[code].items,
        total: pcmnMap[code].total,
      });
    });
    return classes;
  }, [pcmnMap]);

  var CLASS_LABELS = { "1": t.class_1, "2": t.class_2, "4": t.class_4, "6": t.class_6, "7": t.class_7 };

  // ── 2. Income statement aggregates ──
  var depreciationAnnual = 0;
  costs.forEach(function (cat) {
    cat.items.forEach(function (item) {
      if (item.pcmn && item.pcmn.startsWith("63")) {
        depreciationAnnual += (item.pu ? item.a * (item.u || 1) : item.a) * 12;
      }
    });
  });

  var servicesCosts = (opCosts - depreciationAnnual / 12) * 12; // class 61 approximation (opex minus depreciation)
  var salCostsAnnual = salCosts * 12;
  var esopAnnual = esopEnabled ? esopMonthly * 12 : 0;
  var annualInterest = 0;
  debts.forEach(function (d) {
    if (d.rate > 0 && d.amount > 0 && d.duration > d.elapsed) {
      var r = d.rate / 12;
      if (r > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var payment = d.amount * r * pow / (pow - 1);
        var powE = Math.pow(1 + r, d.elapsed);
        var bal = d.amount * (pow - powE) / (pow - 1);
        annualInterest += bal * d.rate;
      }
    }
  });

  var ebt = ebitda - annualInterest; // earnings before tax
  var resultNet = ebt - isoc;

  // ── 3. Balance sheet ──
  // Fixed assets (gross = monthly depreciation × 12 × amortYears)
  var fixedAssetsGross = 0;
  var accumulatedDepr = 0; // we show year-1 depreciation only (no start date tracked)
  var depItems = [];
  costs.forEach(function (cat, ci) {
    cat.items.forEach(function (item, ii) {
      if (item.pcmn && item.pcmn.startsWith("2")) {
        var monthly = item.pu ? item.a * (item.u || 1) : item.a;
        if (monthly <= 0) return;
        var years = item.amortYears || 3;
        var acq = monthly * 12 * years;
        var annDepr = monthly * 12;
        fixedAssetsGross += acq;
        accumulatedDepr += annDepr; // 1 year of depreciation
        depItems.push({ label: item.l, pcmn: item.pcmn, monthly: monthly, annual: annDepr, years: years, acquisition: acq, catIdx: ci, itemIdx: ii });
      }
    });
  });
  var fixedAssetsNet = fixedAssetsGross - accumulatedDepr;

  // Current assets (simplified: cash = initialCash + netP estimate)
  var cash = (cfg.initialCash || 0) + Math.max(netP, 0);

  var totalAssets = fixedAssetsNet + cash;

  // Equity
  var retainedEarnings = netP - resLeg;
  var totalEquity = cfg.capitalSocial + resLeg + retainedEarnings;

  // Debts
  var debtLT = 0;
  var debtCT = 0;
  debts.forEach(function (d) {
    if (d.amount <= 0) return;
    var rem = d.duration - d.elapsed;
    if (rem <= 0) return;
    var r = d.rate / 12;
    var bal = d.amount;
    if (r > 0 && d.duration > 0) {
      var pow = Math.pow(1 + r, d.duration);
      var powE = Math.pow(1 + r, d.elapsed);
      bal = d.amount * (pow - powE) / (pow - 1);
    } else if (d.duration > 0) {
      bal = d.amount - (d.amount / d.duration) * d.elapsed;
    }
    if (bal <= 0) return;
    if (rem > 12) { debtLT += bal; } else { debtCT += bal; }
  });

  var vatDue = vatBalance > 0 ? vatBalance : 0;
  var totalLiabilities = totalEquity + debtLT + debtCT + vatDue;

  // Adjust cash to balance (simplified model)
  var balancingCash = totalLiabilities - fixedAssetsNet;
  if (balancingCash < 0) balancingCash = 0;

  // ── 4. Depreciation schedule edit handler ──
  // Belgian law default amortization periods (AR/CIR 92, art. 196)
  var BELGIAN_DEFAULTS = {
    "2110": 5,  // Brevets, marques, licences — 3-5 ans (5 par défaut)
    "2400": 10, // Matériel et outillage — 5-10 ans
    "2410": 3,  // Matériel informatique — 3 ans
  };

  function handleAmortYearsChange(catIdx, itemIdx, newYears) {
    if (!newYears || newYears <= 0) return;
    setCosts(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      var item = next[catIdx] && next[catIdx].items[itemIdx];
      if (item) {
        var oldYears = item.amortYears || 3;
        var monthly = item.pu ? item.a * (item.u || 1) : item.a;
        var acquisition = monthly * 12 * oldYears;
        // Keep acquisition fixed, recalculate monthly dotation
        var newMonthly = acquisition / (12 * newYears);
        if (item.pu && (item.u || 1) > 1) {
          item.a = newMonthly / (item.u || 1);
        } else {
          item.a = newMonthly;
        }
        item.amortYears = newYears;
      }
      return next;
    });
  }

  function resetBelgianDefaults() {
    setCosts(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      next.forEach(function (cat) {
        cat.items.forEach(function (item) {
          if (item.pcmn && item.pcmn.startsWith("2") && BELGIAN_DEFAULTS[item.pcmn]) {
            var oldYears = item.amortYears || 3;
            var newYears = BELGIAN_DEFAULTS[item.pcmn];
            if (oldYears !== newYears) {
              var monthly = item.pu ? item.a * (item.u || 1) : item.a;
              var acquisition = monthly * 12 * oldYears;
              var newMonthly = acquisition / (12 * newYears);
              if (item.pu && (item.u || 1) > 1) {
                item.a = newMonthly / (item.u || 1);
              } else {
                item.a = newMonthly;
              }
            }
            item.amortYears = newYears;
          }
        });
      });
      return next;
    });
  }

  // ── 5. Print accounting view ──
  function handlePrint() {
    var isFr = lang === "fr";
    var fmt = function (v) { return v.toLocaleString(isFr ? "fr-BE" : "en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }); };
    var date = new Date().toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

    // Chart of accounts
    var chartHtml = "";
    ["1", "2", "6", "7"].forEach(function (cls) {
      if (!pcmnByClass[cls]) return;
      chartHtml += '<div class="cls-header">' + (CLASS_LABELS[cls] || "Classe " + cls) + '</div>';
      pcmnByClass[cls].forEach(function (group) {
        chartHtml += '<div class="pcmn-row"><span class="code">' + group.code + '</span><span class="lbl">' + group.label + '</span><span class="amt">' + fmt(group.total) + '</span><span class="amt">' + fmt(group.total * 12) + '</span></div>';
        group.items.forEach(function (item) {
          chartHtml += '<div class="sub-row"><span class="lbl">' + item.label + '</span><span class="amt">' + fmt(item.monthly) + '</span><span class="amt">' + fmt(item.annual) + '</span></div>';
        });
      });
    });

    // Income statement
    var incHtml = '<div class="row">' + '<span class="lbl b">70 - ' + t.inc_revenue + '</span><span class="amt b">' + fmt(totalRevenue) + '</span></div>';
    incHtml += '<div class="row"><span class="lbl">61 - ' + t.inc_services + '</span><span class="amt">' + fmt(-servicesCosts) + '</span></div>';
    incHtml += '<div class="row"><span class="lbl">62 - ' + t.inc_salaries + '</span><span class="amt">' + fmt(-salCostsAnnual) + '</span></div>';
    if (esopAnnual > 0) incHtml += '<div class="row"><span class="lbl">62 - ' + t.inc_esop + '</span><span class="amt">' + fmt(-esopAnnual) + '</span></div>';
    if (depreciationAnnual > 0) incHtml += '<div class="row"><span class="lbl">63 - ' + t.inc_depreciation + '</span><span class="amt">' + fmt(-depreciationAnnual) + '</span></div>';
    incHtml += '<div class="row sep"><span class="lbl b">' + t.inc_ebitda + '</span><span class="amt b">' + fmt(ebitda) + '</span></div>';
    if (annualInterest > 0) incHtml += '<div class="row"><span class="lbl">65 - ' + t.inc_interest + '</span><span class="amt">' + fmt(-annualInterest) + '</span></div>';
    incHtml += '<div class="row sep"><span class="lbl">' + t.inc_ebt + '</span><span class="amt">' + fmt(ebt) + '</span></div>';
    incHtml += '<div class="row"><span class="lbl">67 - ' + t.inc_isoc + '</span><span class="amt">' + fmt(-isoc) + '</span></div>';
    incHtml += '<div class="row sep"><span class="lbl b">' + t.inc_net + '</span><span class="amt b ' + (resultNet >= 0 ? "ok" : "err") + '">' + fmt(resultNet) + '</span></div>';

    // Balance sheet
    var balHtml = '<div class="bal-header">' + t.bal_assets + '</div>';
    if (fixedAssetsNet > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_fixed_assets + '</span><span class="amt">' + fmt(fixedAssetsNet) + '</span></div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_cash + '</span><span class="amt">' + fmt(balancingCash) + '</span></div>';
    balHtml += '<div class="row sep"><span class="lbl b">' + t.bal_total_assets + '</span><span class="amt b">' + fmt(fixedAssetsNet + balancingCash) + '</span></div>';
    balHtml += '<div class="bal-header" style="margin-top:12px">' + t.bal_liabilities + '</div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_capital + '</span><span class="amt">' + fmt(cfg.capitalSocial) + '</span></div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_reserve + '</span><span class="amt">' + fmt(resLeg) + '</span></div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_retained + '</span><span class="amt ' + (retainedEarnings >= 0 ? "" : "err") + '">' + fmt(retainedEarnings) + '</span></div>';
    balHtml += '<div class="row sep"><span class="lbl b">' + t.bal_equity_total + '</span><span class="amt b">' + fmt(totalEquity) + '</span></div>';
    if (debtLT > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_debt_lt + '</span><span class="amt">' + fmt(debtLT) + '</span></div>';
    if (debtCT > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_debt_ct + '</span><span class="amt">' + fmt(debtCT) + '</span></div>';
    if (vatDue > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_vat_due + '</span><span class="amt">' + fmt(vatDue) + '</span></div>';
    balHtml += '<div class="row sep"><span class="lbl b">' + t.bal_total_liabilities + '</span><span class="amt b">' + fmt(totalEquity + debtLT + debtCT + vatDue) + '</span></div>';

    // Depreciation schedule
    var depHtml = "";
    if (depItems.length > 0) {
      depHtml = '<div class="section"><div class="section-title">' + t.depr_title + '</div>';
      depHtml += '<div class="dep-header"><span class="dep-lbl">' + t.depr_item + '</span><span class="dep-amt">' + t.depr_acquisition + '</span><span class="dep-dur">' + t.depr_duration + '</span><span class="dep-amt">' + t.depr_annual + '</span></div>';
      depItems.forEach(function (d) {
        depHtml += '<div class="dep-row"><span class="dep-lbl"><span class="code">' + d.pcmn + '</span>' + d.label + '</span><span class="dep-amt">' + fmt(d.acquisition) + '</span><span class="dep-dur">' + d.years + ' ' + (isFr ? "ans" : "yr") + '</span><span class="dep-amt">' + fmt(d.annual) + '</span></div>';
      });
      var totalAcq = depItems.reduce(function (s, d) { return s + d.acquisition; }, 0);
      var totalAnnDepr = depItems.reduce(function (s, d) { return s + d.annual; }, 0);
      depHtml += '<div class="dep-row b"><span class="dep-lbl">' + t.depr_total + '</span><span class="dep-amt">' + fmt(totalAcq) + '</span><span class="dep-dur"></span><span class="dep-amt">' + fmt(totalAnnDepr) + '</span></div>';
      depHtml += '</div>';
    }

    // VAT
    var vatHtml = '<div class="section"><div class="section-title">' + t.vat_title + '</div>';
    vatHtml += '<div class="row"><span class="lbl">' + t.vat_collected + '</span><span class="amt">' + fmt(annVatC) + '</span></div>';
    vatHtml += '<div class="row"><span class="lbl">' + t.vat_deductible + '</span><span class="amt">' + fmt(annVatD) + '</span></div>';
    vatHtml += '<div class="row sep"><span class="lbl b">' + t.vat_balance + '</span><span class="amt b ' + (vatBalance >= 0 ? "err" : "ok") + '">' + fmt(vatBalance) + '</span></div>';
    vatHtml += '</div>';

    var html = '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="UTF-8"><title>' + t.title + '</title><style>' +
      '*{margin:0;padding:0;box-sizing:border-box}' +
      'body{font-family:Inter,system-ui,-apple-system,sans-serif;color:#101828;padding:32px;font-size:12px}' +
      '@page{size:A4 portrait;margin:14mm 16mm}' +
      '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}' +
      '.header{border-bottom:3px solid #E25536;padding-bottom:14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end}' +
      '.header img{height:32px}' +
      '.meta{text-align:right}.meta-title{font-size:14px;font-weight:700}.meta-date{font-size:11px;color:#667085;margin-top:2px}' +
      '.section{margin-bottom:20px}' +
      '.section-title{font-size:10px;font-weight:700;color:#E25536;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #FECDCA}' +
      '.cls-header{font-size:10px;font-weight:700;color:#E25536;text-transform:uppercase;letter-spacing:.06em;padding:10px 0 4px;border-bottom:2px solid #EAECF0;margin-top:8px}' +
      '.pcmn-row{display:flex;padding:6px 0;border-bottom:1px solid #F2F4F7;align-items:center}' +
      '.pcmn-row .code{font-family:monospace;font-size:10px;color:#98A2B3;min-width:44px}' +
      '.pcmn-row .lbl{flex:1;font-weight:600;color:#344054;font-size:12px}' +
      '.pcmn-row .amt{min-width:90px;text-align:right;font-weight:600;font-size:12px}' +
      '.sub-row{display:flex;padding:3px 0 3px 44px;border-bottom:1px solid #F9FAFB}' +
      '.sub-row .lbl{flex:1;color:#667085;font-size:11px}' +
      '.sub-row .amt{min-width:90px;text-align:right;color:#667085;font-size:11px}' +
      '.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}' +
      '.card{background:#fff;border:1px solid #EAECF0;border-radius:8px;padding:14px}' +
      '.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F2F4F7;font-size:12px}' +
      '.row:last-child{border-bottom:none}.row.sep{border-top:1px solid #D0D5DD;margin-top:4px;padding-top:6px}' +
      '.row .lbl{color:#475467}.row .amt{font-weight:500;color:#101828}' +
      '.b{font-weight:700!important;color:#101828!important}' +
      '.ok{color:#027A48!important}.err{color:#B42318!important}' +
      '.bal-header{font-size:10px;font-weight:700;color:#E25536;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}' +
      '.dep-header,.dep-row{display:flex;padding:4px 0;border-bottom:1px solid #F2F4F7;font-size:11px;align-items:center}' +
      '.dep-header{font-weight:600;color:#667085;text-transform:uppercase;font-size:10px;letter-spacing:.04em}' +
      '.dep-lbl{flex:1;color:#344054}.dep-amt{min-width:90px;text-align:right}.dep-dur{min-width:60px;text-align:center;color:#667085}' +
      '.dep-row .code{font-family:monospace;font-size:10px;color:#98A2B3;margin-right:6px}' +
      '.dep-row.b .dep-lbl{font-weight:700}.dep-row.b .dep-amt{font-weight:700}' +
      '.footer{margin-top:20px;padding-top:10px;border-top:1px solid #EAECF0;font-size:10px;color:#98A2B3;display:flex;justify-content:space-between}' +
      '</style></head><body>' +
      '<div class="header"><img src="' + logoUrl + '" alt="Logo" /><div class="meta"><div class="meta-title">' + t.title + '</div><div class="meta-date">' + date + '</div></div></div>' +
      '<div class="section"><div class="section-title">' + t.chart_title + '</div>' + chartHtml + '</div>' +
      '<div class="two-col"><div class="card"><div class="section-title">' + t.income_title + '</div>' + incHtml + '</div>' +
      '<div class="card"><div class="section-title">' + t.balance_title + '</div>' + balHtml + '</div></div>' +
      depHtml + vatHtml +
      '<div class="footer"><span></span><span>' + (isFr ? "Projections basées sur les paramètres actuels. Document non audité." : "Projections based on current parameters. Not audited.") + '</span></div>' +
      '</body></html>';

    var w = window.open("", "_blank", "width=860,height=900");
    if (!w) { alert(isFr ? "Autorisez les popups pour imprimer." : "Allow popups to print."); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 400);
  }

  // ── 6. CSV export ──
  function handleCsv() {
    var lines = [t.csv_header];
    ["1", "2", "6", "7"].forEach(function (cls) {
      if (!pcmnByClass[cls]) return;
      var clsLabel = CLASS_LABELS[cls] || "Classe " + cls;
      pcmnByClass[cls].forEach(function (group) {
        group.items.forEach(function (item) {
          lines.push([clsLabel, group.code, '"' + (item.label || "").replace(/"/g, '""') + '"', item.monthly.toFixed(2), item.annual.toFixed(2)].join(","));
        });
      });
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = t.csv_filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ── 7. Profit allocation advice ──
  var distributable = Math.max(resultNet - resLeg, 0);

  var currentMarketingAnnual = 0;
  costs.forEach(function (cat) {
    cat.items.forEach(function (item) {
      if (item.sub === "Marketing" || item.pcmn === "6140") {
        var m = item.pu ? item.a * (item.u || 1) : item.a;
        currentMarketingAnnual += m * 12;
      }
    });
  });
  var marketingPct = totalRevenue > 0 ? currentMarketingAnnual / totalRevenue : 0;
  var marketingTarget = totalRevenue * 0.20;
  var marketingGap = Math.max(marketingTarget - currentMarketingAnnual, 0);

  var equityRatio = (fixedAssetsNet + balancingCash) > 0 ? totalEquity / (fixedAssetsNet + balancingCash) : 0;
  var reserveTarget = cfg.capitalSocial * 0.10;
  var reserveDone = resLeg >= reserveTarget;

  var bonusSuggested = distributable * 0.10;
  var bonusMaxCCT90 = Math.max(resultNet, 0) * 0.30;

  var vvprbisNet = distributable * 0.85;
  var classicNet = distributable * 0.70;

  var actionBtnStyle = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "0 12px", height: 30,
    border: "1px solid var(--border)", borderRadius: "var(--r-full)",
    background: "transparent", color: "var(--text-secondary)",
    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  };

  return (
    <PageLayout title={t.title} subtitle={t.subtitle}
      actions={
        <>
          <button onClick={handleCsv} style={actionBtnStyle}>
            <Download size={14} />{t.export_csv}
          </button>
          <button onClick={handlePrint} style={actionBtnStyle}>
            <Printer size={14} />{tAll.settings.print}
          </button>
        </>
      }
    >
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>

        {/* ── Plan comptable (collapsible) ── */}
        <Card sx={{ gridColumn: "1 / -1" }}>
          <button
            onClick={function () { setChartOpen(!chartOpen); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", border: "none", background: "transparent",
              cursor: "pointer", padding: 0,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{t.chart_title}</h3>
            <CaretDown
              size={16}
              color="var(--text-muted)"
              style={{ transition: "transform 150ms", transform: chartOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {chartOpen ? (
            <div style={{ marginTop: "var(--sp-3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px", padding: "0 0 var(--sp-2)", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{t.chart_account}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", textAlign: "right" }}>{t.chart_monthly}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", textAlign: "right" }}>{t.chart_annual}</span>
              </div>

              {["1", "2", "6", "7"].map(function (cls) {
                if (!pcmnByClass[cls]) return null;
                return (
                  <div key={cls}>
                    <ClassHeader label={CLASS_LABELS[cls] || "Classe " + cls} />
                    {pcmnByClass[cls].map(function (group) {
                      return (
                        <div key={group.code} style={{ marginBottom: "var(--sp-2)" }}>
                          <PcmnHeader code={group.code} label={group.label} total={group.total} />
                          {group.items.map(function (item, i) {
                            return <SubRow key={i} label={item.label} monthly={item.monthly} annual={item.annual} />;
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>

        {/* ── Compte de résultat ── */}
        <Card>
          <SectionTitle>{t.income_title}</SectionTitle>
          <Row label={"70 - " + t.inc_revenue} value={<DevVal v={eur(totalRevenue)} f={"ARR net HT = " + eur(totalRevenue)} />} bold />
          <Row label={"61 - " + t.inc_services} value={<DevVal v={eur(-servicesCosts)} f={"opex - amort = " + eur(-servicesCosts)} />} />
          <Row label={"62 - " + t.inc_salaries} value={<DevVal v={eur(-salCostsAnnual)} f={eur(salCosts) + "/mois × 12 = " + eur(salCostsAnnual)} />} />
          {esopAnnual > 0 ? <Row label={"62 - " + t.inc_esop} value={<DevVal v={eur(-esopAnnual)} f={eur(esopMonthly) + "/mois × 12 = " + eur(esopAnnual)} />} /> : null}
          {depreciationAnnual > 0 ? <Row label={"63 - " + t.inc_depreciation} value={eur(-depreciationAnnual)} /> : null}
          <Row label={t.inc_ebitda} value={<DevVal v={eur(ebitda)} f={eur(totalRevenue) + " - " + eur(totalRevenue - ebitda) + " = " + eur(ebitda)} />} bold border />
          {annualInterest > 0 ? <Row label={"65 - " + t.inc_interest} value={eur(-annualInterest)} /> : null}
          <Row label={t.inc_ebt} value={<DevVal v={eur(ebt)} f={eur(ebitda) + " - " + eur(annualInterest) + " = " + eur(ebt)} />} bold={false} border />
          <Row label={"67 - " + t.inc_isoc} value={<DevVal v={eur(-isoc)} f={"20% × min(EBT,100k) + 25% × max(EBT-100k,0) = " + eur(isoc)} />} />
          <Row label={t.inc_net} value={<DevVal v={eur(resultNet)} f={eur(ebt) + " - " + eur(isoc) + " = " + eur(resultNet)} />} bold border color={resultNet >= 0 ? "var(--color-success)" : "var(--color-error)"} />

          <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>{t.inc_reserve}</span>
              <span style={{ fontWeight: 600 }}>{eur(resLeg)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: "var(--sp-1)" }}>
              <span style={{ color: "var(--text-muted)" }}>{t.inc_dividend}</span>
              <span style={{ fontWeight: 600 }}>{eur(Math.max(resultNet - resLeg, 0))}</span>
            </div>
          </div>
        </Card>

        {/* ── Bilan ── */}
        <Card>
          <SectionTitle>{t.balance_title}</SectionTitle>

          {/* ACTIF */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", marginBottom: "var(--sp-2)" }}>{t.bal_assets}</div>
          {fixedAssetsNet > 0 ? <Row label={t.bal_fixed_assets} value={eur(fixedAssetsNet)} indent /> : null}
          <Row label={t.bal_cash} value={eur(balancingCash)} indent />
          <Row label={t.bal_total_assets} value={<DevVal v={eur(fixedAssetsNet + balancingCash)} f={eur(fixedAssetsNet) + " + " + eur(balancingCash) + " = " + eur(fixedAssetsNet + balancingCash)} />} bold border />

          <div style={{ height: "var(--sp-4)" }} />

          {/* PASSIF */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", marginBottom: "var(--sp-2)" }}>{t.bal_liabilities}</div>
          <Row label={t.bal_capital} value={eur(cfg.capitalSocial)} indent />
          <Row label={t.bal_reserve} value={eur(resLeg)} indent />
          <Row label={t.bal_retained} value={<DevVal v={eur(retainedEarnings)} f={eur(netP) + " - " + eur(resLeg) + " = " + eur(retainedEarnings)} />} indent color={retainedEarnings >= 0 ? undefined : "var(--color-error)"} />
          <Row label={t.bal_equity_total} value={<DevVal v={eur(totalEquity)} f={eur(cfg.capitalSocial) + " + " + eur(resLeg) + " + " + eur(retainedEarnings) + " = " + eur(totalEquity)} />} bold border />

          {debtLT > 0 ? <Row label={t.bal_debt_lt} value={eur(debtLT)} indent /> : null}
          {debtCT > 0 ? <Row label={t.bal_debt_ct} value={eur(debtCT)} indent /> : null}
          {vatDue > 0 ? <Row label={t.bal_vat_due} value={eur(vatDue)} indent /> : null}
          <Row label={t.bal_total_liabilities} value={<DevVal v={eur(totalEquity + debtLT + debtCT + vatDue)} f={eur(totalEquity) + " + " + eur(debtLT + debtCT) + " + " + eur(vatDue) + " = " + eur(totalEquity + debtLT + debtCT + vatDue)} />} bold border />
        </Card>

        {/* ── Tableau d'amortissement ── */}
        {depItems.length > 0 ? (
          <Card sx={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{t.depr_title}</h3>
              <button
                onClick={resetBelgianDefaults}
                style={{
                  padding: "var(--sp-1) var(--sp-3)",
                  fontSize: 12, fontWeight: 500,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  background: "transparent",
                  color: "var(--brand)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t.depr_reset_belgian}
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 100px 100px", gap: "var(--sp-1)", padding: "0 0 var(--sp-2)", borderBottom: "1px solid var(--border)", minWidth: 540 }}>
              {[t.depr_item, t.depr_acquisition, t.depr_duration, t.depr_annual, t.depr_monthly].map(function (h) {
                return <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", textAlign: h === t.depr_item ? "left" : "right" }}>{h}</span>;
              })}
            </div>
            {depItems.map(function (d, i) {
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 100px 100px", gap: "var(--sp-1)", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)", minWidth: 540 }}>
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--text-muted)", marginRight: "var(--sp-2)", fontSize: 11 }}>{d.pcmn}</span>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(d.acquisition)}</span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <NumberField value={d.years} onChange={function (v) { handleAmortYearsChange(d.catIdx, d.itemIdx, v); }} min={1} max={20} step={1} width="80px" stepper />
                  </div>
                  <span style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(d.annual)}</span>
                  <span style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(d.monthly)}</span>
                </div>
              );
            })}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 100px 100px", gap: "var(--sp-1)", padding: "var(--sp-2) 0", borderTop: "1px solid var(--border)", minWidth: 540 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.depr_total}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(depItems.reduce(function (s, d) { return s + d.acquisition; }, 0))}</span>
              <span />
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(depItems.reduce(function (s, d) { return s + d.annual; }, 0))}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(depItems.reduce(function (s, d) { return s + d.monthly; }, 0))}</span>
            </div>
            </div>
          </Card>
        ) : null}

        {/* ── TVA Summary ── */}
        <Card sx={{ gridColumn: "1 / -1" }}>
          <SectionTitle>{t.vat_title}</SectionTitle>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.vat_collected}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}><DevVal v={eur(annVatC)} f={"grossFees × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2) + " = " + eur(annVatC)} /></div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.vat_deductible}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}><DevVal v={eur(annVatD)} f={"stripeFees × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2) + " = " + eur(annVatD)} /></div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.vat_balance}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: vatBalance >= 0 ? "var(--color-error)" : "var(--color-success)" }}><DevVal v={eur(vatBalance)} f={eur(annVatC) + " - " + eur(annVatD) + " = " + eur(vatBalance)} /></div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{vatBalance >= 0 ? t.vat_due : t.vat_credit}</div>
            </div>
          </div>
        </Card>

        {/* ── Affectation du résultat ── */}
        <Card sx={{ gridColumn: "1 / -1" }}>
          <SectionTitle>{t.advice_title}</SectionTitle>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.5 }}>{t.advice_subtitle}</p>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "var(--sp-3) var(--sp-4)", background: resultNet >= 0 ? "var(--color-success-bg)" : "var(--color-error-bg)",
            borderRadius: "var(--r-md)", marginBottom: "var(--sp-4)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.advice_distributable}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: resultNet >= 0 ? "var(--color-success)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}><DevVal v={eur(distributable)} f={eur(resultNet) + " - " + eur(resLeg) + " = " + eur(distributable)} /></span>
          </div>

          {resultNet <= 0 ? (
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--color-warning)", fontWeight: 500 }}>
              {t.advice_no_profit}
            </div>
          ) : null}

          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginTop: "var(--sp-3)" }}>

            {/* Marketing */}
            <AdviceCard
              title={t.advice_marketing_title}
              desc={t.advice_marketing_desc}
              priorityLabel={t.advice_high}
              color={marketingGap > 0 ? "warning" : "success"}
            >
              <AdviceRow label={t.advice_marketing_current} value={eur(currentMarketingAnnual) + " (" + pct(marketingPct) + ")"} />
              <AdviceRow label={t.advice_marketing_target} value={eur(marketingTarget)} />
              {marketingGap > 0 ? (
                <AdviceRow label={t.advice_marketing_gap} value={"+ " + eur(marketingGap)} bold color="var(--color-warning)" />
              ) : (
                <div style={{ fontSize: 12, color: "var(--color-success)", marginTop: "var(--sp-1)" }}>{t.advice_marketing_ok}</div>
              )}
            </AdviceCard>

            {/* Réserve légale */}
            {resultNet > 0 ? (
              <AdviceCard
                title={t.advice_reserve_title}
                desc={t.advice_reserve_desc}
                priorityLabel={t.advice_mandatory}
                color="brand"
              >
                {reserveDone ? (
                  <div style={{ fontSize: 12, color: "var(--color-success)" }}>{t.advice_reserve_done}</div>
                ) : (
                  <AdviceRow label={t.advice_reserve_needed} value={eur(resLeg)} bold />
                )}
              </AdviceCard>
            ) : null}

            {/* Capital */}
            <AdviceCard
              title={t.advice_capital_title}
              desc={t.advice_capital_desc}
              priorityLabel={equityRatio < 0.3 ? t.advice_high : t.advice_low}
              color={equityRatio < 0.3 ? "warning" : "success"}
            >
              <AdviceRow label={t.advice_capital_solvency} value={<DevVal v={pct(equityRatio)} f={eur(totalEquity) + " / " + eur(fixedAssetsNet + balancingCash) + " = " + pct(equityRatio)} />} bold color={equityRatio >= 0.3 ? "var(--color-success)" : "var(--color-warning)"} />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: "var(--sp-1)" }}>
                {equityRatio >= 0.3 ? t.advice_capital_ok : t.advice_capital_low}
              </div>
            </AdviceCard>

            {/* Réinvestissement */}
            <AdviceCard
              title={t.advice_reinvest_title}
              desc={t.advice_reinvest_desc}
              priorityLabel={t.advice_high}
              color="brand"
            />

            {/* Prime */}
            {resultNet > 0 ? (
              <AdviceCard
                title={t.advice_bonus_title}
                desc={t.advice_bonus_desc}
                priorityLabel={t.advice_medium}
                color="success"
              >
                <AdviceRow label={t.advice_bonus_suggested} value={<DevVal v={eur(bonusSuggested)} f={eur(distributable) + " × 10% = " + eur(bonusSuggested)} />} />
                <AdviceRow label={t.advice_bonus_max} value={<DevVal v={eur(bonusMaxCCT90)} f={eur(resultNet) + " × 30% = " + eur(bonusMaxCCT90)} />} bold />
              </AdviceCard>
            ) : null}

            {/* Dividendes */}
            {resultNet > 0 ? (
              <AdviceCard
                title={t.advice_dividend_title}
                desc={t.advice_dividend_desc}
                priorityLabel={t.advice_low}
                color="success"
              >
                <AdviceRow label={t.advice_dividend_gross} value={eur(distributable)} />
                <AdviceRow label={t.advice_dividend_vvprbis} value={<DevVal v={eur(vvprbisNet)} f={eur(distributable) + " × (1 - 15%) = " + eur(vvprbisNet)} />} bold color="var(--color-success)" tip={t.tip_vvpr} />
                <AdviceRow label={t.advice_dividend_classic} value={<DevVal v={eur(classicNet)} f={eur(distributable) + " × (1 - 30%) = " + eur(classicNet)} />} />
              </AdviceCard>
            ) : null}

          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
