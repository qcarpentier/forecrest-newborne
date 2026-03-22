import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Trash, PencilSimple, Copy, Shuffle, Eraser,
  Package, Lightning, CalendarCheck, FileText, Heart,
  Handshake, ToggleRight, Power,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SelectDropdown, FinanceLink } from "../components";
import Modal, { ModalFooter } from "../components/Modal";
import CurrencyInput from "../components/CurrencyInput";
import NumberField from "../components/NumberField";
import { eur, eurShort, pct } from "../utils";
import { useT, useLang, useDevMode, useTheme } from "../context";

/* ── Platforms ── */
var PLATFORM_META = {
  ulule:    { label: "Ulule", commission: 0.08, payment: 0, url: "ulule.com" },
  kkbb:     { label: "KissKissBankBank", commission: 0.08, payment: 0, url: "kisskissbankbank.com" },
  kickstarter: { label: "Kickstarter", commission: 0.05, payment: 0.035, url: "kickstarter.com" },
  indiegogo:   { label: "Indiegogo", commission: 0.05, payment: 0, url: "indiegogo.com" },
  gofundme:    { label: "GoFundMe", commission: 0, payment: 0.029, url: "gofundme.com" },
  other:       { label: "Autre", commission: 0.05, payment: 0, url: "" },
};
var PLATFORM_KEYS = Object.keys(PLATFORM_META);

/* ── Tier categories ── */
var TIER_CAT_META = {
  product:    { icon: Package, badge: "brand", label: { fr: "Produit physique", en: "Physical product" }, desc: { fr: "T-shirt, mug, poster, livre.", en: "T-shirt, mug, poster, book." }, placeholder: { fr: "ex. T-shirt édition limitée", en: "e.g. Limited edition T-shirt" }, defaultCost: 15, suggestions: [{ l: "T-shirt", cost: 12 }, { l: "Mug personnalisé", cost: 8 }, { l: "Poster signé", cost: 5 }, { l: "Stickers pack", cost: 3 }] },
  early:      { icon: Lightning, badge: "warning", label: { fr: "Accès anticipé", en: "Early access" }, desc: { fr: "Pré-commande, accès bêta, tarif early bird.", en: "Pre-order, beta access, early bird." }, placeholder: { fr: "ex. Accès early bird", en: "e.g. Early bird access" }, defaultCost: 0, suggestions: [{ l: "Accès early bird", cost: 0 }, { l: "Pré-commande produit", cost: 25 }] },
  experience: { icon: CalendarCheck, badge: "info", label: { fr: "Expérience", en: "Experience" }, desc: { fr: "Événement, atelier, rencontre.", en: "Event, workshop, meet & greet." }, placeholder: { fr: "ex. Soirée de lancement", en: "e.g. Launch party" }, defaultCost: 30, suggestions: [{ l: "Soirée de lancement", cost: 25 }, { l: "Atelier découverte", cost: 40 }] },
  digital:    { icon: FileText, badge: "gray", label: { fr: "Numérique", en: "Digital" }, desc: { fr: "Ebook, contenu exclusif, accès premium.", en: "Ebook, exclusive content, premium." }, placeholder: { fr: "ex. Ebook exclusif", en: "e.g. Exclusive ebook" }, defaultCost: 2, suggestions: [{ l: "Ebook exclusif", cost: 2 }, { l: "Accès premium 1 an", cost: 0 }] },
  thanks:     { icon: Heart, badge: "success", label: { fr: "Remerciement", en: "Thank you" }, desc: { fr: "Mention, certificat. Aucun coût.", en: "Mention, certificate. No cost." }, placeholder: { fr: "ex. Mention contributeurs", en: "e.g. Contributors mention" }, defaultCost: 0, suggestions: [{ l: "Mention sur le site", cost: 0 }, { l: "Certificat contributeur", cost: 0 }] },
};
var TIER_CAT_KEYS = Object.keys(TIER_CAT_META);

