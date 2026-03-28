import { useState, useMemo, useEffect } from "react";
import {
  Plus, Trash,
  PencilSimple, Copy,
  Bank, CreditCard, Car, Handshake, Gift, ArrowRight, Info,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, SearchInput, FilterDropdown, ActionBtn, ExportButtons, DevOptionsButton, ModalSideNav, CurrencyInput, NumberField, Modal, ModalFooter } from "../../components";
import { eur, eurShort, pct } from "../../utils";
import { useT, useLang, useDevMode } from "../../context";

/* ── Financing type metadata ── */
var DEBT_TYPE_META = {
  bank:       { icon: Bank, badge: "brand", label: { fr: "Emprunt bancaire", en: "Bank loan" }, desc: { fr: "Prêt à terme avec taux fixe et mensualités constantes.", en: "Fixed-rate term loan with constant monthly payments." }, placeholder: { fr: "ex. Prêt Belfius", en: "e.g. Belfius loan" }, defaultAmount: 50000, defaultRate: 0.035, defaultDuration: 60 },
  credit:     { icon: CreditCard, badge: "info", label: { fr: "Ligne de crédit", en: "Credit line" }, desc: { fr: "Crédit renouvelable. Intérêts sur le montant utilisé.", en: "Revolving credit. Interest on amount drawn." }, placeholder: { fr: "ex. Facilité de caisse", en: "e.g. Overdraft" }, defaultAmount: 25000, defaultRate: 0.06, defaultDuration: 12 },
  leasing:    { icon: Car, badge: "gray", label: { fr: "Leasing", en: "Leasing" }, desc: { fr: "Location-financement pour véhicules ou équipements.", en: "Financial lease for vehicles or equipment." }, placeholder: { fr: "ex. Leasing véhicule", en: "e.g. Vehicle lease" }, defaultAmount: 30000, defaultRate: 0.04, defaultDuration: 48 },
  loan:       { icon: Handshake, badge: "warning", label: { fr: "Prêt associé", en: "Shareholder loan" }, desc: { fr: "Prêt par un associé ou un proche.", en: "Loan from a partner or related party." }, placeholder: { fr: "ex. Prêt fondateur", en: "e.g. Founder loan" }, defaultAmount: 20000, defaultRate: 0.02, defaultDuration: 36 },
  subsidy:    { icon: Gift, badge: "success", label: { fr: "Aide / Subside", en: "Grant / Subsidy" }, desc: { fr: "Aide publique non remboursable.", en: "Non-repayable public aid." }, placeholder: { fr: "ex. Bourse Wallonie", en: "e.g. Regional grant" }, defaultAmount: 10000, defaultRate: 0, defaultDuration: 1 },
  advance:    { icon: ArrowRight, badge: "gray", label: { fr: "Avance récupérable", en: "Recoverable advance" }, desc: { fr: "Prêt à taux zéro remboursable sous conditions.", en: "Zero-rate loan repayable under conditions." }, placeholder: { fr: "ex. Avance Innoviris", en: "e.g. Innoviris advance" }, defaultAmount: 15000, defaultRate: 0, defaultDuration: 60 },
  convertible: { icon: Bank, badge: "brand", label: { fr: "Prêt convertible", en: "Convertible note" }, desc: { fr: "Prêt convertible en actions lors d'une levée.", en: "Loan convertible into equity during a round." }, placeholder: { fr: "ex. Note convertible seed", en: "e.g. Seed note" }, defaultAmount: 50000, defaultRate: 0, defaultDuration: 24 },
  crowdfunding: { icon: Handshake, badge: "info", label: { fr: "Crowdfunding", en: "Crowdfunding" }, desc: { fr: "Financement participatif.", en: "Crowdfunding." }, placeholder: { fr: "", en: "" }, defaultAmount: 0, defaultRate: 0, defaultDuration: 1 },
};
var DEBT_TYPES = Object.keys(DEBT_TYPE_META);
var DEBT_TYPES_MODAL = DEBT_TYPES.filter(function (k) { return k !== "crowdfunding"; });

/* ── PMT & remaining balance ── */
function pmtCalc(rate, nper, pv) {
  if (rate === 0) return nper > 0 ? pv / nper : 0;
  return pv * rate * Math.pow(1 + rate, nper) / (Math.pow(1 + rate, nper) - 1);
}
function remainingBalance(amount, mr, duration, elapsed) {
  if (elapsed >= duration) return 0;
  if (mr === 0) return Math.max(0, amount - (amount / duration) * elapsed);
  return amount * (Math.pow(1 + mr, duration) - Math.pow(1 + mr, elapsed)) / (Math.pow(1 + mr, duration) - 1);
}

