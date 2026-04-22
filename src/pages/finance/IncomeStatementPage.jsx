import { useMemo, useState } from "react";
import { CaretDown, CaretUp, TreeStructure } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageLayout, KpiCard, SelectDropdown, NumberField, PnlCascade, PaletteToggle, DataTable, ExportButtons, Badge, SearchInput, FilterDropdown, Card, AlertCard, FinanceLink, StackedBar, InfoTip } from "../../components";
import { eur, eurShort, calcStockValue, calcStockVariation, projectMarketplace, projectHardwareSales } from "../../utils";
import { useT, useLang } from "../../context";

/**
 * Compte de resultat previsionnel — PCMN belge
 * Structure normalisee classes 6 (charges) et 7 (produits)
 * Projection sur 1, 2, 3 ou 5 ans avec escalation des couts
 */

/* ── Recharts custom tooltip ─────────────────────── */

function ChartTooltip(props) {
  if (!props.active || !props.payload) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "var(--sp-2) var(--sp-3)", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{props.label}</div>
      {props.payload.map(function (entry) {
        return (
          <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
            {entry.name}: {eur(entry.value)}
          </div>
        );
      })}
    </div>
  );
}

/* ── Section row (line item inside a year column) ── */

function SectionRow({ label, value, bold, color, indent, border, pcmn, showPcmn }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-2)",
      padding: "var(--sp-2) 0",
      borderTop: border ? "2px solid var(--border)" : undefined,
    }}>
      {showPcmn && pcmn ? <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)", width: 40, flexShrink: 0 }}>{pcmn}</span> : null}
      <span style={{
        flex: 1, fontSize: bold ? 13 : 12,
        fontWeight: bold ? 700 : 400,
        color: color || (bold ? "var(--text-primary)" : "var(--text-secondary)"),
        paddingLeft: indent ? 16 : 0,
      }}>{label}</span>
      <span style={{
        fontSize: bold ? 14 : 12,
        fontWeight: bold ? 700 : 500,
        color: color || "var(--text-primary)",
        fontVariantNumeric: "tabular-nums",
        fontFamily: bold ? "'Bricolage Grotesque', sans-serif" : "inherit",
        minWidth: 90, textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

/* ── Year column (detailed P&L for one year) ─────── */

function YearColumn({ year, data, showPcmn, t }) {
  var [openSections, setOpenSections] = useState({ revenue: true, costs: true });

  function toggle(key) {
    setOpenSections(function (prev) { return Object.assign({}, prev, { [key]: !prev[key] }); });
  }

  var totalRevenue = data.revenue;
  var totalPurchases = data.purchases;
  var stockVariation = data.stockVariation || 0;
  var grossMargin = totalRevenue - totalPurchases + stockVariation;
  var totalOpex = data.opex;
  var totalSalaries = data.salaries;
  var totalDepreciation = data.depreciation;
  var ebitda = grossMargin - totalOpex - totalSalaries;
  var ebit = ebitda - totalDepreciation;
  var financialCharges = data.interest;
  var ebt = ebit - financialCharges;
  var isoc = data.isoc;
  var netResult = ebt - isoc;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
        {t.year_label || "Annee"} {year}
      </div>

      {/* 70 — Chiffre d'affaires */}
      <button type="button" onClick={function () { toggle("revenue"); }} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", padding: "var(--sp-1) 0", width: "100%", fontFamily: "inherit" }}>
        {openSections.revenue ? <CaretDown size={10} color="var(--text-muted)" /> : <CaretUp size={10} color="var(--text-muted)" />}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.section_revenue || "Produits d'exploitation"}</span>
      </button>
      {openSections.revenue ? (
        <div style={{ marginBottom: "var(--sp-2)" }}>
          {data.revenueBreakdown.map(function (row) {
            return <SectionRow key={row.label} label={row.label} value={eur(row.value)} indent pcmn={row.pcmn} showPcmn={showPcmn} />;
          })}
        </div>
      ) : null}
      <SectionRow label={t.total_revenue || "Chiffre d'affaires net"} value={eur(totalRevenue)} bold pcmn="70" showPcmn={showPcmn} />

      {/* 60 — Achats */}
      {totalPurchases > 0 ? (
        <SectionRow label={t.purchases || "Achats & approvisionnements"} value={eur(-totalPurchases)} indent pcmn="60" showPcmn={showPcmn} />
      ) : null}

      {/* 71 — Variation de stocks */}
      {stockVariation !== 0 ? (
        <SectionRow label={t.stock_variation || "Variation de stocks"} value={eur(stockVariation)} indent pcmn="71" showPcmn={showPcmn} />
      ) : null}

      {/* Marge brute — no color */}
      <SectionRow label={t.gross_margin || "Marge brute"} value={eur(grossMargin)} bold border />

      {/* 61 — Services & biens divers */}
      <button type="button" onClick={function () { toggle("costs"); }} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", padding: "var(--sp-1) 0", width: "100%", fontFamily: "inherit", marginTop: "var(--sp-2)" }}>
        {openSections.costs ? <CaretDown size={10} color="var(--text-muted)" /> : <CaretUp size={10} color="var(--text-muted)" />}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.section_costs || "Charges d'exploitation"}</span>
      </button>
      {openSections.costs ? (
        <div style={{ marginBottom: "var(--sp-2)" }}>
          {data.costBreakdown.map(function (row) {
            return <SectionRow key={row.label} label={row.label} value={eur(-row.value)} indent pcmn={row.pcmn} showPcmn={showPcmn} />;
          })}
        </div>
      ) : null}
      <SectionRow label={t.total_opex || "Total charges d'exploitation"} value={eur(-totalOpex)} bold pcmn="61" showPcmn={showPcmn} />

      {/* 62 — Remunerations */}
      <SectionRow label={t.salaries || "Remunerations & charges sociales"} value={eur(-totalSalaries)} pcmn="62" showPcmn={showPcmn} />

      {/* EBITDA — no color */}
      <SectionRow label="EBITDA" value={eur(ebitda)} bold border />

      {/* 63 — Amortissements */}
      <SectionRow label={t.depreciation || "Dotations aux amortissements"} value={eur(-totalDepreciation)} pcmn="63" showPcmn={showPcmn} />

      {/* EBIT — no color */}
      <SectionRow label={t.ebit || "Resultat d'exploitation (EBIT)"} value={eur(ebit)} bold />

      {/* 65 — Charges financieres */}
      {financialCharges > 0 ? (
        <SectionRow label={t.financial || "Charges financieres"} value={eur(-financialCharges)} pcmn="65" showPcmn={showPcmn} />
      ) : null}

      {/* EBT — no color */}
      <SectionRow label={t.ebt || "Resultat avant impots (EBT)"} value={eur(ebt)} bold border />

      {/* 67 — ISOC */}
      {isoc > 0 ? (
        <SectionRow label={t.isoc || "Impot des societes (ISOC)"} value={eur(-isoc)} pcmn="67" showPcmn={showPcmn} />
      ) : null}

      {/* Resultat net — ONLY row with color */}
      <SectionRow label={t.net_result || "Resultat net"} value={eur(netResult)} bold border color={netResult >= 0 ? "var(--color-success)" : "var(--color-error)"} />
    </div>
  );
}

