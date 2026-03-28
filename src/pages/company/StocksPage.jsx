import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash, PencilSimple, Copy,
  Package, ShoppingCart, Factory, Storefront, Barcode,
  Warning, ArrowRight,
} from "@phosphor-icons/react";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from "recharts";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SearchInput, FilterDropdown, PaletteToggle, ExportButtons, DevOptionsButton, DonutChart, ModalSideNav, CurrencyInput, NumberField, Modal, ModalFooter } from "../../components";
import { eur, eurShort, makeId, calcStockValue, calcMonthlyCogs, calcStockRotation, calcStockCoverage, forecastStock, calcItemAutonomy, calcDaysToReorder, calcMonthlyReorderCost, countAlertItems } from "../../utils";
import { useT, useLang, useDevMode } from "../../context";

/* ── Stock categories (PCMN classe 3) ── */
var STOCK_CATEGORY_META = {
  merchandise:  { icon: ShoppingCart, badge: "brand",   pcmn: "3700", tvaRate: 0.21, label: { fr: "Marchandises", en: "Merchandise" }, desc: { fr: "Produits achetés pour la revente sans transformation.", en: "Products purchased for resale without modification." }, placeholder: { fr: "ex. Stock de vêtements", en: "e.g. Clothing stock" } },
  raw:          { icon: Package,      badge: "warning", pcmn: "3000", tvaRate: 0.21, label: { fr: "Matières premières", en: "Raw materials" }, desc: { fr: "Matériaux utilisés dans la production.", en: "Materials used in production." }, placeholder: { fr: "ex. Bois, tissu, métal", en: "e.g. Wood, fabric, metal" } },
  supplies:     { icon: Barcode,      badge: "info",    pcmn: "3100", tvaRate: 0.21, label: { fr: "Fournitures", en: "Supplies" }, desc: { fr: "Consommables et emballages.", en: "Consumables and packaging." }, placeholder: { fr: "ex. Emballages, étiquettes", en: "e.g. Packaging, labels" } },
  wip:          { icon: Factory,      badge: "gray",    pcmn: "3300", tvaRate: null, label: { fr: "En-cours de production", en: "Work in progress" }, desc: { fr: "Produits en cours de fabrication, non encore finis.", en: "Products being manufactured, not yet finished." }, placeholder: { fr: "ex. Commandes en fabrication", en: "e.g. Orders in production" } },
  finished:     { icon: Storefront,   badge: "success", pcmn: "3400", tvaRate: 0.21, label: { fr: "Produits finis", en: "Finished goods" }, desc: { fr: "Produits prêts à la vente.", en: "Products ready for sale." }, placeholder: { fr: "ex. Produits emballés", en: "e.g. Packaged products" } },
};
var STOCK_CATEGORIES = Object.keys(STOCK_CATEGORY_META);

