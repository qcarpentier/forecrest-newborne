import { useMemo, useState, useRef, useCallback } from "react";
import { BookOpen, Shuffle } from "@phosphor-icons/react";
import { Card, NumberField, PageLayout, Button, KpiCard, SearchInput, FilterDropdown, DevVal, ButtonUtility } from "../components";
import { InfoTip } from "../components/Tooltip";
import { eur, eurShort, nm, pct } from "../utils";
import { salCalc, calcMonthlyPatronal, calcSocialDue } from "../utils";
import { calcStreamAnnual, calcStreamPcmn } from "../utils/revenueCalc";
import { useT, useLang, useDevMode, useGlossary, useTheme } from "../context";
import { PCMN_OPTS } from "../constants/defaults";
import { GLOSSARY } from "../constants";
import { Printer, Download, CaretDown, CaretUp, FileText, ShareNetwork, Scales, Receipt, ChartBar, Lightbulb, Table, Eye, ArrowSquareOut } from "@phosphor-icons/react";
var logoUrl = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 32"><rect width="32" height="32" rx="7" fill="#E8431A"/><text x="16" y="18" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" font-family="system-ui,sans-serif">F</text><text x="44" y="22" fill="#101828" font-size="18" font-weight="800" font-family="system-ui,sans-serif" letter-spacing="-0.3">Forecrest</text></svg>');

// ── Helpers ──

var PCMN_LABEL = {};
PCMN_OPTS.forEach(function (o) { PCMN_LABEL[o.c] = o.l; });

function pcmnLabel(code) { return PCMN_LABEL[code] || code; }

var TABS = ["results", "pcmn", "depreciation", "vat_advice"];

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

