import { useEffect, useMemo, useState } from "react";
import { Plus, ChartPie, PencilSimple, Certificate, Star, ChartLine, ToggleRight, Link as LinkIcon, Power, Users, ArrowRight, ArrowLeft, Check, Sliders } from "@phosphor-icons/react";
import { NumberField, PageLayout, Select, Button, KpiCard, DatePicker, Badge, DataTable, ConfirmDeleteModal, SearchInput, ActionBtn, ExportButtons, Modal, ModalFooter, Wizard } from "../components";
import { eur, pct, grantCalc, makeId } from "../utils";
import { useT, useLang } from "../context";

var TYPE_OPTS = ["warrants", "options"];

/* ── Type metadata ── */
var TYPE_META = {
  warrants: {
    icon: Certificate,
    badge: "brand",
    label: { fr: "Bons de souscription", en: "Subscription warrants" },
    desc: { fr: "Créent de nouvelles parts lors de l'achat. Le choix le plus courant en startup.", en: "Create new shares when purchased. The most common choice for startups." },
  },
  options: {
    icon: ChartLine,
    badge: "info",
    label: { fr: "Options sur actions", en: "Stock options" },
    desc: { fr: "Portent sur des parts déjà émises. Un actionnaire existant s'engage à céder ses parts.", en: "Based on existing shares. An existing shareholder commits to selling their shares." },
  },
};

