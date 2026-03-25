import { useMemo, useState, useEffect } from "react";
import {
  Plus, Trash, PencilSimple, Copy,
  Users, UsersThree, Crown, Star, ArrowRight,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SearchInput, FilterDropdown, PaletteToggle, Card, NumberField, ExportButtons, DevOptionsButton, Modal, ModalFooter } from "../components";
import { eur, eurShort, nm, grantCalc } from "../utils";
import { useT, useLang, useDevMode } from "../context";

/* ── Share class metadata ── */
var CLASS_META = {
  common:    { icon: Users,     badge: "brand",   pcmn: "1000", label: { fr: "Ordinaires", en: "Common" }, desc: { fr: "Actions avec droit de vote simple et dividende proportionnel.", en: "Shares with standard voting and proportional dividend rights." }, placeholder: { fr: "ex. Fondateur", en: "e.g. Founder" } },
  preferred: { icon: Crown,     badge: "warning", pcmn: "1000", label: { fr: "Préférentielles", en: "Preferred" }, desc: { fr: "Actions avec droits prioritaires (dividende, liquidation).", en: "Shares with priority rights (dividend, liquidation)." }, placeholder: { fr: "ex. Investisseur série A", en: "e.g. Series A investor" } },
  esop:      { icon: Star,      badge: "info",    pcmn: "1000", label: { fr: "Parts réservées à l'équipe", en: "Team equity pool" }, desc: { fr: "Actions réservées aux employés dans le cadre du plan d'intéressement (bons de souscription ou options sur actions).", en: "Shares reserved for employees as part of the incentive plan (subscription warrants or stock options)." }, placeholder: { fr: "ex. Employé clé", en: "e.g. Key employee" } },
};
var CLASS_KEYS = Object.keys(CLASS_META);

var EXPLAIN_KEYS = ["capital", "classes", "dilution", "premoney", "preference", "fullydiluted"];

/* ── Shareholder Modal (split-panel) ── */
function ShareholderModal({ item, onSave, onClose, lang, nominalPrice }) {
  var t = useT().captable || {};
  var isEdit = !!item;
  var lk = lang === "en" ? "en" : "fr";

  var [selected, setSelected] = useState(isEdit ? (item.cl || "common") : "common");
  var [name, setName] = useState(isEdit ? (item.name || "") : "");
  var [shares, setShares] = useState(isEdit ? (item.shares || 1000) : 1000);
  var [price, setPrice] = useState(isEdit ? (item.price || nominalPrice || 2) : (nominalPrice || 2));

  var isLinked = isEdit && item && item.fromSalary != null;
  var availableClasses = CLASS_KEYS.filter(function (k) {
    if (k === "esop") return false;
    if (isLinked && k === "preferred") return false;
    return true;
  });

  var meta = CLASS_META[selected] || CLASS_META.common;
  var Icon = meta.icon;

  function handleSelect(clKey) {
    setSelected(clKey);
    if (!isEdit) { setName(""); setShares(1000); setPrice(nominalPrice || 2); }
  }

  function handleSubmit() {
    onSave({ name: name || meta.label[lk], cl: selected, shares: shares, price: price });
    onClose();
  }

  var canSubmit = name.trim().length > 0 && shares > 0;
  var totalValue = shares * price;

  return (
    <Modal open onClose={onClose} size="lg" height={440} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Left panel — class list */}
        <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {t.modal_class || "Classe d'actions"}
            </div>
          </div>
          <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            {availableClasses.map(function (clKey) {
              var m = CLASS_META[clKey];
              var CIcon = m.icon;
              var isActive = selected === clKey;
              return (
                <button key={clKey} type="button" onClick={function () { handleSelect(clKey); }}
                  style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", width: "100%", padding: "10px var(--sp-3)", border: "none", borderRadius: "var(--r-md)", background: isActive ? "var(--brand-bg)" : "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2, transition: "background 0.1s", fontFamily: "inherit" }}
                  onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                >
                  <CIcon size={16} weight={isActive ? "fill" : "regular"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)", flex: 1 }}>{m.label[lk]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — form */}
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
                {t.field_name || "Nom de l'actionnaire"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} autoFocus={!isLinked} disabled={isLinked} placeholder={meta.placeholder[lk]}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: isLinked ? "var(--bg-accordion)" : "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", opacity: isLinked ? 0.7 : 1 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_shares || "Nombre d'actions"}</label>
                <NumberField value={shares} onChange={setShares} min={1} max={100000000} step={100} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_price || "Prix par action"}</label>
                <NumberField value={price} onChange={setPrice} min={0} max={100000} step={0.01} width="100%" suf="€" />
              </div>
            </div>
            {/* Summary card */}
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_total_value || "Valeur totale"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(totalValue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_class_label || "Classe"}</span>
                <Badge color={meta.badge} size="sm" dot>{meta.label[lk]}</Badge>
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

/* ── SVG Donut ── */
function CapDonut({ data, palette }) {
  var total = 0;
  var entries = [];
  Object.keys(data).forEach(function (k) { total += data[k]; entries.push({ key: k, value: data[k] }); });
  var size = 80, r = 30, cx = 40, cy = 40, sw = 10;
  var circ = 2 * Math.PI * r;
  if (total <= 0) return <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }} role="img" aria-hidden="true"><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={sw} opacity={0.6} /></svg>;
  var segs = entries.reduce(function (acc, e) {
    var prev = acc.length > 0 ? acc[acc.length - 1].end : 0;
    var pctV = e.value / total;
    acc.push({ key: e.key, pct: pctV, start: prev, end: prev + pctV });
    return acc;
  }, []);
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }} role="img" aria-hidden="true">
      {segs.map(function (s, si) {
        return <circle key={s.key} cx={cx} cy={cy} r={r} fill="none" stroke={(palette || [])[si % (palette || []).length] || "var(--text-muted)"} strokeWidth={sw} strokeDasharray={(s.pct * circ) + " " + (circ - s.pct * circ)} strokeDashoffset={-s.start * circ} transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray 0.3s" }} />;
      })}
    </svg>
  );
}