/* ── Debt Modal ── */
function DebtModal({ onAdd, onSave, onClose, lang, initialData, initialLabel }) {
  var t = useT().debt || {};
  var isEdit = !!initialData;
  var [selected, setSelected] = useState(isEdit ? (initialData.type || "bank") : "bank");
  var [name, setName] = useState(isEdit ? (initialData.name || "") : (initialLabel || ""));
  var [amount, setAmount] = useState(isEdit ? (initialData.amount || 0) : DEBT_TYPE_META.bank.defaultAmount);
  var [rate, setRate] = useState(isEdit ? (initialData.rate || 0) : DEBT_TYPE_META.bank.defaultRate);
  var [duration, setDuration] = useState(isEdit ? (initialData.duration || 60) : DEBT_TYPE_META.bank.defaultDuration);
  var [elapsed, setElapsed] = useState(isEdit ? (initialData.elapsed || 0) : 0);
  var lk = lang === "en" ? "en" : "fr";
  var meta = DEBT_TYPE_META[selected] || DEBT_TYPE_META.bank;
  var Icon = meta.icon;

  function handleSelect(typeKey) {
    setSelected(typeKey);
    if (!isEdit) { var m = DEBT_TYPE_META[typeKey]; setName(""); setAmount(m.defaultAmount); setRate(m.defaultRate); setDuration(m.defaultDuration); setElapsed(0); }
  }
  function handleSubmit() {
    var data = { id: isEdit ? initialData.id : Date.now(), name: name || meta.label[lk], type: selected, amount: amount, rate: rate, duration: duration, elapsed: elapsed };
    if (isEdit && onSave) { onSave(data); } else if (onAdd) { onAdd(data); }
    onClose();
  }
  var canSubmit = name.trim().length > 0 && amount > 0;
  var isSubsidy = selected === "subsidy";
  var mr = rate / 12;
  var monthly = isSubsidy ? 0 : pmtCalc(mr, duration, amount);
  var totalInterest = isSubsidy ? 0 : monthly * duration - amount;

  return (
    <Modal open onClose={onClose} size="lg" height={540} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <ModalSideNav
          title={t.modal_type || "Type de financement"}
          items={DEBT_TYPES_MODAL.map(function (typeKey) { var m = DEBT_TYPE_META[typeKey]; return { key: typeKey, icon: m.icon, label: m.label[lk] }; })}
          selected={selected}
          onSelect={handleSelect}
          width={220}
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
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_name || "Nom du financement"} <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} autoFocus placeholder={meta.placeholder[lk]} style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.col_amount || "Montant"} <span style={{ color: "var(--color-error)" }}>*</span></label>
                <CurrencyInput value={amount} onChange={setAmount} suffix="€" width="100%" />
              </div>
              {!isSubsidy ? (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.col_rate || "Taux annuel"}</label>
                  <NumberField value={rate} onChange={setRate} min={0} max={1} step={0.005} width="100%" pct />
                </div>
              ) : null}
            </div>
            {!isSubsidy ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_duration || "Durée (mois)"}</label>
                  <NumberField value={duration} onChange={setDuration} min={1} max={360} step={1} width="100%" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_elapsed || "Mois écoulés"}</label>
                  <NumberField value={elapsed} onChange={setElapsed} min={0} max={duration} step={1} width="100%" />
                </div>
              </div>
            ) : null}
            {amount > 0 && !isSubsidy ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--text-muted)" }}>{t.col_monthly || "Mensualité"}</span><span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(monthly)}/mois</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--text-muted)" }}>{t.breakdown_interest || "Total intérêts"}</span><span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(totalInterest)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--text-muted)" }}>{t.breakdown_total_cost || "Coût total"}</span><span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(amount + totalInterest)}</span></div>
              </div>
            ) : null}
            {selected === "convertible" ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--color-info)", display: "flex", gap: "var(--sp-3)", alignItems: "flex-start" }}>
                <Info size={16} weight="bold" color="var(--color-info)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-info)", marginBottom: 2 }}>{t.convert_hint_title || "Conversion en actions"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.convert_hint_body || "Ce prêt sera converti en parts lors d'une prochaine levée."}</div>
                </div>
              </div>
            ) : null}
          </div>
          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>{t.modal_close || "Fermer"}</Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>{isEdit ? (t.modal_save || "Enregistrer") : (t.modal_add || "Ajouter")}</Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Page ── */