/* ── Cost breakdown card with year selector ── */
function CostBreakdownCard({ yearData, chartPalette, lk, t }) {
  var [selectedYear, setSelectedYear] = useState(1);

  var d = yearData.find(function (yd) { return yd.year === selectedYear; }) || yearData[0] || {};

  var barData = {};
  var barLabels = {};
  var entries = [
    ["purchases", lk === "fr" ? "Achats" : "Purchases", d.purchases || 0],
    ["opex", lk === "fr" ? "Exploitation" : "Operations", d.opex || 0],
    ["salaries", lk === "fr" ? "Salaires" : "Payroll", d.salaries || 0],
    ["depreciation", lk === "fr" ? "Amortissements" : "Depreciation", d.depreciation || 0],
    ["interest", lk === "fr" ? "Intérêts" : "Interest", d.interest || 0],
    ["isoc", lk === "fr" ? "Impôts" : "Taxes", d.isoc || 0],
  ];
  entries.forEach(function (e) { if (e[2] > 0) { barData[e[0]] = e[2]; barLabels[e[0]] = e[1]; } });

  var hasData = yearData.length > 0 && Object.keys(barData).length > 0;

  var yearOptions = yearData.map(function (yd) {
    return { value: String(yd.year), label: (t.year_label || "Année") + " " + yd.year };
  });

  return (
    <Card sx={{ padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {lk === "fr" ? "Répartition des charges" : "Cost breakdown"}
        </div>
        {yearOptions.length > 0 ? (
          <FilterDropdown
            value={String(selectedYear)}
            onChange={function (v) { setSelectedYear(parseInt(v, 10)); }}
            options={yearOptions}
          />
        ) : null}
      </div>
      {!hasData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <div style={{ height: 36, borderRadius: "var(--r-md)", background: "var(--bg-accordion)", animation: "pulse 1.5s ease infinite" }} />
          <div style={{ display: "flex", gap: "var(--sp-4)" }}>
            {[120, 100, 80, 90].map(function (w, i) {
              return <div key={i} style={{ width: w, height: 14, borderRadius: 4, background: "var(--bg-accordion)", animation: "pulse 1.5s ease infinite", animationDelay: (i * 100) + "ms" }} />;
            })}
          </div>
        </div>
      ) : (
        <StackedBar data={barData} labels={barLabels} palette={chartPalette} formatter={function (v) { return eur(v); }} />
      )}
    </Card>
  );
}

/* ── P&L classification for filter ── */
var PNL_CLASSES = {
  "70": { fr: "Classe 7 — Produits", en: "Class 7 — Revenue" },
  "71": { fr: "Classe 7 — Produits", en: "Class 7 — Revenue" },
  "60": { fr: "Classe 6 — Charges", en: "Class 6 — Expenses" },
  "61": { fr: "Classe 6 — Charges", en: "Class 6 — Expenses" },
  "62": { fr: "Classe 6 — Charges", en: "Class 6 — Expenses" },
  "63": { fr: "Classe 6 — Charges", en: "Class 6 — Expenses" },
  "65": { fr: "Classe 6 — Charges", en: "Class 6 — Expenses" },
  "67": { fr: "Classe 6 — Charges", en: "Class 6 — Expenses" },
};

/* ── P&L Table with search, filter, PCMN column ── */
function PnlTableSection({ yearData, showPcmn, t, lk, horizon, setHorizon }) {
  var [search, setSearch] = useState("");
  var [classFilter, setClassFilter] = useState("all");

  var PNL_ROWS = [
    { id: "revenue", label: t.total_revenue || "Chiffre d'affaires net", pcmn: "70", classe: "7", bold: true, fn: function (d) { return d.revenue; } },
    { id: "purchases", label: t.purchases || "Achats & approvisionnements", pcmn: "60", classe: "6", indent: true, fn: function (d) { return -d.purchases; } },
    { id: "stock_var", label: t.stock_variation || "Variation de stocks", pcmn: "71", classe: "7", indent: true, fn: function (d) { return d.stockVariation; } },
    { id: "gross_margin", label: t.gross_margin || "Marge brute", pcmn: "", classe: "", bold: true, fn: function (d) { return d.revenue - d.purchases + (d.stockVariation || 0); } },
    { id: "opex", label: t.total_opex || "Charges d'exploitation", pcmn: "61", classe: "6", indent: true, fn: function (d) { return -d.opex; } },
    { id: "salaries", label: t.salaries || "Rémunérations & charges sociales", pcmn: "62", classe: "6", indent: true, fn: function (d) { return -d.salaries; } },
    { id: "ebitda", label: "EBITDA", pcmn: "", classe: "", bold: true, fn: function (d) { return d.revenue - d.purchases + (d.stockVariation || 0) - d.opex - d.salaries; } },
    { id: "depreciation", label: t.depreciation || "Dotations aux amortissements", pcmn: "63", classe: "6", indent: true, fn: function (d) { return -d.depreciation; } },
    { id: "ebit", label: t.ebit || "Résultat d'exploitation (EBIT)", pcmn: "", classe: "", bold: true, fn: function (d) { return d.revenue - d.purchases + (d.stockVariation || 0) - d.opex - d.salaries - d.depreciation; } },
    { id: "interest", label: t.financial || "Charges financières", pcmn: "65", classe: "6", indent: true, fn: function (d) { return -d.interest; } },
    { id: "ebt", label: t.ebt || "Résultat avant impôts (EBT)", pcmn: "", classe: "", bold: true, fn: function (d) { return d.revenue - d.purchases + (d.stockVariation || 0) - d.opex - d.salaries - d.depreciation - d.interest; } },
    { id: "isoc", label: t.isoc || "Impôt des sociétés (ISOC)", pcmn: "67", classe: "6", indent: true, fn: function (d) { return -d.isoc; } },
  ];

  var tableRows = useMemo(function () {
    var rows = PNL_ROWS.map(function (row) {
      var obj = { id: row.id, label: row.label, pcmn: row.pcmn, classe: row.classe, bold: row.bold, indent: row.indent, color: row.color };
      yearData.forEach(function (d) { obj["y" + d.year] = row.fn(d); });
      return obj;
    });

    /* Filter by search */
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      rows = rows.filter(function (r) { return r.label.toLowerCase().indexOf(q) >= 0 || r.pcmn.indexOf(q) >= 0; });
    }

    /* Filter by class */
    if (classFilter !== "all") {
      rows = rows.filter(function (r) { return r.classe === classFilter || r.bold; });
    }

    return rows;
  }, [yearData, search, classFilter]);

  var tableCols = useMemo(function () {
    var cols = [
      {
        id: "pcmn", header: "PCMN",
        enableSorting: false, meta: { align: "center", width: 60 },
        accessorFn: function (row) { return row.pcmn; },
        cell: function (info) {
          var v = info.getValue();
          if (!v) return null;
          return <Badge color="gray" size="sm">{v}</Badge>;
        },
        footer: function () { return null; },
      },
      {
        id: "label", header: t.col_label || "Libellé comptable",
        enableSorting: false, meta: { align: "left", minWidth: 220, grow: true },
        accessorFn: function (row) { return row.label; },
        cell: function (info) {
          var r = info.row.original;
          return (
            <span style={{ fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400, color: r.bold ? "var(--text-primary)" : "var(--text-secondary)", paddingLeft: r.indent ? 12 : 0 }}>
              {r.label}
            </span>
          );
        },
        footer: function () { return <span style={{ fontWeight: 700 }}>{t.net_result || "Résultat net"}</span>; },
      },
    ];

    yearData.forEach(function (d) {
      var yKey = "y" + d.year;
      var netResult = d.revenue - d.purchases + (d.stockVariation || 0) - d.opex - d.salaries - d.depreciation - d.interest - d.isoc;
      cols.push({
        id: yKey, header: (t.year_label || "Année") + " " + d.year,
        enableSorting: false, meta: { align: "right" },
        accessorFn: function (row) { return row[yKey]; },
        cell: function (info) {
          var r = info.row.original;
          var v = info.getValue() || 0;
          return (
            <span style={{
              fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400,
              fontVariantNumeric: "tabular-nums",
              fontFamily: r.bold ? "'Bricolage Grotesque', sans-serif" : "inherit",
              color: r.bold ? "var(--text-primary)" : "var(--text-secondary)",
            }}>
              {eur(v)}
            </span>
          );
        },
        footer: function () {
          return (
            <span style={{
              fontWeight: 700, fontVariantNumeric: "tabular-nums",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              color: netResult > 0 ? "var(--color-success)" : netResult < 0 ? "var(--color-error)" : "var(--text-primary)",
            }}>
              {eur(netResult)}
            </span>
          );
        },
      });
    });

    return cols;
  }, [yearData, showPcmn, t]);

  var filterOptions = [
    { value: "all", label: lk === "fr" ? "Toutes les classes" : "All classes" },
    { value: "7", label: lk === "fr" ? "Classe 7 — Produits" : "Class 7 — Revenue" },
    { value: "6", label: lk === "fr" ? "Classe 6 — Charges" : "Class 6 — Expenses" },
  ];

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={lk === "fr" ? "Rechercher un poste…" : "Search a line item…"} />
        <FilterDropdown value={classFilter} onChange={setClassFilter} options={filterOptions} />
        <FilterDropdown value={String(horizon)} onChange={function (v) { setHorizon(parseInt(v, 10)); }} options={[
          { value: "1", label: "1 " + (t.year || "an") },
          { value: "2", label: "2 " + (t.years || "ans") },
          { value: "3", label: "3 " + (t.years || "ans") },
          { value: "5", label: "5 " + (t.years || "ans") },
        ]} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        <ExportButtons columns={tableCols} data={tableRows} filename="compte-de-resultat" />
      </div>
    </>
  );

  return (
    <DataTable
      data={tableRows}
      columns={tableCols}
      toolbar={toolbarNode}
      getRowId={function (row) { return row.id; }}
      highlightRow={function (row) { return row.bold; }}
      compact
      showFooter
      pageSize={50}
    />
  );
}