/* ── Stock Modal ── */
function StockModal({ item, onSave, onClose, lang, initialLabel }) {
  var t = useT().stocks || {};
  var isEdit = !!item;
  var lk = lang === "en" ? "en" : "fr";

  var [selected, setSelected] = useState(isEdit ? (item.category || "merchandise") : "merchandise");
  var [name, setName] = useState(isEdit ? (item.name || "") : (initialLabel || ""));
  var [unitCost, setUnitCost] = useState(isEdit ? (item.unitCost || 0) : 0);
  var [sellingPrice, setSellingPrice] = useState(isEdit ? (item.sellingPrice || 0) : 0);
  var [quantity, setQuantity] = useState(isEdit ? (item.quantity || 0) : 0);
  var [monthlySales, setMonthlySales] = useState(isEdit ? (item.monthlySales || 0) : 0);
  var [minStock, setMinStock] = useState(isEdit ? (item.minStock || 0) : 0);
  var [reorderQty, setReorderQty] = useState(isEdit ? (item.reorderQty || 0) : 0);
  var [unit, setUnit] = useState(isEdit ? (item.unit || "") : "");

  var meta = STOCK_CATEGORY_META[selected] || STOCK_CATEGORY_META.merchandise;
  var Icon = meta.icon;

  function handleSelect(catKey) {
    setSelected(catKey);
    if (!isEdit) { setName(""); setUnitCost(0); setSellingPrice(0); setQuantity(0); setMonthlySales(0); setMinStock(0); setReorderQty(0); setUnit(""); }
  }

  function handleSubmit() {
    onSave({ name: name || meta.label[lk], category: selected, unitCost: unitCost, sellingPrice: sellingPrice, quantity: quantity, monthlySales: monthlySales, minStock: minStock, reorderQty: reorderQty, unit: unit });
    onClose();
  }

  var canSubmit = name.trim().length > 0;
  var margin = sellingPrice - unitCost;
  var stockVal = unitCost * quantity;

  return (
    <Modal open onClose={onClose} size="lg" height={560} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <ModalSideNav
          title={t.modal_category || "Type de stock"}
          items={STOCK_CATEGORIES.map(function (catKey) {
            var m = STOCK_CATEGORY_META[catKey];
            return { key: catKey, icon: m.icon, label: m.label[lk] };
          })}
          selected={selected}
          onSelect={handleSelect}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{meta.label[lk]}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{meta.desc[lk]}</div>
            </div>
          </div>
          <div className="custom-scroll" style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_name || (lk === "fr" ? "Nom du produit" : "Product name")} <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <input value={name} onChange={function (e) { setName(e.target.value); }} autoFocus placeholder={meta.placeholder[lk]}
                  style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {lk === "fr" ? "Unité" : "Unit"}
                </label>
                <input value={unit} onChange={function (e) { setUnit(e.target.value); }} placeholder={lk === "fr" ? "kg, L, pcs..." : "kg, L, pcs..."}
                  style={{ width: 90, height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "center" }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_unit_cost || (lk === "fr" ? "Coût d'achat unitaire" : "Unit purchase cost")}</label>
                <CurrencyInput value={unitCost} onChange={setUnitCost} suffix={"\u20AC"} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_selling_price || (lk === "fr" ? "Prix de vente unitaire" : "Unit selling price")}</label>
                <CurrencyInput value={sellingPrice} onChange={setSellingPrice} suffix={"\u20AC"} width="100%" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_quantity || (lk === "fr" ? "Quantité en stock" : "Stock quantity")}</label>
                <NumberField value={quantity} onChange={setQuantity} min={0} max={999999} step={1} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_monthly_sales || (lk === "fr" ? "Consommation / mois" : "Monthly consumption")}</label>
                <NumberField value={monthlySales} onChange={setMonthlySales} min={0} max={999999} step={1} width="100%" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{lk === "fr" ? "Stock minimum (alerte)" : "Minimum stock (alert)"}</label>
                <NumberField value={minStock} onChange={setMinStock} min={0} max={999999} step={1} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{lk === "fr" ? "Quantité de réappro." : "Reorder quantity"}</label>
                <NumberField value={reorderQty} onChange={setReorderQty} min={0} max={999999} step={1} width="100%" />
              </div>
            </div>
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_stock_value || (lk === "fr" ? "Valeur du stock" : "Stock value")}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(stockVal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_margin || (lk === "fr" ? "Marge unitaire" : "Unit margin")}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: margin >= 0 ? "var(--color-success)" : "var(--color-error)" }}>{eur(margin)}</span>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>{t.modal_close || (lk === "fr" ? "Fermer" : "Close")}</Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (t.modal_save || (lk === "fr" ? "Enregistrer" : "Save")) : (t.modal_add || (lk === "fr" ? "Ajouter" : "Add"))}
            </Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Forecast Chart (Recharts) ── */
