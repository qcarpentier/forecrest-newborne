import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash, Star, CaretDown,
  ShoppingCart, Users, Briefcase, Clock, Sparkle,
  ArrowsClockwise, TrendUp, MagnifyingGlass, FunnelSimple,
  PencilSimple, Copy,
} from "@phosphor-icons/react";
import { PageLayout, ExplainerBox, Badge, KpiCard, Button, DataTable, ButtonUtility } from "../components";
import CurrencyInput from "../components/CurrencyInput";
import { eur } from "../utils";
import { calcStreamMonthly, calcStreamAnnual, getDriverLabel, getPriceLabel } from "../utils/revenueCalc";
import { useT, useLang } from "../context";
import { REVENUE_BEHAVIOR_TEMPLATES } from "../constants/defaults";

function makeId() {
  return "r" + Math.random().toString(36).slice(2, 8);
}

var BEHAVIOR_META = {
  recurring: {
    icon: ArrowsClockwise, badge: "brand",
    label: { fr: "Récurrent", en: "Recurring" },
    desc: { fr: "Revenu mensuel fixe par client - abonnement, licence, retainer, maintenance.", en: "Fixed monthly revenue per client - subscription, license, retainer, maintenance." },
    example: { fr: "49 €/mois × 100 clients = 4 900 €/mois", en: "€49/mo × 100 clients = €4,900/mo" },
  },
  per_transaction: {
    icon: ShoppingCart, badge: "success",
    label: { fr: "Par transaction", en: "Per transaction" },
    desc: { fr: "Montant gagné à chaque vente ou commande réalisée.", en: "Amount earned per sale or order completed." },
    example: { fr: "35 € × 200 commandes/mois = 7 000 €/mois", en: "€35 × 200 orders/mo = €7,000/mo" },
  },
  per_user: {
    icon: Users, badge: "info",
    label: { fr: "Par utilisateur", en: "Per user" },
    desc: { fr: "Tarif par utilisateur actif, siège ou compte.", en: "Price per active user, seat or account." },
    example: { fr: "9 €/user × 500 users = 4 500 €/mois", en: "€9/user × 500 users = €4,500/mo" },
  },
  project: {
    icon: Briefcase, badge: "warning",
    label: { fr: "Par projet", en: "Per project" },
    desc: { fr: "Montant par mission, contrat ou projet réalisé sur l'année.", en: "Amount per mission, contract or project delivered annually." },
    example: { fr: "5 000 € × 12 projets/an = 60 000 €/an", en: "€5,000 × 12 projects/yr = €60,000/yr" },
  },
  daily_rate: {
    icon: Clock, badge: "warning",
    label: { fr: "Taux journalier", en: "Daily rate" },
    desc: { fr: "Tarif par jour de travail facturé sur l'année.", en: "Rate per billable day over the year." },
    example: { fr: "500 €/jour × 180 jours = 90 000 €/an", en: "€500/day × 180 days = €90,000/yr" },
  },
  one_time: {
    icon: Sparkle, badge: "gray",
    label: { fr: "Ponctuel", en: "One-time" },
    desc: { fr: "Montant unique - frais de setup, subside, vente exceptionnelle.", en: "One-off amount - setup fee, grant, exceptional sale." },
    example: { fr: "500 € × 10 = 5 000 € (total)", en: "€500 × 10 = €5,000 (total)" },
  },
};

var PRIMARY_BEHAVIOR = {
  saas: "recurring", ecommerce: "per_transaction", retail: "per_transaction",
  services: "project", freelancer: "daily_rate", other: "recurring",
};

var BEHAVIORS = Object.keys(BEHAVIOR_META);