export default function DebtPage({ debts, setDebts, ebit, capitalSocial, cfg, setCfg, setTab, onNavigate, crowdfunding, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate }) {
  var t = useT().debt || {};
  var { lang } = useLang();
  var [activeTab, setActiveTab] = useState("all");
  var [showCreate, setShowCreate] = useState(null);
  var [pendingLabel, setPendingLabel] = useState("");
  var [editingDebt, setEditingDebt] = useState(null);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  useEffect(function () {
    if (pendingAdd && pendingAdd.label) {
      setPendingLabel(pendingAdd.label);
      setShowCreate("bank");
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAdd]);

  useEffect(function () {
    if (!pendingEdit) return;
    var idx = (debts || []).findIndex(function (d) { return String(d.id) === String(pendingEdit.itemId); });
    if (idx >= 0) {
      setEditingDebt({ idx: idx, item: debts[idx] });
      if (onClearPendingEdit) onClearPendingEdit();
    }
  }, [pendingEdit]);

  useEffect(function () {
    if (!pendingDuplicate) return;
    var idx = (debts || []).findIndex(function (d) { return String(d.id) === String(pendingDuplicate.itemId); });
    if (idx >= 0) {
      var clone = Object.assign({}, debts[idx], { id: Date.now(), name: debts[idx].name + " (copie)" });
      setDebts(function (prev) { var nc = prev.slice(); nc.splice(idx + 1, 0, clone); return nc; });
      setEditingDebt({ idx: idx + 1, item: clone });
      if (onClearPendingDuplicate) onClearPendingDuplicate();
    }
  }, [pendingDuplicate]);

  var { devMode } = useDevMode();
  var lk = lang === "en" ? "en" : "fr";

  /* Computed + crowdfunding read-only item */
  var allItems = useMemo(function () {
    var items = (debts || []).map(function (d) {
      var mr = d.rate / 12;
      var isSub = d.type === "subsidy";
      var monthly = isSub ? 0 : pmtCalc(mr, d.duration, d.amount);
      var rem = isSub ? 0 : remainingBalance(d.amount, mr, d.duration, d.elapsed || 0);
      var ti = isSub ? 0 : Math.max(0, monthly * d.duration - d.amount);
      return Object.assign({}, d, { monthly: monthly, remaining: rem, totalInterest: ti });
    });
    /* Inject crowdfunding as read-only if enabled */
    if (crowdfunding && crowdfunding.enabled && crowdfunding.goal > 0) {
      items.push({
        id: "_crowdfunding",
        name: crowdfunding.name || (t.crowdfunding_name || "Crowdfunding"),
        type: "crowdfunding",
        amount: crowdfunding.goal,
        rate: 0, duration: 1, elapsed: 0,
        monthly: 0, remaining: 0, totalInterest: 0,
        _readOnly: true, _linkedPage: "crowdfunding",
      });
    }
    return items;
  }, [debts, crowdfunding]);

  // Auto-sync shareholder loans (PCMN 174) to balance sheet
  var shareholderLoanTotal = useMemo(function () {
    return (debts || []).reduce(function (sum, d) {
      if (d.type === "loan") {
        var mr = d.rate / 12;
        sum += remainingBalance(d.amount, mr, d.duration, d.elapsed || 0);
      }
      return sum;
    }, 0);
  }, [debts]);

  useEffect(function () {
    if (cfg && setCfg && Math.abs(shareholderLoanTotal - (cfg.shareholderLoans || 0)) > 0.01) {
      setCfg(function (prev) { return Object.assign({}, prev, { shareholderLoans: shareholderLoanTotal }); });
    }
  }, [shareholderLoanTotal]);

  var totalRemaining = 0, totalMonthly = 0, annualInterest = 0, totalBorrowed = 0;
  allItems.forEach(function (c) {
    totalRemaining += c.remaining; totalMonthly += c.monthly; totalBorrowed += c.amount;
    if (c.type !== "subsidy" && c.type !== "crowdfunding" && c.duration > 0) annualInterest += Math.max(0, c.monthly * 12 - c.amount / c.duration * 12);
  });
  var annualDebtService = totalMonthly * 12;
  var dscr = annualDebtService > 0 && ebit != null ? ebit / annualDebtService : 0;
  var debtRatio = capitalSocial > 0 ? totalRemaining / capitalSocial : 0;

  /* Tab mapping */
  var DEBT_TAB_TYPES = ["all", "loans", "grants", "convertible"];
  function debtTabType(d) {
    if (d.type === "crowdfunding") return "all";
    if (d.type === "convertible") return "convertible";
    if (d.type === "subsidy" || d.type === "advance") return "grants";
    return "loans";
  }
  var TAB_LABELS = { all: t.tab_all || "Tous", loans: t.tab_loans || "Emprunts", grants: t.tab_grants || "Aides", convertible: t.tab_convertible || "Convertibles" };
  var tabCounts = useMemo(function () {
    var counts = { all: allItems.length, loans: 0, grants: 0, convertible: 0 };
    allItems.forEach(function (d) { var tk = debtTabType(d); if (tk !== "all") counts[tk]++; });
    return counts;
  }, [allItems]);

  var filteredDebts = useMemo(function () {
    var items = allItems;
    if (activeTab !== "all") items = items.filter(function (d) { return debtTabType(d) === activeTab || (d._readOnly && d.type === "crowdfunding"); });
    if (filter !== "all") items = items.filter(function (d) { return d.type === filter; });
    if (search.trim()) { var q = search.trim().toLowerCase(); items = items.filter(function (d) { return (d.name || "").toLowerCase().indexOf(q) !== -1; }); }
    return items;
  }, [allItems, activeTab, filter, search]);

  var filterOptions = useMemo(function () {
    var types = {};
    allItems.forEach(function (d) { var tk = d.type || "bank"; if (DEBT_TYPE_META[tk]) types[tk] = DEBT_TYPE_META[tk]; });
    var opts = [{ value: "all", label: t.filter_all || "Toutes les catégories" }];
    Object.keys(types).forEach(function (tk) { opts.push({ value: tk, label: types[tk].label[lk] }); });
    return opts;
  }, [allItems, lk, t]);

  function addDebt(data) { setDebts(function (prev) { return (prev || []).concat([data]); }); }
  function removeDebt(idx) { setDebts(function (prev) { var nc = prev.slice(); nc.splice(idx, 1); return nc; }); }
  function requestDelete(idx) { if (skipDeleteConfirm) { removeDebt(idx); } else { setPendingDelete(idx); } }
  function bulkDeleteDebts(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setDebts(function (prev) { return prev.filter(function (d) { return !idSet[String(d.id)]; }); });
  }
  function cloneDebt(idx) { setDebts(function (prev) { var nc = prev.slice(); var clone = Object.assign({}, nc[idx], { id: Date.now(), name: nc[idx].name + (t.copy_suffix || " (copie)") }); nc.splice(idx + 1, 0, clone); return nc; }); }
  function saveDebt(idx, data) { setDebts(function (prev) { var nc = prev.slice(); nc[idx] = Object.assign({}, nc[idx], data); return nc; }); }

  function randomizeDebts() {
    var pool = [
      { name: t.random_bank || "Prêt bancaire Belfius", type: "bank", amountMin: 25000, amountMax: 150000, rateMin: 0.02, rateMax: 0.06, durMin: 36, durMax: 84 },
      { name: t.random_credit || "Ligne de crédit BNP", type: "credit", amountMin: 10000, amountMax: 50000, rateMin: 0.04, rateMax: 0.08, durMin: 6, durMax: 24 },
      { name: t.random_leasing || "Leasing véhicule", type: "leasing", amountMin: 15000, amountMax: 40000, rateMin: 0.03, rateMax: 0.06, durMin: 36, durMax: 60 },
      { name: t.random_loan || "Prêt fondateur", type: "loan", amountMin: 10000, amountMax: 50000, rateMin: 0, rateMax: 0.03, durMin: 12, durMax: 48 },
      { name: t.random_subsidy || "Bourse Wallonie", type: "subsidy", amountMin: 5000, amountMax: 25000, rateMin: 0, rateMax: 0, durMin: 1, durMax: 1 },
      { name: t.random_advance || "Avance Innoviris", type: "advance", amountMin: 10000, amountMax: 50000, rateMin: 0, rateMax: 0, durMin: 36, durMax: 72 },
      { name: t.random_convertible || "Note convertible seed", type: "convertible", amountMin: 25000, amountMax: 100000, rateMin: 0, rateMax: 0, durMin: 18, durMax: 36 },
    ];
    function rand(min, max) { return min + Math.random() * (max - min); }
    function roundTo(v, step) { return Math.round(v / step) * step; }
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    var count = 3 + Math.floor(Math.random() * 3);
    var items = [];
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var p = shuffled[i];
      items.push({ id: Date.now() + i, name: p.name, type: p.type, amount: roundTo(rand(p.amountMin, p.amountMax), 1000), rate: Math.round(rand(p.rateMin, p.rateMax) * 1000) / 1000, duration: roundTo(rand(p.durMin, p.durMax), 6), elapsed: p.type === "subsidy" ? 0 : Math.floor(rand(0, 12)) });
    }
    setDebts(items);
  }

  var columns = useMemo(function () {
    return [
      { id: "name", accessorKey: "name", header: t.col_name || "Nom", enableSorting: true, meta: { align: "left", minWidth: 180, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () { return <><span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span><span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{allItems.length} {t.footer_items || "financements"}</span></>; } },
      { id: "type", header: t.col_type || "Type", enableSorting: true, meta: { align: "left" },
        cell: function (info) { var tk = info.row.original.type || "bank"; var found = DEBT_TYPE_META[tk]; if (!found) return tk; return <Badge color={found.badge} size="sm" dot>{found.label[lk]}</Badge>; } },
      { id: "amount", accessorKey: "amount", header: t.col_amount || "Montant", enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalBorrowed)}</span>; } },
      { id: "rate", accessorKey: "rate", header: t.col_rate || "Taux", enableSorting: true, meta: { align: "right" },
        cell: function (info) { return info.getValue() > 0 ? pct(info.getValue()) : "—"; } },
      { id: "monthly", accessorFn: function (row) { return row.monthly || 0; }, header: t.col_monthly || "Mensualité", enableSorting: true, meta: { align: "right" },
        cell: function (info) { return info.getValue() > 0 ? eur(info.getValue()) : "—"; },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalMonthly)}/mois</span>; } },
      { id: "remaining", accessorFn: function (row) { return row.remaining || 0; }, header: t.col_remaining || "Solde", enableSorting: true, meta: { align: "right" },
        cell: function (info) { return info.getValue() > 0 ? eur(info.getValue()) : "—"; },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalRemaining)}</span>; } },
      { id: "actions", header: "", enableSorting: false, meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          if (row._readOnly) {
            return <button type="button" onClick={function () { var dest = row._linkedPage || "crowdfunding"; if (onNavigate) onNavigate(dest); else setTab(dest); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--brand)", fontStyle: "italic", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}><ArrowRight size={12} weight="bold" /> {t.crowdfunding_link || "Crowdfunding"}</button>;
          }
          var idx = info.row.index;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { setEditingDebt({ idx: idx, item: (debts || [])[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Dupliquer"} onClick={function () { cloneDebt(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Supprimer"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        } },
    ];
  }, [lang, lk, allItems, totalBorrowed, totalMonthly, totalRemaining, t, debts]);

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomizeDebts} onClear={function () { setDebts([]); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredDebts} columns={columns} filename="financement" title={t.title || (lang === "fr" ? "Financement" : "Financing")} subtitle={t.subtitle || (lang === "fr" ? "Gérez vos emprunts, crédits et aides." : "Manage your loans, credits and subsidies.")} getPcmn={function (row) { var map = { bank: "1700", credit: "4210", leasing: "1720", loan: "1740", subsidy: "7300", advance: "1750", convertible: "1710", crowdfunding: "1700" }; return map[row.type] || "1700"; }} />
        <Button color="secondary" size="lg" onClick={function () { if (onNavigate) onNavigate("opex"); else setTab("opex"); }} iconLeading={<ArrowRight size={14} weight="bold" />}>{t.charges_btn || "Charges"}</Button>
        <Button color="primary" size="lg" onClick={function () { setShowCreate("bank"); }} iconLeading={<Plus size={14} weight="bold" />}>{t.add || "Ajouter"}</Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bank size={24} weight="duotone" color="var(--text-muted)" /></div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.no_debts || "Aucun financement"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>{t.no_debts_hint || "Ajoutez vos emprunts et aides."}</div>
      <Button color="primary" size="md" onClick={function () { setShowCreate("bank"); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>{t.add || "Ajouter"}</Button>
    </div>
  );

  return (
    <PageLayout title={t.title || "Financement"} subtitle={t.subtitle || "Gérez vos emprunts, crédits et aides."} icon={Bank} iconColor="var(--color-info)">
      {showCreate ? <DebtModal onAdd={addDebt} onClose={function () { setShowCreate(null); setPendingLabel(""); }} lang={lang} initialLabel={pendingLabel} /> : null}
      {editingDebt ? <DebtModal initialData={editingDebt.item} onSave={function (data) { saveDebt(editingDebt.idx, data); }} onClose={function () { setEditingDebt(null); }} lang={lang} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal onConfirm={function () { removeDebt(pendingDelete); setPendingDelete(null); }} onCancel={function () { setPendingDelete(null); }} skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{ confirm_title: t.confirm_delete || "Supprimer ?", confirm_body: t.confirm_delete_body || "Ce financement sera retiré.", confirm_skip: t.confirm_delete_skip || "Ne plus demander", cancel: t.cancel || "Annuler", delete: t.delete || "Supprimer" }}
      /> : null}

      {/* KPIs */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_total || "Capital restant"} value={totalRemaining > 0 ? eurShort(totalRemaining) : "—"} fullValue={totalRemaining > 0 ? eur(totalRemaining) : undefined} glossaryKey="remaining_balance" />
        <KpiCard label={t.kpi_monthly || "Mensualités"} value={totalMonthly > 0 ? eurShort(totalMonthly) : "—"} fullValue={totalMonthly > 0 ? eur(totalMonthly) + "/mois" : undefined} glossaryKey="monthly_payment" />
        <KpiCard label={t.kpi_cost || "Intérêts annuels"} value={annualInterest > 0 ? eurShort(annualInterest) : "—"} fullValue={annualInterest > 0 ? eur(annualInterest) + "/an" : undefined} glossaryKey="annual_interest" />
        <KpiCard label={t.kpi_dscr || "Capacité de remboursement"} value={debts.length > 0 && annualDebtService > 0 ? dscr.toFixed(2) + "x" : "—"} glossaryKey="dscr" />
      </div>

      {/* Insights */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.summary_debt_ratio || "Ratio d'endettement"}</div>
          {capitalSocial > 0 && totalRemaining > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{t.ratio_debt || "Dettes"} / {t.ratio_equity || "Capitaux propres"}</span>
                <span style={{ fontWeight: 700, color: debtRatio < 1 ? "var(--color-success)" : debtRatio < 2 ? "var(--color-warning)" : "var(--color-error)" }}>{debtRatio.toFixed(2)}x</span>
              </div>
              <div style={{ height: 8, background: "var(--bg-hover)", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: Math.min(debtRatio / 3, 1) * 100 + "%", background: debtRatio < 1 ? "var(--color-success)" : debtRatio < 2 ? "var(--color-warning)" : "var(--color-error)", borderRadius: 4, transition: "width 0.3s" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}><span>0x</span><span>1x</span><span>2x</span><span>3x</span></div>
            </>
          ) : <div style={{ fontSize: 13, color: "var(--text-faint)" }}>{t.ratio_empty || "Ajoutez un financement et un capital social."}</div>}
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.section_summary || "Synthèse"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: t.summary_total_borrowed || "Total emprunté", value: eur(totalBorrowed) },
              { label: t.summary_total_remaining || "Capital restant", value: eur(totalRemaining) },
              { label: t.summary_total_interest || "Total intérêts", value: eur(allItems.reduce(function (s, c) { return s + (c.totalInterest || 0); }, 0)) },
              { label: t.summary_annual_cost || "Coût annuel", value: eur(annualInterest), bold: true },
            ].map(function (row, i) {
              return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-1) 0", borderBottom: i < 3 ? "1px solid var(--border-light)" : "none" }}><span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span><span style={{ fontSize: 12, fontWeight: row.bold ? 700 : 500, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span></div>;
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {DEBT_TAB_TYPES.map(function (tabKey) {
          var isActive = activeTab === tabKey;
          var count = tabCounts[tabKey] || 0;
          return (
            <button key={tabKey} type="button" onClick={function () { setActiveTab(tabKey); setFilter("all"); }}
              style={{ padding: "var(--sp-2) var(--sp-4)", border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent", marginBottom: -2, background: "transparent", color: isActive ? "var(--brand)" : "var(--text-muted)", fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s, border-color 0.12s" }}>
              {TAB_LABELS[tabKey]}
              {count > 0 ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, padding: "0 5px", marginLeft: 6, borderRadius: "var(--r-full)", background: isActive ? "var(--brand)" : "var(--bg-hover)", color: isActive ? "white" : "var(--text-muted)", fontSize: 10, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count}</span> : null}
            </button>
          );
        })}
      </div>

      <DataTable data={filteredDebts} columns={columns} toolbar={toolbarNode} emptyState={emptyNode} emptyMinHeight={200} pageSize={10} getRowId={function (row) { return String(row.id); }} selectable onDeleteSelected={bulkDeleteDebts} />
    </PageLayout>
  );
}