function ForecastChart({ items, lk, chartPalette }) {
  var forecastData = useMemo(function () {
    if (!items || items.length === 0) return [];
    var months = 6;
    var data = [];
    for (var m = 1; m <= months; m++) { data.push({ month: "M" + m }); }
    items.forEach(function (item) {
      if ((item.monthlySales || 0) <= 0) return;
      var proj = forecastStock(item, months);
      proj.forEach(function (p, idx) {
        data[idx][item.id] = p.stock;
        data[idx][item.id + "_below"] = p.belowMin;
        data[idx][item.id + "_reorder"] = p.reordered;
      });
    });
    return data;
  }, [items]);

  var activeItems = useMemo(function () {
    return items.filter(function (it) { return (it.monthlySales || 0) > 0; });
  }, [items]);

  if (activeItems.length === 0) return null;

  var maxMin = 0;
  activeItems.forEach(function (it) { if ((it.minStock || 0) > maxMin) maxMin = it.minStock; });

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
        {lk === "fr" ? "Prévision des stocks (6 mois)" : "Stock forecast (6 months)"}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={forecastData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ fontWeight: 600 }}
          />
          {activeItems.map(function (item, idx) {
            return (
              <Line
                key={item.id}
                type="monotone"
                dataKey={item.id}
                name={item.name}
                stroke={chartPalette[idx % chartPalette.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: chartPalette[idx % chartPalette.length] }}
                activeDot={{ r: 5 }}
              />
            );
          })}
          {maxMin > 0 ? (
            <ReferenceLine y={maxMin} stroke="var(--color-error)" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: lk === "fr" ? "Stock min." : "Min. stock", fill: "var(--color-error)", fontSize: 10, position: "right" }} />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-3)", marginTop: "var(--sp-2)", paddingLeft: "var(--sp-2)" }}>
        {activeItems.map(function (item, idx) {
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: chartPalette[idx % chartPalette.length], flexShrink: 0 }} />
              <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function StocksPage({ stocks, setStocks, cfg, setTab, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate }) {
  var t = useT().stocks || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var { devMode } = useDevMode();

  var [showCreate, setShowCreate] = useState(false);
  var [pendingLabel, setPendingLabel] = useState("");
  var [editing, setEditing] = useState(null);
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");

  useEffect(function () {
    if (pendingAdd && pendingAdd.label) {
      setPendingLabel(pendingAdd.label);
      setShowCreate(true);
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAdd]);

  useEffect(function () {
    if (!pendingEdit) return;
    var idx = (stocks || []).findIndex(function (s) { return String(s.id) === String(pendingEdit.itemId); });
    if (idx >= 0) {
      setEditing({ idx: idx, item: stocks[idx] });
      if (onClearPendingEdit) onClearPendingEdit();
    }
  }, [pendingEdit]);

  useEffect(function () {
    if (!pendingDuplicate) return;
    var idx = (stocks || []).findIndex(function (s) { return String(s.id) === String(pendingDuplicate.itemId); });
    if (idx >= 0) {
      var clone = Object.assign({}, stocks[idx], { id: makeId(), name: stocks[idx].name + (lk === "fr" ? " (copie)" : " (copy)") });
      setStocks(function (prev) { var nc = prev.slice(); nc.splice(idx + 1, 0, clone); return nc; });
      setEditing({ idx: idx + 1, item: clone });
      if (onClearPendingDuplicate) onClearPendingDuplicate();
    }
  }, [pendingDuplicate]);

  var items = stocks || [];

  function addItem(data) { setStocks(function (prev) { return (prev || []).concat([Object.assign({ id: makeId() }, data)]); }); }
  function saveItem(idx, data) { setStocks(function (prev) { var nc = prev.slice(); nc[idx] = Object.assign({}, nc[idx], data); return nc; }); }
  function removeItem(idx) { setStocks(function (prev) { var nc = prev.slice(); nc.splice(idx, 1); return nc; }); }
  function requestDelete(idx) { if (skipDeleteConfirm) { removeItem(idx); } else { setPendingDelete(idx); } }
  function bulkDeleteItems(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setStocks(function (prev) { return prev.filter(function (s) { return !idSet[String(s.id)]; }); });
  }
  function cloneItem(idx) { setStocks(function (prev) { var nc = prev.slice(); var clone = Object.assign({}, nc[idx], { id: makeId(), name: nc[idx].name + (t.copy_suffix || " (copie)") }); nc.splice(idx + 1, 0, clone); return nc; }); }

  /* Totals */
  var totalValue = calcStockValue(items);
  var monthlyCogs = calcMonthlyCogs(items);
  var annualCogs = monthlyCogs * 12;
  var rotation = calcStockRotation(totalValue, annualCogs);
  var coverage = calcStockCoverage(totalValue, monthlyCogs);
  var annualMargin = items.reduce(function (sum, s) { return sum + ((s.sellingPrice || 0) - (s.unitCost || 0)) * (s.monthlySales || 0); }, 0) * 12;

  /* Alert items (stock below minStock) */
  var alertCount = countAlertItems(items);
  var monthlyReorderCost = calcMonthlyReorderCost(items);

  /* Average autonomy */
  var avgAutonomy = useMemo(function () {
    var total = 0;
    var count = 0;
    items.forEach(function (s) {
      var aut = calcItemAutonomy(s);
      if (aut !== null) { total += aut; count++; }
    });
    return count > 0 ? Math.round(total / count) : null;
  }, [items]);

  /* Category distribution */
  var categoryDistribution = {};
  items.forEach(function (s) {
    var ck = s.category || "merchandise";
    categoryDistribution[ck] = (categoryDistribution[ck] || 0) + (s.unitCost || 0) * (s.quantity || 0);
  });

  /* Filter options */
  var filterOptions = useMemo(function () {
    var cats = {};
    items.forEach(function (s) { var ck = s.category || "merchandise"; if (STOCK_CATEGORY_META[ck]) cats[ck] = true; });
    var opts = [{ value: "all", label: t.filter_all || (lk === "fr" ? "Toutes les catégories" : "All categories") }];
    Object.keys(cats).forEach(function (ck) { opts.push({ value: ck, label: STOCK_CATEGORY_META[ck].label[lk] }); });
    return opts;
  }, [items, lk, t]);

  var filteredItems = useMemo(function () {
    var list = items;
    if (filter !== "all") list = list.filter(function (s) { return (s.category || "merchandise") === filter; });
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      list = list.filter(function (s) { return (s.name || "").toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }, [items, filter, search]);

  /* Columns */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: t.col_name || (lk === "fr" ? "Produit" : "Product"),
        enableSorting: true, meta: { align: "left", minWidth: 140, grow: true },
        cell: function (info) {
          var row = info.row.original;
          var isAlert = (row.minStock || 0) > 0 && (row.quantity || 0) < (row.minStock || 0);
          var isLinked = !!row._linkedIngredient;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isAlert ? <Warning size={14} weight="fill" color="var(--color-error)" /> : null}
              <span style={{ fontWeight: 500 }}>{info.getValue() || "\u2014"}</span>
            </div>
          );
        },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{items.length} {t.footer_items || (lk === "fr" ? "produits" : "products")}</span>
            </>
          );
        },
      },
      {
        id: "category",
        header: t.col_category || "Type",
        accessorFn: function (row) { return row.category || "merchandise"; },
        enableSorting: true, meta: { align: "left" },
        cell: function (info) {
          var cat = info.row.original.category || "merchandise";
          var m = STOCK_CATEGORY_META[cat];
          return m ? <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge> : cat;
        },
        formatPrint: function (val) {
          var m = STOCK_CATEGORY_META[val];
          return m ? m.label[lk] : val;
        },
      },
      {
        id: "linkedTo",
        header: lk === "fr" ? "Lié à" : "Linked to",
        enableSorting: false, meta: { align: "left" },
        cell: function (info) {
          var row = info.row.original;
          if (row._linkedIngredient && row._linkedPage) {
            var pageLabel = row._linkedPage === "production" ? "Production" : row._linkedPage;
            return (
              <button type="button" onClick={function () { if (setTab) setTab(row._linkedPage); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "var(--brand)", fontStyle: "italic",
                  border: "none", background: "none", cursor: "pointer",
                  fontFamily: "inherit", padding: "2px 6px", borderRadius: "var(--r-sm)",
                  transition: "background 0.12s",
                }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "none"; }}
              >
                <ArrowRight size={10} weight="bold" />
                {pageLabel}
              </button>
            );
          }
          return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
        },
      },
      {
        id: "unitCost", accessorKey: "unitCost",
        header: t.col_unit_cost || (lk === "fr" ? "Coût unit." : "Unit cost"),
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue() || 0); },
      },
      {
        id: "quantity", accessorKey: "quantity",
        header: t.col_qty || (lk === "fr" ? "Qté" : "Qty"),
        enableSorting: true, meta: { align: "right" },
        cell: function (info) {
          var row = info.row.original;
          var unitLabel = row.unit ? " " + row.unit : "";
          return String(info.getValue() || 0) + unitLabel;
        },
      },
      {
        id: "monthlySales",
        header: lk === "fr" ? "Conso. / mois" : "Consumption / mo",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.monthlySales || 0; },
        cell: function (info) {
          var v = info.getValue();
          var unitLabel = info.row.original.unit ? " " + info.row.original.unit : "";
          return v > 0 ? String(v) + unitLabel : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
        },
      },
      {
        id: "autonomy",
        header: lk === "fr" ? "Autonomie" : "Autonomy",
        enableSorting: true, meta: { align: "center" },
        accessorFn: function (row) { return calcItemAutonomy(row); },
        cell: function (info) {
          var days = info.getValue();
          if (days === null) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
          var color = days > 30 ? "var(--color-success)" : days > 14 ? "var(--color-warning)" : "var(--color-error)";
          var label = days >= 30 ? Math.round(days / 30) + " " + (lk === "fr" ? "mois" : "mo") : days + " " + (lk === "fr" ? "jours" : "days");
          return <Badge color={days > 30 ? "success" : days > 14 ? "warning" : "error"} size="sm">{label}</Badge>;
        },
      },
      {
        id: "minStock",
        header: lk === "fr" ? "Stock min." : "Min. stock",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.minStock || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
        },
      },
      {
        id: "nextReorder",
        header: lk === "fr" ? "Prochaine commande" : "Next reorder",
        enableSorting: true, meta: { align: "center" },
        accessorFn: function (row) { return calcDaysToReorder(row); },
        cell: function (info) {
          var days = info.getValue();
          if (days === null) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
          if (days === 0) return <Badge color="error" size="sm">{lk === "fr" ? "Maintenant" : "Now"}</Badge>;
          if (days <= 14) return <Badge color="warning" size="sm">{days + (lk === "fr" ? " j" : " d")}</Badge>;
          return <span style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{days + (lk === "fr" ? " j" : " d")}</span>;
        },
      },
      {
        id: "value",
        accessorFn: function (row) { return (row.unitCost || 0) * (row.quantity || 0); },
        header: t.col_value || (lk === "fr" ? "Valeur" : "Value"),
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalValue)}</span>; },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          var idx = items.findIndex(function (i) { return i.id === row.id; });
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || (lk === "fr" ? "Modifier" : "Edit")} onClick={function () { setEditing({ idx: idx, item: items[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || (lk === "fr" ? "Dupliquer" : "Duplicate")} onClick={function () { cloneItem(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || (lk === "fr" ? "Supprimer" : "Delete")} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [items, totalValue, lk, t]);

  function randomize() {
    setStocks([
      { id: makeId(), name: t.random_merch || "T-shirts imprimés", category: "merchandise", unitCost: 8, sellingPrice: 25, quantity: 50 + Math.floor(Math.random() * 200), monthlySales: 10 + Math.floor(Math.random() * 30), minStock: 15, reorderQty: 40, unit: "pcs" },
      { id: makeId(), name: t.random_raw || "Tissu coton bio", category: "raw", unitCost: 3, sellingPrice: 0, quantity: 100 + Math.floor(Math.random() * 300), monthlySales: 30 + Math.floor(Math.random() * 50), minStock: 50, reorderQty: 100, unit: "m" },
      { id: makeId(), name: t.random_supplies || "Emballages carton", category: "supplies", unitCost: 0.50, sellingPrice: 0, quantity: 200 + Math.floor(Math.random() * 500), monthlySales: 40 + Math.floor(Math.random() * 60), minStock: 80, reorderQty: 200, unit: "pcs" },
      { id: makeId(), name: t.random_finished || "Sacs personnalisés", category: "finished", unitCost: 12, sellingPrice: 35, quantity: 20 + Math.floor(Math.random() * 80), monthlySales: 5 + Math.floor(Math.random() * 15), minStock: 10, reorderQty: 25, unit: "pcs" },
    ]);
  }

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || (lk === "fr" ? "Rechercher..." : "Search...")} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomize} onClear={function () { setStocks([]); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredItems} columns={columns} filename="stocks" title={t.title || (lk === "fr" ? "Stocks & Inventaire" : "Stocks & Inventory")} subtitle={t.subtitle || (lk === "fr" ? "Gérez vos produits, matières premières et marchandises." : "Manage your products, raw materials and merchandise.")} getPcmn={function (row) { var m = STOCK_CATEGORY_META[row.category]; return m && m.pcmn ? m.pcmn : "3400"; }} />
        <Button color="primary" size="lg" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add || (lk === "fr" ? "Ajouter" : "Add")}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ textAlign: "center", padding: "var(--sp-6)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.empty_title || (lk === "fr" ? "Aucun stock" : "No stock")}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: "var(--sp-1)" }}>{t.empty_desc || (lk === "fr" ? "Ajoutez vos produits, matières premières et marchandises." : "Add your products, raw materials and merchandise.")}</div>
    </div>
  );

  return (
    <PageLayout title={t.title || (lk === "fr" ? "Stocks & Inventaire" : "Stocks & Inventory")} subtitle={t.subtitle || (lk === "fr" ? "Gérez vos produits, matières premières et marchandises. La valorisation impacte le bilan et le compte de résultat." : "Manage your products, raw materials and merchandise. Valuation impacts balance sheet and income statement.")} icon={Package} iconColor="var(--color-warning)">
      {showCreate ? <StockModal onSave={addItem} onClose={function () { setShowCreate(false); setPendingLabel(""); }} lang={lang} initialLabel={pendingLabel} /> : null}
      {editing ? <StockModal item={editing.item} onSave={function (data) { saveItem(editing.idx, data); }} onClose={function () { setEditing(null); }} lang={lang} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeItem(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{ confirm_title: t.confirm_delete || (lk === "fr" ? "Supprimer ce produit ?" : "Delete this product?"), confirm_body: t.confirm_delete_body || (lk === "fr" ? "Ce produit sera retiré de l'inventaire." : "This product will be removed from inventory."), confirm_skip: t.confirm_skip || (lk === "fr" ? "Ne plus demander" : "Don't ask again"), cancel: t.cancel || (lk === "fr" ? "Annuler" : "Cancel"), delete: t.delete || (lk === "fr" ? "Supprimer" : "Delete") }}
      /> : null}

      {/* Alert banner */}
      {alertCount > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-3) var(--sp-4)", background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)", borderRadius: "var(--r-md)", marginBottom: "var(--gap-md)" }}>
          <Warning size={18} weight="fill" color="var(--color-error)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-error)" }}>
            {alertCount} {alertCount === 1
              ? (lk === "fr" ? "produit en alerte de stock" : "product with low stock alert")
              : (lk === "fr" ? "produits en alerte de stock" : "products with low stock alert")
            }
          </span>
        </div>
      ) : null}

      {/* KPIs */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_value || (lk === "fr" ? "Valeur du stock" : "Stock value")} value={totalValue > 0 ? eurShort(totalValue) : "\u2014"} fullValue={totalValue > 0 ? eur(totalValue) : undefined} glossaryKey="stock_value" />
        <KpiCard
          label={lk === "fr" ? "Produits en alerte" : "Items on alert"}
          value={alertCount > 0 ? String(alertCount) : "\u2014"}
          color={alertCount > 0 ? "error" : undefined}
        />
        <KpiCard label={lk === "fr" ? "Autonomie moyenne" : "Avg. autonomy"} value={avgAutonomy !== null ? avgAutonomy + " " + (lk === "fr" ? "jours" : "days") : "\u2014"} />
        <KpiCard label={lk === "fr" ? "Coût de réappro. / mois" : "Reorder cost / month"} value={monthlyReorderCost > 0 ? eurShort(monthlyReorderCost) : "\u2014"} fullValue={monthlyReorderCost > 0 ? eur(monthlyReorderCost) + (lk === "fr" ? "/mois" : "/mo") : undefined} />
      </div>

      {/* Insights: Donut + Flux */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || (lk === "fr" ? "Répartition par catégorie" : "Distribution by category")}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <DonutChart data={categoryDistribution} palette={chartPalette} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.keys(categoryDistribution).length > 0 ? Object.keys(categoryDistribution).map(function (ck, ci) {
                var m = STOCK_CATEGORY_META[ck];
                if (!m) return null;
                var catPct = totalValue > 0 ? Math.round(categoryDistribution[ck] / totalValue * 100) : 0;
                return (
                  <div key={ck} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: chartPalette[ci % chartPalette.length] || "var(--text-muted)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{m.label[lk]}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{catPct}%</span>
                  </div>
                );
              }) : [0, 1, 2].map(function (i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-hover)", flexShrink: 0 }} />
                    <span style={{ height: 10, borderRadius: 4, background: "var(--bg-hover)", flex: 1 }} />
                    <span style={{ width: 24, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Flux & variation card */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {t.flow_title || (lk === "fr" ? "Flux & variation" : "Flow & variation")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>{t.summary_consumption || (lk === "fr" ? "Consommation / mois" : "Consumption / month")}</span>
              <span style={{ fontWeight: 600, color: monthlyCogs > 0 ? "var(--color-error)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{monthlyCogs > 0 ? "\u2212" + eur(monthlyCogs) : "\u2014"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>{t.summary_purchases || (lk === "fr" ? "Achats prévus / an" : "Planned purchases / yr")}</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{annualCogs > 0 ? eur(annualCogs) : "\u2014"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: "var(--sp-2)", borderTop: "1px solid var(--border-light)" }}>
              <span style={{ color: "var(--text-muted)" }}>{t.summary_profit || (lk === "fr" ? "Bénéfice estimé / an" : "Estimated profit / yr")}</span>
              <span style={{ fontWeight: 600, color: items.length > 0 && annualMargin !== 0 ? (annualMargin >= 0 ? "var(--color-success)" : "var(--color-error)") : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {items.length > 0 ? eur(annualMargin) : "\u2014"}
              </span>
            </div>
          </div>
          {/* Stock autonomy progress bar */}
          {monthlyCogs > 0 && totalValue > 0 ? (function () {
            var maxMonths = 12;
            var barPct = Math.min((coverage || 0) / maxMonths * 100, 100);
            var barColor = coverage >= 3 ? "var(--color-success)" : coverage >= 1 ? "var(--color-warning)" : "var(--color-error)";
            return (
              <div style={{ marginTop: "var(--sp-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                    {t.autonomy_label || (lk === "fr" ? "Autonomie du stock" : "Stock autonomy")}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: barColor }}>
                    {coverage} {t.kpi_months || (lk === "fr" ? "mois" : "months")}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: barColor, width: barPct + "%", transition: "width 0.3s, background 0.3s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>0</span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{maxMonths} {t.kpi_months || (lk === "fr" ? "mois" : "months")}</span>
                </div>
              </div>
            );
          })() : null}
        </div>
      </div>

      {/* Forecast Chart */}
      {items.length > 0 ? <ForecastChart items={items} lk={lk} chartPalette={chartPalette} /> : null}

      {/* DataTable */}
      <DataTable
        data={filteredItems}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={160}
        pageSize={20}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={bulkDeleteItems}
        scrollable
        showFooter
      />
    </PageLayout>
  );
}