function SectionHeader({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", marginBottom: "var(--sp-2)", letterSpacing: "0.04em" }}>
      {children}
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

export default function AccountingPage({ costs, sals, cfg, debts, streams, stocks, totalRevenue, monthlyCosts, opCosts, salCosts, ebitda, isoc, netP, resLeg, annVatC, annVatD, vatBalance, esopMonthly, esopEnabled, setCosts, onNavigate, onRandomizeAll }) {
  var tAll = useT();
  var t = tAll.accounting;
  var { lang } = useLang();
  var lk = lang === "fr" ? "fr" : "en";
  var devCtx = useDevMode();
  var devMode = devCtx && devCtx.devMode;
  var { dark } = useTheme();
  var glossary = useGlossary();
  var devBadgeStyle = { marginLeft: 6, padding: "2px 6px", borderRadius: "var(--r-sm)", background: dark ? "var(--color-dev-banner-light)" : "var(--color-dev-banner-dark)", color: dark ? "var(--color-dev-banner-dark)" : "var(--color-dev-banner-light)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: "14px", verticalAlign: "middle" };
  var [activeTab, setActiveTab] = useState("results");
  var [pcmnSearch, setPcmnSearch] = useState("");
  var [pcmnFilter, setPcmnFilter] = useState("all");
  var [exportOpen, setExportOpen] = useState(false);
  var [collapsedClasses, setCollapsedClasses] = useState({});
  var exportRef = useRef(null);

  var toggleClass = useCallback(function (cls) {
    setCollapsedClasses(function (prev) {
      var next = Object.assign({}, prev);
      next[cls] = !next[cls];
      return next;
    });
  }, []);

  // PCMN code → glossary key mapping (built from glossary entries with pcmn field)
  var pcmnGlossaryMap = useMemo(function () {
    var map = {};
    GLOSSARY.forEach(function (entry) {
      if (entry.pcmn) {
        entry.pcmn.split("/").forEach(function (code) {
          map[code] = entry.id;
        });
      }
    });
    return map;
  }, []);

  // ── 1. Chart of accounts: group items by PCMN code ──
  var pcmnMap = useMemo(function () {
    var map = {};

    function addEntry(code, label, monthly, page) {
      if (!map[code]) map[code] = { items: [], total: 0 };
      map[code].items.push({ label: label, monthly: monthly, annual: monthly * 12, page: page || null });
      map[code].total += monthly;
    }

    // Cost items
    costs.forEach(function (cat) {
      cat.items.forEach(function (item) {
        var monthly = item.pu ? item.a * (item.u || 1) : item.a;
        if (monthly <= 0) return;
        var pg = (item.pcmn && item.pcmn.startsWith("2")) ? "equipment" : "opex";
        addEntry(item.pcmn || "6160", item.l, monthly, pg);
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
    if (totalBrut > 0) addEntry("6200", t.sal_brut, totalBrut, "salaries");
    if (totalPatr > 0) addEntry("6210", t.sal_onss, totalPatr, "salaries");

    // Revenue — from streams (v2 behavior-based)
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        var annual = calcStreamAnnual(item);
        if (annual <= 0) return;
        addEntry(calcStreamPcmn(item), item.l || cat.cat, annual / 12, "streams");
      });
    });

    // ISOC
    if (isoc > 0) addEntry("6700", t.isoc_label, isoc / 12, null);

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
    if (intAnn > 0) addEntry("6500", t.inc_interest, intAnn / 12, "debt");

    // ESOP expense
    if (esopEnabled && esopMonthly > 0) addEntry("6210", t.inc_esop, esopMonthly, "equity");

    // Class 1 — Equity & long-term debts
    if (cfg.capitalSocial > 0) addEntry("1000", t.bal_capital, cfg.capitalSocial / 12, "set");
    var capitalPremium = cfg.capitalPremium || 0;
    if (capitalPremium > 0) addEntry("1100", t.bal_premium, capitalPremium / 12, "set");
    if (resLeg > 0) addEntry("1300", t.bal_reserve, resLeg / 12, null);
    var retainedEarnings = netP - resLeg;
    if (retainedEarnings !== 0) addEntry("1400", t.bal_retained, retainedEarnings / 12, null);
    var shareholderLoans = cfg.shareholderLoans || 0;
    if (shareholderLoans > 0) addEntry("1740", t.bal_shareholder_loans, shareholderLoans / 12, "debt");

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
        addEntry("1700", d.label || t.bal_debt_lt, bal / 12, "debt");
      } else {
        addEntry("4200", d.label || t.bal_debt_ct, bal / 12, "debt");
      }
    });

    // Class 4 — Receivables & payables
    var receivables = (totalRevenue / 12) * (cfg.paymentTermsClient || 30) / 30;
    if (receivables > 0) addEntry("4000", t.bal_receivables, receivables / 12, null);
    if (annVatD > 0) addEntry("4110", t.vat_deductible, annVatD / 12, null);
    var suppliersBal = (opCosts || 0) * (cfg.paymentTermsSupplier || 30) / 30;
    if (suppliersBal > 0) addEntry("4400", t.bal_suppliers, suppliersBal / 12, "opex");
    var isocProvision = isoc;
    if (isocProvision > 0) addEntry("4500", t.bal_isoc_provision, isocProvision / 12, null);
    if (annVatC > 0) addEntry("4510", t.vat_collected, annVatC / 12, null);
    var monthlyPatr = calcMonthlyPatronal(sals, cfg);
    var socialDue = calcSocialDue(monthlyPatr);
    if (socialDue > 0) addEntry("4530", t.bal_social_due, socialDue / 12, "salaries");
    var prepaidExpenses = cfg.prepaidExpenses || 0;
    if (prepaidExpenses > 0) addEntry("4900", t.bal_prepaid, prepaidExpenses / 12, null);
    var deferredRevenue = cfg.deferredRevenue || 0;
    if (deferredRevenue > 0) addEntry("4930", t.bal_deferred_revenue, deferredRevenue / 12, null);

    // Class 3 — Stocks
    var stockValue = 0;
    (stocks || []).forEach(function (s) {
      var val = (s.unitCost || 0) * (s.quantity || 0);
      if (val > 0) {
        addEntry("3400", s.l || t.class_3_goods, val / 12, "stocks");
        stockValue += val;
      }
    });
    var obsolescence = cfg.stockObsolescence || 0;
    if (obsolescence > 0 && stockValue > 0) {
      addEntry("6310", t.stock_depreciation, stockValue * obsolescence / 12, "stocks");
    }

    // Class 5 — Cash & equivalents
    var initialCash = cfg.initialCash || 0;
    if (initialCash > 0) addEntry("5500", t.class_5_bank, initialCash / 12, "cashflow");

    return map;
  }, [costs, sals, cfg, streams, stocks, totalRevenue, isoc, resLeg, netP, debts, esopMonthly, esopEnabled, annVatC, annVatD, opCosts, salCosts, t]);

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

  var CLASS_LABELS = { "1": t.class_1, "2": t.class_2, "3": t.class_3, "4": t.class_4, "5": t.class_5, "6": t.class_6, "7": t.class_7 };
  var CLASS_SHORT = { "1": lang === "fr" ? "Fonds propres" : "Equity", "2": lang === "fr" ? "Immobilisations" : "Fixed assets", "3": lang === "fr" ? "Stocks" : "Inventory", "4": lang === "fr" ? "Créances/Dettes" : "Receivables/Payables", "5": lang === "fr" ? "Trésorerie" : "Cash", "6": lang === "fr" ? "Charges" : "Expenses", "7": lang === "fr" ? "Produits" : "Revenue" };

  // ── 2. Income statement aggregates ──
  var depreciationAnnual = 0;
  costs.forEach(function (cat) {
    cat.items.forEach(function (item) {
      if (item.pcmn && item.pcmn.startsWith("63")) {
        depreciationAnnual += (item.pu ? item.a * (item.u || 1) : item.a) * 12;
      }
    });
  });

  var servicesCosts = (opCosts - depreciationAnnual / 12) * 12;
  var salCostsAnnual = salCosts * 12;
  var esopAnnual = esopEnabled ? esopMonthly * 12 : 0;
  var annualInterest = 0;
  debts.forEach(function (d) {
    if (d.rate > 0 && d.amount > 0 && d.duration > d.elapsed) {
      var r = d.rate / 12;
      if (r > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var powE = Math.pow(1 + r, d.elapsed);
        var bal = d.amount * (pow - powE) / (pow - 1);
        annualInterest += bal * d.rate;
      }
    }
  });

  var ebt = ebitda - annualInterest;
  var resultNet = ebt - isoc;

  // ── 3. Balance sheet ──
  var fixedAssetsGross = 0;
  var accumulatedDepr = 0;
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
        accumulatedDepr += annDepr;
        depItems.push({ label: item.l, pcmn: item.pcmn, monthly: monthly, annual: annDepr, years: years, acquisition: acq, catIdx: ci, itemIdx: ii });
      }
    });
  });
  var fixedAssetsNet = fixedAssetsGross - accumulatedDepr;

  var bsStockValue = 0;
  (stocks || []).forEach(function (s) { bsStockValue += (s.unitCost || 0) * (s.quantity || 0); });
  var bsObsolescence = cfg.stockObsolescence || 0;
  if (bsObsolescence > 0) bsStockValue = bsStockValue * (1 - bsObsolescence);
  var bsReceivables = (totalRevenue / 12) * (cfg.paymentTermsClient || 30) / 30;
  var bsVatCredit = vatBalance < 0 ? Math.abs(vatBalance) : 0;
  var bsPrepaid = cfg.prepaidExpenses || 0;

  var bsCapitalPremium = cfg.capitalPremium || 0;
  var retainedEarnings = netP - resLeg;
  var totalEquity = cfg.capitalSocial + bsCapitalPremium + resLeg + retainedEarnings;

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
  var bsShareholderLoans = cfg.shareholderLoans || 0;
  var totalLtDebt = debtLT + bsShareholderLoans;

  var bsSuppliers = (opCosts || 0) * (cfg.paymentTermsSupplier || 30) / 30;
  var vatDue = vatBalance > 0 ? vatBalance : 0;
  var bsMonthlyPatr = calcMonthlyPatronal(sals, cfg);
  var bsSocialDue = calcSocialDue(bsMonthlyPatr);
  var bsIsocProv = isoc;
  var bsDeferred = cfg.deferredRevenue || 0;
  var totalStDebt = debtCT + bsSuppliers + vatDue + bsSocialDue + bsIsocProv + bsDeferred;

  var totalPassif = totalEquity + totalLtDebt + totalStDebt;
  var nonCashAssets = fixedAssetsNet + bsStockValue + bsReceivables + bsVatCredit + bsPrepaid;
  var balancingCash = totalPassif - nonCashAssets;
  var negativeEquity = totalEquity < 0;
  var totalAssets = nonCashAssets + balancingCash;

  var equityRatio = (fixedAssetsNet + balancingCash) > 0 ? totalEquity / (fixedAssetsNet + balancingCash) : 0;

  // ── 4. Depreciation schedule edit handler ──
  var BELGIAN_DEFAULTS = {
    "2110": 5,
    "2400": 10,
    "2410": 3,
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

  // ── 5. Flat PCMN items for DataTable ──
  var pcmnFlat = useMemo(function () {
    var rows = [];
    Object.keys(pcmnMap).sort().forEach(function (code) {
      var group = pcmnMap[code];
      group.items.forEach(function (item, idx) {
        rows.push({
          id: code + "-" + idx,
          code: code,
          cls: code.charAt(0),
          pcmnLabel: pcmnLabel(code),
          itemLabel: item.label,
          monthly: item.monthly,
          annual: item.annual,
          page: item.page,
        });
      });
    });
    return rows;
  }, [pcmnMap]);

  var pcmnFiltered = useMemo(function () {
    var items = pcmnFlat;
    if (pcmnFilter !== "all") {
      items = items.filter(function (r) { return r.cls === pcmnFilter; });
    }
    if (pcmnSearch.trim()) {
      var q = pcmnSearch.toLowerCase().trim();
      items = items.filter(function (r) {
        return r.code.includes(q) || r.pcmnLabel.toLowerCase().includes(q) || r.itemLabel.toLowerCase().includes(q);
      });
    }
    return items;
  }, [pcmnFlat, pcmnFilter, pcmnSearch]);

  var pcmnTabCounts = useMemo(function () {
    var counts = { all: pcmnFlat.length };
    pcmnFlat.forEach(function (r) {
      counts[r.cls] = (counts[r.cls] || 0) + 1;
    });
    return counts;
  }, [pcmnFlat]);

  var pcmnFilterOptions = useMemo(function () {
    var opts = [{ value: "all", label: lang === "fr" ? "Toutes les classes" : "All classes" }];
    ["1", "2", "3", "4", "5", "6", "7"].forEach(function (cls) {
      if (pcmnTabCounts[cls]) {
        opts.push({ value: cls, label: CLASS_SHORT[cls] + " (" + pcmnTabCounts[cls] + ")" });
      }
    });
    return opts;
  }, [pcmnTabCounts, lang]);

  // ── Grouped data for collapsible table ──
  var pcmnGrouped = useMemo(function () {
    var groups = [];
    ["1", "2", "3", "4", "5", "6", "7"].forEach(function (cls) {
      var items = pcmnFiltered.filter(function (r) { return r.cls === cls; });
      if (items.length === 0) return;
      var clsMonthly = items.reduce(function (s, r) { return s + r.monthly; }, 0);
      var clsAnnual = items.reduce(function (s, r) { return s + r.annual; }, 0);
      groups.push({ cls: cls, label: CLASS_LABELS[cls] || ("Classe " + cls), short: CLASS_SHORT[cls], items: items, monthly: clsMonthly, annual: clsAnnual });
    });
    return groups;
  }, [pcmnFiltered, t, lang]);

  // ── Helper: find glossary key for a PCMN code ──
  function findGlossaryKey(code) {
    if (pcmnGlossaryMap[code]) return pcmnGlossaryMap[code];
    // Try first 2 digits
    var p2 = code.substring(0, 2);
    if (pcmnGlossaryMap[p2]) return pcmnGlossaryMap[p2];
    // Try first digit
    var p1 = code.substring(0, 1);
    if (pcmnGlossaryMap[p1]) return pcmnGlossaryMap[p1];
    return null;
  }

  // ── 6. Exports ──

  function handlePrint() {
    var isFr = lang === "fr";
    var fmt = function (v) { return v.toLocaleString(isFr ? "fr-BE" : "en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }); };
    var now = new Date();
    var date = now.toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
    var timeStr = now.toLocaleTimeString(isFr ? "fr-BE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
    var cn = cfg.companyName || "";
    var fn = [cfg.firstName, cfg.lastName].filter(Boolean).join(" ");
    var userRole = cfg.userRole || "";
    var lf = cfg.legalForm || "";
    var tva = cfg.tvaNumber || "";

    var chartHtml = "";
    ["1", "2", "3", "4", "5", "6", "7"].forEach(function (cls) {
      if (!pcmnByClass[cls]) return;
      chartHtml += '<div class="cls-header">' + (CLASS_LABELS[cls] || "Classe " + cls) + '</div>';
      pcmnByClass[cls].forEach(function (group) {
        chartHtml += '<div class="pcmn-row"><span class="code">' + group.code + '</span><span class="lbl">' + group.label + '</span><span class="amt">' + fmt(group.total) + '</span><span class="amt">' + fmt(group.total * 12) + '</span></div>';
        group.items.forEach(function (item) {
          chartHtml += '<div class="sub-row"><span class="lbl">' + item.label + '</span><span class="amt">' + fmt(item.monthly) + '</span><span class="amt">' + fmt(item.annual) + '</span></div>';
        });
      });
    });

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

    var balHtml = '<div class="bal-header">' + t.bal_assets + '</div>';
    if (fixedAssetsNet > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_fixed_assets + '</span><span class="amt">' + fmt(fixedAssetsNet) + '</span></div>';
    if (bsStockValue > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_stocks + '</span><span class="amt">' + fmt(bsStockValue) + '</span></div>';
    if (bsReceivables > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_receivables + '</span><span class="amt">' + fmt(bsReceivables) + '</span></div>';
    if (bsVatCredit > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_vat_credit + '</span><span class="amt">' + fmt(bsVatCredit) + '</span></div>';
    if (bsPrepaid > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_prepaid + '</span><span class="amt">' + fmt(bsPrepaid) + '</span></div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_cash + '</span><span class="amt">' + fmt(balancingCash) + '</span></div>';
    balHtml += '<div class="row sep"><span class="lbl b">' + t.bal_total_assets + '</span><span class="amt b">' + fmt(totalAssets) + '</span></div>';
    balHtml += '<div class="bal-header" style="margin-top:12px">' + t.bal_liabilities + '</div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_capital + '</span><span class="amt">' + fmt(cfg.capitalSocial) + '</span></div>';
    if (bsCapitalPremium > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_premium + '</span><span class="amt">' + fmt(bsCapitalPremium) + '</span></div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_reserve + '</span><span class="amt">' + fmt(resLeg) + '</span></div>';
    balHtml += '<div class="row"><span class="lbl">' + t.bal_retained + '</span><span class="amt ' + (retainedEarnings >= 0 ? "" : "err") + '">' + fmt(retainedEarnings) + '</span></div>';
    balHtml += '<div class="row sep"><span class="lbl b">' + t.bal_equity_total + '</span><span class="amt b">' + fmt(totalEquity) + '</span></div>';
    if (debtLT > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_debt_lt + '</span><span class="amt">' + fmt(debtLT) + '</span></div>';
    if (bsShareholderLoans > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_shareholder_loans + '</span><span class="amt">' + fmt(bsShareholderLoans) + '</span></div>';
    if (debtCT > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_debt_ct + '</span><span class="amt">' + fmt(debtCT) + '</span></div>';
    if (bsSuppliers > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_suppliers + '</span><span class="amt">' + fmt(bsSuppliers) + '</span></div>';
    if (vatDue > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_vat_due + '</span><span class="amt">' + fmt(vatDue) + '</span></div>';
    if (bsSocialDue > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_social_due + '</span><span class="amt">' + fmt(bsSocialDue) + '</span></div>';
    if (bsIsocProv > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_isoc_provision + '</span><span class="amt">' + fmt(bsIsocProv) + '</span></div>';
    if (bsDeferred > 0) balHtml += '<div class="row"><span class="lbl">' + t.bal_deferred_revenue + '</span><span class="amt">' + fmt(bsDeferred) + '</span></div>';
    balHtml += '<div class="row sep"><span class="lbl b">' + t.bal_total_liabilities + '</span><span class="amt b">' + fmt(totalPassif) + '</span></div>';

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
      '.meta{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px}' +
      '.meta-title{font-size:13px;font-weight:700;color:#101828}' +
      '.meta-entity{font-size:10px;color:#667085;line-height:1.4}' +
      '.meta-entity strong{color:#344054;font-weight:600}' +
      '.meta-badge{font-size:9px;font-weight:600;color:#667085;background:#F2F4F7;border:1px solid #EAECF0;border-radius:3px;padding:1px 5px;vertical-align:middle;margin-left:4px}' +
      '.meta-tag{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#E25536;background:#FEF3F2;border:1px solid #FECDCA;border-radius:3px;padding:1px 6px}' +
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
      (function () {
        var printedLabel = isFr ? "Version imprimée" : "Printed version";
        var metaHtml = '<div class="meta-title">' + date + ' · ' + timeStr + '</div>';
        if (cn) { metaHtml += '<div class="meta-entity"><strong>' + cn.replace(/</g, "&lt;") + '</strong>' + (lf ? ' <span class="meta-badge">' + lf + '</span>' : '') + '</div>'; }
        if (tva) { metaHtml += '<div class="meta-entity">TVA&nbsp;' + tva.replace(/</g, "&lt;") + '</div>'; }
        if (fn) { metaHtml += '<div class="meta-entity">' + (isFr ? "Resp. légal&nbsp;: " : "Legal rep.&nbsp;: ") + '<strong>' + fn.replace(/</g, "&lt;") + '</strong>' + (userRole ? ' · ' + userRole.replace(/</g, "&lt;") : '') + '</div>'; }
        metaHtml += '<div class="meta-tag">' + printedLabel + '</div>';
        return '<div class="header"><div class="logo" style="display:flex;align-items:center;gap:10px"><div style="width:28px;height:28px;border-radius:6px;background:#E25536;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;font-family:system-ui">F</div><div style="font-size:16px;font-weight:800;letter-spacing:-0.03em;color:#101828">Forecrest</div></div><div class="meta">' + metaHtml + '</div></div>';
      })() +
      '<div style="margin-bottom:20px"><div style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#101828;margin-bottom:4px">' + t.title + '</div><div style="font-size:12px;color:#667085;line-height:1.5">' + (isFr ? "Vue comptable consolidée de votre activité. Montants projetés sur l'exercice en cours." : "Consolidated accounting view of your activity. Projected amounts for the current period.") + '</div></div>' +
      '<div class="section"><div class="section-title">' + t.chart_title + '</div>' + chartHtml + '</div>' +
      '<div class="two-col"><div class="card"><div class="section-title">' + t.income_title + '</div>' + incHtml + '</div>' +
      '<div class="card"><div class="section-title">' + t.balance_title + '</div>' + balHtml + '</div></div>' +
      depHtml + vatHtml +
      (function () {
        var desc = isFr ? "Forecrest est un outil de plan financier structuré pour les start-ups belges. Modélisez vos revenus, charges, trésorerie et comptabilité en toute simplicité." : "Forecrest is a structured financial planning tool for Belgian start-ups. Model your revenues, costs, cash flow and accounting with ease.";
        var disclaimer = isFr ? "Ce document a été généré automatiquement via Forecrest.app. Les données sont des projections prévisionnelles non auditées et ne constituent pas un avis comptable ou juridique. Conformément au droit belge (Code des sociétés et des associations, art. 5:4), tout plan financier doit être établi ou validé par un professionnel agréé." : "This document was automatically generated via Forecrest.app. The data are unaudited financial projections and do not constitute accounting or legal advice. Under Belgian law (Companies and Associations Code, art. 5:4), any financial plan must be prepared or validated by a licensed professional.";
        var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=52x52&data=https://github.com/Thomasvtrn/&color=E25536&bgcolor=F2F4F7";
        return '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #EAECF0;display:flex;justify-content:space-between;align-items:flex-start;gap:16px">' +
          '<div style="font-size:10px;color:#98A2B3;line-height:1.6">' +
          '<div style="font-size:11px;font-weight:700;color:#344054;margin-bottom:2px">Forecrest — ' + (isFr ? "Plan financier" : "Financial plan") + '</div>' +
          '<div style="font-size:10px;color:#667085;max-width:400px;line-height:1.5">' + desc + '</div>' +
          '<a style="font-size:10px;color:#E25536;text-decoration:none" href="https://forecrest.app">forecrest.app</a></div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">' +
          '<div style="width:52px;height:52px;background:#F2F4F7;border-radius:4px;overflow:hidden"><img src="' + qrUrl + '" style="width:52px;height:52px" alt="QR" /></div>' +
          '<div style="font-size:9px;color:#B0B7C3;max-width:260px;text-align:right;line-height:1.4;font-style:italic">' + disclaimer + '</div>' +
          '</div></div>';
      })() +
      '</body></html>';

    var w = window.open("", "_blank", "width=860,height=900");
    if (!w) { alert(isFr ? "Autorisez les popups pour imprimer." : "Allow popups to print."); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 400);
  }

  function handleCsv() {
    var lines = [t.csv_header];
    ["1", "2", "3", "4", "5", "6", "7"].forEach(function (cls) {
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

  function handleBelgianCsv() {
    var isFr = lang === "fr";
    var header = "Journal;Date;Compte;Libellé;Débit;Crédit";
    var lines = [header];
    var date = new Date().toLocaleDateString("fr-BE", { year: "numeric", month: "2-digit", day: "2-digit" });
    ["1", "2", "3", "4", "5", "6", "7"].forEach(function (cls) {
      if (!pcmnByClass[cls]) return;
      pcmnByClass[cls].forEach(function (group) {
        group.items.forEach(function (item) {
          var isDebit = cls === "2" || cls === "3" || cls === "5" || cls === "6";
          var debit = isDebit ? item.annual.toFixed(2) : "0.00";
          var credit = isDebit ? "0.00" : item.annual.toFixed(2);
          lines.push(["OD", date, group.code, '"' + (item.label || "").replace(/"/g, '""') + '"', debit, credit].join(";"));
        });
      });
    });
    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = isFr ? "plan_comptable_belge.csv" : "belgian_chart_of_accounts.csv";
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

  var reserveTarget = cfg.capitalSocial * 0.10;
  var reserveDone = resLeg >= reserveTarget;

  var bonusSuggested = distributable * 0.10;
  var bonusMaxCCT90 = Math.max(resultNet, 0) * 0.30;

  var vvprbisNet = distributable * 0.85;
  var classicNet = distributable * 0.70;

  // ── Tab labels & counts ──
  var TAB_LABELS = {
    results: t.tab_results || (lang === "fr" ? "Résultat & Bilan" : "Results & Balance"),
    pcmn: t.tab_pcmn || (lang === "fr" ? "Plan comptable" : "Chart of Accounts"),
    depreciation: t.tab_depreciation || (lang === "fr" ? "Amortissements" : "Depreciation"),
    vat_advice: t.tab_vat_advice || (lang === "fr" ? "TVA & Conseils" : "VAT & Advice"),
  };
  var TAB_COUNTS = {
    results: null,
    pcmn: pcmnFlat.length,
    depreciation: depItems.length,
    vat_advice: null,
  };

  // ── PCMN empty state ──
  var pcmnEmpty = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-8) 0" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "var(--r-lg)",
        background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Table size={24} weight="duotone" color="var(--brand)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
        {lang === "fr" ? "Aucun compte comptable" : "No accounting entries"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {lang === "fr" ? "Ajoutez des revenus, charges ou salaires pour voir le plan comptable." : "Add revenue, costs or salaries to see the chart of accounts."}
      </div>
    </div>
  );

  return (
    <PageLayout title={t.title} subtitle={t.subtitle} icon={BookOpen} iconColor="#6B7280">

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_revenue || (lang === "fr" ? "Chiffre d'affaires" : "Revenue")} value={eurShort(totalRevenue)} fullValue={eur(totalRevenue)} glossaryKey="annual_revenue" />
        <KpiCard label={t.kpi_net_result || (lang === "fr" ? "Résultat net" : "Net result")} value={eurShort(resultNet)} fullValue={eur(resultNet)} glossaryKey="net_profit" />
        <KpiCard label={t.kpi_cash || (lang === "fr" ? "Trésorerie" : "Cash")} value={eurShort(balancingCash)} fullValue={eur(balancingCash)} glossaryKey="treasury" />
        <KpiCard label={t.kpi_equity_ratio || (lang === "fr" ? "Ratio de solvabilité" : "Equity ratio")} value={pct(equityRatio)} glossaryKey="solvency_ratio" />
      </div>

      {/* ── Insight Cards (below KPIs, like Revenue/Charges pages) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Mini P&L */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {t.insight_pnl || (lang === "fr" ? "Compte de résultat" : "Income Statement")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.inc_revenue || (lang === "fr" ? "Chiffre d'affaires" : "Revenue")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{eur(totalRevenue)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.inc_total_costs || (lang === "fr" ? "Charges totales" : "Total costs")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>- {eur(opCosts * 12 + salCosts * 12)}</span>
            </div>
            <div style={{ height: 1, background: "var(--border-light)", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t.insight_operating_result || (lang === "fr" ? "Résultat d'exploitation" : "Operating result")}</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{eur(ebitda)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.isoc_label || "ISOC"}</span>
              <span style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>- {eur(isoc)}</span>
            </div>
            <div style={{ height: 1, background: "var(--border-light)", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t.inc_net_result || (lang === "fr" ? "Résultat net" : "Net result")}</span>
              <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: resultNet >= 0 ? "var(--color-success)" : "var(--color-error)" }}>{eur(resultNet)}</span>
            </div>
            {/* Margin indicator */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>{t.insight_margin || (lang === "fr" ? "Marge nette" : "Net margin")}</span>
                <span>{totalRevenue > 0 ? pct(resultNet / totalRevenue) : "—"}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                {totalRevenue > 0 ? (
                  <div style={{ width: Math.max(0, Math.min(resultNet / totalRevenue * 100, 100)) + "%", height: "100%", background: resultNet >= 0 ? "var(--color-success)" : "var(--color-error)", borderRadius: 3, transition: "width 0.3s" }} />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Balance + Share */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          {/* Mini Balance Sheet */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: "1 1 auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
              {t.insight_balance || (lang === "fr" ? "Bilan simplifié" : "Balance Sheet")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.bal_total_assets || (lang === "fr" ? "Total actif" : "Total assets")}</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(totalAssets)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.bal_equity_total || (lang === "fr" ? "Fonds propres" : "Equity")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: totalEquity >= 0 ? "var(--text-primary)" : "var(--color-error)" }}>{eur(totalEquity)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.insight_liabilities || (lang === "fr" ? "Dettes" : "Liabilities")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(totalLtDebt + totalStDebt)}</span>
            </div>
            {/* Equity vs Liabilities proportional bar */}
            <div style={{ marginTop: "var(--sp-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>{t.insight_equity_share || (lang === "fr" ? "Part fonds propres" : "Equity share")}</span>
                <span>{totalPassif > 0 ? pct(totalEquity / totalPassif) : "—"}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden", display: "flex" }}>
                {totalPassif > 0 ? (
                  <div style={{ width: Math.max(0, Math.min(totalEquity / totalPassif * 100, 100)) + "%", height: "100%", background: totalEquity >= 0 ? "var(--brand)" : "var(--color-error)", borderRadius: 3, transition: "width 0.3s" }} />
                ) : null}
              </div>
            </div>
          </div>

          {/* Share with accountant */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: "0 0 auto" }}>
            <div style={{ marginBottom: "var(--sp-2)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t.pcmn_share_title || (lang === "fr" ? "Partagez avec votre comptable" : "Share with your accountant")}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "var(--sp-3)" }}>
              {t.pcmn_share_desc || (lang === "fr" ? "Exportez le plan comptable PCMN pour votre comptable." : "Export the PCMN chart of accounts for your accountant.")}
            </div>
            <div style={{ display: "flex", gap: "var(--sp-2)" }}>
              <Button color="primary" size="lg" onClick={handlePrint} iconLeading={<Printer size={14} weight="bold" />}>
                {tAll.settings.print}
              </Button>
              <div style={{ position: "relative" }} ref={exportRef}>
                <Button
                  color="tertiary" size="lg"
                  onClick={function () { setExportOpen(function (v) { return !v; }); }}
                  iconLeading={<Download size={14} weight="bold" />}
                  iconTrailing={<CaretDown size={10} weight="bold" style={{ opacity: 0.5 }} />}
                >
                  {t.export_label || "Export"}
                </Button>
                {exportOpen ? (
                  <>
                    <div onClick={function () { setExportOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 51,
                      minWidth: 200,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
                      padding: "var(--sp-1)",
                      animation: "tooltipIn 0.1s ease",
                    }}>
                      <button
                        type="button"
                        onClick={function () { handleBelgianCsv(); setExportOpen(false); }}
                        onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "8px var(--sp-2)",
                          border: "none", borderRadius: "var(--r-sm)",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                          cursor: "pointer", textAlign: "left",
                          transition: "background 0.1s",
                        }}
                      >
                        <FileText size={14} weight="bold" color="var(--text-muted)" />
                        Excel
                      </button>
                      <button
                        type="button"
                        onClick={function () { handleCsv(); setExportOpen(false); }}
                        onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "8px var(--sp-2)",
                          border: "none", borderRadius: "var(--r-sm)",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                          cursor: "pointer", textAlign: "left",
                          transition: "background 0.1s",
                        }}
                      >
                        <Download size={14} weight="bold" color="var(--text-muted)" />
                        CSV
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-lg)" }}>
        {TABS.map(function (tabKey) {
          var isActive = activeTab === tabKey;
          var count = TAB_COUNTS[tabKey];
          return (
            <button
              key={tabKey}
              type="button"
              onClick={function () { setActiveTab(tabKey); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 0,
                padding: "var(--sp-2) var(--sp-4)",
                border: "none",
                borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2,
                background: "transparent",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.12s, border-color 0.12s",
              }}
            >
              {TAB_LABELS[tabKey]}
              {count != null && count > 0 ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 18, height: 18, padding: "0 5px", marginLeft: 6,
                  borderRadius: "var(--r-full)",
                  background: isActive ? "var(--brand)" : "var(--bg-hover)",
                  color: isActive ? "white" : "var(--text-muted)",
                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Results ── */}
      {activeTab === "results" ? (
        <div>
          {/* Warnings */}
          {negativeEquity ? (
            <div style={{ marginBottom: "var(--gap-md)", padding: "var(--sp-3) var(--sp-4)", background: "var(--color-error-bg)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--color-error)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-error)", marginBottom: "var(--sp-1)" }}>{t.warn_negative_equity_title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.warn_negative_equity_desc}</div>
            </div>
          ) : null}
          {balancingCash < 0 ? (
            <div style={{ marginBottom: "var(--gap-md)", padding: "var(--sp-3) var(--sp-4)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--color-warning)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-warning)", marginBottom: "var(--sp-1)" }}>{t.warn_negative_cash_title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.warn_negative_cash_desc}</div>
            </div>
          ) : null}

          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
            {/* Income Statement */}
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-4)", color: "var(--text-primary)" }}>{t.income_title}</h3>
              <Row label={(cfg.showPcmn ? "70 - " : "") + t.inc_revenue} value={<DevVal v={eur(totalRevenue)} f={"ARR net HT = " + eur(totalRevenue)} />} bold />
              <Row label={(cfg.showPcmn ? "61 - " : "") + t.inc_services} value={<DevVal v={eur(-servicesCosts)} f={"opex - amort = " + eur(-servicesCosts)} />} />
              <Row label={(cfg.showPcmn ? "62 - " : "") + t.inc_salaries} value={<DevVal v={eur(-salCostsAnnual)} f={eur(salCosts) + "/mois × 12 = " + eur(salCostsAnnual)} />} />
              {esopAnnual > 0 ? <Row label={(cfg.showPcmn ? "62 - " : "") + t.inc_esop} value={<DevVal v={eur(-esopAnnual)} f={eur(esopMonthly) + "/mois × 12 = " + eur(esopAnnual)} />} /> : null}
              {depreciationAnnual > 0 ? <Row label={(cfg.showPcmn ? "63 - " : "") + t.inc_depreciation} value={eur(-depreciationAnnual)} /> : null}
              <Row label={t.inc_ebitda} value={<DevVal v={eur(ebitda)} f={eur(totalRevenue) + " - " + eur(totalRevenue - ebitda) + " = " + eur(ebitda)} />} bold border />
              {annualInterest > 0 ? <Row label={(cfg.showPcmn ? "65 - " : "") + t.inc_interest} value={eur(-annualInterest)} /> : null}
              <Row label={t.inc_ebt} value={<DevVal v={eur(ebt)} f={eur(ebitda) + " - " + eur(annualInterest) + " = " + eur(ebt)} />} bold={false} border />
              <Row label={(cfg.showPcmn ? "67 - " : "") + t.inc_isoc} value={<DevVal v={eur(-isoc)} f={"20% × min(EBT,100k) + 25% × max(EBT-100k,0) = " + eur(isoc)} />} />
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

            {/* Balance Sheet */}
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-4)", color: "var(--text-primary)" }}>{t.balance_title}</h3>

              <SectionHeader>{t.bal_assets}</SectionHeader>
              {fixedAssetsNet > 0 ? <Row label={t.bal_fixed_assets} value={eur(fixedAssetsNet)} indent /> : null}
              {bsStockValue > 0 ? <Row label={t.bal_stocks} value={eur(bsStockValue)} indent /> : null}
              {bsReceivables > 0 ? <Row label={t.bal_receivables} value={eur(bsReceivables)} indent /> : null}
              {bsVatCredit > 0 ? <Row label={t.bal_vat_credit} value={eur(bsVatCredit)} indent /> : null}
              {bsPrepaid > 0 ? <Row label={t.bal_prepaid} value={eur(bsPrepaid)} indent /> : null}
              <Row label={t.bal_cash} value={eur(balancingCash)} indent />
              <Row label={t.bal_total_assets} value={<DevVal v={eur(totalAssets)} f={eur(nonCashAssets) + " + " + eur(balancingCash) + " = " + eur(totalAssets)} />} bold border />

              <div style={{ height: "var(--sp-4)" }} />

              <SectionHeader>{t.bal_liabilities}</SectionHeader>
              <Row label={t.bal_capital} value={eur(cfg.capitalSocial)} indent />
              {bsCapitalPremium > 0 ? <Row label={t.bal_premium} value={eur(bsCapitalPremium)} indent /> : null}
              <Row label={t.bal_reserve} value={eur(resLeg)} indent />
              <Row label={t.bal_retained} value={<DevVal v={eur(retainedEarnings)} f={eur(netP) + " - " + eur(resLeg) + " = " + eur(retainedEarnings)} />} indent color={retainedEarnings >= 0 ? undefined : "var(--color-error)"} />
              <Row label={t.bal_equity_total} value={<DevVal v={eur(totalEquity)} f={eur(cfg.capitalSocial) + " + " + eur(bsCapitalPremium) + " + " + eur(resLeg) + " + " + eur(retainedEarnings)} />} bold border />

              {debtLT > 0 ? <Row label={t.bal_debt_lt} value={eur(debtLT)} indent /> : null}
              {bsShareholderLoans > 0 ? <Row label={t.bal_shareholder_loans} value={eur(bsShareholderLoans)} indent /> : null}
              {debtCT > 0 ? <Row label={t.bal_debt_ct} value={eur(debtCT)} indent /> : null}
              {bsSuppliers > 0 ? <Row label={t.bal_suppliers} value={eur(bsSuppliers)} indent /> : null}
              {vatDue > 0 ? <Row label={t.bal_vat_due} value={eur(vatDue)} indent /> : null}
              {bsSocialDue > 0 ? <Row label={t.bal_social_due} value={eur(bsSocialDue)} indent /> : null}
              {bsIsocProv > 0 ? <Row label={t.bal_isoc_provision} value={eur(bsIsocProv)} indent /> : null}
              {bsDeferred > 0 ? <Row label={t.bal_deferred_revenue} value={eur(bsDeferred)} indent /> : null}
              <Row label={t.bal_total_liabilities} value={<DevVal v={eur(totalPassif)} f={eur(totalEquity) + " + " + eur(totalLtDebt) + " + " + eur(totalStDebt)} />} bold border />
            </Card>
          </div>
        </div>
      ) : null}

      {/* ── Tab: Plan comptable ── */}
      {activeTab === "pcmn" ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--bg-card)" }}>

          {/* Toolbar */}
          <div style={{
            paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24,
            borderBottom: "1px solid var(--border-light)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "var(--sp-3)", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput
                value={pcmnSearch}
                onChange={setPcmnSearch}
                placeholder={t.search_placeholder || (lang === "fr" ? "Rechercher un compte..." : "Search accounts...")}
              />
              <FilterDropdown
                value={pcmnFilter}
                onChange={setPcmnFilter}
                options={pcmnFilterOptions}
              />
            </div>
            {devMode && onRandomizeAll ? (
              <Button color="tertiary" size="lg" onClick={onRandomizeAll} iconLeading={<Shuffle size={14} weight="bold" />}>
                {lang === "fr" ? "Randomiser" : "Randomize"}<span style={devBadgeStyle}>DEV</span>
              </Button>
            ) : null}
          </div>

          {/* Collapsible PCMN Table */}
          {pcmnGrouped.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "0 24px", height: 44, borderBottom: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "left", whiteSpace: "nowrap" }}>
                      {t.col_code || "Code"}
                    </th>
                    <th style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "0 24px", height: 44, borderBottom: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "left" }}>
                      {t.col_label || (lang === "fr" ? "Libellé" : "Label")}
                    </th>
                    <th style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "0 24px", height: 44, borderBottom: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {t.chart_monthly || (lang === "fr" ? "Mensuel" : "Monthly")}
                    </th>
                    <th style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "0 24px", height: 44, borderBottom: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {t.chart_annual || (lang === "fr" ? "Annuel" : "Annual")}
                    </th>
                    <th style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "0 12px", height: 44, borderBottom: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "center", width: 88 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pcmnGrouped.map(function (group) {
                    var isCollapsed = collapsedClasses[group.cls];
                    return [
                      /* Sub-header row */
                      <tr
                        key={"h-" + group.cls}
                        onClick={function () { toggleClass(group.cls); }}
                        style={{ cursor: "pointer", background: "var(--bg-accordion)", transition: "background 0.12s" }}
                        onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
                      >
                        <td colSpan={2} style={{ padding: "0 24px", height: 48, borderBottom: "1px solid var(--border-light)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isCollapsed ? <CaretDown size={12} weight="bold" color="var(--text-muted)" /> : <CaretUp size={12} weight="bold" color="var(--text-muted)" />}
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {lang === "fr" ? "Classe" : "Class"} {group.cls}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                              {group.short}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 4 }}>
                              ({group.items.length})
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0 24px", height: 48, borderBottom: "1px solid var(--border-light)", textAlign: "right" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(group.monthly)}</span>
                        </td>
                        <td style={{ padding: "0 24px", height: 48, borderBottom: "1px solid var(--border-light)", textAlign: "right" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{eur(group.annual)}</span>
                        </td>
                        <td style={{ padding: "0 12px", height: 48, borderBottom: "1px solid var(--border-light)" }}></td>
                      </tr>,
                      /* Data rows */
                      !isCollapsed ? group.items.map(function (row) {
                        var gKey = findGlossaryKey(row.code);
                        var hasPage = row.page && onNavigate;
                        return (
                          <tr key={row.id} style={{ transition: "background 0.12s" }}
                            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                            onMouseLeave={function (e) { e.currentTarget.style.background = ""; }}
                          >
                            <td style={{ padding: "0 24px", height: 52, borderBottom: "1px solid var(--border-light)", verticalAlign: "middle" }}>
                              <span style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 12, color: "var(--text-muted)" }}>
                                {row.code}
                              </span>
                            </td>
                            <td style={{ padding: "0 24px", height: 52, borderBottom: "1px solid var(--border-light)", verticalAlign: "middle" }}>
                              <div>
                                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{row.itemLabel}</div>
                                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{row.pcmnLabel}</div>
                              </div>
                            </td>
                            <td style={{ padding: "0 24px", height: 52, borderBottom: "1px solid var(--border-light)", textAlign: "right", verticalAlign: "middle" }}>
                              <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{eur(row.monthly)}</span>
                            </td>
                            <td style={{ padding: "0 24px", height: 52, borderBottom: "1px solid var(--border-light)", textAlign: "right", verticalAlign: "middle" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(row.annual)}</span>
                            </td>
                            <td style={{ padding: "0 4px", height: 52, borderBottom: "1px solid var(--border-light)", textAlign: "center", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                                {gKey ? (
                                  <ButtonUtility
                                    icon={<Eye size={14} weight="regular" />}
                                    size="sm"
                                    onClick={function () { glossary.open(gKey); }}
                                    title={lang === "fr" ? "Glossaire" : "Glossary"}
                                    sx={{ width: 32, height: 32 }}
                                  />
                                ) : null}
                                {hasPage ? (
                                  <ButtonUtility
                                    icon={<ArrowSquareOut size={14} weight="regular" />}
                                    variant="brand"
                                    size="sm"
                                    onClick={function () { onNavigate(row.page); }}
                                    title={lang === "fr" ? "Modifier" : "Edit"}
                                    sx={{ width: 32, height: 32 }}
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      }) : null,
                    ];
                  })}
                </tbody>
                {/* Footer totals */}
                <tfoot>
                  <tr>
                    <td style={{ padding: "0 24px", height: 56, borderTop: "1px solid var(--border)", background: "var(--bg-accordion)", fontWeight: 700, fontSize: 13 }}>
                      Total
                    </td>
                    <td style={{ padding: "0 24px", height: 56, borderTop: "1px solid var(--border)", background: "var(--bg-accordion)", fontWeight: 400, fontSize: 13, color: "var(--text-muted)" }}>
                      {pcmnFiltered.length} {lang === "fr" ? "comptes" : "accounts"}
                    </td>
                    <td style={{ padding: "0 24px", height: 56, borderTop: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                        {eur(pcmnFiltered.reduce(function (s, r) { return s + r.monthly; }, 0))}
                      </span>
                    </td>
                    <td style={{ padding: "0 24px", height: 56, borderTop: "1px solid var(--border)", background: "var(--bg-accordion)", textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                        {eur(pcmnFiltered.reduce(function (s, r) { return s + r.annual; }, 0))}
                      </span>
                    </td>
                    <td style={{ padding: "0 12px", height: 56, borderTop: "1px solid var(--border)", background: "var(--bg-accordion)" }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : pcmnEmpty}
        </div>
      ) : null}

      {/* ── Tab: Depreciation ── */}
      {activeTab === "depreciation" ? (
        <div>
          {depItems.length > 0 ? (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{t.depr_title}</h3>
                <Button color="tertiary" size="lg" onClick={resetBelgianDefaults}>
                  {t.depr_reset_belgian}
                </Button>
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
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-8) 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "var(--r-lg)",
                background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Receipt size={24} weight="duotone" color="var(--brand)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {lang === "fr" ? "Aucune immobilisation" : "No fixed assets"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
                {lang === "fr" ? "Ajoutez des équipements ou investissements dans la page Charges pour voir le tableau d'amortissement." : "Add equipment or investments in the Costs page to see the depreciation schedule."}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Tab: VAT & Advice ── */}
      {activeTab === "vat_advice" ? (
        <div>
          {/* VAT Summary */}
          <Card sx={{ marginBottom: "var(--gap-lg)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-4)", color: "var(--text-primary)" }}>{t.vat_title}</h3>
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

          {/* Profit Allocation Advice */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-1)", color: "var(--text-primary)" }}>{t.advice_title}</h3>
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

              <AdviceCard title={t.advice_marketing_title} desc={t.advice_marketing_desc} priorityLabel={t.advice_high} color={marketingGap > 0 ? "warning" : "success"}>
                <AdviceRow label={t.advice_marketing_current} value={eur(currentMarketingAnnual) + " (" + pct(marketingPct) + ")"} />
                <AdviceRow label={t.advice_marketing_target} value={eur(marketingTarget)} />
                {marketingGap > 0 ? (
                  <AdviceRow label={t.advice_marketing_gap} value={"+ " + eur(marketingGap)} bold color="var(--color-warning)" />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--color-success)", marginTop: "var(--sp-1)" }}>{t.advice_marketing_ok}</div>
                )}
              </AdviceCard>

              {resultNet > 0 ? (
                <AdviceCard title={t.advice_reserve_title} desc={t.advice_reserve_desc} priorityLabel={t.advice_mandatory} color="brand">
                  {reserveDone ? (
                    <div style={{ fontSize: 12, color: "var(--color-success)" }}>{t.advice_reserve_done}</div>
                  ) : (
                    <AdviceRow label={t.advice_reserve_needed} value={eur(resLeg)} bold />
                  )}
                </AdviceCard>
              ) : null}

              <AdviceCard title={t.advice_capital_title} desc={t.advice_capital_desc} priorityLabel={equityRatio < 0.3 ? t.advice_high : t.advice_low} color={equityRatio < 0.3 ? "warning" : "success"}>
                <AdviceRow label={t.advice_capital_solvency} value={<DevVal v={pct(equityRatio)} f={eur(totalEquity) + " / " + eur(fixedAssetsNet + balancingCash) + " = " + pct(equityRatio)} />} bold color={equityRatio >= 0.3 ? "var(--color-success)" : "var(--color-warning)"} />
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: "var(--sp-1)" }}>
                  {equityRatio >= 0.3 ? t.advice_capital_ok : t.advice_capital_low}
                </div>
              </AdviceCard>

              <AdviceCard title={t.advice_reinvest_title} desc={t.advice_reinvest_desc} priorityLabel={t.advice_high} color="brand" />

              {resultNet > 0 ? (
                <AdviceCard title={t.advice_bonus_title} desc={t.advice_bonus_desc} priorityLabel={t.advice_medium} color="success">
                  <AdviceRow label={t.advice_bonus_suggested} value={<DevVal v={eur(bonusSuggested)} f={eur(distributable) + " × 10% = " + eur(bonusSuggested)} />} />
                  <AdviceRow label={t.advice_bonus_max} value={<DevVal v={eur(bonusMaxCCT90)} f={eur(resultNet) + " × 30% = " + eur(bonusMaxCCT90)} />} bold />
                </AdviceCard>
              ) : null}

              {resultNet > 0 ? (
                <AdviceCard title={t.advice_dividend_title} desc={t.advice_dividend_desc} priorityLabel={t.advice_low} color="success">
                  <AdviceRow label={t.advice_dividend_gross} value={eur(distributable)} />
                  <AdviceRow label={t.advice_dividend_vvprbis} value={<DevVal v={eur(vvprbisNet)} f={eur(distributable) + " × (1 - 15%) = " + eur(vvprbisNet)} />} bold color="var(--color-success)" tip={t.tip_vvpr} />
                  <AdviceRow label={t.advice_dividend_classic} value={<DevVal v={eur(classicNet)} f={eur(distributable) + " × (1 - 30%) = " + eur(classicNet)} />} />
                </AdviceCard>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
    </PageLayout>
  );
}