/* ── Main page component ─────────────────────────── */

export default function IncomeStatementPage({ streams, costs, cfg, setCfg, assets, stocks, salCosts, annualInterest, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var t = useT().income_statement || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var isMarketplace = !!(cfg && cfg.marketplaceAcquisitionPlan && cfg.marketplaceAcquisitionPlan.length);
  var [horizon, setHorizon] = useState(isMarketplace ? cfg.marketplaceAcquisitionPlan.length : 3);
  var showPcmn = cfg.showPcmn;

  function cfgSet(key, val) {
    setCfg(function (prev) { return Object.assign({}, prev, { [key]: val }); });
  }

  /* ── Build year data (calculation logic unchanged) ── */
  var yearData = useMemo(function () {
    var years = [];
    var escalation = cfg.costEscalation || 0.02;
    var revenueGrowth = cfg.revenueGrowthRate || 0.10;

    for (var y = 1; y <= horizon; y++) {
      var costMultiplier = Math.pow(1 + escalation, y - 1);

      /* Revenue breakdown by behavior */
      var revenueBreakdown = [];
      var revTotal = 0;
      var revByBehavior = {};
      (streams || []).forEach(function (cat) {
        (cat.items || []).forEach(function (item) {
          var b = item.behavior || "recurring";
          var annual = 0;
          var price = item.price || 0;
          var qty = item.qty || 0;
          var streamGrowth = item.growthRate != null ? item.growthRate : revenueGrowth;
          var streamMultiplier = Math.pow(1 + streamGrowth, y - 1);
          if (b === "one_time" || b === "subsidy") {
            annual = y === 1 ? price * qty : 0;
          } else if (b === "project" || b === "daily_rate" || b === "stock_variation" || b === "capitalized_production") {
            annual = price * qty * streamMultiplier;
          } else {
            annual = price * qty * 12 * streamMultiplier;
          }
          revByBehavior[b] = (revByBehavior[b] || 0) + annual;
          revTotal += annual;
        });
      });
      Object.keys(revByBehavior).forEach(function (b) {
        if (revByBehavior[b] > 0) {
          revenueBreakdown.push({ label: b, value: revByBehavior[b], pcmn: "70" });
        }
      });

      /* Cost breakdown by category */
      var costBreakdown = [];
      var purchasesTotal = 0;
      var opexTotal = 0;
      var depTotal = 0;
      var costByCategory = {};
      (costs || []).forEach(function (cat) {
        (cat.items || []).forEach(function (item) {
          /* Determine category from PCMN code or explicit _category field:
             60xx = purchases (achats & approvisionnements)
             63xx = depreciation (handled separately via assets)
             65xx = financial charges (handled via annualInterest)
             61xx-64xx = operating expenses */
          var pcmn = item.pcmn || "";
          var catKey = item._category
            || (pcmn.charAt(0) === "6" && pcmn.charAt(1) === "0" ? "purchases"
            : pcmn.charAt(0) === "6" && pcmn.charAt(1) === "3" ? "depreciation"
            : pcmn.charAt(0) === "6" && pcmn.charAt(1) === "5" ? "financial_auto"
            : "other");
          var a = item.pu ? (item.a || 0) * (item.u || 1) : (item.a || 0);
          var freqMap = { monthly: 12, quarterly: 4, annual: 1, once: 1 };
          var annual = a * (freqMap[item.freq] || 12);
          if (item.freq === "once") {
            annual = y === 1 ? annual : 0;
          } else {
            /* Per-charge growth: use individual rate, linked stream rate, or global escalation */
            var chargeGrowth;
            if (item.linkedStream) {
              var linkedItem = null;
              (streams || []).forEach(function (sc) {
                (sc.items || []).forEach(function (s) {
                  if (s.id === item.linkedStream) linkedItem = s;
                });
              });
              chargeGrowth = linkedItem ? (linkedItem.growthRate != null ? linkedItem.growthRate : revenueGrowth) : escalation;
            } else {
              chargeGrowth = item.growthRate != null ? item.growthRate : escalation;
            }
            var chargeMultiplier = Math.pow(1 + chargeGrowth, y - 1);
            annual = annual * chargeMultiplier;
          }

          if (catKey === "purchases") {
            purchasesTotal += annual;
          } else if (catKey === "depreciation") {
            depTotal += annual;
          } else if (catKey === "financial_auto") {
            // handled separately via annualInterest
          } else {
            opexTotal += annual;
            costByCategory[catKey] = (costByCategory[catKey] || 0) + annual;
          }
        });
      });
      Object.keys(costByCategory).forEach(function (ck) {
        if (costByCategory[ck] > 0) {
          costBreakdown.push({ label: ck, value: costByCategory[ck], pcmn: "61" });
        }
      });

      /* Stock purchases (synthetic — not in costs state, built from stocks like OperatingCostsPage) */
      (stocks || []).forEach(function (s) {
        var monthlyCost = (s.unitCost || 0) * (s.monthlySales || 0);
        if (monthlyCost > 0) {
          var stockGrowth = s.growthRate != null ? s.growthRate : revenueGrowth;
          var stockMultiplier = Math.pow(1 + stockGrowth, y - 1);
          purchasesTotal += monthlyCost * 12 * stockMultiplier;
        }
      });

      /* Salaries — escalated */
      var salTotal = salCosts * 12 * costMultiplier;

      /* Depreciation from assets */
      var assetDepTotal = 0;
      (assets || []).forEach(function (a) {
        if (a.amount > 0 && a.years > 0) {
          var dep = (a.amount - (a.residual || 0)) / a.years;
          var elapsed = (a.elapsed || 0) + y - 1;
          if (elapsed < a.years) assetDepTotal += dep;
        }
      });
      if (assetDepTotal > depTotal) depTotal = assetDepTotal;

      /* Stock variation (PCMN 71) */
      var stockValue = calcStockValue(stocks);
      var openingStock = y === 1 ? 0 : stockValue * Math.pow(1 + revenueGrowth, y - 2);
      var closingStock = stockValue * Math.pow(1 + revenueGrowth, y - 1);
      var stockVar = calcStockVariation(openingStock, closingStock);

      /* Interest — escalated (simple) */
      var interest = (annualInterest || 0) * costMultiplier;

      /* ISOC */
      var ebitdaY = revTotal - purchasesTotal + stockVar - opexTotal - salTotal;
      var ebitY = ebitdaY - depTotal;
      var ebtY = ebitY - interest;
      var isocY = 0;
      if (ebtY > 0) {
        isocY = ebtY <= 100000 ? ebtY * 0.20 : 100000 * 0.20 + (ebtY - 100000) * 0.25;
      }

      years.push({
        year: y,
        revenue: revTotal,
        revenueBreakdown: revenueBreakdown,
        purchases: purchasesTotal,
        stockVariation: stockVar,
        opex: opexTotal,
        costBreakdown: costBreakdown,
        salaries: salTotal,
        depreciation: depTotal,
        interest: interest,
        isoc: isocY,
      });
    }

    // ── Marketplace override: replace revenue/opex/depreciation with month-by-month projection ──
    if (isMarketplace) {
      var proj = projectMarketplace({
        acquisitionPlan: cfg.marketplaceAcquisitionPlan.slice(0, horizon),
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
      });
      var evProj = (cfg.evSalesPlan && cfg.evSalesPlan.length) ? projectHardwareSales({
        salesPlan: cfg.evSalesPlan.slice(0, horizon),
        pricePerUnit: cfg.evPricePerUnit || 0,
        priceGrowthRate: cfg.evPriceGrowthRate || 0,
        costPct: cfg.evCostPct || 0,
        costPerUnit: cfg.evCostPerUnit,
        installPct: cfg.evInstallPct || 0,
        installPerUnit: cfg.evInstallPerUnit,
        marketingMonthly: cfg.evMarketingMonthly || 0,
        commercialMonthly: cfg.evCommercialMonthly || 0,
      }) : null;
      return years.map(function (stdYear, idx) {
        var py = proj.years[idx];
        if (!py) return stdYear;
        var ey = evProj ? evProj.years[idx] : null;
        var revenueM = py.commissionHT + (ey ? ey.caHT : 0);
        var opexM = py.fraisTx + py.maintSaas + py.marketing + py.hwCash + (ey ? ey.opex : 0);
        // Keep asset depreciation from standard calc (matériel info, frais établissement); add marketplace flat amort
        var depM = (stdYear.depreciation || 0);
        if (depM < py.amortHw) depM = py.amortHw;
        var interestM = stdYear.interest || 0;
        var salariesM = stdYear.salaries || 0;
        var ebitdaM = revenueM - opexM - salariesM;
        var ebitM = ebitdaM - depM;
        var ebtM = ebitM - interestM;
        var isocM = 0;
        if (ebtM > 0) {
          isocM = ebtM <= 100000 ? ebtM * 0.20 : 100000 * 0.20 + (ebtM - 100000) * 0.25;
        }
        var revBreakdown = [
          { label: "Commission HT (parking)", value: py.commissionHT, pcmn: "7030" },
        ];
        if (ey) revBreakdown.push({ label: "CA HT bornes EV", value: ey.caHT, pcmn: "7000" });
        var costBreakdown = [
          { label: "Frais de transaction", value: py.fraisTx, pcmn: "6130" },
          { label: "Maintenance + SaaS", value: py.maintSaas, pcmn: "6125" },
          { label: "Hardware parking (cash)", value: py.hwCash, pcmn: "6302" },
          { label: "Marketing parking", value: py.marketing, pcmn: "6140" },
        ];
        if (ey) {
          costBreakdown.push({ label: "Coût bornes (achat)", value: ey.unitCost, pcmn: "6040" });
          costBreakdown.push({ label: "Pose installateur", value: ey.installCost, pcmn: "6130" });
          costBreakdown.push({ label: "Marketing EV", value: ey.marketing, pcmn: "6140" });
          if (ey.commercial) costBreakdown.push({ label: "Commercial EV", value: ey.commercial, pcmn: "6200" });
        }
        return Object.assign({}, stdYear, {
          revenue: revenueM,
          revenueBreakdown: revBreakdown,
          purchases: 0,
          stockVariation: 0,
          opex: opexM,
          costBreakdown: costBreakdown,
          depreciation: depM,
          interest: interestM,
          isoc: isocM,
          _marketplace: true,
          _projection: py,
          _evProjection: ey,
        });
      });
    }

    return years;
  }, [streams, costs, assets, stocks, cfg, salCosts, annualInterest, horizon, isMarketplace]);

  /* ── KPIs from Y1 ── */
  var y1 = yearData[0] || {};
  var y1Ebitda = (y1.revenue || 0) - (y1.purchases || 0) + (y1.stockVariation || 0) - (y1.opex || 0) - (y1.salaries || 0);
  var y1Net = (y1.revenue || 0) - (y1.purchases || 0) + (y1.stockVariation || 0) - (y1.opex || 0) - (y1.salaries || 0) - (y1.depreciation || 0) - (y1.interest || 0) - (y1.isoc || 0);
  var y1Margin = y1.revenue > 0 ? Math.round(y1Ebitda / y1.revenue * 100) : 0;

  /* ── Chart data: Revenue vs Total Costs per year ── */
  var chartData = useMemo(function () {
    return yearData.map(function (d) {
      return {
        name: (lk === "fr" ? "Année " : "Year ") + d.year,
        revenue: d.revenue,
        costs: d.opex + d.salaries + d.purchases + d.depreciation + d.interest + d.isoc,
      };
    });
  }, [yearData]);

  /* ── Cascade steps (Y1 waterfall) ── */
  var cascadeSteps = useMemo(function () {
    return [
      { label: t.total_revenue || "Chiffre d'affaires", value: y1.revenue || 0, type: "start" },
      { label: t.purchases || "Achats", value: y1.purchases || 0, type: "deduction" },
      { label: t.total_opex || "Charges d'exploitation", value: y1.opex || 0, type: "deduction" },
      { label: t.salaries || "Salaires", value: y1.salaries || 0, type: "deduction" },
      { label: t.depreciation || "Amortissements", value: y1.depreciation || 0, type: "deduction" },
      { label: t.isoc || "Impots", value: y1.isoc || 0, type: "deduction" },
      { label: t.net_result || "Resultat net", value: y1Net, type: "result" },
    ];
  }, [y1, y1Net, t]);

  return (
    <PageLayout title={t.title || "Compte de resultat"} subtitle={t.subtitle || "Projection du resultat d'exploitation sur la duree du plan financier."} icon={TreeStructure} iconColor="var(--text-muted)">

      {/* Alert if net result is negative */}
      {y1Net < 0 ? (
        <div style={{ marginBottom: "var(--gap-md)" }}>
          <AlertCard color="warning" title={lk === "fr" ? "Résultat net négatif en année 1" : "Negative net result in year 1"}>
            {lk === "fr"
              ? <span>Vos charges dépassent vos revenus de <strong>{eur(Math.abs(y1Net))}</strong>. C'est fréquent en phase de lancement. Pour améliorer votre rentabilité, vous pouvez augmenter vos prix, réduire vos charges ou accélérer votre <FinanceLink term="annual_revenue" label="chiffre d'affaires" desc="Total des ventes annuelles de votre entreprise." />.</span>
              : <span>Your costs exceed revenue by <strong>{eur(Math.abs(y1Net))}</strong>. This is common in early stages. To improve profitability, you can raise prices, reduce costs or accelerate your <FinanceLink term="annual_revenue" label="revenue" desc="Total annual sales of your business." />.</span>}
          </AlertCard>
        </div>
      ) : null}

      {/* ── 1. KPI cards ───────────────────────── */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_revenue || "Chiffre d'affaires Y1"} value={y1.revenue > 0 ? eurShort(y1.revenue) : "\u2014"} fullValue={y1.revenue > 0 ? eur(y1.revenue) : undefined} glossaryKey="annual_revenue" />
        <KpiCard label={t.kpi_ebitda || "EBITDA Y1"} value={eurShort(y1Ebitda)} fullValue={eur(y1Ebitda)} glossaryKey="ebitda" />
        <KpiCard label={t.kpi_margin || "Marge EBITDA"} value={y1Margin + "%"} glossaryKey="ebitda_margin" />
        <KpiCard label={t.kpi_net || "Resultat net Y1"} value={eurShort(y1Net)} fullValue={eur(y1Net)} glossaryKey="net_profit" />
      </div>

      {/* ── 2. Insight section — chart + cascade ── */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>

        {/* Left: Revenue vs Costs bar chart */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.chart_rev_vs_costs || "Revenus vs charges"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={function (v) { return eurShort(v); }} />
              <Tooltip content={ChartTooltip} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={function (value) { return <span style={{ color: "var(--text-secondary)" }}>{value}</span>; }} />
              <Bar dataKey="revenue" name={t.total_revenue || "Revenus"} fill={chartPalette[0 % chartPalette.length]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="costs" name={t.total_costs || "Charges"} fill={chartPalette[7 % chartPalette.length]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: P&L cascade waterfall (Y1) */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {t.cascade_title || "Du revenu au resultat net (Y1)"}
          </div>
          <PnlCascade steps={cascadeSteps} />
        </div>
      </div>

      {/* ── 2b. Cost breakdown (full width, year selectable) ── */}
      <CostBreakdownCard yearData={yearData} chartPalette={chartPalette} lk={lk} t={t} />

      {/* ── 2c. Year-over-year variance cards ── */}
      {yearData.length >= 2 ? (
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(" + (yearData.length - 1) + ", 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
          {yearData.slice(1).map(function (d, i) {
            var prev = yearData[i];
            var revDelta = prev.revenue > 0 ? (d.revenue - prev.revenue) / prev.revenue : 0;
            var costTotal = d.opex + d.salaries + d.purchases;
            var prevCostTotal = prev.opex + prev.salaries + prev.purchases;
            var costDelta = prevCostTotal > 0 ? (costTotal - prevCostTotal) / prevCostTotal : 0;
            var netPrev = prev.revenue - prev.purchases + (prev.stockVariation || 0) - prev.opex - prev.salaries - prev.depreciation - prev.interest - prev.isoc;
            var netCurr = d.revenue - d.purchases + (d.stockVariation || 0) - d.opex - d.salaries - d.depreciation - d.interest - d.isoc;
            var improving = netCurr > netPrev;
            return (
              <Card key={d.year} sx={{ padding: "var(--sp-4)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  {(lk === "fr" ? "Année " : "Year ") + prev.year + " → " + d.year}
                </div>
                <div style={{ display: "flex", gap: "var(--sp-4)", fontSize: 12, marginBottom: 6 }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Revenus " : "Revenue "}</span>
                    <span style={{ fontWeight: 600, color: revDelta >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
                      {(revDelta >= 0 ? "+" : "") + (revDelta * 100).toFixed(1) + "%"}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Charges " : "Costs "}</span>
                    <span style={{ fontWeight: 600, color: costDelta <= 0 ? "var(--color-success)" : "var(--color-warning)" }}>
                      {(costDelta >= 0 ? "+" : "") + (costDelta * 100).toFixed(1) + "%"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: improving ? "var(--color-success)" : "var(--color-warning)", fontWeight: 500 }}>
                  {improving
                    ? (lk === "fr" ? "↑ Rentabilité en hausse" : "↑ Profitability improving")
                    : (lk === "fr" ? "↓ Rentabilité en baisse" : "↓ Profitability declining")}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* ── 3. Assumptions card — single card with impact preview ── */}
      {(function () {
        var revGrowth = cfg.revenueGrowthRate || 0.10;
        var costEsc = cfg.costEscalation || 0.02;

        /* Check if all streams/costs have individual growth rates — if so, global is unused */
        var allStreamsHaveRate = true;
        var streamCount = 0;
        (streams || []).forEach(function (cat) {
          (cat.items || []).forEach(function (item) {
            streamCount++;
            if (item.growthRate == null) allStreamsHaveRate = false;
          });
        });
        if (streamCount === 0) allStreamsHaveRate = false;

        var allCostsHaveRate = true;
        var costCount = 0;
        (costs || []).forEach(function (cat) {
          (cat.items || []).forEach(function (item) {
            if (item._readOnly) return;
            if (item.freq === "once") return;
            costCount++;
            if (item.growthRate == null && !item.linkedStream) allCostsHaveRate = false;
          });
        });
        if (costCount === 0) allCostsHaveRate = false;

        var revDisabled = allStreamsHaveRate;
        var costDisabled = allCostsHaveRate;
        var lastYear = yearData[yearData.length - 1];
        var revY1 = (yearData[0] || {}).revenue || 0;
        var revYn = lastYear ? lastYear.revenue : revY1;
        var costY1 = (yearData[0] || {}).opex + (yearData[0] || {}).salaries + (yearData[0] || {}).purchases || 0;
        var costYn = lastYear ? lastYear.opex + lastYear.salaries + lastYear.purchases : costY1;
        var growthFaster = revGrowth > costEsc;

        return (
          <Card sx={{ padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-4)" }}>
              {lk === "fr" ? "Hypothèses de projection" : "Projection assumptions"}
            </div>

            {/* Inputs row */}
            <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--sp-4)" }}>
              <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", opacity: revDisabled ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    {lk === "fr" ? "Croissance des revenus" : "Revenue growth"}
                    {revDisabled ? <InfoTip text={lk === "fr" ? "Ce taux est ignoré car chaque source de revenu a déjà son propre taux de croissance défini sur la page Revenus." : "This rate is ignored because each revenue source already has its own growth rate set on the Revenue page."} /> : null}
                  </span>
                  <NumberField value={revGrowth} onChange={function (v) { cfgSet("revenueGrowthRate", v); }} min={-0.50} max={5} step={0.05} width="72px" pct disabled={revDisabled} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>
                  {revDisabled
                    ? (lk === "fr" ? "Chaque source de revenu a son propre taux de croissance." : "Each revenue source has its own growth rate.")
                    : (lk === "fr" ? "Taux annuel appliqué aux sources sans taux individuel." : "Annual rate applied to sources without individual rate.")}
                </div>
              </div>
              <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", opacity: costDisabled ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                    {lk === "fr" ? "Évolution des charges" : "Cost evolution"}
                    {costDisabled ? <InfoTip text={lk === "fr" ? "Ce taux est ignoré car chaque charge a déjà son propre taux de croissance ou est liée à une source de revenu sur la page Charges." : "This rate is ignored because each cost already has its own growth rate or is linked to a revenue source on the Costs page."} /> : null}
                  </span>
                  <NumberField value={costEsc} onChange={function (v) { cfgSet("costEscalation", v); }} min={0} max={0.50} step={0.01} width="72px" pct disabled={costDisabled} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>
                  {costDisabled
                    ? (lk === "fr" ? "Chaque charge a son propre taux ou est liée à une source de revenu." : "Each cost has its own rate or is linked to a revenue source.")
                    : (lk === "fr" ? "Taux annuel appliqué aux charges sans taux individuel." : "Annual rate applied to costs without individual rate.")}
                </div>
              </div>
            </div>

            {/* Impact preview */}
            {yearData.length >= 2 ? (
              <div style={{ padding: "var(--sp-3)", background: growthFaster ? "var(--color-success-bg)" : "var(--color-warning-bg)", borderRadius: "var(--r-md)", border: "1px solid " + (growthFaster ? "var(--color-success-border)" : "var(--color-warning-border)") }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: growthFaster ? "var(--color-success)" : "var(--color-warning)", marginBottom: 4 }}>
                  {growthFaster
                    ? (lk === "fr" ? "Vos revenus croissent plus vite que vos charges" : "Your revenue grows faster than costs")
                    : (lk === "fr" ? "Vos charges croissent aussi vite (ou plus) que vos revenus" : "Your costs grow as fast (or faster) than revenue")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {lk === "fr"
                    ? "En " + horizon + " an" + (horizon > 1 ? "s" : "") + ", vos revenus passent de " + eurShort(revY1) + " à " + eurShort(revYn) + " et vos charges de " + eurShort(costY1) + " à " + eurShort(costYn) + "."
                    : "Over " + horizon + " year" + (horizon > 1 ? "s" : "") + ", revenue goes from " + eurShort(revY1) + " to " + eurShort(revYn) + " and costs from " + eurShort(costY1) + " to " + eurShort(costYn) + "."}
                </div>
              </div>
            ) : null}
          </Card>
        );
      })()}

      {/* ── 4. P&L Table (one column per year) ── */}
      <PnlTableSection yearData={yearData} showPcmn={showPcmn} t={t} lk={lk} horizon={horizon} setHorizon={setHorizon} />
    </PageLayout>
  );
}
