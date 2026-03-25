import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash, PencilSimple, Copy,
  Package, ShoppingCart, Factory, Storefront, Barcode,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SearchInput, FilterDropdown, PaletteToggle, ExportButtons, DevOptionsButton, DonutChart, ModalSideNav, CurrencyInput, NumberField, Modal, ModalFooter } from "../components";
import { eur, eurShort, makeId, calcStockValue, calcMonthlyCogs, calcStockRotation, calcStockCoverage } from "../utils";
import { useT, useLang, useDevMode } from "../context";

/* ── Stock categories (PCMN classe 3) ── */
var STOCK_CATEGORY_META = {
  merchandise:  { icon: ShoppingCart, badge: "brand",   pcmn: "3400", tvaRate: 0.21, label: { fr: "Marchandises", en: "Merchandise" }, desc: { fr: "Produits achetés pour la revente sans transformation.", en: "Products purchased for resale without modification." }, placeholder: { fr: "ex. Stock de vêtements", en: "e.g. Clothing stock" } },
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

  var meta = STOCK_CATEGORY_META[selected] || STOCK_CATEGORY_META.merchandise;
  var Icon = meta.icon;

  function handleSelect(catKey) {
    setSelected(catKey);
    if (!isEdit) { setName(""); setUnitCost(0); setSellingPrice(0); setQuantity(0); setMonthlySales(0); }
  }

  function handleSubmit() {
    onSave({ name: name || meta.label[lk], category: selected, unitCost: unitCost, sellingPrice: sellingPrice, quantity: quantity, monthlySales: monthlySales });
    onClose();
  }

  var canSubmit = name.trim().length > 0;
  var margin = sellingPrice - unitCost;
  var stockVal = unitCost * quantity;

  return (
    <Modal open onClose={onClose} size="lg" height={480} hideClose>
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
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {t.field_name || "Nom du produit"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} autoFocus placeholder={meta.placeholder[lk]}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_unit_cost || "Coût d'achat unitaire"}</label>
                <CurrencyInput value={unitCost} onChange={setUnitCost} suffix="€" width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_selling_price || "Prix de vente unitaire"}</label>
                <CurrencyInput value={sellingPrice} onChange={setSellingPrice} suffix="€" width="100%" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_quantity || "Quantité en stock"}</label>
                <NumberField value={quantity} onChange={setQuantity} min={0} max={999999} step={1} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_monthly_sales || "Ventes mensuelles prévues"}</label>
                <NumberField value={monthlySales} onChange={setMonthlySales} min={0} max={999999} step={1} width="100%" />
              </div>
            </div>
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_stock_value || "Valeur du stock"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(stockVal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_margin || "Marge unitaire"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: margin >= 0 ? "var(--color-success)" : "var(--color-error)" }}>{eur(margin)}</span>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>{t.modal_close || "Fermer"}</Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (t.modal_save || "Enregistrer") : (t.modal_add || "Ajouter")}
            </Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Page ── */