/* ── GrantModal (step wizard) ── */
function GrantModal({ grant, onSave, onClose, lang, shareholders }) {
  var t = useT().equity || {};
  var lk = lang === "en" ? "en" : "fr";
  var isEdit = !!(grant && grant._isEdit);

  var [wizardStep, setWizardStep] = useState(0);

  var defaultType = (grant && grant.type) || "warrants";
  var [selected, setSelected] = useState(defaultType);
  var [shares, setShares] = useState((grant && grant.shares) || 1000);
  var [strike, setStrike] = useState((grant && grant.strike) || 1.00);
  var [fairValue, setFairValue] = useState((grant && grant.fairValue) || 3.00);
  var [grantDate, setGrantDate] = useState((grant && grant.grantDate) || new Date().toISOString().slice(0, 10));
  var [vestingMonths, setVestingMonths] = useState((grant && grant.vestingMonths) || 48);
  var [cliffMonths, setCliffMonths] = useState((grant && grant.cliffMonths) || 12);
  var [cedant, setCedant] = useState((grant && grant.cedant) || "");

  var displayName = (grant && grant.name) || "";
  /* Only common/preferred shareholders can cede — exclude ESOP pool */
  var eligibleShareholders = useMemo(function () {
    if (!Array.isArray(shareholders)) return [];
    return shareholders.filter(function (sh) { return sh.cl !== "esop"; });
  }, [shareholders]);
  var hasShareholders = eligibleShareholders.length > 0;
  var shareholderOptions = useMemo(function () {
    return eligibleShareholders.map(function (sh) {
      return { value: String(sh.id || sh.name), label: sh.name + " — " + (sh.shares || 0).toLocaleString() + " " + (lk === "fr" ? "parts" : "shares") };
    });
  }, [eligibleShareholders, lk]);
  var selectedShareholder = eligibleShareholders.find(function (sh) { return String(sh.id || sh.name) === cedant; });
  var cedantMaxShares = selectedShareholder ? (selectedShareholder.shares || 0) : Infinity;

  var meta = TYPE_META[selected] || TYPE_META.warrants;

  /* Preview calculation */
  var previewGrant = {
    id: "preview",
    name: displayName,
    type: selected,
    shares: shares,
    strike: strike,
    fairValue: fairValue,
    grantDate: grantDate,
    vestingMonths: vestingMonths,
    cliffMonths: cliffMonths,
  };
  var previewCalc = grantCalc(previewGrant);

  function handleSubmit() {
    var data = {
      id: (grant && grant.id) ? grant.id : makeId("g"),
      name: displayName || meta.label[lk],
      type: selected,
      shares: shares,
      strike: strike,
      fairValue: fairValue,
      grantDate: grantDate,
      vestingMonths: vestingMonths,
      cliffMonths: cliffMonths,
      fromSalary: (grant && grant.fromSalary != null) ? grant.fromSalary : null,
      _configured: true,
    };
    if (selected === "options") data.cedant = cedant;
    onSave(data);
    onClose();
  }

  var sharesExceedCedant = selected === "options" && shares > cedantMaxShares;
  var canSubmit = displayName.length > 0 && shares > 0 && !sharesExceedCedant;
  var canAdvanceStep0 = selected === "warrants" || (selected === "options" && cedant !== "");
  var canAdvanceStep1 = shares > 0 && !sharesExceedCedant;

  var labelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" };

  return (
    <Modal open onClose={onClose} size="md" hideClose>
      {/* Progress bar */}
      <div style={{ padding: "0 var(--sp-5)", paddingTop: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map(function (i) {
            return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= wizardStep ? "var(--brand)" : "var(--bg-hover)", transition: "background 0.2s" }} />;
          })}
        </div>
      </div>

      {/* Grantee display — always visible above steps */}
      {displayName ? (
        <div style={{ padding: "var(--sp-3) var(--sp-5) 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", height: 36, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-accordion)", color: "var(--text-secondary)", fontSize: 13 }}>
            <LinkIcon size={14} color="var(--brand)" />
            <span>{displayName}</span>
          </div>
        </div>
      ) : null}

      {/* Step content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-5)" }}>

        {/* Step 0 — Choose type */}
        {wizardStep === 0 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Quel type de plan ?" : "Which plan type?"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Choisissez le mécanisme adapté à votre entreprise." : "Choose the right mechanism for your company."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {TYPE_OPTS.map(function (typeKey) {
                var m = TYPE_META[typeKey];
                var TIcon = m.icon;
                var isActive = selected === typeKey;
                var isOptionsDisabled = typeKey === "options" && !hasShareholders;
                return (
                  <button key={typeKey} type="button" onClick={function () { if (!isOptionsDisabled) setSelected(typeKey); }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "var(--sp-3)", width: "100%",
                      padding: "var(--sp-3) var(--sp-4)",
                      border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                      borderRadius: "var(--r-lg)",
                      background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                      cursor: isOptionsDisabled ? "default" : "pointer", textAlign: "left",
                      opacity: isOptionsDisabled ? 0.5 : 1,
                      transition: "background 0.15s, border-color 0.15s, opacity 0.15s", fontFamily: "inherit",
                    }}
                    onMouseEnter={function (e) { if (!isActive && !isOptionsDisabled) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.borderColor = "var(--border)"; } }}
                    onMouseLeave={function (e) { if (!isOptionsDisabled) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "var(--bg-accordion)"; e.currentTarget.style.borderColor = isActive ? "var(--brand)" : "var(--border-light)"; } }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: "var(--r-sm)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)", border: "1px solid " + (isActive ? "var(--brand)" : "var(--border-light)"), marginTop: 1 }}>
                      <TIcon size={14} weight={isActive ? "fill" : "duotone"} color={isActive ? "var(--brand)" : "var(--text-muted)"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                        <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--brand)" : "var(--text-primary)", lineHeight: 1.3 }}>{m.label[lk]}</span>
                        {typeKey === "warrants" ? <Badge color="success" size="sm">{lk === "fr" ? "Recommandé" : "Recommended"}</Badge> : null}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: 2 }}>{m.desc[lk]}</div>
                      {isOptionsDisabled ? (
                        <div style={{ fontSize: 11, color: "var(--color-warning)", lineHeight: 1.4, marginTop: 4 }}>
                          {lk === "fr" ? "Nécessite au moins un actionnaire dans la table de capitalisation" : "Requires at least one shareholder in the cap table"}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {selected === "options" && hasShareholders ? (
              <div style={{ marginTop: "var(--sp-3)" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {lk === "fr" ? "Actionnaire cédant" : "Ceding shareholder"}
                </label>
                <Select value={cedant} onChange={setCedant} options={shareholderOptions} placeholder={lk === "fr" ? "Choisir un actionnaire..." : "Choose a shareholder..."} height={40} width="100%" />
                {selectedShareholder ? (
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                    {lk === "fr"
                      ? selectedShareholder.name + " détient " + (selectedShareholder.shares || 0).toLocaleString() + " parts. Vous ne pouvez pas en attribuer plus."
                      : selectedShareholder.name + " holds " + (selectedShareholder.shares || 0).toLocaleString() + " shares. You cannot grant more than that."}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 1 — Configure details */}
        {wizardStep === 1 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Détails du plan" : "Plan details"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {meta.label[lk]}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{t.col_shares || (lk === "fr" ? "Nombre de parts" : "Shares")}</label>
                <NumberField value={shares} onChange={setShares} min={1} max={selected === "options" ? cedantMaxShares : 1000000} step={100} width="100%" />
                {sharesExceedCedant ? (
                  <div style={{ fontSize: 11, color: "var(--color-error)", marginTop: 4 }}>
                    {lk === "fr"
                      ? "Dépasse les " + cedantMaxShares.toLocaleString() + " parts de l'actionnaire cédant."
                      : "Exceeds the " + cedantMaxShares.toLocaleString() + " shares of the ceding shareholder."}
                  </div>
                ) : null}
              </div>
              <div>
                <label style={labelStyle}>{t.col_strike || (lk === "fr" ? "Prix d'achat par part" : "Purchase price per share")}</label>
                <NumberField value={strike} onChange={setStrike} min={0} max={10000} step={0.01} width="100%" suf="€" />
              </div>
              <div>
                <label style={labelStyle}>{t.col_fairvalue || (lk === "fr" ? "Valeur estimée par part" : "Estimated value per share")}</label>
                <NumberField value={fairValue} onChange={setFairValue} min={0} max={100000} step={0.01} width="100%" suf="€" />
              </div>
              <div>
                <label style={labelStyle}>{t.col_grantdate || (lk === "fr" ? "Date d'attribution" : "Grant date")}</label>
                <DatePicker value={grantDate} onChange={setGrantDate} height={40} />
              </div>
            </div>
          </div>
        ) : null}

        {/* Step 2 — Acquisition period */}
        {wizardStep === 2 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Durée d'acquisition" : "Acquisition period"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Les parts se débloquent progressivement au fil du temps." : "Shares unlock progressively over time."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Durée totale d'acquisition" : "Total acquisition duration"}</label>
                <NumberField value={vestingMonths} onChange={setVestingMonths} min={1} max={120} step={1} width="100%" suf={lk === "fr" ? "mois" : "mo"} />
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{lk === "fr" ? "Période sur laquelle les parts se débloquent (standard : 48 mois)." : "Period over which shares unlock (standard: 48 months)."}</div>
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Attente avant le 1er déblocage" : "Wait before first unlock"}</label>
                <NumberField value={cliffMonths} onChange={setCliffMonths} min={0} max={60} step={1} width="100%" suf={lk === "fr" ? "mois" : "mo"} />
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{lk === "fr" ? "L'employé doit rester ce temps avant de recevoir quoi que ce soit (standard : 12 mois)." : "Employee must stay this long before receiving anything (standard: 12 months)."}</div>
              </div>
            </div>
            {/* Preview card */}
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.col_monthly || (lk === "fr" ? "Coût mensuel estimé" : "Estimated monthly cost")}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums", color: previewCalc.monthlyExpense > 0 ? "var(--color-warning)" : "var(--text-faint)" }}>
                  {previewCalc.monthlyExpense > 0 ? eur(previewCalc.monthlyExpense) : "—"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.col_type || "Type"}</span>
                <Badge color={meta.badge} size="sm" dot>{meta.label[lk]}</Badge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lk === "fr" ? "Résumé" : "Summary"}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                  {shares + " " + (lk === "fr" ? "parts sur" : "shares over") + " " + vestingMonths + " " + (lk === "fr" ? "mois, attente" : "months, cliff") + " " + cliffMonths + " " + (lk === "fr" ? "mois" : "months")}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation footer */}
      <ModalFooter>
        {wizardStep > 0 ? (
          <Button color="tertiary" size="lg" onClick={function () { setWizardStep(function (s) { return s - 1; }); }} iconLeading={<ArrowLeft size={14} />}>
            {lk === "fr" ? "Retour" : "Back"}
          </Button>
        ) : (
          <Button color="tertiary" size="lg" onClick={onClose}>
            {t.modal_close || (lk === "fr" ? "Fermer" : "Close")}
          </Button>
        )}
        {wizardStep < 2 ? (
          <Button color="primary" size="lg" isDisabled={(wizardStep === 0 && !canAdvanceStep0) || (wizardStep === 1 && !canAdvanceStep1)} onClick={function () { setWizardStep(function (s) { return s + 1; }); }} iconTrailing={<ArrowRight size={14} />}>
            {lk === "fr" ? "Suivant" : "Next"}
          </Button>
        ) : (
          <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={<Check size={14} weight="bold" />}>
            {isEdit ? (t.modal_save || (lk === "fr" ? "Enregistrer" : "Save")) : (t.add_grant || (lk === "fr" ? "Définir" : "Set up"))}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

/* ── Main Page ── */
export default function EquityPage({ cfg, grants, setGrants, poolSize, setPoolSize, esopEnabled, setEsopEnabled, sals, setSals, setTab, onNavigate, shareholders }) {
  var t = useT().equity || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";


  var [editing, setEditing] = useState(null);
  var [deleteTarget, setDeleteTarget] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [search, setSearch] = useState("");
  var [typeFilter, setTypeFilter] = useState("all");
  var [wizardPool, setWizardPool] = useState(poolSize || 10000);

  var calcs = useMemo(function () {
    return grants.map(grantCalc);
  }, [grants]);

  var totalGranted = grants.reduce(function (s, g) { return s + g.shares; }, 0);
  var totalVested = calcs.reduce(function (s, c) { return s + c.vestedShares; }, 0);
  var totalMonthly = calcs.reduce(function (s, c) { return s + c.monthlyExpense; }, 0);


  var filteredGrants = useMemo(function () {
    var list = grants;
    if (typeFilter !== "all") list = list.filter(function (g) { return g.type === typeFilter; });
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      list = list.filter(function (g) { return (g.name || "").toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }, [grants, typeFilter, search]);

  /* ── Eligible employees (esop: true) ── */
  var eligibleSals = useMemo(function () {
    return (sals || []).filter(function (s) { return s.esop === true && s.type === "employee"; });
  }, [sals]);

  /* ── Sync: auto-create grants for eligible employees, remove orphaned grants ── */
  function syncFromSals() {
    var existingMap = {};
    grants.forEach(function (g) { if (g.fromSalary != null) existingMap[g.fromSalary] = true; });
    var eligibleIds = {};
    eligibleSals.forEach(function (s) { eligibleIds[s.id] = true; });

    /* Add grants for new eligible employees */
    var toAdd = [];
    var nextId = grants.length > 0 ? Math.max.apply(null, grants.map(function (g) { return typeof g.id === "number" ? g.id : 0; })) + 1 : 1;
    eligibleSals.forEach(function (s) {
      if (!existingMap[s.id]) {
        toAdd.push({
          id: nextId++,
          name: s.role || "—",
          type: "warrants",
          shares: 1000,
          strike: 1.00,
          fairValue: 3.00,
          grantDate: new Date().toISOString().slice(0, 10),
          vestingMonths: 48,
          cliffMonths: 12,
          fromSalary: s.id,
        });
      }
    });

    /* Remove grants whose linked employee no longer has esop: true */
    var kept = grants.filter(function (g) {
      if (g.fromSalary == null) return true;
      return !!eligibleIds[g.fromSalary];
    });

    /* Also update names of linked grants in case employee role changed */
    var salMap = {};
    eligibleSals.forEach(function (s) { salMap[s.id] = s; });
    var updated = kept.map(function (g) {
      if (g.fromSalary != null && salMap[g.fromSalary]) {
        return Object.assign({}, g, { name: salMap[g.fromSalary].role || g.name });
      }
      return g;
    });

    setGrants(updated.concat(toAdd));
  }

  /* ── Auto-sync when eligible employees change ── */
  useEffect(function () {
    if (!esopEnabled) return;
    syncFromSals();
  }, [eligibleSals.length]);

  /* ── CRUD ── */
  function openEdit(idx) {
    setEditing({ idx: idx, grant: Object.assign({}, grants[idx], { _isEdit: true }) });
  }

  function handleSave(data) {
    if (editing && editing.idx === -1) {
      /* new */
      var newId = grants.length > 0 ? Math.max.apply(null, grants.map(function (g) { return typeof g.id === "number" ? g.id : 0; })) + 1 : 1;
      data.id = newId;
      setGrants(grants.concat([data]));
    } else if (editing && editing.idx >= 0) {
      /* edit */
      var ng = JSON.parse(JSON.stringify(grants));
      var saved = Object.assign({}, ng[editing.idx], data);
      delete saved._isEdit;
      ng[editing.idx] = saved;
      setGrants(ng);
    }
    setEditing(null);
  }

  function requestRemove(idx) {
    if (skipDeleteConfirm) {
      removeGrant(idx);
    } else {
      setDeleteTarget(idx);
    }
  }

  function removeGrant(idx) {
    var grant = grants[idx];
    /* Remove the grant */
    setGrants(grants.filter(function (_, j) { return j !== idx; }));
    /* Set esop: false on the linked employee */
    if (grant && grant.fromSalary != null && setSals) {
      setSals(function (prev) {
        return prev.map(function (s) {
          if (s.id === grant.fromSalary) {
            return Object.assign({}, s, { esop: false });
          }
          return s;
        });
      });
    }
  }

  function confirmDelete() {
    if (deleteTarget === null) return;
    removeGrant(deleteTarget);
    setDeleteTarget(null);
  }

  function bulkRemove(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    var removed = grants.filter(function (g) { return idSet[String(g.id)]; });
    setGrants(function (prev) { return prev.filter(function (g) { return !idSet[String(g.id)]; }); });
    if (setSals) {
      var salIds = {};
      removed.forEach(function (g) { if (g.fromSalary != null) salIds[g.fromSalary] = true; });
      setSals(function (prev) {
        return prev.map(function (s) {
          if (salIds[s.id]) return Object.assign({}, s, { esop: false });
          return s;
        });
      });
    }
  }

  /* ── DataTable columns ── */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: t.col_grantee || "Bénéficiaire",
        enableSorting: true, meta: { align: "left", minWidth: 120, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
      },
      {
        id: "shares", accessorKey: "shares",
        header: lk === "fr" ? "Parts / prix" : "Shares / price",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) {
          var row = info.row.original;
          return (row.shares || 0).toLocaleString() + " / " + eur(row.strike || 0);
        },
      },
      {
        id: "grantDate", accessorKey: "grantDate",
        header: t.col_grantdate || "Date",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return info.getValue() || "—"; },
      },
      {
        id: "vestingMonths", accessorKey: "vestingMonths",
        header: lk === "fr" ? "Acquisition" : "Acquisition",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return (info.getValue() || 0) + " " + (t.months || "mois"); },
      },
      {
        id: "vested",
        header: t.col_vested || (lk === "fr" ? "Acquises" : "Acquired"),
        enableSorting: false, meta: { align: "right", minWidth: 80 },
        accessorFn: function (row) {
          var idx = grants.indexOf(row);
          var c = idx >= 0 ? calcs[idx] : null;
          return c ? c.vestedShares.toLocaleString() + " (" + pct(c.vestedPct) + ")" : "—";
        },
        cell: function (info) {
          var row = info.row.original;
          var idx = grants.indexOf(row);
          var c = idx >= 0 ? calcs[idx] : null;
          if (!c) return "—";
          var barColor = c.status === "cliff" ? "var(--color-warning)" : c.status === "complete" ? "var(--color-success)" : "var(--color-info)";
          return (
            <div style={{ minWidth: 70 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.vestedShares.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{pct(c.vestedPct)}</div>
              <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (c.vestedPct * 100).toFixed(1) + "%", background: barColor, borderRadius: 2 }} />
              </div>
            </div>
          );
        },
      },
      {
        id: "monthly",
        header: t.col_monthly || (lk === "fr" ? "Coût/mois" : "Cost/mo"),
        enableSorting: false, meta: { align: "right" },
        accessorFn: function (row) {
          var idx = grants.indexOf(row);
          var c = idx >= 0 ? calcs[idx] : null;
          return c && c.monthlyExpense > 0 ? eur(c.monthlyExpense) : "—";
        },
      },
      {
        id: "status",
        header: t.col_status || "Statut",
        enableSorting: false, meta: { align: "right" },
        accessorFn: function (row) {
          var idx = grants.indexOf(row);
          var c = idx >= 0 ? calcs[idx] : null;
          return c ? (t["status_" + c.status] || c.status) : "—";
        },
        cell: function (info) {
          var row = info.row.original;
          var idx = grants.indexOf(row);
          var c = idx >= 0 ? calcs[idx] : null;
          if (!c) return "—";
          var statusColor = { cliff: "warning", vesting: "info", complete: "success" };
          var label = t["status_" + c.status] || c.status;
          return <Badge color={statusColor[c.status] || "gray"} size="sm">{label}</Badge>;
        },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          var idx = grants.indexOf(row);
          if (idx === -1) idx = info.row.index;
          var isConfigured = !!row._configured;
          if (!isConfigured) {
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 0, position: "relative" }}>
                <ActionBtn icon={<Sliders size={14} />} title={t.action_define || (lk === "fr" ? "Définir" : "Define")} onClick={function () { openEdit(idx); }} />
                <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", animation: "fcDotPulse 2s ease infinite" }} />
              </div>
            );
          }
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { openEdit(idx); }} />
              <ActionBtn icon={<Power size={14} />} title={t.action_remove || "Retirer"} variant="danger" onClick={function () { requestRemove(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [grants, calcs, lk, t]);


  /* ── Toolbar node ── */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        <ExportButtons cfg={cfg} data={filteredGrants} columns={columns} filename="grants" title={t.title || (lang === "fr" ? "Plans d'intéressement" : "Incentive Plans")} subtitle={t.subtitle || ""} />
        <Button color="secondary" size="lg" onClick={function () { syncFromSals(); if (onNavigate) onNavigate("salaries"); else if (setTab) setTab("salaries"); }} iconLeading={<ArrowRight size={14} weight="bold" />}>
          {lk === "fr" ? "Équipe" : "Team"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-6)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
        {eligibleSals.length === 0
          ? (t.empty_no_eligible_title || (lk === "fr" ? "Aucun employé éligible" : "No eligible employees"))
          : (lk === "fr" ? "Aucune attribution configurée" : "No grants configured")}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, textAlign: "center" }}>
        {t.empty_no_eligible || (lk === "fr"
          ? "Activez le plan d'intéressement sur vos employés depuis la page Équipe."
          : "Enable the incentive plan on your employees from the Team page.")}
      </div>
      <Button color="secondary" size="md" onClick={function () { if (onNavigate) onNavigate("salaries"); else if (setTab) setTab("salaries"); }} iconLeading={<ArrowRight size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {lk === "fr" ? "Équipe" : "Team"}
      </Button>
    </div>
  );

  /* ── Module activation — Wizard ── */
  if (!esopEnabled) {
    var vestingSteps = [
      { icon: Certificate, label: t.primer_step1_title, body: t.primer_step1_body },
      { icon: Star, label: t.primer_step2_title, body: t.primer_step2_body },
      { icon: ChartLine, label: t.primer_step3_title, body: t.primer_step3_body },
      { icon: ChartPie, label: t.primer_step4_title, body: t.primer_step4_body },
    ];

    function wizardFinish() {
      setPoolSize(wizardPool);
      setEsopEnabled(true);
    }

    var wizardSteps = [
      {
        key: "intro",
        content: (
          <div style={{ textAlign: "center" }}>
            <ChartPie size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
              {lk === "fr" ? "Intéressement de votre équipe" : "Team equity incentives"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-5)", textAlign: "left" }}>
              {[
                { icon: ChartPie, title: lk === "fr" ? "Fidéliser vos talents" : "Retain your talent", desc: lk === "fr" ? "Offrez à vos employés une part du succès de l'entreprise." : "Give your employees a share of the company's success." },
                { icon: Certificate, title: lk === "fr" ? "Parts progressives" : "Progressive shares", desc: lk === "fr" ? "Créez des plans de parts qui se débloquent au fil du temps." : "Create share plans that unlock over time." },
                { icon: Star, title: lk === "fr" ? "Coût maîtrisé" : "Controlled cost", desc: lk === "fr" ? "Charge comptable sans impact sur votre trésorerie." : "Accounting expense with no impact on your cash." },
              ].map(function (card, ci) {
                var CIcon = card.icon;
                return (
                  <div key={ci} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", padding: "var(--sp-3)", background: "var(--bg-accordion)" }}>
                    <CIcon size={20} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-2)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{card.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        key: "howItWorks",
        content: (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
              {lk === "fr" ? "Comment ça fonctionne ?" : "How does it work?"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Les parts se débloquent progressivement, mois après mois." : "Shares unlock gradually, month after month."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              {vestingSteps.map(function (s, i) {
                var SIcon = s.icon;
                return (
                  <div key={i} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", padding: "var(--sp-3)", background: "var(--bg-accordion)" }}>
                    <SIcon size={20} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-2)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{s.body}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        key: "poolSize",
        canAdvance: wizardPool > 0,
        content: (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
              {lk === "fr" ? "Combien de parts à réserver ?" : "How many shares to reserve?"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-5)", textAlign: "center" }}>
              {lk === "fr" ? "Décidez combien de parts votre entreprise met de côté pour récompenser l'équipe." : "Decide how many shares your company sets aside to reward the team."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
              <NumberField value={wizardPool} onChange={setWizardPool} min={0} max={10000000} step={1000} width="200px" />
              {wizardPool > 0 ? (
                <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", width: "100%", maxWidth: 400, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{wizardPool.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{t.kpi_unit || "options"}</div>
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
    ];

    return (
      <PageLayout title={t.title} subtitle={t.subtitle} icon={ChartPie}>
        <Wizard
          steps={wizardSteps}
          onFinish={wizardFinish}
          finishLabel={lk === "fr" ? "Activer le module" : "Enable module"}
          finishIcon={<ToggleRight size={16} />}
          finishDisabled={wizardPool <= 0}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      icon={ChartPie}
    >

      {/* Modals */}
      {editing !== null ? (
        <GrantModal
          grant={editing.grant}
          onSave={handleSave}
          onClose={function () { setEditing(null); }}
          lang={lang}
          shareholders={shareholders}
        />
      ) : null}
      {deleteTarget !== null ? (
        <ConfirmDeleteModal
          onConfirm={confirmDelete}
          onCancel={function () { setDeleteTarget(null); }}
          skipNext={skipDeleteConfirm}
          setSkipNext={setSkipDeleteConfirm}
          t={{
            confirm_title: t.remove_title || (lk === "fr" ? "Retirer le plan ?" : "Remove the plan?"),
            confirm_body: t.remove_body || (lk === "fr" ? "L'employé sera retiré du plan d'intéressement." : "The employee will be removed from the incentive plan."),
            confirm_skip: t.confirm_skip || (lk === "fr" ? "Ne plus demander" : "Don't ask again"),
            cancel: t.cancel || (lk === "fr" ? "Annuler" : "Cancel"),
            delete: t.remove_btn || (lk === "fr" ? "Retirer" : "Remove"),
          }}
        />
      ) : null}

      {/* KPI row — same pattern as CrowdfundingPage / CapTablePage */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_pool || (lk === "fr" ? "Parts réservées" : "Reserved shares")} value={(poolSize || 0).toLocaleString()} fullValue={(poolSize || 0).toLocaleString() + " " + (t.kpi_unit || "parts")} glossaryKey="esop_pool" />
        <KpiCard label={t.kpi_granted || (lk === "fr" ? "Attribuées" : "Granted")} value={totalGranted.toLocaleString()} fullValue={totalGranted.toLocaleString() + " / " + (poolSize || 0).toLocaleString()} glossaryKey="esop_granted" />
        <KpiCard label={t.kpi_vested || (lk === "fr" ? "Acquises" : "Acquired")} value={totalVested.toLocaleString()} fullValue={totalVested.toLocaleString() + " " + (t.kpi_unit || "parts")} glossaryKey="vesting" />
        <KpiCard label={t.kpi_monthly || (lk === "fr" ? "Coût mensuel" : "Monthly cost")} value={totalMonthly > 0 ? eur(totalMonthly) : "—"} fullValue={totalMonthly > 0 ? eur(totalMonthly) + (lk === "fr" ? " /mois (non-cash)" : " /month (non-cash)") : undefined} glossaryKey="ifrs2" />
      </div>

      {/* Insights row — chart card style like RevenueStreamsPage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Pool usage card with progress bar */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lk === "fr" ? "Utilisation du plan" : "Plan usage"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
              <NumberField value={poolSize} onChange={setPoolSize} min={0} max={10000000} step={1000} width="120px" />
              <Button color="tertiary" size="lg" onClick={function () { setEsopEnabled(false); }} iconLeading={<Power size={14} weight="bold" />}>
                {t.disable || (lk === "fr" ? "Désactiver" : "Disable")}
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginBottom: "var(--sp-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>{lk === "fr" ? "Attribuées" : "Granted"} {poolSize > 0 ? Math.round(totalGranted / poolSize * 100) + "%" : "—"}</span>
              <span>{lk === "fr" ? "Disponibles" : "Available"} {poolSize > 0 ? Math.round((poolSize - totalGranted) / poolSize * 100) + "%" : "—"}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden", display: "flex" }}>
              {poolSize > 0 ? (
                <div style={{ width: Math.min(totalGranted / poolSize * 100, 100) + "%", background: totalGranted > poolSize ? "var(--color-error)" : "var(--brand)", borderRadius: 3, transition: "width 0.3s" }} />
              ) : null}
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: "var(--sp-4)" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-primary)" }}>{totalGranted.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{lk === "fr" ? "attribuées" : "granted"}</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", color: totalGranted > poolSize ? "var(--color-error)" : "var(--color-success)" }}>{Math.max(0, (poolSize || 0) - totalGranted).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{lk === "fr" ? "disponibles" : "available"}</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-primary)" }}>{grants.length}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{lk === "fr" ? "bénéficiaires" : "beneficiaries"}</div>
            </div>
          </div>
        </div>

        {/* Vesting status breakdown card */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {lk === "fr" ? "Statut d'acquisition" : "Acquisition status"}
          </div>
          {grants.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              {[
                { key: "cliff", color: "var(--color-warning)", label: t.status_cliff || (lk === "fr" ? "En attente" : "Waiting") },
                { key: "vesting", color: "var(--color-info)", label: t.status_vesting || (lk === "fr" ? "En cours" : "In progress") },
                { key: "complete", color: "var(--color-success)", label: t.status_complete || (lk === "fr" ? "Acquis" : "Acquired") },
              ].map(function (s) {
                var count = calcs.filter(function (c) { return c.status === s.key; }).length;
                var shares = calcs.filter(function (c) { return c.status === s.key; }).reduce(function (sum, c) { return sum + c.vestedShares; }, 0);
                var barPct = totalGranted > 0 ? (grants.filter(function (g, i) { return calcs[i] && calcs[i].status === s.key; }).reduce(function (sum, g) { return sum + g.shares; }, 0) / totalGranted * 100) : 0;
                return (
                  <div key={s.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{count} {lk === "fr" ? "attributions" : "grants"} · {shares.toLocaleString()} {lk === "fr" ? "acquises" : "acquired"}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--bg-hover)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: barPct + "%", background: s.color, borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {[0, 1, 2].map(function (i) {
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ width: 80, height: 12, borderRadius: 4, background: "var(--bg-hover)" }} />
                      <span style={{ width: 100, height: 12, borderRadius: 4, background: "var(--bg-hover)" }} />
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--bg-hover)" }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {[
          { key: "all", label: lk === "fr" ? "Tous" : "All" },
          { key: "warrants", label: lk === "fr" ? "Bons de souscription" : "Subscription warrants" },
          { key: "options", label: lk === "fr" ? "Options sur actions" : "Stock options" },
        ].map(function (tb) {
          var isActive = typeFilter === tb.key;
          return (
            <button key={tb.key} type="button" onClick={function () { setTypeFilter(tb.key); }}
              style={{
                padding: "var(--sp-2) var(--sp-4)", border: "none", background: "none",
                fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2, transition: "color 0.15s, border-color 0.15s",
              }}
            >{tb.label}</button>
          );
        })}
      </div>

      {/* Grants DataTable */}
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <DataTable
          columns={columns}
          data={filteredGrants}
          toolbar={toolbarNode}
          emptyState={emptyNode}
          getRowId={function (row) { return String(row.id); }}
          selectable
          onDeleteSelected={bulkRemove}
          deleteSelectedLabel={lk === "fr" ? "Retirer du plan" : "Remove from plan"}
        />
      </div>


    </PageLayout>
  );
}