/* ── Split-panel Creation / Edit Modal ── */
function StreamModal({ onAdd, onSave, onClose, businessType, lang, initialData }) {
  var isEdit = !!initialData;
  var primary = PRIMARY_BEHAVIOR[businessType] || "recurring";
  var [selected, setSelected] = useState(isEdit ? initialData.behavior : primary);
  var [name, setName] = useState(isEdit ? initialData.l : "");
  var [price, setPrice] = useState(isEdit ? (initialData.price || 0) : 0);
  var [qty, setQty] = useState(isEdit ? (initialData.qty || 0) : 0);

  var suggestions = (REVENUE_BEHAVIOR_TEMPLATES[businessType] || REVENUE_BEHAVIOR_TEMPLATES.other || []).filter(function (tpl) {
    return tpl.behavior === selected;
  });

  function handleSelect(b) {
    setSelected(b);
    if (!isEdit) {
      setName("");
      setPrice(0);
      setQty(0);
    }
  }

  function handleSuggestion(tpl) {
    setName(tpl.l);
    setPrice(tpl.price);
  }

  function handleSubmit() {
    var data = {
      id: isEdit ? initialData.id : makeId(),
      l: name || BEHAVIOR_META[selected].label[lang === "en" ? "en" : "fr"],
      behavior: selected,
      price: price,
      qty: qty,
      growthRate: isEdit ? (initialData.growthRate || 0) : 0,
    };
    if (isEdit && onSave) {
      onSave(data);
    } else if (onAdd) {
      onAdd(data);
    }
    onClose();
  }

  var meta = BEHAVIOR_META[selected];
  var Icon = meta.icon;
  var monthly = calcStreamMonthly({ behavior: selected, price: price, qty: qty });
  var annual = calcStreamAnnual({ behavior: selected, price: price, qty: qty });

  return createPortal(
    <div onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "var(--overlay-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-modal)",
        width: 640, maxWidth: "94vw", height: 460, maxHeight: "85vh",
        display: "flex", overflow: "hidden",
        animation: "tooltipIn 0.15s ease",
      }}>
        {/* LEFT - Behavior list */}
        <div style={{
          width: 220, flexShrink: 0, borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {lang === "fr" ? "Type de revenu" : "Revenue type"}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)" }}>
            {BEHAVIORS.map(function (b) {
              var m = BEHAVIOR_META[b];
              var BIcon = m.icon;
              var isActive = selected === b;
              var isPrimary = b === primary;
              return (
                <button key={b} onClick={function () { handleSelect(b); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    width: "100%", padding: "10px var(--sp-3)",
                    border: "none", borderRadius: "var(--r-md)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    cursor: "pointer", textAlign: "left", marginBottom: 2,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <BIcon size={16} weight={isActive ? "fill" : "regular"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)", flex: 1 }}>
                    {m.label[lang === "en" ? "en" : "fr"]}
                  </span>
                  {isPrimary ? <Star size={11} weight="fill" color="var(--brand)" style={{ opacity: 0.5, flexShrink: 0 }} /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT - Config panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                {meta.label[lang === "en" ? "en" : "fr"]}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>
                {meta.desc[lang === "en" ? "en" : "fr"]}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: "var(--sp-5)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", borderLeft: "2px solid var(--border-strong)" }}>
              {meta.example[lang === "en" ? "en" : "fr"]}
            </div>

            {suggestions.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-1)" }}>
                  {lang === "fr" ? "Suggestions" : "Suggestions"}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {suggestions.map(function (tpl) {
                    var isActive = name === tpl.l;
                    return (
                      <button key={tpl.l} onClick={function () { handleSuggestion(tpl); }}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--r-full)",
                          border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                          background: isActive ? "var(--brand-bg)" : "transparent",
                          color: isActive ? "var(--brand)" : "var(--text-secondary)",
                          fontSize: 12, fontWeight: 500, cursor: "pointer",
                          transition: "all 0.1s",
                        }}
                      >
                        {tpl.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                {lang === "fr" ? "Nom de la source" : "Source name"}
              </label>
              <input value={name} onChange={function (e) { setName(e.target.value); }}
                placeholder={meta.label[lang === "en" ? "en" : "fr"]}
                autoFocus
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                  {lang === "fr" ? "Prix unitaire" : "Unit price"}
                </label>
                <CurrencyInput value={price} onChange={function (v) { setPrice(v); }} suffix={getPriceLabel(selected, lang)} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                  {getDriverLabel(selected, lang)}
                </label>
                <input type="number" value={qty || ""} min={0}
                  onChange={function (e) { setQty(Number(e.target.value) || 0); }}
                  placeholder="0"
                  style={{ width: "100%", height: 32, padding: "0 var(--sp-3)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "right" }}
                />
              </div>
            </div>

            {price > 0 && qty > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "fr" ? "Estimation" : "Estimate"}</span>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(monthly)}/m</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "var(--sp-2)" }}>{eur(annual)}/an</span>
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ padding: "var(--sp-3) var(--sp-5)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "var(--sp-2)" }}>
            <Button color="tertiary" size="md" onClick={onClose}>
              {lang === "fr" ? "Fermer" : "Close"}
            </Button>
            <Button color="primary" size="md" onClick={handleSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (lang === "fr" ? "Enregistrer" : "Save") : (lang === "fr" ? "Ajouter" : "Add")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Editable name cell ── */
function NameCell({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={function (e) { onChange(e.target.value); }}
      placeholder={placeholder}
      style={{
        width: "100%", minWidth: 120,
        fontSize: 13, fontWeight: 500,
        border: "none", outline: "none",
        background: "transparent",
        color: "var(--text-primary)",
        fontFamily: "inherit",
        padding: 0,
      }}
    />
  );
}

/* ── Editable qty cell ── */
function QtyCell({ value, onChange }) {
  return (
    <input
      type="number" value={value || ""} min={0}
      onChange={function (e) { onChange(Number(e.target.value) || 0); }}
      placeholder="0"
      style={{
        width: 64, height: 30, textAlign: "right",
        padding: "0 var(--sp-2)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
        background: "var(--input-bg)",
        color: "var(--text-primary)",
        fontSize: 13, fontFamily: "inherit", outline: "none",
      }}
    />
  );
}

/* ── Custom filter dropdown ── */
function FilterDropdown({ value, onChange, options }) {
  var [open, setOpen] = useState(false);
  var activeLabel = "";
  options.forEach(function (o) { if (o.value === value) activeLabel = o.label; });
  var isFiltered = value !== "all";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={function () { setOpen(function (v) { return !v; }); }}
        style={{
          height: 40,
          padding: "0 var(--sp-3)",
          paddingRight: 32,
          border: "1px solid " + (isFiltered ? "var(--brand)" : "var(--border)"),
          borderRadius: "var(--r-md)",
          background: isFiltered ? "var(--brand-bg)" : "var(--bg-card)",
          color: isFiltered ? "var(--brand)" : "var(--text-secondary)",
          fontSize: 13, fontWeight: 500, fontFamily: "inherit",
          cursor: "pointer", outline: "none",
          display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
          transition: "border-color 0.12s, background 0.12s",
          whiteSpace: "nowrap",
        }}
      >
        <FunnelSimple size={16} weight="bold" />
        {activeLabel}
        <CaretDown size={12} weight="bold" style={{ position: "absolute", right: 10, opacity: 0.5 }} />
      </button>

      {open ? (
        <>
          <div onClick={function () { setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 51,
            minWidth: 180,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
            padding: "var(--sp-1)",
            animation: "tooltipIn 0.1s ease",
          }}>
            {options.map(function (opt) {
              var isActive = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={function () { onChange(opt.value); setOpen(false); }}
                  onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { if (!isActive) e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    width: "100%", padding: "8px var(--sp-3)",
                    border: "none", borderRadius: "var(--r-sm)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ── Search input ── */
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <MagnifyingGlass size={16} weight="bold" style={{
        position: "absolute", left: 12, pointerEvents: "none",
        color: "var(--text-muted)",
      }} />
      <input
        type="text"
        value={value}
        onChange={function (e) { onChange(e.target.value); }}
        placeholder={placeholder}
        style={{
          height: 40, width: 200,
          paddingLeft: 34, paddingRight: "var(--sp-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          fontSize: 13, fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.12s",
        }}
        onFocus={function (e) { e.currentTarget.style.borderColor = "var(--brand)"; }}
        onBlur={function (e) { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}

/* ── Button group (Untitled UI pattern) ── */
function ActionGroup({ children }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0,
    }}>
      {children}
    </div>
  );
}

function ActionBtn({ icon, title, onClick, variant }) {
  var [hov, setHov] = useState(false);
  var isDanger = variant === "danger";
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
      style={{
        width: 32, height: 32,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: 0, border: "none",
        borderRadius: "var(--r-md)",
        background: hov ? (isDanger ? "var(--color-error-bg)" : "var(--bg-hover)") : "transparent",
        color: hov ? (isDanger ? "var(--color-error)" : "var(--text-primary)") : "var(--text-muted)",
        cursor: "pointer",
        transition: "background 0.12s, color 0.12s",
      }}
    >
      {icon}
    </button>
  );
}

/* ── Main Page ── */
export default function RevenueStreamsPage({ streams, setStreams, annC, businessType }) {
  var { lang } = useLang();
  var t = useT().revenue || {};
  var [showCreate, setShowCreate] = useState(false);
  var [editingStream, setEditingStream] = useState(null);
  var [filter, setFilter] = useState("all");
  var [search, setSearch] = useState("");

  /* flatten streams for table */
  var flatItems = useMemo(function () {
    var items = [];
    (streams || []).forEach(function (cat, ci) {
      (cat.items || []).forEach(function (item, ii) {
        items.push(Object.assign({}, item, { _ci: ci, _ii: ii }));
      });
    });
    return items;
  }, [streams]);

  /* filtered items */
  var filteredItems = useMemo(function () {
    var items = flatItems;
    if (filter !== "all") {
      items = items.filter(function (item) { return item.behavior === filter; });
    }
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      items = items.filter(function (item) { return (item.l || "").toLowerCase().indexOf(q) !== -1; });
    }
    return items;
  }, [flatItems, filter, search]);

  /* behavior counts for filter pills */
  var behaviorCounts = useMemo(function () {
    var counts = {};
    flatItems.forEach(function (item) {
      counts[item.behavior] = (counts[item.behavior] || 0) + 1;
    });
    return counts;
  }, [flatItems]);

  /* totals */
  var totals = useMemo(function () {
    var mrr = 0, arr = 0, count = 0;
    flatItems.forEach(function (item) {
      mrr += calcStreamMonthly(item);
      arr += calcStreamAnnual(item);
      if ((item.price || 0) > 0 && (item.qty || 0) > 0) count++;
    });
    return { mrr: mrr, arr: arr, count: count };
  }, [flatItems]);

  /* filtered totals */
  var filteredTotals = useMemo(function () {
    var mrr = 0, arr = 0;
    filteredItems.forEach(function (item) {
      mrr += calcStreamMonthly(item);
      arr += calcStreamAnnual(item);
    });
    return { mrr: mrr, arr: arr };
  }, [filteredItems]);

  function addStream(newItem) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      if (nc.length === 0) nc.push({ cat: "Revenus", items: [] });
      nc[0].items.push(newItem);
      return nc;
    });
  }

  function updateItem(ci, ii, field, value) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items[ii][field] = value;
      return nc;
    });
  }

  function removeItem(ci, ii) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items.splice(ii, 1);
      if (nc[ci].items.length === 0) nc.splice(ci, 1);
      return nc;
    });
  }

  function cloneItem(ci, ii) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      var original = nc[ci].items[ii];
      var clone = Object.assign({}, original, { id: makeId(), l: original.l + (lang === "fr" ? " (copie)" : " (copy)") });
      nc[ci].items.splice(ii + 1, 0, clone);
      return nc;
    });
  }

  function saveItem(ci, ii, data) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items[ii] = Object.assign({}, nc[ci].items[ii], data);
      return nc;
    });
  }

  var lk = lang === "en" ? "en" : "fr";

  /* ── column definitions ── */
  var columns = useMemo(function () {
    return [
      {
        id: "name",
        accessorKey: "l",
        header: lang === "fr" ? "Source" : "Source",
        enableSorting: true,
        meta: { align: "left", minWidth: 160 },
        cell: function (info) {
          var row = info.row.original;
          return (
            <NameCell
              value={row.l}
              onChange={function (v) { updateItem(row._ci, row._ii, "l", v); }}
              placeholder={lang === "fr" ? "Nom du revenu" : "Revenue name"}
            />
          );
        },
        footer: function () {
          return (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {filter === "all" ? "Total" : BEHAVIOR_META[filter].label[lk]}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: "var(--sp-2)" }}>
                {filteredItems.length} {filteredItems.length === 1 ? "source" : "sources"}
              </span>
            </span>
          );
        },
      },
      {
        id: "behavior",
        accessorKey: "behavior",
        header: lang === "fr" ? "Type" : "Type",
        enableSorting: true,
        meta: { align: "left", width: 130 },
        cell: function (info) {
          var m = BEHAVIOR_META[info.getValue()] || BEHAVIOR_META.recurring;
          return <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge>;
        },
      },
      {
        id: "price",
        accessorKey: "price",
        header: lang === "fr" ? "Prix unitaire" : "Unit price",
        enableSorting: true,
        meta: { align: "right", width: 140 },
        cell: function (info) {
          var row = info.row.original;
          return (
            <CurrencyInput
              value={row.price || 0}
              onChange={function (v) { updateItem(row._ci, row._ii, "price", v); }}
              suffix={getPriceLabel(row.behavior, lang)}
              width="120px"
            />
          );
        },
      },
      {
        id: "qty",
        accessorKey: "qty",
        header: lang === "fr" ? "Volume" : "Volume",
        enableSorting: true,
        meta: { align: "right", width: 100 },
        cell: function (info) {
          var row = info.row.original;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", justifyContent: "flex-end" }}>
              <QtyCell
                value={row.qty}
                onChange={function (v) { updateItem(row._ci, row._ii, "qty", v); }}
              />
              <span style={{ fontSize: 10, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                {getDriverLabel(row.behavior, lang)}
              </span>
            </div>
          );
        },
      },
      {
        id: "monthly",
        accessorFn: function (row) { return calcStreamMonthly(row); },
        header: lang === "fr" ? "Mensuel" : "Monthly",
        enableSorting: true,
        meta: { align: "right", width: 110 },
        cell: function (info) {
          var v = info.getValue();
          return (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: v > 0 ? "var(--brand)" : "var(--text-ghost)",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            }}>
              {eur(v)}
            </span>
          );
        },
        footer: function () {
          return (
            <span style={{
              fontSize: 15, fontWeight: 700, color: "var(--brand)",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
              fontVariantNumeric: "tabular-nums",
            }}>
              {eur(filteredTotals.mrr)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-faint)" }}>/m</span>
            </span>
          );
        },
      },
      {
        id: "annual",
        accessorFn: function (row) { return calcStreamAnnual(row); },
        header: lang === "fr" ? "Annuel" : "Annual",
        enableSorting: true,
        meta: { align: "right", width: 110 },
        cell: function (info) {
          var v = info.getValue();
          return (
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: v > 0 ? "var(--text-secondary)" : "var(--text-ghost)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {eur(v)}
            </span>
          );
        },
        footer: function () {
          return (
            <span style={{
              fontSize: 13, fontWeight: 500, color: "var(--text-muted)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {eur(filteredTotals.arr)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-faint)" }}>/an</span>
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { align: "center", width: 100 },
        cell: function (info) {
          var row = info.row.original;
          return (
            <ActionGroup>
              <ActionBtn
                icon={<PencilSimple size={14} />}
                title={lang === "fr" ? "Modifier" : "Edit"}
                onClick={function () { setEditingStream({ ci: row._ci, ii: row._ii, item: row }); }}
              />
              <ActionBtn
                icon={<Copy size={14} />}
                title={lang === "fr" ? "Dupliquer" : "Clone"}
                onClick={function () { cloneItem(row._ci, row._ii); }}
              />
              <ActionBtn
                icon={<Trash size={14} />}
                title={lang === "fr" ? "Supprimer" : "Delete"}
                variant="danger"
                onClick={function () { removeItem(row._ci, row._ii); }}
              />
            </ActionGroup>
          );
        },
      },
    ];
  }, [lang, lk, filteredTotals, filteredItems.length, filter]);

  /* ── active behavior types for filter ── */
  var activeBehaviors = useMemo(function () {
    return BEHAVIORS.filter(function (b) { return behaviorCounts[b] > 0; });
  }, [behaviorCounts]);

  var breakEvenStatus = annC > 0 && totals.arr > 0
    ? (totals.arr >= annC ? "positive" : "negative") : "neutral";

  /* ── dropdown options ── */
  var filterOptions = useMemo(function () {
    var opts = [{ value: "all", label: lang === "fr" ? "Tous les types" : "All types" }];
    BEHAVIORS.forEach(function (b) {
      if (behaviorCounts[b] > 0) {
        opts.push({ value: b, label: BEHAVIOR_META[b].label[lk] });
      }
    });
    return opts;
  }, [behaviorCounts, lang, lk]);

  /* ── toolbar ── */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={lang === "fr" ? "Rechercher..." : "Search..."}
        />
        <FilterDropdown
          value={filter}
          onChange={setFilter}
          options={filterOptions}
        />
      </div>
      <Button color="primary" size="lg" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
        {lang === "fr" ? "Ajouter" : "Add"}
      </Button>
    </>
  );

  /* ── empty state ── */
  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "var(--r-lg)",
        background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <TrendUp size={24} weight="duotone" color="var(--brand)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
        {lang === "fr" ? "Aucune source de revenu" : "No revenue sources"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {lang === "fr"
          ? "Ajoutez votre première source de revenu pour alimenter vos projections financières."
          : "Add your first revenue source to feed your financial projections."}
      </div>
      <Button color="primary" size="md" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {lang === "fr" ? "Ajouter une source" : "Add a source"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.title || (lang === "fr" ? "Sources de revenus" : "Revenue Sources")}
      subtitle={t.subtitle || (lang === "fr" ? "Définissez comment votre entreprise gagne de l'argent." : "Define how your business makes money.")}
    >
      {showCreate ? <StreamModal onAdd={addStream} onClose={function () { setShowCreate(false); }} businessType={businessType || "other"} lang={lang} /> : null}

      {editingStream ? <StreamModal
        initialData={editingStream.item}
        onSave={function (data) { saveItem(editingStream.ci, editingStream.ii, data); }}
        onClose={function () { setEditingStream(null); }}
        businessType={businessType || "other"}
        lang={lang}
      /> : null}

      <ExplainerBox variant="info" title={t.explainer_title || (lang === "fr" ? "Comment ça marche ?" : "How does it work?")}>
        {t.explainer_body || (lang === "fr"
          ? "Ajoutez vos sources de revenus (abonnements, ventes, projets...), indiquez le prix et le volume. Le total alimente automatiquement vos projections."
          : "Add your revenue sources (subscriptions, sales, projects...), set the price and volume. The total automatically feeds your projections.")}
      </ExplainerBox>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label="MRR" value={eur(totals.mrr)} color="var(--brand)" />
        <KpiCard label={lang === "fr" ? "CA annuel" : "Annual revenue"} value={eur(totals.arr)} />
        <KpiCard label={lang === "fr" ? "Sources actives" : "Active sources"} value={String(totals.count)} />
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={240}
        pageSize={10}
        dimRow={function (row) { return !row.price || !row.qty; }}
        getRowId={function (row) { return row.id || (row._ci + "-" + row._ii); }}
      />

      {annC > 0 ? (
        <div style={{
          marginTop: "var(--gap-md)",
          padding: "var(--sp-3) var(--sp-4)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          background: "var(--bg-card)",
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: breakEvenStatus === "positive" ? "var(--color-success)" : breakEvenStatus === "negative" ? "var(--color-error)" : "var(--text-ghost)" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {breakEvenStatus === "positive" ? (lang === "fr" ? "Revenus > charges" : "Revenue > costs") : (lang === "fr" ? "Revenus < charges" : "Revenue < costs")}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{eur(totals.arr) + " vs " + eur(annC)}</div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