/* ── Tier Modal ── */
function TierModal({ tier, onSave, onClose, lang }) {
  var t = useT().crowdfunding || {};
  var isEdit = !!tier;
  var lk = lang === "en" ? "en" : "fr";

  var [selected, setSelected] = useState(isEdit ? (tier.category || "product") : "product");
  var [name, setName] = useState(isEdit ? (tier.name || "") : "");
  var [unitCost, setUnitCost] = useState(isEdit ? (tier.unitCost || 0) : TIER_CAT_META.product.defaultCost);
  var [quantity, setQuantity] = useState(isEdit ? (tier.quantity || 1) : 1);

  var meta = TIER_CAT_META[selected] || TIER_CAT_META.product;
  var Icon = meta.icon;

  function handleSelect(catKey) {
    setSelected(catKey);
    if (!isEdit) { setName(""); setUnitCost(TIER_CAT_META[catKey].defaultCost); setQuantity(1); }
  }

  function handleSubmit() {
    onSave({ name: name || meta.label[lk], unitCost: unitCost, quantity: quantity, category: selected });
    onClose();
  }

  var canSubmit = name.trim().length > 0;

  return (
    <Modal open onClose={onClose} size="lg" height={480} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {t.tier_modal_category || "Type de palier"}
            </div>
          </div>
          <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            {TIER_CAT_KEYS.map(function (catKey) {
              var m = TIER_CAT_META[catKey];
              var CIcon = m.icon;
              var isActive = selected === catKey;
              return (
                <button key={catKey} onClick={function () { handleSelect(catKey); }}
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
                {t.tier_field_name || "Nom de la contrepartie"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} autoFocus placeholder={meta.placeholder[lk]}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>
            {meta.suggestions && meta.suggestions.length > 0 ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.tier_suggestions || "Suggestions"}
                </label>
                <SelectDropdown
                  value={name}
                  onChange={function (v) {
                    if (!v) { setName(""); setUnitCost(meta.defaultCost); return; }
                    var found = null;
                    meta.suggestions.forEach(function (s) { if (s.l === v) found = s; });
                    if (found) { setName(found.l); setUnitCost(found.cost); }
                  }}
                  options={meta.suggestions.map(function (s) { return { value: s.l, label: s.l }; })}
                  placeholder={t.tier_suggestions || "Suggestions..."} clearable
                />
              </div>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.tier_unit_cost || "Coût unitaire"}</label>
                <CurrencyInput value={unitCost} onChange={setUnitCost} suffix="€" width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.tier_quantity || "Quantité prévue"}</label>
                <NumberField value={quantity} onChange={setQuantity} min={0} max={10000} step={1} width="100%" />
              </div>
            </div>
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.tier_total || "Charge totale"}</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(unitCost * quantity)}</span>
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

/* ── Donut chart ── */
function CrowdDonut({ data }) {
  var total = 0;
  var entries = [];
  Object.keys(data).forEach(function (k) { total += data[k]; entries.push({ key: k, value: data[k] }); });
  var size = 80, r = 30, cx = 40, cy = 40, sw = 10;
  var circ = 2 * Math.PI * r;
  if (total <= 0) return <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }} role="img" aria-hidden="true"><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={sw} opacity={0.6} /></svg>;
  var COLORS = { margin: "var(--color-success)", commission: "var(--color-warning)", tiers: "var(--brand)" };
  var segs = entries.reduce(function (acc, e) {
    var prev = acc.length > 0 ? acc[acc.length - 1].end : 0;
    var pctV = e.value / total;
    acc.push({ key: e.key, pct: pctV, start: prev, end: prev + pctV });
    return acc;
  }, []);
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }} role="img" aria-hidden="true">
      {segs.map(function (s) {
        return <circle key={s.key} cx={cx} cy={cy} r={r} fill="none" stroke={COLORS[s.key] || "#9CA3AF"} strokeWidth={sw} strokeDasharray={(s.pct * circ) + " " + (circ - s.pct * circ)} strokeDashoffset={-s.start * circ} transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray 0.3s" }} />;
      })}
    </svg>
  );
}