export default function StocksPage({ stocks, setStocks, cfg, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate }) {
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
      var clone = Object.assign({}, stocks[idx], { id: makeId(), name: stocks[idx].name + " (copie)" });
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
    var opts = [{ value: "all", label: t.filter_all || "Toutes les catégories" }];
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
        header: t.col_name || "Produit",
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{items.length} {t.footer_items || "produits"}</span>
            </>
          );
        },
      },
      {
        id: "category",
        header: t.col_category || "Type",
        enableSorting: true, meta: { align: "left" },
        cell: function (info) {
          var cat = info.row.original.category || "merchandise";
          var m = STOCK_CATEGORY_META[cat];
          return m ? <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge> : cat;
        },
      },
      {
        id: "unitCost", accessorKey: "unitCost",
        header: t.col_unit_cost || "Coût unitaire",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue() || 0); },
      },
      {
        id: "sellingPrice", accessorKey: "sellingPrice",
        header: t.col_selling_price || "Prix de vente",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue() || 0); },
      },
      {
        id: "quantity", accessorKey: "quantity",
        header: t.col_qty || "Qté",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return String(info.getValue() || 0); },
      },
      {
        id: "value",
        accessorFn: function (row) { return (row.unitCost || 0) * (row.quantity || 0); },
        header: t.col_value || "Valeur",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalValue)}</span>; },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          var idx = items.indexOf(row);
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { setEditing({ idx: idx, item: items[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Dupliquer"} onClick={function () { cloneItem(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Supprimer"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [items, totalValue, lk, t]);

  function randomize() {
    setStocks([
      { id: makeId(), name: t.random_merch || "T-shirts imprimés", category: "merchandise", unitCost: 8, sellingPrice: 25, quantity: 50 + Math.floor(Math.random() * 200), monthlySales: 10 + Math.floor(Math.random() * 30) },
      { id: makeId(), name: t.random_raw || "Tissu coton bio", category: "raw", unitCost: 3, sellingPrice: 0, quantity: 100 + Math.floor(Math.random() * 300), monthlySales: 30 + Math.floor(Math.random() * 50) },
      { id: makeId(), name: t.random_supplies || "Emballages carton", category: "supplies", unitCost: 0.50, sellingPrice: 0, quantity: 200 + Math.floor(Math.random() * 500), monthlySales: 40 + Math.floor(Math.random() * 60) },
      { id: makeId(), name: t.random_finished || "Sacs personnalisés", category: "finished", unitCost: 12, sellingPrice: 35, quantity: 20 + Math.floor(Math.random() * 80), monthlySales: 5 + Math.floor(Math.random() * 15) },
    ]);
  }

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomize} onClear={function () { setStocks([]); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredItems} columns={columns} filename="stocks" title={t.title || (lang === "fr" ? "Stocks & Inventaire" : "Stocks & Inventory")} subtitle={t.subtitle || (lang === "fr" ? "Gérez vos produits, matières premières et marchandises." : "Manage your products, raw materials and merchandise.")} getPcmn={function (row) { var m = STOCK_CATEGORY_META[row.category]; return m && m.pcmn ? m.pcmn : "3400"; }} />
        <Button color="primary" size="lg" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add || "Ajouter un produit"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ textAlign: "center", padding: "var(--sp-6)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.empty_title || "Aucun stock"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: "var(--sp-1)" }}>{t.empty_desc || "Ajoutez vos produits, matières premières et marchandises."}</div>
    </div>
  );

  return (
    <PageLayout title={t.title || "Stocks & Inventaire"} subtitle={t.subtitle || "Gérez vos produits, matières premières et marchandises. La valorisation impacte le bilan et le compte de résultat."} icon={Package} iconColor="#F59E0B">
      {showCreate ? <StockModal onSave={addItem} onClose={function () { setShowCreate(false); setPendingLabel(""); }} lang={lang} initialLabel={pendingLabel} /> : null}
      {editing ? <StockModal item={editing.item} onSave={function (data) { saveItem(editing.idx, data); }} onClose={function () { setEditing(null); }} lang={lang} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeItem(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{ confirm_title: t.confirm_delete || "Supprimer ce produit ?", confirm_body: t.confirm_delete_body || "Ce produit sera retiré de l'inventaire.", confirm_skip: t.confirm_skip || "Ne plus demander", cancel: t.cancel || "Annuler", delete: t.delete || "Supprimer" }}
      /> : null}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_value || "Valeur du stock"} value={totalValue > 0 ? eurShort(totalValue) : "—"} fullValue={totalValue > 0 ? eur(totalValue) : undefined} glossaryKey="stock_value" />
        <KpiCard label={t.kpi_cogs || "Coût des ventes / mois"} value={monthlyCogs > 0 ? eurShort(monthlyCogs) : "—"} fullValue={monthlyCogs > 0 ? eur(monthlyCogs) + "/mois" : undefined} glossaryKey="cogs" />
        <KpiCard label={t.kpi_rotation || "Rotation du stock"} value={rotation !== null ? rotation + " " + (t.kpi_days || "jours") : "—"} glossaryKey="stock_rotation" />
        <KpiCard label={t.kpi_coverage || "Couverture"} value={coverage !== null ? coverage + " " + (t.kpi_months || "mois") : "—"} glossaryKey="stock_coverage" />
      </div>

      {/* Insights: Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Répartition par catégorie"}
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
            {t.flow_title || "Flux & variation"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>{t.summary_consumption || "Consommation / mois"}</span>
              <span style={{ fontWeight: 600, color: monthlyCogs > 0 ? "var(--color-error)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{monthlyCogs > 0 ? "−" + eur(monthlyCogs) : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>{t.summary_purchases || "Achats prévus / an"}</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{annualCogs > 0 ? eur(annualCogs) : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: "var(--sp-2)", borderTop: "1px solid var(--border-light)" }}>
              <span style={{ color: "var(--text-muted)" }}>{t.summary_profit || "Bénéfice estimé / an"}</span>
              <span style={{ fontWeight: 600, color: items.length > 0 && annualMargin !== 0 ? (annualMargin >= 0 ? "var(--color-success)" : "var(--color-error)") : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {items.length > 0 ? eur(annualMargin) : "—"}
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
                    {t.autonomy_label || "Autonomie du stock"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: barColor }}>
                    {coverage} {t.kpi_months || "mois"}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: barColor, width: barPct + "%", transition: "width 0.3s, background 0.3s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>0</span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{maxMonths} {t.kpi_months || "mois"}</span>
                </div>
              </div>
            );
          })() : null}
        </div>
      </div>

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

      />
    </PageLayout>
  );
}