/* ── Main Page ── */
export default function CapTablePage({ shareholders, setShareholders, roundSim, setRoundSim, grants, sals, cfg, setCfg, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, setTab, onNavigate, esopEnabled, poolSize }) {
  var t = useT().captable || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var { devMode } = useDevMode();

  var [showRound, setShowRound] = useState(false);
  var [showExplain, setShowExplain] = useState(false);
  var [showCreate, setShowCreate] = useState(false);
  var [editing, setEditing] = useState(null);
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");

  /* ── ESOP data from grants ── */
  var esopData = useMemo(function () {
    if (!grants || !grants.length) return { vested: 0, granted: 0, strikeValue: 0 };
    var vested = 0, granted = 0, strikeValue = 0;
    grants.forEach(function (g) {
      var c = grantCalc(g);
      vested += c.vestedShares;
      granted += g.shares;
      strikeValue += c.vestedShares * g.strike;
    });
    return { vested: vested, granted: granted, strikeValue: strikeValue };
  }, [grants]);

  var esopVested = esopData.vested;
  var esopGranted = esopData.granted;

  /* ── Core metrics ── */
  var totalShares = shareholders.reduce(function (s, sh) { return s + sh.shares; }, 0);
  var fullyDiluted = totalShares + esopGranted;
  var totalCapital = shareholders.reduce(function (s, sh) { return s + sh.shares * sh.price; }, 0);
  var nominalPrice = totalShares > 0 ? totalCapital / totalShares : 0;
  var pricePerShare = roundSim.preMoney > 0 && totalShares > 0 ? roundSim.preMoney / totalShares : 0;

  // Sync capitalSocial in settings when shareholders change
  useEffect(function () {
    if (cfg && setCfg && totalCapital > 0 && Math.abs(totalCapital - cfg.capitalSocial) > 0.01) {
      setCfg(function (prev) { return Object.assign({}, prev, { capitalSocial: totalCapital }); });
    }
  }, [totalCapital]);

  // Auto-create / update / remove ESOP pool row based on equity module state
  useEffect(function () {
    if (!setShareholders) return;
    var hasEsopRow = shareholders.some(function (sh) { return sh._esopPool; });

    if (esopEnabled && poolSize > 0) {
      if (!hasEsopRow) {
        // Auto-create ESOP pool row
        setShareholders(function (prev) {
          return prev.concat([{
            id: "_esop_pool",
            name: t.esop_pool_row || "Parts réservées à l'équipe",
            cl: "esop",
            shares: poolSize,
            price: 0,
            _esopPool: true,
            _readOnly: true,
            _linkedPage: "equity",
          }]);
        });
      } else {
        // Update existing ESOP row shares to match poolSize
        var needsUpdate = shareholders.some(function (sh) { return sh._esopPool && sh.shares !== poolSize; });
        if (needsUpdate) {
          setShareholders(function (prev) {
            return prev.map(function (sh) {
              if (!sh._esopPool) return sh;
              return Object.assign({}, sh, { shares: poolSize, name: t.esop_pool_row || sh.name });
            });
          });
        }
      }
    } else if (!esopEnabled && hasEsopRow) {
      // Remove ESOP pool row when module is disabled
      setShareholders(function (prev) {
        return prev.filter(function (sh) { return !sh._esopPool; });
      });
    }
  }, [esopEnabled, poolSize, shareholders, t]);

  // Round simulator
  var newShares = pricePerShare > 0 ? Math.round(roundSim.raise / pricePerShare) : 0;
  var postMoney = roundSim.preMoney + roundSim.raise;
  var investorPct = postMoney > 0 ? roundSim.raise / postMoney : 0;
  var postTotal = totalShares + newShares;

  /* ── CRUD ── */
  var items = shareholders || [];

  function addItem(data) {
    var newId = items.length ? Math.max.apply(null, items.map(function (s) { return s.id; })) + 1 : 0;
    setShareholders(items.concat([Object.assign({ id: newId, date: new Date().toISOString().slice(0, 10), fromSalary: null }, data)]));
  }

  function saveItem(idx, data) {
    var ns = JSON.parse(JSON.stringify(items));
    Object.assign(ns[idx], data);
    setShareholders(ns);
  }

  function requestDelete(idx) {
    if (skipDeleteConfirm) {
      var sh = items[idx];
      if (sh && sh.fromSalary != null) {
        if (!window.confirm(t.synced_delete_warning || "Cet actionnaire est lié à un rôle dans les Rémunérations. Souhaitez-vous supprimer cette entrée ?")) return;
      }
      setShareholders(items.filter(function (_, j) { return j !== idx; }));
    } else {
      setPendingDelete(idx);
    }
  }

  function confirmDelete() {
    if (pendingDelete === null) return;
    var sh = items[pendingDelete];
    if (sh && sh.fromSalary != null) {
      if (!window.confirm(t.synced_delete_warning || "Cet actionnaire est lié à un rôle dans les Rémunérations. Souhaitez-vous supprimer cette entrée ?")) {
        setPendingDelete(null);
        return;
      }
    }
    setShareholders(items.filter(function (_, j) { return j !== pendingDelete; }));
    setPendingDelete(null);
  }

  function bulkDeleteShareholders(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setShareholders(function (prev) { return prev.filter(function (sh) { return !idSet[String(sh.id)]; }); });
  }

  function cloneItem(idx) {
    var clone = Object.assign({}, items[idx], {
      id: items.length ? Math.max.apply(null, items.map(function (s) { return s.id; })) + 1 : 0,
      name: items[idx].name + (t.copy_suffix || " (copie)"),
      fromSalary: null,
    });
    var ns = items.slice();
    ns.splice(idx + 1, 0, clone);
    setShareholders(ns);
  }

  /* ── Shareholder distribution (for per-person donut) ── */
  var shareholderDistribution = useMemo(function () {
    var dist = {};
    items.forEach(function (sh) {
      dist[sh.name || "?"] = (dist[sh.name || "?"] || 0) + sh.shares;
    });
    if (esopGranted > 0) {
      dist[t.esop_pool_row || "Pool ESOP"] = esopGranted;
    }
    return dist;
  }, [items, esopGranted, t]);

  /* ── Filter options ── */
  var filterOptions = useMemo(function () {
    var cls = {};
    items.forEach(function (sh) { var ck = sh.cl || "common"; if (CLASS_META[ck]) cls[ck] = true; });
    var opts = [{ value: "all", label: t.filter_all || "Tous les actionnaires" }];
    Object.keys(cls).forEach(function (ck) { opts.push({ value: ck, label: CLASS_META[ck].label[lk] }); });
    return opts;
  }, [items, lk, t]);

  var filteredItems = useMemo(function () {
    var list = items;
    if (filter !== "all") list = list.filter(function (sh) { return (sh.cl || "common") === filter; });
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      list = list.filter(function (sh) { return (sh.name || "").toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }, [items, filter, search]);

  /* ── DataTable columns ── */
  var columns = useMemo(function () {
    var cols = [
      {
        id: "name", accessorKey: "name",
        header: t.col_name || "Actionnaire",
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        cell: function (info) {
          var sh = info.row.original;
          if (sh._esopPool) {
            return info.getValue() || "—";
          }
          return info.getValue() || "—";
        },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{items.length} {t.footer_shareholders || "actionnaires"}</span>
            </>
          );
        },
      },
      {
        id: "class",
        header: t.col_class || "Classe",
        enableSorting: true, meta: { align: "left" },
        accessorFn: function (row) { return row.cl || "common"; },
        cell: function (info) {
          var cl = info.getValue();
          var m = CLASS_META[cl];
          return m ? <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge> : cl;
        },
      },
      {
        id: "shares", accessorKey: "shares",
        header: t.col_shares || "Actions",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return nm(info.getValue() || 0); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{nm(totalShares)}</span>; },
      },
      {
        id: "price", accessorKey: "price",
        header: t.col_price || "Prix/action",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue() || 0); },
      },
      {
        id: "pct",
        header: t.col_pct || "% capital",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return totalShares > 0 ? row.shares / totalShares : 0; },
        cell: function (info) {
          var v = info.getValue();
          return <span style={{ fontWeight: 600 }}>{(v * 100).toFixed(1)}%</span>;
        },
      },
      {
        id: "value",
        header: showRound ? (t.col_value || "Valuation (pre)") : (t.col_capital_value || "Valeur"),
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return showRound ? pricePerShare * row.shares : row.shares * row.price; },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(showRound ? pricePerShare * totalShares : totalCapital)}</span>; },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = items.indexOf(info.row.original);
          if (idx === -1) idx = info.row.index;
          var sh = info.row.original;
          if (sh._esopPool) {
            return (
              <button
                type="button"
                onClick={function () { if (onNavigate) onNavigate("equity"); else if (setTab) setTab("equity"); }}
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
                {t.esop_goto_equity || (lk === "fr" ? "Intéressement" : "Incentive plans")}
              </button>
            );
          }
          if (sh.fromSalary != null) {
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
                <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { setEditing({ idx: idx, item: items[idx] }); }} />
                <button
                  type="button"
                  onClick={function () { if (onNavigate) onNavigate("salaries"); else if (setTab) setTab("salaries"); }}
                  title={t.auto_tooltip || "Géré automatiquement. Cliquez pour voir la source."}
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
                  {t.salaries_link || "Équipe"}
                </button>
              </div>
            );
          }
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
    return cols;
  }, [items, totalShares, totalCapital, pricePerShare, showRound, lk, t]);

  /* ── KPIs ── */
  var kpis = showRound
    ? [
        { label: t.total_shares || "Total actions", value: nm(totalShares) },
        { label: t.fully_diluted || "Entièrement dilué", value: nm(fullyDiluted) },
        { label: t.pre_money || "Pre-money", value: eur(roundSim.preMoney) },
        { label: t.price_pre || "Prix/action (pre)", value: pricePerShare >= 0.01 ? eur(pricePerShare) : (lang === "fr" ? "< 0,01 \u20AC" : "< 0.01 \u20AC") },
      ]
    : [
        { label: t.total_shares || "Total actions", value: nm(totalShares) },
        { label: t.fully_diluted || "Entièrement dilué", value: nm(fullyDiluted) },
        { label: t.capital_subscribed || "Capital souscrit", value: totalCapital > 0 ? eurShort(totalCapital) : "—", fullValue: totalCapital > 0 ? eur(totalCapital) : undefined },
        { label: t.price_nominal || "Prix/action (nominal)", value: nominalPrice >= 0.01 ? eur(nominalPrice) : (lang === "fr" ? "< 0,01 \u20AC" : "< 0.01 \u20AC") },
      ];

  function randomize() {
    var linked = items.filter(function (sh) { return sh.fromSalary != null; });
    var names = [
      ["Alice Martin", "common"], ["Bob Dupont", "common"], ["Claire Janssen", "common"],
      ["Venture Capital SA", "preferred"], ["Startup Fund SRL", "preferred"],
      ["Thomas Leroy", "common"], ["Sophie Peeters", "common"], ["Marc Willems", "esop"],
    ];
    var picked = [];
    var used = {};
    var count = 2 + Math.floor(Math.random() * 3);
    while (picked.length < count) {
      var ri = Math.floor(Math.random() * names.length);
      if (!used[ri]) { used[ri] = true; picked.push(names[ri]); }
    }
    var nextId = linked.length ? Math.max.apply(null, linked.map(function (s) { return s.id; })) + 1 : 100;
    var generated = picked.map(function (pair, i) {
      var cl = pair[1];
      var shares = cl === "preferred" ? (500 + Math.floor(Math.random() * 4500)) : (1000 + Math.floor(Math.random() * 9000));
      var price = cl === "preferred" ? (5 + Math.floor(Math.random() * 15)) : (1 + Math.floor(Math.random() * 4));
      return { id: nextId + i, name: pair[0], cl: cl, shares: shares, price: price, date: "2025-01-15", fromSalary: null };
    });
    setShareholders(linked.concat(generated));
  }

  /* ── Toolbar ── */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomize} onClear={function () { setShareholders(items.filter(function (sh) { return sh.fromSalary != null; })); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredItems} columns={columns} filename="actionnaires" title={t.title || (lang === "fr" ? "Table de capitalisation" : "Cap Table")} subtitle={t.subtitle || (lang === "fr" ? "Registre des actionnaires et structure du capital." : "Shareholder register and capital structure.")} getPcmn={function () { return "1000"; }} />
        <Button color="primary" size="lg" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add_shareholder || "Ajouter"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ textAlign: "center", padding: "var(--sp-6)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.empty_title || "Aucun actionnaire"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: "var(--sp-1)" }}>{t.empty || "Ajoutez vos actionnaires pour structurer votre capital."}</div>
    </div>
  );

  return (
    <PageLayout title={t.title || "Table de capitalisation"} subtitle={t.subtitle || "Registre des actionnaires, structure du capital et simulation de levée de fonds."} icon={UsersThree}>

      {/* Modals */}
      {showCreate ? <ShareholderModal onSave={addItem} onClose={function () { setShowCreate(false); }} lang={lang} nominalPrice={nominalPrice} /> : null}
      {editing ? <ShareholderModal item={editing.item} onSave={function (data) { saveItem(editing.idx, data); }} onClose={function () { setEditing(null); }} lang={lang} nominalPrice={nominalPrice} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={confirmDelete}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{ confirm_title: t.confirm_delete || "Supprimer cet actionnaire ?", confirm_body: t.confirm_delete_body || "Cet actionnaire sera retiré de la table de capitalisation.", confirm_skip: t.confirm_skip || "Ne plus demander", cancel: t.cancel || "Annuler", delete: t.delete || "Supprimer" }}
      /> : null}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {kpis.map(function (k) {
          return <KpiCard key={k.label} label={k.label} value={k.value} fullValue={k.fullValue} />;
        })}
      </div>

      {/* Insights row: Donut + Explainer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Class distribution donut */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Répartition du capital"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <CapDonut data={shareholderDistribution} palette={chartPalette} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.keys(shareholderDistribution).length > 0 ? Object.keys(shareholderDistribution).map(function (name, ci) {
                var pctV = fullyDiluted > 0 ? Math.round(shareholderDistribution[name] / fullyDiluted * 100) : 0;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: chartPalette[ci % chartPalette.length] || "var(--text-muted)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pctV}%</span>
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

        {/* Explainer card */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <button
            onClick={function () { setShowExplain(function (v) { return !v; }); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.explain_toggle_show || "Comprendre la table de capitalisation"}
            </div>
          </button>
          <div style={{ marginTop: "var(--sp-3)", display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {(showExplain ? EXPLAIN_KEYS : EXPLAIN_KEYS.slice(0, 3)).map(function (key) {
              return (
                <div key={key} style={{ padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-md)", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", marginBottom: 2 }}>{t["explain_" + key + "_title"] || key}</div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: showExplain ? 99 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t["explain_" + key + "_body"] || ""}</div>
                </div>
              );
            })}
            {!showExplain && EXPLAIN_KEYS.length > 3 ? (
              <button type="button" onClick={function () { setShowExplain(true); }}
                style={{ border: "none", background: "none", fontSize: 11, fontWeight: 600, color: "var(--brand)", cursor: "pointer", padding: "2px 0", textAlign: "left", fontFamily: "inherit" }}>
                {t.explain_see_all || "Voir tout"} ({EXPLAIN_KEYS.length})
              </button>
            ) : null}
            {showExplain ? (
              <button type="button" onClick={function () { setShowExplain(false); }}
                style={{ border: "none", background: "none", fontSize: 11, fontWeight: 600, color: "var(--brand)", cursor: "pointer", padding: "2px 0", textAlign: "left", fontFamily: "inherit" }}>
                {t.explain_collapse || "Réduire"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* View toggle (tabs) */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-lg)" }}>
        {[
          { key: false, label: t.view_without_invest || "Actionnariat" },
          { key: true, label: t.view_with_invest || "Simulation de levée" },
        ].map(function (tab) {
          var isActive = showRound === tab.key;
          return (
            <button key={String(tab.key)} type="button" onClick={function () { setShowRound(tab.key); }}
              style={{ padding: "var(--sp-2) var(--sp-4)", border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent", marginBottom: -2, background: "transparent", color: isActive ? "var(--brand)" : "var(--text-muted)", fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s, border-color 0.12s" }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showRound ? "1fr 400px" : "1fr", gap: "var(--gap-lg)", alignItems: "start" }}>

        {/* DataTable */}
        <DataTable
          data={filteredItems}
          columns={columns}
          toolbar={toolbarNode}
          emptyState={emptyNode}
          getRowId={function (row) { return String(row.id); }}
          dimRow={function (row) { return !row.shares; }}
          selectable
          onDeleteSelected={bulkDeleteShareholders}
          isRowSelectable={function (row) { return row.fromSalary == null && !row._esopPool; }}
  
        />

        {/* Round simulator - only in "avec levée" view */}
        {showRound ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)" }}>{t.sim_title || "Simulateur de levée"}</h3>
              <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-4)" }}>{t.sim_subtitle || "Calculez la dilution d'une prochaine levée de fonds."}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                {[
                  { label: t.sim_premoney || "Valeur pre-money (EUR)", key: "preMoney", step: 50000, max: 100000000 },
                  { label: t.sim_raise || "Montant levé (EUR)", key: "raise", step: 50000, max: 100000000 },
                ].map(function (f) {
                  return (
                    <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{f.label}</span>
                      <NumberField
                        value={roundSim[f.key]}
                        onChange={function (v) { setRoundSim(Object.assign({}, roundSim, { [f.key]: v })); }}
                        min={0} max={f.max} step={f.step} width="120px"
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--sp-4)", paddingTop: "var(--sp-4)" }}>
                {[
                  { label: t.sim_postmoney || "Post-money", value: eur(postMoney), bold: false },
                  { label: t.sim_price || "Prix/action émis", value: pricePerShare > 0 ? eur(pricePerShare) : "—", bold: false },
                  { label: t.sim_new_shares || "Nouvelles actions", value: nm(newShares), bold: false },
                  { label: t.sim_investor_pct || "Part investisseur", value: (investorPct * 100).toFixed(1) + "%", bold: true },
                  { label: t.sim_dilution || "Dilution existants", value: (investorPct * 100).toFixed(1) + "%", bold: false },
                ].map(function (r, i, a) {
                  return (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500, color: r.bold ? "var(--brand)" : "var(--text-primary)" }}>{r.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Post-round ownership */}
            {newShares > 0 && items.length > 0 ? (
              <Card>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-3)" }}>{t.post_label || "Post-money"}</h3>
                {items.map(function (sh) {
                  var postPct = postTotal > 0 ? sh.shares / postTotal : 0;
                  var prePct = totalShares > 0 ? sh.shares / totalShares : 0;
                  return (
                    <div key={sh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{sh.name}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {(prePct * 100).toFixed(1)}% → <strong style={{ color: "var(--text-primary)" }}>{(postPct * 100).toFixed(1)}%</strong>
                      </span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderTop: "1px solid var(--border)", marginTop: "var(--sp-1)" }}>
                  <span style={{ fontSize: 12, color: "var(--color-info)", fontWeight: 600 }}>{t.investors_label || "Investisseur(s)"}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-info)" }}>+{(investorPct * 100).toFixed(1)}%</span>
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ESOP summary row at the bottom of the page */}
      {esopGranted > 0 ? (
        <div style={{ marginTop: "var(--gap-lg)", padding: "var(--sp-4)", border: "1px solid var(--color-info-border)", borderRadius: "var(--r-lg)", background: "var(--color-info-bg)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <Star size={16} weight="fill" color="var(--color-info)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-info)" }}>{t.esop_pool_row || "Pool ESOP"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{nm(esopGranted)} {t.col_shares || "actions"}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{(esopData.vested > 0 ? (typeof t.esop_vested === "function" ? t.esop_vested(nm(esopVested)) : nm(esopVested) + " vested") : "")}</span>
              {esopData.strikeValue > 0 ? (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{eur(esopData.strikeValue)} {t.esop_at_strike || "au strike"}</span>
              ) : null}
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-info)" }}>{fullyDiluted > 0 ? (esopGranted / fullyDiluted * 100).toFixed(1) + "%" : "0%"} {t.col_fully_diluted_pct || "du fully diluted"}</span>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