/* ── Main Page ── */
export default function CrowdfundingPage({ crowdfunding, setCrowdfunding, setTab }) {
  var tAll = useT();
  var t = tAll.crowdfunding || {};
  var { lang } = useLang();
  var { devMode } = useDevMode();
  var { dark } = useTheme();
  var lk = lang === "en" ? "en" : "fr";
  var devBadgeStyle = {
    marginLeft: 6, padding: "2px 6px", borderRadius: "var(--r-sm)",
    background: dark ? "var(--color-dev-banner-light)" : "var(--color-dev-banner-dark)",
    color: dark ? "var(--color-dev-banner-dark)" : "var(--color-dev-banner-light)",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
    lineHeight: "14px", verticalAlign: "middle",
  };

  var [justLaunched, setJustLaunched] = useState(false);
  useEffect(function () {
    if (!justLaunched) return;
    var id = setTimeout(function () { setJustLaunched(false); }, 2500);
    return function () { clearTimeout(id); };
  }, [justLaunched]);
  var [showTierCreate, setShowTierCreate] = useState(false);
  var [editingTier, setEditingTier] = useState(null);
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  var cfg = crowdfunding || { enabled: false, name: "", platform: "ulule", goal: 0, url: "", tiers: [] };
  var tiers = cfg.tiers || [];
  var platform = PLATFORM_META[cfg.platform] || PLATFORM_META.ulule;
  if (cfg.platform === "other" && cfg.customCommission !== undefined) platform = Object.assign({}, platform, { commission: cfg.customCommission, payment: 0 });

  function cfgSet(key, val) {
    setCrowdfunding(function (prev) { return Object.assign({}, prev || {}, { [key]: val }); });
  }

  /* Calculations */
  var tiersCost = 0;
  tiers.forEach(function (ti) { tiersCost += (ti.unitCost || 0) * (ti.quantity || 0); });
  var commissionPct = platform.commission + platform.payment;
  var commissionAmount = cfg.goal * commissionPct;
  var netMargin = cfg.goal - commissionAmount - tiersCost;

  /* Tier CRUD */
  function addTier(data) { cfgSet("tiers", tiers.concat([Object.assign({ id: Date.now() }, data)])); }
  function saveTier(idx, data) { var nc = tiers.slice(); nc[idx] = Object.assign({}, nc[idx], data); cfgSet("tiers", nc); }
  function removeTier(idx) { cfgSet("tiers", tiers.filter(function (_, j) { return j !== idx; })); }
  function cloneTier(idx) {
    var nc = tiers.slice();
    var clone = Object.assign({}, nc[idx], { id: Date.now(), name: (nc[idx].name || "") + (t.copy_suffix || " (copie)") });
    nc.splice(idx + 1, 0, clone);
    cfgSet("tiers", nc);
  }
  function requestDelete(idx) { if (skipDeleteConfirm) { removeTier(idx); } else { setPendingDelete(idx); } }

  function randomize() {
    cfgSet("enabled", true);
    cfgSet("name", "Campagne de lancement");
    cfgSet("platform", ["ulule", "kkbb", "kickstarter"][Math.floor(Math.random() * 3)]);
    cfgSet("goal", [5000, 10000, 15000, 20000, 25000][Math.floor(Math.random() * 5)]);
    cfgSet("tiers", [
      { id: Date.now(), name: "T-shirt édition limitée", category: "product", unitCost: 12, quantity: 20 + Math.floor(Math.random() * 60) },
      { id: Date.now() + 1, name: "Accès early bird", category: "early", unitCost: 0, quantity: 50 + Math.floor(Math.random() * 150) },
      { id: Date.now() + 2, name: "Pack fondateur", category: "product", unitCost: 35, quantity: 5 + Math.floor(Math.random() * 25) },
      { id: Date.now() + 3, name: "Soirée de lancement", category: "experience", unitCost: 25, quantity: 10 + Math.floor(Math.random() * 20) },
    ]);
  }

  /* Columns */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: t.tier_name || "Contrepartie",
        enableSorting: true,
        meta: { align: "left", minWidth: 180, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{tiers.length} {t.footer_tiers || "paliers"}</span>
            </>
          );
        },
      },
      {
        id: "category",
        header: t.tier_category || "Type",
        enableSorting: true,
        meta: { align: "left" },
        cell: function (info) {
          var cat = info.row.original.category || "product";
          var m = TIER_CAT_META[cat];
          return m ? <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge> : cat;
        },
      },
      {
        id: "unitCost", accessorKey: "unitCost",
        header: t.tier_unit_cost || "Coût unitaire",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) { return info.getValue() > 0 ? eur(info.getValue()) : (t.tier_no_cost || "Gratuit"); },
      },
      {
        id: "quantity", accessorKey: "quantity",
        header: t.tier_quantity || "Quantité", enableSorting: true, meta: { align: "right" },
        cell: function (info) { return String(info.getValue() || 0); },
      },
      {
        id: "total",
        accessorFn: function (row) { return (row.unitCost || 0) * (row.quantity || 0); },
        header: t.tier_total || "Total", enableSorting: true, meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(tiersCost)}</span>; },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = info.row.index;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { setEditingTier({ idx: idx, tier: tiers[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Dupliquer"} onClick={function () { cloneTier(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Supprimer"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [tiers, tiersCost, lk, t]);

  var toolbarNode = (
    <>
      <div />
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <>
            <Button color="tertiary" size="lg" onClick={function () { cfgSet("tiers", []); }} iconLeading={<Eraser size={14} weight="bold" />}>
              {t.clear || "Vider"}<span style={devBadgeStyle}>DEV</span>
            </Button>
            <Button color="tertiary" size="lg" onClick={randomize} iconLeading={<Shuffle size={14} weight="bold" />}>
              {t.randomize || "Randomiser"}<span style={devBadgeStyle}>DEV</span>
            </Button>
          </>
        ) : null}
        <Button color="primary" size="lg" onClick={function () { setShowTierCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add_tier || "Ajouter un palier"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Handshake size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.no_tiers || "Aucun palier"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {t.no_tiers_hint || "Ajoutez les contreparties de votre campagne pour estimer les charges associées."}
      </div>
      <Button color="primary" size="md" onClick={function () { setShowTierCreate(true); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {t.add_tier || "Ajouter un palier"}
      </Button>
    </div>
  );

  /* Wizard state */
  var [wizardStep, setWizardStep] = useState(0);
  var [wizardPlatform, setWizardPlatform] = useState("ulule");
  var [wizardGoal, setWizardGoal] = useState(10000);
  var [wizardName, setWizardName] = useState("");
  var [wizardCustomRate, setWizardCustomRate] = useState(0.05);

  /* Wizard keyboard shortcuts */
  var wizardFinishRef = useRef(null);
  useEffect(function () {
    if (cfg.enabled) return;
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setWizardStep(function (s) { return Math.min(s + 1, 2); });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        setWizardStep(function (s) {
          if (s >= 2 && wizardFinishRef.current) { wizardFinishRef.current(); return s; }
          return Math.min(s + 1, 2);
        });
      }
      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        setWizardStep(function (s) { return Math.max(s - 1, 0); });
      }
    }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, [cfg.enabled]);

  /* Non-enabled state — wizard */
  if (!cfg.enabled) {
    var WIZARD_STEPS = [
      { key: "intro" },
      { key: "platform" },
      { key: "goal" },
    ];
    var totalSteps = WIZARD_STEPS.length;
    var wizardPlatformMeta = PLATFORM_META[wizardPlatform] || PLATFORM_META.ulule;
    if (wizardPlatform === "other") wizardPlatformMeta = Object.assign({}, wizardPlatformMeta, { commission: wizardCustomRate, payment: 0 });

    wizardFinishRef.current = function () { wizardFinish(); };
    function wizardFinish() {
      cfgSet("enabled", true);
      cfgSet("platform", wizardPlatform);
      cfgSet("goal", wizardGoal);
      cfgSet("name", wizardName);
      cfgSet("tiers", []);
      if (wizardPlatform === "other") cfgSet("customCommission", wizardCustomRate);
      setJustLaunched(true);
    }

    return (
      <PageLayout title={t.title || "Crowdfunding"} subtitle={t.subtitle || "Gérez votre campagne de financement participatif."}>
        <div style={{ maxWidth: 600, margin: "0 auto", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-6)" }}>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 4, marginBottom: "var(--sp-6)" }}>
            {WIZARD_STEPS.map(function (_, i) {
              return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= wizardStep ? "var(--brand)" : "var(--bg-hover)", transition: "background 0.2s" }} />;
            })}
          </div>

          {/* Step 1: Intro */}
          {wizardStep === 0 ? (
            <div style={{ textAlign: "center" }}>
              <Handshake size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
                {t.wizard_intro_title || "Le crowdfunding, comment ça marche ?"}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)", textAlign: "left" }}>
                {t.wizard_intro_p1 || "Le financement participatif vous permet de lever des fonds auprès du public via une plateforme en ligne. En échange, vous offrez des contreparties à vos contributeurs."}{" "}
                <FinanceLink term="break_even" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-5)", textAlign: "left" }}>
                {[
                  { icon: Handshake, title: t.wizard_step1_card1 || "Vous fixez un objectif", desc: t.wizard_step1_desc1 || "Le montant minimum à atteindre pour que la campagne réussisse." },
                  { icon: Package, title: t.wizard_step1_card2 || "Vous créez des paliers", desc: t.wizard_step1_desc2 || "Chaque contributeur choisit une contrepartie selon son budget." },
                  { icon: Heart, title: t.wizard_step1_card3 || "Vous livrez les récompenses", desc: t.wizard_step1_desc3 || "Production, envoi et suivi des contreparties promises." },
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
          ) : null}

          {/* Step 2: Platform */}
          {wizardStep === 1 ? (
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
                {t.wizard_platform_title || "Quelle plateforme utiliser ?"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
                {t.wizard_platform_desc || "Chaque plateforme prélève une commission sur les fonds levés."}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {PLATFORM_KEYS.map(function (pk) {
                  var p = PLATFORM_META[pk];
                  var isActive = wizardPlatform === pk;
                  var totalFee = p.commission + p.payment;
                  return (
                    <button key={pk} type="button" onClick={function () { setWizardPlatform(pk); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "var(--sp-3) var(--sp-4)",
                        border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                        borderRadius: "var(--r-lg)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                        cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--brand)" : "var(--text-primary)" }}>{p.label}</div>
                        {p.url ? <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{p.url}</div> : null}
                      </div>
                      {pk !== "other" ? (
                        <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "var(--brand)" : "var(--text-secondary)" }}>
                          {totalFee > 0 ? pct(totalFee) : (t.wizard_free || "Gratuit")}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {/* Custom rate input */}
              {wizardPlatform === "other" ? (
                <div style={{ marginTop: "var(--sp-3)", display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1 }}>{t.wizard_custom_rate || "Commission de la plateforme"}</span>
                  <NumberField value={wizardCustomRate} onChange={setWizardCustomRate} min={0} max={0.30} step={0.01} width="80px" pct />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Step 3: Goal */}
          {wizardStep === 2 ? (
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
                {t.wizard_goal_title || "Quel est votre objectif ?"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-5)", textAlign: "center" }}>
                {t.wizard_goal_desc || "Le montant minimum que vous souhaitez lever. Vous pourrez le modifier ensuite."}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.wizard_goal_name || "Nom de la campagne"}</label>
                  <input value={wizardName} onChange={function (e) { setWizardName(e.target.value); }} placeholder={t.field_name_placeholder || "ex. Lancement MonProduit"}
                    style={{ width: "100%", height: 44, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 15, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.wizard_goal_amount || "Objectif de la campagne"}</label>
                  <CurrencyInput value={wizardGoal} onChange={setWizardGoal} suffix="€" width="100%" height={44} />
                </div>
                {wizardGoal > 0 ? (
                  <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-muted)" }}>{t.wizard_commission || "Commission"} {wizardPlatformMeta.label}</span>
                      <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>- {eur(wizardGoal * (wizardPlatformMeta.commission + wizardPlatformMeta.payment))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.wizard_net || "Vous recevez"}</span>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(wizardGoal * (1 - wizardPlatformMeta.commission - wizardPlatformMeta.payment))}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-6)" }}>
            {wizardStep > 0 ? (
              <Button color="tertiary" size="lg" onClick={function () { setWizardStep(function (s) { return s - 1; }); }}>
                {t.wizard_back || "Retour"}
              </Button>
            ) : <div />}
            {wizardStep < totalSteps - 1 ? (
              <Button color="primary" size="lg" onClick={function () { setWizardStep(function (s) { return s + 1; }); }}>
                {t.wizard_next || "Suivant"}
              </Button>
            ) : (
              <Button color="primary" size="lg" onClick={wizardFinish} isDisabled={wizardGoal <= 0} iconLeading={<ToggleRight size={16} />}>
                {t.wizard_launch || "Lancer la campagne"}
              </Button>
            )}
          </div>

          {/* Shortcut hint */}
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
            {[
              { keys: ["←"], label: t.wizard_key_back || "Précédent" },
              { keys: ["→"], label: t.wizard_key_next || "Suivant" },
              { keys: ["Enter"], label: t.wizard_key_confirm || "Confirmer" },
            ].map(function (sh, si) {
              return (
                <div key={si} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {sh.keys.map(function (k) {
                    return (
                      <kbd key={k} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: 22, height: 20, padding: "0 5px",
                        fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
                        color: "var(--text-secondary)", background: "var(--bg-page)",
                        border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
                        boxShadow: "0 1px 0 var(--border-strong)", lineHeight: 1,
                      }}>{k}</kbd>
                    );
                  })}
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{sh.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </PageLayout>
    );
  }

  /* Launch animation */
  if (justLaunched) {
    return (
      <PageLayout title={t.title || "Crowdfunding"} subtitle={t.subtitle || "Gérez votre campagne de financement participatif."}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, animation: "crowdLaunchIn 0.6s ease" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--color-success-bg)", border: "2px solid var(--color-success-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--sp-4)", animation: "crowdPulse 1s ease infinite" }}>
            <Handshake size={36} weight="fill" color="var(--color-success)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", animation: "crowdFadeUp 0.6s ease 0.2s both" }}>
            {t.launch_title || "Campagne créée !"}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", animation: "crowdFadeUp 0.6s ease 0.4s both" }}>
            {t.launch_desc || "Ajoutez maintenant vos paliers de contrepartie."}
          </div>
        </div>
        <style>{"\
          @keyframes crowdLaunchIn { from { opacity: 0; } to { opacity: 1; } }\
          @keyframes crowdPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }\
          @keyframes crowdFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }\
        "}</style>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t.title || "Crowdfunding"} subtitle={t.subtitle || "Gérez votre campagne de financement participatif."}>
      {showTierCreate ? <TierModal onSave={addTier} onClose={function () { setShowTierCreate(false); }} lang={lang} /> : null}
      {editingTier ? <TierModal tier={editingTier.tier} onSave={function (data) { saveTier(editingTier.idx, data); }} onClose={function () { setEditingTier(null); }} lang={lang} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeTier(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{ confirm_title: t.confirm_delete || "Supprimer ce palier ?", confirm_body: t.confirm_delete_body || "Ce palier sera retiré.", confirm_skip: t.confirm_skip || "Ne plus demander", cancel: t.cancel || "Annuler", delete: t.delete || "Supprimer" }}
      /> : null}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_goal || "Objectif"} value={cfg.goal > 0 ? eurShort(cfg.goal) : "—"} fullValue={cfg.goal > 0 ? eur(cfg.goal) : undefined} />
        <KpiCard label={t.kpi_commission || "Commission plateforme"} value={commissionAmount > 0 ? eurShort(commissionAmount) : "—"} fullValue={commissionAmount > 0 ? eur(commissionAmount) + " (" + pct(commissionPct) + ")" : undefined} />
        <KpiCard label={t.kpi_tiers_cost || "Coût contreparties"} value={tiersCost > 0 ? eurShort(tiersCost) : "—"} fullValue={tiersCost > 0 ? eur(tiersCost) : undefined} />
        <KpiCard label={t.kpi_margin || "Marge nette"} value={cfg.goal > 0 ? eurShort(netMargin) : "—"} fullValue={cfg.goal > 0 ? eur(netMargin) : undefined} />
      </div>

      {/* Insights: Config + Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Campaign config */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.config_title || "Configuration"}
            </div>
            <Button color="tertiary-destructive" size="sm" onClick={function () { cfgSet("enabled", false); cfgSet("tiers", []); cfgSet("goal", 0); }} iconLeading={<Power size={14} weight="bold" />}>
              {t.disable || "Désactiver"}
            </Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_name || "Nom de la campagne"}</label>
              <input value={cfg.name || ""} onChange={function (e) { cfgSet("name", e.target.value); }} placeholder={t.field_name_placeholder || "ex. Lancement MonProduit"}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_platform || "Plateforme"}</label>
                <SelectDropdown value={cfg.platform || "ulule"} onChange={function (v) { cfgSet("platform", v); }}
                  options={PLATFORM_KEYS.map(function (k) { var p = PLATFORM_META[k]; return { value: k, label: p.label + (p.commission > 0 ? " (" + pct(p.commission + p.payment) + ")" : " (gratuit)") }; })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.field_goal || "Objectif"}</label>
                <CurrencyInput value={cfg.goal || 0} onChange={function (v) { cfgSet("goal", v); }} suffix="€" width="100%" />
              </div>
            </div>
          </div>
        </div>

        {/* Donut: répartition */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.distribution_title || "Répartition de l'objectif"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <CrowdDonut data={cfg.goal > 0 ? { margin: Math.max(0, netMargin), commission: commissionAmount, tiers: tiersCost } : {}} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { key: "margin", label: t.donut_margin || "Marge nette", color: "var(--color-success)", value: netMargin },
                { key: "commission", label: t.donut_commission || "Commission plateforme", color: "var(--color-warning)", value: commissionAmount },
                { key: "tiers", label: t.donut_tiers || "Contreparties", color: "var(--brand)", value: tiersCost },
              ].map(function (row) {
                var rowPct = cfg.goal > 0 ? Math.round(row.value / cfg.goal * 100) : 0;
                return (
                  <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{row.label}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{rowPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tiers DataTable */}
      <DataTable
        data={tiers}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={160}
        pageSize={20}
        getRowId={function (row) { return String(row.id); }}
      />
    </PageLayout>
  );
}
